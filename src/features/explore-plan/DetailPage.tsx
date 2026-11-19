import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bookmark,
  Clock,
  CloudSun,
  ExternalLink,
  MapPin,
  Navigation,
  ShieldAlert,
  Ticket,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { SafeImage } from '../../components/SafeImage';
import { GoogleRouteMap } from '../../components/GoogleRouteMap';
import { Reveal, RevealGroup, RevealItem } from '../../components/Reveal';
import { STAGGER_CARDS_MS, STAGGER_LIST_MS } from '../../motion/tokens';
import { DESTINATIONS, getDestinationById } from '../../data/destinations';
import { useApp } from '../../contexts/AppContext';
import type { WeatherSnapshot } from '../../types/travel';

export function DetailPage() {
  const { kind, id } = useParams<{ kind: string; id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isOnline, isItemSaved, toggleSaveItem } = useApp();

  const destHint = searchParams.get('dest');

  // Resolve exact entity across destinations
  const resolved = (() => {
    const searchPool = destHint
      ? [getDestinationById(destHint), ...DESTINATIONS]
      : DESTINATIONS;

    for (const dest of searchPool) {
      if (kind === 'attraction') {
        const item = dest.attractions.find((a) => a.id === id);
        if (item) return { dest, kind: 'attraction' as const, item };
      }
      if (kind === 'cafe') {
        const item = dest.cafes.find((c) => c.id === id);
        if (item) return { dest, kind: 'cafe' as const, item };
      }
      if (kind === 'adventure') {
        const item = dest.adventures.find((a) => a.id === id);
        if (item) return { dest, kind: 'adventure' as const, item };
      }
    }
    return null;
  })();

  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!resolved || !isOnline) return;
    const { lat, lng } = resolved.item;
    fetch(`/api/weather?lat=${lat}&lng=${lng}`)
      .then((r) => r.json())
      .then((data: WeatherSnapshot) => setWeather(data))
      .catch(() => setWeather(null));
  }, [resolved?.item.id, isOnline]);

  if (!resolved) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8F6F0]">
        <Navbar />
        <main className="flex-1 max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
          <Reveal immediate>
            <h1 className="font-editorial text-3xl text-[#123D3A]">Place not found</h1>
            <p className="text-sm text-[#5A6664] mt-3">
              This travel entry could not be located in our verified destination records.
            </p>
            <Link
              to="/explore"
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-lg bg-[#123D3A] text-white text-sm font-semibold hover:bg-[#194E4A] transition-colors"
            >
              Return to Explore & Plan
            </Link>
          </Reveal>
        </main>
        <Footer />
      </div>
    );
  }

  const { dest, item } = resolved;
  const saved = isItemSaved(item.id, resolved.kind);

  const handleSave = async () => {
    setSaveMessage(null);
    try {
      const next = await toggleSaveItem({
        id: item.id,
        type: resolved.kind,
        destinationId: dest.id,
        title: item.name,
        subtitle: item.location,
        image: item.image,
        cachedSummary: item.shortDescription,
      });
      setSaveMessage(next ? 'Saved to your travel plan.' : 'Removed from saved places.');
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : 'Sign in to save places.');
    }
  };

  const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}`;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F6F0] text-[#142322]">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 py-2 text-sm font-medium text-[#123D3A] hover:text-[#E9A34A] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to {dest.name}
          </button>

          <button
            type="button"
            onClick={handleSave}
            className={`ys-chip inline-flex items-center gap-2 px-4 py-2.5 min-h-[42px] rounded-lg border text-sm font-semibold cursor-pointer ${
              saved
                ? 'border-[#E9A34A] bg-[#E9A34A]/15 text-[#123D3A]'
                : 'border-[#D7CFC1] bg-white text-[#123D3A] hover:bg-[#EFECE3]'
            }`}
          >
            <Bookmark className="w-4 h-4" fill={saved ? 'currentColor' : 'none'} />
            {saved ? 'Saved in My Plan' : 'Add to My Plan'}
          </button>
        </div>

        {saveMessage && (
          <div className="p-3.5 rounded-lg bg-white border border-[#123D3A]/30 text-sm font-medium text-[#123D3A]">
            {saveMessage}
          </div>
        )}

        {/* Hero Photo + Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <Reveal immediate className="lg:col-span-7 space-y-6">
            <div className="ys-card aspect-[16/10] rounded-xl overflow-hidden border border-[#E5DFD3] bg-white">
              <SafeImage
                src={item.image}
                alt={item.name}
                className="ys-card-img w-full h-full object-cover"
              />
            </div>

            <div className="space-y-4">
              <p className="eyebrow-mono text-[#5A6664]">
                {dest.name}, {dest.state} · {item.location}
              </p>
              <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#123D3A]">
                {item.name}
              </h1>
              <p className="text-base text-[#394543] leading-relaxed">{item.fullDescription}</p>
            </div>
          </Reveal>

          {/* Ground Intelligence Panel */}
          <Reveal immediate delayMs={STAGGER_CARDS_MS} className="lg:col-span-5 space-y-5">
            <div className="bg-white border border-[#E5DFD3] rounded-xl p-6 space-y-4">
              <h2 className="font-editorial text-xl font-semibold text-[#123D3A]">
                Practical Details
              </h2>

              {resolved.kind === 'attraction' && (
                <RevealGroup immediate staggerMs={STAGGER_LIST_MS} maxAnimatedItems={12} className="space-y-3 text-sm">
                  <RevealItem index={0}>
                    <div className="flex items-start gap-2.5">
                      <Clock className="w-4 h-4 text-[#E9A34A] shrink-0 mt-0.5" />
                      <div>
                        <p className="eyebrow-mono text-[#5A6664]">Best Visiting Time</p>
                        <p className="font-medium mt-0.5">{resolved.item.bestVisitingTime}</p>
                      </div>
                    </div>
                  </RevealItem>
                  <RevealItem index={1}>
                    <div className="flex items-start gap-2.5">
                      <Clock className="w-4 h-4 text-[#123D3A] shrink-0 mt-0.5" />
                      <div>
                        <p className="eyebrow-mono text-[#5A6664]">
                          Opening Hours ({resolved.item.openingHoursVerified ? 'Verified' : 'Unverified'})
                        </p>
                        <p className="font-medium mt-0.5">{resolved.item.openingHours}</p>
                      </div>
                    </div>
                  </RevealItem>
                  <RevealItem index={2}>
                    <div className="flex items-start gap-2.5">
                      <Ticket className="w-4 h-4 text-[#123D3A] shrink-0 mt-0.5" />
                      <div>
                        <p className="eyebrow-mono text-[#5A6664]">
                          Entry Fee ({resolved.item.entryFeeVerified ? 'Verified' : 'Unverified'})
                        </p>
                        <p className="font-medium mt-0.5">{resolved.item.entryFee}</p>
                      </div>
                    </div>
                  </RevealItem>
                  <RevealItem index={3}>
                    <p className="text-sm text-[#5A6664] pt-2 border-t border-[#E5DFD3]">
                      Source: {resolved.item.sourceNote}
                    </p>
                  </RevealItem>
                </RevealGroup>
              )}

              {resolved.kind === 'cafe' && (
                <RevealGroup immediate staggerMs={STAGGER_LIST_MS} maxAnimatedItems={12} className="space-y-3 text-sm">
                  <RevealItem index={0}>
                    <div>
                      <p className="eyebrow-mono text-[#5A6664]">Solo Traveller Note</p>
                      <p className="font-medium mt-0.5">{resolved.item.soloTravellerNote}</p>
                    </div>
                  </RevealItem>
                  <RevealItem index={1}>
                    <div>
                      <p className="eyebrow-mono text-[#5A6664]">Tags</p>
                      <p className="font-medium text-[#123D3A] mt-0.5">{resolved.item.tags.join(' · ')}</p>
                    </div>
                  </RevealItem>
                  <RevealItem index={2}>
                    <div>
                      <p className="eyebrow-mono text-[#5A6664]">
                        Indicative Price ({resolved.item.priceSource})
                      </p>
                      <p className="font-medium mt-0.5">{resolved.item.priceRange || 'Not publicly listed'}</p>
                    </div>
                  </RevealItem>
                  <RevealItem index={3}>
                    <div>
                      <p className="eyebrow-mono text-[#5A6664]">
                        Opening Hours ({resolved.item.hoursVerified ? 'Verified' : 'Unverified'})
                      </p>
                      <p className="font-medium mt-0.5">{resolved.item.openingHours || 'Check before visiting'}</p>
                    </div>
                  </RevealItem>
                </RevealGroup>
              )}

              {resolved.kind === 'adventure' && (
                <RevealGroup immediate staggerMs={STAGGER_LIST_MS} maxAnimatedItems={12} className="space-y-3 text-sm">
                  <RevealItem index={0}>
                    <div>
                      <p className="eyebrow-mono text-[#5A6664]">Duration & Season</p>
                      <p className="font-medium mt-0.5">
                        {resolved.item.duration} · {resolved.item.seasonWindow}
                      </p>
                    </div>
                  </RevealItem>
                  <RevealItem index={1}>
                    <div>
                      <p className="eyebrow-mono text-[#5A6664]">Cost ({resolved.item.costBasis})</p>
                      <p className="font-medium font-mono mt-0.5">{resolved.item.approxCost || 'Check operator'}</p>
                    </div>
                  </RevealItem>
                  <RevealItem index={2}>
                    <div className="flex items-start gap-2.5 bg-[#F8F6F0] border border-[#E5DFD3] rounded-lg p-3.5">
                      <ShieldAlert className="w-4 h-4 text-[#E9A34A] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-[#123D3A]">
                          Safety & Age ({resolved.item.ageRequirement})
                        </p>
                        <p className="text-sm text-[#495553] mt-0.5">
                          {resolved.item.safetyRequirements}
                        </p>
                      </div>
                    </div>
                  </RevealItem>
                  {resolved.item.operatorLink && (
                    <RevealItem index={3}>
                      <a
                        href={resolved.item.operatorLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#123D3A] underline"
                      >
                        {resolved.item.operatorLabel}
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </RevealItem>
                  )}
                </RevealGroup>
              )}

              {/* Weather Widget */}
              <div className="pt-3 border-t border-[#E5DFD3]">
                {weather?.current ? (
                  <div className="flex items-center gap-2.5 text-sm">
                    <CloudSun className="w-4 h-4 text-[#E9A34A] shrink-0" />
                    <div>
                      <p className="font-semibold text-[#123D3A] font-mono">
                        {Math.round(weather.current.temperature_2m)}°C now · Wind{' '}
                        {Math.round(weather.current.wind_speed_10m)} km/h
                      </p>
                      <p className="text-[#5A6664]">Open-Meteo Live Weather</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-[#5A6664]">
                    {isOnline ? 'Live weather unavailable right now.' : 'Weather unavailable offline.'}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <a
                  href={directionsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ys-btn-secondary px-4 py-2.5 min-h-[44px] rounded-lg bg-[#123D3A] text-white text-sm font-semibold hover:bg-[#194E4A] inline-flex items-center justify-center gap-1.5"
                >
                  <MapPin className="w-4 h-4" />
                  Directions
                </a>
                <Link
                  to={`/travel-assist?dest=${dest.id}&target=${encodeURIComponent(item.name)}&lat=${item.lat}&lng=${item.lng}`}
                  className="ys-btn-primary px-4 py-2.5 min-h-[44px] rounded-lg bg-[#E9A34A] text-[#142322] text-sm font-semibold hover:bg-[#df9538] inline-flex items-center justify-center gap-1.5"
                >
                  <Navigation className="w-4 h-4" />
                  Compare Rides
                </Link>
              </div>
            </div>

            <div className="bg-white border border-[#E5DFD3] rounded-xl p-4">
              <GoogleRouteMap
                stops={[{ id: item.id, label: item.name, lat: item.lat, lng: item.lng, kind: 'destination' }]}
                heightClass="h-[240px]"
                showRouteLine={false}
              />
            </div>
          </Reveal>
        </div>
      </main>

      <Footer />
    </div>
  );
}
