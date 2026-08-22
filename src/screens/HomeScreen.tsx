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
import { PUBLISHER_STATUS_OPTIONS, MinistryEntry } from '../types.ts';

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
  } = useMinistry();

  // Time of day greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

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

    const hrs = Math.floor(todayMinutes / 60);
    const mins = todayMinutes % 60;
    const formatted = hrs > 0 ? (mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`) : `${mins}m`;

    return {
      todayMinutes,
      formatted,
      todayRVs,
      todayStudies,
    };
  }, [entries]);

  // Monthly totals
  const monthlyHours = Math.floor(dashboardStats.monthlyMinutes / 60);
  const monthlyRemainingMins = dashboardStats.monthlyMinutes % 60;
  const monthTotalFormatted =
    monthlyHours > 0
      ? monthlyRemainingMins > 0
        ? `${monthlyHours}h ${monthlyRemainingMins}m`
        : `${monthlyHours}h`
      : `${monthlyRemainingMins}m`;

  const statusInfo = PUBLISHER_STATUS_OPTIONS[settings.publisherStatus] || { displayName: 'Publisher', defaultGoalHours: 0 };
  const goalHours = settings.publisherStatus === 'CUSTOM' ? settings.customGoalHours : statusInfo.defaultGoalHours;
  const goalPercentage = goalHours > 0 ? Math.min(100, Math.round((dashboardStats.monthlyMinutes / 60 / goalHours) * 100)) : 0;

  // Remaining hours
  const totalGoalMinutes = goalHours * 60;
  const remainingMinutes = Math.max(0, totalGoalMinutes - dashboardStats.monthlyMinutes);
  const remainingHoursPart = Math.floor(remainingMinutes / 60);
  const remainingMinsPart = remainingMinutes % 60;
  const remainingFormatted =
    remainingHoursPart > 0
      ? remainingMinsPart > 0
        ? `${remainingHoursPart}h ${remainingMinsPart}m left`
        : `${remainingHoursPart}h left`
      : `${remainingMinsPart}m left`;

  const streakText = `${dashboardStats.streakMonths} ${dashboardStats.streakMonths === 1 ? 'Month' : 'Months'}`;

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
              JW Ministry App
            </h1>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50/90 dark:bg-blue-950/50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50 shrink-0">
            <User className="h-3 w-3" />
            <span>
              {statusInfo.displayName}
              {settings.publisherStatus === 'CUSTOM' && ` (${settings.customGoalHours}h)`}
            </span>
          </div>
        </div>
      </div>

      {/* Monthly Goal Progress Card */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#131D31] p-3.5 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
            Monthly Goal Progress
          </h2>
          <span className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400">
            {goalHours > 0 ? `${goalPercentage}%` : 'Flexible'}
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
            {monthTotalFormatted} {goalHours > 0 ? `/ ${goalHours}h` : ''}
          </span>
          <span className="text-blue-600 dark:text-blue-400 font-semibold">
            {goalHours > 0 ? remainingFormatted : `${monthTotalFormatted} recorded`}
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
          <span>Add Ministry Entry</span>
        </button>
      </div>

      {/* Section: Ministry Statistics */}
      <div className="pt-1">
        <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-2 sm:mb-2.5">
          Ministry Statistics
        </h2>

        {/* 2x2 Grid + Full-width Streak Card */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          <StatCard
            title="Today"
            value={todayStats.formatted}
            subtitle="today"
            icon={Clock}
            bgAccentColor="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
          />

          <StatCard
            title="Month Total"
            value={monthTotalFormatted}
            subtitle={dashboardStats.monthName}
            icon={Calendar}
            bgAccentColor="bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400"
          />

          <StatCard
            title="Return Visits"
            value={todayStats.todayRVs}
            subtitle={`today (${dashboardStats.monthlyReturnVisits} mo)`}
            icon={Users}
            bgAccentColor="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
          />

          <StatCard
            title="Bible Studies"
            value={todayStats.todayStudies}
            subtitle={`today (${dashboardStats.monthlyBibleStudies} mo)`}
            icon={BookOpen}
            bgAccentColor="bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400"
          />

          <div className="col-span-2">
            <StatCard
              title="Ministry Streak"
              value={streakText}
              subtitle="Active consecutive months"
              icon={Flame}
              bgAccentColor="bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
