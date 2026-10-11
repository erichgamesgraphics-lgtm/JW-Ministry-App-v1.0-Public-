import { ScheduledEvent, RepeatOptionType } from '../types.ts';

export interface GoogleCalendarItem {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  timeZone?: string;
}

export interface GoogleCalendarEventTime {
  dateTime?: string;
  date?: string;
  timeZone?: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  start: GoogleCalendarEventTime;
  end: GoogleCalendarEventTime;
  status?: string;
  recurrence?: string[];
  reminders?: {
    useDefault?: boolean;
    overrides?: Array<{ method: string; minutes: number }>;
  };
}

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

/**
 * Convert app's repeat option to RFC 5545 recurrence rule for Google Calendar
 */
export const getRecurrenceRule = (repeat: RepeatOptionType): string[] | undefined => {
  switch (repeat) {
    case 'DAILY':
      return ['RRULE:FREQ=DAILY'];
    case 'WEEKLY':
      return ['RRULE:FREQ=WEEKLY'];
    case 'MONTHLY':
      return ['RRULE:FREQ=MONTHLY'];
    case 'YEARLY':
      return ['RRULE:FREQ=YEARLY'];
    default:
      return undefined;
  }
};

/**
 * Format a timestamp to ISO string with timezone or UTC
 */
const formatDateTimeISO = (millis: number): string => {
  const d = new Date(millis);
  if (isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
};

/**
 * Construct Google Calendar Event payload from Ministry ScheduledEvent
 */
export const buildGoogleEventPayload = (event: Partial<ScheduledEvent>) => {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const startMillis = event.startTimeMillis || event.dateMillis || Date.now();
  let endMillis = event.endTimeMillis || (startMillis + 2 * 60 * 60 * 1000);
  if (endMillis <= startMillis) {
    endMillis = startMillis + 2 * 60 * 60 * 1000;
  }

  const payload: any = {
    summary: event.title || 'Ministry Arrangement',
    description: (event.description || '').trim()
      ? `${event.description}\n\n[Created via Ministry Tracker]`
      : 'Ministry Arrangement [Created via Ministry Tracker]',
    location: (event.location || '').trim() || undefined,
    start: {
      dateTime: formatDateTimeISO(startMillis),
      timeZone,
    },
    end: {
      dateTime: formatDateTimeISO(endMillis),
      timeZone,
    },
  };

  // Recurrence
  const rrule = event.repeatOption ? getRecurrenceRule(event.repeatOption) : undefined;
  if (rrule && rrule.length > 0) {
    payload.recurrence = rrule;
  }

  // Reminders
  const reminderMinutes = typeof event.reminderMinutesBefore === 'number'
    ? event.reminderMinutesBefore
    : 15;

  if (reminderMinutes >= 0) {
    payload.reminders = {
      useDefault: false,
      overrides: [{ method: 'popup', minutes: reminderMinutes }],
    };
  } else {
    payload.reminders = {
      useDefault: false,
      overrides: [],
    };
  }

  return payload;
};

/**
 * List user's Google Calendars
 */
export const listGoogleCalendars = async (token: string): Promise<GoogleCalendarItem[]> => {
  const res = await fetch(`${CALENDAR_API_BASE}/users/me/calendarList`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google Calendar API error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return (data.items || []).map((c: any) => ({
    id: c.id,
    summary: c.summary,
    description: c.description,
    primary: Boolean(c.primary),
    timeZone: c.timeZone,
  }));
};

/**
 * List events from primary calendar in a date range
 */
export const listGoogleCalendarEvents = async (
  token: string,
  timeMin?: Date,
  timeMax?: Date,
  calendarId: string = 'primary'
): Promise<GoogleCalendarEvent[]> => {
  const params = new URLSearchParams({
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
  });

  if (timeMin) {
    params.set('timeMin', timeMin.toISOString());
  }
  if (timeMax) {
    params.set('timeMax', timeMax.toISOString());
  }

  const url = `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to fetch Google Calendar events (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.items || [];
};

/**
 * Create a new event on Google Calendar
 */
export const createGoogleCalendarEvent = async (
  token: string,
  event: Partial<ScheduledEvent>,
  calendarId: string = 'primary'
): Promise<GoogleCalendarEvent> => {
  const payload = buildGoogleEventPayload(event);
  const url = `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create Google Calendar event (${res.status}): ${err}`);
  }

  return await res.json();
};

/**
 * Update an existing event on Google Calendar
 */
export const updateGoogleCalendarEvent = async (
  token: string,
  calendarEventId: string,
  event: Partial<ScheduledEvent>,
  calendarId: string = 'primary'
): Promise<GoogleCalendarEvent> => {
  const payload = buildGoogleEventPayload(event);
  const url = `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(calendarEventId)}`;

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    // If not found (404), maybe recreate
    if (res.status === 404) {
      return await createGoogleCalendarEvent(token, event, calendarId);
    }
    const err = await res.text();
    throw new Error(`Failed to update Google Calendar event (${res.status}): ${err}`);
  }

  return await res.json();
};

/**
 * Delete an event from Google Calendar
 */
export const deleteGoogleCalendarEvent = async (
  token: string,
  calendarEventId: string,
  calendarId: string = 'primary'
): Promise<boolean> => {
  const url = `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(calendarEventId)}`;

  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok && res.status !== 404 && res.status !== 410) {
    const err = await res.text();
    throw new Error(`Failed to delete Google Calendar event (${res.status}): ${err}`);
  }

  return true;
};
