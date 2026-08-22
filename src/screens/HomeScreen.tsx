import React, { useMemo } from 'react';
import {
  Clock,
  Users,
  BookOpen,
  Flame,
  Calendar,
  Plus,
  User,
} from 'lucide-react';
import { useMinistry } from '../context/MinistryContext.tsx';
import { StatCard } from '../components/StatCard.tsx';
import { MinistryEntry } from '../types.ts';
import { formatDurationLocalized, formatMonthYearLocalized } from '../translations/index.ts';

interface HomeScreenProps {
  onOpenNewEntry: () => void;
  onOpenEditEntry: (entry: MinistryEntry) => void;
  onNavigateToTab: (tab: 'activity' | 'calendar' | 'reports' | 'settings') => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onOpenNewEntry,
}) => {
  const {
    dashboardStats,
    settings,
    entries,
    language,
    t,
  } = useMinistry();

  // Time of day greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t.home.greetingMorning;
    if (hour < 17) return t.home.greetingAfternoon;
    return t.home.greetingEvening;
  }, [t]);

  // Today's statistics
  const todayStats = useMemo(() => {
    const now = new Date();
    const todayEntries = entries.filter(e => {
      const d = new Date(e.dateMillis);
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    });

    const todayMinutes = todayEntries.reduce((sum, e) => sum + e.durationMinutes, 0);
    const todayRVs = todayEntries.reduce((sum, e) => sum + e.returnVisits, 0);
    const todayStudies = todayEntries.reduce((sum, e) => sum + e.bibleStudies, 0);

    const formatted = formatDurationLocalized(todayMinutes, language);

    return {
      todayMinutes,
      formatted,
      todayRVs,
      todayStudies,
    };
  }, [entries, language]);

  // Monthly totals
  const monthTotalFormatted = formatDurationLocalized(dashboardStats.monthlyMinutes, language);

  const getStatusDisplayName = () => {
    switch (settings.publisherStatus) {
      case 'PUBLISHER':
        return t.goals.publisher;
      case 'AUXILIARY_PIONEER':
      case 'AUXILIARY_PIONEER_15':
      case 'AUXILIARY_PIONEER_30':
        return t.goals.auxiliaryPioneer;
      case 'PIONEER':
      case 'REGULAR_PIONEER_50':
        return t.goals.pioneer;
      case 'SPECIAL_PIONEER':
      case 'SPECIAL_PIONEER_100':
        return t.goals.specialPioneer;
      case 'CUSTOM':
        return t.goals.custom;
      default:
        return t.goals.publisher;
    }
  };

  const getGoalHours = () => {
    switch (settings.publisherStatus) {
      case 'PUBLISHER':
        return 0;
      case 'AUXILIARY_PIONEER':
      case 'AUXILIARY_PIONEER_30':
        return 30;
      case 'AUXILIARY_PIONEER_15':
        return 15;
      case 'PIONEER':
      case 'REGULAR_PIONEER_50':
        return 50;
      case 'SPECIAL_PIONEER':
      case 'SPECIAL_PIONEER_100':
        return 100;
      case 'CUSTOM':
        return settings.customGoalHours;
      default:
        return 0;
    }
  };

  const goalHours = getGoalHours();
  const goalPercentage = goalHours > 0 ? Math.min(100, Math.round((dashboardStats.monthlyMinutes / 60 / goalHours) * 100)) : 0;

  // Remaining hours
  const totalGoalMinutes = goalHours * 60;
  const remainingMinutes = Math.max(0, totalGoalMinutes - dashboardStats.monthlyMinutes);
  const remainingFormatted = `${formatDurationLocalized(remainingMinutes, language)} ${t.common.left}`;

  const streakText = t.common.monthsPlural(dashboardStats.streakMonths);
  const currentMonthName = formatMonthYearLocalized(new Date(), language);

  return (
    <div className="space-y-3 sm:space-y-4 pb-20 sm:pb-24 max-w-lg mx-auto">
      {/* Top Greeting Header */}
      <div className="pt-0.5 sm:pt-1">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400">
              {greeting}
            </p>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-0.5">
              {t.common.appName}
            </h1>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50/90 dark:bg-blue-950/50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50 shrink-0">
            <User className="h-3 w-3" />
            <span>
              {getStatusDisplayName()}
              {settings.publisherStatus === 'CUSTOM' && ` (${settings.customGoalHours}${t.common.hoursShort})`}
            </span>
          </div>
        </div>
      </div>

      {/* Monthly Goal Progress Card */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#131D31] p-3.5 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
            {t.home.thisMonthSummary}
          </h2>
          <span className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400">
            {goalHours > 0 ? `${goalPercentage}%` : t.goals.noFixedHours}
          </span>
        </div>

        {/* Progress Bar with End Dot */}
        <div className="relative my-2.5 sm:my-3 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800/80 overflow-hidden">
          <div
            style={{ width: `${goalPercentage}%` }}
            className="h-full rounded-full bg-blue-600 transition-all duration-500"
          />
        </div>

        <div className="flex items-center justify-between text-[11px] sm:text-xs font-medium">
          <span className="text-slate-500 dark:text-slate-400">
            {monthTotalFormatted} {goalHours > 0 ? `/ ${goalHours}${t.common.hoursShort}` : ''}
          </span>
          <span className="text-blue-600 dark:text-blue-400 font-semibold">
            {goalHours > 0 ? remainingFormatted : `${monthTotalFormatted}`}
          </span>
        </div>
      </div>

      {/* Primary Action Button: + Add Ministry Entry (Compact Mobile Touch Target) */}
      <div>
        <button
          onClick={onOpenNewEntry}
          className="w-full rounded-xl sm:rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] py-3 sm:py-3.5 px-4 text-sm sm:text-base font-semibold text-white shadow-xs shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2.5]" />
          <span>{t.home.logService}</span>
        </button>
      </div>

      {/* Section: Ministry Statistics */}
      <div className="pt-1">
        <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-2 sm:mb-2.5">
          {t.home.todayActivity}
        </h2>

        {/* 2x2 Grid + Full-width Streak Card */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          <StatCard
            title={t.common.today}
            value={todayStats.formatted}
            subtitle={t.common.today.toLowerCase()}
            icon={Clock}
            bgAccentColor="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
          />

          <StatCard
            title={t.common.month}
            value={monthTotalFormatted}
            subtitle={currentMonthName}
            icon={Calendar}
            bgAccentColor="bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400"
          />

          <StatCard
            title={t.home.returnVisits}
            value={todayStats.todayRVs}
            subtitle={`${t.common.today.toLowerCase()} (${dashboardStats.monthlyReturnVisits} ${t.common.month.toLowerCase()})`}
            icon={Users}
            bgAccentColor="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
          />

          <StatCard
            title={t.home.bibleStudies}
            value={todayStats.todayStudies}
            subtitle={`${t.common.today.toLowerCase()} (${dashboardStats.monthlyBibleStudies} ${t.common.month.toLowerCase()})`}
            icon={BookOpen}
            bgAccentColor="bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400"
          />

          <div className="col-span-2">
            <StatCard
              title={t.common.streak}
              value={streakText}
              subtitle={t.common.allTime}
              icon={Flame}
              bgAccentColor="bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
