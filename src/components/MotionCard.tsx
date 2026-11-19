import type { ReactNode } from 'react';

interface MotionCardProps {
  children: ReactNode;
  className?: string;
  dark?: boolean;
  hoverLift?: number;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onFocus?: () => void;
}

export function MotionCard({
  children,
  className = '',
  dark = false,
  hoverLift = -6,
  onClick,
  onMouseEnter,
  onFocus,
}: MotionCardProps) {
  const hoverClass =
    hoverLift === 0 ? '' : dark ? 'ys-card ys-card-dark' : 'ys-card';

  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onFocus={onFocus}
      className={`${hoverClass} ${className}`}
    >
      {children}
    </div>
  );
}
