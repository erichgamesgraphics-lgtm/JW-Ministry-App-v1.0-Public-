import React from 'react';
import { Home, Clock, Sparkles, Calendar, BarChart2 } from 'lucide-react';
import { useMinistry } from '../context/MinistryContext.tsx';

export type TabType = 'home' | 'activity' | 'ministryAi' | 'calendar' | 'reports' | 'settings';

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
    { id: 'home' as TabType, label: t.navigation.home, icon: Home },
    {
      id: 'activity' as TabType,
      label: t.navigation.activity,
      icon: Clock,
      badge: timer.isRunning ? t.navigation.activeTimer : undefined,
    },
    { id: 'ministryAi' as TabType, label: t.navigation.ministryAi || 'Ministry AI', icon: Sparkles, isCenter: true },
    { id: 'calendar' as TabType, label: t.navigation.calendar, icon: Calendar },
    { id: 'reports' as TabType, label: t.navigation.reports, icon: BarChart2 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-[#0B1120]/95 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4)] pb-[env(safe-area-inset-bottom,0px)]">
      <div className="mx-auto flex max-w-lg items-center justify-between px-2.5 py-1.5 sm:py-2 relative">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isCenter = item.isCenter;

          return (
            <button
              id={`nav-tab-${item.id}`}
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`relative flex flex-1 flex-col items-center justify-center py-1 px-1 rounded-2xl active:opacity-75 transition-all cursor-pointer select-none ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <div className="relative flex items-center justify-center">
                {/* Active or Center pill styling */}
                <div
                  className={`relative flex items-center justify-center rounded-2xl transition-all ${
                    isCenter
                      ? isActive
                        ? 'h-10 w-10 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/35 ring-2 ring-blue-400/40 border border-white/30'
                        : 'h-10 w-10 bg-blue-50/90 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/80 shadow-xs hover:border-blue-300'
                      : isActive
                      ? 'h-9 w-9 bg-blue-600 text-white shadow-xs shadow-blue-500/30'
                      : 'h-9 w-9 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Icon
                    className={`${
                      isCenter ? 'h-5 w-5 stroke-[2.2]' : 'h-5 w-5'
                    } ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`}
                  />
                </div>
                {item.badge && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                )}
              </div>
              <span
                className={`relative z-10 mt-0.5 text-[10px] sm:text-[11px] leading-tight tracking-tight whitespace-nowrap transition-colors ${
                  isActive
                    ? 'font-bold text-blue-600 dark:text-blue-400'
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

