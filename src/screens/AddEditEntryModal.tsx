import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  Check,
  Plus,
  Minus,
  MapPin,
  FileText,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { MinistryEntry, MinistryTypeCategory } from '../types.ts';
import { useMinistry } from '../context/MinistryContext.tsx';
import { formatDateLocalized, formatDurationLocalized } from '../translations/index.ts';
import { safeFormatDateInput } from '../utils/storage.ts';

interface AddEditEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entryToEdit?: MinistryEntry | null;
  initialDate?: Date;
}

// Calculate minute difference handling overnight wrap
function calculateMinutesFromTimes(start: string, end: string): number {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  if (!Number.isFinite(sh) || !Number.isFinite(sm) || !Number.isFinite(eh) || !Number.isFinite(em)) return 0;
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60; // overnight
  return mins;
}

// Add minutes to time string HH:mm
function addMinutesToTime(start: string, minutesToAdd: number): string {
  if (!start) return '10:30';
  const [sh, sm] = start.split(':').map(Number);
  if (!Number.isFinite(sh) || !Number.isFinite(sm)) return '10:30';
  const total = ((sh * 60 + sm + minutesToAdd) % (24 * 60) + (24 * 60)) % (24 * 60);
  const eh = Math.floor(total / 60);
  const em = total % 60;
  return `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
}

export const AddEditEntryModal: React.FC<AddEditEntryModalProps> = ({
  isOpen,
  onClose,
  entryToEdit,
  initialDate,
}) => {
  const { saveEntry, deleteEntry, language, t, showNotificationToast } = useMinistry();

  const [date, setDate] = useState<Date>(() => (initialDate && !isNaN(initialDate.getTime()) ? initialDate : new Date()));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isManualDuration, setIsManualDuration] = useState(true);

  // Time picker state (Start: 09:00 AM, End: 10:30 AM default)
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');

  // Direct duration state
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(30);

  const [ministryType, setMinistryType] = useState<MinistryTypeCategory>('HOUSE_TO_HOUSE');
  const [returnVisits, setReturnVisits] = useState(0);
  const [bibleStudies, setBibleStudies] = useState(0);
  const [placements, setPlacements] = useState(0);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Submission & Validation States
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Initialize or reset state when modal opens or entryToEdit changes
  useEffect(() => {
    if (!isOpen) {
      setValidationError(null);
      setIsSubmitting(false);
      setIsSuccess(false);
      setShowDatePicker(false);
      setShowDeleteConfirm(false);
      return;
    }

    if (entryToEdit) {
      const d = new Date(entryToEdit.dateMillis);
      setDate(isNaN(d.getTime()) ? new Date() : d);

      const dur = Number.isFinite(entryToEdit.durationMinutes) && entryToEdit.durationMinutes > 0
        ? Math.round(entryToEdit.durationMinutes)
        : 90;
      const h = Math.floor(dur / 60);
      const m = dur % 60;
      setHours(h);
      setMinutes(m);

      if (Number.isFinite(entryToEdit.startTimeMillis) && Number.isFinite(entryToEdit.endTimeMillis)) {
        const s = new Date(entryToEdit.startTimeMillis);
        const e = new Date(entryToEdit.endTimeMillis);
        if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
          setStartTime(s.toTimeString().slice(0, 5));
          setEndTime(e.toTimeString().slice(0, 5));
        } else {
          setStartTime('09:00');
          setEndTime(addMinutesToTime('09:00', dur));
        }
      } else {
        setStartTime('09:00');
        setEndTime(addMinutesToTime('09:00', dur));
      }

      setMinistryType(entryToEdit.ministryType || 'HOUSE_TO_HOUSE');
      setReturnVisits(Math.max(0, Number(entryToEdit.returnVisits) || 0));
      setBibleStudies(Math.max(0, Number(entryToEdit.bibleStudies) || 0));
      setPlacements(Math.max(0, Number(entryToEdit.placements) || 0));
      setLocation(entryToEdit.location || '');
      setNotes(entryToEdit.notes || '');
    } else {
      const validInitial = initialDate && !isNaN(initialDate.getTime()) ? initialDate : new Date();
      setDate(validInitial);
      setHours(1);
      setMinutes(30);
      setStartTime('09:00');
      setEndTime('10:30');
      setMinistryType('HOUSE_TO_HOUSE');
      setReturnVisits(0);
      setBibleStudies(0);
      setPlacements(0);
      setLocation('');
      setNotes('');
    }

    setValidationError(null);
    setIsSubmitting(false);
    setIsSuccess(false);
    setShowDeleteConfirm(false);
  }, [entryToEdit, initialDate, isOpen]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handlers for Start/End time changes (syncs to hours & minutes)
  const handleStartTimeChange = (val: string) => {
    setStartTime(val);
    setValidationError(null);
    const diff = calculateMinutesFromTimes(val, endTime);
    setHours(Math.floor(diff / 60));
    setMinutes(diff % 60);
  };

  const handleEndTimeChange = (val: string) => {
    setEndTime(val);
    setValidationError(null);
    const diff = calculateMinutesFromTimes(startTime, val);
    setHours(Math.floor(diff / 60));
    setMinutes(diff % 60);
  };

  // Handlers for direct Hours / Minutes changes (syncs to endTime)
  const handleHoursChange = (hVal: number) => {
    const safeH = Math.max(0, Math.min(24, Number.isFinite(hVal) ? hVal : 0));
    setHours(safeH);
    setValidationError(null);
    const total = safeH * 60 + minutes;
    setEndTime(addMinutesToTime(startTime, total));
  };

  const handleMinutesChange = (mVal: number) => {
    const safeM = Math.max(0, Math.min(59, Number.isFinite(mVal) ? mVal : 0));
    setMinutes(safeM);
    setValidationError(null);
    const total = hours * 60 + safeM;
    setEndTime(addMinutesToTime(startTime, total));
  };

  const currentCalculatedMinutes = isManualDuration
    ? calculateMinutesFromTimes(startTime, endTime)
    : Math.max(0, hours * 60 + minutes);

  const durationSummaryFormatted = formatDurationLocalized(
    Math.max(0, currentCalculatedMinutes),
    language
  );

  const safeDateObj = date && !isNaN(date.getTime()) ? date : new Date();
  const dateFormatted = formatDateLocalized(safeDateObj, language, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // 1. Validate Date
    if (!date || isNaN(date.getTime())) {
      setValidationError(t.entryModal.dateInvalidError || 'Please select a valid date.');
      return;
    }

    // 2. Validate Duration
    const totalMins = isManualDuration
      ? calculateMinutesFromTimes(startTime, endTime)
      : Math.max(0, hours * 60 + minutes);

    if (totalMins <= 0) {
      setValidationError(
        t.entryModal.durationZeroError || 'Duration must be greater than 0 minutes.'
      );
      return;
    }

    setValidationError(null);
    setIsSubmitting(true);

    try {
      const saveDate = date && !isNaN(date.getTime()) ? date : new Date();

      // Normalize date to midday for consistent date matching
      const entryDateMillis = new Date(
        saveDate.getFullYear(),
        saveDate.getMonth(),
        saveDate.getDate(),
        12,
        0,
        0
      ).getTime();

      // Parse start time
      const [sh, sm] = (startTime || '09:00').split(':').map(Number);
      const startMillis = new Date(
        saveDate.getFullYear(),
        saveDate.getMonth(),
        saveDate.getDate(),
        Number.isFinite(sh) ? sh : 9,
        Number.isFinite(sm) ? sm : 0,
        0
      ).getTime();

      const endMillis = startMillis + totalMins * 60 * 1000;

      saveEntry({
        id: entryToEdit ? entryToEdit.id : undefined,
        dateMillis: entryDateMillis,
        startTimeMillis: startMillis,
        endTimeMillis: endMillis,
        durationMinutes: totalMins,
        ministryType: ministryType || 'HOUSE_TO_HOUSE',
        returnVisits: Math.max(0, Number(returnVisits) || 0),
        bibleStudies: Math.max(0, Number(bibleStudies) || 0),
        placements: Math.max(0, Number(placements) || 0),
        location: (location || '').trim(),
        notes: (notes || '').trim(),
      });

      setIsSuccess(true);

      // Trigger clear success notification toast in app
      showNotificationToast(
        entryToEdit
          ? (t.entryModal.entryUpdatedSuccess || 'Ministry entry updated successfully!')
          : (t.entryModal.entrySavedSuccess || 'Ministry entry recorded successfully!'),
        `${formatDurationLocalized(totalMins, language)} • ${dateFormatted}`,
        'entry',
        3500
      );

      // Close after brief visual confirmation
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 400);
    } catch (err) {
      console.error('Error saving ministry entry:', err);
      setIsSubmitting(false);
      setValidationError('Failed to save ministry entry. Please check your inputs and try again.');
    }
  };

  const handleDelete = () => {
    if (entryToEdit) {
      deleteEntry(entryToEdit.id);
      showNotificationToast(
        t.entryModal.deleteConfirmTitle || 'Entry Deleted',
        'Ministry entry was removed from records.',
        'entry',
        3000
      );
      onClose();
    }
  };

  const ministryTypeKeys: Array<{ key: MinistryTypeCategory; label: string }> = [
    { key: 'HOUSE_TO_HOUSE', label: t.ministryTypes.houseToHouse },
    { key: 'PUBLIC_WITNESSING', label: t.ministryTypes.publicWitnessing },
    { key: 'INFORMAL_WITNESSING', label: t.ministryTypes.informalWitnessing },
    { key: 'TELEPHONE_WITNESSING', label: t.ministryTypes.telephoneWitnessing },
    { key: 'LETTER_WRITING', label: t.ministryTypes.letterWriting },
    { key: 'CART_WITNESSING', label: t.ministryTypes.cartWitnessing },
    { key: 'OTHER', label: t.ministryTypes.other },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-xs select-none"
      />

      {/* Modal Dialog Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto overscroll-contain rounded-3xl bg-slate-50 dark:bg-[#0B1120] shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 z-10"
      >
        {/* Top App Bar with Back Arrow */}
        <div className="flex items-center justify-between pb-3">
          <button
            type="button"
            id="btn-close-entry-modal"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white dark:bg-[#131D31] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer select-none"
            title={t.common.back}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <h1 className="text-lg font-bold text-slate-900 dark:text-white">
            {entryToEdit ? t.entryModal.titleEdit : t.entryModal.titleAdd}
          </h1>

          {entryToEdit ? (
            <button
              type="button"
              id="btn-delete-entry-modal"
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-red-600 hover:text-red-700 active:scale-95 transition-all cursor-pointer"
              title={t.common.delete}
            >
              <Trash2 className="h-5 w-5" />
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>

        {/* Validation Error Alert Banner */}
        {validationError && (
          <div className="mb-4 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/50 p-3.5 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300 animate-in fade-in duration-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="flex-1 font-semibold leading-relaxed">
              {validationError}
            </div>
            <button
              type="button"
              onClick={() => setValidationError(null)}
              className="text-red-500 hover:text-red-700 text-xs font-bold px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Success Confirmation Banner */}
        {isSuccess && (
          <div className="mb-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 p-3.5 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-200 animate-in fade-in duration-200">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="font-bold">
              {entryToEdit
                ? (t.entryModal.entryUpdatedSuccess || 'Ministry entry updated successfully!')
                : (t.entryModal.entrySavedSuccess || 'Ministry entry recorded successfully!')}
            </span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 mt-2">
          {/* Section: Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 px-1">
              {t.entryModal.dateLabel}
            </label>
            <div className="flex items-center justify-between rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#131D31] p-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                  <CalendarIcon className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {dateFormatted}
                </span>
              </div>

              <button
                type="button"
                id="btn-change-date"
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                {t.entryModal.dateChange}
              </button>
            </div>

            {showDatePicker && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#131D31] p-3 animate-in fade-in duration-150">
                <input
                  type="date"
                  value={safeFormatDateInput(date)}
                  onChange={e => {
                    const val = e.target.value;
                    if (val) {
                      const parts = val.split('-').map(Number);
                      if (parts.length === 3 && parts.every(n => Number.isFinite(n) && n > 0)) {
                        setDate(new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0));
                        setShowDatePicker(false);
                        setValidationError(null);
                      }
                    }
                  }}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
            )}
          </div>

          {/* Section: Manual Duration Entry */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                {isManualDuration ? t.entryModal.timeModeManual : t.entryModal.timeModeDirect}
              </label>
              <button
                type="button"
                id="btn-toggle-duration-mode"
                onClick={() => setIsManualDuration(!isManualDuration)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  isManualDuration ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
                title={isManualDuration ? t.entryModal.timeModeDirect : t.entryModal.timeModeManual}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    isManualDuration ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Time Cards or Direct Stepper */}
            <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#131D31] p-4 shadow-xs space-y-3">
              {isManualDuration ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-3">
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                      {t.entryModal.startTime}
                    </span>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600 shrink-0" />
                      <input
                        type="time"
                        value={startTime}
                        onChange={e => handleStartTimeChange(e.target.value)}
                        className="bg-transparent text-sm font-bold text-slate-900 dark:text-white focus:outline-hidden w-full cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-3">
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                      {t.entryModal.endTime}
                    </span>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600 shrink-0" />
                      <input
                        type="time"
                        value={endTime}
                        onChange={e => handleEndTimeChange(e.target.value)}
                        className="bg-transparent text-sm font-bold text-slate-900 dark:text-white focus:outline-hidden w-full cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 justify-center py-1">
                  <div className="text-center">
                    <span className="text-xs text-slate-400 block mb-1">{t.entryModal.hours}</span>
                    <input
                      type="number"
                      min="0"
                      max="24"
                      value={hours}
                      onChange={e => handleHoursChange(parseInt(e.target.value) || 0)}
                      className="w-20 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-center text-base font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <span className="text-xl font-bold text-slate-400 mt-5">:</span>
                  <div className="text-center">
                    <span className="text-xs text-slate-400 block mb-1">{t.entryModal.minutes}</span>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      step="5"
                      value={minutes}
                      onChange={e => handleMinutesChange(parseInt(e.target.value) || 0)}
                      className="w-20 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-center text-base font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* Total Duration Row */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  {t.entryModal.totalDuration}
                </span>
                <span className={`font-bold ${currentCalculatedMinutes <= 0 ? 'text-red-500' : 'text-blue-600 dark:text-blue-400'}`}>
                  {durationSummaryFormatted}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Ministry Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 px-1">
              {t.entryModal.ministryType}
            </label>
            <div className="flex flex-wrap gap-2">
              {ministryTypeKeys.map(({ key, label }) => {
                const isSelected = ministryType === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setMinistryType(key);
                      setValidationError(null);
                    }}
                    className={`flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-xs'
                        : 'bg-white dark:bg-[#131D31] text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 stroke-[3]" />}
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Activity Counts */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 px-1">
              {t.entryModal.activityCounts}
            </label>
            <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#131D31] p-4 shadow-xs divide-y divide-slate-100 dark:divide-slate-800">
              {/* Return Visits */}
              <div className="flex items-center justify-between py-2.5 first:pt-0">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {t.entryModal.returnVisits}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setReturnVisits(v => Math.max(0, v - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 active:scale-95 cursor-pointer"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-6 text-center text-base font-bold text-slate-900 dark:text-white">
                    {returnVisits}
                  </span>
                  <button
                    type="button"
                    onClick={() => setReturnVisits(v => v + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white active:scale-95 cursor-pointer shadow-xs"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Bible Studies */}
              <div className="flex items-center justify-between py-2.5">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {t.entryModal.bibleStudies}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setBibleStudies(v => Math.max(0, v - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 active:scale-95 cursor-pointer"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-6 text-center text-base font-bold text-slate-900 dark:text-white">
                    {bibleStudies}
                  </span>
                  <button
                    type="button"
                    onClick={() => setBibleStudies(v => v + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white active:scale-95 cursor-pointer shadow-xs"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Placements */}
              <div className="flex items-center justify-between py-2.5 last:pb-0">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {t.entryModal.placements}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPlacements(v => Math.max(0, v - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 active:scale-95 cursor-pointer"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-6 text-center text-base font-bold text-slate-900 dark:text-white">
                    {placements}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPlacements(v => v + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white active:scale-95 cursor-pointer shadow-xs"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Location & Notes */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 px-1 mb-1 block">
                {t.entryModal.locationOptional}
              </label>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#131D31] px-3.5 py-2.5 shadow-xs">
                <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder={t.entryModal.locationPlaceholder}
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 px-1 mb-1 block">
                {t.entryModal.notesOptional}
              </label>
              <div className="flex items-start gap-2 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#131D31] px-3.5 py-2.5 shadow-xs">
                <FileText className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <textarea
                  rows={2}
                  placeholder={t.entryModal.notesPlaceholder}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden resize-none"
                />
              </div>
            </div>
          </div>

          {/* Bottom Save Button with Duplication Guard */}
          <div className="pt-2">
            <button
              type="submit"
              id="btn-save-entry"
              disabled={isSubmitting}
              className={`w-full rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] py-3.5 sm:py-4 px-6 text-base font-semibold text-white shadow-xs shadow-blue-500/25 border border-blue-400/30 transition-all flex items-center justify-center gap-2 select-none ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{t.entryModal.saving || 'Saving...'}</span>
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle2 className="h-5 w-5 stroke-[2.5]" />
                  <span>{entryToEdit ? t.entryModal.updateEntry : t.entryModal.saveEntry}</span>
                </>
              ) : (
                <>
                  <Check className="h-5 w-5 stroke-[2.5]" />
                  <span>{entryToEdit ? t.entryModal.updateEntry : t.entryModal.saveEntry}</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Delete Confirmation Alert */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-3xl bg-white/95 dark:bg-[#131D31]/95 p-6 backdrop-blur-md">
            <div className="text-center max-w-xs">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40 text-red-600">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
                {t.entryModal.deleteConfirmTitle}
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {t.entryModal.deleteConfirmDesc}
              </p>
              <div className="mt-4 flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 active:scale-95 transition-all cursor-pointer"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 active:scale-95 transition-all cursor-pointer"
                >
                  {t.common.delete}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
