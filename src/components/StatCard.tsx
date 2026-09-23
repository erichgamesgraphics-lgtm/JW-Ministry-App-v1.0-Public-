import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { interactiveSpring } from '../utils/liquidGlass.ts';

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
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      whileHover={!shouldReduceMotion ? { y: -2, scale: 1.01 } : undefined}
      whileTap={!shouldReduceMotion ? { scale: 0.988 } : undefined}
      transition={interactiveSpring}
      className={`relative overflow-hidden rounded-2xl border border-white/60 dark:border-white/10 bg-white/80 dark:bg-[#131D31]/80 backdrop-blur-md p-3 sm:p-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05),inset_0_1px_0_0_rgba(255,255,255,0.7)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.35),inset_0_1px_0_0_rgba(255,255,255,0.06)] transition-all cursor-default select-none ${className}`}
    >
      <div className="flex items-center justify-between gap-1.5">
        <span className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">
          {title}
        </span>
        <div className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-xl shrink-0 shadow-inner ${bgAccentColor}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>

      <div className="mt-1.5 sm:mt-2">
        <motion.div
          key={String(value)}
          initial={shouldReduceMotion ? undefined : { opacity: 0.7, y: -1 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight"
        >
          {value}
        </motion.div>
        <p className="mt-0.5 text-[10px] sm:text-xs font-normal text-slate-400 dark:text-slate-500 truncate">
          {subtitle}
        </p>
      </div>
    </motion.div>
  );
};

