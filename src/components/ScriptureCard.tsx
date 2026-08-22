import React, { useState } from 'react';
import { BookOpen, Copy, Check, Share2 } from 'lucide-react';
import { DailyScripture } from '../types.ts';
import { useMinistry } from '../context/MinistryContext.tsx';

interface ScriptureCardProps {
  scripture: DailyScripture;
  className?: string;
}

export const ScriptureCard: React.FC<ScriptureCardProps> = ({ scripture, className = '' }) => {
  const { t } = useMinistry();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textToCopy = `"${scripture.text}" — ${scripture.reference}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const shareText = `"${scripture.text}" — ${scripture.reference} (${t.common.appName} ${t.scriptureCard.dailyScripture})`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: t.scriptureCard.dailyScripture,
          text: shareText,
        });
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-blue-200/60 dark:border-blue-900/40 bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 dark:from-[#131D31] dark:via-[#16223d] dark:to-[#1a294a] p-5 sm:p-6 shadow-xs ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {t.scriptureCard.dailyScripture}
            </h3>
            {scripture.theme && (
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                {scripture.theme}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={t.scriptureCard.copyScripture}
            aria-label={t.scriptureCard.copyScripture}
          >
            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
          </button>
          <button
            onClick={handleShare}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={t.scriptureCard.shareScripture}
            aria-label={t.scriptureCard.shareScripture}
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm sm:text-base font-normal leading-relaxed text-slate-700 dark:text-slate-300 italic">
          “{scripture.text}”
        </p>
        <div className="mt-3 text-right">
          <span className="inline-block text-xs font-bold tracking-wide text-blue-700 dark:text-blue-400 bg-blue-100/60 dark:bg-blue-900/50 px-2.5 py-1 rounded-md">
            — {scripture.reference}
          </span>
        </div>
      </div>
    </div>
  );
};
