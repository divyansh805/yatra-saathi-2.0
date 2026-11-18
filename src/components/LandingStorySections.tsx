import { useEffect, useRef, useState, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react';
import { ArrowRight, Compass, MapPin, ShieldCheck, Train } from 'lucide-react';
import { SafeImage } from './SafeImage';
import { MaskedHeadlineWords, Reveal } from './Reveal';
import { useDetailOverlay, type PlaceOverlayPayload } from './DetailOverlay';
import { DESTINATIONS, IMAGES } from '../data/destinations';
import {
  EASE_CINEMA,
  EASE_PRIMARY,
  SCROLL_SPRING,
  TILT_SPRING,
} from '../motion/tokens';

function useMeasuredWidth(ref: RefObject<HTMLElement | null>, fallbackWidth = 1240) {
  const [width, setWidth] = useState(fallbackWidth);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const next = el.clientWidth;
      if (next > 0) {
        setWidth(next);
      }
    };

    update();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry && entry.contentRect.width > 0) {
        setWidth(Math.round(entry.contentRect.width));
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return width;
}

export interface HeroDeckCard {
  id: string;
  title: string;
  location: string;
  category: string;
  image: string;
  destId?: string;
  description: string;
  bestTime: string;
  highlights: string[];
  baseRotate: number;
  baseY: number;
  zIndex: number;
}

export const HERO_DECK_CARDS: HeroDeckCard[] = [
  {
    id: 'puri-temple',
    title: 'Shri Jagannath Temple',
    location: 'Puri, Odisha',
    category: 'Temples & Heritage',
    image: IMAGES.jagannathTemple,
    description:
      '12th-century Kalinga sandstone shrine anchored along Grand Road in Puri, famous for early morning darshan and the coastal pilgrim precinct.',
    bestTime: '5:30 AM – 8:30 AM (softer queues)',
    highlights: ['Kalinga Architecture', 'Coastal Pilgrim Hub', 'Prepaid Auto Stand', 'Grand Road Market'],
    baseRotate: -7.5,
    baseY: 22,
    zIndex: 11,
  },
  {
    id: 'udaipur-palace',
    title: 'City Palace & Pichola',
    location: 'Udaipur, Rajasthan',
    category: 'Heritage Palaces',
    image: IMAGES.udaipurHero,
    destId: 'udaipur',
    description:
      'Mewar royal complex spanning 11 interconnected courtyards above Lake Pichola with panoramic views of Jag Mandir and Aravalli ridges.',
    bestTime: '9:30 AM – 11:30 AM',
    highlights: ['11 Courtyards', 'Lake Pichola Views', 'Old City Auto Drop', 'Museum Entry Verified'],
    baseRotate: -4.2,
    baseY: 8,
    zIndex: 13,
  },
  {
    id: 'manali-himalayas',
    title: 'Old Manali Deodar Ridge',
    location: 'Manali, Himachal Pradesh',
    category: 'Mountains',
    image: IMAGES.manaliValley,
    destId: 'manali',
    description:
      'Traditional kath-kuni timber homes tucked beneath towering deodar cedar groves above the Manalsu river footbridge.',
    bestTime: '7:30 AM – 11:00 AM',
    highlights: ['Cedar Forest Walks', 'Apple Orchards', 'Manalsu Footbridge', 'Union Taxi Advisories'],
    baseRotate: -1.6,
    baseY: -8,
    zIndex: 16,
  },
  {
    id: 'indian-beach',
    title: 'Golden Coast at Dusk',
    location: 'Puri & Konkan Coast',
    category: 'Beaches',
    image: IMAGES.indianBeach,
    description:
      'Calm Bay of Bengal and Arabian Sea coastal promenades lined with fishing boats, clean evening walkways, and breezy tea stalls.',
    bestTime: '5:30 AM Sunrise or 5:15 PM Dusk',
    highlights: ['Blue Flag Walks', 'Calm Evening Breeze', 'Auto Accessible', 'Zero Crowded Touts'],
    baseRotate: 0.4,
    baseY: -4,
    zIndex: 18,
  },
  {
    id: 'jaipur-hawa',
    title: 'Hawa Mahal Facade',
    location: 'Jaipur, Rajasthan',
    category: 'Heritage Cities',
    image: IMAGES.hawaMahal,
    destId: 'jaipur',
    description:
      'Five-storey 1799 honeycomb sandstone facade with 953 ventilated jharokhas facing Sireh Deori Bazaar and Badi Chaupar Metro.',
    bestTime: '8:30 AM – 10:00 AM',
    highlights: ['953 Jharokhas', 'Pink Line Metro', 'Rooftop Views Opposite', 'Composite Ticket Info'],
    baseRotate: 2.8,
    baseY: 6,
    zIndex: 15,
  },
  {
    id: 'rishikesh-cafe',
    title: 'Ganga Edge Deck & Chai',
    location: 'Rishikesh, Uttarakhand',
    category: 'Cafe Corner',
    image: IMAGES.cafeRiverside,
    destId: 'rishikesh',
    description:
      'Open-air wooden deck overlooking turquoise Ganga rapids, tailored for solo travellers seeking quiet tables and reliable power.',
    bestTime: '7:30 AM – 10:30 AM',
    highlights: ['Solo Traveller Friendly', 'Riverside Deck', 'Acoustic Calm', 'Honest Menu Prices'],
    baseRotate: -2.4,
    baseY: 14,
    zIndex: 14,
  },
  {
    id: 'bir-paragliding',
    title: 'Bir Billing Thermal Glide',
    location: 'Kangra Valley, Himachal',
    category: 'Adventure',
    image: IMAGES.adventureParagliding,
    destId: 'manali',
    description:
      '20-minute thermal glide from Billing (2,400 m) over terraced Kangra hills down to Bir Tibetan Colony with SADA-registered pilots.',
    bestTime: 'March – June, Oct – Dec',
    highlights: ['SADA Certified Pilots', '2,400m Take-Off', 'Standard Tariff Guide', 'Safety Checklist'],
    baseRotate: 4.8,
    baseY: 20,
    zIndex: 12,
  },
  {
    id: 'courtyard-stay',
    title: 'Kumbha Courtyard Haveli',
    location: 'Chandpole, Udaipur',
    category: 'Verified Stays',
    image: IMAGES.heritageHaveli,
    destId: 'udaipur',
    description:
      'Sunlit heritage guesthouse with ground-audited lane access notes, 45 Mbps courtyard fiber Wi-Fi, and zero surprise room tariffs.',
    bestTime: 'October to March',
    highlights: ['Audited Lane Access', 'Dual-Band Fiber', 'Walk to City Palace', 'Zero Hidden Tariffs'],
    baseRotate: 7.2,
    baseY: 28,
    zIndex: 10,
  },
];

function buildOverlayPayloadFromHeroCard(card: HeroDeckCard): PlaceOverlayPayload {
  const dest = card.destId ? DESTINATIONS.find((d) => d.id === card.destId) : undefined;
  return {
    kind: 'place',
    id: card.id,
    layoutId: `hero-card-${card.id}`,
    title: card.title,
    category: card.category,
    location: card.location,
    image: card.image,
    galleryImages: dest
      ? [card.image, dest.heroImage, dest.attractions[0]?.image, dest.cafes[0]?.image].filter(
          (u): u is string => Boolean(u)
        )
      : [card.image, IMAGES.udaipurHero, IMAGES.indianBeach],
    description: card.description,
    bestTime: card.bestTime,
    highlights: card.highlights,
    destinationId: card.destId || 'udaipur',
    detailRoute: card.destId ? `/explore?dest=${card.destId}` : '/explore',
    itemTypeForSave: card.category === 'Cafe Corner' ? 'cafe' : card.category === 'Adventure' ? 'adventure' : 'attraction',
  };
}

interface HeroSectionProps {
  primaryCtaTo: string;
}

const GENTLE_FAN_ROTATIONS = [-3.2, -2.0, -0.9, 0.4, -0.5, 1.1, 2.2, 3.2];
const GENTLE_FAN_OFFSETS = [6, 1, -4, -6, -4, 0, 4, 8];

export function LandingHeroSection({ primaryCtaTo }: HeroSectionProps) {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const { openDetail } = useDetailOverlay();
  const heroRef = useRef<HTMLElement | null>(null);
  const [activeCardId, setActiveCardId] = useState<string>('indian-beach');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const smoothProgress = useSpring(scrollYProgress, SCROLL_SPRING);
  const activeProgress = prefersReducedMotion ? scrollYProgress : smoothProgress;

  const ambientOpacity = useTransform(activeProgress, [0, 0.9], [0.3, 0.08]);
  const ambientY = useTransform(activeProgress, [0, 1], [0, 65]);

  const activeCard =
    HERO_DECK_CARDS.find((c) => c.id === activeCardId) || HERO_DECK_CARDS[3];

  return (
    <section
      ref={heroRef}
      className="relative overflow-x-clip bg-[#0A0C0B] text-[#F8F6F0] pt-14 sm:pt-20 pb-20 sm:pb-28"
    >
      {/* Subtle Ambient Backdrop Crossfading With Active Card + Parallax */}
      <motion.div
        style={{
          opacity: prefersReducedMotion ? 0.22 : ambientOpacity,
          y: prefersReducedMotion ? 0 : ambientY,
        }}
        className="absolute inset-0 pointer-events-none overflow-hidden will-change-transform"
        aria-hidden="true"
      >
        <AnimatePresence mode="sync" initial={false}>
          <motion.img
            key={activeCard.image}
            src={activeCard.image}
            alt=""
            referrerPolicy="no-referrer"
            initial={{ opacity: 0, scale: 1.07 }}
            animate={{ opacity: 1, scale: 1.02 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0.15 : 0.75, ease: EASE_CINEMA }}
            className="absolute inset-0 w-full h-full object-cover blur-2xl scale-105"
          />
        </AnimatePresence>
      </motion.div>

      <div
        className="absolute inset-0 pointer-events-none bg-editorial-grain opacity-75"
        aria-hidden="true"
      />

      <div
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_75%_55%_at_50%_18%,rgba(233,163,74,0.14),rgba(10,12,11,0.75)_58%,#0A0C0B_100%)]"
        aria-hidden="true"
      />

      {/* Soft gradient bridge at bottom of hero */}
      <div
        className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-[#0B0E0D] pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-[1420px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial Hero Copy with word-by-word masked reveal */}
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <motion.p
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE_PRIMARY }}
            className="eyebrow-mono font-medium text-[#8CC9E8]"
          >
            Yatra Saathi · Ground-Level Indian Travel Intelligence
          </motion.p>

          <h1 className="font-editorial text-[42px] sm:text-[60px] lg:text-[76px] font-semibold text-white leading-[1.04] tracking-tight text-balance">
            <span className="block">
              <MaskedHeadlineWords text="India is waiting." baseDelay={0.05} />
            </span>
            <span className="block mt-1">
              <MaskedHeadlineWords
                text="Go beyond the ordinary."
                accentWord="beyond"
                baseDelay={0.22}
              />
            </span>
          </h1>

          <motion.p
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.34, ease: EASE_PRIMARY }}
            className="text-base sm:text-xl text-[#F8F6F0]/82 leading-relaxed max-w-[60ch] mx-auto"
          >
            Discover hidden places, compare your arrival rides and experience every destination across India with confidence.
          </motion.p>

          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.42, ease: EASE_PRIMARY }}
            className="pt-2 flex flex-wrap items-center justify-center gap-4"
          >
            <MagneticCtaLink to={primaryCtaTo} label="Start Exploring" />
          </motion.div>
        </div>

        {/* All 8 Destination Cards in ONE Evenly-Spaced Non-Overlapping Horizontal Row */}
        <div className="mt-10 sm:mt-14">
          <div
            className="flex flex-nowrap items-stretch gap-[clamp(12px,1.35vw,18px)] overflow-x-auto no-scrollbar snap-x snap-mandatory xl:snap-none py-8 px-3 sm:px-4 xl:px-2 touch-pan-x"
            onMouseLeave={() => setHoveredIdx(null)}
          >
            {HERO_DECK_CARDS.map((card, index) => (
              <HeroFloatingCard
                key={card.id}
                card={card}
                index={index}
                hoveredIdx={hoveredIdx}
                isActive={card.id === activeCardId}
                prefersReducedMotion={prefersReducedMotion}
                onHoverStart={() => {
                  setHoveredIdx(index);
                  setActiveCardId(card.id);
                }}
                onHoverEnd={() => {
                  setHoveredIdx((prev) => (prev === index ? null : prev));
                }}
                onOpenDetail={(el) => {
                  setActiveCardId(card.id);
                  openDetail(buildOverlayPayloadFromHeroCard(card), el);
                }}
              />
            ))}
          </div>

          {/* Quiet Active Spotlight Caption Bar */}
          <div className="mt-1 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCard.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25, ease: EASE_PRIMARY }}
                className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-sm text-[#F8F6F0]/85"
              >
                <span className="text-[#E9A34A] font-semibold">{activeCard.category}</span>
                <span aria-hidden="true" className="text-white/30">
                  ·
                </span>
                <span className="text-white font-medium">{activeCard.title}</span>
                <span aria-hidden="true" className="text-white/30">
                  ·
                </span>
                <span>{activeCard.location}</span>
                <span aria-hidden="true" className="text-white/30">
                  ·
                </span>
                <button
                  type="button"
                  onClick={(e) => openDetail(buildOverlayPayloadFromHeroCard(activeCard), e.currentTarget)}
                  className="text-[#8CC9E8] hover:text-white underline underline-offset-4 font-semibold inline-flex items-center gap-1 cursor-pointer min-h-[36px]"
                >
                  <span>Inspect destination</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

function MagneticCtaLink({ to, label }: { to: string; label: string }) {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 260, damping: 20, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 260, damping: 20, mass: 0.4 });

  const handleMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (prefersReducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
    const dy = ((e.clientY - rect.top) / rect.height - 0.5) * 6;
    x.set(dx);
    y.set(dy);
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      style={prefersReducedMotion ? undefined : { x: springX, y: springY }}
      className="inline-block"
    >
      <Link
        to={to}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 min-h-[54px] rounded-full bg-[#E9A34A] text-[#142322] font-bold text-base sm:text-[17px] hover:bg-[#DF9538] active:scale-[0.98] transition-colors shadow-[0_14px_40px_rgba(233,163,74,0.28)] whitespace-nowrap"
      >
        <span>{label}</span>
        <ArrowRight
          className="w-5 h-5 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1"
          aria-hidden="true"
        />
      </Link>
    </motion.div>
  );
}

function HeroFloatingCard({
  card,
  index,
  hoveredIdx,
  isActive,
  prefersReducedMotion,
  onHoverStart,
  onHoverEnd,
  onOpenDetail,
}: {
  card: HeroDeckCard;
  index: number;
  hoveredIdx: number | null;
  isActive: boolean;
  prefersReducedMotion: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  onOpenDetail: (el: HTMLElement) => void;
}) {
  const tiltRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const targetTiltRef = useRef({ rx: 0, ry: 0 });
  const currentTiltRef = useRef({ rx: 0, ry: 0 });

  const baseRotate = GENTLE_FAN_ROTATIONS[index] ?? 0;
  const baseY = GENTLE_FAN_OFFSETS[index] ?? 0;
  const isHovered = hoveredIdx === index;

  let neighborPushX = 0;
  if (!prefersReducedMotion && hoveredIdx !== null && hoveredIdx !== index) {
    const distance = Math.abs(index - hoveredIdx);
    const direction = index < hoveredIdx ? -1 : 1;
    if (distance === 1) neighborPushX = direction * 9;
    else if (distance === 2) neighborPushX = direction * 4;
  }

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const scheduleTiltLoop = () => {
    if (prefersReducedMotion || rafRef.current !== null) return;
    const tick = () => {
      const el = tiltRef.current;
      if (!el) {
        rafRef.current = null;
        return;
      }
      const cur = currentTiltRef.current;
      const tgt = targetTiltRef.current;
      cur.rx += (tgt.rx - cur.rx) * 0.18;
      cur.ry += (tgt.ry - cur.ry) * 0.18;

      el.style.transform = `perspective(900px) rotateX(${cur.rx.toFixed(2)}deg) rotateY(${cur.ry.toFixed(2)}deg) translate3d(0,0,0)`;

      if (Math.abs(tgt.rx - cur.rx) > 0.04 || Math.abs(tgt.ry - cur.ry) > 0.04) {
        rafRef.current = window.requestAnimationFrame(tick);
      } else {
        cur.rx = tgt.rx;
        cur.ry = tgt.ry;
        el.style.transform =
          tgt.rx === 0 && tgt.ry === 0
            ? 'perspective(900px) rotateX(0deg) rotateY(0deg) translate3d(0,0,0)'
            : `perspective(900px) rotateX(${tgt.rx.toFixed(2)}deg) rotateY(${tgt.ry.toFixed(2)}deg) translate3d(0,0,0)`;
        rafRef.current = null;
      }
    };
    rafRef.current = window.requestAnimationFrame(tick);
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (prefersReducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    targetTiltRef.current = {
      rx: (0.5 - py) * 10,
      ry: (px - 0.5) * 10,
    };
    scheduleTiltLoop();
  };

  const handlePointerLeave = () => {
    targetTiltRef.current = { rx: 0, ry: 0 };
    scheduleTiltLoop();
    onHoverEnd();
  };

  return (
    <motion.div
      initial={
        prefersReducedMotion
          ? { opacity: 1 }
          : { opacity: 0, y: 40, rotate: baseRotate }
      }
      animate={{
        opacity: 1,
        x: neighborPushX,
        y: prefersReducedMotion ? 0 : isHovered ? -14 : baseY,
        rotate: prefersReducedMotion ? 0 : isHovered ? 0 : baseRotate,
        scale: prefersReducedMotion ? 1 : isHovered ? 1.04 : hoveredIdx !== null ? 0.99 : 1,
      }}
      transition={{
        opacity: {
          duration: prefersReducedMotion ? 0.15 : 0.8,
          delay: prefersReducedMotion ? 0 : index * 0.07,
          ease: EASE_PRIMARY,
        },
        y: hoveredIdx === null
          ? {
              duration: prefersReducedMotion ? 0.15 : 0.8,
              delay: prefersReducedMotion ? 0 : index * 0.07,
              ease: EASE_PRIMARY,
            }
          : { type: 'spring', stiffness: 320, damping: 26, mass: 0.65 },
        x: { type: 'spring', stiffness: 300, damping: 26, mass: 0.65 },
        scale: { type: 'spring', stiffness: 320, damping: 25, mass: 0.6 },
        rotate: { type: 'spring', stiffness: 280, damping: 26 },
      }}
      style={{ zIndex: isHovered ? 30 : isActive ? 20 : 10 + index }}
      className="snap-start shrink-0 min-w-[150px] w-[166px] sm:w-[172px] xl:flex-1 xl:w-auto aspect-[3/4] will-change-transform"
    >
      <div
        ref={tiltRef}
        className="w-full h-full will-change-transform"
        style={{ transform: 'perspective(900px) translate3d(0,0,0)' }}
      >
        <button
          type="button"
          onMouseEnter={onHoverStart}
          onFocus={onHoverStart}
          onMouseMove={handlePointerMove}
          onMouseLeave={handlePointerLeave}
          onBlur={onHoverEnd}
          onClick={(e) => onOpenDetail(e.currentTarget)}
          className={`group relative w-full h-full rounded-2xl overflow-hidden border text-left cursor-pointer transition-[border-color,box-shadow] duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E9A34A] bg-[#121716] ${
            isHovered
              ? 'border-[#E9A34A] shadow-[0_26px_55px_rgba(0,0,0,0.85)]'
              : isActive
              ? 'border-[#E9A34A]/65 shadow-[0_18px_42px_rgba(0,0,0,0.72)]'
              : 'border-white/18 shadow-[0_14px_34px_rgba(0,0,0,0.6)] hover:border-white/45'
          }`}
        >
          <SafeImage
            src={card.image}
            alt={`${card.title} — ${card.location}`}
            priority
            darkSkeleton
            className="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.08]"
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/10 to-black/90 pointer-events-none"
            aria-hidden="true"
          />
          <div className="absolute top-3 left-3 right-3 pointer-events-none">
            <span className="inline-block max-w-full truncate text-[12.5px] font-medium tracking-wide text-[#8CC9E8] drop-shadow-sm">
              {card.category}
            </span>
          </div>
          <div className="absolute bottom-3.5 left-3.5 right-3.5 pointer-events-none">
            <p className="font-editorial text-[18px] sm:text-[19px] font-semibold text-white leading-[1.18] line-clamp-2 drop-shadow-sm">
              {card.title}
            </p>
          </div>
        </button>
      </div>
    </motion.div>
  );
}

/* --------------------------------------------------------------------------
 * SECTION 1 — DISCOVER INDIA ("Every journey has a story.")
 * Scroll-driven transformation from compact fanned stack -> separated editorial gallery
 * -------------------------------------------------------------------------- */

const STORY_CARDS = [
  {
    id: 'story-puri',
    title: 'Shri Jagannath Temple',
    place: 'Puri, Odisha',
    tag: 'Sacred Kalinga Architecture',
    image: IMAGES.jagannathTemple,
    destLink: '/explore',
    destId: 'udaipur',
    description:
      'Iconic 12th-century temple complex along Grand Road in Puri, surrounded by heritage mutts and coastal promenades.',
  },
  {
    id: 'story-udaipur',
    title: 'Lake Pichola & Palaces',
    place: 'Udaipur, Rajasthan',
    tag: 'Waterfront Heritage',
    image: IMAGES.udaipurHero,
    destLink: '/explore?dest=udaipur',
    destId: 'udaipur',
    description:
      'Lakeside Mewar palaces, narrow Chandpole lanes, and sunset ghats framed by Aravalli peaks.',
  },
  {
    id: 'story-rishikesh',
    title: 'Ganga Himalayan Foothills',
    place: 'Rishikesh, Uttarakhand',
    tag: 'River & Forest Trails',
    image: IMAGES.rishikeshGanga,
    destLink: '/explore?dest=rishikesh',
    destId: 'rishikesh',
    description:
      'Emerald river rapids, pedestrian ghats around Ram Jhula, and serene forested ashram walks.',
  },
  {
    id: 'story-alleppey',
    title: 'Kuttanad Palm Canals',
    place: 'Alleppey, Kerala',
    tag: 'Public Ferry Backwaters',
    image: IMAGES.alleppeyBackwaters,
    destLink: '/explore?dest=alleppey',
    destId: 'alleppey',
    description:
      'Below-sea-level rice paddies and coconut-lined canals served daily by ₹15 public SWTD wooden ferries.',
  },
  {
    id: 'story-coast',
    title: 'Indian Golden Shorelines',
    place: 'Odisha & Konkan Coast',
    tag: 'Quiet Dusk Horizons',
    image: IMAGES.indianBeach,
    destLink: '/explore',
    destId: 'alleppey',
    description:
      'Unrushed coastal evenings where fishermen haul wooden boats ashore beneath soft amber twilight.',
  },
];

export function DiscoverIndiaStorySection() {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const { openDetail } = useDetailOverlay();
  const sectionRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const stageWidth = useMeasuredWidth(stageRef, 1240);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start 0.25', 'end end'],
  });

  const smoothProgress = useSpring(scrollYProgress, SCROLL_SPRING);
  const activeProgress = prefersReducedMotion ? scrollYProgress : smoothProgress;

  const bgGlowOpacity = useTransform(activeProgress, [0, 0.55, 1], [0.08, 0.45, 0.24]);
  const headlineY = useTransform(activeProgress, [0, 0.35], [22, 0]);
  const subHeadlineOpacity = useTransform(activeProgress, [0.08, 0.48], [0.45, 1]);

  const count = STORY_CARDS.length;
  const targetGap = stageWidth >= 1180 ? 22 : stageWidth >= 1020 ? 18 : 14;
  const maxCardWidth = 232;
  const cardWidth = Math.max(
    160,
    Math.min(maxCardWidth, Math.floor((stageWidth - (count - 1) * targetGap) / count))
  );
  const initialStep = Math.round(cardWidth * 0.22);
  const finalStep = cardWidth + targetGap;

  const openStoryOverlay = (card: (typeof STORY_CARDS)[number], el: HTMLElement) => {
    openDetail(
      {
        kind: 'place',
        id: card.id,
        layoutId: `story-card-${card.id}`,
        title: card.title,
        category: card.tag,
        location: card.place,
        image: card.image,
        description: card.description,
        highlights: [card.tag, 'Ground-Checked Tips', 'Local Ride Estimates'],
        destinationId: card.destId,
        detailRoute: card.destLink,
      },
      el
    );
  };

  return (
    <section
      ref={sectionRef}
      className="relative bg-[#0B0E0D] text-[#F8F6F0] lg:min-h-[215vh]"
    >
      <div
        className="absolute inset-0 pointer-events-none bg-editorial-grain opacity-65"
        aria-hidden="true"
      />
      {/* Subtle Scroll-Shifting Deep Teal Ambient Transition */}
      <motion.div
        style={{ opacity: prefersReducedMotion ? 0.2 : bgGlowOpacity }}
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(18,61,58,0.85),transparent_75%)]"
        aria-hidden="true"
      />

      <div className="lg:sticky lg:top-[72px] lg:min-h-[calc(100vh-72px)] flex flex-col justify-center py-20 lg:py-10 overflow-x-clip">
        <div className="relative z-10 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-10 lg:space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
            <motion.div
              style={{ y: prefersReducedMotion ? 0 : headlineY }}
              className="lg:col-span-7 space-y-3"
            >
              <p className="eyebrow-mono text-[#8CC9E8]">
                01. Discover India
              </p>
              <h2 className="font-editorial text-4xl sm:text-5xl lg:text-[58px] font-semibold text-white leading-[1.06] text-balance">
                Every journey has a <span className="text-[#E9A34A] italic font-normal">story</span>.
              </h2>
            </motion.div>

            <motion.p
              style={{ opacity: prefersReducedMotion ? 1 : subHeadlineOpacity }}
              className="lg:col-span-5 text-base sm:text-lg text-[#F8F6F0]/78 leading-relaxed max-w-[55ch]"
            >
              From dawn temple courtyards in Puri to quiet backwater ferries in Kerala—see each destination in full light before packing a single bag.
            </motion.p>
          </div>

          {/* Desktop Scroll-Driven Spread Transformation */}
          <div
            ref={stageRef}
            className="hidden lg:flex items-center justify-center relative h-[360px] xl:h-[390px]"
          >
            {STORY_CARDS.map((card, i) => (
              <StorySpreadCard
                key={card.id}
                card={card}
                index={i}
                total={count}
                cardWidth={cardWidth}
                initialStep={initialStep}
                finalStep={finalStep}
                scrollProgress={activeProgress}
                prefersReducedMotion={prefersReducedMotion}
                onOpen={(el) => openStoryOverlay(card, el)}
              />
            ))}
          </div>

          {/* Mobile/Tablet Story Grid */}
          <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-5">
            {STORY_CARDS.map((card) => (
              <button
                key={`sm-${card.id}`}
                type="button"
                onClick={(e) => openStoryOverlay(card, e.currentTarget)}
                className="group relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/15 bg-[#121615] text-left cursor-pointer"
              >
                <SafeImage
                  src={card.image}
                  alt={`${card.title} — ${card.place}`}
                  darkSkeleton
                  className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/25 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-sm text-[#E9A34A] font-medium">{card.tag}</p>
                  <h3 className="font-editorial text-xl font-semibold text-white mt-0.5">
                    {card.title}
                  </h3>
                  <p className="text-sm text-[#F8F6F0]/80 mt-0.5">{card.place}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function StorySpreadCard({
  card,
  index,
  total,
  cardWidth,
  initialStep,
  finalStep,
  scrollProgress,
  prefersReducedMotion,
  onOpen,
}: {
  card: (typeof STORY_CARDS)[number];
  index: number;
  total: number;
  cardWidth: number;
  initialStep: number;
  finalStep: number;
  scrollProgress: MotionValue<number>;
  prefersReducedMotion: boolean;
  onOpen: (el: HTMLElement) => void;
}) {
  const centerIdx = (total - 1) / 2;
  const dist = index - centerIdx;
  const absDist = Math.abs(dist);
  const isCenter = index === 2;
  const isInnerPair = index === 1 || index === 3;

  const x = useTransform(
    scrollProgress,
    [0, 0.12, 0.76, 1],
    [dist * initialStep, dist * (initialStep * 1.35), dist * finalStep, dist * finalStep]
  );
  const rotate = useTransform(
    scrollProgress,
    [0, 0.12, 0.76, 1],
    [dist * 5.2, dist * 4.2, 0, 0]
  );
  const startScale = isCenter ? 0.96 : isInnerPair ? 0.91 : 0.86;
  const endScale = isCenter ? 1.03 : 0.99;
  const scale = useTransform(
    scrollProgress,
    [0, 0.12, 0.76, 1],
    [startScale, startScale + 0.02, endScale, endScale]
  );
  const startY = absDist * 14;
  const endY = isCenter ? -6 : isInnerPair ? 6 : -2;
  const y = useTransform(
    scrollProgress,
    [0, 0.12, 0.76, 1],
    [startY, startY * 0.8, endY, endY]
  );

  const baseZIndex = isCenter ? 30 : isInnerPair ? 22 + index : 14 + index;

  return (
    <motion.div
      style={{
        width: cardWidth,
        x: prefersReducedMotion ? dist * finalStep : x,
        y: prefersReducedMotion ? endY : y,
        rotate: prefersReducedMotion ? 0 : rotate,
        scale: prefersReducedMotion ? 1 : scale,
        zIndex: baseZIndex,
      }}
      className="absolute aspect-[3/4] will-change-transform"
    >
      <motion.button
        type="button"
        onClick={(e) => onOpen(e.currentTarget)}
        whileHover={prefersReducedMotion ? undefined : { y: -12, scale: 1.035 }}
        transition={{ duration: 0.35, ease: EASE_PRIMARY }}
        className="group block w-full h-full relative rounded-2xl overflow-hidden border border-white/20 hover:border-[#E9A34A]/65 shadow-[0_24px_65px_rgba(0,0,0,0.75)] bg-[#141817] transition-[border-color] duration-300 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E9A34A]"
      >
        <SafeImage
          src={card.image}
          alt={`${card.title} — ${card.place}`}
          darkSkeleton
          className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 space-y-1">
          <p className="text-sm font-medium text-[#E9A34A]">{card.tag}</p>
          <h3 className="font-editorial text-lg xl:text-xl font-semibold text-white leading-snug">
            {card.title}
          </h3>
          <p className="text-sm text-[#F8F6F0]/80">{card.place}</p>
        </div>
      </motion.button>
    </motion.div>
  );
}

/* --------------------------------------------------------------------------
 * SECTION 2 — FIND YOUR WAY ("Reach every place with confidence.")
 * Travel Assist showcase with layered station plaza & Bike / Auto / Cab stack
 * -------------------------------------------------------------------------- */

const VEHICLE_SHOWCASE = [
  {
    id: 'bike',
    label: 'Bike Taxi',
    note: 'Quick narrow-lane arrival',
    vehicleImg: IMAGES.vehicleBikeTaxi,
  },
  {
    id: 'auto',
    label: 'Auto-Rickshaw',
    note: 'Short city & bazaar hops',
    vehicleImg: IMAGES.vehicleAutoRickshaw,
  },
  {
    id: 'cab',
    label: 'AC Sedan Cab',
    note: 'Airport & luggage comfort',
    vehicleImg: IMAGES.vehicleSedanCab,
  },
];

export function FindYourWaySection() {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const ref = useRef<HTMLElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const smoothProgress = useSpring(scrollYProgress, SCROLL_SPRING);
  const activeProgress = prefersReducedMotion ? scrollYProgress : smoothProgress;

  const mainPhotoScale = useTransform(activeProgress, [0.05, 0.55], [1.08, 1.0]);
  const card0Y = useTransform(activeProgress, [0.1, 0.7], [42, -20]);
  const card1Y = useTransform(activeProgress, [0.1, 0.7], [62, -34]);
  const card2Y = useTransform(activeProgress, [0.1, 0.7], [82, -14]);
  const cardOffsets = [card0Y, card1Y, card2Y];

  return (
    <section
      ref={ref}
      className="relative py-24 sm:py-32 bg-gradient-to-b from-[#0B0E0D] via-[#0E1211] to-[#0A0D0C] text-[#F8F6F0] overflow-x-clip"
    >
      <div
        className="absolute inset-0 pointer-events-none bg-editorial-grain opacity-65"
        aria-hidden="true"
      />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          {/* Left Editorial Column */}
          <Reveal className="lg:col-span-5 space-y-6">
            <p className="eyebrow-mono text-[#E9A34A]">
              02. Travel Assist · Find Your Way
            </p>
            <h2 className="font-editorial text-4xl sm:text-5xl font-semibold text-white leading-[1.08] text-balance">
              Reach every place with{' '}
              <span className="text-[#E9A34A] italic font-normal">confidence</span>.
            </h2>
            <p className="text-base sm:text-[17px] text-[#F8F6F0]/80 leading-relaxed max-w-[60ch]">
              Stepping out of an Indian railway junction, bus stand, or airport terminal should never begin with guesswork. Compare Bike, Auto, and Cab routes with live OSRM road distances across all 28 States &amp; 8 Union Territories.
            </p>

            <ul className="space-y-3 text-sm sm:text-[15px] text-[#F8F6F0]/85 pt-1">
              <li className="flex items-start gap-3">
                <Train className="w-5 h-5 text-[#E9A34A] shrink-0 mt-0.5" aria-hidden="true" />
                <span>Category-strict search for railway stations, ISBTs, airports, temples &amp; hotels</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#8CC9E8] shrink-0 mt-0.5" aria-hidden="true" />
                <span>Itemized fare comparison paired with nearby sightseeing &amp; cafe discovery</span>
              </li>
            </ul>

            <div className="pt-3">
              <Link
                to="/travel-assist"
                className="group inline-flex items-center gap-2.5 px-7 py-3.5 min-h-[50px] rounded-full bg-[#E9A34A] text-[#142322] font-bold text-base hover:bg-[#DF9538] transition-colors shadow-lg whitespace-nowrap"
              >
                <span>Explore Travel Assist</span>
                <ArrowRight
                  className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </Reveal>

          {/* Right Layered Transit + Vehicle Cards Composition */}
          <div className="lg:col-span-7 relative">
            <div className="relative rounded-3xl overflow-hidden border border-white/15 aspect-[16/10] bg-[#161B1A] shadow-2xl">
              <motion.div
                style={{ scale: prefersReducedMotion ? 1 : mainPhotoScale }}
                className="w-full h-full will-change-transform"
              >
                <SafeImage
                  src={IMAGES.indianRailwayArrival}
                  alt="Grand Indian heritage railway station plaza at twilight with waiting auto-rickshaws and cabs"
                  darkSkeleton
                  className="w-full h-full object-cover"
                />
              </motion.div>
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/18 to-transparent"
                aria-hidden="true"
              />
              <div className="absolute bottom-5 left-5 sm:bottom-6 sm:left-6">
                <p className="text-sm font-medium text-[#8CC9E8]">All-India Arrival Intelligence</p>
                <p className="font-editorial text-xl sm:text-2xl font-semibold text-white">
                  Railway Stations · Airports · Bus Terminals
                </p>
              </div>
            </div>

            {/* Cascading Layered Vehicle Category Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4 lg:-mt-12 lg:px-6 relative z-10">
              {VEHICLE_SHOWCASE.map((veh, idx) => (
                <motion.div
                  key={veh.id}
                  style={{ y: prefersReducedMotion ? 0 : cardOffsets[idx] }}
                  className="will-change-transform"
                >
                  <motion.div
                    whileHover={prefersReducedMotion ? undefined : { y: -8, scale: 1.03 }}
                    transition={{ duration: 0.32, ease: EASE_PRIMARY }}
                    className="group rounded-2xl bg-[#151A19] border border-white/15 hover:border-[#E9A34A]/50 overflow-hidden shadow-[0_18px_40px_rgba(0,0,0,0.65)] transition-colors"
                  >
                    <div className="aspect-[16/10] bg-white/95 overflow-hidden">
                      <SafeImage
                        src={veh.vehicleImg}
                        alt={`${veh.label} — ${veh.note}`}
                        className="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                      />
                    </div>
                    <div className="p-3.5 sm:p-4">
                      <p className="font-editorial text-base font-semibold text-white truncate">
                        {veh.label}
                      </p>
                      <p className="text-sm text-[#F8F6F0]/75 truncate mt-0.5">
                        {veh.note}
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
 * SECTION 3 — BEYOND THE USUAL DESTINATIONS ("Find places worth remembering.")
 * Overlapping multi-category gallery with scroll-driven drift & switcher
 * -------------------------------------------------------------------------- */

const BEYOND_CATEGORIES = [
  {
    id: 'temples',
    title: 'Temples & Heritage',
    subtitle: 'Timings, entry realities, and ancient stone courtyards',
    cards: [
      {
        name: 'Shri Jagannath Temple',
        place: 'Puri, Odisha',
        image: IMAGES.jagannathTemple,
        description:
          'Iconic Kalinga architecture along Grand Road with morning darshan windows and nearby coastal walkways.',
      },
      {
        name: 'Hawa Mahal Sandstone Winds',
        place: 'Jaipur, Rajasthan',
        image: IMAGES.hawaMahal,
        description:
          '953 ventilated sandstone jharokhas engineered to channel cool desert breezes above the old bazaar.',
      },
    ],
    destLink: '/explore?dest=jaipur',
    destId: 'jaipur',
  },
  {
    id: 'nature',
    title: 'Nature & Beaches',
    subtitle: 'Quiet shores, village backwater ferries, and cedar valleys',
    cards: [
      {
        name: 'Golden Coast Sunset',
        place: 'Puri & Konkan Belt',
        image: IMAGES.indianBeach,
        description:
          'Long open shorelines ideal for dawn walks and quiet twilight sea breezes away from noisy piers.',
      },
      {
        name: 'Kuttanad Palm Canals',
        place: 'Alleppey, Kerala',
        image: IMAGES.alleppeyBackwaters,
        description:
          'Serene emerald village waterways navigable via public SWTD ferries and small wooden shikaras.',
      },
    ],
    destLink: '/explore?dest=alleppey',
    destId: 'alleppey',
  },
  {
    id: 'cafes',
    title: 'Cafe Corner',
    subtitle: 'Solo-friendly decks, quiet work tables, and honest pricing',
    cards: [
      {
        name: 'Manalsu Pine Deck Cafe',
        place: 'Old Manali, Himachal',
        image: IMAGES.cafeMountain,
        description:
          'Weathered pine-wood balcony overlooking cedar slopes with warm sourdough and power sockets inside.',
      },
      {
        name: 'Chaupar Terrace Rooftop',
        place: 'Old City, Jaipur',
        image: IMAGES.cafeRooftop,
        description:
          'Open-sky sandstone terrace facing illuminated Hawa Mahal domes without loud club music.',
      },
    ],
    destLink: '/explore?dest=udaipur',
    destId: 'udaipur',
  },
  {
    id: 'adventure',
    title: 'Adventure & Experiences',
    subtitle: 'Licensed river guides, alpine ridge hikes, and safety notes',
    cards: [
      {
        name: 'Shivpuri Ganga Rapids',
        place: 'Rishikesh, Uttarakhand',
        image: IMAGES.adventureRafting,
        description:
          'Grade II–III Himalayan white-water rafting run led by Uttarakhand Tourism certified river guides.',
      },
      {
        name: 'Hampta & Bhrigu Ridges',
        place: 'Manali Sector, Himachal',
        image: IMAGES.adventureTrekking,
        description:
          'Guided alpine day hikes across cedar treelines with acclimatization notes and seasonal dates.',
      },
    ],
    destLink: '/explore?dest=rishikesh',
    destId: 'rishikesh',
  },
];

export function BeyondUsualGallerySection() {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const { openDetail } = useDetailOverlay();
  const ref = useRef<HTMLElement | null>(null);
  const [selectedCatIdx, setSelectedCatIdx] = useState(0);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const smoothProgress = useSpring(scrollYProgress, SCROLL_SPRING);
  const activeProgress = prefersReducedMotion ? scrollYProgress : smoothProgress;

  const colAY = useTransform(activeProgress, [0, 1], [36, -36]);
  const colBY = useTransform(activeProgress, [0, 1], [-24, 34]);

  const activeCategory = BEYOND_CATEGORIES[selectedCatIdx];

  const handleOpenGalleryCard = (
    card: (typeof activeCategory.cards)[number],
    idx: number,
    el: HTMLElement
  ) => {
    openDetail(
      {
        kind: 'place',
        id: `beyond-${activeCategory.id}-${idx}`,
        layoutId: `beyond-${activeCategory.id}-${idx}`,
        title: card.name,
        category: activeCategory.title,
        location: card.place,
        image: card.image,
        description: card.description,
        highlights: [activeCategory.title, 'Ground-Checked Tips', 'Direct Route Support'],
        destinationId: activeCategory.destId,
        detailRoute: activeCategory.destLink,
      },
      el
    );
  };

  return (
    <section
      ref={ref}
      className="relative py-24 sm:py-32 bg-gradient-to-b from-[#0A0D0C] via-[#0B0E0D] to-[#0E1312] text-[#F8F6F0] overflow-x-clip"
    >
      <div
        className="absolute inset-0 pointer-events-none bg-editorial-grain opacity-65"
        aria-hidden="true"
      />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        <Reveal className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          <div className="lg:col-span-7 space-y-4">
            <p className="eyebrow-mono text-[#8CC9E8]">
              03. Explore &amp; Plan
            </p>
            <h2 className="font-editorial text-4xl sm:text-5xl lg:text-[56px] font-semibold text-white leading-[1.06] text-balance">
              Find places worth{' '}
              <span className="text-[#E9A34A] italic font-normal">remembering</span>.
            </h2>
          </div>

          <div className="lg:col-span-5 flex flex-col items-start lg:items-end justify-end gap-5">
            <p className="text-base text-[#F8F6F0]/78 leading-relaxed lg:text-right max-w-md">
              Discover landmarks alongside Cafe Corner solo-friendly perches and verified outdoor adventures—ordered into one multi-stop budget route.
            </p>
            <Link
              to="/explore"
              className="group inline-flex items-center gap-2.5 px-7 py-3.5 min-h-[50px] rounded-full bg-white text-[#142322] font-bold text-base hover:bg-[#E9A34A] transition-colors whitespace-nowrap"
            >
              <span>Explore Destinations</span>
              <ArrowRight
                className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </div>
        </Reveal>

        {/* Interactive Category Switcher + Layered 2-Column Scroll-Shifting Collage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Category Selector Rail */}
          <div className="lg:col-span-5 space-y-2.5">
            {BEYOND_CATEGORIES.map((cat, idx) => {
              const active = idx === selectedCatIdx;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCatIdx(idx)}
                  onMouseEnter={() => setSelectedCatIdx(idx)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                    active
                      ? 'bg-[#121918] border-[#E9A34A]/65 shadow-lg'
                      : 'bg-transparent border-white/10 hover:border-white/25 hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3
                      className={`font-editorial text-2xl font-semibold transition-colors ${
                        active ? 'text-[#E9A34A]' : 'text-white'
                      }`}
                    >
                      {cat.title}
                    </h3>
                    <Compass
                      className={`w-4 h-4 shrink-0 transition-transform duration-300 ${
                        active ? 'text-[#E9A34A] rotate-45' : 'text-white/35'
                      }`}
                      aria-hidden="true"
                    />
                  </div>
                  <p className="text-sm sm:text-[15px] text-[#F8F6F0]/75 mt-1.5 leading-relaxed">
                    {cat.subtitle}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Overlapping Gallery Collage */}
          <div className="lg:col-span-7 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory.id}
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
                transition={{ duration: 0.4, ease: EASE_PRIMARY }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center"
              >
                <motion.div
                  style={{ y: prefersReducedMotion ? 0 : colAY }}
                  className="will-change-transform"
                >
                  <motion.button
                    type="button"
                    onClick={(e) =>
                      handleOpenGalleryCard(activeCategory.cards[0], 0, e.currentTarget)
                    }
                    className="group block w-full text-left relative aspect-[3/4] rounded-3xl overflow-hidden border border-white/20 shadow-[0_24px_60px_rgba(0,0,0,0.7)] sm:-rotate-2 hover:rotate-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer"
                  >
                    <SafeImage
                      src={activeCategory.cards[0].image}
                      alt={`${activeCategory.cards[0].name} — ${activeCategory.cards[0].place}`}
                      darkSkeleton
                      className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/20 to-transparent" />
                    <div className="absolute bottom-5 left-5 right-5">
                      <p className="text-sm font-medium text-[#E9A34A]">{activeCategory.title}</p>
                      <p className="font-editorial text-2xl font-semibold text-white mt-0.5">
                        {activeCategory.cards[0].name}
                      </p>
                      <p className="text-sm text-[#F8F6F0]/80 mt-0.5">
                        {activeCategory.cards[0].place}
                      </p>
                    </div>
                  </motion.button>
                </motion.div>

                <motion.div
                  style={{ y: prefersReducedMotion ? 0 : colBY }}
                  className="sm:mt-12 sm:-ml-6 relative z-10 will-change-transform"
                >
                  <motion.button
                    type="button"
                    onClick={(e) =>
                      handleOpenGalleryCard(activeCategory.cards[1], 1, e.currentTarget)
                    }
                    className="group block w-full text-left relative aspect-[3/4] rounded-3xl overflow-hidden border border-[#E9A34A]/45 shadow-[0_28px_70px_rgba(0,0,0,0.85)] sm:rotate-2 hover:rotate-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer"
                  >
                    <SafeImage
                      src={activeCategory.cards[1].image}
                      alt={`${activeCategory.cards[1].name} — ${activeCategory.cards[1].place}`}
                      darkSkeleton
                      className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/20 to-transparent" />
                    <div className="absolute bottom-5 left-5 right-5">
                      <p className="text-sm font-medium text-[#8CC9E8]">{activeCategory.title}</p>
                      <p className="font-editorial text-2xl font-semibold text-white mt-0.5">
                        {activeCategory.cards[1].name}
                      </p>
                      <p className="text-sm text-[#F8F6F0]/80 mt-0.5">
                        {activeCategory.cards[1].place}
                      </p>
                    </div>
                  </motion.button>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
 * SECTION 4 — STAY WITH CONFIDENCE ("Know your stay before you arrive.")
 * Opposing scroll-parallax Stay Reality diptych
 * -------------------------------------------------------------------------- */

export function StayConfidenceSection() {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const ref = useRef<HTMLElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const smoothProgress = useSpring(scrollYProgress, SCROLL_SPRING);
  const activeProgress = prefersReducedMotion ? scrollYProgress : smoothProgress;

  const mainStayY = useTransform(activeProgress, [0, 1], [32, -32]);
  const insetStayY = useTransform(activeProgress, [0, 1], [-24, 42]);

  return (
    <section
      ref={ref}
      className="relative py-24 sm:py-32 bg-gradient-to-b from-[#0E1312] via-[#0F1514] to-[#090B0A] text-[#F8F6F0] overflow-x-clip"
    >
      <div
        className="absolute inset-0 pointer-events-none bg-editorial-grain opacity-65"
        aria-hidden="true"
      />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Layered Stay Reality Composition */}
          <div className="lg:col-span-7 relative pb-10 sm:pb-14">
            <motion.div
              style={{ y: prefersReducedMotion ? 0 : mainStayY }}
              className="rounded-3xl overflow-hidden border border-white/15 aspect-[16/10] shadow-2xl will-change-transform"
            >
              <SafeImage
                src={IMAGES.heritageHaveli}
                alt="Sunlit Indian heritage courtyard guesthouse verified for lane access"
                darkSkeleton
                className="w-full h-full object-cover"
              />
            </motion.div>

            <motion.div
              style={{ y: prefersReducedMotion ? 0 : insetStayY }}
              className="mt-4 sm:mt-0 sm:absolute sm:-bottom-2 sm:right-6 w-full sm:w-[54%] rounded-2xl overflow-hidden border border-[#E9A34A]/50 bg-[#121716] shadow-[0_24px_60px_rgba(0,0,0,0.85)] will-change-transform"
            >
              <div className="aspect-[16/10] overflow-hidden">
                <SafeImage
                  src={IMAGES.homestayRoom}
                  alt="Clean sunlit Indian homestay room checked for fiber Wi-Fi and ventilation"
                  darkSkeleton
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-[#E9A34A] font-medium">Ground Audit Notes</p>
                  <p className="font-editorial text-base font-semibold text-white">
                    Parking · Fiber Wi-Fi · Cleanliness
                  </p>
                </div>
                <ShieldCheck className="w-5 h-5 text-[#E9A34A] shrink-0" aria-hidden="true" />
              </div>
            </motion.div>
          </div>

          {/* Right Editorial Copy */}
          <Reveal className="lg:col-span-5 space-y-6">
            <p className="eyebrow-mono text-[#8CC9E8]">
              04. Stay Reality
            </p>
            <h2 className="font-editorial text-4xl sm:text-5xl font-semibold text-white leading-[1.08] text-balance">
              Know your stay before you{' '}
              <span className="text-[#E9A34A] italic font-normal">arrive</span>.
            </h2>
            <p className="text-base sm:text-[17px] text-[#F8F6F0]/80 leading-relaxed max-w-[60ch]">
              Booking thumbnails never tell you if four-wheelers are restricted inside old-city lanes, whether fiber Wi-Fi reaches your desk, or if winter room heaters cost extra. Inspect dated, practical facts upfront.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-white/10 text-sm">
              <div>
                <p className="font-semibold text-white text-base">Lane &amp; Parking Reality</p>
                <p className="text-sm text-[#F8F6F0]/72 mt-1 leading-relaxed">
                  Exact walk distances from cab drop-offs and gated parking slots.
                </p>
              </div>
              <div>
                <p className="font-semibold text-white text-base">Zero Fake Star Scores</p>
                <p className="text-sm text-[#F8F6F0]/72 mt-1 leading-relaxed">
                  Housekeeping standards, Airtel/Jio 5G reception &amp; hidden utility fees.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/stay-reality"
                className="group inline-flex items-center gap-2.5 px-7 py-3.5 min-h-[50px] rounded-full bg-[#E9A34A] text-[#142322] font-bold text-base hover:bg-[#DF9538] transition-colors shadow-lg whitespace-nowrap"
              >
                <span>Discover Stay Reality</span>
                <ArrowRight
                  className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
 * SECTION 5 — FINAL CTA ("Your next journey starts here.")
 * Immersive highway mountain backdrop + drifting peripheral cards
 * -------------------------------------------------------------------------- */

export function FinalCtaSection({ ctaTo }: { ctaTo: string }) {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const ref = useRef<HTMLElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end end'],
  });

  const smoothProgress = useSpring(scrollYProgress, SCROLL_SPRING);
  const activeProgress = prefersReducedMotion ? scrollYProgress : smoothProgress;

  const bgScale = useTransform(activeProgress, [0, 1], [1.1, 1.0]);
  const leftCardY = useTransform(activeProgress, [0, 1], [48, -16]);
  const rightCardY = useTransform(activeProgress, [0, 1], [64, -24]);

  return (
    <section
      ref={ref}
      className="relative min-h-[76vh] flex items-center justify-center overflow-hidden bg-[#090B0A] text-white py-24"
    >
      <motion.div
        style={{ scale: prefersReducedMotion ? 1 : bgScale }}
        className="absolute inset-0 will-change-transform"
      >
        <SafeImage
          src={IMAGES.spitiRoad}
          alt="High-altitude Himalayan mountain road winding toward sunlit peaks"
          darkSkeleton
          className="w-full h-full object-cover opacity-50"
        />
      </motion.div>

      <div
        className="absolute inset-0 bg-gradient-to-b from-[#090B0A]/90 via-[#0A0C0B]/60 to-[#070908]/95 pointer-events-none"
        aria-hidden="true"
      />

      {/* Peripheral Floating Vignette Cards on Desktop */}
      <motion.div
        style={{ y: prefersReducedMotion ? 0 : leftCardY }}
        className="hidden lg:block absolute left-10 bottom-16 w-[180px] aspect-[3/4] rounded-2xl overflow-hidden border border-white/20 -rotate-6 shadow-2xl opacity-80 pointer-events-none will-change-transform"
        aria-hidden="true"
      >
        <SafeImage
          src={IMAGES.jagannathTemple}
          alt=""
          darkSkeleton
          className="w-full h-full object-cover"
        />
      </motion.div>

      <motion.div
        style={{ y: prefersReducedMotion ? 0 : rightCardY }}
        className="hidden lg:block absolute right-10 top-16 w-[180px] aspect-[3/4] rounded-2xl overflow-hidden border border-white/20 rotate-6 shadow-2xl opacity-80 pointer-events-none will-change-transform"
        aria-hidden="true"
      >
        <SafeImage
          src={IMAGES.indianBeach}
          alt=""
          darkSkeleton
          className="w-full h-full object-cover"
        />
      </motion.div>

      <Reveal className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-7">
        <p className="eyebrow-mono text-[#8CC9E8]">
          Yatra Saathi
        </p>
        <h2 className="font-editorial text-4xl sm:text-6xl lg:text-[68px] font-semibold text-white leading-[1.05] text-balance">
          Your next journey starts{' '}
          <span className="text-[#E9A34A] italic font-normal">here</span>.
        </h2>
        <p className="text-base sm:text-xl text-[#F8F6F0]/82 max-w-xl mx-auto leading-relaxed">
          Sign in or create your free account to compare arrival rides, sequence local stops, and save ground-checked stays offline.
        </p>
        <div className="pt-2">
          <Link
            to={ctaTo}
            className="group inline-flex items-center justify-center gap-2.5 px-9 py-4 min-h-[56px] rounded-full bg-[#E9A34A] text-[#142322] font-bold text-base sm:text-lg hover:bg-[#DF9538] active:scale-[0.98] transition-all shadow-[0_16px_45px_rgba(233,163,74,0.32)] whitespace-nowrap"
          >
            <span>Get Started</span>
            <ArrowRight
              className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
