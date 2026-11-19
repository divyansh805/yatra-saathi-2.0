export const EASE_OUT_CSS = 'cubic-bezier(0.22, 1, 0.36, 1)';
export const EASE_PRIMARY: [number, number, number, number] = [0.22, 1, 0.36, 1];
export const EASE_CINEMA: [number, number, number, number] = [0.16, 1, 0.3, 1];

// Millisecond tokens aligned 1:1 with CSS custom properties in src/index.css
export const DUR_FAST_MS = 200;
export const DUR_ROUTE_MS = 300;
export const DUR_BASE_MS = 400;
export const DUR_SLOW_MS = 600;
export const DUR_SLIDE_MS = 650;
export const DUR_FLIP_MS = 700;

export const STAGGER_CARDS_MS = 70;
export const STAGGER_LIST_MS = 40;
export const HOVER_INTENT_DELAY_MS = 120;
export const MAX_STAGGER_ANIMATED_ITEMS = 12;
export const MAX_TOTAL_STAGGER_MS = 840;

// Second-based tokens for motion/react (routes, AnimatePresence overlays, navbar indicator)
export const DURATION_FAST = DUR_FAST_MS / 1000;
export const DURATION_ROUTE = DUR_ROUTE_MS / 1000;
export const DURATION_BASE = DUR_BASE_MS / 1000;
export const DURATION_SLOW = DUR_SLOW_MS / 1000;
export const DURATION_OVERLAY = 0.42;

export const STAGGER_STEP = STAGGER_CARDS_MS / 1000;
export const STAGGER_LIST_STEP = STAGGER_LIST_MS / 1000;

export const VIEWPORT_DEFAULT = { once: true, amount: 0.05 } as const;

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

export function computeStaggerDelayMs(
  index: number,
  stepMs: number = STAGGER_CARDS_MS,
  maxItems: number = MAX_STAGGER_ANIMATED_ITEMS
): number | null {
  if (index < 0) return 0;
  if (index >= maxItems) return null; // Items beyond maxItems appear immediately
  return Math.min(index * stepMs, MAX_TOTAL_STAGGER_MS);
}
