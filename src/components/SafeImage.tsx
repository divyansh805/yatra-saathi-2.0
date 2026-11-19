import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '../motion/useMotion';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectClassName?: string;
  priority?: boolean;
  darkSkeleton?: boolean;
  width?: number;
  height?: number;
}

export function SafeImage({
  src,
  alt,
  className = 'w-full h-full object-cover',
  aspectClassName = '',
  priority = false,
  darkSkeleton = false,
  width,
  height,
}: SafeImageProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) {
      setLoaded(true);
    } else {
      setLoaded(false);
    }
  }, [src]);

  if (failed || !src) {
    return (
      <div
        className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-[#0F2B29] via-[#173F3C] to-[#1D4E49] ${aspectClassName}`}
        role="img"
        aria-label={alt}
      >
        <div
          className={`absolute inset-0 opacity-60 ${
            darkSkeleton ? 'skeleton-shimmer-dark' : 'skeleton-shimmer'
          }`}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_70%_25%,rgba(233,163,74,0.22),transparent_60%)]"
          aria-hidden="true"
        />
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full overflow-hidden ${aspectClassName}`}>
      {!loaded && (
        <div
          className={`absolute inset-0 ${
            darkSkeleton ? 'skeleton-shimmer-dark' : 'skeleton-shimmer'
          }`}
          aria-hidden="true"
        />
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        width={width}
        height={height}
        referrerPolicy="no-referrer"
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`${className} ${
          prefersReducedMotion
            ? loaded
              ? 'opacity-100 transition-opacity duration-150'
              : 'opacity-0 transition-opacity duration-150'
            : `transition-[opacity,transform] duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                loaded ? 'opacity-100' : 'opacity-0'
              }`
        }`}
      />
    </div>
  );
}
