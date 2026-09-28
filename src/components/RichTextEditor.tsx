import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Subscript,
  Superscript,
  List,
  ListOrdered,
  CheckSquare,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Table,
  Image as ImageIcon,
  Link,
  RotateCcw,
  RotateCw,
  Search,
  MoreHorizontal,
  X,
  Plus,
  Trash2,
  Heading,
  Check,
  Palette,
  Highlighter,
  RemoveFormatting,
} from 'lucide-react';
import { useMinistry } from '../context/MinistryContext.tsx';

interface RichTextEditorProps {
  initialContent: string;
  onChange: (htmlContent: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  initialContent,
  onChange,
  placeholder = 'Write your note content here...',
  minHeight = '280px',
}) => {
  const { t } = useMinistry();
  const editorRef = useRef<HTMLDivElement>(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showFindModal, setShowFindModal] = useState(false);

  // Link state
  const [linkUrl, setLinkUrl] = useState('https://');
  const [linkText, setLinkText] = useState('');

  // Table state
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

  // Find & Replace state
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [findMatches, setFindMatches] = useState<number>(0);

  // Auto-save status
  const [isSaving, setIsSaving] = useState(false);

  // Initialize editor content once on mount
  useEffect(() => {
    if (editorRef.current) {
      if (!editorRef.current.innerHTML || editorRef.current.innerHTML === '<br>') {
        editorRef.current.innerHTML = initialContent || '';
      }
    }
  }, []);

  // Handle editor input
  const handleInput = useCallback(() => {
    setIsSaving(true);
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html);
    }
    const timer = setTimeout(() => setIsSaving(false), 600);
    return () => clearTimeout(timer);
  }, [onChange]);

  // Execute formatting command safely
  const execCmd = (command: string, value: string | undefined = undefined) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, value);
    handleInput();
  };

  // Color options
  const colorOptions = [
    '#000000', '#334155', '#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777'
  ];
  const highlightOptions = [
    '#fef08a', '#bbf7d0', '#bfdbfe', '#fbcfe8', '#e9d5ff', '#fed7aa', '#f3f4f6'
  ];

  // Insert Checklist Item
  const handleInsertChecklist = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const checkboxHtml = `<div class="flex items-center gap-2 my-1" contenteditable="false"><input type="checkbox" class="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer" onclick="this.setAttribute('checked', this.checked ? 'checked' : '')" /><span contenteditable="true" class="outline-none text-slate-800 dark:text-slate-200"> Checklist item</span></div><br>`;
    document.execCommand('insertHTML', false, checkboxHtml);
    handleInput();
  };

  // Insert Table
  const handleInsertTable = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    let tableHtml = '<div class="overflow-x-auto my-3"><table class="w-full border-collapse border border-slate-300 dark:border-slate-700 text-xs sm:text-sm">';
    for (let r = 0; r < Math.max(1, tableRows); r++) {
      tableHtml += '<tr>';
      for (let c = 0; c < Math.max(1, tableCols); c++) {
        const cellTag = r === 0 ? 'th' : 'td';
        tableHtml += `<${cellTag} class="border border-slate-300 dark:border-slate-700 p-2 min-w-[80px] bg-slate-50/50 dark:bg-slate-800/40">${r === 0 ? `Header ${c + 1}` : 'Cell'}</${cellTag}>`;
      }
      tableHtml += '</tr>';
    }
    tableHtml += '</table></div><br>';

    document.execCommand('insertHTML', false, tableHtml);
    setShowTableModal(false);
    handleInput();
  };

  // Insert Image
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (src && editorRef.current) {
        editorRef.current.focus();
        const imgHtml = `<figure class="my-3"><img src="${src}" alt="Note image" class="max-w-full h-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mx-auto my-1 block" /><figcaption contenteditable="true" class="text-center text-xs text-slate-400 mt-1 italic">Image caption...</figcaption></figure><br>`;
        document.execCommand('insertHTML', false, imgHtml);
        handleInput();
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Insert Link
  const handleInsertLink = () => {
    if (!linkUrl || !editorRef.current) return;
    editorRef.current.focus();
    const label = linkText.trim() || linkUrl;
    const linkHtml = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 underline font-semibold hover:text-blue-700">${label}</a>&nbsp;`;
    document.execCommand('insertHTML', false, linkHtml);
    setShowLinkModal(false);
    setLinkUrl('https://');
    setLinkText('');
    handleInput();
  };

  // Find & Replace
  const handleFind = () => {
    if (!findText || !editorRef.current) return;
    const text = editorRef.current.innerText || '';
    const regex = new RegExp(findText, 'gi');
    const matches = text.match(regex);
    setFindMatches(matches ? matches.length : 0);
  };

  const handleReplace = () => {
    if (!findText || !editorRef.current) return;
    const html = editorRef.current.innerHTML;
    const regex = new RegExp(findText, 'gi');
    const newHtml = html.replace(regex, replaceText);
    editorRef.current.innerHTML = newHtml;
    handleInput();
    handleFind();
  };

  return (
    <div className="flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131D31] shadow-xs overflow-hidden">
      {/* Sticky Mobile Formatting Toolbar */}
      <div className="sticky top-0 z-20 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-[#111928]/90 backdrop-blur-md p-1.5 flex flex-wrap items-center justify-between gap-1 select-none">
        <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar py-0.5 max-w-full">
          {/* Undo / Redo */}
          <button
            type="button"
            onClick={() => execCmd('undo')}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer"
            title={t.notes.editor.undo}
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('redo')}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer"
            title={t.notes.editor.redo}
          >
            <RotateCw className="h-4 w-4" />
          </button>

          <div className="h-4 w-[1px] bg-slate-300 dark:bg-slate-700 mx-1 shrink-0" />

          {/* Bold, Italic, Underline */}
          <button
            type="button"
            onClick={() => execCmd('bold')}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer"
            title={t.notes.editor.bold}
          >
            <Bold className="h-4 w-4 stroke-[2.5]" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('italic')}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer"
            title={t.notes.editor.italic}
          >
            <Italic className="h-4 w-4 stroke-[2.5]" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('underline')}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer"
            title={t.notes.editor.underline}
          >
            <Underline className="h-4 w-4 stroke-[2.5]" />
          </button>

          <div className="h-4 w-[1px] bg-slate-300 dark:bg-slate-700 mx-1 shrink-0" />

          {/* Lists & Checklist */}
          <button
            type="button"
            onClick={() => execCmd('insertUnorderedList')}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer"
            title={t.notes.editor.bulletedList}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('insertOrderedList')}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer"
            title={t.notes.editor.numberedList}
          >
            <ListOrdered className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleInsertChecklist}
            className="p-2 rounded-xl text-blue-600 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-950/40 hover:bg-blue-100 cursor-pointer"
            title={t.notes.editor.checklist}
          >
            <CheckSquare className="h-4 w-4" />
          </button>

          <div className="h-4 w-[1px] bg-slate-300 dark:bg-slate-700 mx-1 shrink-0" />

          {/* Media / Link / Table */}
          <button
            type="button"
            onClick={() => setShowTableModal(true)}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer"
            title={t.notes.editor.table}
          >
            <Table className="h-4 w-4" />
          </button>

          <label
            className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer"
            title={t.notes.editor.image}
          >
            <ImageIcon className="h-4 w-4" />
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={() => setShowLinkModal(true)}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer"
            title={t.notes.editor.link}
          >
            <Link className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowFindModal(true)}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer"
            title={t.notes.editor.find}
          >
            <Search className="h-4 w-4" />
          </button>

          {/* More menu toggle */}
          <button
            type="button"
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              showMoreMenu
                ? 'bg-blue-600 text-white'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
            title="More Options"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>

        {/* Auto-save status indicator */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold text-slate-400">
          <span className={`h-1.5 w-1.5 rounded-full ${isSaving ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
          <span>{isSaving ? t.notes.saving : t.notes.saved}</span>
        </div>
      </div>

      {/* Expanded Formatting Bar (when More menu is opened) */}
      {showMoreMenu && (
        <div className="border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-100/80 dark:bg-slate-900/80 p-2 flex flex-wrap items-center gap-1.5 text-xs">
          {/* Headings */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Format:</span>
            <button
              type="button"
              onClick={() => execCmd('formatBlock', 'p')}
              className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
            >
              Normal
            </button>
            <button
              type="button"
              onClick={() => execCmd('formatBlock', 'h1')}
              className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold"
            >
              H1
            </button>
            <button
              type="button"
              onClick={() => execCmd('formatBlock', 'h2')}
              className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
            >
              H2
            </button>
            <button
              type="button"
              onClick={() => execCmd('formatBlock', 'h3')}
              className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
            >
              H3
            </button>
          </div>

          <div className="h-4 w-[1px] bg-slate-300 dark:bg-slate-700 mx-1 shrink-0" />

          {/* Strikethrough, Sub, Super */}
          <button
            type="button"
            onClick={() => execCmd('strikeThrough')}
            className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            title={t.notes.editor.strikethrough}
          >
            <Strikethrough className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('subscript')}
            className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            title={t.notes.editor.subscript}
          >
            <Subscript className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('superscript')}
            className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            title={t.notes.editor.superscript}
          >
            <Superscript className="h-3.5 w-3.5" />
          </button>

          <div className="h-4 w-[1px] bg-slate-300 dark:bg-slate-700 mx-1 shrink-0" />

          {/* Text Color & Highlight */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowColorPicker(!showColorPicker);
                setShowHighlightPicker(false);
              }}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1"
              title={t.notes.editor.textColor}
            >
              <Palette className="h-3.5 w-3.5 text-blue-600" />
            </button>
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 z-30 p-2 rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 grid grid-cols-4 gap-1.5">
                {colorOptions.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      execCmd('foreColor', c);
                      setShowColorPicker(false);
                    }}
                    className="h-6 w-6 rounded-full border border-slate-300 dark:border-slate-700 cursor-pointer"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowHighlightPicker(!showHighlightPicker);
                setShowColorPicker(false);
              }}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1"
              title={t.notes.editor.highlight}
            >
              <Highlighter className="h-3.5 w-3.5 text-amber-500" />
            </button>
            {showHighlightPicker && (
              <div className="absolute top-full left-0 mt-1 z-30 p-2 rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 grid grid-cols-4 gap-1.5">
                {highlightOptions.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      execCmd('hiliteColor', c);
                      setShowHighlightPicker(false);
                    }}
                    className="h-6 w-6 rounded-full border border-slate-300 dark:border-slate-700 cursor-pointer"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="h-4 w-[1px] bg-slate-300 dark:bg-slate-700 mx-1 shrink-0" />

          {/* Alignment */}
          <button
            type="button"
            onClick={() => execCmd('justifyLeft')}
            className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            title={t.notes.editor.alignLeft}
          >
            <AlignLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('justifyCenter')}
            className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            title={t.notes.editor.alignCenter}
          >
            <AlignCenter className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('justifyRight')}
            className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            title={t.notes.editor.alignRight}
          >
            <AlignRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('justifyFull')}
            className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            title={t.notes.editor.alignJustify}
          >
            <AlignJustify className="h-3.5 w-3.5" />
          </button>

          <div className="h-4 w-[1px] bg-slate-300 dark:bg-slate-700 mx-1 shrink-0" />

          {/* Clear Formatting */}
          <button
            type="button"
            onClick={() => execCmd('removeFormat')}
            className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1"
            title={t.notes.editor.clearFormatting}
          >
            <RemoveFormatting className="h-3.5 w-3.5" />
            <span className="text-[11px] font-medium">Clear</span>
          </button>
        </div>
      )}

      {/* Editor Editable Body */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="p-4 sm:p-5 outline-hidden text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-relaxed overflow-y-auto prose dark:prose-invert max-w-none"
        style={{ minHeight }}
      />

      {/* Insert Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#131D31] p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Link className="h-4 w-4 text-blue-600" />
                {t.notes.editor.link}
              </h4>
              <button onClick={() => setShowLinkModal(false)} className="text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Display Text (Optional)</label>
                <input
                  type="text"
                  value={linkText}
                  onChange={e => setLinkText(e.target.value)}
                  placeholder="e.g. JW.ORG Article"
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">URL / Link Address</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  placeholder="https://jw.org/..."
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={handleInsertLink}
                className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
              >
                {t.common.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Insert Table Modal */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#131D31] p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Table className="h-4 w-4 text-emerald-600" />
                {t.notes.editor.insertTable}
              </h4>
              <button onClick={() => setShowTableModal(false)} className="text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Rows</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={tableRows}
                  onChange={e => setTableRows(parseInt(e.target.value, 10) || 1)}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-center"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Columns</label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={tableCols}
                  onChange={e => setTableCols(parseInt(e.target.value, 10) || 1)}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-center"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowTableModal(false)}
                className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={handleInsertTable}
                className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Find & Replace Modal */}
      {showFindModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#131D31] p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Search className="h-4 w-4 text-blue-600" />
                {t.notes.editor.find}
              </h4>
              <button onClick={() => setShowFindModal(false)} className="text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Search Text</label>
                <input
                  type="text"
                  value={findText}
                  onChange={e => {
                    setFindText(e.target.value);
                    handleFind();
                  }}
                  placeholder="Type word to find..."
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Replace With</label>
                <input
                  type="text"
                  value={replaceText}
                  onChange={e => setReplaceText(e.target.value)}
                  placeholder="Type replacement..."
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-xs font-semibold text-slate-500">
                {findMatches > 0 ? `${findMatches} match(es)` : '0 matches'}
              </span>
              <button
                type="button"
                onClick={handleReplace}
                disabled={!findText}
                className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-50"
              >
                {t.notes.editor.replace}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
