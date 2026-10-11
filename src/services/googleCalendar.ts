import { ScheduledEvent } from '../types.ts';

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

export const googleCalendarApi = {
  /**
   * List events from user's primary Google Calendar
   */
  async listEvents(
    accessToken: string,
    options?: { timeMin?: string; timeMax?: string; maxResults?: number }
  ): Promise<GoogleCalendarEventItem[]> {
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
      throw new Error(err?.error?.message || `Failed to fetch events: ${res.statusText}`);
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
      throw new Error(err?.error?.message || `Failed to create calendar event: ${res.statusText}`);
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
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to update calendar event: ${res.statusText}`);
    }

    return await res.json();
  },

  /**
   * Delete an event from Google Calendar
   */
  async deleteEvent(accessToken: string, calendarEventId: string): Promise<boolean> {
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(calendarEventId)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!res.ok && res.status !== 404 && res.status !== 410) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to delete calendar event: ${res.statusText}`);
    }

    return true;
  },

  /**
   * Sync local arrangements to Google Calendar
   */
  async syncArrangements(
    accessToken: string,
    events: ScheduledEvent[]
  ): Promise<{ syncedCount: number; updatedEvents: ScheduledEvent[] }> {
    let syncedCount = 0;
    const updatedEvents = [...events];

    for (let i = 0; i < updatedEvents.length; i++) {
      const ev = updatedEvents[i];
      try {
        if (ev.googleCalendarEventId) {
          // Update existing
          await this.updateEvent(accessToken, ev.googleCalendarEventId, ev);
          updatedEvents[i] = {
            ...ev,
            syncStatus: 'synced',
            lastSyncedAt: Date.now(),
          };
          syncedCount++;
        } else {
          // Create new
          const created = await this.createEvent(accessToken, ev);
          if (created.id) {
            updatedEvents[i] = {
              ...ev,
              googleCalendarEventId: created.id,
              syncStatus: 'synced',
              lastSyncedAt: Date.now(),
            };
            syncedCount++;
          }
        }
      } catch (e) {
        console.warn(`Error syncing event ${ev.title} to Google Calendar:`, e);
      }
    }

    return { syncedCount, updatedEvents };
  },
};

function formatCalendarPayload(event: ScheduledEvent) {
  const startIso = new Date(event.startTimeMillis).toISOString();
  const endIso = new Date(event.endTimeMillis).toISOString();

  const recurrenceRules: string[] = [];
  if (event.repeatOption === 'DAILY') {
    recurrenceRules.push('RRULE:FREQ=DAILY');
  } else if (event.repeatOption === 'WEEKLY') {
    recurrenceRules.push('RRULE:FREQ=WEEKLY');
  } else if (event.repeatOption === 'MONTHLY') {
    recurrenceRules.push('RRULE:FREQ=MONTHLY');
  } else if (event.repeatOption === 'YEARLY') {
    recurrenceRules.push('RRULE:FREQ=YEARLY');
  }

  const reminders = {
    useDefault: event.reminderMinutesBefore <= 0,
    overrides:
      event.reminderMinutesBefore > 0
        ? [{ method: 'popup', minutes: event.reminderMinutesBefore }]
        : [],
  };

  const description = [
    event.description || '',
    '',
    '— Scheduled via Ministry Tracker App',
  ]
    .filter(Boolean)
    .join('\n');

  return {
    summary: event.title || 'Ministry Arrangement',
    description,
    location: event.location || '',
    start: {
      dateTime: startIso,
    },
    end: {
      dateTime: endIso,
    },
    recurrence: recurrenceRules.length > 0 ? recurrenceRules : undefined,
    reminders,
  };
}
