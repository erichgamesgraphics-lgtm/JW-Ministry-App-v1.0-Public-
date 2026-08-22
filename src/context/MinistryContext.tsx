import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  MinistryEntry,
  ScheduledEvent,
  UserSettings,
  TimerState,
  PublisherStatusType,
  MinistryTypeCategory,
  DashboardStats,
  ReportsData,
  SupportedLanguage,
  PUBLISHER_STATUS_OPTIONS,
} from '../types.ts';
import { storage, DEFAULT_TIMER } from '../utils/storage.ts';
import { getTranslation, TranslationSchema } from '../translations/index.ts';

interface MinistryContextType {
  entries: MinistryEntry[];
  events: ScheduledEvent[];
  settings: UserSettings;
  timer: TimerState;
  dashboardStats: DashboardStats;
  language: SupportedLanguage;
  t: TranslationSchema;
  
  // Entry Operations
  saveEntry: (entryData: Partial<MinistryEntry> & { id?: number }) => MinistryEntry;
  deleteEntry: (id: number) => void;
  
  // Event Operations
  saveEvent: (eventData: Partial<ScheduledEvent> & { id?: number }) => ScheduledEvent;
  deleteEvent: (id: number) => void;
  toggleEventCompleted: (id: number) => void;
  
  // Settings & Status
  updateSettings: (partial: Partial<UserSettings>) => void;
  updatePublisherStatus: (status: PublisherStatusType, customGoal?: number) => void;
  updateTheme: (theme: 'SYSTEM' | 'LIGHT' | 'DARK') => void;
  updateLanguage: (lang: SupportedLanguage) => void;
  completeOnboarding: (status: PublisherStatusType, customGoalHours?: number) => void;
  resetOnboarding: () => void;
  
  // Timer Operations
  startTimer: (ministryType?: MinistryTypeCategory, location?: string, notes?: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopAndSaveTimer: () => MinistryEntry | null;
  resetTimer: () => void;
  updateTimerDraft: (updates: Partial<TimerState>) => void;
  currentTimerElapsedSeconds: number;

  // Data Tools
  exportCsv: () => string;
  createBackup: () => string;
  restoreBackup: (json: string) => boolean;
  clearAllData: () => void;
  getReportsForPeriod: (periodIndex: number) => ReportsData;
}

const MinistryContext = createContext<MinistryContextType | undefined>(undefined);

export const MinistryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings>(() => storage.getSettings());
  const [entries, setEntries] = useState<MinistryEntry[]>(() => storage.getEntries());
  const [events, setEvents] = useState<ScheduledEvent[]>(() => storage.getEvents());
  const [timer, setTimer] = useState<TimerState>(() => storage.getTimer());
  const [timerTicker, setTimerTicker] = useState<number>(0);

  // Sync to local storage on state changes
  useEffect(() => {
    storage.saveEntries(entries);
  }, [entries]);

  useEffect(() => {
    storage.saveEvents(events);
  }, [events]);

  useEffect(() => {
    storage.saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    storage.saveTimer(timer);
  }, [timer]);

  // Apply theme class to document element and listen for system theme changes
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = () => {
      if (settings.themeMode === 'DARK') {
        root.classList.add('dark');
      } else if (settings.themeMode === 'LIGHT') {
        root.classList.remove('dark');
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    applyTheme();

    if (settings.themeMode === 'SYSTEM') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, [settings.themeMode]);

  // Live Timer Interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timer.isRunning) {
      interval = setInterval(() => {
        setTimerTicker(t => t + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer.isRunning]);

  // Calculate live elapsed seconds for active timer
  const currentTimerElapsedSeconds = useMemo(() => {
    if (!timer.isRunning) {
      return timer.accumulatedSeconds;
    }
    const currentRunTime = Math.floor((Date.now() - timer.startTimeMillis) / 1000);
    return timer.accumulatedSeconds + Math.max(0, currentRunTime);
  }, [timer, timerTicker]);

  // Entry operations
  const saveEntry = useCallback((entryData: Partial<MinistryEntry> & { id?: number }) => {
    let saved: MinistryEntry;
    if (entryData.id && entryData.id > 0) {
      // Update
      const now = Date.now();
      saved = {
        id: entryData.id,
        dateMillis: entryData.dateMillis ?? now,
        startTimeMillis: entryData.startTimeMillis ?? 0,
        endTimeMillis: entryData.endTimeMillis ?? 0,
        durationMinutes: entryData.durationMinutes ?? 0,
        ministryType: entryData.ministryType ?? 'HOUSE_TO_HOUSE',
        returnVisits: entryData.returnVisits ?? 0,
        bibleStudies: entryData.bibleStudies ?? 0,
        placements: entryData.placements ?? 0,
        location: entryData.location ?? '',
        notes: entryData.notes ?? '',
        isSynced: false,
        createdAt: entryData.createdAt ?? now,
        updatedAt: now,
      };
      setEntries(prev => prev.map(e => e.id === saved.id ? saved : e));
    } else {
      // Create new
      const now = Date.now();
      const newId = now;
      saved = {
        id: newId,
        dateMillis: entryData.dateMillis ?? now,
        startTimeMillis: entryData.startTimeMillis ?? 0,
        endTimeMillis: entryData.endTimeMillis ?? 0,
        durationMinutes: entryData.durationMinutes ?? 0,
        ministryType: entryData.ministryType ?? 'HOUSE_TO_HOUSE',
        returnVisits: entryData.returnVisits ?? 0,
        bibleStudies: entryData.bibleStudies ?? 0,
        placements: entryData.placements ?? 0,
        location: entryData.location ?? '',
        notes: entryData.notes ?? '',
        isSynced: false,
        createdAt: now,
        updatedAt: now,
      };
      setEntries(prev => [saved, ...prev]);
    }
    return saved;
  }, []);

  const deleteEntry = useCallback((id: number) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  // Event operations (standalone local calendar)
  const saveEvent = useCallback((eventData: Partial<ScheduledEvent> & { id?: number }): ScheduledEvent => {
    let saved: ScheduledEvent;
    if (eventData.id && eventData.id > 0) {
      saved = {
        id: eventData.id,
        title: eventData.title ?? 'Ministry Arrangement',
        dateMillis: eventData.dateMillis ?? Date.now(),
        startTimeMillis: eventData.startTimeMillis ?? Date.now(),
        endTimeMillis: eventData.endTimeMillis ?? Date.now() + 2 * 3600 * 1000,
        location: eventData.location ?? '',
        description: eventData.description ?? '',
        reminderMinutesBefore: eventData.reminderMinutesBefore ?? 15,
        repeatOption: eventData.repeatOption ?? 'NONE',
        isCompleted: eventData.isCompleted ?? false,
        createdAt: eventData.createdAt ?? Date.now(),
      };
      setEvents(prev => prev.map(ev => ev.id === saved.id ? saved : ev));
    } else {
      const now = Date.now();
      saved = {
        id: now,
        title: eventData.title ?? 'Ministry Arrangement',
        dateMillis: eventData.dateMillis ?? now,
        startTimeMillis: eventData.startTimeMillis ?? now,
        endTimeMillis: eventData.endTimeMillis ?? now + 2 * 3600 * 1000,
        location: eventData.location ?? '',
        description: eventData.description ?? '',
        reminderMinutesBefore: eventData.reminderMinutesBefore ?? 15,
        repeatOption: eventData.repeatOption ?? 'NONE',
        isCompleted: false,
        createdAt: now,
      };
      setEvents(prev => [saved, ...prev]);
    }
    return saved;
  }, []);

  const deleteEvent = useCallback((id: number): void => {
    setEvents(prev => prev.filter(ev => ev.id !== id));
  }, []);

  const toggleEventCompleted = useCallback((id: number) => {
    setEvents(prev => prev.map(ev => ev.id === id ? { ...ev, isCompleted: !ev.isCompleted } : ev));
  }, []);

  // Settings
  const updateSettings = useCallback((partial: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
  }, []);

  const updatePublisherStatus = useCallback((status: PublisherStatusType, customGoal?: number) => {
    setSettings(prev => {
      const defaultGoal = PUBLISHER_STATUS_OPTIONS[status]?.defaultGoalHours || 0;
      return {
        ...prev,
        publisherStatus: status,
        customGoalHours: customGoal !== undefined ? customGoal : (status === 'CUSTOM' ? prev.customGoalHours : defaultGoal),
      };
    });
  }, []);

  const completeOnboarding = useCallback((status: PublisherStatusType, customGoalHours?: number) => {
    setSettings(prev => {
      const defaultGoal = PUBLISHER_STATUS_OPTIONS[status]?.defaultGoalHours || 0;
      const finalCustomGoal = customGoalHours !== undefined ? customGoalHours : (status === 'CUSTOM' ? (prev.customGoalHours || 50) : defaultGoal);
      const updated: UserSettings = {
        ...prev,
        publisherStatus: status,
        customGoalHours: finalCustomGoal,
        isFirstLaunch: false,
        onboardingCompleted: true,
      };
      storage.saveSettings(updated);
      return updated;
    });
  }, []);

  const resetOnboarding = useCallback(() => {
    setSettings(prev => {
      const updated = {
        ...prev,
        isFirstLaunch: true,
        onboardingCompleted: false,
      };
      storage.saveSettings(updated);
      return updated;
    });
  }, []);

  const updateTheme = useCallback((themeMode: 'SYSTEM' | 'LIGHT' | 'DARK') => {
    setSettings(prev => ({ ...prev, themeMode }));
  }, []);

  const updateLanguage = useCallback((lang: SupportedLanguage) => {
    setSettings(prev => {
      const updated = { ...prev, language: lang };
      storage.saveSettings(updated);
      return updated;
    });
  }, []);

  const language = settings.language || 'en';
  const t = useMemo(() => getTranslation(language), [language]);

  // Timer controls
  const startTimer = useCallback((ministryType: MinistryTypeCategory = 'HOUSE_TO_HOUSE', location: string = '', notes: string = '') => {
    setTimer({
      isRunning: true,
      accumulatedSeconds: 0,
      startTimeMillis: Date.now(),
      lastPausedTimeMillis: 0,
      notes,
      ministryType,
      location,
    });
  }, []);

  const pauseTimer = useCallback(() => {
    setTimer(prev => {
      if (!prev.isRunning) return prev;
      const additional = Math.floor((Date.now() - prev.startTimeMillis) / 1000);
      return {
        ...prev,
        isRunning: false,
        accumulatedSeconds: prev.accumulatedSeconds + Math.max(0, additional),
        lastPausedTimeMillis: Date.now(),
      };
    });
  }, []);

  const resumeTimer = useCallback(() => {
    setTimer(prev => {
      if (prev.isRunning) return prev;
      return {
        ...prev,
        isRunning: true,
        startTimeMillis: Date.now(),
      };
    });
  }, []);

  const updateTimerDraft = useCallback((updates: Partial<TimerState>) => {
    setTimer(prev => ({ ...prev, ...updates }));
  }, []);

  const stopAndSaveTimer = useCallback((): MinistryEntry | null => {
    let finalSeconds = timer.accumulatedSeconds;
    if (timer.isRunning) {
      finalSeconds += Math.floor((Date.now() - timer.startTimeMillis) / 1000);
    }
    const finalMinutes = Math.max(1, Math.round(finalSeconds / 60));
    
    const newEntry = saveEntry({
      dateMillis: Date.now(),
      startTimeMillis: Date.now() - finalSeconds * 1000,
      endTimeMillis: Date.now(),
      durationMinutes: finalMinutes,
      ministryType: timer.ministryType,
      location: timer.location,
      notes: timer.notes,
      returnVisits: 0,
      bibleStudies: 0,
      placements: 0,
    });

    setTimer(DEFAULT_TIMER);
    return newEntry;
  }, [timer, saveEntry]);

  const resetTimer = useCallback(() => {
    setTimer(DEFAULT_TIMER);
  }, []);

  const exportCsv = useCallback(() => {
    return storage.exportToCsv(entries);
  }, [entries]);

  const createBackup = useCallback(() => {
    const json = storage.createBackupJson(entries, events, settings);
    setSettings(prev => ({ ...prev, lastBackupDate: Date.now() }));
    return json;
  }, [entries, events, settings]);

  const restoreBackup = useCallback((json: string) => {
    const result = storage.restoreBackup(json);
    if (!result) return false;
    setEntries(result.entries);
    if (result.events) setEvents(result.events);
    if (result.publisherStatus) {
      setSettings(prev => ({
        ...prev,
        publisherStatus: result.publisherStatus!,
        customGoalHours: result.customGoalHours ?? prev.customGoalHours,
      }));
    }
    return true;
  }, []);

  const clearAllData = useCallback(() => {
    setEntries([]);
    setEvents([]);
    setTimer(DEFAULT_TIMER);
    storage.clearAll();
  }, []);

  // Dashboard Stats Computation
  const dashboardStats: DashboardStats = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const monthName = now.toLocaleDateString('en-US', { month: 'long' });

    const currentMonthEntries = entries.filter(e => {
      const d = new Date(e.dateMillis);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });

    const monthlyMinutes = currentMonthEntries.reduce((sum, e) => sum + e.durationMinutes, 0);
    const monthlyReturnVisits = currentMonthEntries.reduce((sum, e) => sum + e.returnVisits, 0);
    const monthlyBibleStudies = currentMonthEntries.reduce((sum, e) => sum + e.bibleStudies, 0);
    const monthlyPlacements = currentMonthEntries.reduce((sum, e) => sum + e.placements, 0);

    const goalHours = settings.publisherStatus === 'CUSTOM'
      ? settings.customGoalHours
      : PUBLISHER_STATUS_OPTIONS[settings.publisherStatus]?.defaultGoalHours || 0;

    const goalProgressPercentage = goalHours > 0 ? Math.min(1.0, (monthlyMinutes / 60) / goalHours) : 0;

    // Calculate streak
    let streak = 0;
    let checkDate = new Date(currentYear, currentMonth, 1);
    for (let i = 0; i < 24; i++) {
      const y = checkDate.getFullYear();
      const m = checkDate.getMonth();
      const hasActivity = entries.some(e => {
        const d = new Date(e.dateMillis);
        return d.getFullYear() === y && d.getMonth() === m && e.durationMinutes > 0;
      });
      if (hasActivity) {
        streak++;
        checkDate.setMonth(checkDate.getMonth() - 1);
      } else {
        if (i === 0) {
          checkDate.setMonth(checkDate.getMonth() - 1);
          continue;
        }
        break;
      }
    }

    const upcomingEvents = events.filter(ev => !ev.isCompleted && ev.dateMillis >= Date.now() - 24 * 3600 * 1000);

    return {
      monthlyMinutes,
      monthlyReturnVisits,
      monthlyBibleStudies,
      monthlyPlacements,
      goalHours,
      goalProgressPercentage,
      streakMonths: streak,
      recentEntriesCount: entries.length,
      upcomingEventsCount: upcomingEvents.length,
      monthName,
    };
  }, [entries, events, settings]);

  // Reports Breakdown computation
  const getReportsForPeriod = useCallback((periodIndex: number): ReportsData => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    let filtered: MinistryEntry[] = [];
    if (periodIndex === 0) {
      filtered = entries.filter(e => {
        const d = new Date(e.dateMillis);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      });
    } else if (periodIndex === 1) {
      const startServiceYear = currentMonth >= 8 ? currentYear : currentYear - 1;
      const startServiceTime = new Date(startServiceYear, 8, 1).getTime();
      const endServiceTime = new Date(startServiceYear + 1, 7, 31, 23, 59, 59).getTime();

      filtered = entries.filter(e => e.dateMillis >= startServiceTime && e.dateMillis <= endServiceTime);
      if (filtered.length === 0) {
        filtered = entries.filter(e => new Date(e.dateMillis).getFullYear() === currentYear);
      }
    } else {
      filtered = entries;
    }

    const totalMinutes = filtered.reduce((sum, e) => sum + e.durationMinutes, 0);
    const totalReturnVisits = filtered.reduce((sum, e) => sum + e.returnVisits, 0);
    const totalBibleStudies = filtered.reduce((sum, e) => sum + e.bibleStudies, 0);
    const totalPlacements = filtered.reduce((sum, e) => sum + e.placements, 0);
    const activeDays = new Set(filtered.map(e => new Date(e.dateMillis).toDateString())).size;

    const monthlyHoursBreakdown: Array<{ label: string; value: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const targetMonth = new Date(currentYear, currentMonth - i, 1);
      const y = targetMonth.getFullYear();
      const m = targetMonth.getMonth();
      const label = targetMonth.toLocaleDateString('en-US', { month: 'short' });
      const monthMins = entries
        .filter(e => {
          const d = new Date(e.dateMillis);
          return d.getFullYear() === y && d.getMonth() === m;
        })
        .reduce((sum, e) => sum + e.durationMinutes, 0);
      monthlyHoursBreakdown.push({ label, value: parseFloat((monthMins / 60).toFixed(1)) });
    }

    const weeklyHoursBreakdown: Array<{ label: string; value: number }> = [
      { label: 'W1 (1-7)', value: 0 },
      { label: 'W2 (8-14)', value: 0 },
      { label: 'W3 (15-21)', value: 0 },
      { label: 'W4 (22-28)', value: 0 },
      { label: 'W5 (29+)', value: 0 },
    ];

    const currentMonthEntries = entries.filter(e => {
      const d = new Date(e.dateMillis);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });

    currentMonthEntries.forEach(e => {
      const day = new Date(e.dateMillis).getDate();
      const hrs = e.durationMinutes / 60;
      if (day <= 7) weeklyHoursBreakdown[0].value += hrs;
      else if (day <= 14) weeklyHoursBreakdown[1].value += hrs;
      else if (day <= 21) weeklyHoursBreakdown[2].value += hrs;
      else if (day <= 28) weeklyHoursBreakdown[3].value += hrs;
      else weeklyHoursBreakdown[4].value += hrs;
    });

    weeklyHoursBreakdown.forEach(w => {
      w.value = parseFloat(w.value.toFixed(1));
    });

    return {
      totalMinutes,
      totalReturnVisits,
      totalBibleStudies,
      totalPlacements,
      activeDays,
      streakMonths: dashboardStats.streakMonths,
      monthlyHoursBreakdown,
      weeklyHoursBreakdown,
    };
  }, [entries, dashboardStats.streakMonths]);

  const value = {
    entries,
    events,
    settings,
    timer,
    dashboardStats,
    language,
    t,
    saveEntry,
    deleteEntry,
    saveEvent,
    deleteEvent,
    toggleEventCompleted,
    updateSettings,
    updatePublisherStatus,
    updateTheme,
    updateLanguage,
    completeOnboarding,
    resetOnboarding,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopAndSaveTimer,
    resetTimer,
    updateTimerDraft,
    currentTimerElapsedSeconds,
    exportCsv,
    createBackup,
    restoreBackup,
    clearAllData,
    getReportsForPeriod,
  };

  return (
    <MinistryContext.Provider value={value}>
      {children}
    </MinistryContext.Provider>
  );
};

export const useMinistry = (): MinistryContextType => {
  const context = useContext(MinistryContext);
  if (!context) {
    throw new Error('useMinistry must be used within a MinistryProvider');
  }
  return context;
};
