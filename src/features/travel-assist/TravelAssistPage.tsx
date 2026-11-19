import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  ArrowUpDown,
  Clock,
  Compass,
  Crosshair,
  ExternalLink,
  IndianRupee,
  Loader2,
  Map as MapIcon,
  MapPin,
  Navigation,
  Route,
  Search,
  Sparkles,
  Volume2,
  X,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { MotionCard } from '../../components/MotionCard';
import { Reveal, RevealGroup, RevealItem } from '../../components/Reveal';
import { GoogleRouteMap } from '../../components/GoogleRouteMap';
import { SafeImage } from '../../components/SafeImage';
import { IMAGES } from '../../data/destinations';
import { STAGGER_CARDS_MS } from '../../motion/tokens';
import type { SharedJourney, SmartHopPlace } from './smartHopTypes';
import {
  createJourneyId,
  JOURNEY_TTL_MS,
  loadSharedJourney,
  readPlannerDraft,
  saveSharedJourney,
  writePlannerDraft,
} from './travelAssistSession';

interface PlaceSuggestion {
  id: string;
  label: string;
  subtitle: string;
  city: string;
  state: string;
  stationCode?: string;
  placeType: string;
  lat: number;
  lng: number;
  groundTip?: string;
  source: string;
}

const FROM_CATEGORIES: Array<{ label: string; kind: string }> = [
  { label: 'All', kind: 'all' },
  { label: 'Railway Station', kind: 'station' },
  { label: 'Bus Stand', kind: 'bus' },
  { label: 'Airport', kind: 'airport' },
  { label: 'Hotel', kind: 'hotel' },
  { label: 'Temple', kind: 'temple' },
  { label: 'Landmark', kind: 'landmark' },
  { label: 'Market', kind: 'market' },
  { label: 'Custom Address', kind: 'address' },
];

const TO_CATEGORIES: Array<{ label: string; kind: string }> = [
  { label: 'All', kind: 'all' },
  { label: 'Temple', kind: 'temple' },
  { label: 'Beach', kind: 'beach' },
  { label: 'Market', kind: 'market' },
  { label: 'Tourist Attraction', kind: 'attraction' },
  { label: 'Hotel', kind: 'hotel' },
  { label: 'Railway Station', kind: 'station' },
  { label: 'Bus Stand', kind: 'bus' },
  { label: 'Airport', kind: 'airport' },
  { label: 'Custom Address', kind: 'address' },
];

const QUICK_SAMPLE_ROUTES: Array<{
  label: string;
  origin: SmartHopPlace;
  destination: SmartHopPlace;
}> = [
  {
    label: 'Puri Station → Jagannath Temple',
    origin: {
      id: 'puri-rs',
      label: 'Puri Railway Station (PURI)',
      city: 'Puri',
      state: 'Odisha',
      lat: 19.8077,
      lng: 85.8394,
      placeType: 'Railway Station',
      source: 'Indian Transit Index',
    },
    destination: {
      id: 'puri-jagannath',
      label: 'Shri Jagannath Temple',
      city: 'Puri',
      state: 'Odisha',
      lat: 19.8049,
      lng: 85.8179,
      placeType: 'Heritage Temple',
      source: 'Regional Landmark Directory',
    },
  },
  {
    label: 'Katra Station → Banganga Deodi',
    origin: {
      id: 'svdk-rs',
      label: 'Shri Mata Vaishno Devi Katra Railway Station (SVDK)',
      city: 'Katra',
      state: 'Jammu and Kashmir',
      lat: 32.9813,
      lng: 74.9498,
      placeType: 'Railway Station',
      source: 'Indian Transit Index',
    },
    destination: {
      id: 'katra-banganga',
      label: 'Banganga Darshani Deodi (Vaishno Devi Yatra Gate)',
      city: 'Katra',
      state: 'Jammu and Kashmir',
      lat: 32.9977,
      lng: 74.9347,
      placeType: 'Yatra Entrance Gate',
      source: 'Regional Landmark Directory',
    },
  },
  {
    label: 'Varanasi Jn → Kashi Vishwanath',
    origin: {
      id: 'bsb-rs',
      label: 'Varanasi Junction Railway Station (BSB)',
      city: 'Varanasi',
      state: 'Uttar Pradesh',
      lat: 25.3267,
      lng: 82.9862,
      placeType: 'Railway Station',
      source: 'Indian Transit Index',
    },
    destination: {
      id: 'vns-kashi',
      label: 'Kashi Vishwanath Temple',
      city: 'Varanasi',
      state: 'Uttar Pradesh',
      lat: 25.3109,
      lng: 83.0107,
      placeType: 'Heritage Temple',
      source: 'Regional Landmark Directory',
    },
  },
  {
    label: 'Jaipur Jn → Hawa Mahal',
    origin: {
      id: 'jp-rs',
      label: 'Jaipur Junction Railway Station (JP)',
      city: 'Jaipur',
      state: 'Rajasthan',
      lat: 26.9196,
      lng: 75.7878,
      placeType: 'Railway Station',
      source: 'Indian Transit Index',
    },
    destination: {
      id: 'jpr-hawa-mahal',
      label: 'Hawa Mahal',
      city: 'Jaipur',
      state: 'Rajasthan',
      lat: 26.9239,
      lng: 75.8267,
      placeType: 'Heritage Palace',
      source: 'Regional Landmark Directory',
    },
  },
];

function suggestionToPlace(s: PlaceSuggestion): SmartHopPlace {
  return {
    id: s.id,
    label: s.label,
    city: s.city,
    state: s.state,
    lat: s.lat,
    lng: s.lng,
    placeType: s.placeType,
    groundTip: s.groundTip,
    source: s.source,
  };
}

export function TravelAssistPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const journeyIdParam = searchParams.get('j');

  const [originKind, setOriginKind] = useState<string>('all');
  const [originQuery, setOriginQuery] = useState<string>('');
  const [originPlace, setOriginPlace] = useState<SmartHopPlace | null>(null);
  const [originSuggestions, setOriginSuggestions] = useState<PlaceSuggestion[]>([]);
  const [originOpen, setOriginOpen] = useState(false);
  const [originSearching, setOriginSearching] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const [destKind, setDestKind] = useState<string>('all');
  const [destQuery, setDestQuery] = useState<string>('');
  const [destPlace, setDestPlace] = useState<SmartHopPlace | null>(null);
  const [destSuggestions, setDestSuggestions] = useState<PlaceSuggestion[]>([]);
  const [destOpen, setDestOpen] = useState(false);
  const [destSearching, setDestSearching] = useState(false);

  const [swappedCount, setSwappedCount] = useState(0);
  const [routeLoading, setRouteLoading] = useState(false);
  const [plannerError, setPlannerError] = useState<string | null>(null);
  const [sharedJourney, setSharedJourney] = useState<SharedJourney | null>(null);
  const [showRouteMap, setShowRouteMap] = useState(false);
  const [popupFallback, setPopupFallback] = useState<{
    cardId: 'fare' | 'timing' | 'pitstops';
    url: string;
  } | null>(null);

  const originWrapRef = useRef<HTMLDivElement>(null);
  const destWrapRef = useRef<HTMLDivElement>(null);
  const plannerSectionRef = useRef<HTMLElement>(null);

  // Hydrate existing shared journey (if returning via ?j=<id> or recent valid journey in localStorage)
  useEffect(() => {
    const loaded = loadSharedJourney(journeyIdParam);
    if (loaded.journey) {
      setSharedJourney(loaded.journey);
      setOriginPlace(loaded.journey.origin);
      setOriginQuery(loaded.journey.origin.label);
      setDestPlace(loaded.journey.destination);
      setDestQuery(loaded.journey.destination.label);
      return;
    }

    const draft = readPlannerDraft();
    if (draft) {
      if (draft.originCategory) setOriginKind(draft.originCategory);
      if (draft.originQuery) setOriginQuery(draft.originQuery);
      if (draft.originPlace) setOriginPlace(draft.originPlace);
      if (draft.destCategory) setDestKind(draft.destCategory);
      if (draft.destQuery) setDestQuery(draft.destQuery);
      if (draft.destPlace) setDestPlace(draft.destPlace);
    }
  }, [journeyIdParam]);

  // Persist planner draft locally
  useEffect(() => {
    writePlannerDraft({
      originCategory: originKind,
      originQuery,
      originPlace,
      destCategory: destKind,
      destQuery,
      destPlace,
    });
  }, [originKind, originQuery, originPlace, destKind, destQuery, destPlace]);

  // Close autocomplete popovers on outside click
  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (originWrapRef.current && !originWrapRef.current.contains(e.target as Node)) {
        setOriginOpen(false);
      }
      if (destWrapRef.current && !destWrapRef.current.contains(e.target as Node)) {
        setDestOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const fetchSuggestions = useCallback(
    async (
      query: string,
      kind: string,
      biasPlace: SmartHopPlace | null,
      signal: AbortSignal
    ): Promise<PlaceSuggestion[]> => {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      params.set('kind', kind || 'all');
      if (biasPlace) {
        params.set('biasLat', String(biasPlace.lat));
        params.set('biasLng', String(biasPlace.lng));
        if (biasPlace.state) params.set('state', biasPlace.state);
      }
      const res = await fetch(`/api/places/suggest?${params.toString()}`, { signal });
      if (!res.ok) return [];
      const data = (await res.json()) as { suggestions?: PlaceSuggestion[] };
      return Array.isArray(data.suggestions) ? data.suggestions : [];
    },
    []
  );

  // Live FROM autocomplete
  useEffect(() => {
    if (!originOpen) return;
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setOriginSearching(true);
      try {
        const list = await fetchSuggestions(originQuery, originKind, destPlace, ctrl.signal);
        setOriginSuggestions(list);
      } catch {
        // Ignore aborted fetches
      } finally {
        setOriginSearching(false);
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [originQuery, originKind, originOpen, destPlace, fetchSuggestions]);

  // Live TO autocomplete
  useEffect(() => {
    if (!destOpen) return;
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setDestSearching(true);
      try {
        const list = await fetchSuggestions(destQuery, destKind, originPlace, ctrl.signal);
        setDestSuggestions(list);
      } catch {
        // Ignore aborted fetches
      } finally {
        setDestSearching(false);
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [destQuery, destKind, destOpen, originPlace, fetchSuggestions]);

  const handleUseCurrentLocation = () => {
    setPlannerError(null);
    if (!navigator.geolocation) {
      setPlannerError('Browser location is not supported on this device. Please select a starting place from the suggestions.');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        let resolvedLabel = `Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        let resolvedCity = '';
        let resolvedState = '';

        try {
          const ctrl = new AbortController();
          const nearby = await fetchSuggestions('', 'all', {
            label: resolvedLabel,
            city: '',
            state: '',
            lat,
            lng,
          }, ctrl.signal);
          if (nearby.length > 0) {
            resolvedCity = nearby[0].city;
            resolvedState = nearby[0].state;
            resolvedLabel = `Current Location · Near ${nearby[0].city || nearby[0].label}`;
          }
        } catch {
          // Keep coordinate label cleanly
        }

        const gpsPlace: SmartHopPlace = {
          id: 'current-gps',
          label: resolvedLabel,
          city: resolvedCity,
          state: resolvedState,
          lat,
          lng,
          placeType: 'Current Location',
          source: 'Device GPS',
        };
        setOriginPlace(gpsPlace);
        setOriginQuery(gpsPlace.label);
        setOriginOpen(false);
        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        setPlannerError(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission was declined. Please choose a starting station, stand, or landmark from the dropdown.'
            : 'Could not read your GPS coordinates right now. Please select a place from the suggestions.'
        );
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSwap = () => {
    setSwappedCount((c) => c + 1);
    const prevOriginPlace = originPlace;
    const prevOriginQuery = originQuery;
    setOriginPlace(destPlace);
    setOriginQuery(destQuery);
    setDestPlace(prevOriginPlace);
    setDestQuery(prevOriginQuery);
    setPlannerError(null);
  };

  const runRouteCalculation = async (resolvedOrigin: SmartHopPlace, resolvedDest: SmartHopPlace) => {
    setRouteLoading(true);
    setPlannerError(null);
    setPopupFallback(null);

    try {
      const res = await fetch('/api/smart-hop/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: resolvedOrigin,
          destination: resolvedDest,
        }),
      });
      const data = (await res.json()) as {
        routeAvailable?: boolean;
        error?: string;
        origin?: SmartHopPlace;
        destination?: SmartHopPlace;
        city?: string;
        state?: string;
        distanceKm?: number;
        durationMinutes?: number;
        trafficAwareDurationMinutes?: number | null;
        isTrafficAware?: boolean;
        routeSource?: string;
        trafficSourceLabel?: string;
        routeGeometry?: Array<{ lat: number; lng: number }>;
        routeTimestamp?: string;
      };

      if (!res.ok || !data.routeAvailable || typeof data.distanceKm !== 'number' || typeof data.durationMinutes !== 'number') {
        setPlannerError(
          data.error ||
            'Road routing is currently unavailable for these points. No distance or fare has been guessed.'
        );
        return;
      }

      const now = Date.now();
      const journey: SharedJourney = {
        journeyId: createJourneyId(),
        origin: { ...resolvedOrigin, ...(data.origin || {}) },
        destination: { ...resolvedDest, ...(data.destination || {}) },
        city: data.city || resolvedDest.city || resolvedOrigin.city || '',
        state: data.state || resolvedDest.state || resolvedOrigin.state || '',
        distanceKm: data.distanceKm,
        durationMinutes: data.durationMinutes,
        trafficAwareDurationMinutes: data.trafficAwareDurationMinutes ?? null,
        isTrafficAware: Boolean(data.isTrafficAware),
        routeSource: data.routeSource || 'OSRM Road Routing',
        trafficSourceLabel:
          data.trafficSourceLabel || 'Route estimate without live traffic data',
        routeGeometry: Array.isArray(data.routeGeometry) ? data.routeGeometry : [],
        routeTimestamp: data.routeTimestamp || new Date(now).toISOString(),
        createdAt: now,
        expiresAt: now + JOURNEY_TTL_MS,
      };

      saveSharedJourney(journey);
      setSharedJourney(journey);
      setSearchParams({ j: journey.journeyId }, { replace: true });
    } catch {
      setPlannerError(
        'Unable to reach the routing service right now. Please check your connection and try again.'
      );
    } finally {
      setRouteLoading(false);
    }
  };

  const resolveTypedPlaceFromApi = async (
    query: string,
    kind: string,
    biasPlace: SmartHopPlace | null
  ): Promise<SmartHopPlace | null> => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return null;
    try {
      const ctrl = new AbortController();
      const matches = await fetchSuggestions(trimmed, kind, biasPlace, ctrl.signal);
      if (matches.length === 0) return null;
      return suggestionToPlace(matches[0]);
    } catch {
      return null;
    }
  };

  const handleExploreJourney = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlannerError(null);

    let activeOrigin = originPlace;
    let activeDest = destPlace;

    if (!activeOrigin && originQuery.trim()) {
      const foundOrigin = await resolveTypedPlaceFromApi(originQuery, originKind, activeDest);
      if (foundOrigin) {
        activeOrigin = foundOrigin;
        setOriginPlace(foundOrigin);
        setOriginQuery(foundOrigin.label);
      }
    }

    if (!activeDest && destQuery.trim()) {
      const foundDest = await resolveTypedPlaceFromApi(destQuery, destKind, activeOrigin);
      if (foundDest) {
        activeDest = foundDest;
        setDestPlace(foundDest);
        setDestQuery(foundDest.label);
      }
    }

    if (!activeOrigin) {
      setPlannerError(
        originQuery.trim()
          ? `Could not resolve "${originQuery.trim()}" to real coordinates. Choose a suggestion from the FROM dropdown or use Current Location.`
          : 'Please choose your FROM starting point from the suggestions or use Current Location.'
      );
      return;
    }

    if (!activeDest) {
      setPlannerError(
        destQuery.trim()
          ? `Could not resolve "${destQuery.trim()}" to real coordinates. Choose a suggestion from the TO dropdown or enter a clearer landmark/city.`
          : 'Please choose your TO destination from the suggestions.'
      );
      return;
    }

    await runRouteCalculation(activeOrigin, activeDest);
  };

  const handleSelectQuickSample = async (sample: (typeof QUICK_SAMPLE_ROUTES)[number]) => {
    setOriginPlace(sample.origin);
    setOriginQuery(sample.origin.label);
    setDestPlace(sample.destination);
    setDestQuery(sample.destination.label);
    setOriginOpen(false);
    setDestOpen(false);
    await runRouteCalculation(sample.origin, sample.destination);
  };

  const handleOpenFeatureTab = (cardId: 'fare' | 'timing' | 'pitstops') => {
    if (!sharedJourney) {
      setPlannerError(
        'First choose your FROM and TO places above and click "Explore Journey" so all three tools share your route.'
      );
      plannerSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Re-persist to guarantee fresh cross-tab localStorage payload
    saveSharedJourney(sharedJourney);
    const targetUrl = `/travel-assist/${cardId}?j=${encodeURIComponent(sharedJourney.journeyId)}`;
    const opened = window.open(targetUrl, '_blank', 'noopener,noreferrer');
    if (!opened || opened.closed || typeof opened.closed === 'undefined') {
      setPopupFallback({ cardId, url: targetUrl });
    } else {
      setPopupFallback(null);
    }
  };

  const activeDuration =
    sharedJourney?.trafficAwareDurationMinutes ?? sharedJourney?.durationMinutes ?? null;

  const featureCards: Array<{
    id: 'fare' | 'timing' | 'pitstops';
    num: string;
    title: string;
    subtitle: string;
    image: string;
    imageAlt: string;
    icon: typeof IndianRupee;
    ctaLabel: string;
    liveSummary: string;
    highlights: string[];
  }> = [
    {
      id: 'fare',
      num: '01',
      title: 'Fair Fare & Local Voice Pass',
      subtitle:
        'Understand reasonable Auto/E-Rickshaw, Cab, and Bike fare ranges for your route and speak politely with drivers in the local language.',
      image: IMAGES.vehicleAutoRickshaw,
      imageAlt: 'Indian local auto-rickshaw transport along a sunlit street',
      icon: IndianRupee,
      ctaLabel: 'Open Fair Fare & Voice Pass',
      liveSummary: sharedJourney
        ? `Ready for ${sharedJourney.distanceKm} km in ${sharedJourney.city || sharedJourney.state || 'this corridor'}`
        : 'Transparent regional fare bands + Hindi, Odia, Tamil & more voice scripts',
      highlights: ['Range + tariff formula breakdown', 'Curated local stand tips', 'Speak / Copy Voice Pass'],
    },
    {
      id: 'timing',
      num: '02',
      title: 'Timing & Crowd Clock',
      subtitle:
        'Calculate arrival windows with walk, parking, and darshan buffers against closing hours, sunset cutoffs, or return train/bus departures.',
      image: IMAGES.jagannathTemple,
      imageAlt: 'Historic Indian temple spire during evening darshan light',
      icon: Clock,
      ctaLabel: 'Open Timing & Crowd Clock',
      liveSummary:
        sharedJourney && activeDuration !== null
          ? `~${activeDuration} min transit + customizable buffers (${sharedJourney.isTrafficAware ? 'traffic-aware' : 'road estimate'})`
          : 'SAFE / HURRY / RISK deadline status + return departure countdown',
      highlights: ['Opening & closing hours check', 'User return train/bus planner', 'Honest crowd data status'],
    },
    {
      id: 'pitstops',
      num: '03',
      title: 'Zero-Detour En-route Pitstops',
      subtitle:
        'Discover washrooms, pure-veg eateries, local food, ATMs, pharmacies, and cloakrooms along your actual route corridor with real detour checks.',
      image: IMAGES.cafeRooftop,
      imageAlt: 'Local Indian cafe and pitstop spot on a scenic travel corridor',
      icon: Compass,
      ctaLabel: 'Open En-route Pitstops',
      liveSummary: sharedJourney
        ? `Scans ${sharedJourney.distanceKm} km corridor geometry in route order`
        : 'Route-ordered stops + actual road detour measurement',
      highlights: ['6 essential traveler categories', 'Real road-detour calculation', 'Direct Google Maps link'],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F6F0] text-[#142322]">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* Compact Editorial Header — immediately surfaces the planner without an oversized decorative hero */}
        <Reveal immediate className="max-w-3xl space-y-2.5">
          <p className="eyebrow-mono font-semibold text-[#123D3A] flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#E9A34A]" aria-hidden="true" />
            <span>TRAVEL ASSIST · GROUND-LEVEL ROUTE INTELLIGENCE</span>
          </p>
          <h1 className="font-editorial text-4xl sm:text-5xl font-semibold text-[#142322] tracking-tight leading-[1.1]">
            SMART LOCAL HOP
          </h1>
          <p className="text-lg sm:text-xl font-medium text-[#123D3A] leading-snug">
            Know the fare. Beat the clock. Find what you need along the way.
          </p>
          <p className="text-base text-[#495553] leading-relaxed">
            Your intelligent local journey companion for temples, beaches, markets, attractions,
            railway stations and everyday travel across India.
          </p>
        </Reveal>

        {/* Main Smart Local Hop Planner */}
        <section
          ref={plannerSectionRef}
          aria-labelledby="planner-heading"
          className="rounded-3xl bg-white border border-[#DFD8C8] p-5 sm:p-7 shadow-[0_18px_40px_-22px_rgba(18,61,58,0.22)]"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
            <div>
              <h2
                id="planner-heading"
                className="font-editorial text-2xl sm:text-3xl font-semibold text-[#142322]"
              >
                Where are you heading?
              </h2>
              <p className="text-sm text-[#5A6664] mt-0.5">
                Pick real places from suggestions or GPS — one verified road route powers all three tools.
              </p>
            </div>
            {sharedJourney && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#123D3A]/8 border border-[#123D3A]/20 text-xs font-mono font-semibold text-[#123D3A] self-start sm:self-auto">
                <Route className="w-3.5 h-3.5 text-[#E9A34A]" aria-hidden="true" />
                <span>Shared Journey Active · {sharedJourney.distanceKm} km</span>
              </span>
            )}
          </div>

          <form onSubmit={handleExploreJourney} className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-start">
              {/* FROM LOCATION */}
              <div ref={originWrapRef} className="relative space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="smart-hop-from"
                    className="text-xs font-mono font-bold uppercase tracking-[0.08em] text-[#123D3A]"
                  >
                    FROM · STARTING POINT
                  </label>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={gpsLoading}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F5F1E8] border border-[#DFD8C8] hover:border-[#123D3A]/40 text-xs font-semibold text-[#123D3A] transition-colors disabled:opacity-60"
                  >
                    {gpsLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <Crosshair className="w-3.5 h-3.5 text-[#E9A34A]" aria-hidden="true" />
                    )}
                    <span>{gpsLoading ? 'Locating...' : 'Use Current Location'}</span>
                  </button>
                </div>

                {/* FROM category pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                  {FROM_CATEGORIES.map((cat) => {
                    const active = originKind === cat.kind;
                    return (
                      <button
                        key={cat.kind}
                        type="button"
                        onClick={() => {
                          setOriginKind(cat.kind);
                          setOriginOpen(true);
                        }}
                        className={`ys-chip shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                          active
                            ? 'bg-[#123D3A] text-white border-[#123D3A]'
                            : 'bg-[#FAF8F3] text-[#495553] border-[#E5DFD3] hover:border-[#123D3A]/40'
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>

                <div className="relative">
                  <MapPin
                    className="w-4 h-4 text-[#123D3A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    id="smart-hop-from"
                    type="text"
                    value={originQuery}
                    onFocus={() => setOriginOpen(true)}
                    onChange={(e) => {
                      setOriginQuery(e.target.value);
                      setOriginPlace(null);
                      setOriginOpen(true);
                      setPlannerError(null);
                    }}
                    placeholder="e.g., Puri Station, Katra SVDK, Varanasi Jn, Airport..."
                    autoComplete="off"
                    className="ys-input w-full pl-10 pr-10 py-3.5 min-h-[50px] rounded-xl bg-[#FAF8F3] border border-[#D7CFC1] text-base text-[#142322] placeholder:text-[#6B7775] focus:bg-white focus:outline-none"
                  />
                  {originQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setOriginQuery('');
                        setOriginPlace(null);
                        setOriginOpen(true);
                      }}
                      aria-label="Clear starting point"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#5A6664] hover:text-[#142322] hover:bg-[#EFECE3]"
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )}
                </div>

                {originPlace && (
                  <p className="text-xs text-[#123D3A] font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                    <span className="truncate">
                      Coordinates locked ({originPlace.lat.toFixed(4)}, {originPlace.lng.toFixed(4)}) ·{' '}
                      {originPlace.source || 'Verified'}
                    </span>
                  </p>
                )}

                {/* FROM Suggestions Dropdown */}
                {originOpen && (
                  <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 rounded-2xl bg-white border border-[#D7CFC1] shadow-[0_20px_44px_-12px_rgba(18,61,58,0.28)] max-h-72 overflow-y-auto">
                    {originSearching ? (
                      <div className="p-4 flex items-center gap-2 text-sm text-[#495553]">
                        <Loader2 className="w-4 h-4 animate-spin text-[#123D3A]" />
                        <span>Searching stations, landmarks & Google Places...</span>
                      </div>
                    ) : originSuggestions.length === 0 ? (
                      <div className="p-4 text-sm text-[#5A6664]">
                        No matching places found yet. Try typing a city, station name (e.g., Katra, Puri, Varanasi, Jaipur), or temple name.
                      </div>
                    ) : (
                      <ul role="listbox" aria-label="Starting point suggestions" className="divide-y divide-[#F0ECE1]">
                        {originSuggestions.map((item) => (
                          <li key={`${item.source}-${item.id}`}>
                            <button
                              type="button"
                              onClick={() => {
                                const place = suggestionToPlace(item);
                                setOriginPlace(place);
                                setOriginQuery(place.label);
                                setOriginOpen(false);
                                setPlannerError(null);
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-[#F8F6F0] transition-colors flex items-start justify-between gap-3"
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-[#142322]">{item.label}</p>
                                <p className="text-xs text-[#5A6664] mt-0.5">{item.subtitle}</p>
                              </div>
                              <span className="shrink-0 text-[11px] font-mono px-2 py-0.5 rounded bg-[#F3EFE6] text-[#123D3A]">
                                {item.source}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* SWAP BUTTON */}
              <div className="flex lg:flex-col items-center justify-center lg:pt-14">
                <button
                  type="button"
                  onClick={handleSwap}
                  data-swapped={swappedCount % 2 === 1 ? 'true' : 'false'}
                  aria-label="Swap starting point and destination"
                  title="Swap From & To"
                  className="ys-swap-btn w-11 h-11 rounded-full bg-[#F5F1E8] border border-[#D7CFC1] hover:border-[#123D3A] text-[#123D3A] flex items-center justify-center shadow-2xs"
                >
                  <ArrowUpDown className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              {/* TO LOCATION */}
              <div ref={destWrapRef} className="relative space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="smart-hop-to"
                    className="text-xs font-mono font-bold uppercase tracking-[0.08em] text-[#123D3A]"
                  >
                    TO · DESTINATION
                  </label>
                  <span className="text-xs text-[#5A6664]">Temples, Beaches, Markets & Hubs</span>
                </div>

                {/* TO category pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                  {TO_CATEGORIES.map((cat) => {
                    const active = destKind === cat.kind;
                    return (
                      <button
                        key={cat.kind}
                        type="button"
                        onClick={() => {
                          setDestKind(cat.kind);
                          setDestOpen(true);
                        }}
                        className={`ys-chip shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                          active
                            ? 'bg-[#123D3A] text-white border-[#123D3A]'
                            : 'bg-[#FAF8F3] text-[#495553] border-[#E5DFD3] hover:border-[#123D3A]/40'
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>

                <div className="relative">
                  <Search
                    className="w-4 h-4 text-[#E9A34A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    id="smart-hop-to"
                    type="text"
                    value={destQuery}
                    onFocus={() => setDestOpen(true)}
                    onChange={(e) => {
                      setDestQuery(e.target.value);
                      setDestPlace(null);
                      setDestOpen(true);
                      setPlannerError(null);
                    }}
                    placeholder="e.g., Jagannath Temple, Banganga Deodi, Kashi Vishwanath..."
                    autoComplete="off"
                    className="ys-input w-full pl-10 pr-10 py-3.5 min-h-[50px] rounded-xl bg-[#FAF8F3] border border-[#D7CFC1] text-base text-[#142322] placeholder:text-[#6B7775] focus:bg-white focus:outline-none"
                  />
                  {destQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setDestQuery('');
                        setDestPlace(null);
                        setDestOpen(true);
                      }}
                      aria-label="Clear destination"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#5A6664] hover:text-[#142322] hover:bg-[#EFECE3]"
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )}
                </div>

                {destPlace && (
                  <p className="text-xs text-[#123D3A] font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                    <span className="truncate">
                      Coordinates locked ({destPlace.lat.toFixed(4)}, {destPlace.lng.toFixed(4)}) ·{' '}
                      {destPlace.source || 'Verified'}
                    </span>
                  </p>
                )}

                {/* TO Suggestions Dropdown */}
                {destOpen && (
                  <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 rounded-2xl bg-white border border-[#D7CFC1] shadow-[0_20px_44px_-12px_rgba(18,61,58,0.28)] max-h-72 overflow-y-auto">
                    {destSearching ? (
                      <div className="p-4 flex items-center gap-2 text-sm text-[#495553]">
                        <Loader2 className="w-4 h-4 animate-spin text-[#123D3A]" />
                        <span>Searching curated attractions & Google Places...</span>
                      </div>
                    ) : destSuggestions.length === 0 ? (
                      <div className="p-4 text-sm text-[#5A6664]">
                        No matching destination found yet. Enter a known temple, beach, monument, or street address.
                      </div>
                    ) : (
                      <ul role="listbox" aria-label="Destination suggestions" className="divide-y divide-[#F0ECE1]">
                        {destSuggestions.map((item) => (
                          <li key={`${item.source}-${item.id}`}>
                            <button
                              type="button"
                              onClick={() => {
                                const place = suggestionToPlace(item);
                                setDestPlace(place);
                                setDestQuery(place.label);
                                setDestOpen(false);
                                setPlannerError(null);
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-[#F8F6F0] transition-colors flex items-start justify-between gap-3"
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-[#142322]">{item.label}</p>
                                <p className="text-xs text-[#5A6664] mt-0.5">{item.subtitle}</p>
                              </div>
                              <span className="shrink-0 text-[11px] font-mono px-2 py-0.5 rounded bg-[#F3EFE6] text-[#123D3A]">
                                {item.source}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>

            {plannerError && (
              <div
                role="alert"
                className="rounded-xl bg-amber-50 border border-amber-300 px-4 py-3 text-sm text-amber-950 flex items-start gap-2.5"
              >
                <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{plannerError}</span>
              </div>
            )}

            {/* Quick sample jumps + primary CTA */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pt-1 border-t border-[#F0ECE1]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-[0.06em] text-[#5A6664]">
                  Popular Indian Hops:
                </span>
                {QUICK_SAMPLE_ROUTES.map((sample) => (
                  <button
                    key={sample.label}
                    type="button"
                    onClick={() => handleSelectQuickSample(sample)}
                    disabled={routeLoading}
                    className="ys-chip px-2.5 py-1.5 rounded-lg bg-[#F5F1E8] border border-[#E2DAC9] hover:border-[#123D3A]/45 text-xs font-medium text-[#123D3A]"
                  >
                    {sample.label}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={routeLoading}
                className="ys-btn-primary inline-flex items-center justify-center gap-2.5 px-7 py-3.5 min-h-[50px] rounded-xl bg-[#E9A34A] text-[#142322] text-base font-bold shadow-sm hover:bg-[#DF9538] disabled:opacity-65 shrink-0"
              >
                {routeLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                    <span>Calculating Road Route...</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-5 h-5" aria-hidden="true" />
                    <span>Explore Journey</span>
                    <ArrowRight className="w-4 h-4 ys-arrow" aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Resolved Shared Journey Context Bar */}
          {sharedJourney && (
            <div className="mt-6 rounded-2xl bg-[#123D3A] text-white p-5 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono uppercase tracking-[0.08em] text-[#8CC9E8]">
                    <span>Shared Route Context Ready</span>
                    <span>·</span>
                    <span>{sharedJourney.isTrafficAware ? 'Live Traffic-Aware' : 'Road Estimate (No Live Traffic)'}</span>
                  </div>
                  <p className="text-base sm:text-lg font-semibold leading-snug">
                    {sharedJourney.origin.label}{' '}
                    <span className="text-[#E9A34A] mx-1">→</span>{' '}
                    {sharedJourney.destination.label}
                  </p>
                  <p className="text-xs text-white/75">{sharedJourney.trafficSourceLabel}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <div className="rounded-xl bg-white/10 border border-white/15 px-3.5 py-2">
                    <p className="text-[11px] font-mono uppercase text-[#8CC9E8]">Distance</p>
                    <p className="text-lg font-bold font-mono tabular-figures">
                      {sharedJourney.distanceKm} km
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/10 border border-white/15 px-3.5 py-2">
                    <p className="text-[11px] font-mono uppercase text-[#8CC9E8]">Est. Time</p>
                    <p className="text-lg font-bold font-mono tabular-figures">
                      ~{activeDuration} min
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowRouteMap((v) => !v)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-xl bg-white/12 hover:bg-white/20 border border-white/25 text-sm font-semibold transition-colors"
                  >
                    <MapIcon className="w-4 h-4 text-[#E9A34A]" aria-hidden="true" />
                    <span>{showRouteMap ? 'Hide Map' : 'Preview Map'}</span>
                  </button>
                </div>
              </div>

              {showRouteMap && (
                <div className="rounded-xl overflow-hidden border border-white/15 bg-[#F8F6F0]">
                  <GoogleRouteMap
                    heightClass="h-[300px]"
                    routeGeometry={sharedJourney.routeGeometry}
                    stops={[
                      {
                        id: 'origin',
                        label: sharedJourney.origin.label,
                        lat: sharedJourney.origin.lat,
                        lng: sharedJourney.origin.lng,
                        kind: 'origin',
                      },
                      {
                        id: 'dest',
                        label: sharedJourney.destination.label,
                        lat: sharedJourney.destination.lat,
                        lng: sharedJourney.destination.lng,
                        kind: 'destination',
                      },
                    ]}
                  />
                </div>
              )}
            </div>
          )}
        </section>

        {/* Exactly Three Smart Local Hop Feature Cards */}
        <section aria-labelledby="smart-hop-tools-heading" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div>
              <p className="eyebrow-mono font-semibold text-[#123D3A]">
                THREE GROUND-LEVEL TOOLS · OPENS IN A NEW TAB
              </p>
              <h2
                id="smart-hop-tools-heading"
                className="font-editorial text-2xl sm:text-3xl font-semibold text-[#142322] mt-1"
              >
                Inspect your journey intelligence
              </h2>
            </div>
            <p className="text-sm text-[#5A6664]">
              {sharedJourney
                ? 'Your active route transfers automatically into whichever tool tab you open.'
                : 'Calculate a route above first, then open any tool below.'}
            </p>
          </div>

          <RevealGroup
            immediate
            staggerMs={STAGGER_CARDS_MS}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {featureCards.map((card, idx) => {
              const Icon = card.icon;
              const isPopupBlockedForThis = popupFallback?.cardId === card.id;
              return (
                <RevealItem key={card.id} index={idx} className="h-full">
                  <MotionCard className="h-full rounded-2xl bg-white border border-[#DFD8C8] overflow-hidden flex flex-col justify-between shadow-xs">
                    <div>
                      {/* Clean Card Photography (separate from text container below) */}
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#123D3A]">
                        <SafeImage
                          src={card.image}
                          alt={card.imageAlt}
                          className="ys-card-img w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0D1A18]/80 via-[#0D1A18]/20 to-transparent pointer-events-none" />
                        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded-lg bg-[#0D1A18]/75 backdrop-blur-sm text-xs font-mono font-semibold text-[#E9A34A] border border-white/15">
                            FEATURE {card.num}
                          </span>
                          <span className="w-9 h-9 rounded-xl bg-white/95 text-[#123D3A] flex items-center justify-center shadow-sm ys-icon-float">
                            <Icon className="w-4 h-4" aria-hidden="true" />
                          </span>
                        </div>
                        {card.id === 'fare' && (
                          <span className="absolute bottom-3 left-3.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/95 text-[#123D3A] text-xs font-semibold shadow-sm">
                            <Volume2 className="w-3.5 h-3.5 text-[#E9A34A]" aria-hidden="true" />
                            <span>Local Voice Pass</span>
                          </span>
                        )}
                      </div>

                      {/* Card Body */}
                      <div className="p-5 sm:p-6 space-y-3">
                        <h3 className="font-editorial text-xl sm:text-2xl font-semibold text-[#142322] leading-snug">
                          {card.title}
                        </h3>
                        <p className="text-sm text-[#495553] leading-relaxed">{card.subtitle}</p>

                        <div className="rounded-xl bg-[#F8F6F0] border border-[#E5DFD3] px-3.5 py-2.5 text-xs font-medium text-[#123D3A]">
                          {card.liveSummary}
                        </div>

                        <ul className="space-y-1.5 pt-1">
                          {card.highlights.map((item) => (
                            <li
                              key={item}
                              className="flex items-center gap-2 text-xs font-medium text-[#394543]"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-[#E9A34A] shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Main CTA Footer */}
                    <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-2 space-y-2.5">
                      <button
                        type="button"
                        onClick={() => handleOpenFeatureTab(card.id)}
                        className={`ys-btn-primary w-full inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[46px] rounded-xl text-sm font-bold transition-colors ${
                          sharedJourney
                            ? 'bg-[#123D3A] text-white hover:bg-[#194E4A]'
                            : 'bg-[#E9A34A] text-[#142322] hover:bg-[#DF9538]'
                        }`}
                      >
                        <span>{card.ctaLabel}</span>
                        <ExternalLink className="w-4 h-4 ys-arrow" aria-hidden="true" />
                      </button>

                      {isPopupBlockedForThis && (
                        <div className="rounded-xl bg-amber-50 border border-amber-300 p-3 text-xs text-amber-950 space-y-2">
                          <p className="font-medium">
                            Your browser blocked opening a new tab automatically. Use the direct link below:
                          </p>
                          <a
                            href={popupFallback.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setPopupFallback(null)}
                            className="inline-flex items-center gap-1.5 font-bold underline text-[#123D3A]"
                          >
                            <span>Open in New Tab Now</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  </MotionCard>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </section>
      </main>

      <Footer />
    </div>
  );
}
