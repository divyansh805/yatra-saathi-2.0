import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EASE_CINEMA } from '../motion/tokens';

export interface HeroFactItem {
  label: string;
  value: string;
}

export interface HeroActionItem {
  label: string;
  to?: string;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: ReactNode;
}

export interface HeroMedallionItem {
  id: string;
  title: string;
  subtitle?: string;
  image: string | null;
}

export interface HeroAutoSlideIndicator {
  total: number;
  activeIndex: number;
  durationMs: number;
  paused?: boolean;
}

export interface CinematicHeroShowcase {
  key: string;
  eyebrow: string;
  title: string;
  accentWord?: string;
  description: string;
  image: string | null;
  imageAlt: string;
  fallbackTone?: 'teal' | 'coffee' | 'mountain' | 'heritage';
  facts?: HeroFactItem[];
  primaryAction?: HeroActionItem;
  secondaryActions?: HeroActionItem[];
  isItemSelected?: boolean;
  resetLabel?: string;
  onReset?: () => void;
}

interface CinematicDestinationHeroProps {
  showcase: CinematicHeroShowcase;
  /** Optional display-only auto-cycle progress indicator (non-clickable) */
  autoSlideIndicator?: HeroAutoSlideIndicator;
  /** Retained optional props for caller compatibility */
  medallions?: HeroMedallionItem[];
  activeMedallionId?: string | null;
  onSelectMedallion?: (id: string) => void;
  bottomSurface?: '#F8F6F0' | '#FFFFFF' | 'none';
  topNavbarOffset?: boolean;
  minHeightClass?: string;
  sectionRef?: React.RefObject<HTMLElement | null>;
  extraSlot?: ReactNode;
}

const preloadedUrls = new Set<string>();

export function preloadHeroImage(src: string | null | undefined): void {
  if (!src || typeof window === 'undefined' || preloadedUrls.has(src)) return;
  preloadedUrls.add(src);
  const img = new Image();
  img.referrerPolicy = 'no-referrer';
  img.src = src;
}

function getFallbackAtmosphereClass(tone: CinematicHeroShowcase['fallbackTone']): string {
  switch (tone) {
    case 'coffee':
      return 'from-[#2A1B14] via-[#41281E] to-[#172826]';
    case 'mountain':
      return 'from-[#0E2F3A] via-[#174857] to-[#123D3A]';
    case 'heritage':
      return 'from-[#2A2319] via-[#403421] to-[#123D3A]';
    case 'teal':
    default:
      return 'from-[#0D2B29] via-[#123D3A] to-[#1D544F]';
  }
}

function renderTitleWithAccent(title: string, accentWord?: string) {
  if (!accentWord) return title;
  const idx = title.toLowerCase().indexOf(accentWord.toLowerCase());
  if (idx === -1) return title;
  const before = title.slice(0, idx);
  const match = title.slice(idx, idx + accentWord.length);
  const after = title.slice(idx + accentWord.length);
  return (
    <>
      {before}
      <span className="text-[#E9A34A]">{match}</span>
      {after}
    </>
  );
}

function ActionButton({
  action,
  isPrimary,
}: {
  action: HeroActionItem;
  isPrimary?: boolean;
}) {
  const baseClass = isPrimary
    ? 'ys-btn-primary inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[46px] rounded-full bg-[#E9A34A] text-[#142322] text-sm sm:text-[15px] font-bold hover:bg-[#DF9538] shadow-md whitespace-nowrap shrink-0 cursor-pointer'
    : action.variant === 'ghost'
    ? 'ys-chip inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-full border border-white/25 bg-white/10 backdrop-blur-xs text-white text-sm font-semibold hover:bg-white/20 whitespace-nowrap shrink-0 cursor-pointer'
    : 'ys-btn-secondary inline-flex items-center justify-center gap-1.5 px-5 py-2.5 min-h-[44px] rounded-full border border-white/35 bg-[#0D2B29]/60 backdrop-blur-sm text-white text-sm font-semibold hover:bg-[#123D3A] whitespace-nowrap shrink-0 cursor-pointer';

  const content = (
    <>
      {action.icon}
      <span>{action.label}</span>
      {isPrimary && !action.icon && <ArrowRight className="ys-arrow w-4 h-4" aria-hidden="true" />}
    </>
  );

  if (action.to) {
    return (
      <Link to={action.to} className={baseClass}>
        {content}
      </Link>
    );
  }

  if (action.href) {
    return (
      <a
        href={action.href}
        target="_blank"
        rel="noopener noreferrer"
        className={baseClass}
      >
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={action.onClick} className={baseClass}>
      {content}
    </button>
  );
}

export function CinematicDestinationHero({
  showcase,
  autoSlideIndicator,
  bottomSurface = '#F8F6F0',
  topNavbarOffset = false,
  minHeightClass = 'min-h-[440px] sm:min-h-[510px]',
  sectionRef,
  extraSlot,
}: CinematicDestinationHeroProps) {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const hasValidImage = Boolean(showcase.image && !failedImages[showcase.image]);

  useEffect(() => {
    preloadHeroImage(showcase.image);
  }, [showcase.image]);

  const handleImageError = useCallback((url: string) => {
    setFailedImages((prev) => ({ ...prev, [url]: true }));
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`relative overflow-hidden bg-[#123D3A] text-white ${minHeightClass} flex flex-col justify-between`}
    >
      {/* Layer 1: Full-Bleed 1200ms Crossfading Backdrop + Slow Ken-Burns Zoom */}
      <div className="absolute inset-0 overflow-hidden bg-[#0E2C2A]">
        <AnimatePresence initial={false} mode="sync">
          {hasValidImage && showcase.image ? (
            <motion.img
              key={`bg-${showcase.image}-${showcase.key}`}
              src={showcase.image}
              alt={showcase.imageAlt}
              referrerPolicy="no-referrer"
              onError={() => {
                if (showcase.image) handleImageError(showcase.image);
              }}
              initial={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 1.0 }
              }
              animate={
                prefersReducedMotion
                  ? { opacity: 1 }
                  : { opacity: 1, scale: 1.08 }
              }
              exit={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 1.09 }
              }
              transition={{
                opacity: { duration: prefersReducedMotion ? 0.25 : 1.2, ease: EASE_CINEMA },
                scale: { duration: prefersReducedMotion ? 0.01 : 7.5, ease: 'linear' },
              }}
              className="absolute inset-0 w-full h-full object-cover object-center will-change-transform"
            />
          ) : (
            <motion.div
              key={`fallback-${showcase.key}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0.2 : 0.9, ease: EASE_CINEMA }}
              className={`absolute inset-0 bg-gradient-to-br ${getFallbackAtmosphereClass(
                showcase.fallbackTone
              )}`}
            >
              <div
                className="absolute -right-24 -top-24 w-[420px] h-[420px] rounded-full border border-white/10 pointer-events-none"
                aria-hidden="true"
              />
              <div
                className="absolute right-12 bottom-10 w-[260px] h-[260px] rounded-full border border-[#E9A34A]/20 pointer-events-none"
                aria-hidden="true"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Measured Readability Gradient Scrims */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#0B2321]/90 via-[#103431]/62 to-[#123D3A]/20 pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0B2321]/78 via-[#0B2321]/30 to-transparent pointer-events-none"
          aria-hidden="true"
        />
      </div>

      {/* Layer 2: Editorial Foreground (No manual Switch View / picker chrome) */}
      <div
        className={`relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col justify-center ${
          topNavbarOffset
            ? 'pt-28 pb-16 sm:pt-32 sm:pb-20'
            : 'pt-10 pb-16 sm:pt-14 sm:pb-20'
        }`}
      >
        <div className="max-w-3xl min-w-0">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={showcase.key}
              initial={
                prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 14 }
              }
              animate={
                prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }
              }
              exit={
                prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }
              }
              transition={{
                duration: prefersReducedMotion ? 0.18 : 0.45,
                ease: EASE_CINEMA,
              }}
              className="space-y-4 max-w-2xl"
            >
              {/* Metadata Kicker */}
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm font-medium tracking-wide text-[#8CC9E8]">
                <span>{showcase.eyebrow}</span>
                {showcase.isItemSelected && showcase.onReset && (
                  <>
                    <span aria-hidden="true" className="text-white/40">
                      ·
                    </span>
                    <button
                      type="button"
                      onClick={showcase.onReset}
                      className="inline-flex items-center gap-1 text-[#F8F6F0]/85 hover:text-[#E9A34A] transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{showcase.resetLabel || 'Back to overview'}</span>
                    </button>
                  </>
                )}
              </div>

              {/* Editorial Heading */}
              <motion.h1
                initial={
                  prefersReducedMotion
                    ? { opacity: 1 }
                    : { opacity: 0, y: 12 }
                }
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: prefersReducedMotion ? 0.12 : 0.4,
                  delay: prefersReducedMotion ? 0 : 0.04,
                  ease: EASE_CINEMA,
                }}
                className="font-editorial text-[32px] sm:text-[44px] lg:text-[54px] font-bold text-white leading-[1.12] tracking-tight text-balance py-0.5"
              >
                {renderTitleWithAccent(showcase.title, showcase.accentWord)}
              </motion.h1>

              {/* Short Destination Description */}
              <motion.p
                initial={
                  prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }
                }
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: prefersReducedMotion ? 0.12 : 0.38,
                  delay: prefersReducedMotion ? 0 : 0.08,
                  ease: EASE_CINEMA,
                }}
                className="text-base sm:text-[17px] text-[#F8F6F0]/90 leading-relaxed max-w-xl"
              >
                {showcase.description}
              </motion.p>

              {/* Verified Detail Facts Strip */}
              {showcase.facts && showcase.facts.length > 0 && (
                <motion.dl
                  initial={
                    prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: prefersReducedMotion ? 0.12 : 0.38,
                    delay: prefersReducedMotion ? 0 : 0.12,
                    ease: EASE_CINEMA,
                  }}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-x-5 gap-y-2.5 pt-3 border-t border-white/15 max-w-xl"
                >
                  {showcase.facts.map((fact) => (
                    <div key={`${fact.label}-${fact.value}`} className="min-w-0">
                      <dt className="eyebrow-mono text-[#8CC9E8]/90 leading-snug">
                        {fact.label}
                      </dt>
                      <dd className="text-sm font-semibold text-white leading-snug mt-0.5 tabular-figures">
                        {fact.value}
                      </dd>
                    </div>
                  ))}
                </motion.dl>
              )}

              {/* Action Row */}
              {(showcase.primaryAction ||
                (showcase.secondaryActions && showcase.secondaryActions.length > 0)) && (
                <motion.div
                  initial={
                    prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: prefersReducedMotion ? 0.12 : 0.38,
                    delay: prefersReducedMotion ? 0 : 0.16,
                    ease: EASE_CINEMA,
                  }}
                  className="flex flex-wrap items-center gap-3 pt-2"
                >
                  {showcase.primaryAction && (
                    <ActionButton action={showcase.primaryAction} isPrimary />
                  )}
                  {showcase.secondaryActions?.map((act) => (
                    <ActionButton key={act.label} action={act} />
                  ))}
                </motion.div>
              )}

              {extraSlot && <div className="pt-1">{extraSlot}</div>}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Display-Only (Non-Clickable) Thin Slide Progress Indicator */}
        {autoSlideIndicator && autoSlideIndicator.total > 1 && (
          <div
            className="mt-7 flex items-center gap-2 max-w-[220px] pointer-events-none select-none"
            aria-hidden="true"
          >
            {Array.from({ length: autoSlideIndicator.total }).map((_, idx) => {
              const isCurrent = idx === autoSlideIndicator.activeIndex;
              return (
                <span
                  key={idx}
                  className={`relative h-[2px] rounded-full overflow-hidden bg-white/25 transition-all duration-500 ${
                    isCurrent ? 'flex-[2.2]' : 'flex-1'
                  }`}
                >
                  {isCurrent && (
                    <motion.span
                      key={`fill-${autoSlideIndicator.activeIndex}`}
                      initial={{ scaleX: 0 }}
                      animate={{
                        scaleX: autoSlideIndicator.paused ? 0.35 : 1,
                      }}
                      transition={{
                        duration: prefersReducedMotion
                          ? 0.01
                          : autoSlideIndicator.durationMs / 1000,
                        ease: 'linear',
                      }}
                      style={{ transformOrigin: 'left center' }}
                      className="absolute inset-0 bg-[#E9A34A]"
                    />
                  )}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Layer 3: Curved Contour into Page Surface */}
      {bottomSurface !== 'none' && (
        <svg
          viewBox="0 0 1440 72"
          preserveAspectRatio="none"
          className="relative z-10 block w-full h-10 sm:h-16 -mb-px pointer-events-none"
          aria-hidden="true"
        >
          <path
            d="M0,44 C320,8 660,12 1080,36 C1260,46 1380,44 1440,34 L1440,72 L0,72 Z"
            fill={bottomSurface}
            fillOpacity="0.45"
          />
          <path
            d="M0,52 C360,10 1080,10 1440,52 L1440,72 L0,72 Z"
            fill={bottomSurface}
          />
        </svg>
      )}
    </section>
  );
}
