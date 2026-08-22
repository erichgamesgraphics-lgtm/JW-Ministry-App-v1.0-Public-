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
  Trash2
} from 'lucide-react';
import { MinistryEntry, MinistryTypeCategory } from '../types.ts';
import { useMinistry } from '../context/MinistryContext.tsx';
import { formatDateLocalized, formatDurationLocalized } from '../translations/index.ts';

interface AddEditEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entryToEdit?: MinistryEntry | null;
  initialDate?: Date;
}

export const AddEditEntryModal: React.FC<AddEditEntryModalProps> = ({
  isOpen,
  onClose,
  entryToEdit,
  initialDate,
}) => {
  const { saveEntry, deleteEntry, language, t } = useMinistry();

  const [date, setDate] = useState<Date>(() => initialDate || new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isManualDuration, setIsManualDuration] = useState(true);

  // Time picker state (Start: 09:00 AM, End: 10:30 AM default)
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');

  // Direct duration state (in case user prefers direct hours/minutes)
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(30);

  const [ministryType, setMinistryType] = useState<MinistryTypeCategory>('HOUSE_TO_HOUSE');
  const [returnVisits, setReturnVisits] = useState(0);
  const [bibleStudies, setBibleStudies] = useState(0);
  const [placements, setPlacements] = useState(0);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (entryToEdit) {
      const d = new Date(entryToEdit.dateMillis);
      setDate(d);
      const h = Math.floor(entryToEdit.durationMinutes / 60);
      const m = entryToEdit.durationMinutes % 60;
      setHours(h);
      setMinutes(m);
      setMinistryType(entryToEdit.ministryType);
      setReturnVisits(entryToEdit.returnVisits);
      setBibleStudies(entryToEdit.bibleStudies);
      setPlacements(entryToEdit.placements);
      setLocation(entryToEdit.location || '');
      setNotes(entryToEdit.notes || '');
    } else {
      setDate(initialDate || new Date());
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
    setShowDeleteConfirm(false);
  }, [entryToEdit, initialDate, isOpen]);

  // Recalculate duration when startTime / endTime changes if manual mode is enabled
  useEffect(() => {
    if (isManualDuration && startTime && endTime) {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      let totalMins = (eh * 60 + em) - (sh * 60 + sm);
      if (totalMins < 0) totalMins += 24 * 60; // handle overnight
      const calcH = Math.floor(totalMins / 60);
      const calcM = totalMins % 60;
      setHours(calcH);
      setMinutes(calcM);
    }
  }, [startTime, endTime, isManualDuration]);

  if (!isOpen) return null;

  const totalCalculatedMinutes = hours * 60 + minutes;
  const durationSummaryFormatted = formatDurationLocalized(totalCalculatedMinutes, language);

  const dateFormatted = formatDateLocalized(date, language, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveEntry({
      id: entryToEdit ? entryToEdit.id : undefined,
      dateMillis: date.getTime(),
      durationMinutes: Math.max(1, totalCalculatedMinutes),
      ministryType,
      returnVisits,
      bibleStudies,
      placements,
      location,
      notes,
    });
    onClose();
  };

  const handleDelete = () => {
    if (entryToEdit) {
      deleteEntry(entryToEdit.id);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-50 dark:bg-[#0B1120] shadow-2xl border border-slate-200 dark:border-slate-800 p-5">
        {/* Top App Bar with Back Arrow */}
        <div className="flex items-center justify-between pb-3">
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white dark:bg-[#131D31] border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-50 cursor-pointer"
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
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-red-600 hover:text-red-700 cursor-pointer"
              title={t.common.delete}
            >
              <Trash2 className="h-5 w-5" />
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>

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
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                {t.entryModal.dateChange}
              </button>
            </div>

            {showDatePicker && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#131D31] p-3">
                <input
                  type="date"
                  value={date.toISOString().split('T')[0]}
                  onChange={e => {
                    if (e.target.value) {
                      const [y, m, d] = e.target.value.split('-').map(Number);
                      setDate(new Date(y, m - 1, d, 10, 0));
                      setShowDatePicker(false);
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
                {t.entryModal.manualDuration}
              </label>
              <button
                type="button"
                onClick={() => setIsManualDuration(!isManualDuration)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  isManualDuration ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
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
                      <Clock className="h-4 w-4 text-blue-600" />
                      <input
                        type="time"
                        value={startTime}
                        onChange={e => setStartTime(e.target.value)}
                        className="bg-transparent text-sm font-bold text-slate-900 dark:text-white focus:outline-hidden w-full"
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-3">
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                      {t.entryModal.endTime}
                    </span>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <input
                        type="time"
                        value={endTime}
                        onChange={e => setEndTime(e.target.value)}
                        className="bg-transparent text-sm font-bold text-slate-900 dark:text-white focus:outline-hidden w-full"
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
                      onChange={e => setHours(Math.max(0, parseInt(e.target.value) || 0))}
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
                      onChange={e => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
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
                <span className="font-bold text-blue-600 dark:text-blue-400">
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
                    onClick={() => setMinistryType(key)}
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

          {/* Bottom Save Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] py-3.5 sm:py-4 px-6 text-base font-semibold text-white shadow-xs shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="h-5 w-5 stroke-[2.5]" />
              <span>{entryToEdit ? t.entryModal.updateEntry : t.entryModal.saveEntry}</span>
            </button>
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
                {t.entryModal.deleteConfirmTitle}
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {t.entryModal.deleteConfirmDesc}
              </p>
              <div className="mt-4 flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700"
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
