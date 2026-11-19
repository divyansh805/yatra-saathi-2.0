import { useEffect, useRef, useState, type ReactNode } from 'react';
import { RotateCw } from 'lucide-react';
import { HOVER_INTENT_DELAY_MS } from '../motion/tokens';

interface FlipCardProps {
  /** Controlled flip state owned by the parent group (only one card flipped per group). */
  isFlipped: boolean;
  onFlipChange: (next: boolean) => void;
  /** Front face content (real photo + gradient + category + title). */
  front: ReactNode;
  /** Back face content (dark teal glass panel + facts + ONE View details button). */
  back: ReactNode;
  /** Accessible title of the card for flip toggle button labels. */
  cardLabel: string;
  /** Disable hover-to-flip temporarily (e.g. while initial entrance slide plays). */
  hoverFlipEnabled?: boolean;
  /** Click action when clicking the photo/front face (opens detail view or selects). */
  onFrontClick?: (el: HTMLElement) => void;
  /** Optional class on the outer .flip-card wrapper (e.g. aspect-[4/5] or h-[320px]). */
  className?: string;
  /** Radius class kept synced on front & back faces. */
  roundedClass?: string;
  /** Position of the 44px touch/keyboard flip toggle button. */
  togglePlacement?: 'top-right' | 'bottom-right';
}

export function FlipCard({
  isFlipped,
  onFlipChange,
  front,
  back,
  cardLabel,
  hoverFlipEnabled = true,
  onFrontClick,
  className = '',
  roundedClass = 'rounded-2xl',
  togglePlacement = 'top-right',
}: FlipCardProps) {
  const hoverTimerRef = useRef<number | null>(null);
  const frontFaceRef = useRef<HTMLDivElement | null>(null);
  const backFaceRef = useRef<HTMLDivElement | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Clear pending timer on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current !== null) {
        window.clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  // Synchronize inert attribute so occluded face can never trap keyboard focus
  useEffect(() => {
    const frontEl = frontFaceRef.current;
    const backEl = backFaceRef.current;
    if (frontEl) {
      frontEl.inert = isFlipped;
    }
    if (backEl) {
      backEl.inert = !isFlipped;
    }
  }, [isFlipped]);

  const canHoverPointer = () =>
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const handleMouseEnter = () => {
    if (!hoverFlipEnabled || !canHoverPointer()) return;
    if (hoverTimerRef.current !== null) {
      window.clearTimeout(hoverTimerRef.current);
    }
    setIsAnimating(true);
    hoverTimerRef.current = window.setTimeout(() => {
      onFlipChange(true);
    }, HOVER_INTENT_DELAY_MS);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current !== null) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    if (!canHoverPointer()) return;
    if (isFlipped) {
      setIsAnimating(true);
      onFlipChange(false);
    } else {
      setIsAnimating(false);
    }
  };

  const handleToggleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (hoverTimerRef.current !== null) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setIsAnimating(true);
    onFlipChange(!isFlipped);
  };

  const togglePositionClass =
    togglePlacement === 'bottom-right' ? 'bottom-2.5 right-2.5' : 'top-2.5 right-2.5';

  return (
    <div
      className={`flip-card group ${className}`}
      data-flipped={isFlipped ? 'true' : 'false'}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={`flip-inner ${roundedClass}`}
        style={{ willChange: isAnimating ? 'transform' : 'auto' }}
        onTransitionEnd={(e) => {
          if (e.target === e.currentTarget && e.propertyName === 'transform') {
            setIsAnimating(false);
          }
        }}
      >
        {/* FRONT FACE */}
        <div
          ref={frontFaceRef}
          aria-hidden={isFlipped}
          className={`face-front ${roundedClass} overflow-hidden`}
        >
          <div
            role={onFrontClick ? 'button' : undefined}
            tabIndex={onFrontClick ? 0 : undefined}
            aria-label={onFrontClick ? `Open details for ${cardLabel}` : undefined}
            onClick={(e) => onFrontClick?.(e.currentTarget)}
            onKeyDown={(e) => {
              if (onFrontClick && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onFrontClick(e.currentTarget);
              }
            }}
            className={`w-full h-full relative ${onFrontClick ? 'cursor-pointer' : ''}`}
          >
            {front}
          </div>

          <button
            type="button"
            onClick={handleToggleClick}
            aria-pressed={isFlipped}
            aria-label={`Flip card for ${cardLabel}`}
            title="Flip card"
            className={`absolute ${togglePositionClass} z-10 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-[#0D2B29]/80 hover:bg-[#E9A34A] text-white hover:text-[#142322] border border-white/25 backdrop-blur-xs flex items-center justify-center transition-colors duration-200 cursor-pointer shadow-md`}
          >
            <RotateCw className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* BACK FACE */}
        <div
          ref={backFaceRef}
          aria-hidden={!isFlipped}
          className={`face-back ${roundedClass} overflow-hidden bg-[#0C2725]/96 backdrop-blur-md border border-[#8CC9E8]/28 text-[#F8F6F0] shadow-[0_22px_50px_rgba(0,0,0,0.45)] flex flex-col`}
        >
          <button
            type="button"
            onClick={handleToggleClick}
            aria-pressed={isFlipped}
            aria-label={`Flip back to photo for ${cardLabel}`}
            title="Flip back"
            className="absolute top-2.5 right-2.5 z-10 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-white/12 hover:bg-[#E9A34A] text-white hover:text-[#142322] border border-white/25 flex items-center justify-center transition-colors duration-200 cursor-pointer"
          >
            <RotateCw className="w-4 h-4 -scale-x-100" aria-hidden="true" />
          </button>

          <div
            data-lenis-prevent
            className="flex-1 overflow-y-auto overlay-panel-scroll p-4 sm:p-5 flex flex-col justify-between gap-3"
          >
            {back}
          </div>
        </div>
      </div>
    </div>
  );
}
