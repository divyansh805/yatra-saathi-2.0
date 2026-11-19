import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  computeStaggerDelayMs,
  DUR_BASE_MS,
  DUR_SLIDE_MS,
  MAX_STAGGER_ANIMATED_ITEMS,
  STAGGER_CARDS_MS,
} from '../motion/tokens';
import { useOnceInView, usePrefersReducedMotion } from '../motion/useMotion';

interface RevealContextValue {
  hasEntered: boolean;
  reducedMotion: boolean;
  staggerMs: number;
  maxAnimatedItems: number;
  direction: 'y' | 'x';
  durationMs: number;
}

const RevealContext = createContext<RevealContextValue | null>(null);

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Delay in seconds (kept compatible with existing callers) or use delayMs */
  delay?: number;
  delayMs?: number;
  direction?: 'y' | 'x';
  durationMs?: number;
  immediate?: boolean;
  retriggerKey?: string | number;
}

export function Reveal({
  children,
  className = '',
  delay = 0,
  delayMs,
  direction = 'y',
  durationMs,
  immediate = false,
  retriggerKey,
}: RevealProps) {
  const { ref, hasEntered, reducedMotion } = useOnceInView<HTMLDivElement>({
    immediate,
    retriggerKey,
  });
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    setSettled(false);
  }, [retriggerKey]);

  const effectiveDelayMs = delayMs ?? Math.round(delay * 1000);
  const effectiveDurMs =
    durationMs ?? (direction === 'x' ? DUR_SLIDE_MS : DUR_BASE_MS);

  return (
    <div
      ref={ref}
      data-visible={hasEntered ? 'true' : 'false'}
      onTransitionEnd={() => setSettled(true)}
      style={{
        transitionDelay: hasEntered && !reducedMotion ? `${effectiveDelayMs}ms` : '0ms',
        transitionDuration: reducedMotion ? '150ms' : `${effectiveDurMs}ms`,
        willChange: !settled && !reducedMotion ? 'transform, opacity' : 'auto',
      }}
      className={`${direction === 'x' ? 'ys-reveal-x' : 'ys-reveal-y'} ${className}`}
    >
      {children}
    </div>
  );
}

export function RevealGroup({
  children,
  className = '',
  stagger,
  staggerMs,
  maxAnimatedItems = MAX_STAGGER_ANIMATED_ITEMS,
  direction = 'y',
  durationMs,
  immediate = false,
  retriggerKey,
}: {
  children: ReactNode;
  className?: string;
  /** Stagger step in seconds (legacy compat) */
  stagger?: number;
  /** Stagger step in milliseconds */
  staggerMs?: number;
  maxAnimatedItems?: number;
  direction?: 'y' | 'x';
  durationMs?: number;
  immediate?: boolean;
  retriggerKey?: string | number;
}) {
  const { ref, hasEntered, reducedMotion } = useOnceInView<HTMLDivElement>({
    immediate,
    retriggerKey,
  });

  const resolvedStaggerMs =
    staggerMs ?? (typeof stagger === 'number' ? Math.round(stagger * 1000) : STAGGER_CARDS_MS);
  const resolvedDurationMs =
    durationMs ?? (direction === 'x' ? DUR_SLIDE_MS : DUR_BASE_MS);

  return (
    <RevealContext.Provider
      value={{
        hasEntered,
        reducedMotion,
        staggerMs: resolvedStaggerMs,
        maxAnimatedItems,
        direction,
        durationMs: resolvedDurationMs,
      }}
    >
      <div ref={ref} className={className}>
        {children}
      </div>
    </RevealContext.Provider>
  );
}

export function RevealItem({
  children,
  className = '',
  index = 0,
  direction,
}: {
  children: ReactNode;
  className?: string;
  index?: number;
  direction?: 'y' | 'x';
}) {
  const ctx = useContext(RevealContext);
  const [settled, setSettled] = useState(false);

  const hasEntered = ctx ? ctx.hasEntered : true;
  const reducedMotion = ctx ? ctx.reducedMotion : false;
  const staggerMs = ctx ? ctx.staggerMs : STAGGER_CARDS_MS;
  const maxAnimatedItems = ctx ? ctx.maxAnimatedItems : MAX_STAGGER_ANIMATED_ITEMS;
  const resolvedDirection = direction ?? ctx?.direction ?? 'y';
  const durationMs = ctx?.durationMs ?? (resolvedDirection === 'x' ? DUR_SLIDE_MS : DUR_BASE_MS);

  const computedDelay = computeStaggerDelayMs(index, staggerMs, maxAnimatedItems);

  // Items beyond maxAnimatedItems appear immediately without stagger delay
  if (computedDelay === null) {
    return <div className={`ys-reveal-instant ${className}`}>{children}</div>;
  }

  return (
    <div
      data-visible={hasEntered ? 'true' : 'false'}
      onTransitionEnd={() => setSettled(true)}
      style={{
        transitionDelay: hasEntered && !reducedMotion ? `${computedDelay}ms` : '0ms',
        transitionDuration: reducedMotion ? '150ms' : `${durationMs}ms`,
        willChange: !settled && !reducedMotion ? 'transform, opacity' : 'auto',
      }}
      className={`${resolvedDirection === 'x' ? 'ys-reveal-x' : 'ys-reveal-y'} ${className}`}
    >
      {children}
    </div>
  );
}

export function MaskedHeadlineWords({
  text,
  accentWord,
  className = '',
  baseDelayMs = 70,
  wordStepMs = 55,
  immediate = true,
}: {
  text: string;
  accentWord?: string;
  className?: string;
  baseDelayMs?: number;
  wordStepMs?: number;
  immediate?: boolean;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const { ref, hasEntered } = useOnceInView<HTMLSpanElement>({ immediate });
  const words = text.trim().split(/\s+/);

  // Use clean block reveal if >= 8 words or reduced motion
  if (words.length >= 8 || reducedMotion) {
    return (
      <span
        ref={ref}
        data-visible={hasEntered ? 'true' : 'false'}
        className={`ys-reveal-y inline ${className}`}
      >
        {words.map((word, idx) => {
          const cleanWord = word.replace(/[.,!?—–]/g, '');
          const isAccent =
            accentWord && cleanWord.toLowerCase() === accentWord.toLowerCase();
          return (
            <span key={`${word}-${idx}`}>
              <span className={isAccent ? 'text-[#E9A34A] italic font-normal' : undefined}>
                {word}
              </span>
              {idx < words.length - 1 ? ' ' : ''}
            </span>
          );
        })}
      </span>
    );
  }

  return (
    <span ref={ref} className={`inline ${className}`}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, idx) => {
          const cleanWord = word.replace(/[.,!?—–]/g, '');
          const isAccent =
            accentWord && cleanWord.toLowerCase() === accentWord.toLowerCase();
          const delayMs = baseDelayMs + idx * wordStepMs;
          return (
            <span key={`${word}-${idx}`}>
              <span
                className="ys-word-mask"
                data-visible={hasEntered ? 'true' : 'false'}
              >
                <span
                  className={`ys-word-inner ${
                    isAccent ? 'text-[#E9A34A] italic font-normal' : ''
                  }`}
                  style={{
                    transitionDelay: hasEntered ? `${delayMs}ms` : '0ms',
                  }}
                >
                  {word}
                </span>
              </span>
              {idx < words.length - 1 ? ' ' : ''}
            </span>
          );
        })}
      </span>
    </span>
  );
}
