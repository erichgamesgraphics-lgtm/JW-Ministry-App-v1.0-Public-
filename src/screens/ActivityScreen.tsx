import React, { useState } from 'react';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Clock,
  Search,
  Check
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
  } = useMinistry();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSaveSuccessAlert, setShowSaveSuccessAlert] = useState(false);

  // Format stopwatch seconds into HH:MM:SS
  const formatTimer = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStopAndSave = () => {
    const saved = stopAndSaveTimer();
    if (saved) {
      setShowSaveSuccessAlert(true);
      setTimeout(() => setShowSaveSuccessAlert(false), 3000);
    }
  };

  // Filter entries by search query
  const filteredEntries = entries.filter(e => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.ministryType.toLowerCase().includes(q) ||
      (e.location && e.location.toLowerCase().includes(q)) ||
      (e.notes && e.notes.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4 pb-24 max-w-lg mx-auto">
      {/* Screen Title */}
      <div className="pt-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Activity
        </h1>
      </div>

      {/* Success Banner when timer saved */}
      {showSaveSuccessAlert && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 p-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300 animate-fade-in">
          <Check className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>Ministry time saved to records successfully!</span>
        </div>
      )}

      {/* Ministry Timer Card */}
      <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#131D31] p-6 shadow-xs text-center">
        {/* Top Header */}
        <div className="flex items-center justify-center gap-2 text-slate-700 dark:text-slate-200 text-sm font-semibold">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-white dark:bg-slate-300 dark:text-slate-900">
            <Clock className="h-3 w-3 stroke-[2.5]" />
          </div>
          <span>Ministry Timer</span>
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
              <span>Start</span>
            </button>
          ) : timer.isRunning ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={pauseTimer}
                className="flex items-center justify-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 py-3.5 px-4 text-sm font-bold text-white transition-all cursor-pointer"
              >
                <Pause className="h-4 w-4 fill-current" />
                <span>Pause</span>
              </button>

              <button
                onClick={handleStopAndSave}
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 py-3.5 px-4 text-sm font-bold text-white transition-all cursor-pointer shadow-xs"
              >
                <Square className="h-4 w-4 fill-current" />
                <span>Stop & Save</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <button
                onClick={resumeTimer}
                className="flex items-center justify-center gap-1.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 py-3 px-3 text-xs sm:text-sm font-bold text-white transition-all cursor-pointer"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Resume</span>
              </button>

              <button
                onClick={handleStopAndSave}
                className="flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 py-3 px-3 text-xs sm:text-sm font-bold text-white transition-all cursor-pointer"
              >
                <Square className="h-4 w-4 fill-current" />
                <span>Save</span>
              </button>

              <button
                onClick={resetTimer}
                className="flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 active:scale-95 py-3 px-3 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Reset</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* History Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            History
          </h2>
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
            {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        {/* Search Bar matching screenshot */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by type, location, or notes..."
            className="w-full rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#131D31] py-3.5 pl-10 pr-4 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Entries List */}
        {filteredEntries.length === 0 ? (
          <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#131D31] p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 mb-3">
              <Clock className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              No entries found
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {searchQuery ? 'Try adjusting your search query' : 'Record your ministry activity or use the live timer above.'}
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
