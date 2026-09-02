import { ScheduledEvent, UserSettings } from '../types.ts';
import { getUpcomingOccurrences } from './recurrence.ts';

const NOTIFICATION_QUEUE_KEY = 'ministry_tracker_notification_queue_v2';
const DELIVERED_NOTIFICATIONS_KEY = 'ministry_tracker_delivered_notifications_v2';

export interface QueuedNotification {
  id: string; // Composite unique key: `${eventId}_${occurrenceDateStr}_${reminderMinutesBefore}`
  eventId: number;
  title: string;
  location: string;
  occurrenceDateStr: string;
  triggerAtMillis: number;
  startTimeMillis: number;
  reminderMinutesBefore: number;
  repeatOption: string;
}

/**
 * Check if the browser supports standard Web Notifications
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Get current notification permission state
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch {
    return false;
  }
}

/**
 * Retrieve the current persistent notification queue
 */
export function getQueuedNotifications(): QueuedNotification[] {
  try {
    const raw = localStorage.getItem(NOTIFICATION_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Save persistent notification queue
 */
function saveQueuedNotifications(queue: QueuedNotification[]): void {
  try {
    localStorage.setItem(NOTIFICATION_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.warn('Failed to save notification queue', e);
  }
}

/**
 * Get set of delivered notification IDs to prevent duplicates
 */
function getDeliveredNotificationIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELIVERED_NOTIFICATIONS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

/**
 * Mark a notification as delivered
 */
function markNotificationDelivered(id: string): void {
  try {
    const set = getDeliveredNotificationIds();
    set.add(id);
    // Keep set bounded to latest 200 items
    const arr = Array.from(set).slice(-200);
    localStorage.setItem(DELIVERED_NOTIFICATIONS_KEY, JSON.stringify(arr));
  } catch (e) {
    console.warn('Failed to record delivered notification', e);
  }
}

/**
 * Regenerates the notification queue for all upcoming occurrences of scheduled events.
 * Looks ahead 60 days into the future to queue upcoming reminders for daily, weekly, monthly, yearly events.
 */
export function syncNotificationQueue(events: ScheduledEvent[], settings: UserSettings): QueuedNotification[] {
  if (settings.notificationsEnabled === false) {
    saveQueuedNotifications([]);
    return [];
  }

  const now = Date.now();
  const deliveredIds = getDeliveredNotificationIds();
  const newQueue: QueuedNotification[] = [];

  // Generate expanded occurrences for the next 60 days
  const upcoming = getUpcomingOccurrences(events, new Date(), 60, 150);

  for (const occ of upcoming) {
    // Skip if reminder is set to NONE (-1 or undefined)
    const reminderMinutes = occ.reminderMinutesBefore;
    if (reminderMinutes === undefined || reminderMinutes < 0) {
      continue;
    }

    // Skip if occurrence was marked completed or excluded
    if (occ.isCompletedForOccurrence) {
      continue;
    }

    const triggerAtMillis = occ.occurrenceStartTimeMillis - reminderMinutes * 60 * 1000;
    const queueId = `${occ.id}_${occ.occurrenceDateStr}_${reminderMinutes}`;

    // Only queue if not already delivered and trigger time is in future or within recent 10 minutes
    if (!deliveredIds.has(queueId) && triggerAtMillis >= now - 10 * 60 * 1000) {
      newQueue.push({
        id: queueId,
        eventId: occ.id,
        title: occ.title || 'Ministry Arrangement',
        location: occ.location || '',
        occurrenceDateStr: occ.occurrenceDateStr,
        triggerAtMillis,
        startTimeMillis: occ.occurrenceStartTimeMillis,
        reminderMinutesBefore: reminderMinutes,
        repeatOption: occ.repeatOption,
      });
    }
  }

  // Sort queue by trigger time ascending
  newQueue.sort((a, b) => a.triggerAtMillis - b.triggerAtMillis);
  saveQueuedNotifications(newQueue);
  return newQueue;
}

/**
 * Dispatches a native or ServiceWorker notification
 */
export async function triggerNotification(item: QueuedNotification): Promise<boolean> {
  const startTimeStr = new Date(item.startTimeMillis).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  let timingText = `Starts at ${startTimeStr}`;
  if (item.reminderMinutesBefore > 0) {
    timingText = `Starts in ${item.reminderMinutesBefore} minutes (${startTimeStr})`;
  } else if (item.reminderMinutesBefore === 0) {
    timingText = `Starting now (${startTimeStr})`;
  }

  const bodyText = item.location
    ? `${timingText} • 📍 ${item.location}`
    : timingText;

  // Mark delivered in persistent storage
  markNotificationDelivered(item.id);

  // 1. Try Service Worker showNotification if active
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.showNotification) {
        await reg.showNotification(`Ministry: ${item.title}`, {
          body: bodyText,
          icon: '/J.png',
          badge: '/J.png',
          tag: item.id,
        });
        return true;
      }
    } catch {
      // Fallback to standard Notification
    }
  }

  // 2. Standard Web Notification API
  if (isNotificationSupported() && Notification.permission === 'granted') {
    try {
      new Notification(`Ministry: ${item.title}`, {
        body: bodyText,
        icon: '/J.png',
        tag: item.id,
      });
      return true;
    } catch (err) {
      console.warn('Native notification failed', err);
    }
  }

  return false;
}

/**
 * Checks queue for any due notifications and fires them.
 * Also calls optional in-app banner callback.
 */
export async function processDueNotifications(
  onInAppNotification?: (item: QueuedNotification) => void
): Promise<number> {
  const now = Date.now();
  const queue = getQueuedNotifications();
  if (queue.length === 0) return 0;

  const remaining: QueuedNotification[] = [];
  let triggeredCount = 0;

  for (const item of queue) {
    // If due (triggerAtMillis <= now) and within reasonable 30-min window
    if (item.triggerAtMillis <= now && item.triggerAtMillis >= now - 30 * 60 * 1000) {
      await triggerNotification(item);
      triggeredCount++;
      if (onInAppNotification) {
        onInAppNotification(item);
      }
    } else if (item.triggerAtMillis > now) {
      remaining.push(item);
    }
  }

  saveQueuedNotifications(remaining);
  return triggeredCount;
}

/**
 * Removes all queued notifications for a given event ID (or a specific occurrence date)
 */
export function cancelNotificationsForEvent(eventId: number, occurrenceDateStr?: string): void {
  const queue = getQueuedNotifications();
  const filtered = queue.filter(item => {
    if (item.eventId !== eventId) return true;
    if (occurrenceDateStr && item.occurrenceDateStr !== occurrenceDateStr) return true;
    return false;
  });
  saveQueuedNotifications(filtered);
}
