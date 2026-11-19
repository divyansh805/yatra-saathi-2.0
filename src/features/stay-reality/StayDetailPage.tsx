import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Bookmark,
  Car,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
  Sparkles,
  Wifi,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { SafeImage } from '../../components/SafeImage';
import { GoogleRouteMap } from '../../components/GoogleRouteMap';
import { Reveal, RevealGroup, RevealItem } from '../../components/Reveal';
import { MotionCard } from '../../components/MotionCard';
import { STAGGER_CARDS_MS, STAGGER_LIST_MS } from '../../motion/tokens';
import { DESTINATIONS } from '../../data/destinations';
import { useApp } from '../../contexts/AppContext';

export function StayDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isItemSaved, toggleSaveItem } = useApp();

  const match = (() => {
    for (const dest of DESTINATIONS) {
      const stay = dest.stays.find((s) => s.id === id);
      if (stay) return { dest, stay };
    }
    return null;
  })();

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  if (!match) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8F6F0]">
        <Navbar />
        <main className="flex-1 max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
          <Reveal immediate>
            <h1 className="font-editorial text-3xl text-[#123D3A]">Stay record not found</h1>
            <Link
              to="/stay-reality"
              className="mt-5 inline-flex items-center px-5 py-2.5 min-h-[44px] rounded-lg bg-[#123D3A] text-white text-sm font-semibold hover:bg-[#194E4A] transition-colors"
            >
              Back to Stay Reality
            </Link>
          </Reveal>
        </main>
        <Footer />
      </div>
    );
  }

  const { dest, stay } = match;
  const saved = isItemSaved(stay.id, 'stay');

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
            Back to Stay Reality
          </button>

          <button
            type="button"
            onClick={async () => {
              setSaveNotice(null);
              try {
                const next = await toggleSaveItem({
                  id: stay.id,
                  type: 'stay',
                  destinationId: dest.id,
                  title: stay.name,
                  subtitle: stay.location,
                  image: stay.images[0],
                  cachedSummary: `${stay.cleanlinessInfo} | Hidden charges: ${stay.hiddenCharges}`,
                });
                setSaveNotice(next ? 'Stay saved for offline reference.' : 'Removed from saved stays.');
              } catch (err) {
                setSaveNotice(err instanceof Error ? err.message : 'Sign in to save stays.');
              }
            }}
            className={`ys-chip inline-flex items-center gap-2 px-4 py-2.5 min-h-[42px] rounded-lg border text-sm font-semibold cursor-pointer ${
              saved
                ? 'border-[#E9A34A] bg-[#E9A34A]/15 text-[#123D3A]'
                : 'border-[#D7CFC1] bg-white text-[#123D3A] hover:bg-[#EFECE3]'
            }`}
          >
            <Bookmark className="w-4 h-4" fill={saved ? 'currentColor' : 'none'} />
            {saved ? 'Saved Stay' : 'Save Stay'}
          </button>
        </div>

        {saveNotice && (
          <div className="p-3.5 rounded-lg bg-white border border-[#123D3A]/30 text-sm font-medium text-[#123D3A]">
            {saveNotice}
          </div>
        )}

        {/* Header */}
        <Reveal immediate>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E5DFD3] pb-6">
            <div className="space-y-2">
              <p className="eyebrow-mono text-[#5A6664]">
                {dest.name}, {dest.state} · {stay.propertyType} · {stay.area}
              </p>
              <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#123D3A]">
                {stay.name}
              </h1>
              <p className="text-sm text-[#495553] flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#E9A34A]" aria-hidden="true" />
                {stay.location}
              </p>
            </div>

            {stay.pricePerNightInr && (
              <div className="md:text-right">
                <p className="font-mono text-2xl font-semibold text-[#123D3A] tabular-figures">
                  ₹{stay.pricePerNightInr}
                  <span className="text-sm font-sans font-normal text-[#5A6664]"> / night</span>
                </p>
                <p className="text-sm text-[#5A6664]">{stay.priceSource}</p>
              </div>
            )}
          </div>
        </Reveal>

        {/* 1. Property Image Gallery + 2. Location & Map */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <Reveal immediate className="lg:col-span-7 space-y-3">
            <div className="ys-card aspect-[16/10] rounded-xl overflow-hidden border border-[#E5DFD3] bg-white">
              <SafeImage
                src={stay.images[activeImageIdx] || stay.images[0]}
                alt={`${stay.name} photo ${activeImageIdx + 1}`}
                className="ys-card-img w-full h-full object-cover"
              />
            </div>

            {stay.images.length > 1 && (
              <div className="flex gap-3">
                {stay.images.map((img, i) => (
                  <button
                    key={img + i}
                    type="button"
                    onClick={() => setActiveImageIdx(i)}
                    className={`ys-chip w-24 aspect-[4/3] rounded-lg overflow-hidden border-2 cursor-pointer ${
                      activeImageIdx === i
                        ? 'border-[#123D3A] ring-2 ring-[#E9A34A]/35'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <SafeImage src={img} alt={`${stay.name} thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </Reveal>

          <Reveal immediate delayMs={STAGGER_CARDS_MS} className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-[#E5DFD3] rounded-xl p-5 space-y-4">
              <h2 className="font-editorial text-xl font-semibold text-[#123D3A]">
                Location & Landmark Distances
              </h2>
              <RevealGroup immediate staggerMs={STAGGER_LIST_MS} maxAnimatedItems={12} className="space-y-2 text-sm">
                {stay.landmarkDistances.map((item, idx) => (
                  <RevealItem
                    key={item.landmark}
                    index={idx}
                    className="flex items-center justify-between border-b border-[#F1EDE4] pb-2"
                  >
                    <span className="text-[#495553]">{item.landmark}</span>
                    <span className="font-mono text-sm font-semibold text-[#123D3A]">{item.distance}</span>
                  </RevealItem>
                ))}
              </RevealGroup>

              <GoogleRouteMap
                stops={[{ id: stay.id, label: stay.name, lat: stay.lat, lng: stay.lng, kind: 'destination' }]}
                heightClass="h-[230px]"
                showRouteLine={false}
              />

              <div className="grid grid-cols-2 gap-3 pt-1">
                <Link
                  to={`/travel-assist?dest=${dest.id}&target=${encodeURIComponent(stay.name)}&lat=${stay.lat}&lng=${stay.lng}`}
                  className="ys-btn-primary px-3.5 py-2.5 min-h-[44px] rounded-lg bg-[#E9A34A] text-[#142322] text-sm font-semibold hover:bg-[#df9538] inline-flex items-center justify-center gap-1.5"
                >
                  <Navigation className="w-4 h-4" />
                  Arrival Rides Here
                </Link>
                <a
                  href={stay.bookingReferenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ys-btn-secondary px-3.5 py-2.5 min-h-[44px] rounded-lg border border-[#D7CFC1] text-[#123D3A] text-sm font-semibold inline-flex items-center justify-center gap-1.5"
                >
                  Open Listing Map
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </Reveal>
        </div>

        {/* 3-9. Practical Stay Reality Breakdown */}
        <RevealGroup staggerMs={STAGGER_LIST_MS} maxAnimatedItems={12} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 3. Cleanliness Information */}
          <RevealItem index={0}>
            <MotionCard className="bg-white border border-[#E5DFD3] rounded-xl p-6 space-y-2.5 h-full">
              <h2 className="font-editorial text-xl font-semibold text-[#123D3A] flex items-center gap-2">
                <Sparkles className="ys-icon-float w-5 h-5 text-[#E9A34A]" aria-hidden="true" />
                Cleanliness & Room Upkeep
              </h2>
              <p className="text-sm text-[#394543] leading-relaxed">{stay.cleanlinessInfo}</p>
            </MotionCard>
          </RevealItem>

          {/* 4. Facilities */}
          <RevealItem index={1}>
            <MotionCard className="bg-white border border-[#E5DFD3] rounded-xl p-6 space-y-3 h-full">
              <h2 className="font-editorial text-xl font-semibold text-[#123D3A] flex items-center gap-2">
                <CheckCircle2 className="ys-icon-float w-5 h-5 text-[#123D3A]" aria-hidden="true" />
                Available Facilities
              </h2>
              <RevealGroup staggerMs={STAGGER_LIST_MS} maxAnimatedItems={12} className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-[#394543]">
                {stay.facilities.map((fac, idx) => (
                  <RevealItem key={fac} index={idx} className="flex items-center gap-2">
                    <span className="text-[#E9A34A] font-bold">·</span>
                    <span>{fac}</span>
                  </RevealItem>
                ))}
              </RevealGroup>
            </MotionCard>
          </RevealItem>

          {/* 5. Parking */}
          <RevealItem index={2}>
            <MotionCard className="bg-white border border-[#E5DFD3] rounded-xl p-6 space-y-2.5 h-full">
              <h2 className="font-editorial text-xl font-semibold text-[#123D3A] flex items-center gap-2">
                <Car className="ys-icon-float w-5 h-5 text-[#123D3A]" aria-hidden="true" />
                Parking & Lane Access
              </h2>
              <p className="text-sm text-[#394543] leading-relaxed">{stay.parkingInfo}</p>
            </MotionCard>
          </RevealItem>

          {/* 6. Network Connectivity */}
          <RevealItem index={3}>
            <MotionCard className="bg-white border border-[#E5DFD3] rounded-xl p-6 space-y-2.5 h-full">
              <h2 className="font-editorial text-xl font-semibold text-[#123D3A] flex items-center gap-2">
                <Wifi className="ys-icon-float w-5 h-5 text-[#123D3A]" aria-hidden="true" />
                Network Connectivity ({stay.networkQuality})
              </h2>
              <p className="text-sm text-[#394543] leading-relaxed">{stay.networkInfo}</p>
            </MotionCard>
          </RevealItem>

          {/* 7. Hidden Charges */}
          <RevealItem index={4}>
            <MotionCard className="bg-white border border-[#E5DFD3] rounded-xl p-6 space-y-2.5 h-full">
              <h2 className="font-editorial text-xl font-semibold text-[#123D3A] flex items-center gap-2">
                <AlertTriangle className="ys-icon-float w-5 h-5 text-[#E9A34A]" aria-hidden="true" />
                Extra & Hidden Charges
              </h2>
              <p className="text-sm text-[#394543] leading-relaxed">{stay.hiddenCharges}</p>
            </MotionCard>
          </RevealItem>

          {/* 8 & 9. Owner Contact & Verification Sources */}
          <RevealItem index={5}>
            <MotionCard className="bg-white border border-[#E5DFD3] rounded-xl p-6 space-y-3 h-full">
              <h2 className="font-editorial text-xl font-semibold text-[#123D3A] flex items-center gap-2">
                <ShieldCheck className="ys-icon-float w-5 h-5 text-[#123D3A]" aria-hidden="true" />
                Source & Contact Transparency
              </h2>
              <div className="text-sm text-[#394543] space-y-2">
                <p className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-[#5A6664] shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    {stay.ownerContact
                      ? `Verified host contact: ${stay.ownerContact}`
                      : 'Direct owner phone number is not publicly verified in this directory — verify via official property map listing.'}
                  </span>
                </p>
                <p className="text-sm text-[#5A6664] pt-2 border-t border-[#E5DFD3]">
                  Status: {stay.verificationStatus} · Source: {stay.sourceName} · Verified: {stay.verificationDate}
                </p>
              </div>
            </MotionCard>
          </RevealItem>
        </RevealGroup>
      </main>

      <Footer />
    </div>
  );
}
