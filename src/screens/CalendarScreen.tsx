import React, { useState, useMemo, useEffect } from 'react';
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
  Repeat,
  RefreshCw,
} from 'lucide-react';
import { GoogleCalendarConfirmModal } from '../components/GoogleCalendarConfirmModal.tsx';
import { useMinistry } from '../context/MinistryContext.tsx';
import { ScheduledEvent, ExpandedCalendarEvent, MinistryEntry } from '../types.ts';
import { formatDurationLocalized, formatDateLocalized, formatMonthYearLocalized, formatTimeLocalized } from '../translations/index.ts';

interface CalendarScreenProps {
  onOpenNewSchedule: (date?: Date) => void;
  onOpenEditSchedule: (event: ScheduledEvent | ExpandedCalendarEvent) => void;
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
    entries,
    getEventsForMonth,
    getEventsForDate,
    toggleEventCompleted,
    deleteEvent,
    deleteEntry,
    language,
    t,
    isGoogleCalendarConnected,
    googleUser,
    connectGoogleCalendar,
    syncScheduleToGoogleCalendar,
    syncAllSchedulesToGoogleCalendar,
  } = useMinistry();

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [eventToDelete, setEventToDelete] = useState<ExpandedCalendarEvent | null>(null);
  const [eventToSyncWithGoogle, setEventToSyncWithGoogle] = useState<ExpandedCalendarEvent | null>(null);
  const [showSyncAllModal, setShowSyncAllModal] = useState<boolean>(false);
  const [isGoogleSyncing, setIsGoogleSyncing] = useState<boolean>(false);
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (eventToDelete) {
      const originalStyle = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [eventToDelete]);

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

  // Pre-calculate occurrences for the whole viewed month (handles daily, weekly, monthly, yearly recurrence)
  const monthOccurrencesMap = useMemo(() => {
    return getEventsForMonth(year, month);
  }, [getEventsForMonth, year, month]);

  // Pre-calculate days in this month that have ministry entries into a Set for instant O(1) dot lookups
  const daysWithEntriesSet = useMemo(() => {
    const set = new Set<number>();
    for (const e of entries) {
      const d = new Date(e.dateMillis);
      if (d.getFullYear() === year && d.getMonth() === month) {
        set.add(d.getDate());
      }
    }
    return set;
  }, [entries, year, month]);

  // Get events & entries for calendar day dots (O(1) lookup per day)
  const getDayMeta = (day: number) => {
    const dayEvents = monthOccurrencesMap.get(day);
    const hasEvents = Boolean(dayEvents && dayEvents.length > 0);
    const hasEntries = daysWithEntriesSet.has(day);

    return { hasEvents, hasEntries };
  };

  // Filter events and ministry entries for selected date
  const selectedDayEvents = useMemo(() => {
    return getEventsForDate(selectedDate);
  }, [getEventsForDate, selectedDate]);

  const selectedDayEntries = useMemo(() => {
    return entries.filter(e => {
      const d = new Date(e.dateMillis);
      return (
        d.getFullYear() === selectedDate.getFullYear() &&
        d.getMonth() === selectedDate.getMonth() &&
        d.getDate() === selectedDate.getDate()
      );
    });
  }, [entries, selectedDate]);

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

  const getRecurrenceLabel = (repeatOption: string) => {
    switch (repeatOption) {
      case 'DAILY':
        return t.scheduleModal.repeats.daily;
      case 'WEEKLY':
        return t.scheduleModal.repeats.weekly;
      case 'MONTHLY':
        return t.scheduleModal.repeats.monthly;
      case 'YEARLY':
        return t.scheduleModal.repeats.yearly;
      default:
        return null;
    }
  };

  const handleDeleteOccurrence = () => {
    if (eventToDelete) {
      deleteEvent(eventToDelete.id, 'THIS_OCCURRENCE', eventToDelete.occurrenceDateKey);
      setEventToDelete(null);
    }
  };

  const handleDeleteAll = () => {
    if (eventToDelete) {
      deleteEvent(eventToDelete.id, 'ALL_OCCURRENCES');
      setEventToDelete(null);
    }
  };

  return (
    <div className="space-y-4 pb-24 max-w-lg mx-auto">
      {/* Screen Title */}
      <div className="pt-2 flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {t.calendar.title}
        </h1>

        {isGoogleCalendarConnected ? (
          <button
            onClick={() => setShowSyncAllModal(true)}
            disabled={isGoogleSyncing}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold text-xs hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer"
            title={t.calendar.syncAllToGoogleCalendar || 'Sync all to Google Calendar'}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isGoogleSyncing ? 'animate-spin' : ''}`} />
            <span>Google Calendar</span>
          </button>
        ) : (
          <button
            onClick={connectGoogleCalendar}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer"
          >
            <CalendarIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>Google Calendar</span>
          </button>
        )}
      </div>

      {syncToastMessage && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <span>{syncToastMessage}</span>
          <button onClick={() => setSyncToastMessage(null)} className="text-emerald-600 hover:text-emerald-800 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Main Calendar Card */}
      <div
        className="rounded-3xl border border-white/60 dark:border-white/10 bg-white/80 dark:bg-[#131D31]/80 backdrop-blur-md p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05),inset_0_1px_0_0_rgba(255,255,255,0.7)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.35),inset_0_1px_0_0_rgba(255,255,255,0.06)]"
      >
        {/* Month Selector */}
        <div className="flex items-center justify-between px-1 mb-4">
          <button
            onClick={prevMonth}
            className="flex h-8 w-8 items-center justify-center rounded-full text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 active:scale-90 transition-all cursor-pointer select-none"
            title={t.calendar.prevMonth}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white select-none">
            {monthName}
          </span>

          <button
            onClick={nextMonth}
            className="flex h-8 w-8 items-center justify-center rounded-full text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 active:scale-90 transition-all cursor-pointer select-none"
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
                  className={`relative flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold active:scale-90 transition-all cursor-pointer select-none ${
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
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#2A3B4C] dark:bg-slate-800 hover:bg-slate-800 active:scale-[0.98] text-white font-semibold py-3.5 px-4 text-xs sm:text-sm shadow-xs transition-all cursor-pointer select-none"
        >
          <CalendarIcon className="h-4 w-4" />
          <span>{t.calendar.scheduleMinistry}</span>
        </button>

        <button
          onClick={() => onOpenNewEntry ? onOpenNewEntry(selectedDate) : onOpenNewSchedule(selectedDate)}
          className="flex items-center justify-center gap-2 rounded-2xl border border-white/60 dark:border-white/10 bg-white/80 dark:bg-[#131D31]/80 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] text-blue-600 dark:text-blue-400 font-semibold py-3.5 px-4 text-xs sm:text-sm backdrop-blur-md transition-all cursor-pointer select-none"
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
            {/* Scheduled Events & Occurrences */}
            {selectedDayEvents.map(ev => {
              const startStr = formatTimeLocalized(ev.occurrenceStartTimeMillis || ev.startTimeMillis, language);
              const endStr = formatTimeLocalized(ev.occurrenceEndTimeMillis || ev.endTimeMillis, language);
              const repeatLabel = getRecurrenceLabel(ev.repeatOption);
              const isRecurringEvent = ev.isOccurrence || (ev.repeatOption && ev.repeatOption !== 'NONE') || Boolean(ev.parentEventId);

              return (
                <div
                  key={`${ev.id}-${ev.occurrenceDateKey}`}
                  className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#131D31] p-4 sm:p-5 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="inline-flex items-center gap-1 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 text-xs font-semibold">
                          <span>{t.calendar.scheduledArrangementBadge}</span>
                        </div>
                        {repeatLabel && (
                          <div className="inline-flex items-center gap-1 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 text-xs font-semibold">
                            <Repeat className="h-3 w-3" />
                            <span>{repeatLabel}</span>
                          </div>
                        )}
                        {ev.googleCalendarEventId && (
                          <div className="inline-flex items-center gap-1 rounded-md bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 px-2 py-0.5 text-xs font-semibold" title={t.calendar.googleCalendarSynced || 'Synced with Google Calendar'}>
                            <CalendarIcon className="h-3 w-3 text-sky-500" />
                            <span>Google</span>
                          </div>
                        )}
                      </div>
                      <h3 className={`text-base font-bold ${ev.isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>
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
                        onClick={() => toggleEventCompleted(ev.id, ev.occurrenceDateKey)}
                        className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                          ev.isCompleted ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50' : 'text-slate-400 hover:text-emerald-600'
                        }`}
                        title={t.common.save}
                      >
                        <CheckCircle2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setEventToSyncWithGoogle(ev)}
                        className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                          ev.googleCalendarEventId
                            ? 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40'
                            : 'text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                        title={ev.googleCalendarEventId ? (t.calendar.googleCalendarSynced || 'Synced with Google Calendar') : (t.calendar.syncToGoogleCalendar || 'Sync to Google Calendar')}
                      >
                        <CalendarIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onOpenEditSchedule(ev)}
                        className="p-1.5 text-blue-600 hover:text-blue-700 cursor-pointer"
                        title={t.common.edit}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (isRecurringEvent) {
                            setEventToDelete(ev);
                          } else {
                            deleteEvent(ev.id);
                          }
                        }}
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

      {/* Recurring Delete Confirmation Dialog */}
      {eventToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <div
            onClick={() => setEventToDelete(null)}
            className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-xs transition-opacity"
          />

          {/* Modal Panel */}
          <div className="relative z-10 w-full max-w-sm max-h-[85vh] overflow-y-auto overscroll-contain rounded-3xl bg-white dark:bg-[#131D31] p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40 text-red-600">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
              {t.scheduleModal.deleteRecurringTitle}
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {t.scheduleModal.deleteRecurringDesc}
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleDeleteOccurrence}
                className="w-full rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 py-2.5 px-3 text-xs font-bold text-red-600 dark:text-red-300 hover:bg-red-100 transition-colors cursor-pointer"
              >
                {t.scheduleModal.deleteThisOccurrence}
              </button>
              <button
                type="button"
                onClick={handleDeleteAll}
                className="w-full rounded-xl bg-red-600 py-2.5 px-3 text-xs font-bold text-white shadow-xs hover:bg-red-700 transition-colors cursor-pointer"
              >
                {t.scheduleModal.deleteAllOccurrences}
              </button>
              <button
                type="button"
                onClick={() => setEventToDelete(null)}
                className="mt-1 rounded-xl border border-slate-200 dark:border-slate-700 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                {t.common.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Calendar Single Event Sync Confirmation */}
      <GoogleCalendarConfirmModal
        isOpen={Boolean(eventToSyncWithGoogle)}
        title="Sync to Google Calendar?"
        description={
          eventToSyncWithGoogle
            ? `Sync arrangement "${eventToSyncWithGoogle.title}" with your primary Google Calendar?`
            : ''
        }
        actionLabel="Sync Event"
        actionType="sync"
        isLoading={isGoogleSyncing}
        onConfirm={async () => {
          if (!eventToSyncWithGoogle) return;
          setIsGoogleSyncing(true);
          const ok = await syncScheduleToGoogleCalendar(eventToSyncWithGoogle);
          setIsGoogleSyncing(false);
          setEventToSyncWithGoogle(null);
          if (ok) {
            setSyncToastMessage('Arrangement synced to Google Calendar!');
            setTimeout(() => setSyncToastMessage(null), 3000);
          }
        }}
        onCancel={() => setEventToSyncWithGoogle(null)}
      />

      {/* Google Calendar Bulk Sync Confirmation */}
      <GoogleCalendarConfirmModal
        isOpen={showSyncAllModal}
        title="Sync All to Google Calendar?"
        description="Sync all your scheduled preaching arrangements with your primary Google Calendar?"
        actionLabel="Sync All"
        actionType="sync"
        isLoading={isGoogleSyncing}
        onConfirm={async () => {
          setIsGoogleSyncing(true);
          const res = await syncAllSchedulesToGoogleCalendar();
          setIsGoogleSyncing(false);
          setShowSyncAllModal(false);
          setSyncToastMessage(`Synced ${res.synced} arrangement(s) to Google Calendar!`);
          setTimeout(() => setSyncToastMessage(null), 3000);
        }}
        onCancel={() => setShowSyncAllModal(false)}
      />
    </div>
  );
};

