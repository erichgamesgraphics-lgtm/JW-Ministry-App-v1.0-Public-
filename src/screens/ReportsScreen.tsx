import React, { useState, useMemo } from 'react';
import {
  Share2,
  Clock,
  Calendar,
  Users,
  BookOpen,
  FileText,
  Flame,
  Check,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useMinistry } from '../context/MinistryContext.tsx';
import { StatCard } from '../components/StatCard.tsx';
import { SimpleBarChart } from '../components/SimpleBarChart.tsx';
import { storage } from '../utils/storage.ts';
import { formatDurationLocalized, formatMonthYearLocalized } from '../translations/index.ts';
import { interactiveSpring, liquidSpring } from '../utils/liquidGlass.ts';

export const ReportsScreen: React.FC = () => {
  const { entries, settings, getReportsForPeriod, language, t } = useMinistry();
  const shouldReduceMotion = useReducedMotion();

  const [periodIndex, setPeriodIndex] = useState<number>(0); // 0: Month, 1: Year, 2: All Time
  const [copiedReport, setCopiedReport] = useState(false);

  // Memoize report calculation to guarantee smooth 60 FPS transitions
  const reportData = useMemo(() => {
    return getReportsForPeriod(periodIndex);
  }, [getReportsForPeriod, periodIndex]);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentMonthName = formatMonthYearLocalized(now, language);

  const hoursFormatted = formatDurationLocalized(reportData.totalMinutes, language);
  const decimalHours = (reportData.totalMinutes / 60).toFixed(1);

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
  const goalPercentage = goalHours > 0 ? Math.min(100, Math.round((reportData.totalMinutes / 60 / goalHours) * 100)) : 0;

  const rawSummaryText = storage.generateReportSummary(entries, settings, currentYear, currentMonth, language);

  const handleShareReport = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${t.common.appName} ${t.reports.title}`,
          text: rawSummaryText,
        });
      } catch {
        handleCopyReport();
      }
    } else {
      handleCopyReport();
    }
  };

  const handleCopyReport = () => {
    navigator.clipboard.writeText(rawSummaryText);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  return (
    <div className="space-y-4 pb-24 max-w-lg mx-auto">
      {/* Header with Title and Share Button */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t.reports.title}
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
            {currentMonthName}
          </p>
        </div>

        <motion.button
          whileHover={!shouldReduceMotion ? { scale: 1.05 } : undefined}
          whileTap={!shouldReduceMotion ? { scale: 0.94 } : undefined}
          transition={interactiveSpring}
          onClick={handleShareReport}
          className="flex items-center gap-1.5 rounded-2xl border border-white/60 dark:border-white/10 bg-white/80 dark:bg-[#131D31]/80 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer select-none"
        >
          {copiedReport ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-emerald-600 font-bold">{t.reports.copied}</span>
            </>
          ) : (
            <>
              <Share2 className="h-3.5 w-3.5" />
              <span>{t.reports.share}</span>
            </>
          )}
        </motion.button>
      </div>

      {/* Period Selection Tabs: Month | Year | All Time with Liquid Sliding Highlight */}
      <div className="relative flex rounded-2xl p-1 bg-slate-200/50 dark:bg-slate-800/60 backdrop-blur-md border border-white/40 dark:border-white/5">
        {[
          { id: 0, label: t.reports.tabMonth },
          { id: 1, label: t.reports.tabYear },
          { id: 2, label: t.reports.tabAllTime },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setPeriodIndex(tab.id)}
            className={`relative flex-1 py-2 text-center text-xs sm:text-sm font-semibold transition-colors cursor-pointer select-none z-10 ${
              periodIndex === tab.id
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {periodIndex === tab.id && (
              <motion.div
                layoutId="reports-tab-glider"
                transition={liquidSpring}
                className="absolute inset-0 rounded-xl bg-white dark:bg-[#131D31] shadow-xs border border-white/60 dark:border-white/10 -z-10"
              />
            )}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Top Goal Progress Card */}
      <motion.div
        whileHover={!shouldReduceMotion ? { y: -2 } : undefined}
        transition={interactiveSpring}
        className="rounded-3xl border border-white/60 dark:border-white/10 bg-white/80 dark:bg-[#131D31]/80 backdrop-blur-md p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05),inset_0_1px_0_0_rgba(255,255,255,0.7)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.35),inset_0_1px_0_0_rgba(255,255,255,0.06)]"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            {getStatusDisplayName()} {t.common.goal}
          </span>
          <span className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400">
            {hoursFormatted} {goalHours > 0 ? `/ ${goalHours}${t.common.hoursShort} (${goalPercentage}%)` : ''}
          </span>
        </div>

        {/* Progress Bar with Liquid Motion */}
        <div className="relative my-3 h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-inner">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${goalPercentage}%` }}
            transition={shouldReduceMotion ? { duration: 0.2 } : liquidSpring}
            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 shadow-xs"
          />
        </div>
      </motion.div>

      {/* Section: Summary Statistics */}
      <div className="space-y-3 pt-1">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          {t.reports.summaryStats}
        </h2>

        {/* 6 Stats Grid (2 columns) */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            title={t.reports.totalHours}
            value={hoursFormatted}
            subtitle={`${decimalHours} ${t.reports.decimalHours}`}
            icon={Clock}
            bgAccentColor="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
          />

          <StatCard
            title={t.reports.daysActive}
            value={reportData.activeDays}
            subtitle={t.reports.daysInPeriod}
            icon={Calendar}
            bgAccentColor="bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400"
          />

          <StatCard
            title={t.reports.returnVisits}
            value={reportData.totalReturnVisits}
            subtitle={t.reports.totalRecorded}
            icon={Users}
            bgAccentColor="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
          />

          <StatCard
            title={t.reports.bibleStudies}
            value={reportData.totalBibleStudies}
            subtitle={t.reports.totalRecorded}
            icon={BookOpen}
            bgAccentColor="bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400"
          />

          <StatCard
            title={t.reports.placements}
            value={reportData.totalPlacements}
            subtitle={t.reports.literaturePlacements}
            icon={FileText}
            bgAccentColor="bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
          />

          <StatCard
            title={t.reports.streak}
            value={`${reportData.streakMonths}${t.common.monthsShort}`}
            subtitle={t.reports.consecutiveMonths}
            icon={Flame}
            bgAccentColor="bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400"
          />
        </div>
      </div>

      {/* Section: Visual Analytics */}
      <div className="space-y-3 pt-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          {t.reports.visualAnalytics}
        </h2>

        {/* Bar Chart Breakdown */}
        <motion.div
          whileHover={!shouldReduceMotion ? { y: -2 } : undefined}
          transition={interactiveSpring}
          className="rounded-3xl border border-white/60 dark:border-white/10 bg-white/80 dark:bg-[#131D31]/80 backdrop-blur-md p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05),inset_0_1px_0_0_rgba(255,255,255,0.7)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.35),inset_0_1px_0_0_rgba(255,255,255,0.06)]"
        >
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
            {periodIndex === 0 ? t.reports.weeklyDistribution : t.reports.monthlyTrend}
          </h3>
          <SimpleBarChart
            data={periodIndex === 0 ? reportData.weeklyHoursBreakdown : reportData.monthlyHoursBreakdown}
            unit="h"
          />
        </motion.div>
      </div>
    </div>
  );
};
