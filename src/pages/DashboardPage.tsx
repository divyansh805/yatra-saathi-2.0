import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Bookmark, Compass, MapPin, Route, Search } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { SafeImage } from '../components/SafeImage';
import { Reveal, RevealGroup, RevealItem } from '../components/Reveal';
import { MotionCard } from '../components/MotionCard';
import { useDetailOverlay } from '../components/DetailOverlay';
import { DESTINATIONS, IMAGES } from '../data/destinations';
import { useApp } from '../contexts/AppContext';
import { useTranslationStrings } from '../utils/i18n';
import { EASE_PRIMARY, STAGGER_STEP } from '../motion/tokens';

function getTimeGreeting(t: ReturnType<typeof useTranslationStrings>): string {
  const hr = new Date().getHours();
  if (hr < 12) return t.greetingMorning;
  if (hr < 17) return t.greetingAfternoon;
  return t.greetingEvening;
}

export function DashboardPage() {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const {
    user,
    language,
    savedItems,
    savedRoutes,
    recentlyViewed,
    updateTripContext,
  } = useApp();
  const t = useTranslationStrings(language);
  const navigate = useNavigate();
  const { openDetail } = useDetailOverlay();

  const [searchQuery, setSearchQuery] = useState('');

  const filteredDestinations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return DESTINATIONS;
    return DESTINATIONS.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.state.toLowerCase().includes(q) ||
        d.tagline.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = filteredDestinations[0] || DESTINATIONS[0];
    updateTripContext({
      destinationId: target.id,
      pickupLabel: target.arrivalHubs[0].name,
      pickupCoords: { lat: target.arrivalHubs[0].lat, lng: target.arrivalHubs[0].lng },
    });
    navigate(`/explore?dest=${target.id}`);
  };

  const greeting = getTimeGreeting(t);

  const featurePanels = [
    {
      index: '01',
      title: 'Travel Assist',
      description: 'Understand local fares, manage important timings and find useful stops along your journey.',
      cta: 'Open Smart Local Hop',
      to: '/travel-assist',
      image: IMAGES.travelAssist,
      alt: 'Smart Local Hop Indian local transit intelligence',
    },
    {
      index: '02',
      title: 'Explore & Plan',
      description: 'Discover attractions, hidden cafes and unforgettable adventures.',
      cta: 'Open Explore & Plan',
      to: '/explore',
      image: IMAGES.hawaMahal,
      alt: 'Explore and Plan Jaipur attractions and cafes',
    },
    {
      index: '03',
      title: 'Stay Reality',
      description: 'Know what to expect before choosing your stay.',
      cta: 'Open Stay Reality',
      to: '/stay-reality',
      image: IMAGES.heritageHaveli,
      alt: 'Stay Reality courtyard guesthouse',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F6F0] text-[#142322]">
      <Navbar />

      <main className="flex-1">
        {/* Dashboard Hero */}
        <section className="relative bg-[#123D3A] overflow-hidden">
          <div className="absolute inset-0">
            <SafeImage
              src={IMAGES.udaipurHero}
              alt="Scenic Indian lakefront destination"
              priority
              darkSkeleton
              className="w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0F312F]/95 via-[#0F312F]/82 to-[#0F312F]/50" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
            <motion.div
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: EASE_PRIMARY }}
              className="max-w-3xl space-y-6"
            >
              <p className="text-base sm:text-lg font-medium text-[#8CC9E8]">
                {greeting}, {user ? user.name : 'Traveller'}
              </p>

              <h1 className="font-editorial text-4xl sm:text-5xl font-semibold text-white leading-[1.1] text-balance">
                {t.dashboardHeadline}
              </h1>

              <p className="text-base sm:text-lg text-[#F8F6F0]/90 max-w-2xl leading-relaxed">
                {t.dashboardSupport}
              </p>

              <form
                onSubmit={handleSearchSubmit}
                className="bg-white rounded-xl p-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 max-w-2xl shadow-md"
              >
                <div className="flex items-center gap-3 flex-1 px-3.5 py-2">
                  <Search className="w-5 h-5 text-[#5A6664] shrink-0" aria-hidden="true" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Jaipur, Udaipur, Rishikesh, Manali, Alleppey..."
                    aria-label="Search destination"
                    className="w-full bg-transparent text-base sm:text-[17px] text-[#142322] placeholder:text-[#6B7674] focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 min-h-[46px] rounded-lg bg-[#E9A34A] text-[#142322] text-base font-semibold hover:bg-[#df9538] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Explore Destination
                </button>
              </form>

              <div className="flex flex-wrap items-center gap-2.5 pt-1 text-sm text-[#F8F6F0]/90">
                <span>Quick select:</span>
                {DESTINATIONS.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      updateTripContext({
                        destinationId: d.id,
                        pickupLabel: d.arrivalHubs[0].name,
                        pickupCoords: { lat: d.arrivalHubs[0].lat, lng: d.arrivalHubs[0].lng },
                      });
                      navigate(`/explore?dest=${d.id}`);
                    }}
                    className="px-3.5 py-2 min-h-[40px] rounded-lg bg-white/12 hover:bg-white/22 text-white text-sm font-medium transition-colors cursor-pointer"
                  >
                    {d.name}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Three Main Equal-Importance Feature Panels */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
          <Reveal immediate className="mb-8 space-y-1.5">
            <p className="eyebrow-mono text-[#5A6664]">YOUR TRAVEL COMPANION</p>
            <h2 className="font-editorial text-3xl sm:text-[34px] font-semibold text-[#123D3A]">
              Three essential tools for every journey
            </h2>
          </Reveal>

          <RevealGroup stagger={STAGGER_STEP} immediate className="grid grid-cols-1 lg:grid-cols-3 gap-7">
            {featurePanels.map((panel) => (
              <RevealItem key={panel.to} className="h-full">
                <MotionCard
                  hoverLift={-6}
                  className="h-full rounded-2xl border border-[#E5DFD3] bg-white overflow-hidden hover:border-[#123D3A]/45 transition-all duration-300 shadow-sm hover:shadow-xl"
                >
                  <Link to={panel.to} className="group h-full flex flex-col">
                    <div className="aspect-[4/3] overflow-hidden bg-[#EAE4D7] relative">
                      <SafeImage
                        src={panel.image}
                        alt={panel.alt}
                        priority
                        className="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                      />
                      <div
                        className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent pointer-events-none"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="p-7 flex-1 flex flex-col justify-between space-y-6">
                      <div className="space-y-2.5">
                        <p className="eyebrow-mono text-[#E9A34A]">
                          {panel.index} — {panel.title}
                        </p>
                        <h3 className="font-editorial text-[26px] sm:text-[28px] font-semibold text-[#123D3A] leading-tight">
                          {panel.title}
                        </h3>
                        <span
                          className="block h-[2px] w-10 group-hover:w-20 bg-[#E9A34A] transition-all duration-300"
                          aria-hidden="true"
                        />
                        <p className="text-base text-[#394543] leading-relaxed pt-1">
                          {panel.description}
                        </p>
                      </div>
                      <span className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[46px] rounded-xl bg-[#123D3A] text-white text-[15px] font-semibold group-hover:bg-[#194E4A] transition-colors w-full sm:w-auto self-start">
                        {panel.cta}
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                      </span>
                    </div>
                  </Link>
                </MotionCard>
              </RevealItem>
            ))}
          </RevealGroup>
        </section>

        {/* Recently Viewed & Saved Plans */}
        {(recentlyViewed.length > 0 || savedRoutes.length > 0 || savedItems.length > 0) && (
          <Reveal className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 space-y-10">
            {recentlyViewed.length > 0 && (
              <div>
                <h2 className="font-editorial text-2xl sm:text-[28px] font-semibold text-[#123D3A] mb-5">
                  Recently viewed destinations
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentlyViewed.map((item) => (
                    <Link
                      key={item.destinationId}
                      to={`/explore?dest=${item.destinationId}`}
                      className="group flex items-center gap-4 bg-white border border-[#E5DFD3] rounded-xl p-3.5 hover:border-[#123D3A]/45 hover:shadow-md transition-all"
                    >
                      <div className="w-24 h-18 rounded-lg overflow-hidden shrink-0 bg-[#EAE4D7]">
                        <SafeImage
                          src={item.image}
                          alt={item.destinationName}
                          className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-500"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-base text-[#123D3A] truncate">
                          {item.destinationName}
                        </p>
                        <p className="text-sm text-[#5A6664] mt-0.5">
                          Viewed {new Date(item.viewedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {(savedRoutes.length > 0 || savedItems.length > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {savedRoutes.length > 0 && (
                  <div className="bg-white border border-[#E5DFD3] rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-editorial text-2xl font-semibold text-[#123D3A] flex items-center gap-2">
                        <Route className="w-5 h-5 text-[#E9A34A]" aria-hidden="true" />
                        Saved Travel Routes
                      </h3>
                      <Link to="/profile" className="text-sm font-semibold text-[#123D3A] hover:underline">
                        Manage all
                      </Link>
                    </div>
                    <div className="space-y-3">
                      {savedRoutes.slice(0, 3).map((route) => (
                        <div
                          key={route.id}
                          className="p-4 rounded-xl bg-[#F8F6F0] border border-[#E5DFD3] flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="text-base font-semibold text-[#123D3A] truncate">
                              {route.destinationName} · {route.stops.length} stops
                            </p>
                            <p className="text-sm text-[#5A6664] truncate mt-0.5">
                              From {route.pickupLabel}
                              {route.totalDistanceKm ? ` · ${route.totalDistanceKm} km` : ''}
                            </p>
                          </div>
                          <Link
                            to={`/explore?dest=${route.destinationId}`}
                            className="text-sm font-semibold text-[#123D3A] shrink-0 hover:text-[#E9A34A]"
                          >
                            Open
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {savedItems.length > 0 && (
                  <div className="bg-white border border-[#E5DFD3] rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-editorial text-2xl font-semibold text-[#123D3A] flex items-center gap-2">
                        <Bookmark className="w-5 h-5 text-[#E9A34A]" aria-hidden="true" />
                        Saved Places ({savedItems.length})
                      </h3>
                      <Link to="/profile" className="text-sm font-semibold text-[#123D3A] hover:underline">
                        View saved list
                      </Link>
                    </div>
                    <div className="space-y-3">
                      {savedItems.slice(0, 3).map((item) => (
                        <div
                          key={`${item.type}-${item.id}`}
                          className="p-4 rounded-xl bg-[#F8F6F0] border border-[#E5DFD3] flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="text-base font-semibold text-[#123D3A] truncate">{item.title}</p>
                            <p className="text-sm text-[#5A6664] truncate capitalize">
                              {item.type} · {item.subtitle}
                            </p>
                          </div>
                          <Link
                            to={`/explore?dest=${item.destinationId}`}
                            className="text-sm font-semibold text-[#123D3A] shrink-0 hover:text-[#E9A34A]"
                          >
                            View
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Reveal>
        )}

        {/* Popular Destinations & Continue Exploring */}
        <section className="py-10 sm:py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal className="flex items-center justify-between mb-8">
              <div>
                <p className="eyebrow-mono text-[#5A6664]">CONTINUE EXPLORING</p>
                <h2 className="font-editorial text-3xl sm:text-[34px] font-semibold text-[#123D3A] mt-1">
                  Popular Indian destinations
                </h2>
              </div>
              <Compass className="w-6 h-6 text-[#123D3A]" aria-hidden="true" />
            </Reveal>

            {filteredDestinations.length === 0 ? (
              <div className="p-8 rounded-2xl border border-[#E5DFD3] bg-[#F8F6F0] text-center space-y-3">
                <p className="text-base font-medium text-[#123D3A]">
                  No destinations matched “{searchQuery}”.
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-sm font-semibold text-[#123D3A] underline cursor-pointer"
                >
                  Show all curated destinations
                </button>
              </div>
            ) : (
              <RevealGroup stagger={STAGGER_STEP} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
                {filteredDestinations.map((dest) => (
                  <RevealItem key={dest.id} className="h-full">
                    <MotionCard
                      hoverLift={-5}
                      onClick={() =>
                        openDetail({
                          kind: 'destination',
                          id: dest.id,
                          destination: dest,
                        })
                      }
                      className="group h-full rounded-2xl overflow-hidden border border-[#E5DFD3] bg-white shadow-xs hover:shadow-xl hover:border-[#123D3A]/45 transition-all duration-300 flex flex-col cursor-pointer"
                    >
                      <div className="aspect-[4/3] overflow-hidden bg-[#EAE4D7]">
                        <SafeImage
                          src={dest.heroImage}
                          alt={`${dest.name}, ${dest.state}`}
                          className="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                        />
                      </div>
                      <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                        <div>
                          <p className="text-sm text-[#5A6664]">
                            {dest.state} <span aria-hidden="true">·</span> {dest.bestSeason}
                          </p>
                          <h3 className="font-editorial text-2xl font-semibold text-[#123D3A] mt-1 group-hover:text-[#194E4A] transition-colors">
                            {dest.name}
                          </h3>
                          <p className="text-[15px] text-[#394543] mt-2 leading-relaxed">
                            {dest.tagline}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2.5 pt-3 border-t border-[#E5DFD3]">
                          <Link
                            to={`/travel-assist?dest=${dest.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="px-3.5 py-2 min-h-[40px] inline-flex items-center rounded-lg bg-[#123D3A] text-white text-sm font-semibold hover:bg-[#194E4A] transition-colors"
                          >
                            Travel Assist
                          </Link>
                          <Link
                            to={`/explore?dest=${dest.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="px-3.5 py-2 min-h-[40px] inline-flex items-center rounded-lg border border-[#D7CFC1] bg-white text-[#123D3A] text-sm font-semibold hover:bg-[#EFECE3] transition-colors"
                          >
                            Explore & Plan
                          </Link>
                          <Link
                            to={`/stay-reality?dest=${dest.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="px-3.5 py-2 min-h-[40px] inline-flex items-center gap-1.5 rounded-lg border border-[#D7CFC1] bg-white text-[#123D3A] text-sm font-semibold hover:bg-[#EFECE3] transition-colors"
                          >
                            <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                            Stay Reality
                          </Link>
                        </div>
                      </div>
                    </MotionCard>
                  </RevealItem>
                ))}
              </RevealGroup>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
