import React, { useState } from 'react';
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
import { useMinistry } from '../context/MinistryContext.tsx';
import { StatCard } from '../components/StatCard.tsx';
import { SimpleBarChart } from '../components/SimpleBarChart.tsx';
import { storage } from '../utils/storage.ts';
import { PUBLISHER_STATUS_OPTIONS } from '../types.ts';

export const ReportsScreen: React.FC = () => {
  const { entries, settings, getReportsForPeriod } = useMinistry();

  const [periodIndex, setPeriodIndex] = useState<number>(0); // 0: Month, 1: Year, 2: All Time
  const [copiedReport, setCopiedReport] = useState(false);

  const reportData = getReportsForPeriod(periodIndex);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentMonthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const totalHours = Math.floor(reportData.totalMinutes / 60);
  const remainingMins = reportData.totalMinutes % 60;
  const hoursFormatted =
    totalHours > 0
      ? remainingMins > 0
        ? `${totalHours}h ${remainingMins}m`
        : `${totalHours}h`
      : `${remainingMins}m`;

  const decimalHours = (reportData.totalMinutes / 60).toFixed(1);

  const statusInfo = PUBLISHER_STATUS_OPTIONS[settings.publisherStatus] || { displayName: 'Publisher', defaultGoalHours: 0 };
  const goalHours = settings.publisherStatus === 'CUSTOM' ? settings.customGoalHours : statusInfo.defaultGoalHours;
  const goalPercentage = goalHours > 0 ? Math.min(100, Math.round((reportData.totalMinutes / 60 / goalHours) * 100)) : 0;

  const rawSummaryText = storage.generateReportSummary(entries, settings, currentYear, currentMonth);

  const handleShareReport = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Jehovah's Witnesses Ministry Report",
          text: rawSummaryText,
        });
      } catch {
        // user cancelled or failed, fallback to copy
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
            Reports
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
            {currentMonthName}
          </p>
        </div>

        <button
          onClick={handleShareReport}
          className="flex items-center gap-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#131D31] px-3.5 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
        >
          {copiedReport ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-emerald-600">Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="h-3.5 w-3.5" />
              <span>Share</span>
            </>
          )}
        </button>
      </div>

      {/* Period Selection Tabs: Month | Year | All Time */}
      <div className="flex border-b border-slate-200/80 dark:border-slate-800">
        {[
          { id: 0, label: 'Month' },
          { id: 1, label: 'Year' },
          { id: 2, label: 'All Time' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setPeriodIndex(tab.id)}
            className={`flex-1 py-2.5 text-center text-sm font-semibold transition-all relative cursor-pointer ${
              periodIndex === tab.id
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
            {periodIndex === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Top Goal Progress Card matching Photo 5 */}
      <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#131D31] p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            {statusInfo.displayName} Goal
          </span>
          <span className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400">
            {hoursFormatted} / {goalHours}h ({goalPercentage}%)
          </span>
        </div>

        {/* Progress Bar with dot */}
        <div className="relative my-3 h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            style={{ width: `${goalPercentage}%` }}
            className="h-full rounded-full bg-blue-600 transition-all duration-500"
          />
          {goalHours > 0 && goalPercentage < 100 && (
            <div className="absolute right-1 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-blue-600" />
          )}
        </div>
      </div>

      {/* Section: Summary Statistics */}
      <div className="space-y-3 pt-1">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Summary Statistics
        </h2>

        {/* 6 Stats Grid (2 columns) */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            title="Total Hours"
            value={hoursFormatted}
            subtitle={`${decimalHours} decimal hrs`}
            icon={Clock}
            bgAccentColor="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
          />

          <StatCard
            title="Days Active"
            value={reportData.activeDays}
            subtitle="days in period"
            icon={Calendar}
            bgAccentColor="bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400"
          />

          <StatCard
            title="Return Visits"
            value={reportData.totalReturnVisits}
            subtitle="total recorded"
            icon={Users}
            bgAccentColor="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
          />

          <StatCard
            title="Bible Studies"
            value={reportData.totalBibleStudies}
            subtitle="total recorded"
            icon={BookOpen}
            bgAccentColor="bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400"
          />

          <StatCard
            title="Placements"
            value={reportData.totalPlacements}
            subtitle="books & magazines"
            icon={FileText}
            bgAccentColor="bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
          />

          <StatCard
            title="Ministry Streak"
            value={`${reportData.streakMonths}m`}
            subtitle="consecutive months"
            icon={Flame}
            bgAccentColor="bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400"
          />
        </div>
      </div>

      {/* Section: Visual Analytics */}
      <div className="space-y-3 pt-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Visual Analytics
        </h2>

        {/* Bar Chart Breakdown */}
        <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#131D31] p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
            {periodIndex === 0 ? 'Weekly Hours Distribution' : 'Monthly Ministry Trend'}
          </h3>
          <SimpleBarChart
            data={periodIndex === 0 ? reportData.weeklyHoursBreakdown : reportData.monthlyHoursBreakdown}
            unit="h"
          />
        </div>
      </div>
    </div>
  );
};
