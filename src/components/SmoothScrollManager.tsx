import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import { useReducedMotion } from 'motion/react';

export function setSmoothScrollPaused(paused: boolean) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('yatra:lenis-pause', { detail: paused }));
}

export function SmoothScrollManager() {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const lenisRef = useRef<Lenis | null>(null);
  const location = useLocation();

  useEffect(() => {
    if (prefersReducedMotion || typeof window === 'undefined') {
      return;
    }

    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.15,
    });
    lenisRef.current = lenis;

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = window.requestAnimationFrame(raf);
    };
    rafId = window.requestAnimationFrame(raf);

    const handlePauseEvent = (e: Event) => {
      const paused = Boolean((e as CustomEvent<boolean>).detail);
      if (paused) {
        lenis.stop();
      } else {
        lenis.start();
      }
    };

    window.addEventListener('yatra:lenis-pause', handlePauseEvent);

    return () => {
      window.removeEventListener('yatra:lenis-pause', handlePauseEvent);
      window.cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (location.hash) return;
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [location.pathname, location.hash]);

  return null;
}
