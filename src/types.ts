export type PublisherStatusType =
  | 'PUBLISHER'
  | 'AUXILIARY_PIONEER'
  | 'AUXILIARY_PIONEER_15'
  | 'AUXILIARY_PIONEER_30'
  | 'PIONEER'
  | 'REGULAR_PIONEER_50'
  | 'SPECIAL_PIONEER'
  | 'SPECIAL_PIONEER_100'
  | 'CUSTOM';

export interface PublisherStatusInfo {
  id: PublisherStatusType;
  displayName: string;
  defaultGoalHours: number;
  description: string;
}

export const PUBLISHER_STATUS_OPTIONS: Record<PublisherStatusType, PublisherStatusInfo> = {
  PUBLISHER: {
    id: 'PUBLISHER',
    displayName: 'Publisher',
    defaultGoalHours: 0,
    description: 'Participate in the ministry according to your personal circumstances and congregation arrangements.',
  },
  AUXILIARY_PIONEER: {
    id: 'AUXILIARY_PIONEER',
    displayName: 'Auxiliary Pioneer',
    defaultGoalHours: 30,
    description: 'Set a higher monthly ministry goal for a specific period while serving as an auxiliary pioneer.',
  },
  AUXILIARY_PIONEER_15: {
    id: 'AUXILIARY_PIONEER_15',
    displayName: 'Auxiliary Pioneer (15h)',
    defaultGoalHours: 15,
    description: 'Set a higher monthly ministry goal for a specific period while serving as an auxiliary pioneer.',
  },
  AUXILIARY_PIONEER_30: {
    id: 'AUXILIARY_PIONEER_30',
    displayName: 'Auxiliary Pioneer (30h)',
    defaultGoalHours: 30,
    description: 'Set a higher monthly ministry goal for a specific period while serving as an auxiliary pioneer.',
  },
  PIONEER: {
    id: 'PIONEER',
    displayName: 'Pioneer',
    defaultGoalHours: 50,
    description: 'Set a regular pioneering ministry goal and track your progress throughout the month.',
  },
  REGULAR_PIONEER_50: {
    id: 'REGULAR_PIONEER_50',
    displayName: 'Regular Pioneer',
    defaultGoalHours: 50,
    description: 'Set a regular pioneering ministry goal and track your progress throughout the month.',
  },
  SPECIAL_PIONEER: {
    id: 'SPECIAL_PIONEER',
    displayName: 'Special Pioneer',
    defaultGoalHours: 100,
    description: 'Track a special pioneering ministry goal with a dedicated monthly target.',
  },
  SPECIAL_PIONEER_100: {
    id: 'SPECIAL_PIONEER_100',
    displayName: 'Special Pioneer',
    defaultGoalHours: 100,
    description: 'Track a special pioneering ministry goal with a dedicated monthly target.',
  },
  CUSTOM: {
    id: 'CUSTOM',
    displayName: 'Custom',
    defaultGoalHours: 50,
    description: 'Create your own ministry goal and choose the target that works for you.',
  },
};

export type MinistryTypeCategory =
  | 'HOUSE_TO_HOUSE'
  | 'PUBLIC_WITNESSING'
  | 'INFORMAL_WITNESSING'
  | 'TELEPHONE_WITNESSING'
  | 'LETTER_WRITING'
  | 'CART_WITNESSING'
  | 'OTHER';

export interface MinistryTypeInfo {
  id: MinistryTypeCategory;
  displayName: string;
  iconName: string;
}

export const MINISTRY_TYPE_OPTIONS: Record<MinistryTypeCategory, MinistryTypeInfo> = {
  HOUSE_TO_HOUSE: { id: 'HOUSE_TO_HOUSE', displayName: 'House-to-house', iconName: 'Home' },
  PUBLIC_WITNESSING: { id: 'PUBLIC_WITNESSING', displayName: 'Public witnessing', iconName: 'Globe' },
  INFORMAL_WITNESSING: { id: 'INFORMAL_WITNESSING', displayName: 'Informal witnessing', iconName: 'Coffee' },
  TELEPHONE_WITNESSING: { id: 'TELEPHONE_WITNESSING', displayName: 'Telephone witnessing', iconName: 'Phone' },
  LETTER_WRITING: { id: 'LETTER_WRITING', displayName: 'Letter writing', iconName: 'Mail' },
  CART_WITNESSING: { id: 'CART_WITNESSING', displayName: 'Cart witnessing', iconName: 'ShoppingBag' },
  OTHER: { id: 'OTHER', displayName: 'Other', iconName: 'Compass' },
};

export type ReminderOptionType =
  | 'NONE'
  | 'AT_TIME'
  | 'MINUTES_15'
  | 'MINUTES_30'
  | 'HOUR_1'
  | 'DAY_1';

export interface ReminderOptionInfo {
  id: ReminderOptionType;
  displayName: string;
  minutesBefore: number;
}

export const REMINDER_OPTIONS: Record<ReminderOptionType, ReminderOptionInfo> = {
  NONE: { id: 'NONE', displayName: 'No Reminder', minutesBefore: -1 },
  AT_TIME: { id: 'AT_TIME', displayName: 'At time of event', minutesBefore: 0 },
  MINUTES_15: { id: 'MINUTES_15', displayName: '15 minutes before', minutesBefore: 15 },
  MINUTES_30: { id: 'MINUTES_30', displayName: '30 minutes before', minutesBefore: 30 },
  HOUR_1: { id: 'HOUR_1', displayName: '1 hour before', minutesBefore: 60 },
  DAY_1: { id: 'DAY_1', displayName: '1 day before', minutesBefore: 1440 },
};

export type RepeatOptionType = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface RepeatOptionInfo {
  id: RepeatOptionType;
  displayName: string;
}

export const REPEAT_OPTIONS: Record<RepeatOptionType, RepeatOptionInfo> = {
  NONE: { id: 'NONE', displayName: 'Does not repeat' },
  DAILY: { id: 'DAILY', displayName: 'Every day' },
  WEEKLY: { id: 'WEEKLY', displayName: 'Every week' },
  MONTHLY: { id: 'MONTHLY', displayName: 'Every month' },
};

export interface MinistryEntry {
  id: number;
  dateMillis: number;
  startTimeMillis: number;
  endTimeMillis: number;
  durationMinutes: number;
  ministryType: MinistryTypeCategory;
  returnVisits: number;
  bibleStudies: number;
  placements: number;
  location: string;
  notes: string;
  isSynced: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ScheduledEvent {
  id: number;
  title: string;
  dateMillis: number;
  startTimeMillis: number;
  endTimeMillis: number;
  location: string;
  description: string;
  reminderMinutesBefore: number;
  repeatOption: RepeatOptionType;
  isCompleted: boolean;
  createdAt: number;
  googleCalendarEventId?: string;
  syncStatus?: 'synced' | 'pending' | 'error';
  lastSyncedAt?: number;
}

export type SupportedLanguage = 'en' | 'hy' | 'ru' | 'hi' | 'pa';

export interface UserSettings {
  publisherStatus: PublisherStatusType;
  customGoalHours: number;
  dailyReminderEnabled: boolean;
  dailyReminderHour: number;
  dailyReminderMinute: number;
  themeMode: 'SYSTEM' | 'LIGHT' | 'DARK';
  language: SupportedLanguage;
  notificationsEnabled: boolean;
  isFirstLaunch: boolean;
  onboardingCompleted: boolean;
  userEmail: string | null;
  userName: string | null;
  isGuest: boolean;
  lastBackupDate: number;
}

export interface GoogleDriveBackupItem {
  id: string;
  name: string;
  createdTime: string;
  modifiedTime: string;
  size?: number;
  version?: number;
  entriesCount?: number;
  eventsCount?: number;
}

export interface BackupPayload {
  version: number;
  appVersion: string;
  createdAt: string;
  createdAtMillis: number;
  publisherStatus: PublisherStatusType;
  customGoalHours: number;
  ministryEntries: MinistryEntry[];
  scheduledEvents: ScheduledEvent[];
  settings?: Partial<UserSettings>;
}

export interface TimerState {
  isRunning: boolean;
  accumulatedSeconds: number;
  startTimeMillis: number;
  lastPausedTimeMillis: number;
  notes: string;
  ministryType: MinistryTypeCategory;
  location: string;
}

export interface DailyScripture {
  text: string;
  reference: string;
  theme: string;
}

export interface DashboardStats {
  monthlyMinutes: number;
  monthlyReturnVisits: number;
  monthlyBibleStudies: number;
  monthlyPlacements: number;
  goalHours: number;
  goalProgressPercentage: number;
  streakMonths: number;
  recentEntriesCount: number;
  upcomingEventsCount: number;
  monthName: string;
}

export interface ReportsData {
  totalMinutes: number;
  totalReturnVisits: number;
  totalBibleStudies: number;
  totalPlacements: number;
  activeDays: number;
  streakMonths: number;
  monthlyHoursBreakdown: Array<{ label: string; value: number }>;
  weeklyHoursBreakdown: Array<{ label: string; value: number }>;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

export interface OAuthDiagnosticInfo {
  timestamp: string;
  origin: string;
  redirectUri: string;
  configuredClientId: string;
  hasEnvClientId: boolean;
  hasCustomClientId: boolean;
  isGisLoaded: boolean;
  lastError: {
    stage?: string;
    httpStatus?: number | string;
    errorCode?: string;
    errorMessage?: string;
    details?: string;
  } | null;
}

