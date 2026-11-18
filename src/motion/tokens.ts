export const DURATION_FAST = 0.2;
export const DURATION_BASE = 0.4;
export const DURATION_SLOW = 0.7;
export const DURATION_OVERLAY = 0.54;

export const STAGGER_STEP = 0.08;

export const EASE_PRIMARY: [number, number, number, number] = [0.22, 1, 0.36, 1];
export const EASE_CINEMA: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const SCROLL_SPRING = { stiffness: 72, damping: 24, mass: 0.45 } as const;
export const TILT_SPRING = { stiffness: 220, damping: 26, mass: 0.5 } as const;

export const VIEWPORT_DEFAULT = { once: true, amount: 0.12 } as const;

export const TRANSITION_FAST = {
  duration: DURATION_FAST,
  ease: EASE_PRIMARY,
} as const;

export const TRANSITION_BASE = {
  duration: DURATION_BASE,
  ease: EASE_PRIMARY,
} as const;

export const TRANSITION_SLOW = {
  duration: DURATION_SLOW,
  ease: EASE_PRIMARY,
} as const;

export const TRANSITION_OVERLAY = {
  duration: DURATION_OVERLAY,
  ease: EASE_PRIMARY,
} as const;
