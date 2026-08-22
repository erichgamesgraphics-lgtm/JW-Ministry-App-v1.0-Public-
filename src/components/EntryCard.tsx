import React from 'react';
import { Pencil, Trash2, MapPin, FileText } from 'lucide-react';
import { MinistryEntry, MINISTRY_TYPE_OPTIONS } from '../types.ts';

interface EntryCardProps {
  entry: MinistryEntry;
  onEdit: (entry: MinistryEntry) => void;
  onDelete: (id: number) => void;
  className?: string;
}

export const EntryCard: React.FC<EntryCardProps> = ({ entry, onEdit, onDelete, className = '' }) => {
  const hours = Math.floor(entry.durationMinutes / 60);
  const minutes = entry.durationMinutes % 60;
  const durationText = hours > 0 ? (minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h 0m`) : `${minutes}m`;
  const typeInfo = MINISTRY_TYPE_OPTIONS[entry.ministryType] || { displayName: entry.ministryType };

  const dateFormatted = new Date(entry.dateMillis).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#131D31] p-4 sm:p-5 shadow-xs transition-all ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Badges: Duration & Ministry Type */}
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-blue-50/90 dark:bg-blue-950/60 px-3 py-1 text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400">
            {durationText}
          </div>

          <div className="rounded-xl bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300">
            {typeInfo.displayName}
          </div>
        </div>

        {/* Action icons: Edit (Blue Pencil) & Delete (Red Trash) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(entry)}
            className="p-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors cursor-pointer"
            title="Edit entry"
            aria-label="Edit entry"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            className="p-1.5 text-red-600 hover:text-red-700 dark:text-red-400 transition-colors cursor-pointer"
            title="Delete entry"
            aria-label="Delete entry"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Date */}
      <div className="mt-2.5 text-xs text-slate-400 dark:text-slate-500 font-normal">
        {dateFormatted}
      </div>

      {/* Optional Return Visits, Bible Studies, Placements, Location, Notes if any */}
      {(entry.returnVisits > 0 || entry.bibleStudies > 0 || entry.placements > 0 || entry.location || entry.notes) && (
        <div className="mt-2.5 pt-2 border-t border-slate-100/80 dark:border-slate-800/80 space-y-1.5">
          {(entry.returnVisits > 0 || entry.bibleStudies > 0 || entry.placements > 0) && (
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              {entry.returnVisits > 0 && (
                <span className="rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5">
                  {entry.returnVisits} RV
                </span>
              )}
              {entry.bibleStudies > 0 && (
                <span className="rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 px-2 py-0.5">
                  {entry.bibleStudies} Studies
                </span>
              )}
              {entry.placements > 0 && (
                <span className="rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-2 py-0.5">
                  {entry.placements} Placements
                </span>
              )}
            </div>
          )}

          {entry.location && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
              <span className="truncate">{entry.location}</span>
            </div>
          )}

          {entry.notes && (
            <div className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300">
              <FileText className="h-3 w-3 text-slate-400 shrink-0 mt-0.5" />
              <span className="line-clamp-2">{entry.notes}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
