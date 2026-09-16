import React, { useState } from 'react';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Search,
  Clock,
  Radio,
} from 'lucide-react';
import { useMinistry } from '../context/MinistryContext.tsx';
import { EntryCard } from '../components/EntryCard.tsx';
import { MinistryEntry } from '../types.ts';

interface ActivityScreenProps {
  onOpenNewEntry: () => void;
  onOpenEditEntry: (entry: MinistryEntry) => void;
}

export const ActivityScreen: React.FC<ActivityScreenProps> = ({
  onOpenEditEntry,
}) => {
  const {
    entries,
    deleteEntry,
    timer,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopAndSaveTimer,
    resetTimer,
    currentTimerElapsedSeconds,
    t,
  } = useMinistry();

  const [searchQuery, setSearchQuery] = useState('');

  // Format seconds to HH:MM:SS
  const formatTimer = (totalSecs: number) => {
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  const handleStopAndSave = () => {
    const created = stopAndSaveTimer();
    if (created) {
      onOpenEditEntry(created);
    }
  };

  // Filter entries
  const filteredEntries = entries.filter(e => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchesNotes = e.notes && e.notes.toLowerCase().includes(q);
    const matchesLocation = e.location && e.location.toLowerCase().includes(q);
    const matchesType = e.ministryType.toLowerCase().includes(q);
    return matchesNotes || matchesLocation || matchesType;
  });

  return (
    <div className="space-y-4 pb-20 sm:pb-24 max-w-lg mx-auto">
      {/* Live Service Timer Widget */}
      <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#131D31] p-5 sm:p-6 shadow-xs text-center">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className={`h-4 w-4 ${timer.isRunning ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`} />
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              {t.activity.liveTimerTitle}
            </h2>
          </div>
          {timer.isRunning && (
            <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 animate-pulse">
              {t.activity.timerRunning}
            </span>
          )}
        </div>

        {/* Large Digital Clock Display */}
        <div className="my-4 text-4xl sm:text-5xl font-mono font-extrabold tracking-widest text-[#1D61E7] dark:text-blue-400">
          {formatTimer(currentTimerElapsedSeconds)}
        </div>

        {/* Timer Control Buttons */}
        <div className="mt-2">
          {!timer.isRunning && timer.accumulatedSeconds === 0 ? (
            <button
              onClick={() => startTimer('HOUSE_TO_HOUSE')}
              className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] py-3.5 sm:py-4 px-6 text-base font-semibold text-white shadow-xs shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="h-5 w-5 fill-current" />
              <span>{t.activity.startTimer}</span>
            </button>
          ) : timer.isRunning ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={pauseTimer}
                className="flex items-center justify-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 py-3.5 px-4 text-sm font-bold text-white transition-all cursor-pointer"
              >
                <Pause className="h-4 w-4 fill-current" />
                <span>{t.activity.pauseTimer}</span>
              </button>

              <button
                onClick={handleStopAndSave}
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 py-3.5 px-4 text-sm font-bold text-white transition-all cursor-pointer shadow-xs"
              >
                <Square className="h-4 w-4 fill-current" />
                <span>{t.activity.stopAndSave}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <button
                onClick={resumeTimer}
                className="flex items-center justify-center gap-1.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 py-3 px-3 text-xs sm:text-sm font-bold text-white transition-all cursor-pointer"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>{t.activity.resumeTimer}</span>
              </button>

              <button
                onClick={handleStopAndSave}
                className="flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 py-3 px-3 text-xs sm:text-sm font-bold text-white transition-all cursor-pointer"
              >
                <Square className="h-4 w-4 fill-current" />
                <span>{t.activity.saveEntry}</span>
              </button>

              <button
                onClick={resetTimer}
                className="flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 active:scale-95 py-3 px-3 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                <span>{t.activity.resetTimer}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* History Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {t.activity.historyTitle}
          </h2>
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
            {filteredEntries.length} {t.common.entriesPlural(filteredEntries.length)}
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t.activity.searchPlaceholder}
            className="w-full rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#131D31] py-3.5 pl-10 pr-4 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 shadow-xs focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Entries List */}
        {filteredEntries.length === 0 ? (
          <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#131D31] p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 mb-3">
              <Clock className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {t.activity.noEntries}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {searchQuery ? t.activity.noEntriesQuery : t.activity.noEntriesDesc}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEntries.map(entry => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onEdit={onOpenEditEntry}
                onDelete={deleteEntry}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
