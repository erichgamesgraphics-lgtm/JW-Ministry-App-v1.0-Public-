import { ScheduledEvent } from '../types.ts';
import { setAccessToken } from './firebase.ts';

export interface GoogleCalendarEventItem {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  recurrence?: string[];
  status?: string;
}

export class CalendarApiError extends Error {
  code: string;
  status: number;
  constructor(message: string, code = 'CALENDAR_API_ERROR', status = 500) {
    super(message);
    this.name = 'CalendarApiError';
    this.code = code;
    this.status = status;
  }
}

function parseCalendarError(status: number, errData: any): CalendarApiError {
  const msg = errData?.error?.message || '';
  if (status === 401) {
    setAccessToken(null);
    return new CalendarApiError('Google Calendar authorization expired. Please reconnect.', 'AUTH_EXPIRED', 401);
  }
  if (status === 403) {
    if (msg.includes('Google Calendar API has not been used') || msg.includes('it is disabled')) {
      return new CalendarApiError(
        'Google Calendar API is not enabled on this Google Cloud project. Please enable it in Google Cloud Console: https://console.cloud.google.com/apis/library/calendar-json.googleapis.com',
        'API_DISABLED_403',
        403
      );
    }
    return new CalendarApiError(
      msg || 'Access denied (HTTP 403 Forbidden). Please grant permissions to manage Google Calendar events.',
      'PERMISSION_DENIED_403',
      403
    );
  }
  return new CalendarApiError(msg || `Request failed with status ${status}`, 'REQUEST_FAILED', status);
}

export const googleCalendarApi = {
  /**
   * List events from user's primary Google Calendar
   */
  async listEvents(
    accessToken: string,
    options?: { timeMin?: string; timeMax?: string; maxResults?: number }
  ): Promise<GoogleCalendarEventItem[]> {
    if (!accessToken) {
      throw new CalendarApiError('Google Calendar access token is required', 'NO_TOKEN', 401);
    }

    const params = new URLSearchParams({
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: String(options?.maxResults || 100),
    });

    if (options?.timeMin) params.set('timeMin', options.timeMin);
    if (options?.timeMax) params.set('timeMax', options.timeMax);

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw parseCalendarError(res.status, err);
    }

    const data = await res.json();
    return data.items || [];
  },

  /**
   * Create a new event in Google Calendar from a ScheduledEvent
   */
  async createEvent(
    accessToken: string,
    event: ScheduledEvent
  ): Promise<GoogleCalendarEventItem> {
    if (!accessToken) {
      throw new CalendarApiError('Google Calendar access token is required', 'NO_TOKEN', 401);
    }

    const payload = formatCalendarPayload(event);

    const res = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw parseCalendarError(res.status, err);
    }

    return await res.json();
  },

  /**
   * Update an existing event in Google Calendar
   */
  async updateEvent(
    accessToken: string,
    calendarEventId: string,
    event: ScheduledEvent
  ): Promise<GoogleCalendarEventItem> {
    if (!accessToken) {
      throw new CalendarApiError('Google Calendar access token is required', 'NO_TOKEN', 401);
    }

    const payload = formatCalendarPayload(event);

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(calendarEventId)}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      // If event was deleted in Google Calendar directly (404/410), fall back to creating a new one
      if (res.status === 404 || res.status === 410) {
        return this.createEvent(accessToken, event);
      }
      const err = await res.json().catch(() => ({}));
      throw parseCalendarError(res.status, err);
    }

    return await res.json();
  },

  /**
   * Delete an event from Google Calendar
   */
  async deleteEvent(accessToken: string, calendarEventId: string): Promise<boolean> {
    if (!accessToken || !calendarEventId) return false;

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(calendarEventId)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (res.status === 404 || res.status === 410 || res.ok) {
      return true;
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw parseCalendarError(res.status, err);
    }

    return true;
  },

  /**
   * Synchronize all local scheduled ministry arrangements to Google Calendar
   */
  async syncArrangements(
    accessToken: string,
    localEvents: ScheduledEvent[]
  ): Promise<{ syncedCount: number; updatedEvents: ScheduledEvent[] }> {
    if (!accessToken) {
      throw new CalendarApiError('No access token available for synchronization', 'NO_TOKEN', 401);
    }

    let syncedCount = 0;
    const updatedEvents = [...localEvents];

    for (let i = 0; i < updatedEvents.length; i++) {
      const ev = updatedEvents[i];
      try {
        if (ev.googleCalendarEventId) {
          const updated = await this.updateEvent(accessToken, ev.googleCalendarEventId, ev);
          if (updated && updated.id) {
            updatedEvents[i] = { ...ev, googleCalendarEventId: updated.id };
            syncedCount++;
          }
        } else {
          const created = await this.createEvent(accessToken, ev);
          if (created && created.id) {
            updatedEvents[i] = { ...ev, googleCalendarEventId: created.id };
            syncedCount++;
          }
        }
      } catch (e: any) {
        console.warn(`Sync failed for event "${ev.title || ev.id}":`, e?.message || e);
        // If 401 or 403, stop trying subsequent events and bubble error
        if (e?.status === 401 || e?.status === 403) {
          throw e;
        }
      }
    }

    return { syncedCount, updatedEvents };
  },
};

/**
 * Format a ScheduledEvent into Google Calendar API resource payload
 */
function formatCalendarPayload(event: ScheduledEvent) {
  const fallbackDate = new Date();
  const startTime = event.startTimeMillis
    ? new Date(event.startTimeMillis)
    : event.dateMillis
    ? new Date(event.dateMillis)
    : fallbackDate;

  // Validate start date
  const validStartTime = isNaN(startTime.getTime()) ? fallbackDate : startTime;

  let endTime: Date;
  if (event.endTimeMillis) {
    const candidate = new Date(event.endTimeMillis);
    endTime = !isNaN(candidate.getTime()) && candidate.getTime() > validStartTime.getTime()
      ? candidate
      : new Date(validStartTime.getTime() + 60 * 60 * 1000); // 1 hour duration
  } else {
    endTime = new Date(validStartTime.getTime() + 60 * 60 * 1000);
  }

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  const typeLabels: Record<string, string> = {
    PUBLIC_WITNESSING: 'Public Witnessing (Cart)',
    DOOR_TO_DOOR: 'Door-to-Door Ministry',
    INFORMAL_WITNESSING: 'Informal Witnessing',
    RETURN_VISITS: 'Return Visits',
    BIBLE_STUDY: 'Bible Study',
    MEMORIAL: 'Memorial Campaign',
    SPECIAL_CAMPAIGN: 'Special Preaching Campaign',
    CONGREGATION_MEETING: 'Congregation Meeting',
    CIRCUIT_ASSEMBLY: 'Circuit Assembly',
    REGIONAL_CONVENTION: 'Regional Convention',
    OTHER: 'Ministry Activity',
  };

  const titlePrefix = event.eventType ? `[${typeLabels[event.eventType] || event.eventType}] ` : '';
  const summary = `${titlePrefix}${event.title || 'Field Ministry Arrangement'}`.trim();

  const descriptionParts: string[] = [];
  if (event.description) descriptionParts.push(event.description);
  if (event.eventType) descriptionParts.push(`Type: ${typeLabels[event.eventType] || event.eventType}`);
  if (event.partner) descriptionParts.push(`Service Partner: ${event.partner}`);
  if (event.meetingPoint) descriptionParts.push(`Meeting Point: ${event.meetingPoint}`);
  if (event.territory) descriptionParts.push(`Territory / Group: ${event.territory}`);
  descriptionParts.push('— Scheduled with JW Ministry Tracker');

  return {
    summary,
    description: descriptionParts.join('\n'),
    location: event.meetingPoint || event.location || undefined,
    start: {
      dateTime: validStartTime.toISOString(),
      timeZone,
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone,
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 30 },
        { method: 'popup', minutes: 120 },
      ],
    },
  };
}
