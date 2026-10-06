import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  MinistryEntry,
  ScheduledEvent,
  ExpandedCalendarEvent,
  UserSettings,
  TimerState,
  PublisherStatusType,
  MinistryTypeCategory,
  DashboardStats,
  ReportsData,
  SupportedLanguage,
  PUBLISHER_STATUS_OPTIONS,
  MinistryNote,
  NoteFolder,
  HouseItem,
} from '../types.ts';
import { storage, DEFAULT_TIMER, sanitizeEntry, sanitizeEvent } from '../utils/storage.ts';
import { getTranslation, TranslationSchema, formatTimeLocalized } from '../translations/index.ts';
import {
  getOccurrencesForDate,
  getOccurrencesForMonth,
  getUpcomingOccurrences,
  parseDateKey,
} from '../utils/recurrence.ts';
import {
  syncNotificationQueue,
  processDueNotifications,
  cancelNotificationsForEvent,
} from '../utils/notifications.ts';
import {
  BackupManager,
  BackupSyncStatus,
  DiscoveredBackupInfo,
} from '../utils/backupManager.ts';
import {
  getOrCreateInstallationIdentity,
  mergeMinistryData,
  DecryptedBackupPayload,
} from '../utils/backupPackage.ts';

interface InAppNotification {
  title: string;
  body: string;
}

interface MinistryContextType {
  isLoaded: boolean;
  entries: MinistryEntry[];
  events: ScheduledEvent[];
  notes: MinistryNote[];
  noteFolders: NoteFolder[];
  settings: UserSettings;
  timer: TimerState;
  dashboardStats: DashboardStats;
  language: SupportedLanguage;
  t: TranslationSchema;
  
  // Entry Operations
  saveEntry: (entryData: Partial<MinistryEntry> & { id?: number }) => MinistryEntry;
  deleteEntry: (id: number) => void;
  
  // Note Operations
  saveNote: (noteData: Partial<MinistryNote> & { id?: string }) => MinistryNote;
  deleteNote: (id: string, permanent?: boolean) => void;
  restoreNote: (id: string) => void;
  duplicateNote: (id: string) => MinistryNote | null;
  togglePinNote: (id: string) => void;
  toggleArchiveNote: (id: string) => void;
  saveFolder: (name: string, iconName?: string, color?: string) => NoteFolder;
  renameFolder: (id: string, newName: string) => void;
  deleteFolder: (id: string) => void;
  updateHouseInNote: (noteId: string, houseId: string, updates: Partial<HouseItem>) => void;
  addHouseToNote: (noteId: string, houseData?: Partial<HouseItem>) => HouseItem | null;
  deleteHouseFromNote: (noteId: string, houseId: string) => void;
  reorderHousesInNote: (noteId: string, houses: HouseItem[]) => void;

  // Event Operations
  saveEvent: (
    eventData: Partial<ScheduledEvent> & { id?: number },
    editMode?: 'THIS_OCCURRENCE' | 'ALL_OCCURRENCES',
    targetOccurrenceDate?: string
  ) => ScheduledEvent;
  deleteEvent: (
    id: number,
    deleteMode?: 'THIS_OCCURRENCE' | 'ALL_OCCURRENCES',
    targetOccurrenceDate?: string
  ) => void;
  toggleEventCompleted: (id: number, targetOccurrenceDate?: string) => void;
  getEventsForDate: (date: Date) => ExpandedCalendarEvent[];
  getEventsForMonth: (year: number, month: number) => Map<number, ExpandedCalendarEvent[]>;
  upcomingArrangements: ExpandedCalendarEvent[];

  // In-app notifications
  activeNotification: InAppNotification | null;
  dismissActiveNotification: () => void;
  
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

  // Data & Backup Tools
  backupStatus: BackupSyncStatus;
  lastBackupAt: number;
  deviceRecoveryKey: string;
  deviceName: string;
  discoveredBackup: DiscoveredBackupInfo | null;
  dismissDiscoveredBackup: () => void;
  restoreDiscoveredBackup: (mergeMode?: 'replace' | 'merge') => Promise<boolean>;
  restoreWithRecoveryKey: (key: string, mergeMode?: 'replace' | 'merge') => Promise<{ success: boolean; message?: string }>;
  restoreFromMTBackupFile: (fileContent: string, mergeMode?: 'replace' | 'merge') => Promise<{ success: boolean; message?: string }>;
  performManualBackupNow: () => Promise<boolean>;
  downloadMTBackupFile: () => Promise<boolean>;
  exportCsv: (customEntries?: MinistryEntry[]) => string;
  createBackup: () => string;
  restoreBackup: (json: string) => boolean;
  clearAllData: () => void;
  getReportsForPeriod: (periodIndex: number) => ReportsData;
}

const MinistryContext = createContext<MinistryContextType | undefined>(undefined);

export const MinistryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [settings, setSettings] = useState<UserSettings>(() => storage.getSettings());
  const [entries, setEntries] = useState<MinistryEntry[]>(() => storage.getEntries());
  const [events, setEvents] = useState<ScheduledEvent[]>(() => storage.getEvents());
  const [notes, setNotes] = useState<MinistryNote[]>(() => storage.getNotes());
  const [noteFolders, setNoteFolders] = useState<NoteFolder[]>(() => storage.getNoteFolders());
  const [timer, setTimer] = useState<TimerState>(() => storage.getTimer());
  const [timerTicker, setTimerTicker] = useState<number>(0);
  const [activeNotification, setActiveNotification] = useState<InAppNotification | null>(null);

  const [backupStatus, setBackupStatus] = useState<BackupSyncStatus>('idle');
  const [lastBackupAt, setLastBackupAt] = useState<number>(0);
  const [discoveredBackup, setDiscoveredBackup] = useState<DiscoveredBackupInfo | null>(null);
  const identity = useMemo(() => getOrCreateInstallationIdentity(), []);

  // Listen to backup status changes
  useEffect(() => {
    const unsubscribe = BackupManager.subscribe((status, time) => {
      setBackupStatus(status);
      setLastBackupAt(time);
    });
    return unsubscribe;
  }, []);

  // On mount: if app has no entries/events or is first launch/not onboarded, check for existing backup to offer one-click restore
  useEffect(() => {
    if (!isLoaded) return;
    if (entries.length === 0 && events.length === 0 && notes.length === 0) {
      BackupManager.checkForExistingBackup().then(info => {
        if (info && info.found) {
          setDiscoveredBackup(info);
        }
      });
    }
  }, [isLoaded]);

  // Debounced auto backup whenever user data changes
  useEffect(() => {
    if (!isLoaded) return;
    BackupManager.triggerDebouncedBackup(entries, events, settings, notes, noteFolders, 2500);
  }, [entries, events, settings, notes, noteFolders, isLoaded]);

  // Mark storage as securely initialized after component mounts
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Sync to local storage on state changes
  useEffect(() => {
    if (!isLoaded) return;
    storage.saveEntries(entries);
  }, [entries, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    storage.saveEvents(events);
  }, [events, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    storage.saveNotes(notes);
  }, [notes, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    storage.saveNoteFolders(noteFolders);
  }, [noteFolders, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    storage.saveSettings(settings);
  }, [settings, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    storage.saveTimer(timer);
  }, [timer, isLoaded]);

  // Synchronize recurring notifications whenever events or settings change
  useEffect(() => {
    if (!isLoaded) return;
    syncNotificationQueue(events, settings);
  }, [events, settings, isLoaded]);

  // Active notification check loop (runs periodically and on app focus/resume)
  useEffect(() => {
    if (!isLoaded) return;

    const checkNotifications = () => {
      processDueNotifications((item) => {
        const startStr = formatTimeLocalized(item.startTimeMillis, settings.language || 'en');
        let timingText = `Starts at ${startStr}`;
        if (item.reminderMinutesBefore > 0) {
          timingText = `Starts in ${item.reminderMinutesBefore}m (${startStr})`;
        } else if (item.reminderMinutesBefore === 0) {
          timingText = `Starting now (${startStr})`;
        }
        const body = item.location ? `${timingText} • 📍 ${item.location}` : timingText;
        setActiveNotification({
          title: item.title || 'Ministry Arrangement',
          body,
        });
      });
    };

    // Initial check
    checkNotifications();

    const intervalId = setInterval(checkNotifications, 25000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkNotifications();
      }
    };
    const handleWindowFocus = () => checkNotifications();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('pageshow', handleWindowFocus);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('pageshow', handleWindowFocus);
    };
  }, [isLoaded]);

  const dismissActiveNotification = useCallback(() => {
    setActiveNotification(null);
  }, []);

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
    const now = Date.now();
    const clean = sanitizeEntry(entryData, entryData.id && entryData.id > 0 ? entryData.id : now);

    if (entryData.id && entryData.id > 0) {
      // Update
      setEntries(prev => prev.map(e => e.id === clean.id ? clean : e));
    } else {
      // Create new
      setEntries(prev => [clean, ...prev]);
    }
    return clean;
  }, []);

  const deleteEntry = useCallback((id: number) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  // Note Operations
  const saveNote = useCallback((noteData: Partial<MinistryNote> & { id?: string }): MinistryNote => {
    const now = Date.now();
    let saved: MinistryNote;

    if (noteData.id) {
      const existing = notes.find(n => n.id === noteData.id);
      saved = {
        id: noteData.id,
        title: noteData.title !== undefined ? noteData.title : existing?.title ?? 'Untitled Note',
        content: noteData.content !== undefined ? noteData.content : existing?.content ?? '',
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        folderId: noteData.folderId !== undefined ? noteData.folderId : existing?.folderId,
        folderName: noteData.folderName !== undefined ? noteData.folderName : existing?.folderName,
        tags: noteData.tags !== undefined ? noteData.tags : existing?.tags ?? [],
        noteType: noteData.noteType !== undefined ? noteData.noteType : existing?.noteType ?? 'GENERAL',
        isPinned: noteData.isPinned !== undefined ? noteData.isPinned : existing?.isPinned ?? false,
        isArchived: noteData.isArchived !== undefined ? noteData.isArchived : existing?.isArchived ?? false,
        isDeleted: noteData.isDeleted !== undefined ? noteData.isDeleted : existing?.isDeleted ?? false,
        territoryId: noteData.territoryId !== undefined ? noteData.territoryId : existing?.territoryId,
        territoryName: noteData.territoryName !== undefined ? noteData.territoryName : existing?.territoryName,
        associatedEventId: noteData.associatedEventId !== undefined ? noteData.associatedEventId : existing?.associatedEventId,
        houses: noteData.houses !== undefined ? noteData.houses : existing?.houses,
        locationName: noteData.locationName !== undefined ? noteData.locationName : existing?.locationName,
        address: noteData.address !== undefined ? noteData.address : existing?.address,
        latitude: noteData.latitude !== undefined ? noteData.latitude : existing?.latitude,
        longitude: noteData.longitude !== undefined ? noteData.longitude : existing?.longitude,
        googleMapsUrl: noteData.googleMapsUrl !== undefined ? noteData.googleMapsUrl : existing?.googleMapsUrl,
      };
      setNotes(prev => prev.map(n => n.id === saved.id ? saved : n));
    } else {
      const newId = `note_${now}_${Math.random().toString(36).substring(2, 7)}`;
      saved = {
        id: newId,
        title: noteData.title || 'Untitled Note',
        content: noteData.content || '',
        createdAt: now,
        updatedAt: now,
        folderId: noteData.folderId,
        folderName: noteData.folderName,
        tags: noteData.tags || [],
        noteType: noteData.noteType || 'GENERAL',
        isPinned: noteData.isPinned || false,
        isArchived: noteData.isArchived || false,
        isDeleted: false,
        territoryId: noteData.territoryId,
        territoryName: noteData.territoryName,
        associatedEventId: noteData.associatedEventId,
        houses: noteData.houses,
        locationName: noteData.locationName,
        address: noteData.address,
        latitude: noteData.latitude,
        longitude: noteData.longitude,
        googleMapsUrl: noteData.googleMapsUrl,
      };
      setNotes(prev => [saved, ...prev]);
    }
    return saved;
  }, [notes]);

  const deleteNote = useCallback((id: string, permanent: boolean = false) => {
    if (permanent) {
      setNotes(prev => prev.filter(n => n.id !== id));
    } else {
      setNotes(prev => prev.map(n => n.id === id ? { ...n, isDeleted: true, updatedAt: Date.now() } : n));
    }
  }, []);

  const restoreNote = useCallback((id: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, isDeleted: false, updatedAt: Date.now() } : n));
  }, []);

  const duplicateNote = useCallback((id: string): MinistryNote | null => {
    const existing = notes.find(n => n.id === id);
    if (!existing) return null;
    const now = Date.now();
    const newNote: MinistryNote = {
      ...existing,
      id: `note_${now}_${Math.random().toString(36).substring(2, 7)}`,
      title: `${existing.title} (Copy)`,
      createdAt: now,
      updatedAt: now,
      isPinned: false,
    };
    setNotes(prev => [newNote, ...prev]);
    return newNote;
  }, [notes]);

  const togglePinNote = useCallback((id: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, isPinned: !n.isPinned, updatedAt: Date.now() } : n));
  }, []);

  const toggleArchiveNote = useCallback((id: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, isArchived: !n.isArchived, updatedAt: Date.now() } : n));
  }, []);

  const saveFolder = useCallback((name: string, iconName?: string, color?: string): NoteFolder => {
    const now = Date.now();
    const newFolder: NoteFolder = {
      id: `folder_${now}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      iconName,
      color,
      createdAt: now,
    };
    setNoteFolders(prev => [...prev, newFolder]);
    return newFolder;
  }, []);

  const renameFolder = useCallback((id: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setNoteFolders(prev => prev.map(f => f.id === id ? { ...f, name: trimmed } : f));
    setNotes(prev => prev.map(n => n.folderId === id ? { ...n, folderName: trimmed, updatedAt: Date.now() } : n));
  }, []);

  const deleteFolder = useCallback((id: string) => {
    setNoteFolders(prev => prev.filter(f => f.id !== id));
    setNotes(prev => prev.map(n => n.folderId === id ? { ...n, folderId: undefined, folderName: undefined } : n));
  }, []);

  const updateHouseInNote = useCallback((noteId: string, houseId: string, updates: Partial<HouseItem>) => {
    const now = Date.now();
    setNotes(prev => prev.map(n => {
      if (n.id !== noteId) return n;
      const houses = (n.houses || []).map(h => {
        if (h.id !== houseId) return h;
        return { ...h, ...updates, updatedAt: now };
      });
      return { ...n, houses, updatedAt: now };
    }));
  }, []);

  const addHouseToNote = useCallback((noteId: string, houseData?: Partial<HouseItem>): HouseItem | null => {
    const now = Date.now();
    let createdHouse: HouseItem | null = null;

    setNotes(prev => prev.map(n => {
      if (n.id !== noteId) return n;
      const houses = n.houses ? [...n.houses] : [];
      const nextNumber = houseData?.number || `${houses.length + 1}`;
      createdHouse = {
        id: `house_${now}_${Math.random().toString(36).substring(2, 7)}`,
        number: nextNumber,
        label: houseData?.label || '',
        status: houseData?.status || 'NOT_VISITED',
        customStatusLabel: houseData?.customStatusLabel,
        notes: houseData?.notes || '',
        createdAt: now,
        updatedAt: now,
      };
      houses.push(createdHouse);
      return { ...n, houses, updatedAt: now };
    }));

    return createdHouse;
  }, []);

  const deleteHouseFromNote = useCallback((noteId: string, houseId: string) => {
    const now = Date.now();
    setNotes(prev => prev.map(n => {
      if (n.id !== noteId) return n;
      const houses = (n.houses || []).filter(h => h.id !== houseId);
      return { ...n, houses, updatedAt: now };
    }));
  }, []);

  const reorderHousesInNote = useCallback((noteId: string, houses: HouseItem[]) => {
    const now = Date.now();
    setNotes(prev => prev.map(n => {
      if (n.id !== noteId) return n;
      return { ...n, houses, updatedAt: now };
    }));
  }, []);

  // Event & Recurrence Operations
  const saveEvent = useCallback((
    eventData: Partial<ScheduledEvent> & { id?: number },
    editMode?: 'THIS_OCCURRENCE' | 'ALL_OCCURRENCES',
    targetOccurrenceDate?: string
  ): ScheduledEvent => {
    const now = Date.now();

    // Mode A: Edit only this specific occurrence of a recurring series
    if (
      eventData.id &&
      eventData.id > 0 &&
      editMode === 'THIS_OCCURRENCE' &&
      targetOccurrenceDate
    ) {
      const parentId = eventData.id;
      const targetMiddayMillis = parseDateKey(targetOccurrenceDate).getTime();

      // 1. Exclude this date from the recurring parent event
      setEvents(prev =>
        prev.map(ev => {
          if (ev.id === parentId) {
            const excluded = Array.isArray(ev.excludedDates) ? [...ev.excludedDates] : [];
            if (!excluded.includes(targetOccurrenceDate)) {
              excluded.push(targetOccurrenceDate);
            }
            return { ...ev, excludedDates: excluded };
          }
          return ev;
        })
      );

      // 2. Create detached one-off event for this date with customized details
      const detachedEvent = sanitizeEvent({
        ...eventData,
        id: now,
        title: eventData.title ?? 'Ministry Arrangement',
        dateMillis: targetMiddayMillis,
        repeatOption: 'NONE', // Detached instance is a single event
        createdAt: now,
        parentEventId: parentId,
        originalOccurrenceDate: targetOccurrenceDate,
      }, now);

      setEvents(prev => [detachedEvent, ...prev]);
      return detachedEvent;
    }

    // Mode B: Update entire series or existing single event
    if (eventData.id && eventData.id > 0) {
      let updatedEvent: ScheduledEvent | undefined;
      setEvents(prev => {
        return prev.map(ev => {
          if (ev.id === eventData.id) {
            updatedEvent = sanitizeEvent({
              ...ev,
              ...eventData,
              id: ev.id,
              excludedDates: Array.isArray(eventData.excludedDates) ? eventData.excludedDates : ev.excludedDates,
              completedDates: Array.isArray(eventData.completedDates) ? eventData.completedDates : ev.completedDates,
            }, ev.id);
            return updatedEvent;
          }
          return ev;
        });
      });
      return updatedEvent || sanitizeEvent(eventData, now);
    }

    // Mode C: Create brand new event / recurring series
    const newEvent = sanitizeEvent({
      ...eventData,
      id: now,
      createdAt: now,
      isCompleted: false,
    }, now);
    setEvents(prev => [newEvent, ...prev]);
    return newEvent;
  }, []);

  const deleteEvent = useCallback((
    id: number,
    deleteMode?: 'THIS_OCCURRENCE' | 'ALL_OCCURRENCES',
    targetOccurrenceDate?: string
  ): void => {
    // Mode A: Delete only this occurrence from a recurring series
    if (deleteMode === 'THIS_OCCURRENCE' && targetOccurrenceDate) {
      setEvents(prev => {
        // If this is a detached one-off instance, delete it directly
        const isDetached = prev.some(
          ev => ev.id === id && ev.parentEventId && ev.originalOccurrenceDate === targetOccurrenceDate
        );
        if (isDetached) {
          return prev.filter(ev => ev.id !== id);
        }

        // Otherwise add the date to the recurring event's excludedDates
        return prev.map(ev => {
          if (ev.id === id) {
            const excluded = ev.excludedDates ? [...ev.excludedDates] : [];
            if (!excluded.includes(targetOccurrenceDate)) {
              excluded.push(targetOccurrenceDate);
            }
            return { ...ev, excludedDates: excluded };
          }
          return ev;
        });
      });
      cancelNotificationsForEvent(id, targetOccurrenceDate);
      return;
    }

    // Mode B: Delete the entire series or single event (and any detached instances)
    setEvents(prev => prev.filter(ev => ev.id !== id && ev.parentEventId !== id));
    cancelNotificationsForEvent(id);
  }, []);

  const toggleEventCompleted = useCallback((id: number, targetOccurrenceDate?: string) => {
    setEvents(prev =>
      prev.map(ev => {
        if (ev.id !== id) return ev;

        // If recurring event and a specific occurrence date is provided, toggle per-date completion
        if (ev.repeatOption !== 'NONE' && targetOccurrenceDate) {
          const completedDates = ev.completedDates ? [...ev.completedDates] : [];
          const idx = completedDates.indexOf(targetOccurrenceDate);
          if (idx >= 0) {
            completedDates.splice(idx, 1);
          } else {
            completedDates.push(targetOccurrenceDate);
          }
          return { ...ev, completedDates };
        }

        // Otherwise toggle master isCompleted
        return { ...ev, isCompleted: !ev.isCompleted };
      })
    );
  }, []);

  // Recurrence getters
  const getEventsForDate = useCallback(
    (date: Date): ExpandedCalendarEvent[] => {
      return getOccurrencesForDate(events, date);
    },
    [events]
  );

  const getEventsForMonth = useCallback(
    (year: number, month: number): Map<number, ExpandedCalendarEvent[]> => {
      return getOccurrencesForMonth(events, year, month);
    },
    [events]
  );

  const upcomingArrangements = useMemo(() => {
    return getUpcomingOccurrences(events, new Date(), 60, 30);
  }, [events]);

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

  const exportCsv = useCallback((customEntries?: MinistryEntry[]) => {
    return storage.exportToCsv(customEntries || entries);
  }, [entries]);

  const createBackup = useCallback(() => {
    const json = storage.createBackupJson(entries, events, settings, notes, noteFolders);
    setSettings(prev => ({ ...prev, lastBackupDate: Date.now() }));
    return json;
  }, [entries, events, settings, notes, noteFolders]);

  const restoreBackup = useCallback((json: string) => {
    const result = storage.restoreBackup(json);
    if (!result) return false;
    setEntries(result.entries);
    if (result.events) setEvents(result.events);
    if (result.notes) setNotes(result.notes);
    if (result.noteFolders) setNoteFolders(result.noteFolders);
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
    setNotes([]);
    setNoteFolders([]);
    setTimer(DEFAULT_TIMER);
    storage.clearAll();
  }, []);

  const dismissDiscoveredBackup = useCallback(() => {
    setDiscoveredBackup(null);
  }, []);

  const restoreDiscoveredBackup = useCallback(async (mergeMode: 'replace' | 'merge' = 'merge'): Promise<boolean> => {
    try {
      const payload = await BackupManager.restoreFromCloud();
      if (!payload) return false;

      if (mergeMode === 'merge' && (entries.length > 0 || events.length > 0 || notes.length > 0)) {
        const merged = mergeMinistryData(entries, events, settings, payload, notes, noteFolders);
        setEntries(merged.entries);
        setEvents(merged.events);
        setNotes(merged.notes);
        setNoteFolders(merged.noteFolders);
        setSettings(merged.settings);
      } else {
        setEntries(payload.entries || []);
        setEvents(payload.events || []);
        setNotes(payload.notes || []);
        setNoteFolders(payload.noteFolders || []);
        setSettings({
          ...settings,
          ...payload.settings,
          onboardingCompleted: true,
          isFirstLaunch: false,
          lastBackupDate: Date.now(),
        });
      }
      setDiscoveredBackup(null);
      return true;
    } catch (err) {
      console.error('Failed to restore discovered backup:', err);
      return false;
    }
  }, [entries, events, settings, notes, noteFolders]);

  const restoreWithRecoveryKey = useCallback(async (
    key: string,
    mergeMode: 'replace' | 'merge' = 'merge'
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const payload = await BackupManager.restoreFromCloud(key.trim().toUpperCase());
      if (!payload) {
        return { success: false, message: 'Backup not found for this recovery key.' };
      }

      if (mergeMode === 'merge' && (entries.length > 0 || events.length > 0 || notes.length > 0)) {
        const merged = mergeMinistryData(entries, events, settings, payload, notes, noteFolders);
        setEntries(merged.entries);
        setEvents(merged.events);
        setNotes(merged.notes);
        setNoteFolders(merged.noteFolders);
        setSettings(merged.settings);
      } else {
        setEntries(payload.entries || []);
        setEvents(payload.events || []);
        setNotes(payload.notes || []);
        setNoteFolders(payload.noteFolders || []);
        setSettings({
          ...settings,
          ...payload.settings,
          onboardingCompleted: true,
          isFirstLaunch: false,
          lastBackupDate: Date.now(),
        });
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Restore failed' };
    }
  }, [entries, events, settings, notes, noteFolders]);

  const restoreFromMTBackupFile = useCallback(async (
    fileContent: string,
    mergeMode: 'replace' | 'merge' = 'merge'
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const payload = await BackupManager.restoreFromFile(fileContent);
      if (!payload) {
        return { success: false, message: 'Invalid or corrupted backup file.' };
      }

      if (mergeMode === 'merge' && (entries.length > 0 || events.length > 0 || notes.length > 0)) {
        const merged = mergeMinistryData(entries, events, settings, payload, notes, noteFolders);
        setEntries(merged.entries);
        setEvents(merged.events);
        setNotes(merged.notes);
        setNoteFolders(merged.noteFolders);
        setSettings(merged.settings);
      } else {
        setEntries(payload.entries || []);
        setEvents(payload.events || []);
        setNotes(payload.notes || []);
        setNoteFolders(payload.noteFolders || []);
        setSettings({
          ...settings,
          ...payload.settings,
          onboardingCompleted: true,
          isFirstLaunch: false,
          lastBackupDate: Date.now(),
        });
      }
      return { success: true };
    } catch {
      return { success: false, message: 'This backup file is invalid or damaged.' };
    }
  }, [entries, events, settings, notes, noteFolders]);

  const performManualBackupNow = useCallback(async (): Promise<boolean> => {
    const res = await BackupManager.executeBackupNow(entries, events, settings, notes, noteFolders);
    if (res.success) {
      setSettings(prev => ({ ...prev, lastBackupDate: res.lastBackupAt }));
    }
    return res.success;
  }, [entries, events, settings, notes, noteFolders]);

  const downloadMTBackupFile = useCallback(async (): Promise<boolean> => {
    const success = await BackupManager.downloadMTBackupFile(entries, events, settings, notes, noteFolders);
    if (success) {
      setSettings(prev => ({ ...prev, lastBackupDate: Date.now() }));
    }
    return success;
  }, [entries, events, settings, notes, noteFolders]);

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

    const monthlyMinutes = currentMonthEntries.reduce((sum, e) => sum + (Number.isFinite(e.durationMinutes) ? e.durationMinutes : 0), 0);
    const monthlyReturnVisits = currentMonthEntries.reduce((sum, e) => sum + (Number.isFinite(e.returnVisits) ? e.returnVisits : 0), 0);
    const monthlyBibleStudies = currentMonthEntries.reduce((sum, e) => sum + (Number.isFinite(e.bibleStudies) ? e.bibleStudies : 0), 0);
    const monthlyPlacements = currentMonthEntries.reduce((sum, e) => sum + (Number.isFinite(e.placements) ? e.placements : 0), 0);

    const rawGoal = settings.publisherStatus === 'CUSTOM'
      ? settings.customGoalHours
      : PUBLISHER_STATUS_OPTIONS[settings.publisherStatus]?.defaultGoalHours || 0;
    const goalHours = Number.isFinite(rawGoal) && rawGoal > 0 ? rawGoal : 0;

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

    return {
      monthlyMinutes,
      monthlyReturnVisits,
      monthlyBibleStudies,
      monthlyPlacements,
      goalHours,
      goalProgressPercentage,
      streakMonths: streak,
      recentEntriesCount: entries.length,
      upcomingEventsCount: upcomingArrangements.length,
      monthName,
    };
  }, [entries, upcomingArrangements.length, settings]);

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
    isLoaded,
    entries,
    events,
    notes,
    noteFolders,
    settings,
    timer,
    dashboardStats,
    language,
    t,
    saveEntry,
    deleteEntry,
    saveNote,
    deleteNote,
    restoreNote,
    duplicateNote,
    togglePinNote,
    toggleArchiveNote,
    saveFolder,
    renameFolder,
    deleteFolder,
    updateHouseInNote,
    addHouseToNote,
    deleteHouseFromNote,
    reorderHousesInNote,
    saveEvent,
    deleteEvent,
    toggleEventCompleted,
    getEventsForDate,
    getEventsForMonth,
    upcomingArrangements,
    activeNotification,
    dismissActiveNotification,
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
    backupStatus,
    lastBackupAt,
    deviceRecoveryKey: identity.recoveryKey,
    deviceName: identity.deviceName,
    discoveredBackup,
    dismissDiscoveredBackup,
    restoreDiscoveredBackup,
    restoreWithRecoveryKey,
    restoreFromMTBackupFile,
    performManualBackupNow,
    downloadMTBackupFile,
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
