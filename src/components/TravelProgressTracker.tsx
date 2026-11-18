import { motion, useReducedMotion } from 'motion/react';
import { Check, MapPin, Plane } from 'lucide-react';
import { EASE_PRIMARY } from '../motion/tokens';

interface TravelProgressTrackerProps {
  activeStage: 1 | 2 | 3 | 4;
}

const STEPS: Array<{ num: 1 | 2 | 3 | 4; label: string }> = [
  { num: 1, label: 'Arrival' },
  { num: 2, label: 'First Ride' },
  { num: 3, label: 'Explore Destinations' },
  { num: 4, label: 'Compare Local Rides' },
];

export function TravelProgressTracker({ activeStage }: TravelProgressTrackerProps) {
  const prefersReducedMotion = Boolean(useReducedMotion());

  return (
    <div className="w-full relative flex items-center justify-center mb-7 sm:mb-9">
      {/* Subtle flanking route trail decoration */}
      <div
        className="hidden xl:flex items-center gap-2 absolute left-0 top-1/2 -translate-y-1/2 text-[#123D3A]/60 pointer-events-none select-none"
        aria-hidden="true"
      >
        <MapPin className="w-5 h-5 text-[#123D3A]" />
        <span className="w-24 border-t-2 border-dashed border-[#D6CEC0]" />
      </div>

      <nav
        aria-label="Travel Assist workflow steps"
        className="max-w-full overflow-x-auto rounded-full bg-white/95 border border-[#E5DFD3] px-3 sm:px-5 py-2 shadow-xs [scrollbar-width:none]"
      >
        <ol className="flex items-center justify-center gap-1.5 sm:gap-3 whitespace-nowrap">
          {STEPS.map((step, idx) => {
            const completed = activeStage > step.num;
            const current = activeStage === step.num;

            return (
              <li key={step.num} className="flex items-center gap-1.5 sm:gap-3">
                <div
                  className={`relative inline-flex items-center gap-2.5 px-3.5 py-2 rounded-full transition-colors duration-300 ${
                    completed && !current ? 'bg-[#E9A34A]/12' : ''
                  }`}
                >
                  {current && (
                    <motion.span
                      layoutId={prefersReducedMotion ? undefined : 'travel-step-active-pill'}
                      transition={{ duration: 0.35, ease: EASE_PRIMARY }}
                      className="absolute inset-0 rounded-full bg-[#F8F6F0] ring-1 ring-[#123D3A]/25 shadow-2xs pointer-events-none"
                      aria-hidden="true"
                    />
                  )}

                  <span
                    className={`relative z-10 w-7 h-7 rounded-full text-sm font-mono font-bold flex items-center justify-center transition-colors duration-300 ${
                      current
                        ? 'bg-[#123D3A] text-white shadow-xs'
                        : completed
                        ? 'bg-[#E9A34A] text-[#142322]'
                        : 'bg-[#ECE6DA] text-[#5A6664]'
                    }`}
                  >
                    {completed ? (
                      <motion.span
                        key={`check-${step.num}`}
                        initial={prefersReducedMotion ? undefined : { scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.25, ease: EASE_PRIMARY }}
                        className="inline-flex items-center justify-center"
                      >
                        <Check className="w-4 h-4 stroke-[2.75]" aria-hidden="true" />
                      </motion.span>
                    ) : (
                      step.num
                    )}
                  </span>
                  <span
                    className={`relative z-10 text-sm transition-colors duration-300 ${
                      current
                        ? 'font-bold text-[#123D3A]'
                        : completed
                        ? 'font-semibold text-[#142322]'
                        : 'font-medium text-[#5A6664]'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>

                {idx < STEPS.length - 1 && (
                  <span
                    className={`text-sm font-semibold transition-colors ${
                      completed ? 'text-[#E9A34A]' : 'text-[#C7BFA9]'
                    }`}
                    aria-hidden="true"
                  >
                    →
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <div
        className="hidden xl:flex items-center gap-2 absolute right-0 top-1/2 -translate-y-1/2 text-[#123D3A]/60 pointer-events-none select-none"
        aria-hidden="true"
      >
        <span className="w-24 border-t-2 border-dashed border-[#D6CEC0]" />
        <Plane className="w-5 h-5 text-[#123D3A] rotate-12" />
      </div>
    </div>
  );
}
