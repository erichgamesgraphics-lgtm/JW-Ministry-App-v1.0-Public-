import React from 'react';
import { Sun, Moon, Sparkles, ShieldCheck } from 'lucide-react';
import { useMinistry } from '../context/MinistryContext.tsx';
import { JWMinistryLogo } from './JWMinistryLogo.tsx';

interface HeaderProps {
  onOpenNewEntry: () => void;
}

export const Header: React.FC<HeaderProps> = () => {
  const { settings, updateTheme, t } = useMinistry();

  const handleToggleTheme = () => {
    if (settings.themeMode === 'LIGHT') {
      updateTheme('DARK');
    } else if (settings.themeMode === 'DARK') {
      updateTheme('SYSTEM');
    } else {
      updateTheme('LIGHT');
    }
  };

  const getStatusDisplayName = () => {
    switch (settings.publisherStatus) {
      case 'PUBLISHER':
        return t.goals.publisher;
      case 'AUXILIARY_PIONEER':
      case 'AUXILIARY_PIONEER_15':
      case 'AUXILIARY_PIONEER_30':
        return t.goals.auxiliaryPioneer;
      case 'PIONEER':
      case 'REGULAR_PIONEER_50':
        return t.goals.pioneer;
      case 'SPECIAL_PIONEER':
      case 'SPECIAL_PIONEER_100':
        return t.goals.specialPioneer;
      case 'CUSTOM':
        return t.goals.custom;
      default:
        return t.goals.publisher;
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#0B1120]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2.5 sm:px-6">
        {/* Left: App Logo & Name */}
        <div className="flex items-center gap-2.5">
          <JWMinistryLogo size={40} className="rounded-xl shadow-xs" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                {t.common.appName}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:text-blue-300">
                <ShieldCheck className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                {t.common.localAndPrivate}
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {getStatusDisplayName()}
              {settings.publisherStatus === 'CUSTOM' && ` (${settings.customGoalHours}${t.common.hoursShort})`}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Theme Switcher */}
          <button
            onClick={handleToggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title={`${t.header.toggleTheme}: ${settings.themeMode === 'DARK' ? t.header.themeDark : settings.themeMode === 'LIGHT' ? t.header.themeLight : t.header.themeSystem}`}
            aria-label={t.header.toggleTheme}
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
