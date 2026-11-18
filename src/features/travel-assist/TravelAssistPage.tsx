import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Bus,
  Car,
  Check,
  Compass,
  Edit3,
  Landmark,
  Loader2,
  MapPin,
  Minus,
  Navigation,
  Plane,
  Plus,
  Route,
  Search,
  Sparkles,
  Train,
  Users,
  X,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { TravelProgressTracker } from '../../components/TravelProgressTracker';
import {
  RideComparisonSection,
  type CompareResult,
  VEHICLE_IMAGES,
} from '../../components/ProviderBadge';
import { GoogleRouteMap, type MapStop } from '../../components/GoogleRouteMap';
import {
  DestinationCarousel,
  type AttractionCategory,
  type DiscoveredAttraction,
} from '../../components/DestinationCarousel';
import {
  CinematicDestinationHero,
  preloadHeroImage,
  type CinematicHeroShowcase,
  type HeroFactItem,
} from '../../components/CinematicDestinationHero';
import { useDetailOverlay } from '../../components/DetailOverlay';
import {
  DiscoverySkeleton,
  RideCompareSkeleton,
  SuggestSkeleton,
} from '../../components/SkeletonCards';
import { DESTINATIONS, IMAGES } from '../../data/destinations';
import {
  INDIA_STATES_AND_UTS,
  type ArrivalKind,
} from '../../data/indiaLocations';
import {
  readTravelAssistSession,
  writeTravelAssistSession,
  type FirstDestKind,
  type PreferredRideMode,
  type SelectedPlace,
} from './travelAssistSession';
import { useApp } from '../../contexts/AppContext';

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

const ARRIVAL_OPTIONS: Array<{
  kind: ArrivalKind;
  apiKind: 'station' | 'bus' | 'airport' | 'all';
  label: string;
  placeholder: string;
}> = [
  {
    kind: 'Railway Station',
    apiKind: 'station',
    label: 'Railway Station',
    placeholder: 'Search station name or code (e.g. Puri, LKO, NDLS, JP)',
  },
  {
    kind: 'Bus Stand',
    apiKind: 'bus',
    label: 'Bus Stand',
    placeholder: 'Search bus stand or ISBT (e.g. Puri Bus Stand, Kashmere Gate)',
  },
  {
    kind: 'Airport',
    apiKind: 'airport',
    label: 'Airport',
    placeholder: 'Search airport or IATA code (e.g. Bhubaneswar BBI, Lucknow LKO)',
  },
  {
    kind: 'Other Location',
    apiKind: 'all',
    label: 'Other',
    placeholder: 'Search any city, town, chowk, or address across India',
  },
];

const FIRST_DEST_OPTIONS: Array<{
  kind: FirstDestKind;
  apiKind: 'hotel' | 'landmark' | 'address';
  label: string;
  placeholder: string;
  emptyHint: string;
}> = [
  {
    kind: 'Temple / Landmark',
    apiKind: 'landmark',
    label: 'Temple / Landmark',
    placeholder: 'Search temples, forts, beaches, monuments (e.g. Jagannath Temple)',
    emptyHint: 'Type a temple, palace, fort, beach, or monument (e.g. Jagannath Temple, Bara Imambara).',
  },
  {
    kind: 'Hotel / Stay',
    apiKind: 'hotel',
    label: 'Hotel / Stay',
    placeholder: 'Search hotels, resorts, guesthouses, or homestays...',
    emptyHint: 'Type a hotel, resort, guesthouse, or lodge name (e.g. Mayfair Waves Puri).',
  },
  {
    kind: 'Custom Address',
    apiKind: 'address',
    label: 'Custom Address',
    placeholder: 'Type any colony, road, ghat, or street address...',
    emptyHint: 'Type any street address, chowk, colony, or locality in the destination.',
  },
  {
    kind: 'Other Location',
    apiKind: 'address',
    label: 'Any Other',
    placeholder: 'Search any destination point or locality...',
    emptyHint: 'Type any market, square, campus, or landmark across India.',
  },
];

function KindIcon({ kind }: { kind: ArrivalKind }) {
  if (kind === 'Railway Station') return <Train className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />;
  if (kind === 'Bus Stand') return <Bus className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />;
  if (kind === 'Airport') return <Plane className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />;
  return <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />;
}

function DestKindIcon({ kind }: { kind: FirstDestKind }) {
  if (kind === 'Hotel / Stay') return <Building2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />;
  if (kind === 'Temple / Landmark') return <Landmark className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />;
  if (kind === 'Custom Address') return <Navigation className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />;
  return <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />;
}

const CATEGORY_ORDER: AttractionCategory[] = [
  'Popular Places',
  'Temples & Heritage',
  'Nature & Beaches',
  'Museums & Culture',
  'Cafe Corner',
  'Adventure & Experiences',
  'Hidden Gems',
];

const CATEGORY_SUBTITLES: Record<AttractionCategory, string> = {
  'Popular Places': 'Iconic highlights and landmark attractions around this destination',
  'Temples & Heritage': 'Sacred shrines, historic forts, palaces, and heritage sites',
  'Nature & Beaches': 'Coastlines, lakes, parks, waterfalls, hills, and scenic spots',
  'Museums & Culture': 'Museums, craft villages, local arts, and cultural hubs',
  'Cafe Corner': 'Local coffee spots, bakeries, and relaxed neighbourhood hangouts',
  'Adventure & Experiences': 'Boating, outdoor trails, sanctuaries, water activities, and scenic drives',
  'Hidden Gems': 'Regional excursions and quieter escapes worth the ride',
};

const RIDE_MODE_CARDS: Array<{
  mode: 'bike' | 'auto' | 'cab';
  title: string;
  tagline: string;
  image: string;
}> = [
  {
    mode: 'bike',
    title: 'Bike',
    tagline: 'Quick & budget',
    image: VEHICLE_IMAGES.bike,
  },
  {
    mode: 'auto',
    title: 'Auto',
    tagline: 'City rides',
    image: VEHICLE_IMAGES.auto,
  },
  {
    mode: 'cab',
    title: 'Cab',
    tagline: 'AC & luggage',
    image: VEHICLE_IMAGES.cab,
  },
];

const QUICK_SAMPLE_ROUTES: Array<{
  id: string;
  title: string;
  state: string;
  arrivalKind: ArrivalKind;
  destKind: FirstDestKind;
  origin: SelectedPlace;
  dest: SelectedPlace;
}> = [
  {
    id: 'puri-jagannath',
    title: 'Puri Rail → Jagannath Temple',
    state: 'Odisha',
    arrivalKind: 'Railway Station',
    destKind: 'Temple / Landmark',
    origin: {
      label: 'Puri Railway Station (PURI)',
      city: 'Puri',
      state: 'Odisha',
      lat: 19.8068,
      lng: 85.8295,
      groundTip: 'Prepaid auto booth sits outside main Gate 1; Jagannath Temple is ~2 km west.',
      source: 'Indian Transit Index',
    },
    dest: {
      label: 'Jagannath Temple, Puri',
      city: 'Puri',
      state: 'Odisha',
      lat: 19.8049,
      lng: 85.8179,
      source: 'Regional Landmark Directory',
    },
  },
  {
    id: 'udaipur-palace',
    title: 'Udaipur Rail → City Palace',
    state: 'Rajasthan',
    arrivalKind: 'Railway Station',
    destKind: 'Temple / Landmark',
    origin: {
      label: 'Udaipur City Railway Station (UDZ)',
      city: 'Udaipur',
      state: 'Rajasthan',
      lat: 24.5686,
      lng: 73.6994,
      groundTip: 'Prepaid auto booth is outside Gate 1; Old City stays are 2.5–4 km away.',
      source: 'Indian Transit Index',
    },
    dest: {
      label: 'City Palace, Udaipur',
      city: 'Udaipur',
      state: 'Rajasthan',
      lat: 24.5764,
      lng: 73.6835,
      source: 'Regional Landmark Directory',
    },
  },
  {
    id: 'lucknow-imambara',
    title: 'Lucknow Charbagh → Bara Imambara',
    state: 'Uttar Pradesh',
    arrivalKind: 'Railway Station',
    destKind: 'Temple / Landmark',
    origin: {
      label: 'Lucknow Charbagh Railway Station (LKO)',
      city: 'Lucknow',
      state: 'Uttar Pradesh',
      lat: 26.8318,
      lng: 80.9191,
      groundTip: 'Charbagh Metro station connects directly outside Platform 1 portico.',
      source: 'Indian Transit Index',
    },
    dest: {
      label: 'Bara Imambara, Lucknow',
      city: 'Lucknow',
      state: 'Uttar Pradesh',
      lat: 26.8691,
      lng: 80.9132,
      source: 'Regional Landmark Directory',
    },
  },
];

export function TravelAssistPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { updateTripContext } = useApp();
  const { openDetail } = useDetailOverlay();

  const savedSession = useMemo(() => readTravelAssistSession(), []);

  // Optional State / UT Scope across all 28 States & 8 UTs
  const [selectedState, setSelectedState] = useState<string>(savedSession?.selectedState || '');

  // Field 1: Starting Point
  const [arrivalKind, setArrivalKind] = useState<ArrivalKind>(
    savedSession?.arrivalKind || 'Railway Station'
  );
  const [originQuery, setOriginQuery] = useState<string>(savedSession?.originQuery || '');
  const [originPlace, setOriginPlace] = useState<SelectedPlace | null>(
    savedSession?.originPlace || null
  );
  const [originSuggestions, setOriginSuggestions] = useState<PlaceSuggestion[]>([]);
  const [originOpen, setOriginOpen] = useState<boolean>(false);
  const [originLoading, setOriginLoading] = useState<boolean>(false);

  // Field 2: First Destination
  const [destKind, setDestKind] = useState<FirstDestKind>(
    savedSession?.destKind || 'Temple / Landmark'
  );
  const [destQuery, setDestQuery] = useState<string>(savedSession?.destQuery || '');
  const [destPlace, setDestPlace] = useState<SelectedPlace | null>(savedSession?.destPlace || null);
  const [destSuggestions, setDestSuggestions] = useState<PlaceSuggestion[]>([]);
  const [destOpen, setDestOpen] = useState<boolean>(false);
  const [destLoading, setDestLoading] = useState<boolean>(false);

  // Field 3: Passengers (Clean - 2 + stepper)
  const [passengers, setPassengers] = useState<number>(savedSession?.passengers || 2);

  // Field 4: Preferred Ride Type ("How would you like to travel?")
  const [preferredRideType, setPreferredRideType] = useState<PreferredRideMode>(
    savedSession?.preferredRideType || 'all'
  );

  // Live Right-Column Ride Comparison & Map States
  const [formError, setFormError] = useState<string>('');
  const [findingRide, setFindingRide] = useState<boolean>(false);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [compareError, setCompareError] = useState<string>('');

  // Explore All Destinations State
  const [discoverLoading, setDiscoverLoading] = useState<boolean>(false);
  const [discoverError, setDiscoverError] = useState<string>('');
  const [attractions, setAttractions] = useState<DiscoveredAttraction[]>([]);
  const [regionInfo, setRegionInfo] = useState<{
    city: string;
    state: string;
    lat: number;
    lng: number;
  } | null>(null);
  const [attractionSearch, setAttractionSearch] = useState<string>('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'All' | AttractionCategory>('All');
  const [visibleGridLimit, setVisibleGridLimit] = useState<number>(12);
  const [exploringSectionActive, setExploringSectionActive] = useState<boolean>(false);
  const [selectedHeroAttraction, setSelectedHeroAttraction] = useState<DiscoveredAttraction | null>(null);
  const [autoSlideIndex, setAutoSlideIndex] = useState<number>(() => {
    const qDest = searchParams.get('dest');
    if (qDest) {
      const idx = DESTINATIONS.findIndex((d) => d.id.toLowerCase() === qDest.toLowerCase());
      if (idx >= 0) return idx;
    }
    return 0;
  });
  const [isPageHidden, setIsPageHidden] = useState<boolean>(() =>
    typeof document !== 'undefined' ? document.hidden : false
  );

  // Editable Pickup Point for Explore All Destinations distances & attraction comparison links
  const [pickupPlace, setPickupPlace] = useState<SelectedPlace | null>(
    savedSession?.pickupPlace || savedSession?.destPlace || null
  );
  const [editingPickup, setEditingPickup] = useState<boolean>(false);
  const [pickupQuery, setPickupQuery] = useState<string>(
    savedSession?.pickupPlace?.label || savedSession?.destPlace?.label || ''
  );
  const [pickupSuggestions, setPickupSuggestions] = useState<PlaceSuggestion[]>([]);
  const [pickupOpen, setPickupOpen] = useState<boolean>(false);
  const [pickupLoading, setPickupLoading] = useState<boolean>(false);

  const originWrapRef = useRef<HTMLDivElement | null>(null);
  const destWrapRef = useRef<HTMLDivElement | null>(null);
  const pickupWrapRef = useRef<HTMLDivElement | null>(null);
  const heroSectionRef = useRef<HTMLElement | null>(null);
  const workspaceRef = useRef<HTMLElement | null>(null);
  const exploreSectionRef = useRef<HTMLElement | null>(null);
  const initialHydratedRef = useRef<boolean>(false);

  const currentOriginMeta =
    ARRIVAL_OPTIONS.find((o) => o.kind === arrivalKind) || ARRIVAL_OPTIONS[0];
  const currentDestMeta =
    FIRST_DEST_OPTIONS.find((o) => o.kind === destKind) || FIRST_DEST_OPTIONS[0];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (originWrapRef.current && !originWrapRef.current.contains(target)) {
        setOriginOpen(false);
      }
      if (destWrapRef.current && !destWrapRef.current.contains(target)) {
        setDestOpen(false);
      }
      if (pickupWrapRef.current && !pickupWrapRef.current.contains(target)) {
        setPickupOpen(false);
      }
    };
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, []);

  // Optional URL deep-link (?state=Odisha or ?dest=jaipur)
  useEffect(() => {
    const qState = searchParams.get('state');
    if (qState) {
      const matchedState = INDIA_STATES_AND_UTS.find(
        (s) => s.name.toLowerCase() === qState.toLowerCase() || s.code.toLowerCase() === qState.toLowerCase()
      );
      if (matchedState) setSelectedState(matchedState.name);
    }
    const qDest = searchParams.get('dest');
    if (qDest) {
      const idx = DESTINATIONS.findIndex((d) => d.id.toLowerCase() === qDest.toLowerCase());
      if (idx >= 0) setAutoSlideIndex(idx);
    }
  }, [searchParams]);

  // Auto-cycle hero destination every 6 seconds when no user route is active; pause on hidden tab
  const autoCycleActive = !selectedHeroAttraction && !regionInfo && !destPlace;

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handleVisibility = () => setIsPageHidden(document.hidden);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    if (!autoCycleActive || DESTINATIONS.length < 2) return;
    const nextIdx = (autoSlideIndex + 1) % DESTINATIONS.length;
    preloadHeroImage(DESTINATIONS[nextIdx]?.heroImage);

    if (isPageHidden) return;
    const timer = window.setInterval(() => {
      setAutoSlideIndex((prev) => (prev + 1) % DESTINATIONS.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [autoCycleActive, autoSlideIndex, isPageHidden]);

  // Live OSRM Ride Comparison API caller
  const runLiveCompare = useCallback(
    async (
      origin: SelectedPlace,
      dest: SelectedPlace,
      paxCount: number,
      stateScope: string
    ) => {
      setFindingRide(true);
      setCompareError('');
      try {
        const res = await fetch('/api/travel-assist/compare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            originLat: origin.lat,
            originLng: origin.lng,
            originLabel: origin.label,
            destLat: dest.lat,
            destLng: dest.lng,
            destLabel: dest.label,
            passengers: paxCount,
            cityName: dest.city || origin.city || '',
            stateName: dest.state || origin.state || stateScope || '',
          }),
        });
        const data = (await res.json().catch(() => ({}))) as CompareResult & { error?: string };
        if (!res.ok || data.routeAvailable === false) {
          throw new Error(
            data.error ||
              'OSRM road routing is temporarily unreachable for this route. Please retry.'
          );
        }
        setCompareResult(data);
      } catch (err) {
        setCompareResult(null);
        setCompareError(
          err instanceof Error
            ? err.message
            : 'Unable to calculate OSRM road route and fares right now.'
        );
      } finally {
        setFindingRide(false);
      }
    },
    []
  );

  // Discover all regional attractions around destination
  const fetchRegionalDiscovery = useCallback(
    async (centerPlace: SelectedPlace, currentPickup: SelectedPlace) => {
      setDiscoverLoading(true);
      setDiscoverError('');
      try {
        const params = new URLSearchParams({
          city: centerPlace.city || currentPickup.city || '',
          state: centerPlace.state || currentPickup.state || selectedState || '',
          lat: String(centerPlace.lat),
          lng: String(centerPlace.lng),
          pickupLat: String(currentPickup.lat),
          pickupLng: String(currentPickup.lng),
        });
        const res = await fetch(`/api/travel-assist/discover?${params.toString()}`);
        if (!res.ok) {
          throw new Error('Could not load local attractions right now.');
        }
        const data = (await res.json()) as {
          region: { city: string; state: string; lat: number; lng: number };
          attractions: DiscoveredAttraction[];
        };
        setRegionInfo(data.region);
        setAttractions(data.attractions || []);
      } catch (err) {
        setDiscoverError(
          err instanceof Error ? err.message : 'Unable to discover regional destinations right now.'
        );
      } finally {
        setDiscoverLoading(false);
      }
    },
    [selectedState]
  );

  // Hydrate BOTH right-column OSRM comparison and lower Explore All Destinations when returning from /travel-assist/compare
  useEffect(() => {
    if (initialHydratedRef.current) return;
    if (savedSession?.destPlace && savedSession?.originPlace) {
      initialHydratedRef.current = true;
      const activePickup = savedSession.pickupPlace || savedSession.destPlace;
      runLiveCompare(
        savedSession.originPlace,
        savedSession.destPlace,
        savedSession.passengers || 2,
        savedSession.selectedState || ''
      );
      fetchRegionalDiscovery(savedSession.destPlace, activePickup);
    }
  }, [savedSession, runLiveCompare, fetchRegionalDiscovery]);

  // Smooth scroll to #explore-destinations when linked back from CompareRidesPage
  useEffect(() => {
    if (location.hash === '#explore-destinations' && exploreSectionRef.current) {
      setExploringSectionActive(true);
      setTimeout(() => {
        exploreSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  }, [location.hash, attractions.length]);

  // Fetch Starting Point suggestions strictly filtered by arrivalKind (station | bus | airport | all)
  useEffect(() => {
    if (!originOpen) return;
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setOriginLoading(true);
      try {
        const params = new URLSearchParams({
          q: originQuery.trim(),
          kind: currentOriginMeta.apiKind,
        });
        if (selectedState) params.set('state', selectedState);
        const res = await fetch(`/api/places/suggest?${params.toString()}`, {
          signal: ctrl.signal,
        });
        if (res.ok) {
          const json = (await res.json()) as { suggestions?: PlaceSuggestion[] };
          setOriginSuggestions(json.suggestions || []);
        }
      } catch {
        // Ignore aborted fetch
      } finally {
        setOriginLoading(false);
      }
    }, originQuery.trim().length < 2 ? 50 : 220);

    return () => {
      ctrl.abort();
      clearTimeout(timer);
    };
  }, [originQuery, currentOriginMeta.apiKind, selectedState, originOpen]);

  // Fetch First Destination suggestions strictly filtered by destKind (hotel | landmark | address)
  useEffect(() => {
    if (!destOpen) return;
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setDestLoading(true);
      try {
        const params = new URLSearchParams({
          q: destQuery.trim(),
          kind: currentDestMeta.apiKind,
        });
        const activeState = originPlace?.state || selectedState;
        if (activeState) params.set('state', activeState);
        if (originPlace) {
          params.set('biasLat', String(originPlace.lat));
          params.set('biasLng', String(originPlace.lng));
        }
        const res = await fetch(`/api/places/suggest?${params.toString()}`, {
          signal: ctrl.signal,
        });
        if (res.ok) {
          const json = (await res.json()) as { suggestions?: PlaceSuggestion[] };
          setDestSuggestions(json.suggestions || []);
        }
      } catch {
        // Ignore abort
      } finally {
        setDestLoading(false);
      }
    }, destQuery.trim().length < 2 ? 60 : 220);

    return () => {
      ctrl.abort();
      clearTimeout(timer);
    };
  }, [destQuery, currentDestMeta.apiKind, originPlace, selectedState, destOpen]);

  // Fetch Editable Pickup suggestions
  useEffect(() => {
    if (!pickupOpen || !editingPickup) return;
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setPickupLoading(true);
      try {
        const params = new URLSearchParams({
          q: pickupQuery.trim(),
          kind: 'address',
        });
        const activeState = regionInfo?.state || originPlace?.state || selectedState;
        if (activeState) params.set('state', activeState);
        if (regionInfo) {
          params.set('biasLat', String(regionInfo.lat));
          params.set('biasLng', String(regionInfo.lng));
        }
        const res = await fetch(`/api/places/suggest?${params.toString()}`, {
          signal: ctrl.signal,
        });
        if (res.ok) {
          const json = (await res.json()) as { suggestions?: PlaceSuggestion[] };
          setPickupSuggestions(json.suggestions || []);
        }
      } catch {
        // Ignore abort
      } finally {
        setPickupLoading(false);
      }
    }, pickupQuery.trim().length < 2 ? 60 : 220);

    return () => {
      ctrl.abort();
      clearTimeout(timer);
    };
  }, [pickupQuery, pickupOpen, editingPickup, regionInfo, originPlace, selectedState]);

  // Resolve free-text / manual custom entry cleanly
  const resolveCustomTextPlace = useCallback(
    async (
      rawText: string,
      kind: 'station' | 'bus' | 'airport' | 'hotel' | 'landmark' | 'address' | 'all',
      anchor?: SelectedPlace | null
    ): Promise<SelectedPlace | null> => {
      const cleaned = rawText.trim();
      if (!cleaned) return null;

      const queriesToTry = [cleaned];
      if (cleaned.includes(',')) {
        const tail = cleaned.split(',').slice(1).join(',').trim();
        if (tail.length >= 2) queriesToTry.push(tail);
      }

      for (const candidateQ of queriesToTry) {
        try {
          const params = new URLSearchParams({ q: candidateQ, kind });
          const st = anchor?.state || selectedState;
          if (st) params.set('state', st);
          if (anchor) {
            params.set('biasLat', String(anchor.lat));
            params.set('biasLng', String(anchor.lng));
          }
          const res = await fetch(`/api/places/suggest?${params.toString()}`);
          if (res.ok) {
            const data = (await res.json()) as { suggestions?: PlaceSuggestion[] };
            const hit = data.suggestions?.[0];
            if (hit) {
              return {
                label: cleaned,
                city: hit.city || anchor?.city || '',
                state: hit.state || anchor?.state || selectedState || '',
                lat: candidateQ === cleaned ? hit.lat : Number((hit.lat + 0.011).toFixed(5)),
                lng: candidateQ === cleaned ? hit.lng : Number((hit.lng + 0.013).toFixed(5)),
                groundTip: hit.groundTip,
                source: candidateQ === cleaned ? hit.source : 'Custom Address (City Anchored)',
              };
            }
          }
        } catch {
          // Try next fallback
        }
      }

      if (anchor) {
        return {
          label: cleaned,
          city: anchor.city,
          state: anchor.state,
          lat: Number((anchor.lat + 0.014).toFixed(5)),
          lng: Number((anchor.lng + 0.016).toFixed(5)),
          source: 'Custom Local Address',
        };
      }

      const stObj = INDIA_STATES_AND_UTS.find((s) => s.name === selectedState);
      if (stObj) {
        return {
          label: cleaned,
          city: stObj.capital,
          state: stObj.name,
          lat: stObj.lat,
          lng: stObj.lng,
          source: `${stObj.name} Regional Anchor`,
        };
      }

      return null;
    },
    [selectedState]
  );

  // Execute search for an explicit origin + destination pair (used by both Submit & Sample triggers)
  const executeJourneySearch = useCallback(
    async (
      resolvedOrigin: SelectedPlace,
      resolvedDest: SelectedPlace,
      paxCount: number,
      prefMode: PreferredRideMode,
      kindArrival: ArrivalKind,
      kindDest: FirstDestKind
    ) => {
      setOriginPlace(resolvedOrigin);
      setDestPlace(resolvedDest);
      setPickupPlace(resolvedDest);
      setPickupQuery(resolvedDest.label);
      setExploringSectionActive(false);
      setSelectedHeroAttraction(null);

      const city = resolvedDest.city || resolvedOrigin.city;
      const state = resolvedDest.state || resolvedOrigin.state || selectedState;

      writeTravelAssistSession({
        selectedState: state,
        arrivalKind: kindArrival,
        originQuery: resolvedOrigin.label,
        originPlace: resolvedOrigin,
        destKind: kindDest,
        destQuery: resolvedDest.label,
        destPlace: resolvedDest,
        pickupPlace: resolvedDest,
        passengers: paxCount,
        preferredRideType: prefMode,
      });

      updateTripContext({
        pickupLabel: resolvedOrigin.label,
        pickupCoords: { lat: resolvedOrigin.lat, lng: resolvedOrigin.lng },
        passengers: paxCount,
      });

      await Promise.all([
        runLiveCompare(resolvedOrigin, resolvedDest, paxCount, state),
        fetchRegionalDiscovery(resolvedDest, resolvedDest),
      ]);
    },
    [selectedState, updateTripContext, runLiveCompare, fetchRegionalDiscovery]
  );

  // Submit main Arrival Form -> Computes live OSRM route + provider fares right in the Right Column AND discovers destinations below
  const handleFindMyRide = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!originQuery.trim()) {
      setFormError('Please enter or select where you are arriving (station, bus stand, airport, or city).');
      return;
    }
    if (!destQuery.trim()) {
      setFormError('Please enter where you want to go first (temple, landmark, hotel, or address).');
      return;
    }

    setFindingRide(true);
    try {
      const resolvedOrigin =
        originPlace && originPlace.label === originQuery.trim()
          ? originPlace
          : await resolveCustomTextPlace(originQuery, currentOriginMeta.apiKind, null);

      if (!resolvedOrigin) {
        setFormError(
          'Could not locate that starting point in India. Try choosing a suggestion or selecting the State/UT first.'
        );
        setFindingRide(false);
        return;
      }

      const resolvedDest =
        destPlace && destPlace.label === destQuery.trim()
          ? destPlace
          : await resolveCustomTextPlace(destQuery, currentDestMeta.apiKind, resolvedOrigin);

      if (!resolvedDest) {
        setFormError('Could not locate your first destination. Try choosing a suggestion or including the city name.');
        setFindingRide(false);
        return;
      }

      await executeJourneySearch(
        resolvedOrigin,
        resolvedDest,
        passengers,
        preferredRideType,
        arrivalKind,
        destKind
      );
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to prepare ride comparison right now.');
      setFindingRide(false);
    }
  };

  // One-click real OSRM sample trigger
  const handleLoadSample = async (sample: (typeof QUICK_SAMPLE_ROUTES)[number]) => {
    setFormError('');
    setSelectedState(sample.state);
    setArrivalKind(sample.arrivalKind);
    setDestKind(sample.destKind);
    setOriginQuery(sample.origin.label);
    setDestQuery(sample.dest.label);
    setOriginOpen(false);
    setDestOpen(false);
    await executeJourneySearch(
      sample.origin,
      sample.dest,
      passengers,
      preferredRideType,
      sample.arrivalKind,
      sample.destKind
    );
  };

  // Live passenger stepper update -> updates session & refreshes OSRM comparison in place if already loaded
  const handleStepPassengers = (delta: number) => {
    const nextCount = Math.max(1, Math.min(6, passengers + delta));
    if (nextCount === passengers) return;
    setPassengers(nextCount);
    if (originPlace && destPlace && compareResult) {
      writeTravelAssistSession({
        selectedState,
        arrivalKind,
        originQuery: originPlace.label,
        originPlace,
        destKind,
        destQuery: destPlace.label,
        destPlace,
        pickupPlace: pickupPlace || destPlace,
        passengers: nextCount,
        preferredRideType,
      });
      runLiveCompare(
        originPlace,
        destPlace,
        nextCount,
        destPlace.state || originPlace.state || selectedState
      );
    }
  };

  // Build deep-link URL to full dedicated /travel-assist/compare page
  const fullCompareHref = useMemo(() => {
    if (!originPlace || !destPlace) return '/travel-assist/compare';
    const params = new URLSearchParams({
      mode: 'arrival',
      oLabel: originPlace.label,
      oLat: String(originPlace.lat),
      oLng: String(originPlace.lng),
      dLabel: destPlace.label,
      dLat: String(destPlace.lat),
      dLng: String(destPlace.lng),
      pax: String(passengers),
      pref: preferredRideType,
      city: destPlace.city || originPlace.city || '',
      state: destPlace.state || originPlace.state || selectedState || '',
    });
    if (originPlace.groundTip) params.set('groundTip', originPlace.groundTip);
    return `/travel-assist/compare?${params.toString()}`;
  }, [originPlace, destPlace, passengers, preferredRideType, selectedState]);

  // Navigate to dedicated /travel-assist/compare for a selected attraction
  const handleSelectAttraction = (attraction: DiscoveredAttraction) => {
    const activePickup = pickupPlace || destPlace || originPlace;
    if (!activePickup) return;

    if (originPlace && destPlace) {
      writeTravelAssistSession({
        selectedState,
        arrivalKind,
        originQuery: originPlace.label,
        originPlace,
        destKind,
        destQuery: destPlace.label,
        destPlace,
        pickupPlace: activePickup,
        passengers,
        preferredRideType,
      });
    }

    const params = new URLSearchParams({
      mode: 'attraction',
      oLabel: activePickup.label,
      oLat: String(activePickup.lat),
      oLng: String(activePickup.lng),
      dLabel: attraction.name,
      dLat: String(attraction.lat),
      dLng: String(attraction.lng),
      pax: String(passengers),
      pref: preferredRideType,
      city: regionInfo?.city || activePickup.city || '',
      state: regionInfo?.state || activePickup.state || selectedState || '',
      attrCategory: attraction.category,
      attrDesc: attraction.shortDescription,
      attrTime: attraction.bestVisitingTime,
    });

    navigate(`/travel-assist/compare?${params.toString()}`);
  };

  // Update editable pickup and recalculate Explore All Destinations distances
  const handleApplyNewPickup = async (newPickup: SelectedPlace) => {
    setPickupPlace(newPickup);
    setPickupQuery(newPickup.label);
    setEditingPickup(false);
    setPickupOpen(false);

    if (originPlace && destPlace) {
      writeTravelAssistSession({
        selectedState,
        arrivalKind,
        originQuery: originPlace.label,
        originPlace,
        destKind,
        destQuery: destPlace.label,
        destPlace,
        pickupPlace: newPickup,
        passengers,
        preferredRideType,
      });
    }

    if (regionInfo) {
      await fetchRegionalDiscovery(
        {
          label: regionInfo.city,
          city: regionInfo.city,
          state: regionInfo.state,
          lat: regionInfo.lat,
          lng: regionInfo.lng,
          source: 'Region',
        },
        newPickup
      );
    }
  };

  // Filtered attractions & grouped carousels
  const filteredAttractions = useMemo(() => {
    const q = attractionSearch.trim().toLowerCase();
    return attractions.filter((item) => {
      if (activeCategoryFilter !== 'All' && item.category !== activeCategoryFilter) {
        return false;
      }
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.shortDescription.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [attractions, activeCategoryFilter, attractionSearch]);

  const groupedCarousels = useMemo(() => {
    const groups: Record<AttractionCategory, DiscoveredAttraction[]> = {
      'Popular Places': [],
      'Temples & Heritage': [],
      'Nature & Beaches': [],
      'Museums & Culture': [],
      'Cafe Corner': [],
      'Adventure & Experiences': [],
      'Hidden Gems': [],
    };

    // Popular Places only promotes genuine sightseeing landmarks/monuments/nature/museums (not random cafes)
    const popularEligible = filteredAttractions.filter(
      (item) => item.category !== 'Cafe Corner'
    );
    const popularTop = popularEligible.slice(0, 8);
    if (activeCategoryFilter === 'All' || activeCategoryFilter === 'Popular Places') {
      groups['Popular Places'] = popularTop;
    }

    for (const item of filteredAttractions) {
      if (item.category !== 'Popular Places') {
        groups[item.category].push(item);
      } else if (activeCategoryFilter === 'Popular Places' && !popularTop.some((p) => p.id === item.id)) {
        groups['Popular Places'].push(item);
      }
    }
    return groups;
  }, [filteredAttractions, activeCategoryFilter]);

  const mapStops: MapStop[] = useMemo(() => {
    if (!compareResult) return [];
    return [
      {
        id: 'ta-origin',
        label: compareResult.route.originLabel,
        lat: compareResult.route.origin.lat,
        lng: compareResult.route.origin.lng,
        kind: 'origin',
      },
      {
        id: 'ta-dest',
        label: compareResult.route.destLabel,
        lat: compareResult.route.destination.lat,
        lng: compareResult.route.destination.lng,
        kind: 'destination',
      },
    ];
  }, [compareResult]);

  const activeStage: 1 | 2 | 3 | 4 = exploringSectionActive
    ? 3
    : compareResult
    ? 2
    : attractions.length > 0
    ? 3
    : 1;

  const destinationCityHeading =
    regionInfo?.city || destPlace?.city || originPlace?.city || 'Your Region';

  const handlePreviewAttractionInHero = useCallback((attraction: DiscoveredAttraction) => {
    preloadHeroImage(attraction.image);
    setSelectedHeroAttraction(attraction);
    heroSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const matchedRegionalDestination = useMemo(() => {
    const city = (regionInfo?.city || destPlace?.city || '').trim().toLowerCase();
    if (!city) return null;
    return DESTINATIONS.find((d) => city.includes(d.name.toLowerCase()) || d.name.toLowerCase().includes(city)) || null;
  }, [regionInfo?.city, destPlace?.city]);

  const handleOpenAttractionOverlay = useCallback(
    (item: DiscoveredAttraction) => {
      preloadHeroImage(item.image);
      openDetail({
        kind: 'place',
        id: item.id,
        title: item.name,
        category: item.category,
        location: item.location,
        image: item.image,
        description: item.shortDescription,
        bestTime: item.bestVisitingTime,
        openingHours: item.openingHours,
        rating: item.rating,
        userRatingCount: item.userRatingCount,
        distanceFromPickupKm: item.distanceFromPickupKm,
        pickupLabel: pickupPlace?.label || destPlace?.label || 'your pickup',
        destinationId: matchedRegionalDestination?.id,
        lat: item.lat,
        lng: item.lng,
        mapsUrl:
          item.sourceUrl ||
          `https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}`,
        highlights: [
          item.rawType ? `Spot type: ${item.rawType}` : item.category,
          `Source: ${item.source}`,
        ],
        onCompareRide: () => handleSelectAttraction(item),
      });
    },
    [openDetail, pickupPlace?.label, destPlace?.label, matchedRegionalDestination?.id]
  );

  const activeAutoDest = DESTINATIONS[autoSlideIndex % DESTINATIONS.length] || DESTINATIONS[0];

  const handleStartWithDisplayedCity = useCallback(() => {
    const cityProfile = activeAutoDest;
    const hub = cityProfile.arrivalHubs[0];
    const firstAttraction = cityProfile.attractions[0];

    workspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    if (!hub || !firstAttraction) return;

    const hubArrivalKind: ArrivalKind =
      hub.type === 'Airport'
        ? 'Airport'
        : hub.type === 'Bus Stand'
        ? 'Bus Stand'
        : 'Railway Station';

    const resolvedOrigin: SelectedPlace = {
      label: hub.name,
      city: cityProfile.name,
      state: cityProfile.state,
      lat: hub.lat,
      lng: hub.lng,
      groundTip: hub.groundTip,
      source: 'Indian Transit Index',
    };
    const resolvedDest: SelectedPlace = {
      label: firstAttraction.name,
      city: cityProfile.name,
      state: cityProfile.state,
      lat: firstAttraction.lat,
      lng: firstAttraction.lng,
      source: 'Curated City Highlight',
    };

    setFormError('');
    setSelectedState(cityProfile.state);
    setArrivalKind(hubArrivalKind);
    setDestKind('Temple / Landmark');
    setOriginQuery(resolvedOrigin.label);
    setDestQuery(resolvedDest.label);
    setOriginOpen(false);
    setDestOpen(false);

    void executeJourneySearch(
      resolvedOrigin,
      resolvedDest,
      passengers,
      preferredRideType,
      hubArrivalKind,
      'Temple / Landmark'
    );
  }, [activeAutoDest, executeJourneySearch, passengers, preferredRideType]);

  const heroShowcase: CinematicHeroShowcase = useMemo(() => {
    if (selectedHeroAttraction) {
      const facts: HeroFactItem[] = [
        {
          label: 'Distance from Pickup',
          value: `${selectedHeroAttraction.distanceFromPickupKm} km`,
        },
        {
          label:
            selectedHeroAttraction.category === 'Adventure & Experiences'
              ? 'Best Window'
              : 'Best Visiting Time',
          value: selectedHeroAttraction.bestVisitingTime,
        },
      ];

      if (selectedHeroAttraction.openingHours) {
        facts.push({
          label: 'Opening Hours',
          value: selectedHeroAttraction.openingHours,
        });
      } else if (typeof selectedHeroAttraction.rating === 'number') {
        facts.push({
          label: 'Visitor Rating',
          value: `${selectedHeroAttraction.rating.toFixed(1)} (${
            selectedHeroAttraction.userRatingCount || 'Google'
          })`,
        });
      } else {
        facts.push({
          label: 'Source',
          value: selectedHeroAttraction.source,
        });
      }

      const fallbackTone: CinematicHeroShowcase['fallbackTone'] =
        selectedHeroAttraction.category === 'Cafe Corner'
          ? 'coffee'
          : selectedHeroAttraction.category === 'Adventure & Experiences'
          ? 'mountain'
          : selectedHeroAttraction.category === 'Temples & Heritage'
          ? 'heritage'
          : 'teal';

      return {
        key: `attraction-${selectedHeroAttraction.id}`,
        eyebrow: `${selectedHeroAttraction.category} · ${selectedHeroAttraction.location}`,
        title: selectedHeroAttraction.name,
        description: selectedHeroAttraction.shortDescription,
        image: selectedHeroAttraction.image,
        imageAlt: `${selectedHeroAttraction.name} — ${selectedHeroAttraction.location}`,
        fallbackTone,
        facts,
        isItemSelected: true,
        resetLabel: `Back to ${destinationCityHeading} overview`,
        onReset: () => setSelectedHeroAttraction(null),
        primaryAction: {
          label: 'Compare Rides to This Place',
          onClick: () => handleSelectAttraction(selectedHeroAttraction),
        },
        secondaryActions: [
          ...(selectedHeroAttraction.sourceUrl
            ? [{ label: 'Maps & Reference', href: selectedHeroAttraction.sourceUrl }]
            : []),
          {
            label: 'Back to Destinations',
            onClick: () =>
              exploreSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
          },
        ],
      };
    }

    const overviewPhoto =
      matchedRegionalDestination?.heroImage ||
      attractions.find((a) => Boolean(a.image))?.image ||
      IMAGES.udaipurHero;

    if (regionInfo || destPlace) {
      const cityTitle = regionInfo?.city || destPlace?.city || 'Your Destination';
      const stateTitle = regionInfo?.state || destPlace?.state || selectedState || 'India';
      return {
        key: `region-${cityTitle}-${stateTitle}`,
        eyebrow: `01. Arrival & Local Discovery · ${stateTitle}`,
        title: `${cityTitle}, ${stateTitle}`,
        description:
          matchedRegionalDestination?.tagline ||
          `Compare your arrival ride into ${cityTitle} and click any temple, cafe, nature spot, or experience below to preview it full-screen.`,
        image: overviewPhoto,
        imageAlt: `${cityTitle}, ${stateTitle} regional skyline`,
        fallbackTone: 'teal',
        facts: [
          ...(originPlace
            ? [{ label: 'Arriving At', value: originPlace.label }]
            : []),
          ...(destPlace
            ? [{ label: 'First Stop', value: destPlace.label }]
            : []),
          ...(attractions.length > 0
            ? [{ label: 'Discovered Spots', value: `${attractions.length} places nearby` }]
            : []),
        ],
        primaryAction: {
          label: compareResult ? 'View Ride Comparison' : 'Get Started',
          onClick: () =>
            workspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
        },
        secondaryActions:
          attractions.length > 0
            ? [
                {
                  label: 'Explore Nearby Places',
                  onClick: () =>
                    exploreSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
                },
              ]
            : undefined,
      };
    }

    return {
      key: `travel-assist-auto-${activeAutoDest.id}`,
      eyebrow: `01. Travel Assist · ${activeAutoDest.state}`,
      title: `${activeAutoDest.name}, ${activeAutoDest.state}`,
      accentWord: activeAutoDest.name,
      description: activeAutoDest.tagline,
      image: activeAutoDest.heroImage,
      imageAlt: `${activeAutoDest.name}, ${activeAutoDest.state} destination showcase`,
      fallbackTone: 'teal',
      facts: [
        ...(activeAutoDest.arrivalHubs[0]
          ? [{ label: 'Arriving At', value: activeAutoDest.arrivalHubs[0].name }]
          : []),
        ...(activeAutoDest.attractions[0]
          ? [{ label: 'First Stop', value: activeAutoDest.attractions[0].name }]
          : []),
        { label: 'Best Season', value: activeAutoDest.bestSeason },
      ],
      primaryAction: {
        label: `Plan ${activeAutoDest.name} Arrival`,
        onClick: handleStartWithDisplayedCity,
      },
      secondaryActions: [
        {
          label: 'Enter Custom Route',
          onClick: () =>
            workspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
        },
      ],
    };
  }, [
    selectedHeroAttraction,
    destinationCityHeading,
    matchedRegionalDestination,
    attractions,
    regionInfo,
    destPlace,
    selectedState,
    originPlace,
    compareResult,
    activeAutoDest,
    handleStartWithDisplayedCity,
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F6F0] text-[#142322]">
      <Navbar />

      <main className="flex-1">
        {/* CINEMATIC AUTO-CYCLING DESTINATION HERO */}
        <CinematicDestinationHero
          sectionRef={heroSectionRef}
          showcase={heroShowcase}
          autoSlideIndicator={
            autoCycleActive
              ? {
                  total: DESTINATIONS.length,
                  activeIndex: autoSlideIndex,
                  durationMs: 6000,
                  paused: isPageHidden,
                }
              : undefined
          }
          bottomSurface="#F8F6F0"
        />

        {/* WORKSPACE SECTION: VISUALLY CONNECTED PROGRESS TRACKER + ATMOSPHERIC BACKDROP + TWO-COLUMN CARD */}
        <section
          id="travel-assist-workspace"
          ref={workspaceRef}
          className="relative overflow-x-clip bg-gradient-to-b from-[#F8F6F0] via-[#F9F7F1] to-[#F8F6F0]"
        >
          {/* Very light atmospheric blurred travel silhouette + soft warm radial wash behind tracker & form */}
          <div
            className="absolute inset-x-0 top-0 h-[520px] pointer-events-none overflow-hidden"
            aria-hidden="true"
          >
            {heroShowcase.image && (
              <img
                src={heroShowcase.image}
                alt=""
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-bottom opacity-[0.04] blur-xl scale-105 transition-opacity duration-700"
              />
            )}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(140,201,232,0.12)_0%,_rgba(248,246,240,0.65)_48%,_#F8F6F0_92%)]" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-7 sm:-mt-9 pb-10 sm:pb-14 z-20">
            {/* Progress Tracker visually bridging hero curve into form */}
            <TravelProgressTracker activeStage={activeStage} />

            {/* Unified Two-Column Container */}
            <div className="bg-white rounded-[28px] border border-[#E5DFD3] shadow-sm p-5 sm:p-7 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
            {/* LEFT COLUMN: Arrival & Destination Form */}
            <form onSubmit={handleFindMyRide} className="lg:col-span-5 space-y-5">
              {/* Heading Row + Compact State Scope */}
              <div className="flex items-start gap-3">
                <span className="w-11 h-11 rounded-2xl bg-[#123D3A]/10 text-[#123D3A] flex items-center justify-center shrink-0 mt-0.5">
                  <Car className="w-5 h-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-serif text-[26px] sm:text-[29px] font-bold text-[#142322] leading-tight">
                    Where are you arriving?
                  </h2>
                  <p className="text-sm text-[#495553] mt-0.5 leading-snug">
                    Find your best way to reach your first stop and explore everything nearby.
                  </p>
                </div>
              </div>

              {/* Compact State / UT Filter */}
              <div className="flex items-center justify-between gap-3 bg-[#F8F6F0] rounded-xl border border-[#E5DFD3] px-3.5 py-2.5">
                <label htmlFor="india-state-select" className="text-sm font-semibold text-[#123D3A] shrink-0">
                  State / UT
                </label>
                <select
                  id="india-state-select"
                  value={selectedState}
                  onChange={(e) => {
                    setSelectedState(e.target.value);
                    setOriginPlace(null);
                  }}
                  className="bg-transparent text-sm font-medium text-[#142322] focus:outline-none text-right truncate max-w-[230px] cursor-pointer"
                >
                  <option value="">All India (28 States &amp; 8 UTs)</option>
                  {INDIA_STATES_AND_UTS.map((st) => (
                    <option key={st.code} value={st.name}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* FIELD 1: I'm arriving at */}
              <div className="space-y-2.5" ref={originWrapRef}>
                <label
                  htmlFor="arrival-origin-input"
                  className="block text-sm font-bold text-[#142322]"
                >
                  I&apos;m arriving at
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ARRIVAL_OPTIONS.map((opt) => {
                    const active = arrivalKind === opt.kind;
                    return (
                      <button
                        key={opt.kind}
                        type="button"
                        onClick={() => {
                          setArrivalKind(opt.kind);
                          setOriginSuggestions([]);
                          setOriginOpen(true);
                        }}
                        className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-2.5 min-h-[42px] rounded-xl text-sm font-semibold border transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#123D3A] text-white border-[#123D3A] shadow-2xs'
                            : 'bg-[#F8F6F0] text-[#142322] border-[#E5DFD3] hover:border-[#123D3A]/45'
                        }`}
                      >
                        <KindIcon kind={opt.kind} />
                        <span className="truncate">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="relative">
                  <div className="relative flex items-center">
                    <Search
                      className="w-4 h-4 text-[#5A6664] absolute left-3.5 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      id="arrival-origin-input"
                      type="text"
                      value={originQuery}
                      onFocus={() => setOriginOpen(true)}
                      onChange={(e) => {
                        setOriginQuery(e.target.value);
                        setOriginPlace(null);
                        setOriginOpen(true);
                      }}
                      placeholder={currentOriginMeta.placeholder}
                      autoComplete="off"
                      className="w-full h-11 pl-10 pr-9 rounded-xl border border-[#D8D0C0] bg-white text-sm text-[#142322] placeholder:text-[#78827F] focus:outline-none focus:border-[#123D3A] focus:ring-2 focus:ring-[#123D3A]/15"
                    />
                    {originQuery && (
                      <button
                        type="button"
                        aria-label="Clear starting point"
                        onClick={() => {
                          setOriginQuery('');
                          setOriginPlace(null);
                          setOriginOpen(true);
                        }}
                        className="absolute right-2.5 p-1.5 text-[#5A6664] hover:text-[#142322] cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Category-Strict Origin Autocomplete Dropdown */}
                  {originOpen && (
                    <div className="absolute z-30 mt-1.5 w-full bg-white rounded-2xl border border-[#D8D0C0] shadow-xl max-h-72 overflow-y-auto divide-y divide-[#F1ECE2]">
                      <div className="px-3.5 py-2 bg-[#F8F6F0] eyebrow-mono text-[#5A6664]">
                        {arrivalKind} Suggestions
                      </div>

                      {originLoading && <SuggestSkeleton rows={3} />}

                      {!originLoading && originSuggestions.length === 0 && (
                        <div className="p-3.5 space-y-2 text-sm text-[#495553]">
                          <p>
                            {originQuery.trim().length < 2
                              ? `Type a ${arrivalKind.toLowerCase()} name or city to search.`
                              : `No matching ${arrivalKind.toLowerCase()} found for "${originQuery.trim()}".`}
                          </p>
                          {originQuery.trim().length >= 2 && (
                            <button
                              type="button"
                              onClick={async () => {
                                setOriginOpen(false);
                                const resolved = await resolveCustomTextPlace(
                                  originQuery,
                                  currentOriginMeta.apiKind,
                                  null
                                );
                                if (resolved) setOriginPlace(resolved);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#F3EFE6] text-[#123D3A] text-sm font-semibold hover:bg-[#EAE3D5]"
                            >
                              <MapPin className="w-4 h-4" />
                              <span>Use &ldquo;{originQuery.trim()}&rdquo;</span>
                            </button>
                          )}
                        </div>
                      )}

                      {originSuggestions.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setOriginQuery(item.label);
                            setOriginPlace({
                              label: item.label,
                              city: item.city,
                              state: item.state,
                              lat: item.lat,
                              lng: item.lng,
                              groundTip: item.groundTip,
                              source: item.source,
                            });
                            if (item.state && !selectedState) {
                              setSelectedState(item.state);
                            }
                            setOriginOpen(false);
                          }}
                          className="w-full text-left px-3.5 py-2.5 hover:bg-[#F8F6F0] transition-colors flex items-start justify-between gap-2 cursor-pointer"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#142322] truncate">
                              {item.label}
                            </p>
                            <p className="text-sm text-[#495553] truncate mt-0.5">
                              {item.subtitle}
                            </p>
                          </div>
                          <span className="text-sm font-medium text-[#5A6664] shrink-0 pt-0.5">
                            {item.source}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* FIELD 2: Where do you want to go first? */}
              <div className="space-y-2.5" ref={destWrapRef}>
                <label
                  htmlFor="arrival-dest-input"
                  className="block text-sm font-bold text-[#142322]"
                >
                  Where do you want to go first?
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {FIRST_DEST_OPTIONS.map((opt) => {
                    const active = destKind === opt.kind;
                    return (
                      <button
                        key={opt.kind}
                        type="button"
                        onClick={() => {
                          setDestKind(opt.kind);
                          setDestSuggestions([]);
                          setDestOpen(true);
                        }}
                        className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-2.5 min-h-[42px] rounded-xl text-sm font-semibold border transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#123D3A] text-white border-[#123D3A] shadow-2xs'
                            : 'bg-[#F8F6F0] text-[#142322] border-[#E5DFD3] hover:border-[#123D3A]/45'
                        }`}
                      >
                        <DestKindIcon kind={opt.kind} />
                        <span className="truncate">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="relative">
                  <div className="relative flex items-center">
                    <MapPin
                      className="w-4 h-4 text-[#E9A34A] absolute left-3.5 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      id="arrival-dest-input"
                      type="text"
                      value={destQuery}
                      onFocus={() => setDestOpen(true)}
                      onChange={(e) => {
                        setDestQuery(e.target.value);
                        setDestPlace(null);
                        setDestOpen(true);
                      }}
                      placeholder={currentDestMeta.placeholder}
                      autoComplete="off"
                      className="w-full h-11 pl-10 pr-9 rounded-xl border border-[#D8D0C0] bg-white text-sm text-[#142322] placeholder:text-[#78827F] focus:outline-none focus:border-[#123D3A] focus:ring-2 focus:ring-[#123D3A]/15"
                    />
                    {destQuery && (
                      <button
                        type="button"
                        aria-label="Clear first destination"
                        onClick={() => {
                          setDestQuery('');
                          setDestPlace(null);
                          setDestOpen(true);
                        }}
                        className="absolute right-2.5 p-1.5 text-[#5A6664] hover:text-[#142322] cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Category-Strict Destination Autocomplete Dropdown */}
                  {destOpen && (
                    <div className="absolute z-30 mt-1.5 w-full bg-white rounded-2xl border border-[#D8D0C0] shadow-xl max-h-72 overflow-y-auto divide-y divide-[#F1ECE2]">
                      <div className="px-3.5 py-2 bg-[#F8F6F0] eyebrow-mono text-[#5A6664]">
                        {destKind} Suggestions
                      </div>

                      {destLoading && <SuggestSkeleton rows={3} />}

                      {!destLoading && destSuggestions.length === 0 && (
                        <div className="p-3.5 space-y-2 text-sm text-[#495553]">
                          <p>
                            {destQuery.trim().length < 2
                              ? currentDestMeta.emptyHint
                              : `No matching ${destKind.toLowerCase()} found for "${destQuery.trim()}".`}
                          </p>
                          {destQuery.trim().length >= 2 && (
                            <button
                              type="button"
                              onClick={async () => {
                                setDestOpen(false);
                                const resolved = await resolveCustomTextPlace(
                                  destQuery,
                                  currentDestMeta.apiKind,
                                  originPlace
                                );
                                if (resolved) setDestPlace(resolved);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#F3EFE6] text-[#123D3A] text-sm font-semibold hover:bg-[#EAE3D5]"
                            >
                              <MapPin className="w-4 h-4" />
                              <span>Use &ldquo;{destQuery.trim()}&rdquo;</span>
                            </button>
                          )}
                        </div>
                      )}

                      {destSuggestions.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setDestQuery(item.label);
                            setDestPlace({
                              label: item.label,
                              city: item.city,
                              state: item.state,
                              lat: item.lat,
                              lng: item.lng,
                              source: item.source,
                            });
                            setDestOpen(false);
                          }}
                          className="w-full text-left px-3.5 py-2.5 hover:bg-[#F8F6F0] transition-colors flex items-start justify-between gap-2 cursor-pointer"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#142322] truncate">
                              {item.label}
                            </p>
                            <p className="text-sm text-[#495553] truncate mt-0.5">
                              {item.subtitle}
                            </p>
                          </div>
                          <span className="text-sm font-medium text-[#5A6664] shrink-0 pt-0.5">
                            {item.source}
                          </span>
                        </button>
                      ))}

                      {destQuery.trim().length >= 2 && destSuggestions.length > 0 && (
                        <div className="px-3.5 py-2.5 bg-[#F8F6F0] flex items-center justify-between gap-2">
                          <span className="text-sm text-[#5A6664]">Specific street or guesthouse?</span>
                          <button
                            type="button"
                            onClick={async () => {
                              setDestOpen(false);
                              const resolved = await resolveCustomTextPlace(
                                destQuery,
                                currentDestMeta.apiKind,
                                originPlace
                              );
                              if (resolved) setDestPlace(resolved);
                            }}
                            className="text-sm font-semibold text-[#123D3A] hover:underline"
                          >
                            Use &ldquo;{destQuery.trim()}&rdquo;
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* FIELD 3: Passengers Stepper (- 2 +) matching UI reference */}
              <div className="flex items-center justify-between gap-4 pt-1">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#123D3A]" aria-hidden="true" />
                  <span className="text-sm font-bold text-[#142322]">Passengers</span>
                </div>

                <div
                  className="inline-flex items-center gap-3 bg-[#F8F6F0] border border-[#E5DFD3] rounded-full px-2 py-1"
                  role="group"
                  aria-label="Passenger count stepper"
                >
                  <button
                    type="button"
                    aria-label="Decrease passengers"
                    disabled={passengers <= 1}
                    onClick={() => handleStepPassengers(-1)}
                    className="w-8 h-8 rounded-full bg-white border border-[#D8D0C0] flex items-center justify-center text-[#142322] hover:border-[#123D3A] disabled:opacity-40 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                  <span className="font-mono font-bold text-base text-[#142322] min-w-[24px] text-center">
                    {passengers === 6 ? '6+' : passengers}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase passengers"
                    disabled={passengers >= 6}
                    onClick={() => handleStepPassengers(1)}
                    className="w-8 h-8 rounded-full bg-white border border-[#D8D0C0] flex items-center justify-center text-[#142322] hover:border-[#123D3A] disabled:opacity-40 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* FIELD 4: How would you like to travel? (Compact Visual Cards) */}
              <div className="pt-2 border-t border-[#E5DFD3] space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="eyebrow-mono font-bold text-[#123D3A]">
                    How would you like to travel?
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreferredRideType('all')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors cursor-pointer ${
                      preferredRideType === 'all'
                        ? 'bg-[#123D3A] text-white border-[#123D3A]'
                        : 'bg-[#F8F6F0] text-[#123D3A] border-[#D8D0C0] hover:border-[#123D3A]'
                    }`}
                  >
                    Compare All
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {RIDE_MODE_CARDS.map((card) => {
                    const selected = preferredRideType === card.mode;
                    return (
                      <button
                        key={card.mode}
                        type="button"
                        onClick={() => setPreferredRideType(card.mode)}
                        aria-pressed={selected}
                        className={`group text-left rounded-xl border overflow-hidden transition-all cursor-pointer ${
                          selected
                            ? 'border-[#123D3A] ring-2 ring-[#123D3A]/20 bg-[#F8F6F0]'
                            : 'border-[#E5DFD3] bg-white hover:border-[#123D3A]/40'
                        }`}
                      >
                        <div className="aspect-[16/10] w-full overflow-hidden bg-[#F3EFE6] relative">
                          <img
                            src={card.image}
                            alt={`${card.title} — ${card.tagline}`}
                            className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-300"
                          />
                          {selected && (
                            <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#123D3A] text-white flex items-center justify-center shadow-xs">
                              <Check className="w-3 h-3" aria-hidden="true" />
                            </span>
                          )}
                        </div>
                        <div className="p-2.5">
                          <p className="text-sm font-bold text-[#142322] leading-tight">{card.title}</p>
                          <p className="text-sm text-[#5A6664] truncate">{card.tagline}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Saffron Primary Submit CTA ("Find My Ride ->") */}
              <button
                type="submit"
                disabled={findingRide}
                className="w-full inline-flex items-center justify-center gap-2.5 h-12 rounded-xl bg-[#E9A34A] text-[#142322] text-[15px] font-bold hover:bg-[#DF9538] disabled:opacity-60 transition-colors shadow-xs cursor-pointer"
              >
                {findingRide ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>Calculating Road Route &amp; Fares...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" aria-hidden="true" />
                    <span>Find My Ride</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </>
                )}
              </button>

              {formError && (
                <div
                  role="alert"
                  className="rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-900 flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Quick Sample Route Shortcuts (Always execute real OSRM + API compare) */}
              <div className="pt-1 flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-[#5A6664] mr-1">Try live route:</span>
                {QUICK_SAMPLE_ROUTES.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => handleLoadSample(sample)}
                    className="px-3 py-1.5 rounded-lg bg-[#F8F6F0] border border-[#E5DFD3] text-sm font-medium text-[#123D3A] hover:border-[#123D3A] hover:bg-[#F3EFE6] transition-colors cursor-pointer"
                  >
                    {sample.title}
                  </button>
                ))}
              </div>
            </form>

            {/* RIGHT COLUMN: Live Route Comparison Results + OSRM Polyline Map */}
            <div className="lg:col-span-7 lg:border-l lg:border-[#E5DFD3]/70 lg:pl-7 space-y-5">
              {findingRide ? (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-[#495553]">
                    Querying OSRM road routing and comparing Rapido, Ola, Uber, and Prepaid Stand tariffs…
                  </p>
                  <RideCompareSkeleton columns={3} />
                </div>
              ) : compareError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50/60 p-7 text-center space-y-3">
                  <AlertCircle className="w-8 h-8 text-red-700 mx-auto" />
                  <p className="text-base font-semibold text-red-900">{compareError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      if (originPlace && destPlace) {
                        runLiveCompare(originPlace, destPlace, passengers, selectedState);
                      }
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E9A34A] text-[#142322] text-sm font-bold hover:bg-[#DF9538] cursor-pointer"
                  >
                    Retry Route Calculation
                  </button>
                </div>
              ) : compareResult ? (
                <>
                  <RideComparisonSection
                    compareResult={compareResult}
                    passengers={passengers}
                    initialCategory={preferredRideType}
                    onCategoryChange={(cat) => setPreferredRideType(cat)}
                    layoutVariant="split-grid"
                  />

                  {/* Compact Live OSRM Route Polyline Map + Full Compare Page Link */}
                  <div className="space-y-3 pt-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="eyebrow-mono font-bold text-[#123D3A] flex items-center gap-1.5">
                        <Route className="w-4 h-4 text-[#E9A34A]" aria-hidden="true" />
                        <span>Live Route Polyline Preview</span>
                      </p>
                      <Link
                        to={fullCompareHref}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#123D3A] hover:underline"
                      >
                        <span>Open Full Route &amp; Save Options</span>
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </Link>
                    </div>
                    <GoogleRouteMap
                      stops={mapStops}
                      routeGeometry={compareResult.route.geometry}
                      heightClass="h-[225px]"
                    />
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-[#E5DFD3] bg-[#FDFBF7] p-6 sm:p-8 space-y-6">
                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#123D3A]/10 text-[#123D3A] text-sm font-semibold">
                      <Sparkles className="w-4 h-4 text-[#E9A34A]" aria-hidden="true" />
                      <span>Real Road Routing &amp; Transparent Tariff Engine</span>
                    </span>
                    <h3 className="font-serif text-2xl sm:text-[28px] font-semibold text-[#142322] leading-snug">
                      Compare Bike, Auto, and Cab fares side-by-side
                    </h3>
                    <p className="text-[15px] text-[#495553] leading-relaxed">
                      Enter where you are arriving and your first destination on the left, or launch one of these live Indian corridors right now to compute OSRM road distance, polyline route, and itemized provider estimates.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {QUICK_SAMPLE_ROUTES.map((sample) => (
                      <button
                        key={`card-${sample.id}`}
                        type="button"
                        onClick={() => handleLoadSample(sample)}
                        className="text-left p-4 rounded-xl bg-white border border-[#E5DFD3] hover:border-[#123D3A] hover:shadow-xs transition-all space-y-1.5 cursor-pointer"
                      >
                        <p className="eyebrow-mono font-bold text-[#E9A34A]">
                          {sample.state}
                        </p>
                        <p className="text-sm font-bold text-[#142322] leading-snug">
                          {sample.title}
                        </p>
                        <p className="text-sm text-[#123D3A] font-semibold inline-flex items-center gap-1 pt-1">
                          <span>Compute Live Route</span>
                          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </p>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[#E5DFD3] text-sm text-[#495553]">
                    <div className="space-y-1">
                      <p className="font-bold text-[#142322]">Category-Strict India Search</p>
                      <p>Stations, bus stands, airports, temples, and hotels each search their exact directory.</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-[#142322]">Itemized Fare Cards</p>
                      <p>Inspect base fare, per-km slab, time charge, booking fee, and regional source notes.</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-[#142322]">Local Sightseeing &amp; Cafes</p>
                      <p>Once routed, explore attractions, Cafe Corner, and Adventure experiences nearby.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          </div>
        </section>

        {/* EXPLORE ALL DESTINATIONS IN [CITY] SECTION */}
        {(discoverLoading || attractions.length > 0 || discoverError) && (
          <section
            id="explore-destinations"
            ref={exploreSectionRef}
            onMouseEnter={() => setExploringSectionActive(true)}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 pt-2 space-y-7"
          >
            {/* Header Strip Matching UI Reference */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
              <div className="flex items-start gap-3 max-w-3xl">
                <span className="w-10 h-10 rounded-full bg-[#E9A34A]/20 text-[#123D3A] flex items-center justify-center shrink-0 mt-1">
                  <MapPin className="w-5 h-5 text-[#123D3A]" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-serif text-[26px] sm:text-[32px] font-bold text-[#142322] leading-tight">
                    Explore All Destinations in {destinationCityHeading}
                  </h2>
                  <p className="text-sm sm:text-base text-[#495553] mt-1">
                    Discover temples, beaches, cafes, and regional attractions across{' '}
                    {regionInfo?.state || destPlace?.state || 'this destination'}.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                {pickupPlace && (
                  <div
                    ref={pickupWrapRef}
                    className="relative bg-white border border-[#E5DFD3] rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-2xs"
                  >
                    <div className="min-w-0 max-w-[210px]">
                      <p className="eyebrow-mono font-bold text-[#5A6664]">
                        Pickup Reference
                      </p>
                      <p className="text-sm font-semibold text-[#123D3A] truncate">
                        {pickupPlace.label}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPickup((prev) => !prev);
                        setPickupOpen(true);
                      }}
                      className="inline-flex items-center gap-1 text-sm font-bold text-[#123D3A] hover:underline cursor-pointer shrink-0"
                    >
                      <Edit3 className="w-4 h-4" aria-hidden="true" />
                      <span>{editingPickup ? 'Close' : 'Edit'}</span>
                    </button>

                    {editingPickup && (
                      <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-xl border border-[#D8D0C0] shadow-xl p-2.5 z-30">
                        <input
                          type="text"
                          value={pickupQuery}
                          onFocus={() => setPickupOpen(true)}
                          onChange={(e) => {
                            setPickupQuery(e.target.value);
                            setPickupOpen(true);
                          }}
                          placeholder="Change pickup hotel or landmark..."
                          className="w-full h-10 px-3 rounded-lg border border-[#D8D0C0] bg-[#F8F6F0] text-sm text-[#142322] focus:outline-none focus:border-[#123D3A]"
                        />
                        {pickupOpen && (
                          <div className="mt-1.5 max-h-48 overflow-y-auto divide-y divide-[#F1ECE2]">
                            {pickupLoading && <SuggestSkeleton rows={2} />}
                            {pickupSuggestions.map((s) => (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() =>
                                  handleApplyNewPickup({
                                    label: s.label,
                                    city: s.city,
                                    state: s.state,
                                    lat: s.lat,
                                    lng: s.lng,
                                    source: s.source,
                                  })
                                }
                                className="w-full text-left px-2 py-2 hover:bg-[#F8F6F0] text-sm cursor-pointer"
                              >
                                <p className="font-semibold text-[#142322] truncate">{s.label}</p>
                                <p className="text-sm text-[#5A6664] truncate">{s.subtitle}</p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <Link
                  to="/explore"
                  className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-full bg-white border border-[#D8D0C0] text-sm font-semibold text-[#142322] hover:border-[#123D3A] hover:bg-[#F3EFE6] transition-colors"
                >
                  <span>View More Destinations</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            </div>

            {/* Search & Category Filter Bar */}
            {!discoverLoading && attractions.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#E5DFD3] p-4 space-y-3 shadow-2xs">
                <div className="flex flex-col md:flex-row gap-3 justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-[#5A6664] absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
                    <input
                      type="text"
                      value={attractionSearch}
                      onChange={(e) => setAttractionSearch(e.target.value)}
                      placeholder="Filter temples, beaches, cafes, adventures..."
                      aria-label="Filter discovered attractions"
                      className="w-full h-11 pl-10 pr-4 rounded-xl border border-[#D8D0C0] bg-[#F8F6F0] text-sm text-[#142322] placeholder:text-[#78827F] focus:outline-none focus:border-[#123D3A]"
                    />
                  </div>
                  <p className="text-sm text-[#495553] self-center">
                    Showing <strong className="font-mono text-[#123D3A]">{filteredAttractions.length}</strong> of{' '}
                    <span className="font-mono">{attractions.length}</span> places within 75 km
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(['All', ...CATEGORY_ORDER] as const).map((cat) => {
                    const active = activeCategoryFilter === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setActiveCategoryFilter(cat)}
                        className={`px-3.5 py-2 min-h-[40px] rounded-xl text-sm font-semibold border transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#123D3A] text-white border-[#123D3A]'
                            : 'bg-[#F8F6F0] text-[#142322] border-[#E5DFD3] hover:border-[#123D3A]/40'
                        }`}
                      >
                        {cat === 'All' ? 'All Categories' : cat}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {discoverLoading && (
              <div className="space-y-4">
                <p className="text-sm font-medium text-[#495553]">
                  Discovering landmarks, beaches, cafes, and adventure experiences across {destinationCityHeading}…
                </p>
                <DiscoverySkeleton count={3} />
              </div>
            )}

            {discoverError && !discoverLoading && (
              <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5 text-sm text-amber-900">
                {discoverError}
              </div>
            )}

            {!discoverLoading && filteredAttractions.length === 0 && attractions.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#E5DFD3] p-8 text-center space-y-3">
                <p className="text-base font-medium text-[#142322]">
                  No places matched &ldquo;{attractionSearch}&rdquo;.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setAttractionSearch('');
                    setActiveCategoryFilter('All');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#123D3A] text-white text-sm font-medium cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            )}

            {/* Grouped Horizontal Sliding Category Carousels (including Cafe Corner & Adventure & Experiences) */}
            {!discoverLoading && filteredAttractions.length > 0 && (
              <div className="space-y-10">
                {CATEGORY_ORDER.map((category) => {
                  const list = groupedCarousels[category];
                  if (!list || list.length === 0) return null;
                  return (
                    <DestinationCarousel
                      key={category}
                      title={category}
                      subtitle={CATEGORY_SUBTITLES[category]}
                      attractions={list}
                      selectedAttractionId={selectedHeroAttraction?.id || null}
                      pickupLabel={pickupPlace?.label || destPlace?.label || 'your pickup'}
                      onPreviewAttraction={handlePreviewAttractionInHero}
                      onOpenDetailCard={handleOpenAttractionOverlay}
                      onSelectAttraction={handleSelectAttraction}
                    />
                  );
                })}

                {/* Complete Regional Directory Grid with Load More */}
                {filteredAttractions.length > 8 && (
                  <div className="pt-6 border-t border-[#E5DFD3] space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#142322]">
                        All Discovered Regional Spots ({filteredAttractions.length})
                      </h3>
                      {filteredAttractions.length > visibleGridLimit && (
                        <button
                          type="button"
                          onClick={() => setVisibleGridLimit((n) => n + 12)}
                          className="px-4 py-2.5 rounded-xl bg-white border border-[#D8D0C0] text-sm font-semibold text-[#123D3A] hover:bg-[#F3EFE6] self-start cursor-pointer"
                        >
                          Load More ({filteredAttractions.length - visibleGridLimit} remaining)
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredAttractions.slice(0, visibleGridLimit).map((item) => {
                        const isSelectedSpot = item.id === selectedHeroAttraction?.id;
                        return (
                          <div
                            key={`dir-${item.id}`}
                            onMouseEnter={() => preloadHeroImage(item.image)}
                            className={`bg-white rounded-xl border p-4 flex items-center justify-between gap-3 transition-all hover:-translate-y-0.5 hover:shadow-md ${
                              isSelectedSpot
                                ? 'border-[#123D3A] ring-2 ring-[#E9A34A]/60 shadow-sm'
                                : 'border-[#E5DFD3] hover:border-[#123D3A]/45'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleOpenAttractionOverlay(item)}
                              className="min-w-0 text-left flex-1 cursor-pointer focus:outline-none"
                            >
                              <p className="eyebrow-mono font-bold text-[#123D3A]">
                                {item.category} · {item.distanceFromPickupKm} km
                              </p>
                              <p className="font-semibold text-[15px] text-[#142322] truncate mt-0.5 hover:text-[#123D3A]">
                                {item.name}
                              </p>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSelectAttraction(item)}
                              className="shrink-0 px-3.5 py-2.5 min-h-[40px] rounded-lg bg-[#F3EFE6] hover:bg-[#123D3A] hover:text-white text-sm font-semibold text-[#123D3A] transition-colors cursor-pointer"
                            >
                              Compare Rides
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* Helpful Ground-Level Onboarding Note if user hasn't searched yet */}
        {attractions.length === 0 && !discoverLoading && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            <div className="bg-white rounded-3xl border border-[#E5DFD3] p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#F3EFE6] text-[#123D3A]">
                  <Train className="w-5 h-5" aria-hidden="true" />
                </span>
                <h3 className="font-serif text-xl font-semibold text-[#142322]">
                  All-India Transit Intelligence
                </h3>
                <p className="text-sm text-[#495553] leading-relaxed">
                  Covers all 28 States &amp; 8 Union Territories with strict filtering between railway stations, bus stands, airports, temples, and hotels.
                </p>
              </div>

              <div className="space-y-2">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#F3EFE6] text-[#123D3A]">
                  <Compass className="w-5 h-5 text-[#E9A34A]" aria-hidden="true" />
                </span>
                <h3 className="font-serif text-xl font-semibold text-[#142322]">
                  OSRM Route &amp; Provider Cards
                </h3>
                <p className="text-sm text-[#495553] leading-relaxed">
                  Every distance, duration, and route polyline is computed from road network routing, paired with transparent per-km and base-fare cards.
                </p>
              </div>

              <div className="space-y-2">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#F3EFE6] text-[#123D3A]">
                  <Navigation className="w-5 h-5" aria-hidden="true" />
                </span>
                <h3 className="font-serif text-xl font-semibold text-[#142322]">
                  Local Spots, Cafes &amp; Adventures
                </h3>
                <p className="text-sm text-[#495553] leading-relaxed">
                  Once your arrival route is ready, browse nearby attractions, Cafe Corner, and Adventure experiences and compare rides to any stop.
                </p>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
