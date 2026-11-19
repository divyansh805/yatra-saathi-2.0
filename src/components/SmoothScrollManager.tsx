import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function setSmoothScrollPaused(_paused: boolean) {
  // Native scrolling is managed directly via document.body.style.overflow in overlays.
}

export function SmoothScrollManager() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) return;
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname, location.hash]);

  return null;
}
