/**
 * Liquid Glass Motion & Visual System
 * Reusable animation tokens, spring physics, and variants for fluid, physically-inspired UI.
 */

export const liquidSpring = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 28,
  mass: 0.8,
};

export const gentleSpring = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 26,
  mass: 1,
};

export const quickSpring = {
  type: 'spring' as const,
  stiffness: 500,
  damping: 32,
  mass: 0.6,
};

export const interactiveSpring = {
  type: 'spring' as const,
  stiffness: 440,
  damping: 25,
  mass: 0.7,
};

export const glassBezier = [0.22, 1, 0.36, 1] as const;
export const softBezier = [0.16, 1, 0.3, 1] as const;

export const glassTimings = {
  micro: 0.15,
  button: 0.18,
  component: 0.24,
  screen: 0.28,
  modal: 0.32,
};

export const glassTapScale = {
  button: 0.97,
  iconButton: 0.92,
  card: 0.988,
  pill: 0.95,
  navCenter: 0.92,
};

/**
 * Screen Page Transition Variants (Liquid Glass depth + subtle glide)
 */
export const liquidPageVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 16 : -16,
    opacity: 0,
    scale: 0.992,
    filter: 'blur(3px)',
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -16 : 16,
    opacity: 0,
    scale: 0.992,
    filter: 'blur(3px)',
  }),
};

/**
 * Reduced Motion Page Variants
 */
export const reducedPageVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

/**
 * Modal & Sheet Variants (Glass surface emerges with depth)
 */
export const liquidModalBackdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.22, ease: glassBezier } },
  exit: { opacity: 0, transition: { duration: 0.18, ease: glassBezier } },
};

export const liquidModalCardVariants = {
  hidden: { opacity: 0, scale: 0.94, y: 16 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 380,
      damping: 28,
      mass: 0.85,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 12,
    transition: { duration: 0.16, ease: glassBezier },
  },
};
