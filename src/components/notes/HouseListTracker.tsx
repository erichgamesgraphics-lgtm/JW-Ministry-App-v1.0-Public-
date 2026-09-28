import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Sparkles,
  User,
  FileText,
  Hash,
} from 'lucide-react';
import { NoteHouseItem, HouseVisitStatus } from '../../types.ts';
import { useMinistry } from '../../context/MinistryContext.tsx';

interface HouseListTrackerProps {
  territoryNumber?: string;
  onTerritoryNumberChange: (val: string) => void;
  houseList: NoteHouseItem[];
  onChange: (houses: NoteHouseItem[]) => void;
}

export const HouseListTracker: React.FC<HouseListTrackerProps> = ({
  territoryNumber = '',
  onTerritoryNumberChange,
  houseList = [],
  onChange,
}) => {
  const { t } = useMinistry();
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchCount, setBatchCount] = useState<number>(20);
  const [batchPrefix, setBatchPrefix] = useState<string>('');

  useEffect(() => {
    if (showBatchModal) {
      const originalStyle = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [showBatchModal]);

  const statuses: { id: HouseVisitStatus; label: string; color: string; bg: string; icon: string }[] = [
    { id: 'NOT_VISITED', label: t.notes.houseStatuses.notVisited, color: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700', icon: '○' },
    { id: 'VISITED', label: t.notes.houseStatuses.visited, color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800', icon: '✓' },
    { id: 'NOT_AT_HOME', label: t.notes.houseStatuses.notAtHome, color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800', icon: '⚐' },
    { id: 'RETURN_VISIT', label: t.notes.houseStatuses.returnVisit, color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800', icon: '↻' },
    { id: 'BIBLE_STUDY', label: t.notes.houseStatuses.bibleStudy, color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-50 dark:bg-purple-950/60 border-purple-300 dark:border-purple-800', icon: '📖' },
    { id: 'INTERESTED', label: t.notes.houseStatuses.interested, color: 'text-teal-700 dark:text-teal-300', bg: 'bg-teal-50 dark:bg-teal-950/60 border-teal-300 dark:border-teal-800', icon: '★' },
    { id: 'NOT_INTERESTED', label: t.notes.houseStatuses.notInterested, color: 'text-rose-700 dark:text-rose-300', bg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800', icon: '⊘' },
    { id: 'DO_NOT_CALL', label: t.notes.houseStatuses.doNotCall, color: 'text-red-700 dark:text-red-400 font-bold', bg: 'bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800', icon: '⛔' },
    { id: 'CUSTOM', label: t.notes.houseStatuses.custom, color: 'text-indigo-700 dark:text-indigo-300', bg: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800', icon: '✎' },
  ];

  // Calculate progress
  const totalHouses = houseList.length;
  const visitedHouses = houseList.filter(
    h => h.status !== 'NOT_VISITED'
  ).length;
  const progressPercent = totalHouses > 0 ? Math.round((visitedHouses / totalHouses) * 100) : 0;

  const handleAddHouse = () => {
    const nextNumber = houseList.length + 1;
    const newHouse: NoteHouseItem = {
      id: `h_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      numberOrLabel: `${nextNumber}`,
      status: 'NOT_VISITED',
      notes: '',
    };
    onChange([...houseList, newHouse]);
  };

  const handleBatchGenerate = () => {
    if (batchCount <= 0) return;
    const currentLength = houseList.length;
    const newItems: NoteHouseItem[] = [];
    for (let i = 1; i <= batchCount; i++) {
      const num = currentLength + i;
      newItems.push({
        id: `h_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
        numberOrLabel: batchPrefix ? `${batchPrefix} ${num}` : `${num}`,
        status: 'NOT_VISITED',
        notes: '',
      });
    }
    onChange([...houseList, ...newItems]);
    setShowBatchModal(false);
  };

  const handleUpdateHouse = (id: string, updates: Partial<NoteHouseItem>) => {
    onChange(
      houseList.map(h => {
        if (h.id === id) {
          return {
            ...h,
            ...updates,
            lastVisitedMillis:
              updates.status && updates.status !== 'NOT_VISITED'
                ? Date.now()
                : h.lastVisitedMillis,
          };
        }
        return h;
      })
    );
  };

  const handleDeleteHouse = (id: string) => {
    onChange(houseList.filter(h => h.id !== id));
  };

  const handleMoveHouse = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= houseList.length) return;
    const updated = [...houseList];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIndex, 0, moved);
    onChange(updated);
  };

  const handleResetStatuses = () => {
    if (!window.confirm(t.notes.clearHouseStatuses + '?')) return;
    onChange(
      houseList.map(h => ({
        ...h,
        status: 'NOT_VISITED',
      }))
    );
  };

  return (
    <div className="space-y-4">
      {/* Territory header inputs & stats */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
              <Hash className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              {t.notes.territorySection}
            </label>
            <input
              type="text"
              value={territoryNumber}
              onChange={e => onTerritoryNumberChange(e.target.value)}
              placeholder={t.notes.territoryNumberPlaceholder}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 px-3 py-2 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={() => setShowBatchModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/80 dark:bg-blue-950/60 px-3 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {t.notes.generateHouses}
            </button>
            {houseList.length > 0 && (
              <button
                type="button"
                onClick={handleResetStatuses}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
                title={t.notes.clearHouseStatuses}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {totalHouses > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-medium mb-1.5">
              <span className="text-slate-600 dark:text-slate-300 font-semibold">
                {t.notes.housesVisitedCount(visitedHouses, totalHouses)}
              </span>
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {progressPercent}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* House List Items */}
      <div className="space-y-2.5">
        {houseList.map((house, idx) => {
          const isVisited = house.status !== 'NOT_VISITED';

          return (
            <div
              key={house.id}
              className={`rounded-2xl border transition-all ${
                isVisited
                  ? 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs'
                  : 'border-slate-200/70 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50'
              } p-3 sm:p-3.5`}
            >
              <div className="flex items-start gap-2.5 sm:gap-3">
                {/* House Number / Quick Label */}
                <div className="flex items-center gap-1 shrink-0 pt-0.5">
                  <div className="flex flex-col -space-y-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveHouse(idx, 'up')}
                      className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer"
                      title="Move Up"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === houseList.length - 1}
                      onClick={() => handleMoveHouse(idx, 'down')}
                      className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer"
                      title="Move Down"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={house.numberOrLabel}
                    onChange={e => handleUpdateHouse(house.id, { numberOrLabel: e.target.value })}
                    placeholder="#"
                    className="w-14 sm:w-16 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-center font-bold text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Status Pills / Selector */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {statuses.slice(0, 5).map(st => {
                      const isActive = house.status === st.id;
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => handleUpdateHouse(house.id, { status: st.id })}
                          className={`rounded-lg px-2 py-0.5 text-[11px] font-semibold border transition-all cursor-pointer ${
                            isActive
                              ? `${st.bg} ${st.color} ring-1 ring-current shadow-xs`
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                          }`}
                        >
                          <span className="mr-1">{st.icon}</span>
                          {st.label}
                        </button>
                      );
                    })}

                    {/* More status dropdown selector */}
                    <select
                      value={house.status}
                      onChange={e => handleUpdateHouse(house.id, { status: e.target.value as HouseVisitStatus })}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                    >
                      {statuses.map(st => (
                        <option key={st.id} value={st.id}>
                          {st.icon} {st.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Notes / Resident Name Inputs */}
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-800/50 px-2.5 py-1">
                      <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        value={house.residentName || ''}
                        onChange={e => handleUpdateHouse(house.id, { residentName: e.target.value })}
                        placeholder={t.notes.residentName}
                        className="w-full text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 bg-transparent focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-800/50 px-2.5 py-1">
                      <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        value={house.notes || ''}
                        onChange={e => handleUpdateHouse(house.id, { notes: e.target.value })}
                        placeholder={t.notes.houseNotes}
                        className="w-full text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 bg-transparent focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => handleDeleteHouse(house.id)}
                  className="rounded-lg p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer shrink-0 mt-0.5"
                  title={t.common.delete}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}

        {/* Add House Button */}
        <button
          type="button"
          onClick={handleAddHouse}
          className="w-full rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 bg-white/50 dark:bg-slate-900/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          {t.notes.addHouse}
        </button>
      </div>

      {/* Batch Generator Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto select-none">
          {/* Backdrop */}
          <div
            onClick={() => setShowBatchModal(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
          />

          {/* Modal Card */}
          <div className="relative z-10 w-full max-w-sm max-h-[85vh] overflow-y-auto overscroll-contain rounded-3xl bg-white dark:bg-slate-900 p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="rounded-xl bg-blue-100 dark:bg-blue-900/60 p-2 text-blue-600 dark:text-blue-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t.notes.generateHouses}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t.notes.generateHousesPrompt}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Prefix (optional, e.g. "House" or "Apt")
                </label>
                <input
                  type="text"
                  value={batchPrefix}
                  onChange={e => setBatchPrefix(e.target.value)}
                  placeholder="e.g. House"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Count
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={batchCount}
                  onChange={e => setBatchCount(parseInt(e.target.value, 10) || 1)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={handleBatchGenerate}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                {t.notes.generateHousesBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
