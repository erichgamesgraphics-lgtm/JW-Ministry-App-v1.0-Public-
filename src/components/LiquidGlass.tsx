import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  interactiveSpring,
  liquidModalBackdropVariants,
  liquidModalCardVariants,
  glassTapScale,
  glassBezier,
} from '../utils/liquidGlass.ts';

interface LiquidGlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
  children,
  className = '',
  interactive = false,
  onClick,
  ...rest
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      onClick={onClick}
      whileHover={interactive && !shouldReduceMotion ? { y: -2, scale: 1.006 } : undefined}
      whileTap={interactive && !shouldReduceMotion ? { scale: glassTapScale.card } : undefined}
      transition={interactiveSpring}
      className={`relative overflow-hidden rounded-2xl border border-white/60 dark:border-white/10 bg-white/80 dark:bg-[#131D31]/80 backdrop-blur-md shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05),inset_0_1px_0_0_rgba(255,255,255,0.7)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.35),inset_0_1px_0_0_rgba(255,255,255,0.07)] transition-colors ${
        interactive ? 'cursor-pointer select-none' : ''
      } ${className}`}
      {...(rest as any)}
    >
      {children}
    </motion.div>
  );
};

interface LiquidGlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'glass' | 'danger';
  scaleFactor?: number;
}

export const LiquidGlassButton: React.FC<LiquidGlassButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  scaleFactor = glassTapScale.button,
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();

  const variantStyles = {
    primary:
      'bg-blue-600 hover:bg-blue-700 text-white shadow-xs shadow-blue-500/25 border border-blue-400/30',
    secondary:
      'border border-slate-200 dark:border-slate-700/80 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 backdrop-blur-sm',
    glass:
      'border border-white/60 dark:border-white/10 bg-white/70 dark:bg-[#131D31]/70 hover:bg-white/90 dark:hover:bg-[#131D31]/90 text-slate-800 dark:text-slate-100 backdrop-blur-md shadow-xs',
    danger:
      'bg-red-600 hover:bg-red-700 text-white shadow-xs shadow-red-500/25 border border-red-400/30',
  };

  return (
    <motion.button
      whileHover={!shouldReduceMotion ? { scale: 1.01 } : undefined}
      whileTap={!shouldReduceMotion ? { scale: scaleFactor } : undefined}
      transition={interactiveSpring}
      className={`relative inline-flex items-center justify-center rounded-xl font-semibold transition-colors cursor-pointer select-none ${variantStyles[variant]} ${className}`}
      {...(props as any)}
    >
      {children}
    </motion.button>
  );
};

interface LiquidGlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}

export const LiquidGlassModal: React.FC<LiquidGlassModalProps> = ({
  isOpen,
  onClose,
  children,
  maxWidth = 'max-w-lg',
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          {/* Liquid Glass Backdrop with subtle blur */}
          <motion.div
            key="modal-backdrop"
            variants={liquidModalBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-xs"
          />

          {/* Modal Panel with Glass Physics */}
          <motion.div
            key="modal-card"
            variants={shouldReduceMotion ? undefined : liquidModalCardVariants}
            initial={shouldReduceMotion ? { opacity: 0 } : 'hidden'}
            animate={shouldReduceMotion ? { opacity: 1 } : 'visible'}
            exit={shouldReduceMotion ? { opacity: 0 } : 'exit'}
            className={`relative w-full ${maxWidth} max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-50/95 dark:bg-[#0B1120]/95 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_16px_48px_-8px_rgba(0,0,0,0.25),inset_0_1px_0_0_rgba(255,255,255,0.6)] dark:shadow-[0_20px_50px_-8px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.08)] p-5 z-10`}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

/**
 * Animated Number Display - Smoothly updates numerical values
 */
export const AnimatedValue: React.FC<{
  value: string | number;
  className?: string;
}> = ({ value, className = '' }) => {
  return (
    <motion.span
      key={String(value)}
      initial={{ opacity: 0.6, y: -2 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: glassBezier }}
      className={`inline-block ${className}`}
    >
      {value}
    </motion.span>
  );
};
