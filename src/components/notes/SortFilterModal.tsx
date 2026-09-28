import React, { useEffect } from 'react';
import { ArrowUpDown, X, Check } from 'lucide-react';
import { NotesSortOption, NoteType, NoteFolder } from '../../types.ts';
import { useMinistry } from '../../context/MinistryContext.tsx';

interface SortFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  sortOption: NotesSortOption;
  onSortChange: (opt: NotesSortOption) => void;
  selectedType: NoteType | 'ALL';
  onTypeChange: (type: NoteType | 'ALL') => void;
  selectedFolderId: string | 'ALL';
  onFolderChange: (folderId: string | 'ALL') => void;
  folders: NoteFolder[];
}

export const SortFilterModal: React.FC<SortFilterModalProps> = ({
  isOpen,
  onClose,
  sortOption,
  onSortChange,
  selectedType,
  onTypeChange,
  selectedFolderId,
  onFolderChange,
  folders,
}) => {
  const { t } = useMinistry();

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

  const sortOptionsList: { id: NotesSortOption; label: string }[] = [
    { id: 'MODIFIED_DESC', label: t.notes.sortModifiedDesc },
    { id: 'CREATED_DESC', label: t.notes.sortCreatedDesc },
    { id: 'OLDEST_FIRST', label: t.notes.sortOldestFirst },
    { id: 'TITLE_ASC', label: t.notes.sortTitleAsc },
    { id: 'TERRITORY', label: t.notes.sortTerritory },
  ];

  const typeOptions: { id: NoteType | 'ALL'; label: string }[] = [
    { id: 'ALL', label: t.notes.allNotes },
    { id: 'MINISTRY', label: t.notes.types.ministry },
    { id: 'TERRITORY', label: t.notes.types.territory },
    { id: 'HOUSE_LIST', label: t.notes.types.houseList },
    { id: 'RETURN_VISIT', label: t.notes.types.returnVisit },
    { id: 'BIBLE_STUDY', label: t.notes.types.bibleStudy },
    { id: 'MEETING', label: t.notes.types.meeting },
    { id: 'PREPARATION', label: t.notes.types.preparation },
    { id: 'PERSONAL', label: t.notes.types.personal },
    { id: 'GENERAL', label: t.notes.types.general },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto select-none">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-md max-h-[85vh] overflow-y-auto overscroll-contain rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-blue-50 dark:bg-blue-900/40 p-2 text-blue-600 dark:text-blue-400">
              <ArrowUpDown className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t.notes.sortBy} & {t.common.search}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Sort Section */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {t.notes.sortBy}
          </label>
          <div className="space-y-1">
            {sortOptionsList.map(opt => {
              const isSelected = sortOption === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onSortChange(opt.id)}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check className="h-4 w-4" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter by Note Type */}
        <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Note Type
          </label>
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
            {typeOptions.map(tOpt => {
              const isSelected = selectedType === tOpt.id;
              return (
                <button
                  key={tOpt.id}
                  type="button"
                  onClick={() => onTypeChange(tOpt.id)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {tOpt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter by Folder */}
        <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {t.notes.folders}
          </label>
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
            <button
              type="button"
              onClick={() => onFolderChange('ALL')}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold border transition-all cursor-pointer ${
                selectedFolderId === 'ALL'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              {t.notes.allNotes}
            </button>
            {folders.map(f => {
              const isSelected = selectedFolderId === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onFolderChange(f.id)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: f.color || '#3B82F6' }} />
                  {f.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            {t.common.done}
          </button>
        </div>
      </div>
    </div>
  );
};
