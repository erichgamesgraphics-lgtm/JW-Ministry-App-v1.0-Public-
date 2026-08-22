import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Clock, MapPin, Bell, Repeat, FileText, Trash2, Check } from 'lucide-react';
import { ScheduledEvent, ReminderOptionType, RepeatOptionType, REMINDER_OPTIONS, REPEAT_OPTIONS } from '../types.ts';
import { useMinistry } from '../context/MinistryContext.tsx';

interface AddEditScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventToEdit?: ScheduledEvent | null;
  initialDate?: Date;
}

export const AddEditScheduleModal: React.FC<AddEditScheduleModalProps> = ({
  isOpen,
  onClose,
  eventToEdit,
  initialDate,
}) => {
  const { saveEvent, deleteEvent } = useMinistry();

  const [title, setTitle] = useState('');
  const [dateStr, setDateStr] = useState(() => (initialDate || new Date()).toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:30');
  const [endTime, setEndTime] = useState('11:30');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [reminder, setReminder] = useState<ReminderOptionType>('MINUTES_15');
  const [repeat, setRepeat] = useState<RepeatOptionType>('NONE');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
  }, [eventToEdit, initialDate, isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const [y, m, d] = dateStr.split('-').map(Number);
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    const dateMillis = new Date(y, m - 1, d, 12, 0, 0).getTime();
    const startTimeMillis = new Date(y, m - 1, d, startH, startM, 0).getTime();
    const endTimeMillis = new Date(y, m - 1, d, endH, endM, 0).getTime();

    saveEvent({
      id: eventToEdit ? eventToEdit.id : undefined,
      title: title.trim() || 'Ministry Activity',
      dateMillis,
      startTimeMillis,
      endTimeMillis,
      location,
      description,
      reminderMinutesBefore: REMINDER_OPTIONS[reminder].minutesBefore,
      repeatOption: repeat,
      isCompleted: eventToEdit ? eventToEdit.isCompleted : false,
    });

    onClose();
  };

  const handleDelete = () => {
    if (eventToEdit) {
      deleteEvent(eventToEdit.id);
      onClose();
    }
  };

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
              {eventToEdit ? 'Edit Ministry Schedule' : 'Schedule Ministry'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-5 space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
              Arrangement Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Saturday Morning Ministry, Return Visit to John"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1120] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Date */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <CalendarIcon className="h-3.5 w-3.5 text-blue-500" />
              Date
            </label>
            <input
              type="date"
              required
              value={dateStr}
              onChange={e => setDateStr(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1120] px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Times Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1120] px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1120] px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              Meeting Location (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Kingdom Hall Parking, Coffee Shop"
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1120] px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Reminder & Repeat Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Bell className="h-3.5 w-3.5 text-slate-400" />
                Reminder
              </label>
              <select
                value={reminder}
                onChange={e => setReminder(e.target.value as ReminderOptionType)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1120] px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
              >
                {Object.values(REMINDER_OPTIONS).map(opt => (
                  <option key={opt.id} value={opt.id}>
                    {opt.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Repeat className="h-3.5 w-3.5 text-slate-400" />
                Repeat
              </label>
              <select
                value={repeat}
                onChange={e => setRepeat(e.target.value as RepeatOptionType)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1120] px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
              >
                {Object.values(REPEAT_OPTIONS).map(opt => (
                  <option key={opt.id} value={opt.id}>
                    {opt.displayName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-slate-400" />
              Notes / Partner / Territory Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Working with Brother Mark, bringing cart magazines"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1120] px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            {eventToEdit && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-3.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            )}

            <div className="flex flex-1 items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 text-xs font-bold text-white shadow-md shadow-blue-500/25 active:scale-95 transition-all"
              >
                <Check className="h-4 w-4" />
                <span>Save Schedule</span>
              </button>
            </div>
          </div>
        </form>

        {/* Delete Confirmation Alert */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-3xl bg-white/95 dark:bg-[#131D31]/95 p-6 backdrop-blur-xs">
            <div className="text-center max-w-xs">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40 text-red-600">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
                Delete Schedule Arrangement?
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Are you sure you want to remove this scheduled ministry arrangement?
              </p>
              <div className="mt-4 flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
