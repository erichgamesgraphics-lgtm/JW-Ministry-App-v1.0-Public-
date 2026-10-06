/**
 * Safe local date and time utilities to prevent timezone offsets,
 * invalid date RangeErrors, and NaN values.
 */

/**
 * Returns a 'YYYY-MM-DD' string in the user's LOCAL timezone.
 * Avoids .toISOString().split('T')[0] which shifts dates in non-UTC timezones.
 */
export function toLocalYMD(dateOrMillis?: Date | number | null): string {
  let date: Date;
  if (!dateOrMillis) {
    date = new Date();
  } else if (typeof dateOrMillis === 'number') {
    if (!Number.isFinite(dateOrMillis)) {
      date = new Date();
    } else {
      date = new Date(dateOrMillis);
    }
  } else if (dateOrMillis instanceof Date) {
    date = isNaN(dateOrMillis.getTime()) ? new Date() : dateOrMillis;
  } else {
    date = new Date();
  }

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parses a 'YYYY-MM-DD' string safely into a local Date object.
 * Defaults to midday (12:00:00) to stay safely away from midnight DST shifts.
 */
export function parseLocalYMD(ymdStr?: string | null): Date {
  if (!ymdStr || typeof ymdStr !== 'string') {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
  }

  const parts = ymdStr.trim().split('-').map(Number);
  if (parts.length < 3 || parts.some(isNaN)) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
  }

  const [y, m, d] = parts;
  const safeY = y >= 1970 && y <= 2100 ? y : new Date().getFullYear();
  const safeM = m >= 1 && m <= 12 ? m : 1;
  const safeD = d >= 1 && d <= 31 ? d : 1;

  return new Date(safeY, safeM - 1, safeD, 12, 0, 0, 0);
}

/**
 * Formats a Date object into 'HH:MM' string for HTML <input type="time">
 */
export function formatTimeInputValue(dateOrMillis?: Date | number | null): string {
  let date: Date;
  if (!dateOrMillis) {
    date = new Date();
  } else if (typeof dateOrMillis === 'number') {
    date = Number.isFinite(dateOrMillis) ? new Date(dateOrMillis) : new Date();
  } else {
    date = isNaN(dateOrMillis.getTime()) ? new Date() : dateOrMillis;
  }

  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Validates that a value is a valid finite timestamp
 */
export function isValidTimestamp(ts?: any): boolean {
  return typeof ts === 'number' && Number.isFinite(ts) && ts > 0;
}
