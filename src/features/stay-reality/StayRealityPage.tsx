import { useCallback, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Bookmark, Car, MapPin, ShieldCheck, Wifi } from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { SafeImage } from '../../components/SafeImage';
import {
  CinematicDestinationHero,
  preloadHeroImage,
  type CinematicHeroShowcase,
  type HeroMedallionItem,
} from '../../components/CinematicDestinationHero';
import { RevealGroup, RevealItem } from '../../components/Reveal';
import { MotionCard } from '../../components/MotionCard';
import { FlipCard } from '../../components/FlipCard';
import { useDetailOverlay } from '../../components/DetailOverlay';
import { DESTINATIONS, IMAGES } from '../../data/destinations';
import { useApp } from '../../contexts/AppContext';
import { STAGGER_LIST_MS } from '../../motion/tokens';

export function StayRealityPage() {
  const [searchParams] = useSearchParams();
  const { openDetail } = useDetailOverlay();
  const { tripContext, isItemSaved, toggleSaveItem } = useApp();

  const initialDest = searchParams.get('dest') || 'all';
  const [destFilter, setDestFilter] = useState(initialDest || tripContext.destinationId || 'all');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [travellers, setTravellers] = useState(tripContext.passengers || 1);
  const [maxBudget, setMaxBudget] = useState<number>(0);
  const [parkingPref, setParkingPref] = useState<'any' | 'onsite'>('any');
  const [networkPref, setNetworkPref] = useState<'any' | 'fiber'>('any');
  const [cleanlinessPref, setCleanlinessPref] = useState<'any' | 'audited'>('any');
  const [locationPref, setLocationPref] = useState('');
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [selectedHeroStayId, setSelectedHeroStayId] = useState<string | null>(null);
  const [flippedStayId, setFlippedStayId] = useState<string | null>(null);
  const heroSectionRef = useRef<HTMLElement | null>(null);
  const filterSectionRef = useRef<HTMLElement | null>(null);

  const allStays = useMemo(() => {
    return DESTINATIONS.flatMap((dest) =>
      dest.stays.map((stay) => ({
        ...stay,
        destName: dest.name,
        destState: dest.state,
      }))
    );
  }, []);

  const filteredStays = useMemo(() => {
    return allStays.filter((stay) => {
      if (destFilter !== 'all' && stay.destinationId !== destFilter) return false;
      if (maxBudget > 0 && stay.pricePerNightInr && stay.pricePerNightInr > maxBudget) return false;
      if (parkingPref === 'onsite' && !stay.parkingAvailable) return false;
      if (networkPref === 'fiber' && stay.networkQuality !== 'Strong Fiber + 5G') return false;
      if (cleanlinessPref === 'audited' && stay.verificationStatus !== 'Public Listing + Field Notes') {
        return false;
      }
      if (
        locationPref.trim() &&
        !`${stay.area} ${stay.location} ${stay.destName}`
          .toLowerCase()
          .includes(locationPref.trim().toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [allStays, destFilter, maxBudget, parkingPref, networkPref, cleanlinessPref, locationPref]);

  const handleReset = () => {
    setDestFilter('all');
    setMaxBudget(0);
    setParkingPref('any');
    setNetworkPref('any');
    setCleanlinessPref('any');
    setLocationPref('');
    setSelectedHeroStayId(null);
  };

  const handlePreviewStay = useCallback((stayId: string, image: string) => {
    preloadHeroImage(image);
    setSelectedHeroStayId(stayId);
    heroSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const selectedStay = useMemo(
    () => allStays.find((s) => s.id === selectedHeroStayId) || null,
    [allStays, selectedHeroStayId]
  );

  const stayHeroMedallions: HeroMedallionItem[] = useMemo(() => {
    const sourceList = filteredStays.length > 0 ? filteredStays : allStays;
    return sourceList.slice(0, 6).map((s) => ({
      id: s.id,
      title: s.name,
      subtitle: `${s.destName} · ${s.propertyType}`,
      image: s.images[0] || null,
    }));
  }, [filteredStays, allStays]);

  const stayHeroShowcase: CinematicHeroShowcase = useMemo(() => {
    if (selectedStay) {
      return {
        key: `stay-${selectedStay.id}`,
        eyebrow: `03. Stay Reality · ${selectedStay.destName}, ${selectedStay.destState} · ${selectedStay.propertyType}`,
        title: selectedStay.name,
        description: selectedStay.cleanlinessInfo,
        image: selectedStay.images[0] || IMAGES.heritageHaveli,
        imageAlt: `${selectedStay.name} in ${selectedStay.destName}`,
        fallbackTone: 'heritage',
        facts: [
          {
            label: 'Parking Reality',
            value: selectedStay.parkingAvailable ? 'On-site access' : 'Walk-in lane only',
          },
          {
            label: 'Network Check',
            value: selectedStay.networkQuality,
          },
          {
            label: selectedStay.pricePerNightInr ? 'Indicative Tariff' : 'Field Notes Date',
            value: selectedStay.pricePerNightInr
              ? `₹${selectedStay.pricePerNightInr}/night · ${selectedStay.verificationDate}`
              : `${selectedStay.verificationStatus} · ${selectedStay.verificationDate}`,
          },
        ],
        isItemSelected: true,
        resetLabel: 'Back to Stay Reality overview',
        onReset: () => setSelectedHeroStayId(null),
        primaryAction: {
          label: 'Inspect Stay Reality',
          to: `/stay-reality/${selectedStay.id}`,
        },
        secondaryActions: [
          {
            label: 'Compare Arrival Rides',
            to: `/travel-assist?state=${encodeURIComponent(selectedStay.destState)}`,
          },
        ],
      };
    }

    const activeDest =
      destFilter !== 'all' ? DESTINATIONS.find((d) => d.id === destFilter) : null;

    return {
      key: `stay-overview-${destFilter}`,
      eyebrow: `03. Stay Reality${activeDest ? ` · ${activeDest.name}, ${activeDest.state}` : ' · Verified Practical Facts'}`,
      title: 'Know what to expect before choosing your stay.',
      description:
        'A transparency-first stay guide. Click any stay card below to inspect full room reality, lane parking access, fiber Wi-Fi & 5G strength, cleanliness notes, and extra utility charges.',
      image: activeDest?.heroImage || filteredStays[0]?.images[0] || IMAGES.heritageHaveli,
      imageAlt: activeDest ? `${activeDest.name} heritage stay atmosphere` : 'Authentic Indian heritage courtyard guesthouse',
      fallbackTone: 'heritage',
      facts: [
        {
          label: 'Properties Matched',
          value: `${filteredStays.length} curated stays`,
        },
        {
          label: 'Verification Standard',
          value: 'Dated field & source notes',
        },
        {
          label: 'Zero Fake Ratings',
          value: 'Parking, Wi-Fi & hidden fees',
        },
      ],
      primaryAction: {
        label: 'Filter Properties',
        onClick: () => filterSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      },
    };
  }, [selectedStay, destFilter, filteredStays]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F6F0] text-[#142322]">
      <Navbar />

      <main className="flex-1 w-full">
        <CinematicDestinationHero
          sectionRef={heroSectionRef}
          showcase={stayHeroShowcase}
          medallions={stayHeroMedallions}
          activeMedallionId={selectedHeroStayId}
          onSelectMedallion={(id) => setSelectedHeroStayId(id)}
          minHeightClass="min-h-[370px] sm:min-h-[420px]"
          bottomSurface="#F8F6F0"
        />

        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 pb-12 space-y-10 relative z-20">
          {/* Search & Practical Filter Form */}
          <section ref={filterSectionRef} className="bg-white border border-[#E5DFD3] rounded-2xl p-6 shadow-xs space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label htmlFor="sr-dest" className="block text-sm font-semibold text-[#123D3A] mb-1.5">
                  Destination
                </label>
                <select
                  id="sr-dest"
                  value={destFilter}
                  onChange={(e) => setDestFilter(e.target.value)}
                  className="ys-input w-full px-3.5 py-2.5 min-h-[44px] rounded-lg bg-[#F8F6F0] border border-[#D7CFC1] text-sm font-medium focus:outline-none"
                >
                  <option value="all">All Curated Destinations</option>
                  {DESTINATIONS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}, {d.state}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="sr-checkin" className="block text-sm font-semibold text-[#123D3A] mb-1.5">
                  Check-in
                </label>
                <input
                  id="sr-checkin"
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="ys-input w-full px-3.5 py-2.5 min-h-[44px] rounded-lg bg-[#F8F6F0] border border-[#D7CFC1] text-sm focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="sr-checkout" className="block text-sm font-semibold text-[#123D3A] mb-1.5">
                  Check-out
                </label>
                <input
                  id="sr-checkout"
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="ys-input w-full px-3.5 py-2.5 min-h-[44px] rounded-lg bg-[#F8F6F0] border border-[#D7CFC1] text-sm focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="sr-pax" className="block text-sm font-semibold text-[#123D3A] mb-1.5">
                  Travellers
                </label>
                <select
                  id="sr-pax"
                  value={travellers}
                  onChange={(e) => setTravellers(Number(e.target.value))}
                  className="ys-input w-full px-3.5 py-2.5 min-h-[44px] rounded-lg bg-[#F8F6F0] border border-[#D7CFC1] text-sm focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'Traveller' : 'Travellers'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-3 border-t border-[#E5DFD3]">
              <div>
                <label htmlFor="sr-budget" className="block text-sm font-semibold text-[#123D3A] mb-1.5">
                  Nightly Budget
                </label>
                <select
                  id="sr-budget"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(Number(e.target.value))}
                  className="ys-input w-full px-3.5 py-2.5 min-h-[42px] rounded-lg bg-[#F8F6F0] border border-[#D7CFC1] text-sm font-medium focus:outline-none"
                >
                  <option value={0}>Any budget</option>
                  <option value={2000}>Up to ₹2,000 / night</option>
                  <option value={2500}>Up to ₹2,500 / night</option>
                  <option value={3500}>Up to ₹3,500 / night</option>
                </select>
              </div>

              <div>
                <label htmlFor="sr-clean" className="block text-sm font-semibold text-[#123D3A] mb-1.5">
                  Cleanliness Notes
                </label>
                <select
                  id="sr-clean"
                  value={cleanlinessPref}
                  onChange={(e) => setCleanlinessPref(e.target.value as 'any' | 'audited')}
                  className="ys-input w-full px-3.5 py-2.5 min-h-[42px] rounded-lg bg-[#F8F6F0] border border-[#D7CFC1] text-sm font-medium focus:outline-none"
                >
                  <option value="any">Any listing</option>
                  <option value="audited">Field-noted housekeeping</option>
                </select>
              </div>

              <div>
                <label htmlFor="sr-parking" className="block text-sm font-semibold text-[#123D3A] mb-1.5">
                  Parking Reality
                </label>
                <select
                  id="sr-parking"
                  value={parkingPref}
                  onChange={(e) => setParkingPref(e.target.value as 'any' | 'onsite')}
                  className="ys-input w-full px-3.5 py-2.5 min-h-[42px] rounded-lg bg-[#F8F6F0] border border-[#D7CFC1] text-sm font-medium focus:outline-none"
                >
                  <option value="any">Any parking access</option>
                  <option value="onsite">On-site / gated compound</option>
                </select>
              </div>

              <div>
                <label htmlFor="sr-network" className="block text-sm font-semibold text-[#123D3A] mb-1.5">
                  Network Connectivity
                </label>
                <select
                  id="sr-network"
                  value={networkPref}
                  onChange={(e) => setNetworkPref(e.target.value as 'any' | 'fiber')}
                  className="ys-input w-full px-3.5 py-2.5 min-h-[42px] rounded-lg bg-[#F8F6F0] border border-[#D7CFC1] text-sm font-medium focus:outline-none"
                >
                  <option value="any">Any connectivity</option>
                  <option value="fiber">Strong Fiber + 5G only</option>
                </select>
              </div>

              <div>
                <label htmlFor="sr-loc" className="block text-sm font-semibold text-[#123D3A] mb-1.5">
                  Neighbourhood Filter
                </label>
                <input
                  id="sr-loc"
                  type="text"
                  value={locationPref}
                  onChange={(e) => setLocationPref(e.target.value)}
                  placeholder="e.g. Old Manali, Bani Park"
                  className="ys-input w-full px-3.5 py-2.5 min-h-[42px] rounded-lg bg-[#F8F6F0] border border-[#D7CFC1] text-sm focus:outline-none"
                />
              </div>
            </div>
          </section>

          {saveFeedback && (
            <div className="p-3.5 rounded-xl bg-white border border-[#123D3A]/30 text-sm font-medium text-[#123D3A]">
              {saveFeedback}
            </div>
          )}

          {/* Stay Cards Grid */}
          {filteredStays.length === 0 ? (
            <div className="bg-white border border-[#E5DFD3] rounded-2xl p-10 text-center space-y-3">
              <h2 className="font-editorial text-2xl text-[#123D3A]">
                No stays matched all selected constraints
              </h2>
              <p className="text-sm sm:text-base text-[#5A6664] max-w-md mx-auto">
                Try relaxing the parking or budget filter—many heritage areas in India prohibit cars inside old lanes.
              </p>
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2.5 min-h-[42px] rounded-lg bg-[#123D3A] text-white text-sm font-semibold cursor-pointer"
              >
                Reset all filters
              </button>
            </div>
          ) : (
            <RevealGroup
              key={`stays-${destFilter}-${maxBudget}-${parkingPref}-${networkPref}-${cleanlinessPref}-${locationPref}`}
              retriggerKey={`stays-${destFilter}-${maxBudget}-${parkingPref}-${networkPref}-${cleanlinessPref}-${locationPref}`}
              staggerMs={STAGGER_LIST_MS}
              maxAnimatedItems={12}
              immediate
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              {filteredStays.map((stay, idx) => {
                const saved = isItemSaved(stay.id, 'stay');
                const isSelected = selectedHeroStayId === stay.id;
                const openStayOverlay = () =>
                  openDetail({
                    kind: 'stay',
                    id: stay.id,
                    stay,
                    destName: stay.destName,
                    destState: stay.destState,
                  });

                return (
                  <RevealItem key={stay.id} index={idx} className="h-full">
                    <MotionCard
                      onMouseEnter={() => preloadHeroImage(stay.images[0])}
                      className={`group h-full bg-white border rounded-2xl overflow-hidden flex flex-col ${
                        isSelected
                          ? 'border-[#123D3A] ring-2 ring-[#E9A34A]/65'
                          : 'border-[#E5DFD3] hover:border-[#123D3A]/45'
                      }`}
                    >
                      <FlipCard
                        isFlipped={flippedStayId === stay.id}
                        onFlipChange={(next) => setFlippedStayId(next ? stay.id : null)}
                        cardLabel={stay.name}
                        onFrontClick={openStayOverlay}
                        className="aspect-[16/10] w-full"
                        roundedClass="rounded-t-2xl"
                        togglePlacement="top-right"
                        front={
                          <div className="w-full h-full relative bg-[#EAE4D7]">
                            <SafeImage
                              src={stay.images[0]}
                              alt={`${stay.name} in ${stay.destName}`}
                              className="ys-card-img w-full h-full object-cover"
                            />
                            <div
                              className="absolute inset-0 bg-gradient-to-t from-[#0D2B29]/90 via-[#0D2B29]/20 to-transparent pointer-events-none"
                              aria-hidden="true"
                            />
                            <div className="absolute top-3 left-3 pr-14 pointer-events-none">
                              <span className="inline-block px-2.5 py-1 rounded-full bg-[#0D2B29]/80 text-[#E9A34A] font-mono text-xs uppercase tracking-[0.06em]">
                                {stay.propertyType} · {stay.destName}
                              </span>
                            </div>
                            <div className="absolute inset-x-4 bottom-3.5 flex items-end justify-between gap-2 text-left pointer-events-none">
                              <div className="min-w-0">
                                <p className="text-xs text-[#8CC9E8] font-medium truncate">
                                  {stay.area}
                                </p>
                                <p className="font-editorial text-xl font-semibold text-white leading-snug line-clamp-1 mt-0.5">
                                  {stay.name}
                                </p>
                              </div>
                              {stay.pricePerNightInr && (
                                <span className="shrink-0 px-2.5 py-1 rounded-lg bg-white/95 text-[#123D3A] font-mono text-xs font-bold tabular-figures">
                                  ₹{stay.pricePerNightInr}/nt
                                </span>
                              )}
                            </div>
                          </div>
                        }
                        back={
                          <div className="flex flex-col justify-between h-full gap-3">
                            <div className="space-y-1.5 pr-11">
                              <p className="eyebrow-mono text-[#E9A34A]">
                                {stay.verificationStatus} · {stay.verificationDate}
                              </p>
                              <h4 className="font-editorial text-lg font-bold text-white leading-snug line-clamp-1">
                                {stay.name}
                              </h4>
                              <div className="flex flex-wrap gap-1.5 pt-0.5">
                                <span className="px-2 py-0.5 rounded-full bg-white/12 border border-white/18 text-[11px] font-medium text-[#8CC9E8]">
                                  {stay.parkingAvailable ? 'On-site Parking' : 'Walk-in Lane'}
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-white/12 border border-white/18 text-[11px] font-medium text-[#8CC9E8]">
                                  {stay.networkQuality}
                                </span>
                              </div>
                            </div>

                            <p className="text-xs text-[#F8F6F0]/85 leading-relaxed line-clamp-2 border-y border-white/15 py-2">
                              <strong className="text-[#E9A34A]">Extra / Utility Notes:</strong> {stay.hiddenCharges}
                            </p>

                            <Link
                              to={`/stay-reality/${stay.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="ys-btn-primary w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[40px] rounded-xl bg-[#E9A34A] hover:bg-[#DF9538] text-[#142322] text-sm font-bold"
                            >
                              <span>View details</span>
                              <ArrowRight className="ys-arrow w-4 h-4" aria-hidden="true" />
                            </Link>
                          </div>
                        }
                      />

                      <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm text-[#5A6664]">
                              {stay.destName}, {stay.destState} <span aria-hidden="true">·</span> {stay.propertyType}
                            </p>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePreviewStay(stay.id, stay.images[0]);
                              }}
                              className="ys-chip px-2.5 py-1 rounded-md bg-[#F8F6F0] border border-[#E5DFD3] hover:border-[#123D3A] text-xs font-semibold text-[#123D3A] cursor-pointer"
                            >
                              {isSelected ? 'Viewing in Hero' : 'Preview in Hero'}
                            </button>
                          </div>

                          <div className="flex items-start justify-between gap-4">
                            <h2 className="font-editorial text-2xl font-semibold text-[#123D3A] group-hover:text-[#E9A34A] transition-colors">
                              <button
                                type="button"
                                onClick={openStayOverlay}
                                className="text-left cursor-pointer hover:underline"
                              >
                                {stay.name}
                              </button>
                            </h2>
                            {stay.pricePerNightInr && (
                              <div className="text-right shrink-0">
                                <p className="font-mono text-lg font-semibold text-[#123D3A] tabular-figures">
                                  ₹{stay.pricePerNightInr}
                                  <span className="text-sm font-sans font-normal text-[#5A6664]"> / night</span>
                                </p>
                                <p className="text-sm text-[#5A6664]">{stay.priceSource}</p>
                              </div>
                            )}
                          </div>

                          <p className="text-sm text-[#5A6664] flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-[#E9A34A] shrink-0" aria-hidden="true" />
                            {stay.location}
                          </p>

                          {/* Ground Reality Quick Matrix */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-sm">
                            <div className="p-3 rounded-lg bg-[#F8F6F0] border border-[#E5DFD3] space-y-1">
                              <p className="font-semibold text-[#123D3A] flex items-center gap-1.5">
                                <Car className="w-4 h-4 text-[#123D3A]" aria-hidden="true" />
                                Parking: {stay.parkingAvailable ? 'On-site' : 'Walk-in lane'}
                              </p>
                              <p className="text-[#495553] line-clamp-2">{stay.parkingInfo}</p>
                            </div>

                            <div className="p-3 rounded-lg bg-[#F8F6F0] border border-[#E5DFD3] space-y-1">
                              <p className="font-semibold text-[#123D3A] flex items-center gap-1.5">
                                <Wifi className="w-4 h-4 text-[#123D3A]" aria-hidden="true" />
                                Network: {stay.networkQuality}
                              </p>
                              <p className="text-[#495553] line-clamp-2">{stay.networkInfo}</p>
                            </div>
                          </div>

                          <div className="text-sm text-[#495553]">
                            <span className="font-semibold text-[#123D3A]">Distances: </span>
                            {stay.landmarkDistances.map((d) => `${d.landmark} (${d.distance})`).join(' · ')}
                          </div>
                        </div>

                        <div className="pt-4 border-t border-[#E5DFD3] flex items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              setSaveFeedback(null);
                              try {
                                const next = await toggleSaveItem({
                                  id: stay.id,
                                  type: 'stay',
                                  destinationId: stay.destinationId,
                                  title: stay.name,
                                  subtitle: stay.location,
                                  image: stay.images[0],
                                  cachedSummary: `${stay.cleanlinessInfo} | Parking: ${stay.parkingInfo}`,
                                });
                                setSaveFeedback(
                                  next ? `Saved “${stay.name}” for offline reference.` : `Removed “${stay.name}”.`
                                );
                              } catch (err) {
                                setSaveFeedback(err instanceof Error ? err.message : 'Sign in to save stays.');
                              }
                            }}
                            className={`ys-chip inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[42px] rounded-lg border text-sm font-semibold cursor-pointer ${
                              saved
                                ? 'border-[#E9A34A] bg-[#E9A34A]/15 text-[#123D3A]'
                                : 'border-[#D7CFC1] text-[#5A6664] hover:text-[#123D3A]'
                            }`}
                          >
                            <Bookmark className="w-4 h-4" fill={saved ? 'currentColor' : 'none'} />
                            {saved ? 'Saved' : 'Save Stay'}
                          </button>

                          <Link
                            to={`/stay-reality/${stay.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="ys-btn-primary inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[42px] rounded-lg bg-[#123D3A] text-white text-sm font-semibold hover:bg-[#194E4A]"
                          >
                            <ShieldCheck className="w-4 h-4 text-[#E9A34A]" aria-hidden="true" />
                            Inspect Stay Reality
                            <ArrowRight className="ys-arrow w-4 h-4" aria-hidden="true" />
                          </Link>
                        </div>
                      </div>
                    </MotionCard>
                  </RevealItem>
                );
              })}
            </RevealGroup>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
