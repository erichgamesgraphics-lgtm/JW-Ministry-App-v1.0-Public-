import {
  MinistryEntry,
  ScheduledEvent,
  UserSettings,
  TimerState,
  PublisherStatusType,
  PUBLISHER_STATUS_OPTIONS
} from '../types.ts';

const BASE_ENTRIES_KEY = 'ministry_tracker_entries_v2';
const BASE_EVENTS_KEY = 'ministry_tracker_events_v2';
const SETTINGS_KEY = 'ministry_tracker_settings_v2';
const TIMER_KEY = 'ministry_tracker_timer_v2';

// Legacy keys for fallback data migration
const LEGACY_ENTRIES_KEY = 'ministry_tracker_entries_v1';
const LEGACY_EVENTS_KEY = 'ministry_tracker_events_v1';

export const DEFAULT_SETTINGS: UserSettings = {
  publisherStatus: 'PUBLISHER',
  customGoalHours: 50,
  dailyReminderEnabled: false,
  dailyReminderHour: 20,
  dailyReminderMinute: 0,
  themeMode: 'SYSTEM',
  notificationsEnabled: true,
  isFirstLaunch: true,
  onboardingCompleted: false,
  userEmail: null,
  userName: null,
  isGuest: true,
  lastBackupDate: 0,
};

export const DEFAULT_TIMER: TimerState = {
  isRunning: false,
  accumulatedSeconds: 0,
  startTimeMillis: 0,
  lastPausedTimeMillis: 0,
  notes: '',
  ministryType: 'HOUSE_TO_HOUSE',
  location: '',
};

function getStorageKey(baseKey: string, userScope: string = 'guest'): string {
  const sanitizedScope = (userScope || 'guest').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${baseKey}_${sanitizedScope}`;
}

export const storage = {
  getEntries(userScope: string = 'guest'): MinistryEntry[] {
    try {
      const scopedKey = getStorageKey(BASE_ENTRIES_KEY, userScope);
      const data = localStorage.getItem(scopedKey);
      if (data) {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
      }
      
      // If legacy data exists and we are in guest scope, migrate once
      if (userScope === 'guest') {
        const legacyData = localStorage.getItem(LEGACY_ENTRIES_KEY);
        if (legacyData) {
          const parsedLegacy = JSON.parse(legacyData);
          if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
            localStorage.setItem(scopedKey, legacyData);
            return parsedLegacy;
          }
        }
      }

      // New users and new guests start with exactly ZERO data
      return [];
    } catch {
      return [];
    }
  },

  saveEntries(entries: MinistryEntry[], userScope: string = 'guest'): void {
    try {
      const scopedKey = getStorageKey(BASE_ENTRIES_KEY, userScope);
      localStorage.setItem(scopedKey, JSON.stringify(entries));
    } catch (e) {
      console.warn('Failed to save entries to localStorage', e);
    }
  },

  getEvents(userScope: string = 'guest'): ScheduledEvent[] {
    try {
      const scopedKey = getStorageKey(BASE_EVENTS_KEY, userScope);
      const data = localStorage.getItem(scopedKey);
      if (data) {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
      }

      // If legacy data exists and we are in guest scope, migrate once
      if (userScope === 'guest') {
        const legacyData = localStorage.getItem(LEGACY_EVENTS_KEY);
        if (legacyData) {
          const parsedLegacy = JSON.parse(legacyData);
          if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
            localStorage.setItem(scopedKey, legacyData);
            return parsedLegacy;
          }
        }
      }

      // New users and new guests start with exactly ZERO scheduled events
      return [];
    } catch {
      return [];
    }
  },

  saveEvents(events: ScheduledEvent[], userScope: string = 'guest'): void {
    try {
      const scopedKey = getStorageKey(BASE_EVENTS_KEY, userScope);
      localStorage.setItem(scopedKey, JSON.stringify(events));
    } catch (e) {
      console.warn('Failed to save events to localStorage', e);
    }
  },

  getSettings(): UserSettings {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      if (!data) return DEFAULT_SETTINGS;
      const parsed = JSON.parse(data);
      const isCompleted = parsed.onboardingCompleted ?? (parsed.isFirstLaunch === false);
      let status = parsed.publisherStatus || 'PUBLISHER';
      if (status === 'AUXILIARY_PIONEER_30' || status === 'AUXILIARY_PIONEER_15') status = 'AUXILIARY_PIONEER';
      if (status === 'REGULAR_PIONEER_50') status = 'PIONEER';
      if (status === 'SPECIAL_PIONEER_100') status = 'SPECIAL_PIONEER';
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        publisherStatus: status,
        isFirstLaunch: !isCompleted,
        onboardingCompleted: isCompleted,
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: UserSettings): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings to localStorage', e);
    }
  },

  getTimer(): TimerState {
    try {
      const data = localStorage.getItem(TIMER_KEY);
      if (!data) return DEFAULT_TIMER;
      return { ...DEFAULT_TIMER, ...JSON.parse(data) };
    } catch {
      return DEFAULT_TIMER;
    }
  },

  saveTimer(timer: TimerState): void {
    try {
      localStorage.setItem(TIMER_KEY, JSON.stringify(timer));
    } catch (e) {
      console.warn('Failed to save timer to localStorage', e);
    }
  },

  exportToCsv(entries: MinistryEntry[]): string {
    const headers = ['Date', 'Ministry Type', 'Duration', 'Minutes', 'Return Visits', 'Bible Studies', 'Placements', 'Location', 'Notes'];
    const rows = entries.map(e => {
      const dateStr = new Date(e.dateMillis).toISOString().split('T')[0];
      const h = Math.floor(e.durationMinutes / 60);
      const m = e.durationMinutes % 60;
      const durationStr = `${h}h ${m}m`;
      const sanitizedLocation = (e.location || '').replace(/"/g, '""');
      const sanitizedNotes = (e.notes || '').replace(/"/g, '""');
      return [
        `"${dateStr}"`,
        `"${e.ministryType}"`,
        `"${durationStr}"`,
        e.durationMinutes,
        e.returnVisits,
        e.bibleStudies,
        e.placements,
        `"${sanitizedLocation}"`,
        `"${sanitizedNotes}"`
      ].join(',');
    });
    return [headers.join(','), ...rows].join('\n');
  },

  generateReportSummary(entries: MinistryEntry[], settings: UserSettings, year: number, month: number): string {
    const monthDate = new Date(year, month, 1);
    const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    const monthlyEntries = entries.filter(e => {
      const d = new Date(e.dateMillis);
      return d.getFullYear() === year && d.getMonth() === month;
    });

    const totalMinutes = monthlyEntries.reduce((sum, e) => sum + e.durationMinutes, 0);
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    const decimalHours = (totalMinutes / 60).toFixed(1);
    const totalRV = monthlyEntries.reduce((sum, e) => sum + e.returnVisits, 0);
    const totalBS = monthlyEntries.reduce((sum, e) => sum + e.bibleStudies, 0);
    const totalPlacements = monthlyEntries.reduce((sum, e) => sum + e.placements, 0);
    const activeDays = new Set(monthlyEntries.map(e => new Date(e.dateMillis).getDate())).size;

    const statusTitle = PUBLISHER_STATUS_OPTIONS[settings.publisherStatus]?.displayName || 'Publisher';

    const activityLines = monthlyEntries.map(entry => {
      const d = new Date(entry.dateMillis);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const h = Math.floor(entry.durationMinutes / 60);
      const m = entry.durationMinutes % 60;
      return `• ${dateStr} | ${h}h ${m}m | ${entry.ministryType} | RV: ${entry.returnVisits}, BS: ${entry.bibleStudies}, Placements: ${entry.placements}`;
    }).join('\n');

    return `========================================
   JEHOVAH'S WITNESSES MINISTRY REPORT
========================================
Month: ${monthName}
Publisher Status: ${statusTitle}

SUMMARY STATISTICS
----------------------------------------
Total Hours:      ${totalHours}h ${remainingMinutes}m (${decimalHours} hrs)
Active Days:      ${activeDays}
Return Visits:    ${totalRV}
Bible Studies:    ${totalBS}
Placements:       ${totalPlacements}

ACTIVITY DETAILS
----------------------------------------
${activityLines || 'No activity recorded for this period.'}
========================================
Generated by JW Ministry App`;
  },

  downloadFile(content: string, filename: string, mimeType: string): boolean {
    try {
      const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 300);
      return true;
    } catch (err) {
      console.error('Download file error:', err);
      return false;
    }
  },

  createBackupJson(entries: MinistryEntry[], events: ScheduledEvent[], settings: UserSettings): string {
    const backupObj = {
      version: 2,
      app: 'JW Ministry App',
      appVersion: '2.0.0',
      createdAt: new Date().toISOString(),
      createdAtMillis: Date.now(),
      publisherStatus: settings.publisherStatus,
      customGoalHours: settings.customGoalHours,
      ministryEntries: entries,
      scheduledEvents: events,
      settings: {
        publisherStatus: settings.publisherStatus,
        customGoalHours: settings.customGoalHours,
        dailyReminderEnabled: settings.dailyReminderEnabled,
        dailyReminderHour: settings.dailyReminderHour,
        dailyReminderMinute: settings.dailyReminderMinute,
        themeMode: settings.themeMode,
        notificationsEnabled: settings.notificationsEnabled,
      }
    };
    return JSON.stringify(backupObj, null, 2);
  },

  restoreBackup(jsonString: string): { entries: MinistryEntry[]; events: ScheduledEvent[]; publisherStatus?: PublisherStatusType; customGoalHours?: number; settings?: Partial<UserSettings> } | null {
    try {
      if (!jsonString || typeof jsonString !== 'string') return null;
      const parsed = JSON.parse(jsonString);
      if (!parsed) return null;

      // Extract entries from various backup schemas
      let rawEntries: MinistryEntry[] = [];
      if (Array.isArray(parsed.ministryEntries)) {
        rawEntries = parsed.ministryEntries;
      } else if (Array.isArray(parsed.entries)) {
        rawEntries = parsed.entries;
      } else if (Array.isArray(parsed.ministryRecords)) {
        rawEntries = parsed.ministryRecords;
      } else {
        return null;
      }

      // Extract events
      let rawEvents: ScheduledEvent[] = [];
      if (Array.isArray(parsed.scheduledEvents)) {
        rawEvents = parsed.scheduledEvents;
      } else if (Array.isArray(parsed.events)) {
        rawEvents = parsed.events;
      }

      const publisherStatus = parsed.publisherStatus || parsed.settings?.publisherStatus;
      const customGoalHours = parsed.customGoalHours || parsed.settings?.customGoalHours;

      return {
        entries: rawEntries,
        events: rawEvents,
        publisherStatus,
        customGoalHours,
        settings: parsed.settings,
      };
    } catch {
      return null;
    }
  },

  clearAll(userScope?: string): void {
    try {
      const entriesKey = getStorageKey(BASE_ENTRIES_KEY, userScope);
      const eventsKey = getStorageKey(BASE_EVENTS_KEY, userScope);
      localStorage.removeItem(entriesKey);
      localStorage.removeItem(eventsKey);
      localStorage.removeItem(BASE_ENTRIES_KEY);
      localStorage.removeItem(BASE_EVENTS_KEY);
      localStorage.removeItem(TIMER_KEY);
    } catch (e) {
      console.warn('Failed to clear data from localStorage', e);
    }
  }
};
