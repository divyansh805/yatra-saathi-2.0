import { useEffect, useRef, useState } from 'react';

/**
 * Reactive prefers-reduced-motion hook backed by matchMedia.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  return reduced;
}

/**
 * Shared once-only IntersectionObserver hook.
 * Unobserves immediately after firing so scroll reveals never re-trigger.
 */
export function useOnceInView<T extends HTMLElement = HTMLDivElement>({
  immediate = false,
  retriggerKey,
  rootMargin = '0px 0px -40px 0px',
  threshold = 0.04,
}: {
  immediate?: boolean;
  retriggerKey?: string | number;
  rootMargin?: string;
  threshold?: number;
} = {}) {
  const ref = useRef<T | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [hasEntered, setHasEntered] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return false;
  });

  useEffect(() => {
    if (reducedMotion || immediate) {
      // Allow a single animation frame on mount/retriggerKey so initial state paints cleanly before animating
      if (reducedMotion) {
        setHasEntered(true);
        return;
      }
      setHasEntered(false);
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setHasEntered(true));
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    }

    const node = ref.current;
    if (!node) {
      setHasEntered(true);
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      setHasEntered(true);
      return;
    }

    // If element is already inside or above the viewport on mount/retrigger, show promptly
    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.96 && rect.bottom > -20) {
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setHasEntered(true));
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    }

    setHasEntered(false);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting || entry.boundingClientRect.top < window.innerHeight) {
            setHasEntered(true);
            observer.unobserve(entry.target);
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, [immediate, retriggerKey, reducedMotion, rootMargin, threshold]);

  return { ref, hasEntered, reducedMotion };
}
