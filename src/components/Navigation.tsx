import React from 'react';
import { Home, Clock, Calendar, BarChart2, Sparkles } from 'lucide-react';
import { useMinistry } from '../context/MinistryContext.tsx';

export type TabType = 'home' | 'activity' | 'ministry-ai' | 'calendar' | 'reports' | 'settings';

interface NavigationProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onOpenNewEntry?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const { timer, t } = useMinistry();

  const navItems = [
    { id: 'home' as TabType, label: t.navigation.home, icon: Home, isCenter: false },
    {
      id: 'activity' as TabType,
      label: t.navigation.activity,
      icon: Clock,
      badge: timer.isRunning ? t.navigation.activeTimer : undefined,
      isCenter: false,
    },
    {
      id: 'ministry-ai' as TabType,
      label: t.navigation.ministryAi,
      icon: Sparkles,
      isCenter: true,
    },
    { id: 'calendar' as TabType, label: t.navigation.calendar, icon: Calendar, isCenter: false },
    { id: 'reports' as TabType, label: t.navigation.reports, icon: BarChart2, isCenter: false },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-[#0B1120]/95 backdrop-blur-md safe-bottom">
      <div className="mx-auto flex max-w-lg items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isCenter = item.isCenter;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`relative flex flex-1 flex-col items-center justify-center py-1 px-0.5 rounded-2xl transition-all cursor-pointer ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <div className="relative flex items-center justify-center">
                {isCenter ? (
                  // Center emphasized Ministry AI button
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-all ${
                      isActive
                        ? 'bg-linear-to-tr from-blue-600 via-indigo-600 to-sky-500 text-white shadow-md shadow-blue-500/30 scale-105'
                        : 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/70 dark:border-blue-800/70 shadow-xs hover:scale-105'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
                  </div>
                ) : (
                  // Standard nav item pill
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-2xl transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/30'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                  </div>
                )}

                {item.badge && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                )}
              </div>
              <span
                className={`mt-0.5 text-[10px] sm:text-[11px] leading-tight tracking-tight whitespace-nowrap ${
                  isActive
                    ? 'font-bold text-blue-600 dark:text-blue-400'
                    : isCenter
                    ? 'font-semibold text-blue-700/80 dark:text-blue-300/80'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

