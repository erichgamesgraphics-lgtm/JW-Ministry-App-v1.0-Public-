import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Clock, MapPin, Bell, Repeat, FileText, Trash2, Check } from 'lucide-react';
import { ScheduledEvent, ExpandedCalendarEvent, ReminderOptionType, RepeatOptionType, REMINDER_OPTIONS } from '../types.ts';
import { useMinistry } from '../context/MinistryContext.tsx';

interface AddEditScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventToEdit?: (ScheduledEvent | ExpandedCalendarEvent) | null;
  initialDate?: Date;
}

export const AddEditScheduleModal: React.FC<AddEditScheduleModalProps> = ({
  isOpen,
  onClose,
  eventToEdit,
  initialDate,
}) => {
  const { saveEvent, deleteEvent, t } = useMinistry();

  const [title, setTitle] = useState('');
  const [dateStr, setDateStr] = useState(() => (initialDate || new Date()).toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:30');
  const [endTime, setEndTime] = useState('11:30');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [reminder, setReminder] = useState<ReminderOptionType>('MINUTES_15');
  const [repeat, setRepeat] = useState<RepeatOptionType>('NONE');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditRecurringPrompt, setShowEditRecurringPrompt] = useState(false);
  const [pendingSaveData, setPendingSaveData] = useState<Partial<ScheduledEvent> | null>(null);

  const isRecurring = Boolean(
    eventToEdit && (
      (eventToEdit as ExpandedCalendarEvent).isOccurrence ||
      (eventToEdit.repeatOption && eventToEdit.repeatOption !== 'NONE') ||
      eventToEdit.parentEventId
    )
  );

  const occurrenceDateKey = (eventToEdit as ExpandedCalendarEvent)?.occurrenceDateKey || dateStr;

  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title);
      setDateStr(new Date(eventToEdit.dateMillis).toISOString().split('T')[0]);
      
      const startD = new Date(eventToEdit.startTimeMillis);
      const endD = new Date(eventToEdit.endTimeMillis);
      setStartTime(startD.toTimeString().slice(0, 5));
      setEndTime(endD.toTimeString().slice(0, 5));
      
      setLocation(eventToEdit.location || '');
      setDescription(eventToEdit.description || '');
      
      // Match reminder option
      const matchingRem = Object.values(REMINDER_OPTIONS).find(r => r.minutesBefore === eventToEdit.reminderMinutesBefore);
      setReminder(matchingRem?.id || 'MINUTES_15');
      setRepeat(eventToEdit.repeatOption || 'NONE');
    } else {
      setTitle('');
      setDateStr((initialDate || new Date()).toISOString().split('T')[0]);
      setStartTime('09:30');
      setEndTime('11:30');
      setLocation('');
      setDescription('');
      setReminder('MINUTES_15');
      setRepeat('NONE');
    }
    setShowDeleteConfirm(false);
    setShowEditRecurringPrompt(false);
    setPendingSaveData(null);
  }, [eventToEdit, initialDate, isOpen]);

  if (!isOpen) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const [y, m, d] = dateStr.split('-').map(Number);
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    const dateMillis = new Date(y, m - 1, d, 12, 0, 0).getTime();
    const startTimeMillis = new Date(y, m - 1, d, startH, startM, 0).getTime();
    const endTimeMillis = new Date(y, m - 1, d, endH, endM, 0).getTime();

    const payload: Partial<ScheduledEvent> = {
      id: eventToEdit ? eventToEdit.id : undefined,
      title: title.trim() || t.scheduleModal.titlePlaceholder,
      dateMillis,
      startTimeMillis,
      endTimeMillis,
      location,
      description,
      reminderMinutesBefore: REMINDER_OPTIONS[reminder].minutesBefore,
      repeatOption: repeat,
      isCompleted: eventToEdit ? eventToEdit.isCompleted : false,
    };

    // If editing a recurring instance, ask user whether to update this occurrence only or the series
    if (eventToEdit && isRecurring) {
      setPendingSaveData(payload);
      setShowEditRecurringPrompt(true);
      return;
    }

    saveEvent(payload);
    onClose();
  };

  const handleApplyEditMode = (mode: 'THIS_OCCURRENCE' | 'ALL_OCCURRENCES') => {
    if (pendingSaveData) {
      saveEvent(pendingSaveData, mode, occurrenceDateKey);
    }
    setShowEditRecurringPrompt(false);
    setPendingSaveData(null);
    onClose();
  };

  const handleDeleteOccurrence = () => {
    if (eventToEdit) {
      deleteEvent(eventToEdit.id, 'THIS_OCCURRENCE', occurrenceDateKey);
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  const handleDeleteAll = () => {
    if (eventToEdit) {
      deleteEvent(eventToEdit.id, 'ALL_OCCURRENCES');
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  const reminderOptionsList: Array<{ id: ReminderOptionType; label: string }> = [
    { id: 'NONE', label: t.scheduleModal.reminders.none },
    { id: 'AT_TIME', label: t.scheduleModal.reminders.atTime },
    { id: 'MINUTES_15', label: t.scheduleModal.reminders.min15 },
    { id: 'MINUTES_30', label: t.scheduleModal.reminders.min30 },
    { id: 'HOUR_1', label: t.scheduleModal.reminders.hr1 },
    { id: 'DAY_1', label: t.scheduleModal.reminders.day1 },
  ];

  const repeatOptionsList: Array<{ id: RepeatOptionType; label: string }> = [
    { id: 'NONE', label: t.scheduleModal.repeats.none },
    { id: 'DAILY', label: t.scheduleModal.repeats.daily },
    { id: 'WEEKLY', label: t.scheduleModal.repeats.weekly },
    { id: 'MONTHLY', label: t.scheduleModal.repeats.monthly },
    { id: 'YEARLY', label: t.scheduleModal.repeats.yearly },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#131D31] shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {eventToEdit ? t.scheduleModal.titleEdit : t.scheduleModal.titleAdd}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="mt-5 space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
              {t.scheduleModal.titleLabel}
            </label>
            <input
              type="text"
              required
              placeholder={t.scheduleModal.titlePlaceholder}
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1120] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Date */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <CalendarIcon className="h-3.5 w-3.5 text-blue-500" />
              {t.scheduleModal.dateLabel}
            </label>
            <input
              type="date"
              required
              value={dateStr}
              onChange={e => setDateStr(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1120] px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Times Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                {t.scheduleModal.startTime}
              </label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1120] px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                {t.scheduleModal.endTime}
              </label>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1120] px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              {t.scheduleModal.locationOptional}
            </label>
            <input
              type="text"
              placeholder={t.scheduleModal.locationPlaceholder}
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1120] px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Reminder & Repeat Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Bell className="h-3.5 w-3.5 text-slate-400" />
                {t.scheduleModal.reminderLabel}
              </label>
              <select
                value={reminder}
                onChange={e => setReminder(e.target.value as ReminderOptionType)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1120] px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-hidden"
              >
                {reminderOptionsList.map(opt => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Repeat className="h-3.5 w-3.5 text-slate-400" />
                {t.scheduleModal.repeatLabel}
              </label>
              <select
                value={repeat}
                onChange={e => setRepeat(e.target.value as RepeatOptionType)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1120] px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-hidden"
              >
                {repeatOptionsList.map(opt => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-slate-400" />
              {t.scheduleModal.notesOptional}
            </label>
            <textarea
              rows={2}
              placeholder={t.scheduleModal.notesPlaceholder}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1120] px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            {eventToEdit && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-3.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                <span>{t.common.delete}</span>
              </button>
            )}

            <div className="flex flex-1 items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 text-xs font-bold text-white shadow-md shadow-blue-500/25 active:scale-95 transition-all cursor-pointer"
              >
                <Check className="h-4 w-4" />
                <span>{t.scheduleModal.saveSchedule}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Delete Confirmation Alert (supports single occurrence vs full series) */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-3xl bg-white/95 dark:bg-[#131D31]/95 p-6 backdrop-blur-xs">
            <div className="text-center max-w-sm w-full">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40 text-red-600">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
                {isRecurring ? t.scheduleModal.deleteRecurringTitle : t.scheduleModal.deleteConfirmTitle}
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {isRecurring ? t.scheduleModal.deleteRecurringDesc : t.scheduleModal.deleteConfirmDesc}
              </p>
              
              {isRecurring ? (
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
                    onClick={() => setShowDeleteConfirm(false)}
                    className="mt-1 rounded-xl border border-slate-200 dark:border-slate-700 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    {t.common.cancel}
                  </button>
                </div>
              ) : (
                <div className="mt-4 flex gap-2 justify-center">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAll}
                    className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-red-700 cursor-pointer"
                  >
                    {t.common.delete}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Edit Recurring Prompt Dialog */}
        {showEditRecurringPrompt && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-3xl bg-white/95 dark:bg-[#131D31]/95 p-6 backdrop-blur-xs">
            <div className="text-center max-w-sm w-full">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600">
                <Repeat className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
                {t.scheduleModal.editRecurringTitle}
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {t.scheduleModal.editRecurringDesc}
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyEditMode('THIS_OCCURRENCE')}
                  className="w-full rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 py-2.5 px-3 text-xs font-bold text-blue-600 dark:text-blue-300 hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  {t.scheduleModal.editThisOccurrence}
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyEditMode('ALL_OCCURRENCES')}
                  className="w-full rounded-xl bg-blue-600 py-2.5 px-3 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  {t.scheduleModal.editAllOccurrences}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditRecurringPrompt(false);
                    setPendingSaveData(null);
                  }}
                  className="mt-1 rounded-xl border border-slate-200 dark:border-slate-700 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  {t.common.cancel}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

