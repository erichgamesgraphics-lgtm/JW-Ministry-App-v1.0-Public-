import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Pin,
  FolderPlus,
  Folder,
  Tag,
  Filter,
  ArrowUpDown,
  Archive,
  Trash2,
  Copy,
  Share2,
  MoreVertical,
  MapPin,
  CheckCircle2,
  FileText,
  X,
  RotateCcw,
  Sparkles,
  ChevronLeft,
} from 'lucide-react';
import { useMinistry } from '../context/MinistryContext.tsx';
import { MinistryNote, NoteTypeCategory } from '../types.ts';
import { RichTextEditor } from '../components/RichTextEditor.tsx';
import { HouseListTracker } from '../components/HouseListTracker.tsx';

export const NotesScreen: React.FC = () => {
  const {
    notes = [],
    noteFolders = [],
    saveNote,
    deleteNote,
    restoreNote,
    duplicateNote,
    togglePinNote,
    toggleArchiveNote,
    saveFolder,
    deleteFolder,
    t,
  } = useMinistry();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PINNED' | 'HOUSE_LIST' | 'RETURN_VISIT' | 'BIBLE_STUDY' | 'ARCHIVED' | 'TRASH'>('ALL');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'RECENT_MODIFIED' | 'RECENT_CREATED' | 'OLDEST' | 'TITLE'>('RECENT_MODIFIED');

  // Bottom sheets & Modals state
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Active Editor Note state
  const [editingNote, setEditingNote] = useState<MinistryNote | null>(null);
  const [newTagInput, setNewTagInput] = useState('');

  // Open note for editing or create brand new note
  const handleCreateNewNote = (noteType: NoteTypeCategory = 'GENERAL') => {
    const created = saveNote({
      title: noteType === 'HOUSE_LIST' ? 'Territory House List' : 'Untitled Note',
      content: '',
      noteType,
      tags: noteType === 'HOUSE_LIST' ? ['#territory'] : [],
      houses: noteType === 'HOUSE_LIST' ? [] : undefined,
    });
    setEditingNote(created);
  };

  // Collect all unique tags across active notes
  const allUniqueTags = useMemo(() => {
    const tagsSet = new Set<string>();
    notes.forEach(n => {
      if (!n.isDeleted && n.tags) {
        n.tags.forEach(tg => tagsSet.add(tg.trim()));
      }
    });
    return Array.from(tagsSet);
  }, [notes]);

  // Filter notes
  const filteredNotes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return notes.filter(note => {
      // Trash filter check
      if (activeFilter === 'TRASH') {
        if (!note.isDeleted) return false;
      } else {
        if (note.isDeleted) return false;
      }

      // Archive filter check
      if (activeFilter === 'ARCHIVED') {
        if (!note.isArchived) return false;
      } else if (activeFilter !== 'TRASH') {
        if (note.isArchived) return false;
      }

      // Filter category check
      if (activeFilter === 'PINNED' && !note.isPinned) return false;
      if (activeFilter === 'HOUSE_LIST' && note.noteType !== 'HOUSE_LIST' && note.noteType !== 'TERRITORY') return false;
      if (activeFilter === 'RETURN_VISIT' && note.noteType !== 'RETURN_VISIT') return false;
      if (activeFilter === 'BIBLE_STUDY' && note.noteType !== 'BIBLE_STUDY') return false;

      // Folder check
      if (selectedFolderId && note.folderId !== selectedFolderId) return false;

      // Tag check
      if (selectedTag && (!note.tags || !note.tags.includes(selectedTag))) return false;

      // Search Query check
      if (q) {
        const titleMatch = note.title.toLowerCase().includes(q);
        const contentMatch = note.content.toLowerCase().includes(q);
        const tagMatch = note.tags?.some(tg => tg.toLowerCase().includes(q));
        const folderMatch = note.folderName?.toLowerCase().includes(q);
        const territoryMatch = note.territoryName?.toLowerCase().includes(q);
        const houseMatch = note.houses?.some(h =>
          h.number.toLowerCase().includes(q) ||
          h.label?.toLowerCase().includes(q) ||
          h.notes.toLowerCase().includes(q)
        );
        return titleMatch || contentMatch || tagMatch || folderMatch || territoryMatch || houseMatch;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'RECENT_CREATED') return b.createdAt - a.createdAt;
      if (sortBy === 'OLDEST') return a.createdAt - b.createdAt;
      if (sortBy === 'TITLE') return a.title.localeCompare(b.title);
      return b.updatedAt - a.updatedAt;
    });
  }, [notes, activeFilter, selectedFolderId, selectedTag, searchQuery, sortBy]);

  // Pinned Notes Subset
  const pinnedNotes = useMemo(() => {
    return filteredNotes.filter(n => n.isPinned);
  }, [filteredNotes]);

  // Handle Share / Copy
  const handleShareNote = (note: MinistryNote) => {
    const plainText = note.content.replace(/<[^>]+>/g, ' ');
    const houseDetails = note.houses?.map(h => `House ${h.number}: ${h.status} - ${h.notes}`).join('\n') || '';
    const fullText = `${note.title}\n\n${plainText}\n\n${houseDetails}`.trim();

    if (navigator.share) {
      navigator.share({ title: note.title, text: fullText }).catch(() => {});
    } else {
      navigator.clipboard.writeText(fullText);
      alert(t.notes.copyText);
    }
  };

  // Add Tag to editing note
  const handleAddTagToEditingNote = () => {
    if (!newTagInput.trim() || !editingNote) return;
    let formattedTag = newTagInput.trim();
    if (!formattedTag.startsWith('#')) formattedTag = `#${formattedTag}`;

    const currentTags = editingNote.tags || [];
    if (!currentTags.includes(formattedTag)) {
      const updatedTags = [...currentTags, formattedTag];
      const updated = saveNote({ ...editingNote, tags: updatedTags });
      setEditingNote(updated);
    }
    setNewTagInput('');
  };

  // Remove Tag from editing note
  const handleRemoveTag = (tagToRemove: string) => {
    if (!editingNote) return;
    const updatedTags = (editingNote.tags || []).filter(t => t !== tagToRemove);
    const updated = saveNote({ ...editingNote, tags: updatedTags });
    setEditingNote(updated);
  };

  // Create Folder handler
  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    saveFolder(newFolderName.trim());
    setNewFolderName('');
    setShowNewFolderModal(false);
  };

  return (
    <div className="space-y-4 pb-24 max-w-2xl mx-auto">
      {/* Top Header & Search Bar */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t.notes.title}
          </h1>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCreateNewNote('HOUSE_LIST')}
              className="py-2 px-3 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs hover:bg-blue-100 transition-colors cursor-pointer"
            >
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">{t.notes.newTerritoryList}</span>
              <span className="sm:hidden">Territory</span>
            </button>

            <button
              onClick={() => handleCreateNewNote('GENERAL')}
              className="py-2 px-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>{t.notes.newNote}</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t.notes.search}
            className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131D31] text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {[
            { id: 'ALL' as const, label: t.notes.allNotes },
            { id: 'PINNED' as const, label: t.notes.pinned },
            { id: 'HOUSE_LIST' as const, label: 'Territories / Houses' },
            { id: 'RETURN_VISIT' as const, label: t.notes.returnVisit },
            { id: 'BIBLE_STUDY' as const, label: t.notes.bibleStudy },
            { id: 'ARCHIVED' as const, label: t.notes.archived },
            { id: 'TRASH' as const, label: t.notes.trash },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === f.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}

          {/* Sort Button */}
          <button
            onClick={() => setShowSortSheet(true)}
            className="py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131D31] text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer ml-auto"
            title={t.notes.filterAndSort}
          >
            <ArrowUpDown className="h-3.5 w-3.5 text-blue-600" />
            <span>Sort</span>
          </button>
        </div>

        {/* Folders & Tags Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
          {/* Folders */}
          <button
            onClick={() => setShowNewFolderModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold hover:border-blue-500 cursor-pointer shrink-0"
          >
            <FolderPlus className="h-3.5 w-3.5" />
            <span>{t.notes.createFolder}</span>
          </button>

          {noteFolders.map(folder => (
            <button
              key={folder.id}
              onClick={() => setSelectedFolderId(selectedFolderId === folder.id ? null : folder.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                selectedFolderId === folder.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Folder className="h-3.5 w-3.5" />
              <span>{folder.name}</span>
            </button>
          ))}

          {/* Tag Pills */}
          {allUniqueTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                selectedTag === tag
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400'
              }`}
            >
              <Tag className="h-3.5 w-3.5" />
              <span>{tag}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Pinned Notes Highlight Section */}
      {activeFilter === 'ALL' && pinnedNotes.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Pin className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
            <span>{t.notes.pinned}</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pinnedNotes.map(note => (
              <div
                key={note.id}
                onClick={() => setEditingNote(note)}
                className="group relative rounded-3xl border-2 border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 p-4 shadow-xs hover:border-amber-400 transition-all cursor-pointer space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white line-clamp-1">
                    {note.title}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePinNote(note.id);
                    }}
                    className="p-1 text-amber-600 hover:text-amber-800 cursor-pointer shrink-0"
                    title={t.notes.unpin}
                  >
                    <Pin className="h-4 w-4 fill-amber-500 text-amber-500" />
                  </button>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  {note.content.replace(/<[^>]+>/g, ' ') || 'Empty note...'}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                  {note.folderName && (
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {note.folderName}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Notes List */}
      <div className="space-y-3">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-[#131D31]/50 space-y-2">
            <FileText className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {t.notes.noNotesFound}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
              {t.notes.noNotesDesc}
            </p>
            <button
              onClick={() => handleCreateNewNote('GENERAL')}
              className="mt-2 py-2 px-4 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>{t.notes.newNote}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredNotes.map(note => {
              const housesCount = note.houses?.length || 0;
              const visitedHouses = note.houses?.filter(h => h.status !== 'NOT_VISITED' && h.status !== 'NO_ONE_HOME').length || 0;

              return (
                <div
                  key={note.id}
                  onClick={() => setEditingNote(note)}
                  className="group relative rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#131D31] p-4 shadow-xs hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer space-y-2.5 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {note.noteType === 'HOUSE_LIST' || note.noteType === 'TERRITORY' ? (
                          <MapPin className="h-4 w-4 text-blue-600 shrink-0" />
                        ) : note.noteType === 'RETURN_VISIT' ? (
                          <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
                        ) : (
                          <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                        )}
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {note.title}
                        </h3>
                      </div>

                      {/* Quick Pin Action */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePinNote(note.id);
                        }}
                        className="p-1 text-slate-300 hover:text-amber-500 cursor-pointer shrink-0"
                        title={note.isPinned ? t.notes.unpin : t.notes.pin}
                      >
                        <Pin className={`h-4 w-4 ${note.isPinned ? 'fill-amber-500 text-amber-500' : ''}`} />
                      </button>
                    </div>

                    {/* Content Snippet */}
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                      {note.content.replace(/<[^>]+>/g, ' ') || 'No additional content...'}
                    </p>

                    {/* House List Progress Badge */}
                    {housesCount > 0 && (
                      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Progress: {visitedHouses} / {housesCount}</span>
                        </span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {Math.round((visitedHouses / housesCount) * 100)}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Folder, Tags, Actions */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex flex-wrap items-center gap-1">
                      {note.folderName && (
                        <span className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          {note.folderName}
                        </span>
                      )}
                      {note.tags?.map(tg => (
                        <span key={tg} className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          {tg}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{new Date(note.updatedAt).toLocaleDateString()}</span>

                      <div className="flex items-center gap-1">
                        {activeFilter === 'TRASH' ? (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                restoreNote(note.id);
                              }}
                              className="p-1 hover:text-emerald-600 cursor-pointer"
                              title={t.notes.restore}
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNote(note.id, true);
                              }}
                              className="p-1 hover:text-rose-600 cursor-pointer"
                              title={t.notes.permanentDelete}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                duplicateNote(note.id);
                              }}
                              className="p-1 hover:text-blue-600 cursor-pointer"
                              title={t.notes.duplicate}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleArchiveNote(note.id);
                              }}
                              className="p-1 hover:text-indigo-600 cursor-pointer"
                              title={note.isArchived ? t.notes.unarchive : t.notes.archive}
                            >
                              <Archive className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShareNote(note);
                              }}
                              className="p-1 hover:text-emerald-600 cursor-pointer"
                              title={t.notes.share}
                            >
                              <Share2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNote(note.id, false);
                              }}
                              className="p-1 hover:text-rose-600 cursor-pointer"
                              title={t.notes.delete}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ACTIVE NOTE EDITOR MODAL / FULL SCREEN                                    */}
      {/* ========================================================================= */}
      {editingNote && (
        <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-[#0B1120] overflow-y-auto flex flex-col">
          {/* Top Bar */}
          <div className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#131D31]/90 backdrop-blur-md px-4 py-3 flex items-center justify-between gap-2">
            <button
              onClick={() => setEditingNote(null)}
              className="py-1.5 px-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>{t.common.done || 'Done'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => togglePinNote(editingNote.id)}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  editingNote.isPinned ? 'bg-amber-100 text-amber-600 dark:bg-amber-950' : 'text-slate-400'
                }`}
                title={editingNote.isPinned ? t.notes.unpin : t.notes.pin}
              >
                <Pin className="h-4 w-4" />
              </button>

              <button
                onClick={() => handleShareNote(editingNote)}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                title={t.notes.share}
              >
                <Share2 className="h-4 w-4" />
              </button>

              <button
                onClick={() => {
                  deleteNote(editingNote.id, false);
                  setEditingNote(null);
                }}
                className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                title={t.notes.delete}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Editor Workspace */}
          <div className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 space-y-4">
            {/* Title Input */}
            <input
              type="text"
              value={editingNote.title}
              onChange={e => {
                const updated = saveNote({ ...editingNote, title: e.target.value });
                setEditingNote(updated);
              }}
              placeholder="Note Title..."
              className="w-full text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white bg-transparent border-none focus:outline-hidden placeholder:text-slate-300 dark:placeholder:text-slate-600"
            />

            {/* Note Meta Bar: Folder, Type, Tags */}
            <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs">
              {/* Folder Selector */}
              <div className="flex items-center gap-1.5">
                <Folder className="h-3.5 w-3.5 text-indigo-600" />
                <select
                  value={editingNote.folderId || ''}
                  onChange={e => {
                    const selectedFolder = noteFolders.find(f => f.id === e.target.value);
                    const updated = saveNote({
                      ...editingNote,
                      folderId: e.target.value || undefined,
                      folderName: selectedFolder?.name,
                    });
                    setEditingNote(updated);
                  }}
                  className="bg-transparent font-bold text-slate-700 dark:text-slate-300 focus:outline-hidden cursor-pointer"
                >
                  <option value="">No Folder</option>
                  {noteFolders.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div className="h-3 w-[1px] bg-slate-300 dark:bg-slate-700" />

              {/* Note Type Selector */}
              <select
                value={editingNote.noteType}
                onChange={e => {
                  const newType = e.target.value as NoteTypeCategory;
                  const updated = saveNote({ ...editingNote, noteType: newType });
                  setEditingNote(updated);
                }}
                className="bg-transparent font-bold text-slate-700 dark:text-slate-300 focus:outline-hidden cursor-pointer"
              >
                <option value="GENERAL">General Note</option>
                <option value="MINISTRY">Ministry Note</option>
                <option value="HOUSE_LIST">Territory House List</option>
                <option value="RETURN_VISIT">Return Visit</option>
                <option value="BIBLE_STUDY">Bible Study</option>
                <option value="MEETING_NOTE">Meeting Note</option>
                <option value="PREPARATION">Preparation</option>
              </select>

              <div className="h-3 w-[1px] bg-slate-300 dark:bg-slate-700" />

              {/* Tag Badges */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {editingNote.tags?.map(tg => (
                  <span key={tg} className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-lg text-[11px]">
                    <span>{tg}</span>
                    <button onClick={() => handleRemoveTag(tg)} className="hover:text-rose-500 cursor-pointer">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}

                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={e => setNewTagInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddTagToEditingNote()}
                    placeholder="+ Add tag"
                    className="w-20 text-[11px] font-semibold bg-transparent border-b border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* If Note is Territory / House List: Show Interactive House Tracker */}
            {(editingNote.noteType === 'HOUSE_LIST' || editingNote.noteType === 'TERRITORY') && (
              <HouseListTracker
                noteId={editingNote.id}
                houses={editingNote.houses || []}
                territoryName={editingNote.territoryName || ''}
                onUpdateTerritoryName={name => {
                  const updated = saveNote({ ...editingNote, territoryName: name });
                  setEditingNote(updated);
                }}
                address={editingNote.address || ''}
                locationName={editingNote.locationName || ''}
                latitude={editingNote.latitude}
                longitude={editingNote.longitude}
                googleMapsUrl={editingNote.googleMapsUrl || ''}
                onUpdateLocation={loc => {
                  const updated = saveNote({ ...editingNote, ...loc });
                  setEditingNote(updated);
                }}
              />
            )}

            {/* Rich Text Editor */}
            <RichTextEditor
              initialContent={editingNote.content}
              onChange={html => {
                saveNote({ ...editingNote, content: html });
              }}
              minHeight="340px"
            />
          </div>
        </div>
      )}

      {/* Sort Sheet Modal */}
      {showSortSheet && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#131D31] p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {t.notes.sortBy}
              </h3>
              <button onClick={() => setShowSortSheet(false)} className="text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              {[
                { id: 'RECENT_MODIFIED' as const, label: t.notes.sortRecentlyModified },
                { id: 'RECENT_CREATED' as const, label: t.notes.sortRecentlyCreated },
                { id: 'OLDEST' as const, label: t.notes.sortOldest },
                { id: 'TITLE' as const, label: t.notes.sortTitle },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setSortBy(opt.id);
                    setShowSortSheet(false);
                  }}
                  className={`flex w-full items-center justify-between p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                    sortBy === opt.id
                      ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                      : 'border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span>{opt.label}</span>
                  {sortBy === opt.id && <Check className="h-4 w-4 text-blue-600" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form onSubmit={handleCreateFolder} className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#131D31] p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FolderPlus className="h-4 w-4 text-indigo-600" />
                {t.notes.createFolder}
              </h3>
              <button type="button" onClick={() => setShowNewFolderModal(false)} className="text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>

            <input
              type="text"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              placeholder={t.notes.folderName}
              className="w-full text-xs font-semibold p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              autoFocus
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowNewFolderModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs"
              >
                {t.common.save}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
