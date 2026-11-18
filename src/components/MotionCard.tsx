import { useRef, type ReactNode } from 'react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'motion/react';
import { EASE_PRIMARY, TILT_SPRING } from '../motion/tokens';

interface MotionCardProps {
  children: ReactNode;
  className?: string;
  layoutId?: string;
  enableTilt?: boolean;
  maxTiltDeg?: number;
  hoverLift?: number;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onFocus?: () => void;
}

export function MotionCard({
  children,
  className = '',
  layoutId,
  enableTilt = false,
  maxTiltDeg = 7,
  hoverLift = -6,
  onClick,
  onMouseEnter,
  onFocus,
}: MotionCardProps) {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const cardRef = useRef<HTMLDivElement | null>(null);

  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);
  const rotateX = useSpring(rawRotateX, TILT_SPRING);
  const rotateY = useSpring(rawRotateY, TILT_SPRING);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableTilt || prefersReducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const tiltY = (px - 0.5) * 2 * maxTiltDeg;
    const tiltX = (0.5 - py) * 2 * maxTiltDeg;
    rawRotateX.set(tiltX);
    rawRotateY.set(tiltY);
  };

  const handleMouseLeave = () => {
    rawRotateX.set(0);
    rawRotateY.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      layoutId={prefersReducedMotion ? undefined : layoutId}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onFocus={onFocus}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={prefersReducedMotion ? undefined : { y: hoverLift }}
      transition={{ duration: 0.35, ease: EASE_PRIMARY }}
      style={
        enableTilt && !prefersReducedMotion
          ? {
              transformPerspective: 1000,
              rotateX,
              rotateY,
              transformStyle: 'preserve-3d',
            }
          : undefined
      }
      className={className}
    >
      {children}
    </motion.div>
  );
}
