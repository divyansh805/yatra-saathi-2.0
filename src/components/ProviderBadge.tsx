import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Bike,
  Briefcase,
  Car,
  ChevronDown,
  Clock,
  ExternalLink,
  Info,
  MapPin,
  Navigation,
  Route,
  Sparkles,
  Users,
} from 'lucide-react';
import { IMAGES } from '../data/destinations';
import type { FareBreakdown, FareEstimateType } from '../data/fareEngine';
import { MotionCard } from './MotionCard';
import { useDetailOverlay } from './DetailOverlay';
import { EASE_PRIMARY } from '../motion/tokens';

export type RideCategory = 'bike' | 'auto' | 'cab';
export type CoverageStatus = 'Supported' | 'Not Supported' | 'Unknown';
export type CategorySupportStatus = 'Supported' | 'Not Supported' | 'Unknown';
export type LiveAvailabilityStatus =
  | 'Live Availability Confirmed'
  | 'No Vehicles Available'
  | 'Not Confirmed'
  | 'Unavailable to Verify';
export type FareStatus = FareEstimateType | 'Fare Unavailable';

export interface RideQuote {
  id: string;
  category: RideCategory;
  categoryLabel: string;
  provider: 'Rapido' | 'Uber' | 'Ola' | 'Local Prepaid Stand';
  providerTitle: string;
  vehicleType: string;
  maxPassengers: number;
  luggageCapacity: string;
  cityCoverage: CoverageStatus;
  vehicleTypeSupport: CategorySupportStatus;
  liveAvailability: LiveAvailabilityStatus;
  liveAvailabilityMessage: string;
  fareStatus: FareStatus;
  calculatedFareInr: number | null;
  fareMinInr: number | null;
  fareMaxInr: number | null;
  estimatedMinutes: number | null;
  fareSourceNote: string;
  fareBreakdown: FareBreakdown | null;
  bookingUrl: string | null;
  bookingLabel: string;
  capacityExceeded: boolean;
  isPrimarySupported?: boolean;
  lastUpdated: string;
}

export interface CompareResult {
  routeAvailable?: boolean;
  route: {
    originLabel: string;
    destLabel: string;
    origin: { lat: number; lng: number };
    destination: { lat: number; lng: number };
    distanceKm: number;
    durationMin: number;
    geometry?: Array<{ lat: number; lng: number }>;
    routeSource: string;
    isLiveRoute: boolean;
  };
  coverageSummary: {
    cityLabel: string;
    tier: string;
  };
  cheapestComparableId: string | null;
  quoteDisclaimer: string;
  lastUpdated: string;
  quotes: RideQuote[];
}

export const VEHICLE_IMAGES: Record<RideCategory, string> = {
  bike: IMAGES.vehicleBikeTaxi,
  auto: IMAGES.vehicleAutoRickshaw,
  cab: IMAGES.vehicleSedanCab,
};

export function ProviderLogo({ provider }: { provider: RideQuote['provider'] }) {
  if (provider === 'Uber') {
    return (
      <span
        aria-label="Uber"
        className="w-9 h-9 rounded-lg bg-[#111111] text-white flex items-center justify-center shadow-xs shrink-0"
      >
        <svg viewBox="0 0 36 16" className="w-5 h-2.5 fill-current" aria-hidden="true">
          <text
            x="1"
            y="13"
            fontFamily="system-ui, sans-serif"
            fontWeight="700"
            fontSize="13"
            letterSpacing="-0.5"
          >
            Uber
          </text>
        </svg>
      </span>
    );
  }

  if (provider === 'Ola') {
    return (
      <span
        aria-label="Ola"
        className="w-9 h-9 rounded-lg bg-[#1A2421] border border-[#2C3E38] flex items-center justify-center shadow-xs shrink-0"
      >
        <svg viewBox="0 0 32 32" className="w-5 h-5" aria-hidden="true">
          <circle cx="16" cy="16" r="11" fill="none" stroke="#C8E600" strokeWidth="4.5" />
          <circle cx="16" cy="16" r="4" fill="#FFFFFF" />
        </svg>
      </span>
    );
  }

  if (provider === 'Rapido') {
    return (
      <span
        aria-label="Rapido"
        className="w-9 h-9 rounded-lg bg-[#F9C935] text-[#141414] flex items-center justify-center shadow-xs shrink-0"
      >
        <svg viewBox="0 0 32 32" className="w-5 h-5" aria-hidden="true">
          <path
            d="M7 22c2.2-6.5 6.8-10.5 13.5-10.5h4.5l-3.8 5.2h-4.7c-2.6 0-4.8 2.1-5.8 5.3H7z"
            fill="#141414"
          />
          <circle cx="22.5" cy="21" r="3" fill="#141414" />
        </svg>
      </span>
    );
  }

  return (
    <span
      aria-label="Local Prepaid Stand"
      className="w-9 h-9 rounded-lg bg-[#123D3A] text-[#F8F6F0] flex items-center justify-center shadow-xs shrink-0"
    >
      <Navigation className="w-4 h-4 text-[#E9A34A]" aria-hidden="true" />
    </span>
  );
}

function formatTimeIst(isoString: string): string {
  try {
    return new Date(isoString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Just now';
  }
}

function isQuotePrimary(q: RideQuote): boolean {
  if (typeof q.isPrimarySupported === 'boolean') return q.isPrimarySupported;
  return (
    q.cityCoverage === 'Supported' &&
    q.vehicleTypeSupport === 'Supported' &&
    !q.capacityExceeded &&
    q.fareStatus !== 'Fare Unavailable'
  );
}

function getFriendlyAvailabilityText(quote: RideQuote): string {
  if (quote.liveAvailability === 'Live Availability Confirmed') {
    return 'Available Now';
  }
  if (quote.provider === 'Local Prepaid Stand') {
    return quote.liveAvailabilityMessage || 'Available at station exit stand';
  }
  if (quote.capacityExceeded) {
    return `Fits up to ${quote.maxPassengers} ${quote.maxPassengers === 1 ? 'person' : 'people'}`;
  }
  if (quote.cityCoverage === 'Supported' && quote.vehicleTypeSupport === 'Supported') {
    return 'Check Availability in App';
  }
  return `Check ${quote.provider} App`;
}

function FareBreakdownDrawer({
  quote,
  distanceKm,
}: {
  quote: RideQuote;
  distanceKm: number;
}) {
  const b = quote.fareBreakdown;
  if (!b) {
    return (
      <div className="px-4 py-3.5 bg-[#F8F6F0] border-t border-[#E5DFD3] text-sm text-[#495553] space-y-1">
        <p className="font-semibold text-[#142322]">Tariff Note</p>
        <p>{quote.fareSourceNote}</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-3.5 bg-[#F8F6F0] border-t border-[#E5DFD3] text-sm text-[#394543] space-y-2">
      <div className="flex items-center justify-between font-semibold text-[#123D3A]">
        <span>{b.estimateType} Breakdown</span>
        <span className="font-mono text-[#142322]">{distanceKm} km road route</span>
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-1">
        <dt className="text-[#5A6664]">Base fare (incl. {b.baseIncludedKm} km)</dt>
        <dd className="text-right font-mono font-medium text-[#142322]">₹{b.baseFareInr}</dd>

        <dt className="text-[#5A6664]">
          Extra km ({b.billableExtraKm} km × ₹{b.perKmRateInr}/km)
        </dt>
        <dd className="text-right font-mono font-medium text-[#142322]">₹{b.distanceChargeInr}</dd>

        {b.perMinRateInr > 0 && (
          <>
            <dt className="text-[#5A6664]">Ride time (₹{b.perMinRateInr}/min)</dt>
            <dd className="text-right font-mono font-medium text-[#142322]">₹{b.timeChargeInr}</dd>
          </>
        )}

        {b.bookingFeeInr > 0 && (
          <>
            <dt className="text-[#5A6664]">Platform / booking fee</dt>
            <dd className="text-right font-mono font-medium text-[#142322]">₹{b.bookingFeeInr}</dd>
          </>
        )}

        {b.taxesAndFeesInr > 0 && (
          <>
            <dt className="text-[#5A6664]">Taxes &amp; GST</dt>
            <dd className="text-right font-mono font-medium text-[#142322]">₹{b.taxesAndFeesInr}</dd>
          </>
        )}

        <dt className="text-[#5A6664]">Minimum fare floor</dt>
        <dd className="text-right font-mono text-[#142322]">
          ₹{b.minimumFareInr} {b.minimumApplied ? '(applied)' : ''}
        </dd>

        {quote.fareMinInr !== null && quote.fareMaxInr !== null && (
          <>
            <dt className="text-[#5A6664]">Typical demand spread</dt>
            <dd className="text-right font-mono font-medium text-[#123D3A]">
              ₹{quote.fareMinInr} – ₹{quote.fareMaxInr}
            </dd>
          </>
        )}
      </dl>

      <div className="pt-2 border-t border-[#E5DFD3]/80 space-y-1 text-sm text-[#5A6664]">
        <p>
          <strong className="text-[#394543]">Waiting:</strong> {b.waitingPolicy}
        </p>
        <p>
          <strong className="text-[#394543]">Region:</strong> {b.regionLabel}
        </p>
        <p>
          <strong className="text-[#394543]">Tariff Effective:</strong> {b.effectiveDate} ·{' '}
          <strong className="text-[#394543]">Verified:</strong> {b.verificationDate}
        </p>
        <p className="line-clamp-2">
          <strong className="text-[#394543]">Source:</strong> {b.sourceLabel}
        </p>
      </div>
    </div>
  );
}

interface RideComparisonSectionProps {
  compareResult: CompareResult;
  passengers: number;
  initialCategory?: 'all' | RideCategory;
  onCategoryChange?: (category: 'all' | RideCategory) => void;
  layoutVariant?: 'split-grid' | 'stacked';
  title?: string;
}

export function RideComparisonSection({
  compareResult,
  passengers,
  initialCategory = 'all',
  onCategoryChange,
  layoutVariant = 'stacked',
  title,
}: RideComparisonSectionProps) {
  const { openDetail } = useDetailOverlay();
  const [selectedCategory, setSelectedCategory] = useState<'all' | RideCategory>(initialCategory);
  const [showOtherProviders, setShowOtherProviders] = useState<boolean>(false);
  const [expandedDetailsIds, setExpandedDetailsIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setSelectedCategory(initialCategory);
    setShowOtherProviders(false);
  }, [initialCategory]);

  const handleSelectCategory = (cat: 'all' | RideCategory) => {
    setSelectedCategory(cat);
    setShowOtherProviders(false);
    onCategoryChange?.(cat);
  };

  const toggleDetails = (id: string) => {
    setExpandedDetailsIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openRideOverlay = (quote: RideQuote) => {
    openDetail({
      kind: 'ride',
      id: quote.id,
      quote,
      route: compareResult.route,
      vehicleImage: VEHICLE_IMAGES[quote.category],
    });
  };

  const categoryStats = useMemo(() => {
    const compute = (cat: 'all' | RideCategory) => {
      const subset =
        cat === 'all'
          ? compareResult.quotes
          : compareResult.quotes.filter((q) => q.category === cat);
      const primaryCount = subset.filter(isQuotePrimary).length;
      return {
        primaryCount,
        totalCount: subset.length,
      };
    };
    return {
      all: compute('all'),
      bike: compute('bike'),
      auto: compute('auto'),
      cab: compute('cab'),
    };
  }, [compareResult.quotes]);

  const { primaryQuotes, secondaryQuotes, bestOptionId } = useMemo(() => {
    const filtered =
      selectedCategory === 'all'
        ? compareResult.quotes
        : compareResult.quotes.filter((q) => q.category === selectedCategory);

    const primary = filtered
      .filter(isQuotePrimary)
      .sort((a, b) => (a.calculatedFareInr ?? 99999) - (b.calculatedFareInr ?? 99999));

    const secondary = filtered.filter((q) => !isQuotePrimary(q));

    const bestId =
      primary.length >= 2 && primary[0].calculatedFareInr !== null ? primary[0].id : null;

    return {
      primaryQuotes: primary,
      secondaryQuotes: secondary,
      bestOptionId: bestId,
    };
  }, [compareResult.quotes, selectedCategory]);

  const filterTabs: Array<{ id: 'all' | RideCategory; label: string; count: number }> = [
    { id: 'all', label: 'All', count: categoryStats.all.primaryCount },
    { id: 'bike', label: 'Bike', count: categoryStats.bike.primaryCount },
    { id: 'auto', label: 'Auto', count: categoryStats.auto.primaryCount },
    { id: 'cab', label: 'Cab', count: categoryStats.cab.primaryCount },
  ];

  // Compact Grid Card for Right Column of TravelAssistPage
  const renderGridCard = (quote: RideQuote, idx: number, isSecondary = false) => {
    const isBest = !isSecondary && bestOptionId !== null && quote.id === bestOptionId;
    const isExpanded = Boolean(expandedDetailsIds[quote.id]);
    const displayFare = quote.calculatedFareInr ?? quote.fareMinInr;

    return (
      <motion.div
        key={quote.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: Math.min(idx * 0.06, 0.3), ease: EASE_PRIMARY }}
      >
        <MotionCard
          hoverLift={-4}
          onClick={() => openRideOverlay(quote)}
          className={`group relative bg-white rounded-2xl border flex flex-col justify-between overflow-hidden transition-all cursor-pointer h-full ${
            isBest
              ? 'border-[#E9A34A] ring-1 ring-[#E9A34A]/35 shadow-sm hover:shadow-xl'
              : isSecondary
              ? 'border-[#E5DFD3] bg-[#FDFBF7] hover:shadow-md'
              : 'border-[#E5DFD3] hover:border-[#123D3A]/40 shadow-xs hover:shadow-lg'
          }`}
        >
          {isBest && (
            <div className="bg-[#E9A34A] text-[#142322] text-sm font-bold tracking-wide px-3 py-1.5 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Lowest Comparable Fare</span>
            </div>
          )}

          <div className="p-4 flex flex-col justify-between flex-1 gap-3">
            {/* Top row: Provider Logo + Name + Vehicle Image */}
            <div className="flex items-start justify-between gap-2.5">
              <div className="min-w-0 space-y-1.5">
                <div className="flex items-center gap-2">
                  <ProviderLogo provider={quote.provider} />
                  <div className="min-w-0">
                    <h4 className="text-[16px] font-bold text-[#142322] leading-tight truncate">
                      {quote.providerTitle}
                    </h4>
                    <p className="text-sm text-[#5A6664] truncate">{quote.vehicleType}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-[#495553]">
                  <span className="inline-flex items-center gap-1">
                    <Users className="w-4 h-4 text-[#123D3A]" aria-hidden="true" />
                    {quote.maxPassengers} {quote.maxPassengers === 1 ? 'Person' : 'People'}
                  </span>
                  <span className="text-[#C7BFA9]">·</span>
                  <span className="truncate">{quote.luggageCapacity}</span>
                </div>
              </div>

              <div className="w-[86px] h-[66px] rounded-xl overflow-hidden bg-[#F8F6F0] border border-[#E5DFD3] shrink-0">
                <img
                  src={VEHICLE_IMAGES[quote.category]}
                  alt={`${quote.providerTitle} — ${quote.vehicleType}`}
                  className="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                />
              </div>
            </div>

            {/* Middle Fare & Duration Strip */}
            <div className="bg-[#F8F6F0]/85 rounded-xl px-3.5 py-2.5 border border-[#E5DFD3]/70 flex items-center justify-between gap-2">
              <div>
                {quote.fareStatus !== 'Fare Unavailable' && displayFare !== null ? (
                  <>
                    <p className="font-mono tabular-nums text-[24px] font-bold text-[#123D3A] leading-none">
                      ₹{displayFare}
                    </p>
                    <p className="text-sm font-medium text-[#5A6664] mt-1">
                      {quote.fareStatus}
                    </p>
                  </>
                ) : (
                  <p className="text-sm font-medium text-[#5A6664]">Check fare in app</p>
                )}
              </div>

              <div className="text-right space-y-0.5">
                {quote.estimatedMinutes !== null && (
                  <p className="inline-flex items-center justify-end gap-1 text-sm font-semibold text-[#142322]">
                    <Clock className="w-4 h-4 text-[#123D3A]" aria-hidden="true" />
                    <span className="font-mono">{quote.estimatedMinutes} min</span>
                  </p>
                )}
                <p className="text-sm font-medium text-[#123D3A] line-clamp-1">
                  {getFriendlyAvailabilityText(quote)}
                </p>
              </div>
            </div>

            {/* Bottom Actions: View Details + Open in App */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDetails(quote.id);
                }}
                aria-expanded={isExpanded}
                className="inline-flex items-center gap-1 text-sm font-semibold text-[#123D3A] hover:text-[#194E4A] py-2 cursor-pointer"
              >
                <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>

              {quote.bookingUrl ? (
                <a
                  href={quote.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[42px] rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${
                    isSecondary
                      ? 'bg-[#F3EFE6] text-[#123D3A] border border-[#D8D0C0] hover:bg-[#EAE3D5]'
                      : 'bg-[#123D3A] text-white hover:bg-[#194E4A]'
                  }`}
                >
                  <span>{quote.bookingLabel}</span>
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#F3EFE6] border border-[#E5DFD3] text-sm font-semibold text-[#142322] whitespace-nowrap">
                  <MapPin className="w-4 h-4 text-[#E9A34A]" aria-hidden="true" />
                  {quote.bookingLabel}
                </span>
              )}
            </div>
          </div>

          {isExpanded && (
            <div onClick={(e) => e.stopPropagation()}>
              <FareBreakdownDrawer quote={quote} distanceKm={compareResult.route.distanceKm} />
            </div>
          )}
        </MotionCard>
      </motion.div>
    );
  };

  // Stacked Horizontal Card for dedicated /travel-assist/compare page
  const renderStackedCard = (quote: RideQuote, idx: number, isSecondary = false) => {
    const isBest = !isSecondary && bestOptionId !== null && quote.id === bestOptionId;
    const isExpanded = Boolean(expandedDetailsIds[quote.id]);
    const displayFare = quote.calculatedFareInr ?? quote.fareMinInr;

    return (
      <motion.div
        key={quote.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: Math.min(idx * 0.06, 0.3), ease: EASE_PRIMARY }}
      >
        <MotionCard
          hoverLift={-4}
          onClick={() => openRideOverlay(quote)}
          className={`group bg-white rounded-2xl border transition-all overflow-hidden cursor-pointer ${
            isBest
              ? 'border-[#123D3A] ring-1 ring-[#123D3A]/20 shadow-sm hover:shadow-xl'
              : isSecondary
              ? 'border-[#E5DFD3] bg-[#FDFBF7] hover:shadow-md'
              : 'border-[#E5DFD3] hover:border-[#123D3A]/40 shadow-xs hover:shadow-lg'
          }`}
        >
          <div className="p-4 sm:px-5 sm:py-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            {/* LEFT: Compact Vehicle Photo + Provider Logo & Capacity */}
            <div className="lg:col-span-5 flex items-center gap-3.5 min-w-0">
              <div className="w-[96px] sm:w-[104px] h-[72px] sm:h-[78px] rounded-xl overflow-hidden bg-[#F3EFE6] border border-[#E5DFD3] shrink-0">
                <img
                  src={VEHICLE_IMAGES[quote.category]}
                  alt={`${quote.providerTitle} — ${quote.vehicleType}`}
                  className="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                />
              </div>

              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2.5">
                  <ProviderLogo provider={quote.provider} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-[17px] font-bold text-[#142322] leading-tight">
                        {quote.providerTitle}
                      </h4>
                      {isBest && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#E9A34A]/25 text-[#8A5610] text-sm font-semibold">
                          <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                          Lowest Comparable Fare
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#495553] truncate">
                      {quote.categoryLabel} · {quote.vehicleType}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-[#5A6664]">
                  <span className="inline-flex items-center gap-1">
                    <Users className="w-4 h-4 text-[#123D3A]" aria-hidden="true" />
                    Max {quote.maxPassengers} {quote.maxPassengers === 1 ? 'person' : 'people'}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Briefcase className="w-4 h-4 text-[#123D3A]" aria-hidden="true" />
                    {quote.luggageCapacity}
                  </span>
                </div>
              </div>
            </div>

            {/* CENTER: Calm Availability & Route Guidance */}
            <div className="lg:col-span-4 space-y-1.5 lg:border-l lg:border-[#E5DFD3]/70 lg:pl-5">
              <p className="text-sm font-semibold text-[#142322]">
                {getFriendlyAvailabilityText(quote)}
              </p>
              <p className="text-sm text-[#5A6664] leading-snug">
                {quote.estimatedMinutes !== null ? (
                  <>
                    Est. <span className="font-mono text-[#142322]">{quote.estimatedMinutes} mins</span> ·{' '}
                  </>
                ) : null}
                {quote.fareSourceNote}
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDetails(quote.id);
                }}
                aria-expanded={isExpanded}
                className="inline-flex items-center gap-1 text-sm font-semibold text-[#123D3A] hover:underline cursor-pointer py-1"
              >
                <span>{isExpanded ? 'Hide Fare Breakdown' : 'View Details'}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>
            </div>

            {/* RIGHT: Calculated Fare + Direct Provider Action */}
            <div className="lg:col-span-3 flex flex-row lg:flex-col items-center lg:items-end justify-between gap-2.5 border-t lg:border-t-0 lg:border-l border-[#E5DFD3]/70 pt-3 lg:pt-0 lg:pl-5">
              <div className="lg:text-right">
                {quote.fareStatus !== 'Fare Unavailable' && displayFare !== null ? (
                  <>
                    <p className="eyebrow-mono text-[#5A6664]">
                      {quote.fareStatus}
                    </p>
                    <p className="font-mono tabular-nums text-[24px] font-bold text-[#123D3A] leading-tight">
                      ₹{displayFare}
                    </p>
                    {quote.fareMinInr !== null && quote.fareMaxInr !== null && (
                      <p className="text-sm font-mono text-[#5A6664]">
                        Range ₹{quote.fareMinInr}–₹{quote.fareMaxInr}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-1.5 text-sm font-medium text-[#5A6664]">
                    <Clock className="w-4 h-4" aria-hidden="true" />
                    <span>Check fare in app</span>
                  </div>
                )}
              </div>

              <div className="shrink-0">
                {quote.bookingUrl ? (
                  <a
                    href={quote.bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${
                      isSecondary
                        ? 'bg-[#F3EFE6] text-[#123D3A] border border-[#D8D0C0] hover:bg-[#EAE3D5]'
                        : 'bg-[#123D3A] text-white hover:bg-[#194E4A]'
                    }`}
                  >
                    <span>{quote.bookingLabel}</span>
                    <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#F3EFE6] border border-[#E5DFD3] text-sm font-medium text-[#142322] whitespace-nowrap">
                    <MapPin className="w-4 h-4 text-[#E9A34A]" aria-hidden="true" />
                    {quote.bookingLabel}
                  </span>
                )}
              </div>
            </div>
          </div>

          {isExpanded && (
            <div onClick={(e) => e.stopPropagation()}>
              <FareBreakdownDrawer quote={quote} distanceKm={compareResult.route.distanceKm} />
            </div>
          )}
        </MotionCard>
      </motion.div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Compact Route Summary Strip */}
      <div className="bg-[#FDFBF7] rounded-2xl border border-[#E5DFD3] px-4 py-3.5 sm:px-5 sm:py-4">
        {title && (
          <p className="eyebrow-mono text-[#123D3A]/85 mb-1.5">
            {title}
          </p>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 min-w-0 text-sm sm:text-[15px] font-semibold text-[#142322]">
            <span className="inline-flex items-center gap-1.5 truncate max-w-[220px] sm:max-w-none">
              <MapPin className="w-4 h-4 text-[#123D3A] shrink-0" aria-hidden="true" />
              <span className="truncate">{compareResult.route.originLabel}</span>
            </span>
            <span className="text-[#C7BFA9] font-normal px-1" aria-hidden="true">
              - - - →
            </span>
            <span className="inline-flex items-center gap-1.5 truncate max-w-[220px] sm:max-w-none">
              <MapPin className="w-4 h-4 text-[#E9A34A] shrink-0" aria-hidden="true" />
              <span className="truncate">{compareResult.route.destLabel}</span>
            </span>
          </div>

          <div className="flex items-center gap-4 shrink-0 text-sm">
            <span className="inline-flex items-center gap-1.5 font-mono font-bold text-[#123D3A]">
              <Route className="w-4 h-4 text-[#5A6664]" aria-hidden="true" />
              {compareResult.route.distanceKm} km
            </span>
            <span className="h-4 w-px bg-[#D8D0C0]" aria-hidden="true" />
            <span className="inline-flex items-center gap-1.5 font-mono font-bold text-[#142322]">
              <Clock className="w-4 h-4 text-[#5A6664]" aria-hidden="true" />
              ≈ {compareResult.route.durationMin} min
            </span>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="inline-flex flex-wrap gap-2" role="tablist" aria-label="Filter vehicle types">
          {filterTabs.map((tab) => {
            const active = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => handleSelectCategory(tab.id)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 min-h-[42px] rounded-xl text-sm font-semibold transition-colors border cursor-pointer ${
                  active
                    ? 'bg-[#123D3A] text-white border-[#123D3A] shadow-xs'
                    : 'bg-white text-[#142322] border-[#E5DFD3] hover:border-[#123D3A]/40 hover:bg-[#F8F6F0]'
                }`}
              >
                {tab.id === 'bike' && <Bike className="w-4 h-4" aria-hidden="true" />}
                {tab.id === 'auto' && <Navigation className="w-4 h-4" aria-hidden="true" />}
                {tab.id === 'cab' && <Car className="w-4 h-4" aria-hidden="true" />}
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`font-mono text-sm px-1.5 py-0.5 rounded ${
                      active ? 'bg-white/20 text-white' : 'bg-[#F3EFE6] text-[#495553]'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <p className="text-sm text-[#5A6664]">
          {compareResult.route.routeSource} · Updated {formatTimeIst(compareResult.lastUpdated)}
        </p>
      </div>

      {/* Primary Comparable Options */}
      {primaryQuotes.length > 0 ? (
        layoutVariant === 'split-grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {primaryQuotes.map((quote, idx) => renderGridCard(quote, idx, false))}
          </div>
        ) : (
          <div className="space-y-3">
            {primaryQuotes.map((quote, idx) => renderStackedCard(quote, idx, false))}
          </div>
        )
      ) : (
        <div className="bg-white rounded-2xl border border-[#E5DFD3] p-6 text-center space-y-3">
          <p className="text-base font-semibold text-[#142322]">
            {selectedCategory === 'bike' && passengers > 1
              ? `Bikes carry 1 passenger — you selected ${passengers} travellers.`
              : `No confirmed ${selectedCategory === 'all' ? 'ride' : selectedCategory} options fit this exact route.`}
          </p>
          <p className="text-sm text-[#495553] max-w-xl mx-auto">
            Switch to Auto, Cab, or All Rides to compare available vehicles for{' '}
            {compareResult.route.destLabel}.
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-1">
            {categoryStats.auto.primaryCount > 0 && (
              <button
                type="button"
                onClick={() => handleSelectCategory('auto')}
                className="px-4 py-2.5 min-h-[42px] rounded-xl bg-[#123D3A] text-white text-sm font-semibold hover:bg-[#194E4A] cursor-pointer"
              >
                Show Auto ({categoryStats.auto.primaryCount})
              </button>
            )}
            {categoryStats.cab.primaryCount > 0 && (
              <button
                type="button"
                onClick={() => handleSelectCategory('cab')}
                className="px-4 py-2.5 min-h-[42px] rounded-xl bg-[#123D3A] text-white text-sm font-semibold hover:bg-[#194E4A] cursor-pointer"
              >
                Show Cab ({categoryStats.cab.primaryCount})
              </button>
            )}
            <button
              type="button"
              onClick={() => handleSelectCategory('all')}
              className="px-4 py-2.5 min-h-[42px] rounded-xl bg-[#F3EFE6] border border-[#D8D0C0] text-[#142322] text-sm font-semibold hover:bg-[#EAE3D5] cursor-pointer"
            >
              Show All Options
            </button>
          </div>
        </div>
      )}

      {/* Optional Collapsed Disclosure for Additional / Non-Comparable Providers */}
      {secondaryQuotes.length > 0 && (
        <div className="pt-1 space-y-3">
          <button
            type="button"
            aria-expanded={showOtherProviders}
            onClick={() => setShowOtherProviders((prev) => !prev)}
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[42px] rounded-xl bg-white border border-[#E5DFD3] text-sm font-medium text-[#495553] hover:text-[#142322] hover:border-[#123D3A]/40 transition-colors cursor-pointer"
          >
            <span>Other providers ({secondaryQuotes.length})</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                showOtherProviders ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </button>

          {showOtherProviders &&
            (layoutVariant === 'split-grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {secondaryQuotes.map((quote, idx) => renderGridCard(quote, idx, true))}
              </div>
            ) : (
              <div className="space-y-3">
                {secondaryQuotes.map((quote, idx) => renderStackedCard(quote, idx, true))}
              </div>
            ))}
        </div>
      )}

      {/* Honest Data Source & Disclaimer Note */}
      <div className="rounded-xl bg-[#F3EFE6] border border-[#E5DFD3] px-4 py-3 flex items-start gap-2.5 text-sm text-[#495553]">
        <Info className="w-4 h-4 text-[#123D3A] shrink-0 mt-0.5" aria-hidden="true" />
        <p className="leading-relaxed">{compareResult.quoteDisclaimer}</p>
      </div>
    </div>
  );
}
