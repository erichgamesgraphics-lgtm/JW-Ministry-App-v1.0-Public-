import React from 'react';
import { Pencil, Trash2, MapPin, FileText } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { MinistryEntry } from '../types.ts';
import { useMinistry } from '../context/MinistryContext.tsx';
import { formatDateLocalized, formatDurationLocalized } from '../translations/index.ts';
import { interactiveSpring } from '../utils/liquidGlass.ts';

interface EntryCardProps {
  entry: MinistryEntry;
  onEdit: (entry: MinistryEntry) => void;
  onDelete: (id: number) => void;
  className?: string;
}

export const EntryCard: React.FC<EntryCardProps> = ({ entry, onEdit, onDelete, className = '' }) => {
  const { language, t } = useMinistry();
  const shouldReduceMotion = useReducedMotion();

  const durationText = formatDurationLocalized(entry.durationMinutes, language);

  const getMinistryTypeDisplayName = () => {
    switch (entry.ministryType) {
      case 'HOUSE_TO_HOUSE':
        return t.ministryTypes.houseToHouse;
      case 'PUBLIC_WITNESSING':
        return t.ministryTypes.publicWitnessing;
      case 'INFORMAL_WITNESSING':
        return t.ministryTypes.informalWitnessing;
      case 'TELEPHONE_WITNESSING':
        return t.ministryTypes.telephoneWitnessing;
      case 'LETTER_WRITING':
        return t.ministryTypes.letterWriting;
      case 'CART_WITNESSING':
        return t.ministryTypes.cartWitnessing;
      case 'OTHER':
        return t.ministryTypes.other;
      default:
        return entry.ministryType;
    }
  };

  const dateFormatted = formatDateLocalized(entry.dateMillis, language, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <motion.div
      whileHover={!shouldReduceMotion ? { y: -2, scale: 1.006 } : undefined}
      whileTap={!shouldReduceMotion ? { scale: 0.992 } : undefined}
      transition={interactiveSpring}
      className={`relative overflow-hidden rounded-3xl border border-white/60 dark:border-white/10 bg-white/80 dark:bg-[#131D31]/80 backdrop-blur-md p-4 sm:p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05),inset_0_1px_0_0_rgba(255,255,255,0.7)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.35),inset_0_1px_0_0_rgba(255,255,255,0.06)] transition-colors select-none ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Badges: Duration & Ministry Type */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="rounded-xl bg-blue-50/90 dark:bg-blue-950/60 px-3 py-1 text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50">
            {durationText}
          </div>

          <div className="rounded-xl bg-slate-100/90 dark:bg-slate-800/90 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200/40 dark:border-slate-700/40">
            {getMinistryTypeDisplayName()}
          </div>
        </div>

        {/* Action icons: Edit (Blue Pencil) & Delete (Red Trash) */}
        <div className="flex items-center gap-2 shrink-0">
          <motion.button
            whileHover={!shouldReduceMotion ? { scale: 1.12 } : undefined}
            whileTap={!shouldReduceMotion ? { scale: 0.9 } : undefined}
            onClick={() => onEdit(entry)}
            className="p-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
            title={t.common.edit}
            aria-label={t.common.edit}
          >
            <Pencil className="h-4 w-4" />
          </motion.button>
          <motion.button
            whileHover={!shouldReduceMotion ? { scale: 1.12 } : undefined}
            whileTap={!shouldReduceMotion ? { scale: 0.9 } : undefined}
            onClick={() => onDelete(entry.id)}
            className="p-1.5 text-red-600 hover:text-red-700 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
            title={t.common.delete}
            aria-label={t.common.delete}
          >
            <Trash2 className="h-4 w-4" />
          </motion.button>
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
                  {entry.returnVisits} {t.common.rvShort}
                </span>
              )}
              {entry.bibleStudies > 0 && (
                <span className="rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 px-2 py-0.5">
                  {entry.bibleStudies} {t.common.studiesShort}
                </span>
              )}
              {entry.placements > 0 && (
                <span className="rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-2 py-0.5">
                  {entry.placements} {t.common.placementsShort}
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
    </motion.div>
  );
};
