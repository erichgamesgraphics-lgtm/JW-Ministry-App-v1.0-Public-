import React, { useState } from 'react';
import {
  Pin,
  Archive,
  MoreVertical,
  Copy,
  Trash2,
  Share2,
  Folder,
  Hash,
  Compass,
  MapPin,
  Users,
  BookOpen,
  CheckSquare,
  FileText,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { NoteItem, NoteFolder, NoteType } from '../../types.ts';
import { useMinistry } from '../../context/MinistryContext.tsx';

interface NoteCardProps {
  note: NoteItem;
  folder?: NoteFolder;
  onOpen: () => void;
  onTogglePin: () => void;
  onToggleArchive: () => void;
  onDuplicate: () => void;
  onDelete: (permanent?: boolean) => void;
  onRestore?: () => void;
  onShare?: () => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  folder,
  onOpen,
  onTogglePin,
  onToggleArchive,
  onDuplicate,
  onDelete,
  onRestore,
  onShare,
}) => {
  const { t, language } = useMinistry();
  const [showMenu, setShowMenu] = useState(false);

  // Type metadata
  const getTypeMeta = (type: NoteType) => {
    switch (type) {
      case 'MINISTRY':
        return { label: t.notes.types.ministry, icon: Compass, color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800' };
      case 'TERRITORY':
        return { label: t.notes.types.territory, icon: MapPin, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800' };
      case 'HOUSE_LIST':
        return { label: t.notes.types.houseList, icon: CheckSquare, color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800' };
      case 'RETURN_VISIT':
        return { label: t.notes.types.returnVisit, icon: Users, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800' };
      case 'BIBLE_STUDY':
        return { label: t.notes.types.bibleStudy, icon: BookOpen, color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800' };
      case 'MEETING':
        return { label: t.notes.types.meeting, icon: FileText, color: 'text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/60 border-pink-200 dark:border-pink-800' };
      case 'PREPARATION':
        return { label: t.notes.types.preparation, icon: Sparkles, color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 border-cyan-200 dark:border-cyan-800' };
      case 'PERSONAL':
        return { label: t.notes.types.personal, icon: FileText, color: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700' };
      default:
        return { label: t.notes.types.general, icon: FileText, color: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700' };
    }
  };

  const typeMeta = getTypeMeta(note.type);
  const TypeIcon = typeMeta.icon;

  // Clean snippet from plain text or HTML
  const snippet = note.plainTextPreview || note.contentHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  // Territory / House progress stats
  const totalHouses = note.houseList?.length || 0;
  const visitedHouses = note.houseList?.filter(h => h.status !== 'NOT_VISITED').length || 0;

  // Format date
  const localeCode = language === 'hy' ? 'hy-AM' : language === 'ru' ? 'ru-RU' : language === 'hi' ? 'hi-IN' : language === 'pa' ? 'pa-IN' : 'en-US';
  const formattedDate = new Date(note.updatedAt).toLocaleDateString(localeCode, {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      onClick={onOpen}
      className={`group relative flex flex-col justify-between rounded-3xl border transition-all duration-200 cursor-pointer select-none p-4 sm:p-5 ${
        note.isTrash
          ? 'opacity-70 border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50'
          : note.isPinned
          ? 'border-blue-300/80 dark:border-blue-700/80 bg-gradient-to-b from-blue-50/40 to-white dark:from-blue-950/20 dark:to-slate-900 shadow-sm hover:shadow-md hover:border-blue-400'
          : 'border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      <div>
        {/* Top bar: Type, Territory Badge, Pinned icon, Action Menu */}
        <div className="flex items-center justify-between gap-1.5 mb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Note Type badge */}
            <span
              className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] sm:text-[11px] font-bold ${typeMeta.color}`}
            >
              <TypeIcon className="h-3 w-3" />
              {typeMeta.label}
            </span>

            {/* Folder badge */}
            {folder && (
              <span
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-2 py-0.5 text-[10px] sm:text-[11px] font-medium text-slate-600 dark:text-slate-300"
              >
                <Folder className="h-2.5 w-2.5" style={{ color: folder.color }} />
                {folder.name}
              </span>
            )}

            {/* Territory badge */}
            {note.territoryNumber && (
              <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                <Hash className="h-2.5 w-2.5" />
                {note.territoryNumber}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
            {/* Pin Toggle */}
            {!note.isTrash && (
              <button
                type="button"
                onClick={onTogglePin}
                className={`p-1 rounded-lg transition-colors cursor-pointer ${
                  note.isPinned
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 opacity-60 group-hover:opacity-100'
                }`}
                title={note.isPinned ? t.notes.unpinNote : t.notes.pinNote}
              >
                <Pin className={`h-3.5 w-3.5 ${note.isPinned ? 'fill-current' : ''}`} />
              </button>
            )}

            {/* Context menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {showMenu && (
                <div
                  className="absolute right-0 top-full mt-1 w-44 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 shadow-xl z-30 space-y-0.5 select-none"
                  onClick={() => setShowMenu(false)}
                >
                  {note.isTrash ? (
                    <>
                      {onRestore && (
                        <button
                          type="button"
                          onClick={onRestore}
                          className="w-full flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                        >
                          <RotateCcw className="h-3.5 w-3.5 text-emerald-500" />
                          {t.notes.restoreNote}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDelete(true)}
                        className="w-full flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {t.notes.deletePermanently}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={onTogglePin}
                        className="w-full flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                      >
                        <Pin className="h-3.5 w-3.5" />
                        {note.isPinned ? t.notes.unpinNote : t.notes.pinNote}
                      </button>
                      <button
                        type="button"
                        onClick={onToggleArchive}
                        className="w-full flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                      >
                        <Archive className="h-3.5 w-3.5" />
                        {note.isArchived ? t.notes.unarchiveNote : t.notes.archiveNote}
                      </button>
                      <button
                        type="button"
                        onClick={onDuplicate}
                        className="w-full flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        {t.notes.duplicateNote}
                      </button>
                      {onShare && (
                        <button
                          type="button"
                          onClick={onShare}
                          className="w-full flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                        >
                          <Share2 className="h-3.5 w-3.5 text-blue-500" />
                          {t.common.share}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDelete(false)}
                        className="w-full flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {t.notes.deleteNote}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Note Title */}
        <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white line-clamp-1 leading-snug">
          {note.title.trim() || 'Untitled Note'}
        </h4>

        {/* Content Preview Snippet */}
        {snippet ? (
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
            {snippet}
          </p>
        ) : (
          <p className="mt-1 text-xs text-slate-400 italic">Empty note...</p>
        )}

        {/* Territory Progress if available */}
        {totalHouses > 0 && (
          <div className="mt-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              <span>{t.notes.housesVisitedCount(visitedHouses, totalHouses)}</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {Math.round((visitedHouses / totalHouses) * 100)}%
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-600"
                style={{ width: `${(visitedHouses / totalHouses) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Tag chips */}
        {note.tags && note.tags.length > 0 && (
          <div className="mt-2.5 flex items-center gap-1 flex-wrap">
            {note.tags.map((tag, idx) => (
              <span
                key={idx}
                className="rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-400"
              >
                {tag.startsWith('#') ? tag : `#${tag}`}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card Footer: Date */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-medium text-slate-400">
        <span>{formattedDate}</span>
        {note.isArchived && (
          <span className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-500 font-semibold">
            <Archive className="h-2.5 w-2.5" />
            {t.notes.archived}
          </span>
        )}
      </div>
    </div>
  );
};
