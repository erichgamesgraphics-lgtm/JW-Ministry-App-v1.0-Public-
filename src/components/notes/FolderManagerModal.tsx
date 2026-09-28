import React, { useState, useEffect } from 'react';
import { Folder, Plus, Trash2, X, Check } from 'lucide-react';
import { NoteFolder } from '../../types.ts';
import { useMinistry } from '../../context/MinistryContext.tsx';

interface FolderManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: NoteFolder[];
  onCreateFolder: (name: string, color?: string, icon?: string) => void;
  onDeleteFolder: (folderId: string) => void;
}

export const FolderManagerModal: React.FC<FolderManagerModalProps> = ({
  isOpen,
  onClose,
  folders,
  onCreateFolder,
  onDeleteFolder,
}) => {
  const { t } = useMinistry();
  const [folderName, setFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#3B82F6');

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

  const colorChoices = [
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#EF4444', // Red
    '#64748B', // Slate
  ];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;
    onCreateFolder(folderName.trim(), selectedColor);
    setFolderName('');
  };

  const handleDelete = (folderId: string) => {
    if (window.confirm(t.notes.deleteFolderConfirm)) {
      onDeleteFolder(folderId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto select-none">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-md max-h-[85vh] overflow-y-auto overscroll-contain rounded-3xl bg-white dark:bg-slate-900 p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-blue-50 dark:bg-blue-900/40 p-2 text-blue-600 dark:text-blue-400">
              <Folder className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t.notes.manageFolders}
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

        {/* Create Folder Form */}
        <form onSubmit={handleCreate} className="space-y-3 pt-1">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              {t.notes.folderName}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={folderName}
                onChange={e => setFolderName(e.target.value)}
                placeholder="e.g. Return Visits"
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={!folderName.trim()}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 px-3.5 py-2 text-xs font-bold text-white transition-colors cursor-pointer shrink-0 flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                {t.notes.createFolder}
              </button>
            </div>
          </div>

          {/* Color picker swatches */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Color:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {colorChoices.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className="h-6 w-6 rounded-lg transition-transform hover:scale-110 flex items-center justify-center cursor-pointer"
                  style={{ backgroundColor: color }}
                >
                  {selectedColor === color && <Check className="h-3 w-3 text-white" />}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Existing Folders List */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-3 max-h-56 overflow-y-auto space-y-1.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            {t.notes.folders} ({folders.length})
          </p>
          {folders.map(f => (
            <div
              key={f.id}
              className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: f.color || '#3B82F6' }} />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {f.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(f.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                title={t.common.delete}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {t.common.close}
          </button>
        </div>
      </div>
    </div>
  );
};
