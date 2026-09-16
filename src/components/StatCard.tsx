import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  bgAccentColor?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  bgAccentColor = 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
  className = '',
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#131D31] p-3 sm:p-4 shadow-xs transition-all hover:shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between gap-1.5">
        <span className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">
          {title}
        </span>
        <div className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg shrink-0 ${bgAccentColor}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>

      <div className="mt-1.5 sm:mt-2">
        <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
          {value}
        </div>
        <p className="mt-0.5 text-[10px] sm:text-xs font-normal text-slate-400 dark:text-slate-500 truncate">
          {subtitle}
        </p>
      </div>
    </div>
  );
};
