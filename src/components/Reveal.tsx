import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  DURATION_SLOW,
  EASE_PRIMARY,
  STAGGER_STEP,
  VIEWPORT_DEFAULT,
} from '../motion/tokens';

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  immediate?: boolean;
}

export function Reveal({
  children,
  className = '',
  delay = 0,
  y = 24,
  immediate = false,
}: RevealProps) {
  const prefersReducedMotion = Boolean(useReducedMotion());

  const initial = prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y };
  const target = prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 };

  if (immediate) {
    return (
      <motion.div
        initial={initial}
        animate={target}
        transition={{
          duration: prefersReducedMotion ? 0.2 : DURATION_SLOW,
          delay,
          ease: EASE_PRIMARY,
        }}
        className={className}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={initial}
      whileInView={target}
      viewport={VIEWPORT_DEFAULT}
      transition={{
        duration: prefersReducedMotion ? 0.2 : DURATION_SLOW,
        delay,
        ease: EASE_PRIMARY,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function RevealGroup({
  children,
  className = '',
  stagger = STAGGER_STEP,
  immediate = false,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  immediate?: boolean;
}) {
  const prefersReducedMotion = Boolean(useReducedMotion());

  const variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : stagger,
      },
    },
  };

  if (immediate) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={variants}
        className={className}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT_DEFAULT}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className = '',
  y = 24,
}: {
  children: ReactNode;
  className?: string;
  y?: number;
}) {
  const prefersReducedMotion = Boolean(useReducedMotion());

  return (
    <motion.div
      variants={{
        hidden: prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: prefersReducedMotion ? 0.2 : DURATION_SLOW,
            ease: EASE_PRIMARY,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function MaskedHeadlineWords({
  text,
  accentWord,
  className = '',
  baseDelay = 0.08,
}: {
  text: string;
  accentWord?: string;
  className?: string;
  baseDelay?: number;
}) {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const words = text.split(' ');

  return (
    <span className={className}>
      {words.map((word, idx) => {
        const cleanWord = word.replace(/[.,!?]/g, '');
        const isAccent =
          accentWord && cleanWord.toLowerCase() === accentWord.toLowerCase();
        return (
          <span key={`${word}-${idx}`} className="inline-block overflow-hidden align-bottom mr-[0.26em] last:mr-0">
            <motion.span
              className={`inline-block ${isAccent ? 'text-[#E9A34A] italic font-normal' : ''}`}
              initial={prefersReducedMotion ? { opacity: 0 } : { y: '108%', opacity: 0 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { y: '0%', opacity: 1 }}
              transition={{
                duration: prefersReducedMotion ? 0.2 : 0.65,
                delay: prefersReducedMotion ? 0 : baseDelay + idx * 0.055,
                ease: EASE_PRIMARY,
              }}
            >
              {word}
            </motion.span>
          </span>
        );
      })}
    </span>
  );
}
