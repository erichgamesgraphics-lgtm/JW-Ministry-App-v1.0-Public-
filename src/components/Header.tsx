import React from 'react';
import { Sun, Moon, Sparkles, ShieldCheck } from 'lucide-react';
import { useMinistry } from '../context/MinistryContext.tsx';
import { PUBLISHER_STATUS_OPTIONS } from '../types.ts';
import { JWMinistryLogo } from './JWMinistryLogo.tsx';

interface HeaderProps {
  onOpenNewEntry: () => void;
}

export const Header: React.FC<HeaderProps> = () => {
  const { settings, updateTheme } = useMinistry();

  const handleToggleTheme = () => {
    if (settings.themeMode === 'LIGHT') {
      updateTheme('DARK');
    } else if (settings.themeMode === 'DARK') {
      updateTheme('SYSTEM');
    } else {
      updateTheme('LIGHT');
    }
  };

  const statusInfo = PUBLISHER_STATUS_OPTIONS[settings.publisherStatus] || { displayName: 'Publisher' };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#0B1120]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2.5 sm:px-6">
        {/* Left: App Logo & Name */}
        <div className="flex items-center gap-2.5">
          <JWMinistryLogo size={40} className="rounded-xl shadow-xs" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Ministry Tracker
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:text-blue-300">
                <ShieldCheck className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                Local & Private
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {statusInfo.displayName}
              {settings.publisherStatus === 'CUSTOM' && ` (${settings.customGoalHours}h)`}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Theme Switcher */}
          <button
            onClick={handleToggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title={`Current theme: ${settings.themeMode}. Click to switch.`}
            aria-label="Toggle theme"
          >
            {settings.themeMode === 'DARK' ? (
              <Moon className="h-4 w-4 text-blue-400" />
            ) : settings.themeMode === 'LIGHT' ? (
              <Sun className="h-4 w-4 text-amber-500" />
            ) : (
              <Sparkles className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
