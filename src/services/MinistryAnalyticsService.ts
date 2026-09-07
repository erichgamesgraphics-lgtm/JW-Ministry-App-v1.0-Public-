import {
  MinistryEntry,
  ScheduledEvent,
  UserSettings,
  MinistryAnalyticsSummary,
  PUBLISHER_STATUS_OPTIONS,
} from '../types.ts';
import { SupportedLanguage, formatMonthYearLocalized } from '../translations/index.ts';

export class MinistryAnalyticsService {
  /**
   * Generates a read-only structured summary of user's current progress
   * for passing to Ministry AI. No personal sensitive data is exposed.
   */
  static generateSummary(
    entries: MinistryEntry[],
    scheduledEvents: ScheduledEvent[],
    settings: UserSettings,
    lang: SupportedLanguage = 'en'
  ): MinistryAnalyticsSummary {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11
    const currentDay = now.getDate();

    // Total days in current month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysRemaining = Math.max(1, daysInMonth - currentDay);

    // Filter current month entries
    const monthEntries = entries.filter((e) => {
      const d = new Date(e.dateMillis);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });

    const completedMinutesTotal = monthEntries.reduce(
      (sum, e) => sum + (e.durationMinutes || 0),
      0
    );
    const completedHours = Math.round((completedMinutesTotal / 60) * 10) / 10;

    // Determine goal
    let goalHours = 0;
    const statusOption = PUBLISHER_STATUS_OPTIONS[settings.publisherStatus];
    if (settings.publisherStatus === 'CUSTOM') {
      goalHours = settings.customGoalHours || 0;
    } else if (statusOption) {
      goalHours = statusOption.defaultGoalHours;
    }

    const remainingHours = Math.max(0, Math.round((goalHours - completedHours) * 10) / 10);
    const progressPercentage =
      goalHours > 0 ? Math.min(100, Math.round((completedHours / goalHours) * 100)) : 100;
    const hoursPerRemainingDayNeeded =
      remainingHours > 0 ? Math.round((remainingHours / daysRemaining) * 10) / 10 : 0;

    const returnVisitsThisMonth = monthEntries.reduce(
      (sum, e) => sum + (e.returnVisits || 0),
      0
    );
    const bibleStudiesThisMonth = monthEntries.reduce(
      (sum, e) => sum + (e.bibleStudies || 0),
      0
    );
    const placementsThisMonth = monthEntries.reduce(
      (sum, e) => sum + (e.placements || 0),
      0
    );
    const videoShowingsThisMonth = 0;

    // Recent entries summary (last 4)
    const sortedEntries = [...entries].sort((a, b) => b.dateMillis - a.dateMillis).slice(0, 4);
    const recentEntriesSummary = sortedEntries
      .map((e) => {
        const d = new Date(e.dateMillis);
        const hrs = (e.durationMinutes / 60).toFixed(1);
        return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${hrs}h (${e.ministryType})`;
      })
      .join(', ');

    // Upcoming scheduled events (next 7 days)
    const nowMillis = now.getTime();
    const futureLimit = nowMillis + 7 * 24 * 60 * 60 * 1000;
    const upcomingEvents = scheduledEvents
      .filter((ev) => ev.dateMillis >= nowMillis && ev.dateMillis <= futureLimit)
      .sort((a, b) => a.dateMillis - b.dateMillis)
      .slice(0, 3);

    const scheduledMinistrySummary = upcomingEvents
      .map((ev) => {
        const d = new Date(ev.dateMillis);
        const timeStr = ev.startTimeMillis
          ? new Date(ev.startTimeMillis).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'arranged time';
        return `${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at ${timeStr} (${ev.title})`;
      })
      .join(', ');

    return {
      monthName: formatMonthYearLocalized(now, lang),
      publisherStatus: statusOption ? statusOption.displayName : settings.publisherStatus,
      goalHours,
      completedHours,
      completedMinutesTotal,
      remainingHours,
      progressPercentage,
      daysRemainingInMonth: daysRemaining,
      hoursPerRemainingDayNeeded,
      returnVisitsThisMonth,
      bibleStudiesThisMonth,
      placementsThisMonth,
      videoShowingsThisMonth,
      totalEntriesThisMonth: monthEntries.length,
      recentEntriesSummary: recentEntriesSummary || undefined,
      scheduledMinistrySummary: scheduledMinistrySummary || undefined,
    };
  }
}
