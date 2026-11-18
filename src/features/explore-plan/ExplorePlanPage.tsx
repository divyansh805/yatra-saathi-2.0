import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  Bookmark,
  Check,
  CloudSun,
  Compass,
  ExternalLink,
  Loader2,
  MapPin,
  Plus,
  Route,
  Sparkles,
  Trash2,
  WifiOff,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { SafeImage } from '../../components/SafeImage';
import { GoogleRouteMap, type MapStop } from '../../components/GoogleRouteMap';
import {
  CinematicDestinationHero,
  preloadHeroImage,
  type CinematicHeroShowcase,
  type HeroMedallionItem,
} from '../../components/CinematicDestinationHero';
import { RevealGroup, RevealItem } from '../../components/Reveal';
import { MotionCard } from '../../components/MotionCard';
import { useDetailOverlay } from '../../components/DetailOverlay';
import { DESTINATIONS, getDestinationById } from '../../data/destinations';
import { useApp } from '../../contexts/AppContext';
import { STAGGER_STEP } from '../../motion/tokens';
import type { CafeTag, WeatherSnapshot } from '../../types/travel';

type SectionTab = 'attractions' | 'cafes' | 'adventures' | 'planner';

interface SightseeingPlanResult {
  legs: Array<{
    stopId: string;
    attractionName: string;
    fromLabel: string;
    distanceKm: number;
    durationMin: number;
    autoEstimateInr: number;
    cabEstimateInr: number;
    routeSource: string;
  }>;
  suggestedOrderIds: string[];
  totals: {
    totalDistanceKm: number;
    totalDurationMin: number;
    totalAutoInr: number;
    totalCabInr: number;
  };
  quoteType: string;
  lastUpdated: string;
}

const CAFE_TAGS: Array<'All' | CafeTag> = [
  'All',
  'Solo Friendly',
  'Work Friendly',
  'Scenic View',
  'Budget Friendly',
  'Group Friendly',
];

export function ExplorePlanPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { openDetail } = useDetailOverlay();
  const {
    user,
    isOnline,
    offlineCachedAt,
    tripContext,
    updateTripContext,
    isItemSaved,
    toggleSaveItem,
    savePlannedRoute,
    recordDestinationView,
  } = useApp();

  const initialDestId = searchParams.get('dest') || tripContext.destinationId || 'udaipur';
  const [selectedDestId, setSelectedDestId] = useState(initialDestId);
  const destination = useMemo(() => getDestinationById(selectedDestId), [selectedDestId]);

  const [activeTab, setActiveTab] = useState<SectionTab>('attractions');
  const [cafeTagFilter, setCafeTagFilter] = useState<'All' | CafeTag>('All');
  const [selectedHeroItem, setSelectedHeroItem] = useState<{
    kind: 'attraction' | 'cafe' | 'adventure';
    id: string;
  } | null>(null);
  const heroSectionRef = useRef<HTMLElement | null>(null);
  const contentSectionRef = useRef<HTMLElement | null>(null);

  // Pickup & route planning state
  const [pickupMode, setPickupMode] = useState<'hub' | 'stay' | 'custom'>('hub');
  const [pickupLabel, setPickupLabel] = useState(destination.arrivalHubs[0].name);
  const [pickupCoords, setPickupCoords] = useState({
    lat: destination.arrivalHubs[0].lat,
    lng: destination.arrivalHubs[0].lng,
  });

  const [selectedStopIds, setSelectedStopIds] = useState<string[]>(() =>
    destination.attractions.map((a) => a.id)
  );
  const [planLoading, setPlanLoading] = useState(false);
  const [planResult, setPlanResult] = useState<SightseeingPlanResult | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // Live weather & Wikipedia editorial brief
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [wikiSummary, setWikiSummary] = useState<{
    extract: string;
    url?: string;
    status: string;
  } | null>(null);

  // Sync URL param -> selectedDestId
  useEffect(() => {
    const paramDest = searchParams.get('dest');
    if (paramDest && DESTINATIONS.some((d) => d.id === paramDest)) {
      setSelectedDestId(paramDest);
    }
  }, [searchParams]);

  // Reset destination-specific picks when destination changes
  useEffect(() => {
    const dest = getDestinationById(selectedDestId);
    const hub = dest.arrivalHubs[0];
    setSelectedHeroItem(null);
    setPickupMode('hub');
    setPickupLabel(hub.name);
    setPickupCoords({ lat: hub.lat, lng: hub.lng });
    setSelectedStopIds(dest.attractions.map((a) => a.id));
    setPlanResult(null);
    updateTripContext({
      destinationId: dest.id,
      pickupLabel: hub.name,
      pickupCoords: { lat: hub.lat, lng: hub.lng },
    });
    void recordDestinationView(dest.id);
  }, [selectedDestId, updateTripContext, recordDestinationView]);

  // Fetch live weather + editorial brief when online
  useEffect(() => {
    let active = true;
    const weatherCacheKey = `ys_weather_${destination.id}`;
    const wikiCacheKey = `ys_wiki_${destination.id}`;

    if (!isOnline) {
      try {
        const cachedW = localStorage.getItem(weatherCacheKey);
        if (cachedW) setWeather({ ...(JSON.parse(cachedW) as WeatherSnapshot), status: 'cached' });
        else setWeather(null);
        const cachedWiki = localStorage.getItem(wikiCacheKey);
        if (cachedWiki) setWikiSummary(JSON.parse(cachedWiki));
      } catch {
        setWeather(null);
      }
      return;
    }

    fetch(`/api/weather?lat=${destination.coords.lat}&lng=${destination.coords.lng}`)
      .then((r) => r.json())
      .then((data: WeatherSnapshot) => {
        if (!active) return;
        setWeather(data);
        if (data.status === 'live') {
          localStorage.setItem(weatherCacheKey, JSON.stringify(data));
        }
      })
      .catch(() => {
        if (active) setWeather(null);
      });

    fetch(`/api/destination-brief?query=${encodeURIComponent(destination.name)}`)
      .then((r) => r.json())
      .then((data: { extract: string; url?: string; status: string }) => {
        if (!active) return;
        setWikiSummary(data);
        if (data.extract) {
          localStorage.setItem(wikiCacheKey, JSON.stringify(data));
        }
      })
      .catch(() => {
        if (active) setWikiSummary(null);
      });

    return () => {
      active = false;
    };
  }, [destination, isOnline]);

  const handleSelectDestination = (nextId: string) => {
    setSelectedDestId(nextId);
    setSearchParams({ dest: nextId });
  };

  const filteredCafes = useMemo(() => {
    if (cafeTagFilter === 'All') return destination.cafes;
    return destination.cafes.filter((c) => c.tags.includes(cafeTagFilter));
  }, [destination.cafes, cafeTagFilter]);

  const orderedSelectedAttractions = useMemo(() => {
    return selectedStopIds
      .map((id) => destination.attractions.find((a) => a.id === id))
      .filter((a): a is NonNullable<typeof a> => Boolean(a));
  }, [selectedStopIds, destination.attractions]);

  const toggleStop = (attractionId: string) => {
    setSelectedStopIds((prev) =>
      prev.includes(attractionId) ? prev.filter((id) => id !== attractionId) : [...prev, attractionId]
    );
    setPlanResult(null);
  };

  const moveStop = (index: number, delta: -1 | 1) => {
    setSelectedStopIds((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setPlanResult(null);
  };

  const computeSightseeingPlan = async (applySuggestedOrder = false) => {
    if (orderedSelectedAttractions.length === 0) return;
    if (!isOnline) {
      setSaveNotice('Route calculation requires an active internet connection.');
      return;
    }
    setPlanLoading(true);
    setSaveNotice(null);
    try {
      const res = await fetch('/api/explore/sightseeing-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickup: { label: pickupLabel, lat: pickupCoords.lat, lng: pickupCoords.lng },
          stops: orderedSelectedAttractions.map((a) => ({
            id: a.id,
            name: a.name,
            lat: a.lat,
            lng: a.lng,
          })),
          citySlug: destination.id,
        }),
      });
      const data = (await res.json()) as SightseeingPlanResult;
      if (res.ok) {
        if (applySuggestedOrder && data.suggestedOrderIds?.length) {
          setSelectedStopIds(data.suggestedOrderIds);
          // Re-compute legs in the newly optimized order
          const reorderedStops = data.suggestedOrderIds
            .map((id) => destination.attractions.find((a) => a.id === id))
            .filter((a): a is NonNullable<typeof a> => Boolean(a));
          const res2 = await fetch('/api/explore/sightseeing-plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pickup: { label: pickupLabel, lat: pickupCoords.lat, lng: pickupCoords.lng },
              stops: reorderedStops.map((a) => ({
                id: a.id,
                name: a.name,
                lat: a.lat,
                lng: a.lng,
              })),
              citySlug: destination.id,
            }),
          });
          if (res2.ok) {
            setPlanResult(await res2.json());
            return;
          }
        }
        setPlanResult(data);
      }
    } finally {
      setPlanLoading(false);
    }
  };

  const handleSavePlace = async (
    id: string,
    type: 'attraction' | 'cafe' | 'adventure',
    title: string,
    subtitle: string,
    image: string,
    cachedSummary: string
  ) => {
    setSaveNotice(null);
    try {
      const saved = await toggleSaveItem({
        id,
        type,
        destinationId: destination.id,
        title,
        subtitle,
        image,
        cachedSummary,
      });
      setSaveNotice(saved ? `Saved “${title}” to your offline-ready account.` : `Removed “${title}”.`);
    } catch (err) {
      setSaveNotice(err instanceof Error ? err.message : 'Sign in to save places.');
    }
  };

  const handleSaveRoute = async () => {
    setSaveNotice(null);
    if (!user) {
      setSaveNotice('Sign in to save planned routes to your profile.');
      return;
    }
    try {
      await savePlannedRoute({
        destinationId: destination.id,
        destinationName: `${destination.name}, ${destination.state}`,
        pickupLabel,
        stops: orderedSelectedAttractions.map((a) => ({
          id: a.id,
          name: a.name,
          lat: a.lat,
          lng: a.lng,
        })),
        totalDistanceKm: planResult?.totals.totalDistanceKm ?? null,
        totalDurationMin: planResult?.totals.totalDurationMin ?? null,
        estimatedTransportInr: planResult?.totals.totalAutoInr ?? null,
      });
      setSaveNotice('Route saved and cached for offline access.');
    } catch (err) {
      setSaveNotice(err instanceof Error ? err.message : 'Unable to save route.');
    }
  };

  const routeMapStops: MapStop[] = useMemo(() => {
    const list: MapStop[] = [
      { id: 'pickup', label: `Start: ${pickupLabel}`, lat: pickupCoords.lat, lng: pickupCoords.lng, kind: 'origin' },
    ];
    orderedSelectedAttractions.forEach((a, i) => {
      list.push({
        id: a.id,
        label: `${i + 1}. ${a.name}`,
        lat: a.lat,
        lng: a.lng,
        kind: i === orderedSelectedAttractions.length - 1 ? 'destination' : 'stop',
      });
    });
    return list;
  }, [pickupLabel, pickupCoords, orderedSelectedAttractions]);

  const handlePreviewExploreCard = useCallback(
    (kind: 'attraction' | 'cafe' | 'adventure', id: string, image: string) => {
      preloadHeroImage(image);
      setSelectedHeroItem({ kind, id });
      heroSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    []
  );

  const heroMedallions: HeroMedallionItem[] = useMemo(() => {
    if (activeTab === 'cafes' && destination.cafes.length > 0) {
      return destination.cafes.slice(0, 6).map((c) => ({
        id: `cafe:${c.id}`,
        title: c.name,
        subtitle: c.setting,
        image: c.image,
      }));
    }
    if (activeTab === 'adventures' && destination.adventures.length > 0) {
      return destination.adventures.slice(0, 6).map((adv) => ({
        id: `adventure:${adv.id}`,
        title: adv.name,
        subtitle: adv.activityType,
        image: adv.image,
      }));
    }
    if (activeTab === 'attractions' && destination.attractions.length > 0) {
      return destination.attractions.slice(0, 6).map((a) => ({
        id: `attraction:${a.id}`,
        title: a.name,
        subtitle: a.category,
        image: a.image,
      }));
    }
    return DESTINATIONS.slice(0, 4).map((d) => ({
      id: `dest:${d.id}`,
      title: d.name,
      subtitle: d.state,
      image: d.heroImage,
    }));
  }, [activeTab, destination]);

  const exploreHeroShowcase: CinematicHeroShowcase = useMemo(() => {
    if (selectedHeroItem?.kind === 'attraction') {
      const place = destination.attractions.find((a) => a.id === selectedHeroItem.id);
      if (place) {
        const inRoute = selectedStopIds.includes(place.id);
        return {
          key: `exp-attr-${place.id}`,
          eyebrow: `${place.category} · ${place.location}`,
          title: place.name,
          description: place.fullDescription || place.shortDescription,
          image: place.image,
          imageAlt: `${place.name} in ${destination.name}`,
          fallbackTone: 'heritage',
          facts: [
            { label: 'Best Visiting Time', value: place.bestVisitingTime },
            {
              label: 'Opening Hours',
              value: place.openingHoursVerified ? place.openingHours : `${place.openingHours} (Verify locally)`,
            },
            {
              label: 'Entry Fee',
              value: place.entryFeeVerified ? place.entryFee : 'Verify at ticket counter',
            },
          ],
          isItemSelected: true,
          resetLabel: `Back to ${destination.name} overview`,
          onReset: () => setSelectedHeroItem(null),
          primaryAction: {
            label: 'Open Full Guide',
            to: `/explore/attraction/${place.id}?dest=${destination.id}`,
          },
          secondaryActions: [
            {
              label: inRoute ? 'In Route ✓' : 'Add to Route',
              onClick: () => toggleStop(place.id),
            },
            {
              label: 'Arrival Rides',
              to: `/travel-assist?dest=${destination.id}`,
            },
          ],
        };
      }
    }

    if (selectedHeroItem?.kind === 'cafe') {
      const cafe = destination.cafes.find((c) => c.id === selectedHeroItem.id);
      if (cafe) {
        return {
          key: `exp-cafe-${cafe.id}`,
          eyebrow: `Cafe Corner · ${cafe.setting} · ${cafe.location}`,
          title: cafe.name,
          description: cafe.soloTravellerNote || cafe.shortDescription,
          image: cafe.image,
          imageAlt: `${cafe.name} — ${cafe.setting}`,
          fallbackTone: 'coffee',
          facts: [
            { label: 'Solo Fit', value: cafe.tags.slice(0, 2).join(' · ') },
            {
              label: 'Indicative Price',
              value: cafe.priceRange || 'Check menu locally',
            },
            {
              label: 'Hours',
              value: cafe.hoursVerified && cafe.openingHours ? cafe.openingHours : 'Hours unverified',
            },
          ],
          isItemSelected: true,
          resetLabel: `Back to ${destination.name} overview`,
          onReset: () => setSelectedHeroItem(null),
          primaryAction: {
            label: 'Read Solo Guide',
            to: `/explore/cafe/${cafe.id}?dest=${destination.id}`,
          },
          secondaryActions: [
            { label: 'Google Maps Directions', href: cafe.mapsQueryUrl },
          ],
        };
      }
    }

    if (selectedHeroItem?.kind === 'adventure') {
      const adv = destination.adventures.find((a) => a.id === selectedHeroItem.id);
      if (adv) {
        return {
          key: `exp-adv-${adv.id}`,
          eyebrow: `Adventure & Experience · ${adv.activityType} · ${adv.location}`,
          title: adv.name,
          description: adv.fullDescription || adv.shortDescription,
          image: adv.image,
          imageAlt: `${adv.name} — ${adv.activityType}`,
          fallbackTone: 'mountain',
          facts: [
            { label: 'Duration & Season', value: `${adv.duration} · ${adv.seasonWindow}` },
            { label: 'Approx Tariff', value: adv.approxCost || 'Check operator tariff' },
            { label: 'Age & Safety', value: adv.ageRequirement },
          ],
          isItemSelected: true,
          resetLabel: `Back to ${destination.name} overview`,
          onReset: () => setSelectedHeroItem(null),
          primaryAction: {
            label: 'Activity Details',
            to: `/explore/adventure/${adv.id}?dest=${destination.id}`,
          },
          secondaryActions: adv.operatorLink
            ? [{ label: adv.operatorLabel || 'Operator Reference', href: adv.operatorLink }]
            : undefined,
        };
      }
    }

    return {
      key: `exp-dest-${destination.id}`,
      eyebrow: `02. Explore & Plan · ${destination.state}`,
      title: `${destination.name}, ${destination.state}`,
      description: destination.tagline,
      image: destination.heroImage,
      imageAlt: `${destination.name}, ${destination.state}`,
      fallbackTone: 'teal',
      facts: [
        { label: 'Best Window', value: destination.bestSeason },
        {
          label: 'Weather',
          value: weather?.current
            ? `${Math.round(weather.current.temperature_2m)}°C · Wind ${Math.round(
                weather.current.wind_speed_10m
              )} km/h`
            : isOnline
            ? 'Checking Open-Meteo...'
            : 'Offline brief',
        },
        {
          label: 'Local Highlights',
          value: `${destination.attractions.length} places · ${destination.cafes.length} cafes`,
        },
      ],
      primaryAction: {
        label: 'Plan Multi-Stop Route',
        onClick: () => {
          setActiveTab('planner');
          contentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        },
      },
      secondaryActions: [
        { label: 'Arrival Rides', to: `/travel-assist?dest=${destination.id}` },
        { label: 'Check Stay Reality', to: `/stay-reality?dest=${destination.id}` },
      ],
    };
  }, [selectedHeroItem, destination, selectedStopIds, weather, isOnline]);

  const activeMedallionId = selectedHeroItem
    ? `${selectedHeroItem.kind}:${selectedHeroItem.id}`
    : `dest:${destination.id}`;

  const handleSelectExploreMedallion = useCallback(
    (medId: string) => {
      if (medId.startsWith('dest:')) {
        handleSelectDestination(medId.replace('dest:', ''));
        return;
      }
      const [kind, id] = medId.split(':') as ['attraction' | 'cafe' | 'adventure', string];
      if (kind && id) {
        setSelectedHeroItem({ kind, id });
      }
    },
    []
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F6F0] text-[#142322]">
      <Navbar />

      <main className="flex-1">
        {/* Cinematic Destination Hero for Explore & Plan */}
        <CinematicDestinationHero
          sectionRef={heroSectionRef}
          showcase={exploreHeroShowcase}
          medallions={heroMedallions}
          activeMedallionId={activeMedallionId}
          onSelectMedallion={handleSelectExploreMedallion}
          bottomSurface="#F8F6F0"
        />

        {/* Connected Destination Brief, Live Weather & Tabs Strip */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-20">
          <div className="bg-white border border-[#E5DFD3] rounded-2xl p-5 sm:p-7 shadow-xs space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2 text-sm text-[#5A6664]">
                  <span>Destination Brief · {destination.name}, {destination.state}</span>
                  {!isOnline && (
                    <span className="inline-flex items-center gap-1 text-amber-800 font-medium">
                      <WifiOff className="w-4 h-4" aria-hidden="true" />
                      Offline · {offlineCachedAt ? `Cached ${new Date(offlineCachedAt).toLocaleDateString()}` : 'Local brief'}
                    </span>
                  )}
                </div>
                <p className="text-[15px] text-[#142322] leading-relaxed">
                  <strong>Ground reality:</strong> {destination.groundIntelligence}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <label className="text-sm font-medium text-[#5A6664]">
                  <span className="sr-only">Choose destination</span>
                  <select
                    value={selectedDestId}
                    onChange={(e) => handleSelectDestination(e.target.value)}
                    className="px-3.5 py-2.5 min-h-[44px] rounded-lg bg-[#F8F6F0] border border-[#D7CFC1] text-sm font-semibold text-[#123D3A] focus:outline-none focus:border-[#123D3A] cursor-pointer"
                  >
                    {DESTINATIONS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}, {d.state}
                      </option>
                    ))}
                  </select>
                </label>

                {weather?.current && (
                  <div className="flex items-center gap-2.5 px-3.5 py-2.5 min-h-[44px] rounded-lg bg-[#F8F6F0] border border-[#E5DFD3]">
                    <CloudSun className="w-4 h-4 text-[#E9A34A] shrink-0" aria-hidden="true" />
                    <span className="text-sm font-semibold text-[#123D3A] font-mono tabular-figures">
                      {Math.round(weather.current.temperature_2m)}°C · {weather.current.relative_humidity_2m}% RH
                    </span>
                  </div>
                )}
              </div>
            </div>

            {wikiSummary?.extract && (
              <p className="text-sm text-[#495553] leading-relaxed border-t border-[#E5DFD3] pt-3">
                {wikiSummary.extract}
                {wikiSummary.url && (
                  <>
                    {' '}
                    <a
                      href={wikiSummary.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#123D3A] underline font-medium"
                    >
                      Wikipedia source
                    </a>
                  </>
                )}
              </p>
            )}

            {/* Sub-section Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E5DFD3]">
              {(
                [
                  { id: 'attractions', label: `Must-Visit Places (${destination.attractions.length})` },
                  { id: 'cafes', label: `Cafe Corner (${destination.cafes.length})` },
                  { id: 'adventures', label: `Adventure Picks (${destination.adventures.length})` },
                  { id: 'planner', label: `Budget & Route Order (${orderedSelectedAttractions.length})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 min-h-[42px] rounded-lg text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-[#123D3A] text-white'
                      : 'bg-[#F8F6F0] text-[#495553] hover:bg-[#EAE4D7]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {saveNotice && (
              <div
                role="status"
                className="p-3.5 rounded-lg bg-[#F8F6F0] border border-[#123D3A]/30 text-sm font-medium text-[#123D3A] flex items-center justify-between gap-2"
              >
                <span>{saveNotice}</span>
                {!user && (
                  <Link to="/login" className="underline font-semibold shrink-0">
                    Sign in
                  </Link>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Active Feature Content */}
        <section ref={contentSectionRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* A. MUST-VISIT PLACES */}
          {activeTab === 'attractions' && (
            <div className="space-y-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#123D3A]">
                    Must-Visit Places in {destination.name}
                  </h2>
                  <p className="text-sm sm:text-base text-[#5A6664] mt-1">
                    Click any attraction card for expanded photos, timings, fees, itinerary add, and rides.
                  </p>
                </div>
              </div>

              <RevealGroup key={`attr-${destination.id}`} stagger={STAGGER_STEP} immediate className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {destination.attractions.map((place) => {
                  const saved = isItemSaved(place.id, 'attraction');
                  const inRoute = selectedStopIds.includes(place.id);
                  const isFeatured =
                    selectedHeroItem?.kind === 'attraction' && selectedHeroItem.id === place.id;
                  const openPlaceModal = () =>
                    openDetail({
                      kind: 'place',
                      id: place.id,
                      title: place.name,
                      category: place.category,
                      location: place.location,
                      image: place.image,
                      description: place.shortDescription,
                      fullDescription: place.fullDescription,
                      bestTime: place.bestVisitingTime,
                      openingHours: place.openingHoursVerified
                        ? place.openingHours
                        : `${place.openingHours} (Verify locally)`,
                      entryFee: place.entryFeeVerified ? place.entryFee : 'Verify at ticket counter',
                      destinationId: destination.id,
                      lat: place.lat,
                      lng: place.lng,
                      detailRoute: `/explore/attraction/${place.id}?dest=${destination.id}`,
                      itemTypeForSave: 'attraction',
                      isInItinerary: inRoute,
                      onAddToItinerary: () => toggleStop(place.id),
                      highlights: [place.category, place.sourceNote],
                    });

                  return (
                    <RevealItem key={place.id} className="h-full">
                      <MotionCard
                        hoverLift={-5}
                        onClick={openPlaceModal}
                        onMouseEnter={() => preloadHeroImage(place.image)}
                        className={`group h-full bg-white border rounded-2xl overflow-hidden flex flex-col transition-all duration-300 cursor-pointer ${
                          isFeatured
                            ? 'border-[#123D3A] ring-2 ring-[#E9A34A]/65 shadow-md'
                            : 'border-[#E5DFD3] hover:border-[#123D3A]/45 hover:shadow-xl'
                        }`}
                      >
                        <div className="aspect-[4/3] overflow-hidden bg-[#EAE4D7] relative">
                          <SafeImage
                            src={place.image}
                            alt={place.name}
                            className="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreviewExploreCard('attraction', place.id, place.image);
                            }}
                            className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-[#0D2B29]/85 hover:bg-[#E9A34A] hover:text-[#142322] text-white text-sm font-semibold backdrop-blur-xs transition-colors cursor-pointer"
                          >
                            {isFeatured ? 'Viewing in Hero' : 'Preview in Hero'}
                          </button>
                        </div>
                        <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                          <div>
                            <p className="text-sm text-[#5A6664]">
                              {place.category} <span aria-hidden="true">·</span> {place.location}
                            </p>
                            <h3 className="font-editorial text-2xl font-semibold text-[#123D3A] mt-1 group-hover:text-[#E9A34A] transition-colors">
                              {place.name}
                            </h3>
                            <p className="text-[15px] text-[#495553] mt-2 leading-relaxed">
                              {place.shortDescription}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#E5DFD3]">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleStop(place.id);
                                }}
                                className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                                  inRoute
                                    ? 'bg-[#123D3A] text-white'
                                    : 'border border-[#D7CFC1] text-[#123D3A] hover:bg-[#F8F6F0]'
                                }`}
                              >
                                {inRoute ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                {inRoute ? 'In Route' : 'Add to Route'}
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSavePlace(
                                    place.id,
                                    'attraction',
                                    place.name,
                                    place.location,
                                    place.image,
                                    place.shortDescription
                                  );
                                }}
                                aria-label={saved ? `Unsave ${place.name}` : `Save ${place.name}`}
                                className={`p-2.5 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg border transition-colors cursor-pointer ${
                                  saved
                                    ? 'border-[#E9A34A] bg-[#E9A34A]/15 text-[#123D3A]'
                                    : 'border-[#D7CFC1] text-[#5A6664] hover:text-[#123D3A]'
                                }`}
                              >
                                <Bookmark className="w-4 h-4" fill={saved ? 'currentColor' : 'none'} />
                              </button>
                            </div>

                            <Link
                              to={`/explore/attraction/${place.id}?dest=${destination.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-sm font-semibold text-[#123D3A] hover:text-[#E9A34A]"
                            >
                              Full details
                            </Link>
                          </div>
                        </div>
                      </MotionCard>
                    </RevealItem>
                  );
                })}
              </RevealGroup>
            </div>
          )}

          {/* B. CAFE CORNER (SOLO TRAVELLER EDITORIAL) */}
          {activeTab === 'cafes' && (
            <div className="space-y-8">
              <div className="bg-[#123D3A] text-[#F8F6F0] rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <p className="eyebrow-mono text-[#E9A34A]">CAFE CORNER · SOLO TRAVELLER EDITION</p>
                  <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-white">
                    Quiet tables, honest menus, and welcoming corners in {destination.name}
                  </h2>
                  <p className="text-[15px] text-[#F8F6F0]/80 leading-relaxed">
                    Curated for solo travellers looking for safe stairwells, plug points, scenic perches, and unhurried mornings—never paid directory listings.
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {CAFE_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setCafeTagFilter(tag)}
                      className={`px-3.5 py-2 min-h-[40px] rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                        cafeTagFilter === tag
                          ? 'bg-[#E9A34A] text-[#142322]'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {filteredCafes.length === 0 ? (
                <div className="bg-white border border-[#E5DFD3] rounded-2xl p-8 text-center space-y-2">
                  <p className="text-base font-medium text-[#123D3A]">
                    No cafes matched “{cafeTagFilter}” in {destination.name}.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCafeTagFilter('All')}
                    className="text-sm font-semibold text-[#123D3A] underline cursor-pointer"
                  >
                    Show all cafes
                  </button>
                </div>
              ) : (
                <RevealGroup key={`cafes-${destination.id}-${cafeTagFilter}`} stagger={STAGGER_STEP} immediate className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {filteredCafes.map((cafe) => {
                    const saved = isItemSaved(cafe.id, 'cafe');
                    const isFeatured =
                      selectedHeroItem?.kind === 'cafe' && selectedHeroItem.id === cafe.id;
                    const openCafeModal = () =>
                      openDetail({
                        kind: 'place',
                        id: cafe.id,
                        title: cafe.name,
                        category: `Cafe Corner · ${cafe.setting}`,
                        location: cafe.location,
                        image: cafe.image,
                        description: cafe.shortDescription,
                        fullDescription: cafe.soloTravellerNote || cafe.fullDescription,
                        openingHours:
                          cafe.hoursVerified && cafe.openingHours
                            ? cafe.openingHours
                            : 'Hours unverified — check locally',
                        priceRange: cafe.priceRange || cafe.priceSource,
                        destinationId: destination.id,
                        lat: cafe.lat,
                        lng: cafe.lng,
                        mapsUrl: cafe.mapsQueryUrl,
                        detailRoute: `/explore/cafe/${cafe.id}?dest=${destination.id}`,
                        itemTypeForSave: 'cafe',
                        highlights: cafe.tags,
                      });

                    return (
                      <RevealItem key={cafe.id} className="h-full">
                        <MotionCard
                          hoverLift={-5}
                          onClick={openCafeModal}
                          onMouseEnter={() => preloadHeroImage(cafe.image)}
                          className={`group h-full bg-white border rounded-2xl overflow-hidden flex flex-col transition-all duration-300 cursor-pointer ${
                            isFeatured
                              ? 'border-[#123D3A] ring-2 ring-[#E9A34A]/65 shadow-md'
                              : 'border-[#E5DFD3] hover:border-[#123D3A]/45 hover:shadow-xl'
                          }`}
                        >
                          <div className="aspect-[4/3] overflow-hidden relative bg-[#EAE4D7]">
                            <SafeImage
                              src={cafe.image}
                              alt={`${cafe.name} — ${cafe.setting}`}
                              className="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePreviewExploreCard('cafe', cafe.id, cafe.image);
                              }}
                              className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-[#0D2B29]/85 hover:bg-[#E9A34A] hover:text-[#142322] text-white text-sm font-semibold backdrop-blur-xs transition-colors cursor-pointer"
                            >
                              {isFeatured ? 'Viewing in Hero' : 'Preview in Hero'}
                            </button>
                          </div>
                          <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                            <div className="space-y-2">
                              <p className="text-sm text-[#5A6664]">
                                {cafe.setting} <span aria-hidden="true">·</span> {cafe.location}
                              </p>
                              <h3 className="font-editorial text-2xl font-semibold text-[#123D3A] group-hover:text-[#E9A34A] transition-colors">
                                {cafe.name}
                              </h3>
                              <p className="text-[15px] text-[#495553] leading-relaxed">
                                {cafe.shortDescription}
                              </p>
                              <p className="text-sm text-[#123D3A] font-medium pt-1">
                                {cafe.tags.join(' · ')}
                              </p>
                            </div>

                            <div className="space-y-3 pt-3 border-t border-[#E5DFD3]">
                              <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[#5A6664]">
                                <span>
                                  {cafe.priceRange ? `${cafe.priceRange} (${cafe.priceSource})` : 'Menu price not listed'}
                                </span>
                                <span>
                                  {cafe.hoursVerified && cafe.openingHours
                                    ? cafe.openingHours
                                    : 'Hours unverified'}
                                </span>
                              </div>

                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <a
                                    href={cafe.mapsQueryUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-lg bg-[#123D3A] text-white text-sm font-semibold hover:bg-[#194E4A] transition-colors"
                                  >
                                    Directions
                                    <ExternalLink className="w-4 h-4" aria-hidden="true" />
                                  </a>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSavePlace(
                                        cafe.id,
                                        'cafe',
                                        cafe.name,
                                        cafe.location,
                                        cafe.image,
                                        cafe.shortDescription
                                      );
                                    }}
                                    aria-label={saved ? `Unsave ${cafe.name}` : `Save ${cafe.name}`}
                                    className={`p-2.5 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg border transition-colors cursor-pointer ${
                                      saved
                                        ? 'border-[#E9A34A] bg-[#E9A34A]/15 text-[#123D3A]'
                                        : 'border-[#D7CFC1] text-[#5A6664] hover:text-[#123D3A]'
                                    }`}
                                  >
                                    <Bookmark className="w-4 h-4" fill={saved ? 'currentColor' : 'none'} />
                                  </button>
                                </div>
                                <Link
                                  to={`/explore/cafe/${cafe.id}?dest=${destination.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-sm font-semibold text-[#123D3A] hover:text-[#E9A34A]"
                                >
                                  Read solo guide
                                </Link>
                              </div>
                            </div>
                          </div>
                        </MotionCard>
                      </RevealItem>
                    );
                  })}
                </RevealGroup>
              )}
            </div>
          )}

          {/* C. ADVENTURE PICKS */}
          {activeTab === 'adventures' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#123D3A]">
                  Adventure Picks around {destination.name}
                </h2>
                <p className="text-sm sm:text-base text-[#5A6664] mt-1">
                  Transparent tariff ranges, seasonal windows, and mandatory safety checks.
                </p>
              </div>

              <RevealGroup key={`adv-${destination.id}`} stagger={STAGGER_STEP} immediate className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {destination.adventures.map((adv) => {
                  const saved = isItemSaved(adv.id, 'adventure');
                  const isFeatured =
                    selectedHeroItem?.kind === 'adventure' && selectedHeroItem.id === adv.id;
                  const openAdvModal = () =>
                    openDetail({
                      kind: 'place',
                      id: adv.id,
                      title: adv.name,
                      category: `Adventure · ${adv.activityType}`,
                      location: adv.location,
                      image: adv.image,
                      description: adv.shortDescription,
                      fullDescription: adv.fullDescription,
                      bestTime: `${adv.duration} · ${adv.seasonWindow}`,
                      priceRange: adv.approxCost || 'Check operator tariff',
                      destinationId: destination.id,
                      lat: adv.lat,
                      lng: adv.lng,
                      detailRoute: `/explore/adventure/${adv.id}?dest=${destination.id}`,
                      itemTypeForSave: 'adventure',
                      highlights: [
                        `Age: ${adv.ageRequirement}`,
                        adv.safetyRequirements,
                        adv.costBasis,
                      ],
                    });

                  return (
                    <RevealItem key={adv.id} className="h-full">
                      <MotionCard
                        hoverLift={-5}
                        onClick={openAdvModal}
                        onMouseEnter={() => preloadHeroImage(adv.image)}
                        className={`group h-full bg-white border rounded-2xl overflow-hidden flex flex-col transition-all duration-300 cursor-pointer ${
                          isFeatured
                            ? 'border-[#123D3A] ring-2 ring-[#E9A34A]/65 shadow-md'
                            : 'border-[#E5DFD3] hover:border-[#123D3A]/45 hover:shadow-xl'
                        }`}
                      >
                        <div className="aspect-[4/3] overflow-hidden bg-[#EAE4D7] relative">
                          <SafeImage
                            src={adv.image}
                            alt={adv.name}
                            className="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreviewExploreCard('adventure', adv.id, adv.image);
                            }}
                            className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-[#0D2B29]/85 hover:bg-[#E9A34A] hover:text-[#142322] text-white text-sm font-semibold backdrop-blur-xs transition-colors cursor-pointer"
                          >
                            {isFeatured ? 'Viewing in Hero' : 'Preview in Hero'}
                          </button>
                        </div>
                        <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-2">
                            <p className="text-sm text-[#5A6664]">
                              {adv.activityType} <span aria-hidden="true">·</span> {adv.duration}{' '}
                              <span aria-hidden="true">·</span> {adv.seasonWindow}
                            </p>
                            <h3 className="font-editorial text-2xl font-semibold text-[#123D3A] group-hover:text-[#E9A34A] transition-colors">
                              {adv.name}
                            </h3>
                            <p className="text-[15px] text-[#495553] leading-relaxed">
                              {adv.shortDescription}
                            </p>
                            <p className="text-sm text-[#142322] bg-[#F8F6F0] border border-[#E5DFD3] rounded-lg p-3">
                              <strong>Safety &amp; Age ({adv.ageRequirement}):</strong> {adv.safetyRequirements}
                            </p>
                          </div>

                          <div className="pt-3 border-t border-[#E5DFD3] flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-mono font-semibold text-[#123D3A]">
                                {adv.approxCost || 'Check operator tariff'}
                              </p>
                              <p className="text-sm text-[#5A6664]">{adv.costBasis}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSavePlace(
                                    adv.id,
                                    'adventure',
                                    adv.name,
                                    adv.location,
                                    adv.image,
                                    adv.shortDescription
                                  );
                                }}
                                aria-label={saved ? `Unsave ${adv.name}` : `Save ${adv.name}`}
                                className={`p-2.5 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg border transition-colors cursor-pointer ${
                                  saved
                                    ? 'border-[#E9A34A] bg-[#E9A34A]/15 text-[#123D3A]'
                                    : 'border-[#D7CFC1] text-[#5A6664] hover:text-[#123D3A]'
                                }`}
                              >
                                <Bookmark className="w-4 h-4" fill={saved ? 'currentColor' : 'none'} />
                              </button>
                              <Link
                                to={`/explore/adventure/${adv.id}?dest=${destination.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="px-4 py-2.5 min-h-[40px] inline-flex items-center rounded-lg bg-[#123D3A] text-white text-sm font-semibold hover:bg-[#194E4A] transition-colors"
                              >
                                Activity details
                              </Link>
                            </div>
                          </div>
                        </div>
                      </MotionCard>
                    </RevealItem>
                  );
                })}
              </RevealGroup>
            </div>
          )}

          {/* D & E & F: SMART SIGHTSEEING BUDGET, SMART ROUTE ORDERING & OFFLINE SAVE */}
          {activeTab === 'planner' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-6 space-y-6">
                {/* Pickup source selection */}
                <div className="bg-white border border-[#E5DFD3] rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-editorial text-xl font-semibold text-[#123D3A]">
                      1. Starting Pickup Location
                    </h2>
                    <Compass className="w-4 h-4 text-[#E9A34A]" aria-hidden="true" />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPickupMode('hub');
                        const hub = destination.arrivalHubs[0];
                        setPickupLabel(hub.name);
                        setPickupCoords({ lat: hub.lat, lng: hub.lng });
                      }}
                      className={`px-3.5 py-2 rounded-lg text-sm font-semibold cursor-pointer ${
                        pickupMode === 'hub'
                          ? 'bg-[#123D3A] text-white'
                          : 'bg-[#F8F6F0] text-[#495553]'
                      }`}
                    >
                      Arrival Hub
                    </button>
                    {destination.stays[0] && (
                      <button
                        type="button"
                        onClick={() => {
                          setPickupMode('stay');
                          const stay = destination.stays[0];
                          setPickupLabel(stay.name);
                          setPickupCoords({ lat: stay.lat, lng: stay.lng });
                        }}
                        className={`px-3.5 py-2 rounded-lg text-sm font-semibold cursor-pointer ${
                          pickupMode === 'stay'
                            ? 'bg-[#123D3A] text-white'
                            : 'bg-[#F8F6F0] text-[#495553]'
                        }`}
                      >
                        Selected Stay ({destination.stays[0].name})
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setPickupMode('custom')}
                      className={`px-3.5 py-2 rounded-lg text-sm font-semibold cursor-pointer ${
                        pickupMode === 'custom'
                          ? 'bg-[#123D3A] text-white'
                          : 'bg-[#F8F6F0] text-[#495553]'
                      }`}
                    >
                      Custom Point
                    </button>
                  </div>

                  <input
                    type="text"
                    value={pickupLabel}
                    onChange={(e) => setPickupLabel(e.target.value)}
                    aria-label="Pickup point label"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#F8F6F0] border border-[#D7CFC1] text-sm"
                  />
                </div>

                {/* Selected attractions & reorder controls */}
                <div className="bg-white border border-[#E5DFD3] rounded-xl p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-editorial text-xl font-semibold text-[#123D3A]">
                      2. Sequence Attractions
                    </h2>
                    <button
                      type="button"
                      onClick={() => computeSightseeingPlan(true)}
                      disabled={planLoading || orderedSelectedAttractions.length === 0}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#F8F6F0] border border-[#D7CFC1] text-sm font-semibold text-[#123D3A] hover:bg-[#EAE4D7] disabled:opacity-50 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-[#E9A34A]" aria-hidden="true" />
                      Suggest Geographic Order
                    </button>
                  </div>

                  {/* Available attractions to toggle */}
                  <div className="flex flex-wrap gap-2">
                    {destination.attractions.map((attr) => {
                      const active = selectedStopIds.includes(attr.id);
                      return (
                        <button
                          key={attr.id}
                          type="button"
                          onClick={() => toggleStop(attr.id)}
                          className={`px-3.5 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                            active
                              ? 'border-[#123D3A] bg-[#123D3A]/5 text-[#123D3A]'
                              : 'border-[#E5DFD3] text-[#5A6664]'
                          }`}
                        >
                          {active ? '✓ ' : '+ '}
                          {attr.name}
                        </button>
                      );
                    })}
                  </div>

                  {orderedSelectedAttractions.length === 0 ? (
                    <p className="text-sm text-[#5A6664] py-4">
                      Select one or more attractions above to compute sightseeing distance and transport budget.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {orderedSelectedAttractions.map((stop, idx) => (
                        <div
                          key={stop.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[#F8F6F0] border border-[#E5DFD3]"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-7 h-7 rounded-full bg-[#123D3A] text-white text-sm font-mono flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[#142322] truncate">{stop.name}</p>
                              <p className="text-sm text-[#5A6664] truncate">{stop.location}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => moveStop(idx, -1)}
                              disabled={idx === 0}
                              aria-label={`Move ${stop.name} up`}
                              className="p-2 rounded hover:bg-[#EAE4D7] disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveStop(idx, 1)}
                              disabled={idx === orderedSelectedAttractions.length - 1}
                              aria-label={`Move ${stop.name} down`}
                              className="p-2 rounded hover:bg-[#EAE4D7] disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleStop(stop.id)}
                              aria-label={`Remove ${stop.name}`}
                              className="p-2 rounded text-red-700 hover:bg-red-50 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => computeSightseeingPlan(false)}
                      disabled={planLoading || orderedSelectedAttractions.length === 0}
                      className="px-5 py-2.5 min-h-[44px] rounded-lg bg-[#E9A34A] text-[#142322] text-sm font-semibold hover:bg-[#df9538] disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
                    >
                      {planLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      Calculate Budget &amp; Route
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveRoute}
                      disabled={orderedSelectedAttractions.length === 0}
                      className="px-4 py-2.5 min-h-[44px] rounded-lg border border-[#123D3A] text-[#123D3A] text-sm font-semibold hover:bg-[#123D3A]/5 disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Route className="w-4 h-4" />
                      Save Route Offline
                    </button>
                  </div>
                </div>

                {/* Smart Sightseeing Budget Breakdown */}
                {planResult && (
                  <div className="bg-white border border-[#E5DFD3] rounded-xl p-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-editorial text-xl font-semibold text-[#123D3A]">
                        Sightseeing Transport Budget
                      </h3>
                      <span className="text-sm font-mono text-[#5A6664]">
                        {planResult.quoteType} · Updated {new Date(planResult.lastUpdated).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-[#F8F6F0] rounded-lg p-3">
                        <p className="text-sm text-[#5A6664]">Total Distance</p>
                        <p className="font-mono text-lg font-semibold text-[#123D3A] tabular-figures">
                          {planResult.totals.totalDistanceKm} km
                        </p>
                      </div>
                      <div className="bg-[#F8F6F0] rounded-lg p-3">
                        <p className="text-sm text-[#5A6664]">Auto Estimate</p>
                        <p className="font-mono text-lg font-semibold text-[#123D3A] tabular-figures">
                          ₹{planResult.totals.totalAutoInr}
                        </p>
                      </div>
                      <div className="bg-[#F8F6F0] rounded-lg p-3">
                        <p className="text-sm text-[#5A6664]">Cab Estimate</p>
                        <p className="font-mono text-lg font-semibold text-[#123D3A] tabular-figures">
                          ₹{planResult.totals.totalCabInr}
                        </p>
                      </div>
                    </div>

                    <div className="divide-y divide-[#E5DFD3] text-sm">
                      {planResult.legs.map((leg) => (
                        <div key={leg.stopId} className="py-3 flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <p className="font-semibold text-[#123D3A] truncate">{leg.attractionName}</p>
                            <p className="text-sm text-[#5A6664] truncate">
                              From {leg.fromLabel} · {leg.distanceKm} km · ~{leg.durationMin} mins
                            </p>
                          </div>
                          <div className="text-right font-mono text-sm tabular-figures shrink-0">
                            <p className="font-semibold text-[#123D3A]">Auto ~₹{leg.autoEstimateInr}</p>
                            <p className="text-[#5A6664]">Cab ~₹{leg.cabEstimateInr}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Map Column */}
              <div className="lg:col-span-6">
                <div className="bg-white border border-[#E5DFD3] rounded-xl p-5 space-y-3 lg:sticky lg:top-20">
                  <div className="flex items-center justify-between">
                    <h3 className="font-editorial text-lg font-semibold text-[#123D3A] flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#E9A34A]" aria-hidden="true" />
                      Multi-Stop Route Map
                    </h3>
                    <span className="text-sm text-[#5A6664]">
                      {routeMapStops.length} waypoints
                    </span>
                  </div>
                  <GoogleRouteMap stops={routeMapStops} heightClass="h-[460px]" showRouteLine />
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
