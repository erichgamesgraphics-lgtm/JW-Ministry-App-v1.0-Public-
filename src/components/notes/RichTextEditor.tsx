import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  CheckSquare,
  Table as TableIcon,
  Image as ImageIcon,
  Link as LinkIcon,
  Undo2,
  Redo2,
  Search,
  Palette,
  Highlighter,
  ChevronDown,
  X,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { useMinistry } from '../../context/MinistryContext.tsx';

interface RichTextEditorProps {
  initialHtml: string;
  onChange: (html: string, plainText: string) => void;
  placeholder?: string;
  onAutoSaveStatusChange?: (status: 'saved' | 'saving') => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  initialHtml,
  onChange,
  placeholder,
  onAutoSaveStatusChange,
}) => {
  const { t } = useMinistry();
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // History stack for custom undo/redo
  const historyRef = useRef<string[]>([initialHtml || '<p><br></p>']);
  const historyIndexRef = useRef<number>(0);
  const saveTimeoutRef = useRef<any>(null);

  // Toolbar active states
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    superscript: false,
    subscript: false,
    alignLeft: true,
    alignCenter: false,
    alignRight: false,
    alignJustify: false,
    unorderedList: false,
    orderedList: false,
  });

  // Dropdown states
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);

  // Table modal state
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

  // Link modal state
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const savedSelectionRef = useRef<Range | null>(null);

  // Find & Replace state
  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');

  useEffect(() => {
    if (showTableModal || showLinkModal) {
      const originalStyle = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [showTableModal, showLinkModal]);

  // Save selection before opening modal
  const saveSelection = () => {
    if (typeof window === 'undefined') return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    if (typeof window === 'undefined') return;
    if (savedSelectionRef.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedSelectionRef.current);
      }
    }
  };

  // Sync initial content on mount
  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML.trim()) {
      editorRef.current.innerHTML = initialHtml || '<p><br></p>';
    }
  }, []);

  // Update active formatting states on selectionchange
  const updateToolbarStates = useCallback(() => {
    if (typeof document === 'undefined') return;
    try {
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strike: document.queryCommandState('strikeThrough'),
        superscript: document.queryCommandState('superscript'),
        subscript: document.queryCommandState('subscript'),
        alignLeft: document.queryCommandState('justifyLeft'),
        alignCenter: document.queryCommandState('justifyCenter'),
        alignRight: document.queryCommandState('justifyRight'),
        alignJustify: document.queryCommandState('justifyFull'),
        unorderedList: document.queryCommandState('insertUnorderedList'),
        orderedList: document.queryCommandState('insertOrderedList'),
      });
    } catch {}
  }, []);

  useEffect(() => {
    const handleSelChange = () => {
      if (editorRef.current && editorRef.current.contains(document.activeElement)) {
        updateToolbarStates();
      }
    };
    document.addEventListener('selectionchange', handleSelChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelChange);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        if (editorRef.current) {
          const html = editorRef.current.innerHTML;
          const plainText = editorRef.current.innerText || '';
          onChange(html, plainText);
        }
      }
    };
  }, [updateToolbarStates, onChange]);

  // Push history snapshot
  const pushHistory = (html: string) => {
    const history = historyRef.current;
    const idx = historyIndexRef.current;
    if (history[idx] === html) return;

    // Truncate future if branched
    const nextHistory = history.slice(0, idx + 1);
    nextHistory.push(html);
    if (nextHistory.length > 50) nextHistory.shift(); // Limit to 50 snapshots
    historyRef.current = nextHistory;
    historyIndexRef.current = nextHistory.length - 1;
  };

  // Debounced change handler
  const handleContentChange = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    const plainText = editorRef.current.innerText || '';

    onAutoSaveStatusChange?.('saving');

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      pushHistory(html);
      onChange(html, plainText);
      onAutoSaveStatusChange?.('saved');
    }, 600);
  };

  // Execute standard formatting commands
  const execCmd = (command: string, value: string | undefined = undefined) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    try {
      document.execCommand(command, false, value);
    } catch {}
    updateToolbarStates();
    handleContentChange();
  };

  // Undo / Redo
  const handleUndo = () => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      const html = historyRef.current[historyIndexRef.current];
      if (editorRef.current) {
        editorRef.current.innerHTML = html;
        handleContentChange();
      }
    }
  };

  const handleRedo = () => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      const html = historyRef.current[historyIndexRef.current];
      if (editorRef.current) {
        editorRef.current.innerHTML = html;
        handleContentChange();
      }
    }
  };

  // Insert Checklist Item
  const handleInsertChecklist = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    const checklistItemHtml = `
      <div class="note-checklist-item flex items-start gap-2.5 my-1.5 select-none" data-checked="false">
        <button type="button" class="checklist-toggle flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-transparent transition-all cursor-pointer select-none mt-0.5" contenteditable="false">
          <svg class="h-3.5 w-3.5 fill-none stroke-current stroke-[2.5]" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
        </button>
        <span class="checklist-text flex-1 outline-none text-slate-800 dark:text-slate-200" contenteditable="true">Task item...</span>
      </div>
    `;

    document.execCommand('insertHTML', false, checklistItemHtml);
    handleContentChange();
  };

  // Handle Checklist Click inside editor
  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const toggleBtn = target.closest('.checklist-toggle');
    if (toggleBtn) {
      e.preventDefault();
      e.stopPropagation();
      const item = toggleBtn.closest('.note-checklist-item');
      if (item) {
        const isChecked = item.getAttribute('data-checked') === 'true';
        item.setAttribute('data-checked', (!isChecked).toString());
        const textSpan = item.querySelector('.checklist-text');

        if (!isChecked) {
          toggleBtn.classList.remove('bg-white', 'dark:bg-slate-800', 'text-transparent');
          toggleBtn.classList.add('bg-blue-600', 'border-blue-600', 'text-white');
          textSpan?.classList.add('line-through', 'opacity-60');
        } else {
          toggleBtn.classList.add('bg-white', 'dark:bg-slate-800', 'text-transparent');
          toggleBtn.classList.remove('bg-blue-600', 'border-blue-600', 'text-white');
          textSpan?.classList.remove('line-through', 'opacity-60');
        }
        handleContentChange();
      }
    }
  };

  // Handle Enter key inside checklist to automatically create next checklist item
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const anchorNode = sel.anchorNode;
      const checklistItem = anchorNode ? (anchorNode.parentElement?.closest('.note-checklist-item') as HTMLElement) : null;

      if (checklistItem) {
        e.preventDefault();
        const nextItem = document.createElement('div');
        nextItem.className = 'note-checklist-item flex items-start gap-2.5 my-1.5 select-none';
        nextItem.setAttribute('data-checked', 'false');
        nextItem.innerHTML = `
          <button type="button" class="checklist-toggle flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-transparent transition-all cursor-pointer select-none mt-0.5" contenteditable="false">
            <svg class="h-3.5 w-3.5 fill-none stroke-current stroke-[2.5]" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
          </button>
          <span class="checklist-text flex-1 outline-none text-slate-800 dark:text-slate-200" contenteditable="true"><br></span>
        `;
        checklistItem.after(nextItem);

        // Move caret to next item
        const range = document.createRange();
        const textSpan = nextItem.querySelector('.checklist-text');
        if (textSpan) {
          range.selectNodeContents(textSpan);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
        handleContentChange();
      }
    }
  };

  // Insert Table
  const handleInsertTable = () => {
    restoreSelection();
    if (!editorRef.current) return;
    editorRef.current.focus();

    const rowsHtml = Array.from({ length: tableRows })
      .map(
        (_, r) =>
          `<tr>${Array.from({ length: tableCols })
            .map(
              (_, c) =>
                `<td class="border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200">${
                  r === 0 ? `<strong>Header ${c + 1}</strong>` : `Cell`
                }</td>`
            )
            .join('')}</tr>`
      )
      .join('');

    const tableContainerHtml = `
      <div class="note-table-wrapper my-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-1" contenteditable="false">
        <table class="w-full border-collapse min-w-[280px]" contenteditable="true">
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
      <p><br></p>
    `;

    document.execCommand('insertHTML', false, tableContainerHtml);
    setShowTableModal(false);
    handleContentChange();
  };

  // Insert Link
  const handleInsertLink = () => {
    restoreSelection();
    if (!editorRef.current || !linkUrl.trim()) return;
    editorRef.current.focus();

    const formattedUrl = linkUrl.startsWith('http://') || linkUrl.startsWith('https://')
      ? linkUrl
      : `https://${linkUrl}`;
    const displayText = linkText.trim() || linkUrl;

    const linkHtml = `<a href="${formattedUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 underline font-medium hover:text-blue-700 dark:hover:text-blue-300">${displayText}</a>&nbsp;`;
    document.execCommand('insertHTML', false, linkHtml);

    setLinkUrl('');
    setLinkText('');
    setShowLinkModal(false);
    handleContentChange();
  };

  // Image Upload / Camera Handling
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      if (editorRef.current) {
        editorRef.current.focus();
        const imgHtml = `
          <figure class="note-image-figure my-4 flex flex-col items-center select-none" contenteditable="false">
            <img src="${dataUrl}" alt="Inserted note image" class="max-h-[380px] w-auto max-w-full rounded-2xl shadow-md object-contain border border-slate-200 dark:border-slate-800" style="aspect-ratio: auto;" />
            <figcaption class="mt-2 text-center text-xs text-slate-500 dark:text-slate-400 outline-none w-full" contenteditable="true">${t.notes.formatting.imageCaption}</figcaption>
          </figure>
          <p><br></p>
        `;
        document.execCommand('insertHTML', false, imgHtml);
        handleContentChange();
      }
    };
    reader.readAsDataURL(file);
    // Reset file input
    e.target.value = '';
  };

  // Find & Replace
  const handleFind = (forward = true) => {
    if (!findQuery || typeof window === 'undefined') return;
    const win = window as any;
    if (win.find) {
      win.find(findQuery, false, !forward, true, false, false, false);
    }
  };

  const handleReplace = () => {
    const sel = window.getSelection();
    if (sel && sel.toString().toLowerCase() === findQuery.toLowerCase()) {
      document.execCommand('insertText', false, replaceQuery);
      handleContentChange();
    }
    handleFind(true);
  };

  const handleReplaceAll = () => {
    if (!editorRef.current || !findQuery) return;
    const content = editorRef.current.innerHTML;
    const regex = new RegExp(findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    editorRef.current.innerHTML = content.replace(regex, replaceQuery);
    handleContentChange();
  };

  // Color options
  const colorPalette = [
    { label: 'Default', value: 'inherit' },
    { label: 'Slate', value: '#475569' },
    { label: 'Blue', value: '#2563EB' },
    { label: 'Indigo', value: '#4F46E5' },
    { label: 'Emerald', value: '#059669' },
    { label: 'Amber', value: '#D97706' },
    { label: 'Rose', value: '#E11D48' },
    { label: 'Purple', value: '#9333EA' },
  ];

  const highlightPalette = [
    { label: 'None', value: 'transparent' },
    { label: 'Yellow', value: '#FEF08A' },
    { label: 'Green', value: '#BBF7D0' },
    { label: 'Cyan', value: '#BAE6FD' },
    { label: 'Pink', value: '#FBCFE8' },
    { label: 'Orange', value: '#FED7AA' },
  ];

  return (
    <div className="flex flex-col rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-xs overflow-hidden">
      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      {/* Main Microsoft Word-Style Toolbar */}
      <div className="sticky top-0 z-20 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md px-2 py-1.5 flex items-center gap-1 overflow-x-auto no-scrollbar select-none">
        {/* Undo / Redo */}
        <div className="flex items-center border-r border-slate-200 dark:border-slate-800 pr-1 mr-1 shrink-0">
          <button
            type="button"
            onClick={handleUndo}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={t.notes.formatting.undo}
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={t.notes.formatting.redo}
          >
            <Redo2 className="h-4 w-4" />
          </button>
        </div>

        {/* Heading / Paragraph Selector */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => {
              setShowHeadingMenu(!showHeadingMenu);
              setShowColorPicker(false);
              setShowHighlightPicker(false);
            }}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <span>{t.notes.formatting.heading}</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>

          {showHeadingMenu && (
            <div className="absolute top-full left-0 mt-1 w-44 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 shadow-xl z-30 space-y-0.5">
              <button
                type="button"
                onClick={() => {
                  execCmd('formatBlock', '<p>');
                  setShowHeadingMenu(false);
                }}
                className="w-full text-left rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 font-normal cursor-pointer"
              >
                {t.notes.formatting.normalText}
              </button>
              <button
                type="button"
                onClick={() => {
                  execCmd('formatBlock', '<h1>');
                  setShowHeadingMenu(false);
                }}
                className="w-full text-left rounded-lg px-2.5 py-1.5 text-base font-extrabold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
              >
                {t.notes.formatting.title}
              </button>
              <button
                type="button"
                onClick={() => {
                  execCmd('formatBlock', '<h2>');
                  setShowHeadingMenu(false);
                }}
                className="w-full text-left rounded-lg px-2.5 py-1.5 text-sm font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
              >
                {t.notes.formatting.heading1}
              </button>
              <button
                type="button"
                onClick={() => {
                  execCmd('formatBlock', '<h3>');
                  setShowHeadingMenu(false);
                }}
                className="w-full text-left rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
              >
                {t.notes.formatting.heading2}
              </button>
            </div>
          )}
        </div>

        {/* Text Formats (B, I, U, S) */}
        <div className="flex items-center border-l border-slate-200 dark:border-slate-800 pl-1 ml-1 shrink-0 gap-0.5">
          <button
            type="button"
            onClick={() => execCmd('bold')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              activeFormats.bold
                ? 'bg-blue-600 text-white font-bold'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
            title={t.notes.formatting.bold}
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('italic')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              activeFormats.italic
                ? 'bg-blue-600 text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
            title={t.notes.formatting.italic}
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('underline')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              activeFormats.underline
                ? 'bg-blue-600 text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
            title={t.notes.formatting.underline}
          >
            <Underline className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('strikeThrough')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              activeFormats.strike
                ? 'bg-blue-600 text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
            title={t.notes.formatting.strikethrough}
          >
            <Strikethrough className="h-4 w-4" />
          </button>
        </div>

        {/* Text Color Picker */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => {
              setShowColorPicker(!showColorPicker);
              setShowHighlightPicker(false);
              setShowHeadingMenu(false);
            }}
            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center"
            title={t.notes.formatting.textColor}
          >
            <Palette className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </button>

          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl z-30 grid grid-cols-4 gap-1.5 w-36">
              {colorPalette.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => {
                    execCmd('foreColor', c.value);
                    setShowColorPicker(false);
                  }}
                  className="h-6 w-6 rounded-lg border border-slate-300 dark:border-slate-600 hover:scale-110 transition-transform cursor-pointer"
                  style={{ backgroundColor: c.value === 'inherit' ? '#000000' : c.value }}
                  title={c.label}
                />
              ))}
            </div>
          )}
        </div>

        {/* Highlight Color Picker */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => {
              setShowHighlightPicker(!showHighlightPicker);
              setShowColorPicker(false);
              setShowHeadingMenu(false);
            }}
            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center"
            title={t.notes.formatting.highlightColor}
          >
            <Highlighter className="h-4 w-4 text-amber-500" />
          </button>

          {showHighlightPicker && (
            <div className="absolute top-full left-0 mt-1 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl z-30 grid grid-cols-3 gap-1.5 w-32">
              {highlightPalette.map(h => (
                <button
                  key={h.value}
                  type="button"
                  onClick={() => {
                    execCmd('hiliteColor', h.value);
                    setShowHighlightPicker(false);
                  }}
                  className="h-6 w-8 rounded-lg border border-slate-300 dark:border-slate-600 hover:scale-105 transition-transform cursor-pointer"
                  style={{ backgroundColor: h.value }}
                  title={h.label}
                />
              ))}
            </div>
          )}
        </div>

        {/* Alignment */}
        <div className="flex items-center border-l border-slate-200 dark:border-slate-800 pl-1 ml-1 shrink-0 gap-0.5">
          <button
            type="button"
            onClick={() => execCmd('justifyLeft')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              activeFormats.alignLeft
                ? 'bg-blue-600 text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
            title={t.notes.formatting.alignLeft}
          >
            <AlignLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('justifyCenter')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              activeFormats.alignCenter
                ? 'bg-blue-600 text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
            title={t.notes.formatting.alignCenter}
          >
            <AlignCenter className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('justifyRight')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              activeFormats.alignRight
                ? 'bg-blue-600 text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
            title={t.notes.formatting.alignRight}
          >
            <AlignRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('justifyFull')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              activeFormats.alignJustify
                ? 'bg-blue-600 text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
            title={t.notes.formatting.alignJustify}
          >
            <AlignJustify className="h-4 w-4" />
          </button>
        </div>

        {/* Lists & Checklists */}
        <div className="flex items-center border-l border-slate-200 dark:border-slate-800 pl-1 ml-1 shrink-0 gap-0.5">
          <button
            type="button"
            onClick={() => execCmd('insertUnorderedList')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              activeFormats.unorderedList
                ? 'bg-blue-600 text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
            title={t.notes.formatting.bulletList}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('insertOrderedList')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              activeFormats.orderedList
                ? 'bg-blue-600 text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
            title={t.notes.formatting.numberedList}
          >
            <ListOrdered className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleInsertChecklist}
            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={t.notes.formatting.checklist}
          >
            <CheckSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </button>
        </div>

        {/* Table & Images & Links */}
        <div className="flex items-center border-l border-slate-200 dark:border-slate-800 pl-1 ml-1 shrink-0 gap-0.5">
          <button
            type="button"
            onClick={() => {
              saveSelection();
              setShowTableModal(true);
            }}
            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={t.notes.formatting.table}
          >
            <TableIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={t.notes.formatting.image}
          >
            <ImageIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              saveSelection();
              const sel = window.getSelection();
              setLinkText(sel ? sel.toString() : '');
              setShowLinkModal(true);
            }}
            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={t.notes.formatting.link}
          >
            <LinkIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Find & Replace Toggle */}
        <div className="flex items-center border-l border-slate-200 dark:border-slate-800 pl-1 ml-1 shrink-0">
          <button
            type="button"
            onClick={() => setShowFindReplace(!showFindReplace)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              showFindReplace
                ? 'bg-blue-600 text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
            title={t.notes.formatting.findAndReplace}
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Floating Find & Replace Bar */}
      {showFindReplace && (
        <div className="border-b border-slate-200 dark:border-slate-800 bg-blue-50/80 dark:bg-blue-950/40 p-2.5 flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={findQuery}
              onChange={e => setFindQuery(e.target.value)}
              placeholder={t.notes.formatting.find}
              className="bg-transparent text-xs text-slate-900 dark:text-white focus:outline-none w-28 sm:w-36"
            />
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleFind(false)}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1 hover:bg-slate-100 transition-colors cursor-pointer"
              title={t.notes.formatting.prevMatch}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleFind(true)}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1 hover:bg-slate-100 transition-colors cursor-pointer"
              title={t.notes.formatting.nextMatch}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1">
            <input
              type="text"
              value={replaceQuery}
              onChange={e => setReplaceQuery(e.target.value)}
              placeholder={t.notes.formatting.replace}
              className="bg-transparent text-xs text-slate-900 dark:text-white focus:outline-none w-28 sm:w-36"
            />
          </div>

          <button
            type="button"
            onClick={handleReplace}
            className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 font-semibold text-[11px] cursor-pointer"
          >
            {t.notes.formatting.replace}
          </button>
          <button
            type="button"
            onClick={handleReplaceAll}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 px-2.5 py-1 font-semibold text-[11px] text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            {t.notes.formatting.replaceAll}
          </button>

          <button
            type="button"
            onClick={() => setShowFindReplace(false)}
            className="ml-auto p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Editable Document Area */}
      <div
        ref={editorRef}
        contentEditable
        data-placeholder={placeholder}
        onInput={handleContentChange}
        onClick={handleEditorClick}
        onKeyDown={handleKeyDown}
        className="min-h-[280px] sm:min-h-[380px] p-4 sm:p-5 outline-none font-sans text-sm sm:text-base leading-relaxed text-slate-900 dark:text-slate-100 selection:bg-blue-500/25"
        style={{
          wordBreak: 'break-word',
          lineHeight: '1.65',
        }}
      />

      {/* Insert Table Modal */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <div
            onClick={() => setShowTableModal(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
          />

          {/* Modal Panel */}
          <div className="relative z-10 w-full max-w-xs max-h-[85vh] overflow-y-auto overscroll-contain rounded-3xl bg-white dark:bg-slate-900 p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {t.notes.formatting.insertTable}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  {t.notes.formatting.rows}
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={tableRows}
                  onChange={e => setTableRows(parseInt(e.target.value, 10) || 1)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-sm font-bold text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  {t.notes.formatting.columns}
                </label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={tableCols}
                  onChange={e => setTableCols(parseInt(e.target.value, 10) || 1)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-sm font-bold text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowTableModal(false)}
                className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={handleInsertTable}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 text-xs font-bold text-white cursor-pointer"
              >
                {t.common.confirm}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Insert Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <div
            onClick={() => setShowLinkModal(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
          />

          {/* Modal Panel */}
          <div className="relative z-10 w-full max-w-sm max-h-[85vh] overflow-y-auto overscroll-contain rounded-3xl bg-white dark:bg-slate-900 p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {t.notes.formatting.insertLink}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  {t.notes.formatting.linkUrl}
                </label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  placeholder="https://www.jw.org"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  {t.notes.formatting.linkText}
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={e => setLinkText(e.target.value)}
                  placeholder="e.g. JW.ORG Article"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={handleInsertLink}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 text-xs font-bold text-white cursor-pointer"
              >
                {t.common.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
