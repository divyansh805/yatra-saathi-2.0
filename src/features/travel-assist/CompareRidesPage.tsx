import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  Clock,
  Compass,
  Edit3,
  MapPin,
  Users,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { GoogleRouteMap, type MapStop } from '../../components/GoogleRouteMap';
import { TravelProgressTracker } from '../../components/TravelProgressTracker';
import {
  RideComparisonSection,
  type CompareResult,
} from '../../components/ProviderBadge';
import { RideCompareSkeleton, SuggestSkeleton } from '../../components/SkeletonCards';
import {
  readTravelAssistSession,
  writeTravelAssistSession,
  type SelectedPlace,
} from './travelAssistSession';
import { useApp } from '../../contexts/AppContext';

interface PlaceSuggestion {
  id: string;
  label: string;
  subtitle: string;
  city: string;
  state: string;
  placeType: string;
  lat: number;
  lng: number;
  source: string;
}

export function CompareRidesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, savePlannedRoute } = useApp();

  const sessionState = useMemo(() => readTravelAssistSession(), []);

  const mode: 'arrival' | 'attraction' =
    searchParams.get('mode') === 'attraction' ? 'attraction' : 'arrival';

  const oLabel = searchParams.get('oLabel') || sessionState?.originPlace?.label || '';
  const oLat = Number(searchParams.get('oLat') ?? sessionState?.originPlace?.lat);
  const oLng = Number(searchParams.get('oLng') ?? sessionState?.originPlace?.lng);

  const dLabel = searchParams.get('dLabel') || sessionState?.destPlace?.label || '';
  const dLat = Number(searchParams.get('dLat') ?? sessionState?.destPlace?.lat);
  const dLng = Number(searchParams.get('dLng') ?? sessionState?.destPlace?.lng);

  const paxParam = Number(searchParams.get('pax') || sessionState?.passengers || 2);
  const [passengers, setPassengers] = useState<number>(
    Number.isFinite(paxParam) && paxParam >= 1 ? Math.min(6, paxParam) : 2
  );

  const cityName = searchParams.get('city') || sessionState?.destPlace?.city || sessionState?.originPlace?.city || '';
  const stateName = searchParams.get('state') || sessionState?.destPlace?.state || sessionState?.originPlace?.state || '';
  const groundTip = searchParams.get('groundTip') || (mode === 'arrival' ? sessionState?.originPlace?.groundTip : '') || '';

  const attrCategory = searchParams.get('attrCategory') || '';
  const attrDesc = searchParams.get('attrDesc') || '';
  const attrTime = searchParams.get('attrTime') || '';

  const rawPref = searchParams.get('pref') || sessionState?.preferredRideType || 'all';
  const preferredCategory: 'bike' | 'auto' | 'cab' | 'all' =
    rawPref === 'bike' || rawPref === 'auto' || rawPref === 'cab' ? rawPref : 'all';

  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [routeSavedSuccess, setRouteSavedSuccess] = useState<boolean>(false);

  // Editable Pickup state (for local attraction mode)
  const [editingPickup, setEditingPickup] = useState<boolean>(false);
  const [pickupQuery, setPickupQuery] = useState<string>(oLabel);
  const [pickupSuggestions, setPickupSuggestions] = useState<PlaceSuggestion[]>([]);
  const [pickupOpen, setPickupOpen] = useState<boolean>(false);
  const [pickupLoading, setPickupLoading] = useState<boolean>(false);
  const pickupWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [mode, dLabel]);

  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      if (pickupWrapRef.current && !pickupWrapRef.current.contains(e.target as Node)) {
        setPickupOpen(false);
      }
    };
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, []);

  // Fetch comparison whenever origin, destination, or passenger count changes
  const fetchComparison = useCallback(async () => {
    if (!oLabel || !dLabel || !Number.isFinite(oLat) || !Number.isFinite(oLng) || !Number.isFinite(dLat) || !Number.isFinite(dLng)) {
      setError('Journey coordinates are missing. Please choose your starting point and destination first.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    setRouteSavedSuccess(false);

    try {
      const res = await fetch('/api/travel-assist/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originLat: oLat,
          originLng: oLng,
          originLabel: oLabel,
          destLat: dLat,
          destLng: dLng,
          destLabel: dLabel,
          passengers,
          cityName,
          stateName,
        }),
      });
      if (!res.ok) {
        const errJson = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errJson.error || 'Could not compute ride comparison.');
      }
      const data = (await res.json()) as CompareResult;
      setCompareResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load ride comparison right now.');
    } finally {
      setLoading(false);
    }
  }, [oLabel, oLat, oLng, dLabel, dLat, dLng, passengers, cityName, stateName]);

  useEffect(() => {
    fetchComparison();
  }, [fetchComparison]);

  // Autocomplete when editing pickup point on /travel-assist/compare
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
        if (stateName) params.set('state', stateName);
        if (Number.isFinite(dLat) && Number.isFinite(dLng)) {
          params.set('biasLat', String(dLat));
          params.set('biasLng', String(dLng));
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
  }, [pickupQuery, pickupOpen, editingPickup, stateName, dLat, dLng]);

  const applyPickupUpdate = (newPickup: SelectedPlace) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('oLabel', newPickup.label);
    nextParams.set('oLat', String(newPickup.lat));
    nextParams.set('oLng', String(newPickup.lng));
    setSearchParams(nextParams, { replace: true });
    setPickupQuery(newPickup.label);
    setEditingPickup(false);
    setPickupOpen(false);

    if (sessionState) {
      writeTravelAssistSession({
        ...sessionState,
        pickupPlace: newPickup,
      });
    }
  };

  const handlePassengerChange = (count: number) => {
    setPassengers(count);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('pax', String(count));
    setSearchParams(nextParams, { replace: true });
    if (sessionState) {
      writeTravelAssistSession({
        ...sessionState,
        passengers: count,
      });
    }
  };

  const handleSaveRoute = async () => {
    if (!compareResult || !user) return;
    const minFareQuote = compareResult.quotes.find(
      (q) => q.fareStatus !== 'Fare Unavailable' && (q.calculatedFareInr !== null || q.fareMinInr !== null)
    );
    const minFare = minFareQuote?.calculatedFareInr ?? minFareQuote?.fareMinInr ?? null;

    await savePlannedRoute({
      destinationId: (cityName || 'india').toLowerCase().replace(/\s+/g, '-'),
      destinationName: `${compareResult.route.originLabel} → ${compareResult.route.destLabel}`,
      pickupLabel: compareResult.route.originLabel,
      stops: [
        {
          id: 'origin',
          name: compareResult.route.originLabel,
          lat: compareResult.route.origin.lat,
          lng: compareResult.route.origin.lng,
        },
        {
          id: 'dest',
          name: compareResult.route.destLabel,
          lat: compareResult.route.destination.lat,
          lng: compareResult.route.destination.lng,
        },
      ],
      totalDistanceKm: compareResult.route.distanceKm,
      totalDurationMin: compareResult.route.durationMin,
      estimatedTransportInr: minFare,
    });
    setRouteSavedSuccess(true);
  };

  const mapStops: MapStop[] = useMemo(() => {
    if (!compareResult) return [];
    return [
      {
        id: 'cmp-origin',
        label: compareResult.route.originLabel,
        lat: compareResult.route.origin.lat,
        lng: compareResult.route.origin.lng,
        kind: 'origin',
      },
      {
        id: 'cmp-dest',
        label: compareResult.route.destLabel,
        lat: compareResult.route.destination.lat,
        lng: compareResult.route.destination.lng,
        kind: 'destination',
      },
    ];
  }, [compareResult]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F6F0] text-[#142322]">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Centered Prominent Progress Tracker */}
        <TravelProgressTracker activeStage={mode === 'attraction' ? 4 : 2} />

        {/* Navigation & Context Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5DFD3] pb-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/travel-assist#explore-destinations')}
                className="inline-flex items-center gap-1.5 text-sm sm:text-[15px] font-semibold text-[#123D3A] hover:text-[#194E4A] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>
                  {mode === 'attraction'
                    ? 'Back to Explore Destinations'
                    : 'Back to Arrival & Destinations'}
                </span>
              </button>
            </div>

            <p className="eyebrow-mono font-semibold text-[#E9A34A]">
              {mode === 'attraction'
                ? 'Local Attraction Ride Comparison'
                : 'First Journey Arrival Comparison'}
            </p>
            <h1 className="font-serif text-[30px] sm:text-[38px] font-semibold text-[#142322] leading-tight">
              {dLabel ? `Rides to ${dLabel}` : 'Compare Rides'}
            </h1>
            {oLabel && dLabel && (
              <p className="text-base text-[#495553]">
                From <strong className="text-[#142322]">{oLabel}</strong> to{' '}
                <strong className="text-[#142322]">{dLabel}</strong>
                {cityName ? ` · ${cityName}${stateName ? `, ${stateName}` : ''}` : ''}
              </p>
            )}
          </div>

          {/* Actions: Save Route + Explore Destinations */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {user && compareResult && (
              <button
                type="button"
                onClick={handleSaveRoute}
                disabled={routeSavedSuccess}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#D8D0C0] bg-white text-[15px] font-medium text-[#123D3A] hover:bg-[#F3EFE6] disabled:opacity-75"
              >
                {routeSavedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-700" />
                    <span>Saved</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4" />
                    <span>Save Route</span>
                  </>
                )}
              </button>
            )}

            <Link
              to="/travel-assist#explore-destinations"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E9A34A] text-[#142322] text-[15px] font-semibold hover:bg-[#DF9538] transition-colors shadow-xs"
            >
              <span>Explore All Destinations</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Controls Bar: Passenger Adjuster + Editable Pickup (in Attraction mode) + Attraction Info */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Attraction Metadata or Station Ground Tip */}
          {(attrDesc || groundTip) && (
            <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E5DFD3] p-5 space-y-2 shadow-xs">
              {mode === 'attraction' ? (
                <>
                  <p className="eyebrow-mono font-semibold text-[#123D3A]">
                    {attrCategory || 'Destination Overview'}
                  </p>
                  {attrDesc && <p className="text-[15px] text-[#394543] leading-relaxed">{attrDesc}</p>}
                  {attrTime && (
                    <p className="text-sm text-[#495553] flex items-center gap-1.5 pt-1">
                      <Clock className="w-4 h-4 text-[#E9A34A]" aria-hidden="true" />
                      <span>Best time: {attrTime}</span>
                    </p>
                  )}
                </>
              ) : (
                <div className="flex items-start gap-3">
                  <Compass className="w-5 h-5 text-[#E9A34A] shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-[15px] text-[#394543] leading-relaxed">
                    <strong className="text-[#142322]">Station Ground Tip:</strong> {groundTip}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Passenger + Editable Pickup Controls */}
          <div
            ref={pickupWrapRef}
            className={`${
              attrDesc || groundTip ? 'lg:col-span-5' : 'lg:col-span-12'
            } bg-white rounded-2xl border border-[#E5DFD3] p-5 space-y-4 shadow-xs`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#142322]">
                <Users className="w-4 h-4 text-[#123D3A]" aria-hidden="true" />
                <span>Passengers:</span>
              </div>
              <div className="inline-flex items-center gap-1.5">
                {[1, 2, 3, 4, 5, 6].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => handlePassengerChange(cnt)}
                    className={`w-9 h-9 rounded-lg text-sm font-mono font-semibold border transition-colors ${
                      passengers === cnt
                        ? 'bg-[#123D3A] text-white border-[#123D3A]'
                        : 'bg-[#F8F6F0] text-[#142322] border-[#D8D0C0] hover:border-[#123D3A]'
                    }`}
                  >
                    {cnt === 6 ? '6+' : cnt}
                  </button>
                ))}
              </div>
            </div>

            {mode === 'attraction' && (
              <div className="pt-3 border-t border-[#E5DFD3] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="eyebrow-mono font-semibold text-[#5A6664]">
                    Pickup Point
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPickup((prev) => !prev);
                      setPickupOpen(true);
                    }}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-[#123D3A] hover:underline"
                  >
                    <Edit3 className="w-4 h-4" aria-hidden="true" />
                    <span>{editingPickup ? 'Cancel' : 'Change Pickup'}</span>
                  </button>
                </div>

                <p className="text-[15px] font-semibold text-[#142322] flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#123D3A] shrink-0" aria-hidden="true" />
                  <span className="truncate">{oLabel}</span>
                </p>

                {sessionState && (
                  <div className="flex flex-wrap gap-2">
                    {sessionState.destPlace && (
                      <button
                        type="button"
                        onClick={() => applyPickupUpdate(sessionState.destPlace!)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
                          oLabel === sessionState.destPlace.label
                            ? 'bg-[#123D3A] text-white border-[#123D3A]'
                            : 'bg-[#F8F6F0] text-[#142322] border-[#E5DFD3] hover:border-[#123D3A]'
                        }`}
                      >
                        First Stop: {sessionState.destPlace.label.slice(0, 24)}
                      </button>
                    )}
                    {sessionState.originPlace && (
                      <button
                        type="button"
                        onClick={() => applyPickupUpdate(sessionState.originPlace!)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
                          oLabel === sessionState.originPlace.label
                            ? 'bg-[#123D3A] text-white border-[#123D3A]'
                            : 'bg-[#F8F6F0] text-[#142322] border-[#E5DFD3] hover:border-[#123D3A]'
                        }`}
                      >
                        Arrival Hub: {sessionState.originPlace.label.slice(0, 24)}
                      </button>
                    )}
                  </div>
                )}

                {editingPickup && (
                  <div className="relative pt-1">
                    <input
                      type="text"
                      value={pickupQuery}
                      onFocus={() => setPickupOpen(true)}
                      onChange={(e) => {
                        setPickupQuery(e.target.value);
                        setPickupOpen(true);
                      }}
                      placeholder="Type any hotel, landmark, or address..."
                      aria-label="Edit pickup location"
                      className="w-full h-11 px-3.5 rounded-xl border border-[#D8D0C0] bg-[#F8F6F0] text-[15px] text-[#142322] focus:outline-none focus:border-[#123D3A]"
                    />

                    {pickupOpen && (
                      <div className="mt-2 bg-white rounded-xl border border-[#D8D0C0] shadow-lg max-h-56 overflow-y-auto divide-y divide-[#F1ECE2]">
                        {pickupLoading && <SuggestSkeleton rows={3} />}
                        {!pickupLoading && pickupSuggestions.length === 0 && pickupQuery.trim().length >= 2 && (
                          <p className="px-3 py-2.5 text-sm text-[#5A6664]">
                            No exact matches found for &ldquo;{pickupQuery.trim()}&rdquo;.
                          </p>
                        )}
                        {pickupSuggestions.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() =>
                              applyPickupUpdate({
                                label: s.label,
                                city: s.city,
                                state: s.state,
                                lat: s.lat,
                                lng: s.lng,
                                source: s.source,
                              })
                            }
                            className="w-full text-left px-3 py-2.5 hover:bg-[#F8F6F0] text-sm"
                          >
                            <p className="font-medium text-[#142322]">{s.label}</p>
                            <p className="text-sm text-[#5A6664] truncate">{s.subtitle}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Loading / Error / Comparison Cards + Map */}
        {loading ? (
          <div className="space-y-4">
            <p className="text-base font-medium text-[#495553]">
              Calculating Bike, Auto, and Cab comparisons…
            </p>
            <RideCompareSkeleton columns={1} />
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl border border-red-200 p-8 text-center space-y-4">
            <AlertCircle className="w-8 h-8 text-red-700 mx-auto" />
            <p className="text-base text-red-900 font-medium max-w-xl mx-auto">{error}</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => fetchComparison()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E9A34A] text-[#142322] text-[15px] font-semibold hover:bg-[#DF9538] cursor-pointer"
              >
                <span>Retry Route Calculation</span>
              </button>
              <Link
                to="/travel-assist"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#123D3A] text-white text-[15px] font-semibold"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Travel Assist</span>
              </Link>
            </div>
          </div>
        ) : (
          compareResult && (
            <>
              <RideComparisonSection
                compareResult={compareResult}
                passengers={passengers}
                initialCategory={preferredCategory}
                layoutVariant="stacked"
                title={
                  mode === 'attraction'
                    ? `Local Sightseeing Rides (${compareResult.route.originLabel} → ${compareResult.route.destLabel})`
                    : 'Arrival Transfer Comparison (Bike · Auto · Cab)'
                }
              />

              {/* Map Section below comparison cards */}
              <section className="space-y-3 pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h2 className="font-serif text-2xl font-semibold text-[#142322]">
                    Route &amp; Map Overview
                  </h2>
                  <span className="text-sm text-[#5A6664]">
                    {compareResult.route.originLabel} → {compareResult.route.destLabel} ·{' '}
                    <span className="font-mono font-medium text-[#123D3A]">
                      {compareResult.route.distanceKm} km
                    </span>
                  </span>
                </div>
                <GoogleRouteMap
                  stops={mapStops}
                  routeGeometry={compareResult.route.geometry}
                  heightClass="h-[360px]"
                />
              </section>
            </>
          )
        )}
      </main>

      <Footer />
    </div>
  );
}
