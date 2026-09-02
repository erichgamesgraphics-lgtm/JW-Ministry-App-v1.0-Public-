import { ScheduledEvent, ExpandedCalendarEvent } from '../types.ts';

/**
 * Format a Date into 'YYYY-MM-DD' key based on local timezone
 */
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parse a 'YYYY-MM-DD' key into a local Date object at midday to avoid DST edges
 */
export function parseDateKey(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

/**
 * Normalizes date to midnight (00:00:00.000) local time
 */
export function getMidnight(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

/**
 * Checks if a scheduled event occurs on a specific target date (in local time)
 */
export function doesEventOccurOnDate(event: ScheduledEvent, targetDate: Date): boolean {
  const baseDate = new Date(event.dateMillis);
  const baseMidnight = getMidnight(baseDate);
  const targetMidnight = getMidnight(targetDate);

  // An event cannot occur before its base creation/start date
  if (targetMidnight.getTime() < baseMidnight.getTime()) {
    return false;
  }

  // Check optional recurrence end date
  if (event.recurrenceEndDateMillis) {
    const endMidnight = getMidnight(new Date(event.recurrenceEndDateMillis));
    if (targetMidnight.getTime() > endMidnight.getTime()) {
      return false;
    }
  }

  // Check excluded/deleted occurrence dates
  const targetDateKey = formatDateKey(targetDate);
  if (event.excludedDates && event.excludedDates.includes(targetDateKey)) {
    return false;
  }

  switch (event.repeatOption) {
    case 'NONE': {
      return targetMidnight.getTime() === baseMidnight.getTime();
    }

    case 'DAILY': {
      // Every day on or after start date
      return true;
    }

    case 'WEEKLY': {
      // Occurs on the same weekday every week
      if (targetMidnight.getDay() !== baseMidnight.getDay()) {
        return false;
      }
      const diffMs = targetMidnight.getTime() - baseMidnight.getTime();
      const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
      return diffDays >= 0 && diffDays % 7 === 0;
    }

    case 'MONTHLY': {
      // Occurs on the same day of the month (or closest month-end day)
      const baseDay = baseDate.getDate();
      const targetYear = targetDate.getFullYear();
      const targetMonth = targetDate.getMonth();
      const maxDaysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
      const expectedDay = Math.min(baseDay, maxDaysInTargetMonth);
      return targetDate.getDate() === expectedDay;
    }

    case 'YEARLY': {
      // Occurs on the same month and day every year
      if (targetDate.getMonth() !== baseDate.getMonth()) {
        return false;
      }
      const baseDay = baseDate.getDate();
      const targetYear = targetDate.getFullYear();
      const targetMonth = targetDate.getMonth();
      const maxDaysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
      const expectedDay = Math.min(baseDay, maxDaysInTargetMonth);
      return targetDate.getDate() === expectedDay;
    }

    default:
      return targetMidnight.getTime() === baseMidnight.getTime();
  }
}

/**
 * Expands a single scheduled event into an ExpandedCalendarEvent for a specific target date
 */
export function getExpandedEventForDate(
  event: ScheduledEvent,
  targetDate: Date
): ExpandedCalendarEvent | null {
  if (!doesEventOccurOnDate(event, targetDate)) {
    return null;
  }

  const origStart = new Date(event.startTimeMillis);
  const origEnd = new Date(event.endTimeMillis);
  const duration = Math.max(0, origEnd.getTime() - origStart.getTime());

  const y = targetDate.getFullYear();
  const m = targetDate.getMonth();
  const d = targetDate.getDate();

  const occurrenceStartTimeMillis = new Date(
    y,
    m,
    d,
    origStart.getHours(),
    origStart.getMinutes(),
    origStart.getSeconds(),
    0
  ).getTime();

  const occurrenceEndTimeMillis = occurrenceStartTimeMillis + duration;
  const occurrenceDateMillis = new Date(y, m, d, 12, 0, 0, 0).getTime();
  const occurrenceDateStr = formatDateKey(targetDate);
  const isRecurringInstance = event.repeatOption !== 'NONE';

  const isCompletedForOccurrence = isRecurringInstance
    ? !!(event.completedDates && event.completedDates.includes(occurrenceDateStr))
    : !!event.isCompleted;

  const instanceId = `${event.id}_${occurrenceDateStr}`;

  return {
    ...event,
    occurrenceDateStr,
    occurrenceDateKey: occurrenceDateStr,
    occurrenceDateMillis,
    occurrenceStartTimeMillis,
    occurrenceEndTimeMillis,
    isRecurringInstance,
    isOccurrence: isRecurringInstance,
    isCompletedForOccurrence,
    instanceId,
  };
}

/**
 * Returns all expanded occurrences of events occurring on a specific date, sorted by start time
 */
export function getOccurrencesForDate(
  events: ScheduledEvent[],
  targetDate: Date
): ExpandedCalendarEvent[] {
  const targetDateKey = formatDateKey(targetDate);
  const results: ExpandedCalendarEvent[] = [];

  // Track parent event IDs of any detached one-off instances for this date
  const detachedParentIds = new Set<number>();
  for (const ev of events) {
    if (ev.parentEventId && ev.originalOccurrenceDate === targetDateKey) {
      detachedParentIds.add(ev.parentEventId);
    }
  }

  for (const ev of events) {
    // If this is a recurring series whose occurrence for this date was detached as a separate event, skip the series occurrence
    if (detachedParentIds.has(ev.id)) {
      continue;
    }

    const expanded = getExpandedEventForDate(ev, targetDate);
    if (expanded) {
      results.push(expanded);
    }
  }

  // Sort by start time ascending
  return results.sort((a, b) => a.occurrenceStartTimeMillis - b.occurrenceStartTimeMillis);
}

/**
 * Returns a Map of day number -> occurrences for an entire month
 */
export function getOccurrencesForMonth(
  events: ScheduledEvent[],
  year: number,
  monthIndex: number
): Map<number, ExpandedCalendarEvent[]> {
  const monthMap = new Map<number, ExpandedCalendarEvent[]>();
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();

  for (let day = 1; day <= lastDay; day++) {
    const targetDate = new Date(year, monthIndex, day, 12, 0, 0, 0);
    const dayOccurrences = getOccurrencesForDate(events, targetDate);
    monthMap.set(day, dayOccurrences);
  }

  return monthMap;
}

/**
 * Calculates upcoming occurrences for all events within a future window (e.g., 60 days)
 */
export function getUpcomingOccurrences(
  events: ScheduledEvent[],
  fromDate: Date = new Date(),
  daysAhead: number = 60,
  maxTotal: number = 100
): ExpandedCalendarEvent[] {
  const occurrences: ExpandedCalendarEvent[] = [];
  const start = getMidnight(fromDate);

  for (let i = 0; i < daysAhead; i++) {
    const targetDate = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i, 12, 0, 0, 0);
    const dayEvents = getOccurrencesForDate(events, targetDate);
    
    for (const ev of dayEvents) {
      // If it's today, only include if end time is in the future or within the last hour
      if (i === 0) {
        if (ev.occurrenceEndTimeMillis >= Date.now() - 3600 * 1000) {
          occurrences.push(ev);
        }
      } else {
        occurrences.push(ev);
      }

      if (occurrences.length >= maxTotal) {
        return occurrences.sort((a, b) => a.occurrenceStartTimeMillis - b.occurrenceStartTimeMillis);
      }
    }
  }

  return occurrences.sort((a, b) => a.occurrenceStartTimeMillis - b.occurrenceStartTimeMillis);
}

/**
 * Finds the immediate next occurrence for a single event on or after a given date
 */
export function getNextOccurrence(
  event: ScheduledEvent,
  fromDate: Date = new Date()
): ExpandedCalendarEvent | null {
  const start = getMidnight(fromDate);
  // Search up to 370 days ahead
  for (let i = 0; i <= 370; i++) {
    const targetDate = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i, 12, 0, 0, 0);
    const expanded = getExpandedEventForDate(event, targetDate);
    if (expanded) {
      // If today, check if not yet ended
      if (i === 0 && expanded.occurrenceEndTimeMillis < Date.now()) {
        continue;
      }
      return expanded;
    }
  }
  return null;
}
