import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from 'motion/react';
import {
  ArrowRight,
  Bookmark,
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  ExternalLink,
  Loader2,
  MapPin,
  Navigation,
  Plus,
  ShieldCheck,
  Sparkles,
  Star,
  Ticket,
  Users,
  Wifi,
  X,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { DESTINATIONS, IMAGES } from '../data/destinations';
import type { DestinationProfile, StayProperty } from '../types/travel';
import { EASE_PRIMARY } from '../motion/tokens';
import { setSmoothScrollPaused } from './SmoothScrollManager';

export interface RideQuote {
  id: string;
  category: 'bike' | 'auto' | 'cab';
  categoryLabel: string;
  provider: 'Rapido' | 'Uber' | 'Ola' | 'Local Prepaid Stand';
  providerTitle: string;
  vehicleType: string;
  maxPassengers: number;
  luggageCapacity: string;
  calculatedFareInr: number | null;
  fareMinInr: number | null;
  fareMaxInr: number | null;
  estimatedMinutes: number | null;
  fareSourceNote: string;
  fareBreakdown: {
    baseIncludedKm: number;
    baseFareInr: number;
    billableExtraKm: number;
    perKmRateInr: number;
    distanceChargeInr: number;
    bookingFeeInr: number;
    taxesAndFeesInr: number;
  } | null;
  bookingUrl: string | null;
  bookingLabel: string;
}

export interface CompareResult {
  route: {
    originLabel: string;
    destLabel: string;
    distanceKm: number;
    durationMin: number;
  };
}

export interface PlaceOverlayPayload {
  kind: 'place';
  id: string;
  layoutId?: string;
  title: string;
  category: string;
  location: string;
  image: string | null;
  galleryImages?: string[];
  description: string;
  fullDescription?: string;
  bestTime?: string;
  openingHours?: string;
  entryFee?: string;
  priceRange?: string;
  rating?: number;
  userRatingCount?: number;
  distanceFromPickupKm?: number;
  pickupLabel?: string;
  highlights?: string[];
  nearbyPlaces?: Array<{ name: string; distance?: string }>;
  destinationId?: string;
  lat?: number;
  lng?: number;
  mapsUrl?: string;
  detailRoute?: string;
  itemTypeForSave?: 'attraction' | 'cafe' | 'adventure';
  isInItinerary?: boolean;
  onAddToItinerary?: () => void;
  onCompareRide?: () => void;
}

export interface StayOverlayPayload {
  kind: 'stay';
  id: string;
  layoutId?: string;
  stay: StayProperty;
  destName: string;
  destState: string;
}

export interface RideOverlayPayload {
  kind: 'ride';
  id: string;
  layoutId?: string;
  quote: RideQuote;
  route: CompareResult['route'];
  vehicleImage: string;
}

export interface DestinationOverlayPayload {
  kind: 'destination';
  id: string;
  layoutId?: string;
  destination: DestinationProfile;
}

export type OverlayPayload =
  | PlaceOverlayPayload
  | StayOverlayPayload
  | RideOverlayPayload
  | DestinationOverlayPayload;

interface DetailOverlayContextValue {
  activeItem: OverlayPayload | null;
  openDetail: (item: OverlayPayload, triggerEl?: HTMLElement | null) => void;
  closeDetail: () => void;
}

const DetailOverlayContext = createContext<DetailOverlayContextValue | undefined>(undefined);

export function DetailOverlayProvider({ children }: { children: ReactNode }) {
  const [activeItem, setActiveItem] = useState<OverlayPayload | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const openDetail = useCallback((item: OverlayPayload, triggerEl?: HTMLElement | null) => {
    triggerRef.current = triggerEl || (document.activeElement as HTMLElement | null);
    setActiveItem(item);
  }, []);

  const closeDetail = useCallback(() => {
    setActiveItem(null);
    const el = triggerRef.current;
    if (el && typeof el.focus === 'function') {
      requestAnimationFrame(() => el.focus());
    }
  }, []);

  return (
    <DetailOverlayContext.Provider value={{ activeItem, openDetail, closeDetail }}>
      {children}
      <DetailOverlayModal item={activeItem} onClose={closeDetail} />
    </DetailOverlayContext.Provider>
  );
}

export function useDetailOverlay(): DetailOverlayContextValue {
  const ctx = useContext(DetailOverlayContext);
  if (!ctx) {
    throw new Error('useDetailOverlay must be used inside DetailOverlayProvider');
  }
  return ctx;
}

function getGalleryForPayload(item: OverlayPayload): string[] {
  const fallbackPool = [
    IMAGES.udaipurHero,
    IMAGES.hawaMahal,
    IMAGES.rishikeshGanga,
    IMAGES.heritageHaveli,
    IMAGES.indianBeach,
  ];

  if (item.kind === 'place') {
    const dest = item.destinationId
      ? DESTINATIONS.find((d) => d.id === item.destinationId)
      : undefined;
    const candidates = [
      item.image,
      ...(item.galleryImages || []),
      dest?.heroImage,
      dest?.attractions[0]?.image,
      dest?.cafes[0]?.image,
    ].filter((u): u is string => Boolean(u));
    const unique = Array.from(new Set(candidates));
    return unique.length > 0 ? unique : fallbackPool.slice(0, 3);
  }

  if (item.kind === 'stay') {
    const dest = DESTINATIONS.find((d) => d.id === item.stay.destinationId);
    const candidates = [...item.stay.images, dest?.heroImage, IMAGES.homestayRoom].filter(
      (u): u is string => Boolean(u)
    );
    return Array.from(new Set(candidates));
  }

  if (item.kind === 'ride') {
    return [item.vehicleImage, IMAGES.indianRailwayArrival];
  }

  const dest = item.destination;
  const candidates = [
    dest.heroImage,
    dest.attractions[0]?.image,
    dest.cafes[0]?.image,
    dest.stays[0]?.images[0],
  ].filter((u): u is string => Boolean(u));
  return Array.from(new Set(candidates));
}

function DetailOverlayModal({
  item,
  onClose,
}: {
  item: OverlayPayload | null;
  onClose: () => void;
}) {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const navigate = useNavigate();
  const { isItemSaved, toggleSaveItem, user } = useApp();

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  const [galleryIdx, setGalleryIdx] = useState(0);
  const [panelSide, setPanelSide] = useState<'right' | 'left'>('right');
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  const [saving, setSaving] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [addedLocal, setAddedLocal] = useState(false);

  const gallery = useMemo(() => (item ? getGalleryForPayload(item) : []), [item]);
  const activeBgImage = gallery[galleryIdx] || gallery[0] || IMAGES.udaipurHero;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 768px)');
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    setGalleryIdx(0);
    setSaveToast(null);
    setAddedLocal(false);
  }, [item?.id, item?.kind]);

  // Pause Lenis background scroll + lock body + focus trap + Esc key
  useEffect(() => {
    if (!item) {
      setSmoothScrollPaused(false);
      document.body.style.overflow = '';
      return;
    }

    setSmoothScrollPaused(true);
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 60);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first || !dialogRef.current.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else if (document.activeElement === last || !dialogRef.current.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      setSmoothScrollPaused(false);
      document.body.style.overflow = '';
    };
  }, [item, onClose]);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!isDesktop && (info.offset.y > 95 || info.velocity.y > 460)) {
      onClose();
    }
  };

  const isSaved = useMemo(() => {
    if (!item) return false;
    if (item.kind === 'stay') return isItemSaved(item.stay.id, 'stay');
    if (item.kind === 'place') {
      return isItemSaved(item.id, item.itemTypeForSave || 'attraction');
    }
    return false;
  }, [item, isItemSaved]);

  const handleToggleSave = async () => {
    if (!item || (item.kind !== 'place' && item.kind !== 'stay')) return;
    setSaving(true);
    setSaveToast(null);
    try {
      if (!user) {
        setSaveToast('Sign in to sync saved items across sessions.');
        return;
      }
      if (item.kind === 'stay') {
        const next = await toggleSaveItem({
          id: item.stay.id,
          type: 'stay',
          destinationId: item.stay.destinationId,
          title: item.stay.name,
          subtitle: item.stay.location,
          image: item.stay.images[0],
          cachedSummary: `${item.stay.cleanlinessInfo} | Parking: ${item.stay.parkingInfo}`,
        });
        setSaveToast(next ? 'Saved stay to your offline profile.' : 'Removed from saved stays.');
      } else {
        const next = await toggleSaveItem({
          id: item.id,
          type: item.itemTypeForSave || 'attraction',
          destinationId: item.destinationId || 'india',
          title: item.title,
          subtitle: item.location,
          image: item.image || activeBgImage,
          cachedSummary: item.description,
        });
        setSaveToast(next ? 'Saved to your offline profile.' : 'Removed from saved places.');
      }
    } catch (err) {
      setSaveToast(err instanceof Error ? err.message : 'Unable to update saved items.');
    } finally {
      setSaving(false);
    }
  };

  const blockVariants = {
    hidden: prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 },
    visible: (idx: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0.16 : 0.42,
        delay: prefersReducedMotion ? 0 : 0.08 + idx * 0.06,
        ease: EASE_PRIMARY,
      },
    }),
  };

  const isRightDocked = panelSide === 'right';
  const slideOffset = isRightDocked ? 40 : -40;

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          key={`overlay-backdrop-${item.kind}-${item.id}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0.15 : 0.35, ease: EASE_PRIMARY }}
          className="fixed inset-0 z-50 overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="detail-overlay-title"
          ref={dialogRef}
        >
          {/* Full-Viewport Sharp Background Photo with Ken-Burns Zoom (Click backdrop closes overlay) */}
          <div
            className="fixed inset-0 bg-[#070B0A] cursor-pointer"
            onClick={onClose}
            aria-label="Close detail view"
          >
            <AnimatePresence mode="sync" initial={false}>
              <motion.img
                key={activeBgImage}
                src={activeBgImage}
                alt={
                  item.kind === 'place'
                    ? item.title
                    : item.kind === 'stay'
                    ? item.stay.name
                    : item.kind === 'ride'
                    ? item.quote.vehicleType
                    : item.destination.name
                }
                referrerPolicy="no-referrer"
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 1.02 }}
                animate={
                  prefersReducedMotion
                    ? { opacity: 1 }
                    : {
                        opacity: 1,
                        scale: 1.07,
                        transition: {
                          opacity: { duration: 0.65, ease: EASE_PRIMARY },
                          scale: { duration: 18, ease: 'linear' },
                        },
                      }
                }
                exit={{ opacity: 0, transition: { duration: 0.4 } }}
                className="absolute inset-0 w-full h-full object-cover will-change-transform"
              />
            </AnimatePresence>

            {/* Subtle Edge Vignette & Bottom Gradient Scrim ONLY (keeps photo sharp & open) */}
            <div
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_45%,rgba(5,10,10,0.48)_100%)] pointer-events-none"
              aria-hidden="true"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/25 pointer-events-none"
              aria-hidden="true"
            />
          </div>

          {/* Desktop Bottom-Opposite Floating Glass Thumbnail Strip + Panel Side Flip Toggle */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: prefersReducedMotion ? 0.15 : 0.4, delay: 0.12, ease: EASE_PRIMARY }}
            onClick={(e) => e.stopPropagation()}
            className={`hidden md:flex fixed bottom-6 z-20 items-center gap-2.5 px-3 py-2.5 rounded-2xl backdrop-blur-[16px] bg-[rgba(10,20,20,0.58)] border border-white/16 shadow-[0_18px_45px_rgba(0,0,0,0.55)] ${
              isRightDocked ? 'left-6' : 'right-6'
            }`}
          >
            {gallery.length > 1 && (
              <div className="flex items-center gap-2">
                {gallery.map((imgUrl, idx) => {
                  const selected = idx === galleryIdx;
                  return (
                    <button
                      key={`${imgUrl}-${idx}`}
                      type="button"
                      onClick={() => setGalleryIdx(idx)}
                      aria-label={`View background photo ${idx + 1}`}
                      className={`relative w-16 h-11 rounded-xl overflow-hidden border-2 shrink-0 transition-all duration-200 cursor-pointer ${
                        selected
                          ? 'border-[#E9A34A] ring-2 ring-[#E9A34A]/40 scale-[1.04]'
                          : 'border-white/25 opacity-75 hover:opacity-100 hover:border-white/60'
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            )}

            {gallery.length > 1 && (
              <span className="w-px h-7 bg-white/16" aria-hidden="true" />
            )}

            <button
              type="button"
              onClick={() => setPanelSide((prev) => (prev === 'right' ? 'left' : 'right'))}
              aria-label={isRightDocked ? 'Move info panel to left side' : 'Move info panel to right side'}
              title={isRightDocked ? 'Move panel left' : 'Move panel right'}
              className="inline-flex items-center gap-1.5 px-3 h-10 rounded-xl bg-white/10 hover:bg-[#E9A34A] text-white hover:text-[#142322] border border-white/16 text-[13px] font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              {isRightDocked ? (
                <>
                  <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                  <span>Move panel</span>
                </>
              ) : (
                <>
                  <span>Move panel</span>
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </button>
          </motion.div>

          {/* Docked Frosted Glass Side Panel (Desktop >=768px) / Draggable 60vh Bottom Sheet (Mobile <768px) */}
          <motion.aside
            key={`glass-panel-${isDesktop ? panelSide : 'mobile'}`}
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : isDesktop
                ? { opacity: 0, x: slideOffset }
                : { opacity: 0, y: 48 }
            }
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : isDesktop
                ? { opacity: 0, x: slideOffset }
                : { opacity: 0, y: 48 }
            }
            transition={{ duration: prefersReducedMotion ? 0.16 : 0.5, ease: EASE_PRIMARY }}
            drag={!isDesktop && !prefersReducedMotion ? 'y' : false}
            dragConstraints={{ top: 0, bottom: 260 }}
            dragElastic={{ top: 0, bottom: 0.45 }}
            onDragEnd={handleDragEnd}
            onClick={(e) => e.stopPropagation()}
            data-lenis-prevent
            className={`fixed z-20 flex flex-col text-[#F8F6F0] backdrop-blur-[16px] bg-[rgba(10,20,20,0.55)] border border-white/16 shadow-[0_28px_80px_rgba(0,0,0,0.65)] ${
              isDesktop
                ? `top-6 bottom-6 max-h-[calc(100vh-48px)] w-[40vw] min-w-[380px] max-w-[540px] rounded-[24px] ${
                    isRightDocked ? 'right-6' : 'left-6'
                  }`
                : 'inset-x-0 bottom-0 h-[62vh] max-h-[62vh] rounded-t-[24px] rounded-b-none'
            }`}
          >
            {/* Mobile Drag Handle */}
            <div className="md:hidden flex justify-center pt-3 pb-1 shrink-0" aria-hidden="true">
              <span className="w-12 h-1.5 rounded-full bg-white/35" />
            </div>

            {/* Panel Header Bar (Category / Location + Close Button) */}
            <div className="shrink-0 flex items-center justify-between gap-4 px-5 sm:px-7 py-4 border-b border-white/12">
              <p className="text-[13px] font-mono uppercase tracking-[0.08em] text-[#8CC9E8] truncate">
                {item.kind === 'place' && `${item.category} · ${item.location}`}
                {item.kind === 'stay' && `Stay Reality · ${item.destName}, ${item.destState}`}
                {item.kind === 'ride' && `Fare & Route · ${item.quote.providerTitle}`}
                {item.kind === 'destination' && `Destination Brief · ${item.destination.state}`}
              </p>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={onClose}
                aria-label="Close detail view"
                className="w-10 h-10 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center hover:bg-[#E9A34A] hover:text-[#142322] hover:border-[#E9A34A] transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E9A34A]"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Internally Scrollable Panel Body (No duplicate embedded image!) */}
            <div className="flex-1 overflow-y-auto overlay-panel-scroll px-5 sm:px-7 py-6 space-y-6">
              {/* Mobile-Only Photo Switcher Strip inside Sheet */}
              {!isDesktop && gallery.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {gallery.map((imgUrl, idx) => {
                    const selected = idx === galleryIdx;
                    return (
                      <button
                        key={`mob-${imgUrl}-${idx}`}
                        type="button"
                        onClick={() => setGalleryIdx(idx)}
                        aria-label={`View photo ${idx + 1}`}
                        className={`relative w-16 h-11 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                          selected
                            ? 'border-[#E9A34A] ring-2 ring-[#E9A34A]/35'
                            : 'border-white/20 opacity-75'
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Block 1: Category Chip, Title & Location */}
              <motion.div
                custom={0}
                initial="hidden"
                animate="visible"
                variants={blockVariants}
                className="space-y-3"
              >
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E9A34A]/20 border border-[#E9A34A]/45 text-[#E9A34A] text-[13px] font-semibold">
                    <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>
                      {item.kind === 'place' && item.category}
                      {item.kind === 'stay' && item.stay.propertyType}
                      {item.kind === 'ride' && `${item.quote.categoryLabel} · ${item.quote.vehicleType}`}
                      {item.kind === 'destination' && item.destination.bestSeason}
                    </span>
                  </span>

                  {item.kind === 'place' && typeof item.rating === 'number' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[13px] font-mono font-semibold text-white">
                      <Star className="w-3.5 h-3.5 fill-[#E9A34A] text-[#E9A34A]" aria-hidden="true" />
                      <span>
                        {item.rating.toFixed(1)}
                        {item.userRatingCount ? ` (${item.userRatingCount})` : ''}
                      </span>
                    </span>
                  )}

                  {item.kind === 'stay' && item.stay.pricePerNightInr && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[13px] font-mono font-semibold text-white">
                      ₹{item.stay.pricePerNightInr}/night
                    </span>
                  )}

                  {item.kind === 'ride' &&
                    (item.quote.calculatedFareInr ?? item.quote.fareMinInr) !== null && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#E9A34A] text-[#142322] text-[13px] font-mono font-bold">
                        ₹{item.quote.calculatedFareInr ?? item.quote.fareMinInr}
                      </span>
                    )}
                </div>

                <h2
                  id="detail-overlay-title"
                  className="font-editorial text-[32px] sm:text-[38px] font-semibold text-white leading-[1.08] tracking-tight"
                >
                  {item.kind === 'place' && item.title}
                  {item.kind === 'stay' && item.stay.name}
                  {item.kind === 'ride' && `${item.quote.providerTitle} — ${item.quote.vehicleType}`}
                  {item.kind === 'destination' && `${item.destination.name}, ${item.destination.state}`}
                </h2>

                <p className="text-[15px] sm:text-base text-[#8CC9E8] flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#E9A34A] shrink-0" aria-hidden="true" />
                  <span>
                    {item.kind === 'place' && item.location}
                    {item.kind === 'stay' && item.stay.location}
                    {item.kind === 'ride' && `${item.route.originLabel} → ${item.route.destLabel}`}
                    {item.kind === 'destination' && item.destination.tagline}
                  </span>
                </p>
              </motion.div>

              {/* Block 2: Description */}
              <motion.p
                custom={1}
                initial="hidden"
                animate="visible"
                variants={blockVariants}
                className="text-base sm:text-[17px] text-[#F8F6F0]/92 leading-relaxed"
              >
                {item.kind === 'place' && (item.fullDescription || item.description)}
                {item.kind === 'stay' && item.stay.cleanlinessInfo}
                {item.kind === 'ride' && item.quote.fareSourceNote}
                {item.kind === 'destination' && item.destination.groundIntelligence}
              </motion.p>

              {/* Block 3: Practical Facts Tiles */}
              <motion.div
                custom={2}
                initial="hidden"
                animate="visible"
                variants={blockVariants}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                {item.kind === 'place' && (
                  <>
                    {item.bestTime && (
                      <div className="rounded-xl bg-white/8 border border-white/14 p-3.5 flex items-start gap-2.5">
                        <Clock className="w-4 h-4 text-[#E9A34A] shrink-0 mt-0.5" aria-hidden="true" />
                        <div>
                          <p className="text-[13px] font-mono uppercase tracking-[0.06em] text-[#8CC9E8]">
                            Best Time
                          </p>
                          <p className="text-sm font-medium text-white mt-0.5">{item.bestTime}</p>
                        </div>
                      </div>
                    )}
                    {(item.openingHours || item.entryFee || item.priceRange) && (
                      <div className="rounded-xl bg-white/8 border border-white/14 p-3.5 flex items-start gap-2.5">
                        <Ticket className="w-4 h-4 text-[#E9A34A] shrink-0 mt-0.5" aria-hidden="true" />
                        <div>
                          <p className="text-[13px] font-mono uppercase tracking-[0.06em] text-[#8CC9E8]">
                            {item.entryFee ? 'Entry Fee' : item.priceRange ? 'Indicative Tariff' : 'Hours'}
                          </p>
                          <p className="text-sm font-medium text-white mt-0.5">
                            {item.entryFee || item.priceRange || item.openingHours}
                          </p>
                        </div>
                      </div>
                    )}
                    {typeof item.distanceFromPickupKm === 'number' && (
                      <div className="sm:col-span-2 rounded-xl bg-white/8 border border-white/14 p-3.5 flex items-start gap-2.5">
                        <Navigation className="w-4 h-4 text-[#8CC9E8] shrink-0 mt-0.5" aria-hidden="true" />
                        <div>
                          <p className="text-[13px] font-mono uppercase tracking-[0.06em] text-[#8CC9E8]">
                            Distance
                          </p>
                          <p className="text-sm font-medium text-white mt-0.5">
                            {item.distanceFromPickupKm} km{item.pickupLabel ? ` from ${item.pickupLabel}` : ''}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {item.kind === 'stay' && (
                  <>
                    <div className="rounded-xl bg-white/8 border border-white/14 p-3.5 flex items-start gap-2.5">
                      <Car className="w-4 h-4 text-[#E9A34A] shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <p className="text-[13px] font-mono uppercase tracking-[0.06em] text-[#8CC9E8]">
                          Parking ({item.stay.parkingAvailable ? 'On-site' : 'Walk-in Lane'})
                        </p>
                        <p className="text-sm text-white/90 mt-0.5">{item.stay.parkingInfo}</p>
                      </div>
                    </div>
                    <div className="rounded-xl bg-white/8 border border-white/14 p-3.5 flex items-start gap-2.5">
                      <Wifi className="w-4 h-4 text-[#8CC9E8] shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <p className="text-[13px] font-mono uppercase tracking-[0.06em] text-[#8CC9E8]">
                          Network ({item.stay.networkQuality})
                        </p>
                        <p className="text-sm text-white/90 mt-0.5">{item.stay.networkInfo}</p>
                      </div>
                    </div>
                    <div className="sm:col-span-2 rounded-xl bg-white/8 border border-white/14 p-3.5 flex items-start gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-[#E9A34A] shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <p className="text-[13px] font-mono uppercase tracking-[0.06em] text-[#8CC9E8]">
                          Extra &amp; Hidden Charges
                        </p>
                        <p className="text-sm text-white/90 mt-0.5">{item.stay.hiddenCharges}</p>
                      </div>
                    </div>
                  </>
                )}

                {item.kind === 'ride' && (
                  <>
                    <div className="rounded-xl bg-white/8 border border-white/14 p-3.5 flex items-start gap-2.5">
                      <Users className="w-4 h-4 text-[#E9A34A] shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <p className="text-[13px] font-mono uppercase tracking-[0.06em] text-[#8CC9E8]">
                          Capacity &amp; Luggage
                        </p>
                        <p className="text-sm font-medium text-white mt-0.5">
                          Up to {item.quote.maxPassengers} · {item.quote.luggageCapacity}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-xl bg-white/8 border border-white/14 p-3.5 flex items-start gap-2.5">
                      <Clock className="w-4 h-4 text-[#8CC9E8] shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <p className="text-[13px] font-mono uppercase tracking-[0.06em] text-[#8CC9E8]">
                          Route &amp; ETA
                        </p>
                        <p className="text-sm font-medium text-white mt-0.5">
                          {item.route.distanceKm} km · ~{item.quote.estimatedMinutes ?? item.route.durationMin} mins
                        </p>
                      </div>
                    </div>
                    {item.quote.fareBreakdown && (
                      <div className="sm:col-span-2 rounded-xl bg-white/8 border border-white/14 p-4 space-y-2">
                        <p className="text-[13px] font-mono uppercase tracking-[0.06em] text-[#E9A34A]">
                          Itemized Tariff Breakdown
                        </p>
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                          <dt className="text-white/80">
                            Base fare (incl. {item.quote.fareBreakdown.baseIncludedKm} km)
                          </dt>
                          <dd className="text-right font-mono text-white">
                            ₹{item.quote.fareBreakdown.baseFareInr}
                          </dd>
                          <dt className="text-white/80">
                            Extra distance ({item.quote.fareBreakdown.billableExtraKm} km × ₹
                            {item.quote.fareBreakdown.perKmRateInr}/km)
                          </dt>
                          <dd className="text-right font-mono text-white">
                            ₹{item.quote.fareBreakdown.distanceChargeInr}
                          </dd>
                          {item.quote.fareBreakdown.bookingFeeInr > 0 && (
                            <>
                              <dt className="text-white/80">Platform fee</dt>
                              <dd className="text-right font-mono text-white">
                                ₹{item.quote.fareBreakdown.bookingFeeInr}
                              </dd>
                            </>
                          )}
                          <dt className="text-white/80">Taxes &amp; GST</dt>
                          <dd className="text-right font-mono text-white">
                            ₹{item.quote.fareBreakdown.taxesAndFeesInr}
                          </dd>
                        </dl>
                      </div>
                    )}
                  </>
                )}

                {item.kind === 'destination' && (
                  <>
                    <div className="rounded-xl bg-white/8 border border-white/14 p-3.5">
                      <p className="text-[13px] font-mono uppercase tracking-[0.06em] text-[#8CC9E8]">
                        Primary Arrival Hub
                      </p>
                      <p className="text-sm font-medium text-white mt-0.5">
                        {item.destination.arrivalHubs[0]?.name}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/8 border border-white/14 p-3.5">
                      <p className="text-[13px] font-mono uppercase tracking-[0.06em] text-[#8CC9E8]">
                        Curated Experiences
                      </p>
                      <p className="text-sm font-medium text-white mt-0.5">
                        {item.destination.attractions.length} places · {item.destination.cafes.length} cafes ·{' '}
                        {item.destination.stays.length} audited stays
                      </p>
                    </div>
                  </>
                )}
              </motion.div>

              {/* Block 4: Why Visit / Facilities Highlight Chips */}
              {((item.kind === 'place' && item.highlights && item.highlights.length > 0) ||
                (item.kind === 'stay' && item.stay.facilities.length > 0)) && (
                <motion.div
                  custom={3}
                  initial="hidden"
                  animate="visible"
                  variants={blockVariants}
                  className="space-y-2"
                >
                  <p className="text-[13px] font-mono uppercase tracking-[0.06em] text-[#8CC9E8]">
                    {item.kind === 'stay' ? 'Verified Facilities' : 'Why Visit'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(item.kind === 'stay'
                      ? item.stay.facilities.slice(0, 4)
                      : item.kind === 'place'
                      ? item.highlights!.slice(0, 4)
                      : []
                    ).map((chip) => (
                      <span
                        key={chip}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-sm font-medium text-white"
                      >
                        <Compass className="w-3.5 h-3.5 text-[#E9A34A]" aria-hidden="true" />
                        <span>{chip}</span>
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Nearby Distances Strip */}
              {((item.kind === 'place' && item.nearbyPlaces && item.nearbyPlaces.length > 0) ||
                (item.kind === 'stay' && item.stay.landmarkDistances.length > 0)) && (
                <motion.div
                  custom={4}
                  initial="hidden"
                  animate="visible"
                  variants={blockVariants}
                  className="space-y-2"
                >
                  <p className="text-[13px] font-mono uppercase tracking-[0.06em] text-[#8CC9E8]">
                    Nearby Distances
                  </p>
                  <div className="flex flex-wrap gap-2 text-sm text-white/90">
                    {item.kind === 'stay'
                      ? item.stay.landmarkDistances.map((d) => (
                          <span
                            key={d.landmark}
                            className="px-3 py-1.5 rounded-xl bg-white/8 border border-white/14"
                          >
                            {d.landmark} · <span className="font-mono text-[#E9A34A]">{d.distance}</span>
                          </span>
                        ))
                      : item.kind === 'place'
                      ? item.nearbyPlaces!.map((np) => (
                          <span
                            key={np.name}
                            className="px-3 py-1.5 rounded-xl bg-white/8 border border-white/14"
                          >
                            {np.name}
                            {np.distance ? ` · ${np.distance}` : ''}
                          </span>
                        ))
                      : null}
                  </div>
                </motion.div>
              )}

              {saveToast && (
                <div
                  role="status"
                  className="rounded-xl bg-[#123D3A]/95 border border-[#8CC9E8]/40 px-4 py-2.5 text-sm font-medium text-white flex items-center justify-between gap-2"
                >
                  <span>{saveToast}</span>
                  {!user && (
                    <Link
                      to="/login"
                      onClick={onClose}
                      className="underline font-semibold text-[#E9A34A]"
                    >
                      Sign in
                    </Link>
                  )}
                </div>
              )}

              {/* Block 5: Live Interactive Actions Row */}
              <motion.div
                custom={5}
                initial="hidden"
                animate="visible"
                variants={blockVariants}
                className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/14"
              >
                {item.kind === 'place' && (
                  <>
                    {item.onCompareRide ? (
                      <button
                        type="button"
                        onClick={() => {
                          const fn = item.onCompareRide!;
                          onClose();
                          fn();
                        }}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[46px] rounded-xl bg-[#E9A34A] text-[#142322] text-sm sm:text-[15px] font-bold hover:bg-[#DF9538] transition-colors cursor-pointer"
                      >
                        <Navigation className="w-4 h-4" aria-hidden="true" />
                        <span>Compare Ride</span>
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </button>
                    ) : (
                      <Link
                        to={
                          item.destinationId
                            ? `/travel-assist?dest=${item.destinationId}`
                            : '/travel-assist'
                        }
                        onClick={onClose}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[46px] rounded-xl bg-[#E9A34A] text-[#142322] text-sm sm:text-[15px] font-bold hover:bg-[#DF9538] transition-colors"
                      >
                        <Navigation className="w-4 h-4" aria-hidden="true" />
                        <span>Compare Ride</span>
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </Link>
                    )}

                    {item.onAddToItinerary && (
                      <button
                        type="button"
                        onClick={() => {
                          item.onAddToItinerary?.();
                          setAddedLocal(true);
                        }}
                        className={`inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[46px] rounded-xl border text-sm font-semibold transition-colors cursor-pointer ${
                          item.isInItinerary || addedLocal
                            ? 'bg-[#123D3A] border-[#8CC9E8]/50 text-white'
                            : 'bg-white/10 border-white/25 text-white hover:bg-white/20'
                        }`}
                      >
                        {item.isInItinerary || addedLocal ? (
                          <>
                            <Check className="w-4 h-4 text-[#E9A34A]" aria-hidden="true" />
                            <span>In Itinerary</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" aria-hidden="true" />
                            <span>Add to Itinerary</span>
                          </>
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleToggleSave}
                      disabled={saving}
                      className={`inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[46px] rounded-xl border text-sm font-semibold transition-colors cursor-pointer ${
                        isSaved
                          ? 'bg-[#E9A34A]/20 border-[#E9A34A] text-[#E9A34A]'
                          : 'bg-white/10 border-white/25 text-white hover:bg-white/20'
                      }`}
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Bookmark className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
                      )}
                      <span>{isSaved ? 'Saved' : 'Save'}</span>
                    </button>

                    {(item.mapsUrl || (typeof item.lat === 'number' && typeof item.lng === 'number')) && (
                      <a
                        href={
                          item.mapsUrl ||
                          `https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[46px] rounded-xl bg-white/10 border border-white/25 text-white text-sm font-semibold hover:bg-white/20 transition-colors"
                      >
                        <span>Get Directions</span>
                        <ExternalLink className="w-4 h-4" aria-hidden="true" />
                      </a>
                    )}

                    {item.detailRoute && (
                      <Link
                        to={item.detailRoute}
                        onClick={onClose}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-3 min-h-[46px] rounded-xl text-sm font-semibold text-[#8CC9E8] hover:text-white underline underline-offset-4"
                      >
                        <span>Full Guide</span>
                      </Link>
                    )}
                  </>
                )}

                {item.kind === 'stay' && (
                  <>
                    <Link
                      to={`/stay-reality/${item.stay.id}`}
                      onClick={onClose}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[46px] rounded-xl bg-[#E9A34A] text-[#142322] text-sm sm:text-[15px] font-bold hover:bg-[#DF9538] transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                      <span>Inspect Stay Reality</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Link>

                    <button
                      type="button"
                      onClick={handleToggleSave}
                      disabled={saving}
                      className={`inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[46px] rounded-xl border text-sm font-semibold transition-colors cursor-pointer ${
                        isSaved
                          ? 'bg-[#E9A34A]/20 border-[#E9A34A] text-[#E9A34A]'
                          : 'bg-white/10 border-white/25 text-white hover:bg-white/20'
                      }`}
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Bookmark className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
                      )}
                      <span>{isSaved ? 'Saved Stay' : 'Save Stay'}</span>
                    </button>

                    <a
                      href={item.stay.bookingReferenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[46px] rounded-xl bg-white/10 border border-white/25 text-white text-sm font-semibold hover:bg-white/20 transition-colors"
                    >
                      <span>Open Listing Map</span>
                      <ExternalLink className="w-4 h-4" aria-hidden="true" />
                    </a>
                  </>
                )}

                {item.kind === 'ride' && (
                  <>
                    {item.quote.bookingUrl && (
                      <a
                        href={item.quote.bookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[46px] rounded-xl bg-[#E9A34A] text-[#142322] text-sm sm:text-[15px] font-bold hover:bg-[#DF9538] transition-colors"
                      >
                        <span>
                          {item.quote.bookingLabel ||
                            (item.quote.provider === 'Local Prepaid Stand'
                              ? 'View Route in Maps'
                              : `Open ${item.quote.providerTitle}`)}
                        </span>
                        <ExternalLink className="w-4 h-4" aria-hidden="true" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        navigate('/travel-assist');
                      }}
                      className="inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[46px] rounded-xl bg-white/10 border border-white/25 text-white text-sm font-semibold hover:bg-white/20 transition-colors cursor-pointer"
                    >
                      <span>Open Smart Local Hop</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </>
                )}

                {item.kind === 'destination' && (
                  <>
                    <Link
                      to={`/travel-assist?state=${encodeURIComponent(item.destination.state)}`}
                      onClick={onClose}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[46px] rounded-xl bg-[#E9A34A] text-[#142322] text-sm sm:text-[15px] font-bold hover:bg-[#DF9538] transition-colors"
                    >
                      <span>Open Travel Assist</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                    <Link
                      to={`/explore?dest=${item.destination.id}`}
                      onClick={onClose}
                      className="inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[46px] rounded-xl bg-white/10 border border-white/25 text-white text-sm font-semibold hover:bg-white/20 transition-colors"
                    >
                      <span>Explore &amp; Plan</span>
                    </Link>
                    <Link
                      to={`/stay-reality?dest=${item.destination.id}`}
                      onClick={onClose}
                      className="inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[46px] rounded-xl bg-white/10 border border-white/25 text-white text-sm font-semibold hover:bg-white/20 transition-colors"
                    >
                      <span>Stay Reality</span>
                    </Link>
                  </>
                )}
              </motion.div>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
