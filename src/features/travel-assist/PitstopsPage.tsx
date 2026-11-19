import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  Compass,
  ExternalLink,
  Loader2,
  MapPin,
  Navigation,
  Route,
  Star,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { MotionCard } from '../../components/MotionCard';
import { RevealGroup, RevealItem } from '../../components/Reveal';
import { GoogleRouteMap, type MapStop } from '../../components/GoogleRouteMap';
import { SafeImage } from '../../components/SafeImage';
import { STAGGER_LIST_MS } from '../../motion/tokens';
import { JourneyMissingCard, SmartHopHeader } from './SmartHopHeader';
import { loadSharedJourney } from './travelAssistSession';
import type {
  EnroutePitstop,
  PitstopCategory,
  SharedJourney,
  SmartHopPitstopsResponse,
} from './smartHopTypes';

const PITSTOP_CATEGORIES: Array<{ id: PitstopCategory; label: string; hint: string }> = [
  { id: 'washroom', label: 'Washroom', hint: 'Public / Restroom' },
  { id: 'pure_veg', label: 'Pure Veg', hint: 'Vegetarian Food' },
  { id: 'local_food', label: 'Local Food', hint: 'Dhaba / Tiffin / Tea' },
  { id: 'atm', label: 'ATM', hint: 'Cash Withdrawal' },
  { id: 'pharmacy', label: 'Pharmacy', hint: 'Medical Store' },
  { id: 'cloakroom', label: 'Luggage Cloakroom', hint: 'Baggage / Locker' },
];

export function PitstopsPage() {
  const [searchParams] = useSearchParams();
  const journeyLookup = useMemo(
    () => loadSharedJourney(searchParams.get('j')),
    [searchParams]
  );
  const journey: SharedJourney | null = journeyLookup.journey;

  const [category, setCategory] = useState<PitstopCategory>('pure_veg');
  const [data, setData] = useState<SmartHopPitstopsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedStopId, setFocusedStopId] = useState<string | null>(null);

  useEffect(() => {
    if (!journey) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setFocusedStopId(null);

    fetch('/api/smart-hop/pitstops', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        routeGeometry: journey.routeGeometry,
        origin: {
          lat: journey.origin.lat,
          lng: journey.origin.lng,
          label: journey.origin.label,
        },
        destination: {
          lat: journey.destination.lat,
          lng: journey.destination.lng,
          label: journey.destination.label,
        },
        originalDistanceKm: journey.distanceKm,
        originalDurationMin: journey.trafficAwareDurationMinutes ?? journey.durationMinutes,
        category,
      }),
    })
      .then(async (res) => {
        const json = (await res.json()) as SmartHopPitstopsResponse & { error?: string };
        if (!res.ok) throw new Error(json.error || 'Could not query en-route pitstops.');
        return json;
      })
      .then((json) => {
        if (cancelled) return;
        setData(json);
        if (json.quotaExceeded) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to fetch route pitstops.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [journey, category]);

  const mapStops: MapStop[] = useMemo(() => {
    if (!journey) return [];
    const base: MapStop[] = [
      {
        id: 'origin',
        label: journey.origin.label,
        lat: journey.origin.lat,
        lng: journey.origin.lng,
        kind: 'origin',
      },
    ];
    const pitMarkers: MapStop[] = (data?.stops || [])
      .filter((s) => !focusedStopId || s.id === focusedStopId)
      .slice(0, 6)
      .map((s) => ({
        id: s.id,
        label: `${s.name} (${s.detourLabel})`,
        lat: s.lat,
        lng: s.lng,
        kind: 'stop',
      }));
    base.push(...pitMarkers);
    base.push({
      id: 'dest',
      label: journey.destination.label,
      lat: journey.destination.lat,
      lng: journey.destination.lng,
      kind: 'destination',
    });
    return base;
  }, [journey, data, focusedStopId]);

  const formatAheadDistance = (stop: EnroutePitstop): string => {
    if (!journey) return `${stop.routeProgressPercent}% along route`;
    const kmAhead = Number(((journey.distanceKm * stop.routeProgressPercent) / 100).toFixed(1));
    return `${kmAhead} km ahead (${stop.routeProgressPercent}% along route)`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F6F0] text-[#142322]">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {!journey ? (
          <JourneyMissingCard status={journeyLookup.status === 'expired' ? 'expired' : 'missing'} />
        ) : (
          <>
            <SmartHopHeader
              journey={journey}
              activeTab="pitstops"
              eyebrow="SMART LOCAL HOP · FEATURE 03"
              title="Useful stops, already on your way."
              subtitle="Sampled strictly along your road route corridor using Google Places API (New), sorted in travel order with measured via-stop road detours."
            />

            {/* Category Filter Chips */}
            <section aria-label="Pitstop category filters" className="space-y-2.5">
              <p className="text-xs font-mono uppercase tracking-[0.08em] text-[#5A6664]">
                Select Stop Category Along Route
              </p>
              <div className="flex flex-wrap items-center gap-2.5">
                {PITSTOP_CATEGORIES.map((cat) => {
                  const active = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`ys-chip px-4 py-2.5 min-h-[44px] rounded-xl border text-sm font-semibold flex items-center gap-2 ${
                        active
                          ? 'bg-[#123D3A] text-white border-[#123D3A] shadow-xs'
                          : 'bg-white text-[#142322] border-[#DFD8C8] hover:border-[#123D3A]/45'
                      }`}
                    >
                      <span>{cat.label}</span>
                      <span
                        className={`text-xs font-normal ${
                          active ? 'text-[#8CC9E8]' : 'text-[#5A6664]'
                        }`}
                      >
                        · {cat.hint}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Corridor Map + Results Split */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6 items-start">
              {/* Left: Results List */}
              <section aria-label="Route corridor stops" className="space-y-4">
                {loading && (
                  <div className="rounded-2xl bg-white border border-[#DFD8C8] p-8 flex items-center gap-3 text-[#495553]">
                    <Loader2 className="w-5 h-5 animate-spin text-[#123D3A]" />
                    <span>Scanning corridor points and calculating road detours...</span>
                  </div>
                )}

                {error && (
                  <div className="rounded-2xl bg-amber-50 border border-amber-300 p-5 text-sm text-amber-950 flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {!loading && data && data.status !== 'ok' && (
                  <div className="rounded-2xl bg-white border border-[#DFD8C8] p-7 space-y-3">
                    <div className="flex items-center gap-2.5 text-[#123D3A]">
                      <Compass className="w-5 h-5" aria-hidden="true" />
                      <h2 className="font-editorial text-xl font-semibold text-[#142322]">
                        {data.quotaExceeded
                          ? 'Google Places Quota Reached'
                          : !data.placesAvailable
                          ? 'Places Search Unavailable'
                          : 'No Verified Corridor Stops Found'}
                      </h2>
                    </div>
                    <p className="text-sm text-[#495553] leading-relaxed">{data.message}</p>
                    <p className="text-xs text-[#5A6664]">
                      Yatra Saathi never substitutes unverified businesses or invents ratings, washroom availability, or baggage facilities when Places returns no matches.
                    </p>
                  </div>
                )}

                {!loading && data && data.status === 'ok' && data.stops.length > 0 && (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#5A6664]">
                      <span>{data.message}</span>
                      <span className="font-mono">Sorted in route order (A → B)</span>
                    </div>

                    <RevealGroup
                      immediate
                      retriggerKey={category}
                      staggerMs={STAGGER_LIST_MS}
                      className="space-y-4"
                    >
                      {data.stops.map((stop, idx) => {
                        const isFocused = focusedStopId === stop.id;
                        return (
                          <RevealItem key={stop.id} index={idx}>
                            <MotionCard
                              className={`rounded-2xl bg-white border p-4 sm:p-5 transition-colors ${
                                isFocused ? 'border-[#123D3A] ring-2 ring-[#123D3A]/15' : 'border-[#DFD8C8]'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row gap-4">
                                {stop.photoUrl && (
                                  <div className="w-full sm:w-32 h-32 rounded-xl overflow-hidden bg-[#EAE4D7] shrink-0">
                                    <SafeImage
                                      src={stop.photoUrl}
                                      alt={stop.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}

                                <div className="flex-1 min-w-0 space-y-2.5">
                                  <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="text-[11px] font-mono uppercase tracking-[0.06em] text-[#5A6664]">
                                        Stop #{idx + 1} · {formatAheadDistance(stop)}
                                      </p>
                                      <h3 className="font-editorial text-xl font-semibold text-[#142322] mt-0.5">
                                        {stop.name}
                                      </h3>
                                    </div>

                                    <span
                                      className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                                        stop.isZeroDetour
                                          ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                                          : stop.detourVerified
                                          ? 'bg-[#F5F1E8] text-[#123D3A] border-[#DFD8C8]'
                                          : 'bg-stone-100 text-stone-700 border-stone-200'
                                      }`}
                                    >
                                      {stop.detourLabel}
                                    </span>
                                  </div>

                                  {stop.address && (
                                    <p className="text-sm text-[#495553] flex items-start gap-1.5">
                                      <MapPin className="w-4 h-4 text-[#123D3A] shrink-0 mt-0.5" />
                                      <span>{stop.address}</span>
                                    </p>
                                  )}

                                  <div className="flex flex-wrap items-center gap-2.5 text-xs">
                                    {stop.rating !== null && (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF8F3] border border-[#E5DFD3] font-semibold text-[#142322]">
                                        <Star className="w-3.5 h-3.5 text-[#E9A34A] fill-[#E9A34A]" />
                                        <span>{stop.rating.toFixed(1)}</span>
                                        {stop.userRatingCount !== null && (
                                          <span className="text-[#5A6664] font-normal">
                                            ({stop.userRatingCount})
                                          </span>
                                        )}
                                      </span>
                                    )}

                                    {stop.openNow !== null && (
                                      <span
                                        className={`px-2.5 py-1 rounded-lg border font-semibold ${
                                          stop.openNow
                                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                            : 'bg-rose-50 text-rose-800 border-rose-200'
                                        }`}
                                      >
                                        {stop.openNow ? 'Open Now' : 'Currently Closed'}
                                      </span>
                                    )}

                                    <span className="text-[#5A6664] font-mono">
                                      Corridor offset: ~{stop.corridorOffsetKm} km
                                    </span>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setFocusedStopId((prev) => (prev === stop.id ? null : stop.id))
                                      }
                                      className="ys-btn-secondary inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] rounded-xl bg-[#F5F1E8] border border-[#DFD8C8] text-xs font-semibold text-[#123D3A]"
                                    >
                                      <Route className="w-3.5 h-3.5" />
                                      <span>{isFocused ? 'Show All Corridor Pins' : 'Pin on Route Map'}</span>
                                    </button>

                                    <a
                                      href={stop.directionsUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-xl bg-[#123D3A] text-white text-xs font-semibold hover:bg-[#194E4A] transition-colors"
                                    >
                                      <Navigation className="w-3.5 h-3.5 text-[#E9A34A]" />
                                      <span>Directions</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </div>
                                </div>
                              </div>
                            </MotionCard>
                          </RevealItem>
                        );
                      })}
                    </RevealGroup>
                  </>
                )}
              </section>

              {/* Right: Live Route & Pitstop Map */}
              <aside className="rounded-3xl bg-white border border-[#DFD8C8] p-5 space-y-3 lg:sticky lg:top-24 shadow-xs">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-editorial text-xl font-semibold text-[#142322]">
                    Corridor Map
                  </h2>
                  {focusedStopId && (
                    <button
                      type="button"
                      onClick={() => setFocusedStopId(null)}
                      className="text-xs font-semibold text-[#123D3A] underline"
                    >
                      Show all stops
                    </button>
                  )}
                </div>
                <p className="text-xs text-[#5A6664]">
                  Stops shown sit close to your calculated A → B road geometry ({journey.distanceKm} km).
                </p>
                <GoogleRouteMap
                  heightClass="h-[420px]"
                  routeGeometry={journey.routeGeometry}
                  stops={mapStops}
                />
              </aside>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
