import React from 'react';
import { Calendar, Trash2, RefreshCw, AlertCircle, Check, X } from 'lucide-react';

export interface GoogleCalendarConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  affectedItems?: string[];
  actionLabel?: string;
  cancelLabel?: string;
  actionType?: 'create' | 'update' | 'delete' | 'sync';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const GoogleCalendarConfirmModal: React.FC<GoogleCalendarConfirmModalProps> = ({
  isOpen,
  title,
  description,
  affectedItems,
  actionLabel = 'Confirm',
  cancelLabel = 'Cancel',
  actionType = 'sync',
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const isDestructive = actionType === 'delete';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131D31] p-6 shadow-2xl space-y-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-start gap-3.5">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
              isDestructive
                ? 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400'
                : 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
            }`}
          >
            {isDestructive ? (
              <Trash2 className="h-5 w-5" />
            ) : actionType === 'sync' ? (
              <RefreshCw className="h-5 w-5" />
            ) : (
              <Calendar className="h-5 w-5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="modal-title" className="text-base font-bold text-slate-900 dark:text-white leading-snug">
              {title}
            </h3>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {affectedItems && affectedItems.length > 0 && (
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-3 max-h-36 overflow-y-auto space-y-1.5">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Affected items ({affectedItems.length}):
            </p>
            <ul className="text-xs text-slate-700 dark:text-slate-200 space-y-1">
              {affectedItems.map((item, idx) => (
                <li key={idx} className="flex items-center gap-1.5 truncate">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                  <span className="truncate">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center gap-2.5 pt-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-700 bg-transparent py-2.5 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-2xl py-2.5 px-4 text-xs font-semibold text-white shadow-sm transition-all cursor-pointer disabled:opacity-50 ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500'
                : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500'
            }`}
          >
            {isLoading ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : isDestructive ? (
              <Trash2 className="h-3.5 w-3.5" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            <span>{isLoading ? 'Processing…' : actionLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
