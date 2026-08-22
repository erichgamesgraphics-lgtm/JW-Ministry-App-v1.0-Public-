import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Clock,
  MapPin,
  CheckCircle2,
  Trash2,
  Edit2,
} from 'lucide-react';
import { useMinistry } from '../context/MinistryContext.tsx';
import { ScheduledEvent, MinistryEntry } from '../types.ts';
import { formatDurationLocalized, formatDateLocalized, formatMonthYearLocalized } from '../translations/index.ts';

interface CalendarScreenProps {
  onOpenNewSchedule: (date?: Date) => void;
  onOpenEditSchedule: (event: ScheduledEvent) => void;
  onOpenNewEntry?: (date?: Date) => void;
  onOpenEditEntry?: (entry: MinistryEntry) => void;
}

export const CalendarScreen: React.FC<CalendarScreenProps> = ({
  onOpenNewSchedule,
  onOpenEditSchedule,
  onOpenNewEntry,
  onOpenEditEntry,
}) => {
  const {
    events,
    entries,
    toggleEventCompleted,
    deleteEvent,
    deleteEntry,
    language,
    t,
  } = useMinistry();

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
  const daysInMonth = lastDayOfMonth.getDate();

  const monthName = formatMonthYearLocalized(currentDate, language);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const isSelected = (day: number) => {
    return (
      selectedDate.getFullYear() === year &&
      selectedDate.getMonth() === month &&
      selectedDate.getDate() === day
    );
  };

  // Get events & entries for calendar day dots
  const getDayMeta = (day: number) => {
    const hasEvents = events.some(e => {
      const d = new Date(e.dateMillis);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });

    const hasEntries = entries.some(e => {
      const d = new Date(e.dateMillis);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });

    return { hasEvents, hasEntries };
  };

  // Filter events and ministry entries for selected date
  const selectedDayEvents = events.filter(e => {
    const d = new Date(e.dateMillis);
    return (
      d.getFullYear() === selectedDate.getFullYear() &&
      d.getMonth() === selectedDate.getMonth() &&
      d.getDate() === selectedDate.getDate()
    );
  });

  const selectedDayEntries = entries.filter(e => {
    const d = new Date(e.dateMillis);
    return (
      d.getFullYear() === selectedDate.getFullYear() &&
      d.getMonth() === selectedDate.getMonth() &&
      d.getDate() === selectedDate.getDate()
    );
  });

  const selectedDateFormatted = formatDateLocalized(selectedDate, language, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const getMinistryTypeDisplayName = (type: string) => {
    switch (type) {
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
        return type;
    }
  };

  return (
    <div className="space-y-4 pb-24 max-w-lg mx-auto">
      {/* Screen Title */}
      <div className="pt-2 flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {t.calendar.title}
        </h1>
      </div>

      {/* Main Calendar Card */}
      <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#131D31] p-5 shadow-xs">
        {/* Month Selector */}
        <div className="flex items-center justify-between px-1 mb-4">
          <button
            onClick={prevMonth}
            className="flex h-8 w-8 items-center justify-center rounded-full text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors cursor-pointer"
            title={t.calendar.prevMonth}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {monthName}
          </span>

          <button
            onClick={nextMonth}
            className="flex h-8 w-8 items-center justify-center rounded-full text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors cursor-pointer"
            title={t.calendar.nextMonth}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
          <span>{t.calendar.daysOfWeek.sun}</span>
          <span>{t.calendar.daysOfWeek.mon}</span>
          <span>{t.calendar.daysOfWeek.tue}</span>
          <span>{t.calendar.daysOfWeek.wed}</span>
          <span>{t.calendar.daysOfWeek.thu}</span>
          <span>{t.calendar.daysOfWeek.fri}</span>
          <span>{t.calendar.daysOfWeek.sat}</span>
        </div>

        {/* Month Dates Grid */}
        <div className="grid grid-cols-7 gap-y-2 text-center text-sm">
          {/* Empty cells before start of month */}
          {Array.from({ length: startDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="h-9 w-9" />
          ))}

          {/* Month Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const selected = isSelected(day);
            const { hasEvents, hasEntries } = getDayMeta(day);

            return (
              <div key={`day-${day}`} className="flex flex-col items-center justify-center">
                <button
                  onClick={() => setSelectedDate(new Date(year, month, day))}
                  className={`relative flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all cursor-pointer ${
                    selected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {day}
                </button>

                {/* Dots indicator */}
                <div className="flex items-center gap-1 h-1.5 mt-0.5">
                  {hasEntries && (
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                  )}
                  {hasEvents && (
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend Row */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-5 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            <span>{t.calendar.legendMinistry}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span>{t.calendar.legendArrangement}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onOpenNewSchedule(selectedDate)}
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#2A3B4C] dark:bg-slate-800 hover:bg-slate-800 text-white font-semibold py-3.5 px-4 text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
        >
          <CalendarIcon className="h-4 w-4" />
          <span>{t.calendar.scheduleMinistry}</span>
        </button>

        <button
          onClick={() => onOpenNewEntry ? onOpenNewEntry(selectedDate) : onOpenNewSchedule(selectedDate)}
          className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#131D31] hover:bg-slate-50 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 font-semibold py-3.5 px-4 text-xs sm:text-sm transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>{t.calendar.recordEntry}</span>
        </button>
      </div>

      {/* Selected Date Details */}
      <div className="space-y-3 pt-2">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          {selectedDateFormatted}
        </h2>

        {selectedDayEvents.length === 0 && selectedDayEntries.length === 0 ? (
          /* Empty state */
          <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#131D31] p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 mb-3">
              <CalendarIcon className="h-7 w-7" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {t.calendar.noActivityDay}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {t.calendar.noActivityDayDesc}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Scheduled Events */}
            {selectedDayEvents.map(ev => {
              const startStr = new Date(ev.startTimeMillis).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const endStr = new Date(ev.endTimeMillis).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div
                  key={ev.id}
                  className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#131D31] p-4 sm:p-5 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="inline-flex items-center gap-1 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 text-xs font-semibold">
                          <span>{t.calendar.scheduledArrangementBadge}</span>
                        </div>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {ev.title}
                      </h3>
                      <div className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{startStr} – {endStr}</span>
                      </div>
                      {ev.location && (
                        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                          <MapPin className="h-3 w-3" />
                          <span>{ev.location}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleEventCompleted(ev.id)}
                        className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                          ev.isCompleted ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50' : 'text-slate-400 hover:text-emerald-600'
                        }`}
                        title={t.common.save}
                      >
                        <CheckCircle2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => onOpenEditSchedule(ev)}
                        className="p-1.5 text-blue-600 hover:text-blue-700 cursor-pointer"
                        title={t.common.edit}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteEvent(ev.id)}
                        className="p-1.5 text-red-600 hover:text-red-700 cursor-pointer"
                        title={t.common.delete}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Ministry Entries */}
            {selectedDayEntries.map(entry => {
              const durationText = formatDurationLocalized(entry.durationMinutes, language);
              const typeDisplayName = getMinistryTypeDisplayName(entry.ministryType);

              return (
                <div
                  key={entry.id}
                  className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#131D31] p-4 sm:p-5 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 px-3 py-1 text-xs font-bold">
                        {durationText}
                      </span>
                      <span className="rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 text-xs font-medium">
                        {typeDisplayName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {onOpenEditEntry && (
                        <button
                          onClick={() => onOpenEditEntry(entry)}
                          className="p-1.5 text-blue-600 hover:text-blue-700 cursor-pointer"
                          title={t.common.edit}
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        className="p-1.5 text-red-600 hover:text-red-700 cursor-pointer"
                        title={t.common.delete}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
