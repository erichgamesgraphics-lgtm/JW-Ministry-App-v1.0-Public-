import React from 'react';
import { Sun, Moon, Sparkles, ShieldCheck, Settings } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useMinistry } from '../context/MinistryContext.tsx';
import { JWMinistryLogo } from './JWMinistryLogo.tsx';
import { interactiveSpring } from '../utils/liquidGlass.ts';

interface HeaderProps {
  onOpenNewEntry?: () => void;
  onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  const { settings, updateTheme, t } = useMinistry();
  const shouldReduceMotion = useReducedMotion();

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
    <header className="sticky top-0 z-30 border-b border-white/50 dark:border-white/10 bg-white/85 dark:bg-[#0B1120]/85 backdrop-blur-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.3)] transition-colors">
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
          {/* Theme Switcher with Fluid Motion */}
          <motion.button
            id="theme-toggle-btn"
            onClick={handleToggleTheme}
            whileHover={!shouldReduceMotion ? { scale: 1.05 } : undefined}
            whileTap={!shouldReduceMotion ? { scale: 0.92 } : undefined}
            transition={interactiveSpring}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/60 dark:border-white/10 bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 backdrop-blur-md hover:bg-white dark:hover:bg-slate-800 shadow-xs cursor-pointer overflow-hidden select-none"
            title={`${t.header.toggleTheme}: ${settings.themeMode === 'DARK' ? t.header.themeDark : settings.themeMode === 'LIGHT' ? t.header.themeLight : t.header.themeSystem}`}
            aria-label={t.header.toggleTheme}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={settings.themeMode}
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, rotate: -20, scale: 0.8 }}
                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, rotate: 0, scale: 1 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, rotate: 20, scale: 0.8 }}
                transition={{ duration: 0.18 }}
              >
                {settings.themeMode === 'DARK' ? (
                  <Moon className="h-4 w-4 text-blue-400" />
                ) : settings.themeMode === 'LIGHT' ? (
                  <Sun className="h-4 w-4 text-amber-500" />
                ) : (
                  <Sparkles className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                )}
              </motion.div>
            </AnimatePresence>
          </motion.button>

          {/* Settings Button (Top Right Header) */}
          {onOpenSettings && (
            <motion.button
              id="header-settings-btn"
              onClick={onOpenSettings}
              whileHover={!shouldReduceMotion ? { scale: 1.05 } : undefined}
              whileTap={!shouldReduceMotion ? { scale: 0.92 } : undefined}
              transition={interactiveSpring}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/60 dark:border-white/10 bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 backdrop-blur-md hover:bg-white dark:hover:bg-slate-800 shadow-xs cursor-pointer select-none"
              title={t.navigation.settings}
              aria-label={t.navigation.settings}
            >
              <Settings className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            </motion.button>
          )}
        </div>
      </div>
    </header>
  );
};
