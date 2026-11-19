import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Compass, MapPin, ShieldCheck, Train } from 'lucide-react';
import { SafeImage } from './SafeImage';
import { MaskedHeadlineWords, Reveal, RevealGroup, RevealItem } from './Reveal';
import { FlipCard } from './FlipCard';
import { MotionCard } from './MotionCard';
import { useDetailOverlay, type PlaceOverlayPayload } from './DetailOverlay';
import { DESTINATIONS, IMAGES } from '../data/destinations';
import { DUR_SLIDE_MS, STAGGER_CARDS_MS } from '../motion/tokens';

export interface HeroDeckCard {
  id: string;
  title: string;
  location: string;
  category: string;
  image: string;
  destId?: string;
  detailRoute: string;
  description: string;
  bestTime: string;
  highlights: string[];
}

export const HERO_DECK_CARDS: HeroDeckCard[] = [
  {
    id: 'cat-temples-heritage',
    title: 'Temples & Heritage',
    location: 'Puri · Katra · Varanasi · Hampi',
    category: 'Spiritual & Ancient Shrines',
    image: IMAGES.jagannathTemple,
    detailRoute: '/explore?category=Temples%20%26%20Spiritual%20Journeys',
    description:
      'Early-morning darshan windows, dress advisories, and station-to-shrine local transit notes across major temple corridors in India.',
    bestTime: 'Dawn & Evening Aarti Hours',
    highlights: ['Darshan Windows', 'Local Transit Notes', 'Cloakroom Tips'],
  },
  {
    id: 'cat-heritage-palaces',
    title: 'Heritage Palaces',
    location: 'Udaipur · Jaipur · Jodhpur · Mysore',
    category: 'Royal Citadels & Courtyards',
    image: IMAGES.udaipurHero,
    destId: 'udaipur',
    detailRoute: '/explore?dest=udaipur',
    description:
      'Sandstone courtyards, hillside forts, and lakeside palaces with practical old-city cab restrictions and museum timings.',
    bestTime: '9:00 AM – 11:30 AM',
    highlights: ['Courtyard Museums', 'Old City Access', 'Audio & Ticket Info'],
  },
  {
    id: 'cat-mountains',
    title: 'Mountains',
    location: 'Manali · Spiti · Meghalaya · Ladakh',
    category: 'Himalayan & Ridge Escapes',
    image: IMAGES.manaliValley,
    destId: 'manali',
    detailRoute: '/explore?dest=manali',
    description:
      'High-altitude cedar valleys, mountain passes, and misty Northeast ridges planned with seasonal access and local union cab notes.',
    bestTime: 'Morning Light & Clear Windows',
    highlights: ['Pass Advisories', 'Local Taxi Rules', 'Alpine Trails'],
  },
  {
    id: 'cat-beaches',
    title: 'Beaches',
    location: 'Puri · Goa · Varkala · Gokarna',
    category: 'Coastlines & Laterite Cliffs',
    image: IMAGES.indianBeach,
    destId: 'alleppey',
    detailRoute: '/explore?category=Beaches%20%26%20Coastal%20Escapes',
    description:
      'Calm sunrise promenades, dramatic southern cliffs, and coastal bays paired with practical sunset arrival timing and sea-front access.',
    bestTime: 'Sunrise & Golden Hour',
    highlights: ['Quiet Shorelines', 'Sunset Timing', 'Coastal Connectivity'],
  },
  {
    id: 'cat-heritage-cities',
    title: 'Heritage Cities',
    location: 'Jaipur · Varanasi · Hampi · Old Delhi',
    category: 'Walled Towns & Bazaars',
    image: IMAGES.hawaMahal,
    destId: 'jaipur',
    detailRoute: '/explore?dest=jaipur',
    description:
      'Living historic quarters, metro-connected bazaars, and riverside ghats mapped for smooth walking loops and last-mile autos.',
    bestTime: '8:00 AM – 11:00 AM',
    highlights: ['Metro Connections', 'Old Bazaar Loops', 'Walking Gates'],
  },
  {
    id: 'cat-cafe-corner',
    title: 'Cafe Corner',
    location: 'Jaipur · Old Manali · Rishikesh · Kochi',
    category: 'Solo-Friendly & Quiet Tables',
    image: IMAGES.cafeRooftop,
    destId: 'jaipur',
    detailRoute: '/explore?dest=jaipur&tab=cafes',
    description:
      'Daytime rooftop decks, pine-wood mountain corners, and calm neighborhood bakeries curated for unhurried solo breaks.',
    bestTime: 'Late Morning & Late Afternoon',
    highlights: ['Quiet Corners', 'Plug Points & Seating', 'Indicative Menus'],
  },
  {
    id: 'cat-adventure',
    title: 'Adventure',
    location: 'Rishikesh · Bir Billing · Hampta · Zanskar',
    category: 'Rafting · Paragliding · Treks',
    image: IMAGES.adventureParagliding,
    destId: 'rishikesh',
    detailRoute: '/explore?dest=rishikesh&tab=adventures',
    description:
      'Outdoor Himalayan runs, certified river stretches, and valley hikes listed with seasonal weather windows and safety baselines.',
    bestTime: 'Season-Specific Daylight',
    highlights: ['Safety Notes', 'Seasonal Windows', 'Pickup Points'],
  },
  {
    id: 'cat-stay-reality',
    title: 'Stay Reality',
    location: 'Old Towns · Hills · Coastal Belts',
    category: 'Ground-Level Stay Reality',
    image: IMAGES.homestayRoom,
    detailRoute: '/stay-reality',
    description:
      'Inspect practical room facts upfront — narrow-lane walk distance, car parking slots, Airtel/Jio reception, and extra utility fees.',
    bestTime: 'Check Before Booking',
    highlights: ['Lane & Parking Check', 'Wi-Fi & Signal', 'Utility Transparency'],
  },
];

function buildOverlayPayloadFromHeroCard(card: HeroDeckCard): PlaceOverlayPayload {
  const dest = card.destId ? DESTINATIONS.find((d) => d.id === card.destId) : undefined;
  const fallbackGallery = dest
    ? [card.image, dest.heroImage, dest.attractions[0]?.image].filter((u): u is string => Boolean(u))
    : [card.image];
  return {
    kind: 'place',
    id: card.id,
    title: card.title,
    category: card.category,
    location: card.location,
    image: card.image,
    galleryImages: Array.from(new Set(fallbackGallery)),
    description: card.description,
    bestTime: card.bestTime,
    highlights: card.highlights,
    destinationId: card.destId,
    detailRoute: card.detailRoute,
    itemTypeForSave:
      card.id === 'cat-cafe-corner'
        ? 'cafe'
        : card.id === 'cat-adventure'
        ? 'adventure'
        : card.id === 'cat-stay-reality'
        ? undefined
        : 'attraction',
  };
}

interface HeroSectionProps {
  primaryCtaTo: string;
}

export function LandingHeroSection({ primaryCtaTo }: HeroSectionProps) {
  const { openDetail } = useDetailOverlay();
  const [activeCardId, setActiveCardId] = useState<string>(HERO_DECK_CARDS[0].id);
  const [flippedHeroCardId, setFlippedHeroCardId] = useState<string | null>(null);
  const [entranceSettled, setEntranceSettled] = useState(false);

  // Prevent cards from flipping while their initial 450ms entrance settles
  useEffect(() => {
    const timer = window.setTimeout(() => setEntranceSettled(true), 680);
    return () => window.clearTimeout(timer);
  }, []);

  const activeCard =
    HERO_DECK_CARDS.find((c) => c.id === activeCardId) || HERO_DECK_CARDS[0];

  return (
    <section className="relative overflow-x-clip bg-[#0A0C0B] text-[#F8F6F0] pt-12 sm:pt-16 pb-16 sm:pb-24">
      <div
        className="absolute inset-0 pointer-events-none bg-editorial-grain opacity-70"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_75%_55%_at_50%_14%,rgba(233,163,74,0.14),rgba(10,12,11,0.78)_58%,#0A0C0B_100%)]"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Clean, Unclipped Hero Copy with 70ms Stagger & Word Reveal */}
        <div className="max-w-4xl mx-auto text-center space-y-5">
          <Reveal immediate delayMs={0}>
            <p className="eyebrow-mono font-medium text-[#8CC9E8] max-w-2xl mx-auto">
              YATRA SAATHI · GROUND-LEVEL INDIAN TRAVEL INTELLIGENCE
            </p>
          </Reveal>

          <h1 className="font-editorial text-[clamp(2.25rem,5vw,4.1rem)] font-semibold text-white leading-[1.12] tracking-tight text-balance">
            <MaskedHeadlineWords
              text="Travel India with clarity, not guesswork."
              accentWord="clarity"
              baseDelayMs={70}
              wordStepMs={50}
              immediate
            />
          </h1>

          <Reveal immediate delayMs={210}>
            <p className="text-base sm:text-xl text-[#F8F6F0]/85 leading-relaxed max-w-2xl mx-auto">
              Understand fair local fares, plan timing and pitstops along your route, discover places worth exploring, and check practical stay details — all in one place.
            </p>
          </Reveal>

          <Reveal immediate delayMs={280}>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <Link
                to={primaryCtaTo}
                className="ys-btn-primary inline-flex items-center justify-center gap-2.5 px-8 py-3.5 min-h-[52px] rounded-full bg-[#E9A34A] text-[#142322] font-bold text-base sm:text-[17px] hover:bg-[#DF9538] shadow-[0_14px_40px_rgba(233,163,74,0.26)] whitespace-nowrap"
              >
                <span>Start Exploring</span>
                <ArrowRight className="ys-arrow w-5 h-5" aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
        </div>

        {/* Straight, Evenly Aligned 3D Flip Destination Cards (Slide in from right: 80px -> 0, 650ms, 70ms stagger) */}
        <div className="mt-10 sm:mt-14">
          <RevealGroup
            immediate
            direction="x"
            durationMs={DUR_SLIDE_MS}
            staggerMs={STAGGER_CARDS_MS}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-2 lg:grid lg:grid-cols-4 lg:gap-5 lg:overflow-visible lg:pb-0 touch-pan-x"
          >
            {HERO_DECK_CARDS.map((card, index) => {
              const isActive = card.id === activeCardId;
              const isFlipped = flippedHeroCardId === card.id;
              return (
                <RevealItem
                  key={card.id}
                  index={index}
                  className="snap-start shrink-0 w-[256px] sm:w-[276px] lg:w-auto flex"
                >
                  <FlipCard
                    isFlipped={isFlipped}
                    onFlipChange={(next) => {
                      setActiveCardId(card.id);
                      setFlippedHeroCardId(next ? card.id : null);
                    }}
                    hoverFlipEnabled={entranceSettled}
                    cardLabel={card.title}
                    onFrontClick={(el) => {
                      setActiveCardId(card.id);
                      openDetail(buildOverlayPayloadFromHeroCard(card), el);
                    }}
                    className="w-full aspect-[4/5]"
                    front={
                      <div
                        onMouseEnter={() => setActiveCardId(card.id)}
                        className={`w-full h-full rounded-2xl overflow-hidden border bg-[#121716] transition-colors duration-200 ${
                          isActive
                            ? 'border-[#E9A34A]/80 shadow-[0_18px_40px_rgba(0,0,0,0.65)]'
                            : 'border-white/18 shadow-[0_12px_28px_rgba(0,0,0,0.5)] hover:border-white/45'
                        }`}
                      >
                        <SafeImage
                          src={card.image}
                          alt={`${card.title} — ${card.location}`}
                          priority
                          darkSkeleton
                          className="ys-card-img w-full h-full object-cover"
                        />
                        <div
                          className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/15 to-black/90 pointer-events-none"
                          aria-hidden="true"
                        />
                        <div className="absolute top-3.5 left-4 right-14 pointer-events-none">
                          <span className="inline-block px-2.5 py-0.5 rounded-md bg-black/55 backdrop-blur-xs text-[11px] font-semibold tracking-wide text-[#8CC9E8] leading-snug">
                            {card.category}
                          </span>
                        </div>
                        <div className="absolute bottom-4 left-4 right-4 space-y-1 pointer-events-none">
                          <h2 className="font-editorial text-xl font-semibold text-white leading-snug">
                            {card.title}
                          </h2>
                          <p className="text-xs sm:text-sm text-[#F8F6F0]/85 leading-snug">{card.location}</p>
                        </div>
                      </div>
                    }
                    back={
                      <>
                        <div className="space-y-2.5 pr-9">
                          <p className="eyebrow-mono text-[#8CC9E8]">{card.category}</p>
                          <h2 className="font-editorial text-lg font-semibold text-white leading-snug">
                            {card.title}
                          </h2>
                          <p className="text-xs text-[#E9A34A] font-medium flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            <span>Best time: {card.bestTime}</span>
                          </p>
                          <p className="text-xs sm:text-[13px] text-[#F8F6F0]/85 leading-relaxed">
                            {card.description}
                          </p>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {card.highlights.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 rounded-md bg-white/10 border border-white/15 text-[11px] font-medium text-[#F8F6F0]/90"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetail(buildOverlayPayloadFromHeroCard(card), e.currentTarget);
                          }}
                          className="ys-btn-primary w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[42px] rounded-xl bg-[#E9A34A] text-[#142322] text-sm font-bold hover:bg-[#DF9538] shrink-0"
                        >
                          <span>View details</span>
                          <ArrowRight className="ys-arrow w-4 h-4" aria-hidden="true" />
                        </button>
                      </>
                    }
                  />
                </RevealItem>
              );
            })}
          </RevealGroup>

          {/* Active Spotlight Caption */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-sm text-[#F8F6F0]/85 text-center">
            <span className="text-[#E9A34A] font-semibold">{activeCard.category}</span>
            <span aria-hidden="true" className="text-white/30">
              ·
            </span>
            <span className="text-white font-medium">{activeCard.title}</span>
            <span aria-hidden="true" className="text-white/30">
              ·
            </span>
            <span>{activeCard.location}</span>
            <span aria-hidden="true" className="text-white/30">
              ·
            </span>
            <button
              type="button"
              onClick={(e) =>
                openDetail(buildOverlayPayloadFromHeroCard(activeCard), e.currentTarget)
              }
              className="text-[#8CC9E8] hover:text-white underline underline-offset-4 font-semibold inline-flex items-center gap-1 cursor-pointer min-h-[36px]"
            >
              <span>Inspect destination</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
 * SECTION 1 — DISCOVER INDIA BY BROAD TRAVEL CATEGORIES
 * 8 broad categories spanning India, expandable destination drawer, horizontal reveal
 * -------------------------------------------------------------------------- */

interface BroadCategoryDestination {
  name: string;
  region: string;
  note: string;
  exploreTo: string;
  travelAssistTo: string;
  destId?: string;
}

interface BroadCategoryCard {
  id: string;
  title: string;
  subtitle: string;
  regionsTag: string;
  image: string;
  featuredDestinations: BroadCategoryDestination[];
}

const INDIA_BROAD_CATEGORIES: BroadCategoryCard[] = [
  {
    id: 'temples-spiritual',
    title: 'Temples & Spiritual Journeys',
    subtitle: 'Sacred shrines, darshan corridors & riverside aarti ghats',
    regionsTag: 'Puri · Rishikesh · Katra · Varanasi',
    image: IMAGES.jagannathTemple,
    featuredDestinations: [
      {
        name: 'Puri (Shri Jagannath Temple)',
        region: 'Odisha',
        note: 'Early-morning darshan along Grand Road with prepaid auto booths outside Puri Station.',
        exploreTo: '/explore?category=Temples%20%26%20Spiritual%20Journeys',
        travelAssistTo: '/travel-assist?state=Odisha',
      },
      {
        name: 'Varanasi (Kashi Vishwanath & Ghats)',
        region: 'Uttar Pradesh',
        note: 'Old-city lane access stops near Godowlia Chowk; verify Ganga aarti arrival timings beforehand.',
        exploreTo: '/travel-assist?state=Uttar%20Pradesh',
        travelAssistTo: '/travel-assist?state=Uttar%20Pradesh',
      },
      {
        name: 'Katra & Vaishno Devi Bhawan',
        region: 'Jammu & Kashmir',
        note: 'SVDK Rail & Katra Bus Stand connect to Banganga & Tarakote pilgrimage gates.',
        exploreTo: '/explore?dest=katra-jammu',
        travelAssistTo: '/travel-assist?state=Jammu%20and%20Kashmir',
        destId: 'katra-jammu',
      },
    ],
  },
  {
    id: 'mountains-hills',
    title: 'Mountains & Hill Stations',
    subtitle: 'Himalayan pine valleys, high passes & misty Northeast ridges',
    regionsTag: 'Manali · Spiti · Meghalaya · Patnitop',
    image: IMAGES.manaliValley,
    featuredDestinations: [
      {
        name: 'Manali & Old Manali Ridge',
        region: 'Himachal Pradesh',
        note: 'Cedar groves above Manalsu bridge with local union taxi guidance and HRTC tips.',
        exploreTo: '/explore?dest=manali',
        travelAssistTo: '/travel-assist?dest=manali',
        destId: 'manali',
      },
      {
        name: 'Spiti & Solang Mountain Passes',
        region: 'Himachal Pradesh',
        note: 'High-altitude valley roads with seasonal pass timing and acclimatization planning.',
        exploreTo: '/explore?dest=manali',
        travelAssistTo: '/travel-assist?state=Himachal%20Pradesh',
        destId: 'manali',
      },
      {
        name: 'Shillong & Cherrapunji Ridges',
        region: 'Meghalaya · Northeast India',
        note: 'Cloud-draped Khasi plateaus, canyon viewpoints, and daytime inter-valley cab connections.',
        exploreTo: '/travel-assist?state=Meghalaya',
        travelAssistTo: '/travel-assist?state=Meghalaya',
      },
    ],
  },
  {
    id: 'beaches-coastal',
    title: 'Beaches & Coastal Escapes',
    subtitle: 'Dawn promenades, laterite sea cliffs & quiet coastal coves',
    regionsTag: 'Puri Coast · Goa · Varkala · Kerala',
    image: IMAGES.indianBeach,
    featuredDestinations: [
      {
        name: 'Puri Golden Beach & Seafront',
        region: 'Odisha Coast',
        note: 'Clean sunrise shorelines along Marine Drive away from congested bazaar lanes.',
        exploreTo: '/travel-assist?state=Odisha',
        travelAssistTo: '/travel-assist?state=Odisha',
      },
      {
        name: 'Varkala Cliff & Marari Shores',
        region: 'Kerala',
        note: 'Dramatic red laterite sea cliffs and quiet Arabian Sea beaches reachable via Alleppey or Varkala rail.',
        exploreTo: '/explore?dest=alleppey',
        travelAssistTo: '/travel-assist?dest=alleppey',
        destId: 'alleppey',
      },
      {
        name: 'Palolem & South Goa Coves',
        region: 'Goa',
        note: 'Calm southern coves accessed via Madgaon Junction with state-regulated taxi & pilot stands.',
        exploreTo: '/travel-assist?state=Goa',
        travelAssistTo: '/travel-assist?state=Goa',
      },
    ],
  },
  {
    id: 'heritage-palaces',
    title: 'Heritage & Royal Palaces',
    subtitle: 'Sandstone citadels, boulder ruins & Walled City architecture',
    regionsTag: 'Jaipur · Udaipur · Hampi · Jammu',
    image: IMAGES.hawaMahal,
    featuredDestinations: [
      {
        name: 'Jaipur Walled City & Hawa Mahal',
        region: 'Rajasthan',
        note: '953 jharokha windows, Badi Chaupar Metro access, and composite monument passes.',
        exploreTo: '/explore?dest=jaipur',
        travelAssistTo: '/travel-assist?dest=jaipur',
        destId: 'jaipur',
      },
      {
        name: 'Udaipur City Palace',
        region: 'Rajasthan',
        note: '11 interconnected Mewar courtyards with daytime old-city cab restrictions.',
        exploreTo: '/explore?dest=udaipur',
        travelAssistTo: '/travel-assist?dest=udaipur',
        destId: 'udaipur',
      },
      {
        name: 'Hampi Vijayanagara Precinct',
        region: 'Karnataka',
        note: 'Sprawling stone chariot complexes and boulder hilltops best timed before midday heat.',
        exploreTo: '/travel-assist?state=Karnataka',
        travelAssistTo: '/travel-assist?state=Karnataka',
      },
    ],
  },
  {
    id: 'nature-wildlife',
    title: 'Nature & Wildlife',
    subtitle: 'Biosphere reserves, living root hills & forest sanctuaries',
    regionsTag: 'Meghalaya · Kaziranga · Corbett · Periyar',
    image: IMAGES.natureWildlife,
    featuredDestinations: [
      {
        name: 'Northeast & Kaziranga Corridor',
        region: 'Assam & Meghalaya',
        note: 'Brahmaputra floodplains, subtropical forests, and clear winter wildlife viewing windows.',
        exploreTo: '/travel-assist?state=Assam',
        travelAssistTo: '/travel-assist?state=Assam',
      },
      {
        name: 'Uttarakhand Himalayan Foothills',
        region: 'Uttarakhand',
        note: 'Sal forest belts and riverside wildlife corridors near Dehradun and Rishikesh.',
        exploreTo: '/explore?dest=rishikesh',
        travelAssistTo: '/travel-assist?state=Uttarakhand',
        destId: 'rishikesh',
      },
      {
        name: 'Kerala Green Sanctuary Belt',
        region: 'Kerala',
        note: 'Spice hills, birding wetlands around Kumarakom, and Periyar forest trails.',
        exploreTo: '/explore?dest=alleppey',
        travelAssistTo: '/travel-assist?state=Kerala',
        destId: 'alleppey',
      },
    ],
  },
  {
    id: 'adventure-experiences',
    title: 'Adventure & Experiences',
    subtitle: 'White-water rafting, paragliding ridges & alpine treks',
    regionsTag: 'Rishikesh · Bir Billing · Manali · Zanskar',
    image: IMAGES.adventureRafting,
    featuredDestinations: [
      {
        name: 'Shivpuri Ganga Rapids, Rishikesh',
        region: 'Uttarakhand',
        note: 'Certified Grade II–III river rafting runs with clear safety gear and shuttle pickup notes.',
        exploreTo: '/explore?dest=rishikesh',
        travelAssistTo: '/travel-assist?dest=rishikesh',
        destId: 'rishikesh',
      },
      {
        name: 'Hampta & Bhrigu Valley Trails',
        region: 'Himachal Pradesh',
        note: 'Guided high-meadow day hikes near Manali with seasonal snow-clearance guidance.',
        exploreTo: '/explore?dest=manali',
        travelAssistTo: '/travel-assist?dest=manali',
        destId: 'manali',
      },
      {
        name: 'Bir Billing Thermal Ridge',
        region: 'Himachal Pradesh',
        note: 'World-renowned paragliding takeoff plateau with verified landing zone drops.',
        exploreTo: '/explore?dest=manali',
        travelAssistTo: '/travel-assist?state=Himachal%20Pradesh',
        destId: 'manali',
      },
    ],
  },
  {
    id: 'lakes-backwaters',
    title: 'Lakes & Backwaters',
    subtitle: 'Public ferry canals, palace lakes & tranquil mountain waters',
    regionsTag: 'Kerala · Udaipur · Mansar · Nainital',
    image: IMAGES.alleppeyBackwaters,
    featuredDestinations: [
      {
        name: 'Alleppey & Kuttanad Backwaters',
        region: 'Kerala',
        note: 'Navigate emerald village canals via public Kerala SWTD wooden ferries and small shikaras; confirm jetty timetables locally.',
        exploreTo: '/explore?dest=alleppey',
        travelAssistTo: '/travel-assist?dest=alleppey',
        destId: 'alleppey',
      },
      {
        name: 'Lake Pichola & Fateh Sagar',
        region: 'Udaipur, Rajasthan',
        note: 'Ghat-side promenades and sunset island views across the southern Aravallis.',
        exploreTo: '/explore?dest=udaipur',
        travelAssistTo: '/travel-assist?dest=udaipur',
        destId: 'udaipur',
      },
      {
        name: 'Mansar Lake Foothill Basin',
        region: 'Jammu, J&K',
        note: 'Peaceful forest-lined oval lake ~62 km east of Jammu Tawi station.',
        exploreTo: '/travel-assist?state=Jammu%20and%20Kashmir',
        travelAssistTo: '/travel-assist?state=Jammu%20and%20Kashmir',
      },
    ],
  },
  {
    id: 'cafes-local-food',
    title: 'Cafes & Local Food',
    subtitle: 'Honest rooftop chai decks, bakeries & solo-friendly tables',
    regionsTag: 'Jaipur · Old Manali · Rishikesh · Kochi',
    image: IMAGES.cafeRooftop,
    featuredDestinations: [
      {
        name: 'Walled City Rooftops, Jaipur',
        region: 'Rajasthan',
        note: 'Sandstone terraces facing Hawa Mahal with relaxed daytime menus and metro access.',
        exploreTo: '/explore?dest=jaipur',
        travelAssistTo: '/travel-assist?dest=jaipur',
        destId: 'jaipur',
      },
      {
        name: 'Manalsu Riverside Cafes, Manali',
        region: 'Himachal Pradesh',
        note: 'Pine-wood decks overlooking cedar hills with reliable power and calm acoustic vibes.',
        exploreTo: '/explore?dest=manali',
        travelAssistTo: '/travel-assist?dest=manali',
        destId: 'manali',
      },
      {
        name: 'Tapovan & Laxman Jhula Decks',
        region: 'Rishikesh, Uttarakhand',
        note: 'River-view bakeries and quiet morning coffee terraces along the upper Ganga bend.',
        exploreTo: '/explore?dest=rishikesh',
        travelAssistTo: '/travel-assist?dest=rishikesh',
        destId: 'rishikesh',
      },
    ],
  },
];

export function DiscoverIndiaStorySection() {
  const { openDetail } = useDetailOverlay();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(INDIA_BROAD_CATEGORIES[0].id);
  const [expandedAll, setExpandedAll] = useState<boolean>(true);

  const visibleCategories = expandedAll
    ? INDIA_BROAD_CATEGORIES
    : INDIA_BROAD_CATEGORIES.slice(0, 4);

  const activeCategory =
    INDIA_BROAD_CATEGORIES.find((c) => c.id === selectedCategoryId) || INDIA_BROAD_CATEGORIES[0];

  const handleCategoryClick = (cat: BroadCategoryCard, el: HTMLElement) => {
    setSelectedCategoryId(cat.id);
    if (el) {
      el.blur();
    }
  };

  return (
    <section className="relative bg-[#0B0E0D] text-[#F8F6F0] py-20 sm:py-24 overflow-x-clip border-t border-white/10">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <Reveal className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <p className="eyebrow-mono text-[#8CC9E8]">01. Across India</p>
            <h2 className="font-editorial text-3xl sm:text-5xl font-semibold text-white leading-[1.1] text-balance">
              Explore India by how you want to{' '}
              <span className="text-[#E9A34A] italic font-normal">travel</span>.
            </h2>
            <p className="text-base sm:text-lg text-[#F8F6F0]/80 leading-relaxed max-w-[58ch]">
              From Himalayan passes and temple towns to wildlife reserves and coastal backwaters — pick any travel theme to explore connected destinations across India.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setExpandedAll((prev) => !prev)}
              className="ys-chip px-4 py-2.5 min-h-[42px] rounded-full border border-white/25 bg-white/5 hover:bg-white/10 text-sm font-semibold text-white transition-colors cursor-pointer"
            >
              {expandedAll ? 'Show Compact Row (4)' : `Show All ${INDIA_BROAD_CATEGORIES.length} Categories`}
            </button>
            <Link
              to="/explore"
              className="ys-btn-primary inline-flex items-center gap-2 px-5 py-2.5 min-h-[42px] rounded-full bg-[#E9A34A] text-[#142322] font-bold text-sm hover:bg-[#DF9538] transition-colors"
            >
              <span>Browse All Destinations</span>
              <ArrowRight className="ys-arrow w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </Reveal>

        {/* Aligned Broad Category Cards — Once-Only Horizontal Reveal */}
        <RevealGroup
          direction="x"
          durationMs={DUR_SLIDE_MS}
          staggerMs={STAGGER_CARDS_MS}
          retriggerKey={expandedAll ? 'all' : 'compact'}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-2 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-5 sm:overflow-visible sm:pb-0 touch-pan-x"
        >
          {visibleCategories.map((cat, idx) => {
            const isSelected = cat.id === activeCategory.id;
            return (
              <RevealItem
                key={cat.id}
                index={idx}
                className="snap-start shrink-0 w-[262px] sm:w-auto flex"
              >
                <button
                  type="button"
                  onClick={(e) => handleCategoryClick(cat, e.currentTarget)}
                  aria-pressed={isSelected}
                  className={`ys-card ys-card-dark group relative w-full aspect-[4/3] rounded-2xl overflow-hidden border text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E9A34A] bg-[#121615] ${
                    isSelected
                      ? 'border-[#E9A34A] ring-2 ring-[#E9A34A]/35 shadow-[0_18px_40px_rgba(0,0,0,0.6)]'
                      : 'border-white/18 hover:border-white/45 shadow-[0_12px_30px_rgba(0,0,0,0.45)]'
                  }`}
                >
                  <SafeImage
                    src={cat.image}
                    alt={`${cat.title} across India`}
                    darkSkeleton
                    className="ys-card-img w-full h-full object-cover"
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/35 to-black/15 pointer-events-none"
                    aria-hidden="true"
                  />
                  <div className="absolute top-3.5 left-4 right-4 flex items-center justify-between gap-2 pointer-events-none">
                    <span className="text-xs font-semibold tracking-wide text-[#8CC9E8] truncate">
                      {cat.regionsTag}
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 space-y-1 pointer-events-none">
                    <h3 className="font-editorial text-lg sm:text-xl font-semibold text-white leading-snug">
                      {cat.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#F8F6F0]/80 leading-snug line-clamp-2">
                      {cat.subtitle}
                    </p>
                  </div>
                </button>
              </RevealItem>
            );
          })}
        </RevealGroup>

        {/* Connected Indian Destinations Drawer for Active Category */}
        <Reveal
          retriggerKey={activeCategory.id}
          immediate
          className="rounded-2xl border border-white/15 bg-[#121716] p-5 sm:p-6 space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
            <div>
              <p className="eyebrow-mono text-[#E9A34A]">Selected Category</p>
              <h3 className="font-editorial text-xl sm:text-2xl font-semibold text-white">
                {activeCategory.title}
              </h3>
            </div>
            <p className="text-sm text-[#F8F6F0]/75 max-w-md">
              Select a connected destination to plan multi-stop routes or launch Smart Local Hop directly.
            </p>
          </div>

          <RevealGroup
            retriggerKey={activeCategory.id}
            immediate
            staggerMs={STAGGER_CARDS_MS}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {activeCategory.featuredDestinations.map((dest, idx) => (
              <RevealItem key={dest.name} index={idx} className="h-full">
                <MotionCard
                  dark
                  className="h-full rounded-xl border border-white/12 bg-[#161D1B] p-4 flex flex-col justify-between gap-3 hover:border-[#E9A34A]/50"
                >
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#8CC9E8]">
                      {dest.region}
                    </p>
                    <h4 className="font-editorial text-lg font-semibold text-white leading-snug">
                      {dest.name}
                    </h4>
                    <p className="text-sm text-[#F8F6F0]/75 leading-relaxed">{dest.note}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={(e) =>
                        openDetail(
                          {
                            kind: 'place',
                            id: `${activeCategory.id}-${dest.name}`,
                            title: dest.name,
                            category: activeCategory.title,
                            location: dest.region,
                            image: activeCategory.image,
                            description: dest.note,
                            highlights: [activeCategory.title, 'Ground-Checked Tips', 'Ride & Route Ready'],
                            destinationId: dest.destId || 'udaipur',
                            detailRoute: dest.exploreTo,
                          },
                          e.currentTarget
                        )
                      }
                      className="ys-chip px-3 py-2 rounded-lg bg-white/10 hover:bg-white/18 text-xs sm:text-sm font-semibold text-white transition-colors cursor-pointer"
                    >
                      Preview
                    </button>
                    <Link
                      to={dest.exploreTo}
                      className="ys-btn-primary px-3 py-2 rounded-lg bg-[#E9A34A] hover:bg-[#DF9538] text-xs sm:text-sm font-bold text-[#142322]"
                    >
                      Explore &amp; Plan
                    </Link>
                    <Link
                      to={dest.travelAssistTo}
                      className="ys-chip px-3 py-2 rounded-lg border border-white/20 hover:border-[#8CC9E8] text-xs sm:text-sm font-semibold text-[#8CC9E8] transition-colors"
                    >
                      Travel Assist
                    </Link>
                  </div>
                </MotionCard>
              </RevealItem>
            ))}
          </RevealGroup>
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
 * SECTION 2 — SMART LOCAL HOP ("Every local journey, with more confidence.")
 * -------------------------------------------------------------------------- */

const SMART_HOP_SHOWCASE = [
  {
    id: 'fair-fare-voice',
    badge: '01 · Fair Fare & Voice',
    label: 'Fair Fare & Local Voice Pass',
    note: 'Honest local fare ranges & driver phrase pass',
    image: IMAGES.vehicleAutoRickshaw,
    explanation:
      'Transparent regional rate breakdowns for Auto, Cab & Bike paired with a polite, speakable local-language pass.',
    metrics: [
      { label: 'Modes', value: 'Auto · Cab · Bike' },
      { label: 'Voice Pass', value: 'Hindi + Regional' },
      { label: 'Labeling', value: 'Verified vs Estimate' },
    ],
  },
  {
    id: 'timing-crowd-clock',
    badge: '02 · Timing & Buffers',
    label: 'Timing & Crowd Clock',
    note: 'Live ETA vs closing hours & return trains',
    image: IMAGES.travelAssistHeroCorridor,
    explanation:
      'Combines travel time with walking & darshan buffers to warn you early if an attraction or train window is tight.',
    metrics: [
      { label: 'Status', value: 'Safe · Hurry · Risk' },
      { label: 'Return Check', value: 'Train & Bus Cutoff' },
      { label: 'Crowd Data', value: 'Honest Status Only' },
    ],
  },
  {
    id: 'zero-detour-pitstops',
    badge: '03 · Route Corridor',
    label: 'Zero-Detour En-route Pitstops',
    note: 'Pure veg, ATMs & pharmacies on your route',
    image: IMAGES.cafeMountain,
    explanation:
      'Finds essentials strictly along your actual road geometry and measures true detour distance without backtracking.',
    metrics: [
      { label: 'Filters', value: 'Pure Veg · ATM · Meds' },
      { label: 'Ordering', value: 'Along Your Route' },
      { label: 'Detour Check', value: 'Road-Measured' },
    ],
  },
];

export function FindYourWaySection() {
  const [flippedHopId, setFlippedHopId] = useState<string | null>(null);

  return (
    <section className="relative py-20 sm:py-24 bg-[#0D1110] text-[#F8F6F0] overflow-x-clip border-t border-white/10">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Editorial Column */}
          <Reveal className="lg:col-span-5 space-y-5">
            <p className="eyebrow-mono text-[#E9A34A]">02. SMART LOCAL HOP</p>
            <h2 className="font-editorial text-3xl sm:text-5xl font-semibold text-white leading-[1.1] text-balance">
              Every local journey, with more{' '}
              <span className="text-[#E9A34A] italic font-normal">confidence</span>.
            </h2>
            <p className="text-base sm:text-[17px] text-[#F8F6F0]/80 leading-relaxed max-w-[58ch]">
              Know what a fair local fare looks like, reach places before they close, and discover useful stops along your actual route — all in one intelligent travel companion.
            </p>

            <ul className="space-y-3 text-sm sm:text-[15px] text-[#F8F6F0]/85 pt-1">
              <li className="ys-card ys-card-dark rounded-xl p-2 -mx-2 flex items-start gap-3">
                <span className="ys-icon-float shrink-0 mt-0.5">
                  <Train className="w-5 h-5 text-[#E9A34A]" aria-hidden="true" />
                </span>
                <span>
                  <strong className="text-white">Fair Fare &amp; Local Voice Pass</strong> — transparent regional fare estimates with ground tips and speakable driver scripts
                </span>
              </li>
              <li className="ys-card ys-card-dark rounded-xl p-2 -mx-2 flex items-start gap-3">
                <span className="ys-icon-float shrink-0 mt-0.5">
                  <Clock className="w-5 h-5 text-[#8CC9E8]" aria-hidden="true" />
                </span>
                <span>
                  <strong className="text-white">Timing &amp; Crowd Clock</strong> — real arrival margins against temple/monument closures and return trains
                </span>
              </li>
              <li className="ys-card ys-card-dark rounded-xl p-2 -mx-2 flex items-start gap-3">
                <span className="ys-icon-float shrink-0 mt-0.5">
                  <MapPin className="w-5 h-5 text-[#E9A34A]" aria-hidden="true" />
                </span>
                <span>
                  <strong className="text-white">Zero-Detour En-route Pitstops</strong> — ATMs, pure-veg meals, and pharmacies measured right on your route
                </span>
              </li>
            </ul>

            <div className="pt-2">
              <Link
                to="/travel-assist"
                className="ys-btn-primary inline-flex items-center gap-2.5 px-7 py-3.5 min-h-[50px] rounded-full bg-[#E9A34A] text-[#142322] font-bold text-base hover:bg-[#DF9538] shadow-lg whitespace-nowrap"
              >
                <span>Open Smart Local Hop</span>
                <ArrowRight className="ys-arrow w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </Reveal>

          {/* Right Aligned Corridor Hero + 3 Smart Local Hop Showcase Cards */}
          <div className="lg:col-span-7 space-y-4">
            <Reveal delayMs={70}>
              <div className="relative rounded-2xl overflow-hidden border border-white/15 aspect-[16/10] bg-[#161B1A] shadow-xl">
                <SafeImage
                  src={IMAGES.indianRailwayArrival}
                  alt="Indian railway station plaza with waiting auto-rickshaws and cabs"
                  darkSkeleton
                  className="w-full h-full object-cover"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent"
                  aria-hidden="true"
                />
                <div className="absolute bottom-5 left-5 right-5">
                  <p className="text-sm font-medium text-[#8CC9E8]">Smart Local Hop · Pan-India Corridor Intelligence</p>
                  <p className="font-editorial text-xl sm:text-2xl font-semibold text-white">
                    Fair Fares · Timing Buffers · Zero-Detour Pitstops
                  </p>
                </div>
              </div>
            </Reveal>

            <RevealGroup
              staggerMs={STAGGER_CARDS_MS}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              {SMART_HOP_SHOWCASE.map((card, idx) => (
                <RevealItem key={card.id} index={idx}>
                  <FlipCard
                    isFlipped={flippedHopId === card.id}
                    onFlipChange={(next) => setFlippedHopId(next ? card.id : null)}
                    cardLabel={card.label}
                    className="h-[246px]"
                    front={
                      <div className="h-full w-full rounded-2xl bg-[#151A19] border border-white/15 hover:border-[#E9A34A]/50 overflow-hidden shadow-md flex flex-col">
                        <div className="h-[130px] bg-[#1D2523] overflow-hidden relative shrink-0">
                          <SafeImage
                            src={card.image}
                            alt={`${card.label} — ${card.note}`}
                            darkSkeleton
                            className="ys-card-img w-full h-full object-cover"
                          />
                          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/65 text-[11px] font-mono text-[#E9A34A]">
                            {card.badge}
                          </div>
                        </div>
                        <div className="p-3.5 flex-1 flex flex-col justify-center">
                          <p className="font-editorial text-[15px] font-semibold text-white leading-snug">
                            {card.label}
                          </p>
                          <p className="text-xs text-[#F8F6F0]/75 leading-snug mt-1">
                            {card.note}
                          </p>
                        </div>
                      </div>
                    }
                    back={
                      <>
                        <div className="space-y-2 pr-9">
                          <p className="eyebrow-mono text-[#8CC9E8]">{card.badge}</p>
                          <p className="font-editorial text-sm font-semibold text-white leading-snug">
                            {card.label}
                          </p>
                          <p className="text-[11px] text-[#F8F6F0]/80 leading-relaxed line-clamp-2">
                            {card.explanation}
                          </p>
                          <dl className="space-y-1 pt-0.5 text-[11px]">
                            {card.metrics.map((m) => (
                              <div key={m.label} className="flex items-center justify-between gap-2 border-b border-white/10 pb-0.5">
                                <dt className="text-[#F8F6F0]/65">{m.label}</dt>
                                <dd className="font-mono font-semibold text-[#E9A34A]">{m.value}</dd>
                              </div>
                            ))}
                          </dl>
                        </div>

                        <Link
                          to="/travel-assist"
                          onClick={(e) => e.stopPropagation()}
                          className="ys-btn-primary w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[36px] rounded-xl bg-[#E9A34A] text-[#142322] text-xs font-bold hover:bg-[#DF9538] shrink-0"
                        >
                          <span>Launch Travel Assist</span>
                          <ArrowRight className="ys-arrow w-3.5 h-3.5" aria-hidden="true" />
                        </Link>
                      </>
                    }
                  />
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
 * SECTION 3 — EXPLORE & PLAN ("Find places worth exploring.")
 * Straight, aligned category gallery without rotations or overlap
 * -------------------------------------------------------------------------- */

const BEYOND_CATEGORIES = [
  {
    id: 'temples',
    title: 'Temples & Heritage',
    subtitle: 'Timings, entry details, and historic stone courtyards',
    cards: [
      {
        name: 'Shri Jagannath Temple',
        place: 'Puri, Odisha',
        image: IMAGES.jagannathTemple,
        description:
          'Iconic Kalinga architecture along Grand Road with morning darshan windows and nearby coastal walkways.',
      },
      {
        name: 'Hawa Mahal Sandstone Winds',
        place: 'Jaipur, Rajasthan',
        image: IMAGES.hawaMahal,
        description:
          '953 ventilated sandstone jharokhas engineered to channel cool desert breezes above the old bazaar.',
      },
    ],
    destLink: '/explore?dest=jaipur',
    destId: 'jaipur',
  },
  {
    id: 'nature',
    title: 'Nature & Beaches',
    subtitle: 'Quiet shores, public backwater ferries, and cedar valleys',
    cards: [
      {
        name: 'Golden Coast Sunset',
        place: 'Puri & Konkan Belt',
        image: IMAGES.indianBeach,
        description:
          'Long open shorelines ideal for dawn walks and quiet twilight sea breezes away from noisy piers.',
      },
      {
        name: 'Kuttanad Palm Canals',
        place: 'Alleppey, Kerala',
        image: IMAGES.alleppeyBackwaters,
        description:
          'Serene emerald village waterways navigable via public SWTD ferries and small wooden shikaras.',
      },
    ],
    destLink: '/explore?dest=alleppey',
    destId: 'alleppey',
  },
  {
    id: 'cafes',
    title: 'Cafe Corner',
    subtitle: 'Solo-friendly decks, quiet work tables, and honest pricing',
    cards: [
      {
        name: 'Manalsu Pine Deck Cafe',
        place: 'Old Manali, Himachal',
        image: IMAGES.cafeMountain,
        description:
          'Weathered pine-wood balcony overlooking cedar slopes with warm sourdough and power sockets inside.',
      },
      {
        name: 'Chaupar Terrace Rooftop',
        place: 'Old City, Jaipur',
        image: IMAGES.cafeRooftop,
        description:
          'Open-sky sandstone terrace facing illuminated Hawa Mahal domes without loud club music.',
      },
    ],
    destLink: '/explore?dest=udaipur',
    destId: 'udaipur',
  },
  {
    id: 'adventure',
    title: 'Adventure & Experiences',
    subtitle: 'Licensed river guides, alpine ridge hikes, and safety notes',
    cards: [
      {
        name: 'Shivpuri Ganga Rapids',
        place: 'Rishikesh, Uttarakhand',
        image: IMAGES.adventureRafting,
        description:
          'Grade II–III Himalayan white-water rafting run led by Uttarakhand Tourism certified river guides.',
      },
      {
        name: 'Hampta & Bhrigu Ridges',
        place: 'Manali Sector, Himachal',
        image: IMAGES.adventureTrekking,
        description:
          'Guided alpine day hikes across cedar treelines with acclimatization notes and seasonal dates.',
      },
    ],
    destLink: '/explore?dest=rishikesh',
    destId: 'rishikesh',
  },
];

export function BeyondUsualGallerySection() {
  const { openDetail } = useDetailOverlay();
  const [selectedCatIdx, setSelectedCatIdx] = useState(0);

  const activeCategory = BEYOND_CATEGORIES[selectedCatIdx];

  const handleOpenGalleryCard = (
    card: (typeof activeCategory.cards)[number],
    idx: number,
    el: HTMLElement
  ) => {
    openDetail(
      {
        kind: 'place',
        id: `beyond-${activeCategory.id}-${idx}`,
        title: card.name,
        category: activeCategory.title,
        location: card.place,
        image: card.image,
        description: card.description,
        highlights: [activeCategory.title, 'Ground-Checked Tips', 'Direct Route Support'],
        destinationId: activeCategory.destId,
        detailRoute: activeCategory.destLink,
      },
      el
    );
  };

  return (
    <section className="relative py-20 sm:py-24 bg-[#0B0E0D] text-[#F8F6F0] overflow-x-clip border-t border-white/10">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <Reveal className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          <div className="lg:col-span-7 space-y-3">
            <p className="eyebrow-mono text-[#8CC9E8]">03. Explore &amp; Plan</p>
            <h2 className="font-editorial text-3xl sm:text-5xl font-semibold text-white leading-[1.1] text-balance">
              Find places worth{' '}
              <span className="text-[#E9A34A] italic font-normal">exploring</span>.
            </h2>
          </div>

          <div className="lg:col-span-5 flex flex-col items-start lg:items-end justify-end gap-4">
            <p className="text-base text-[#F8F6F0]/80 leading-relaxed lg:text-right max-w-md">
              Discover heritage landmarks, solo-friendly cafes, and outdoor adventures — ordered into one multi-stop route.
            </p>
            <Link
              to="/explore"
              className="ys-btn-primary inline-flex items-center gap-2.5 px-7 py-3.5 min-h-[50px] rounded-full bg-white text-[#142322] font-bold text-base hover:bg-[#E9A34A] whitespace-nowrap"
            >
              <span>Open Explore &amp; Plan</span>
              <ArrowRight className="ys-arrow w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Category Selector Rail */}
          <RevealGroup staggerMs={STAGGER_CARDS_MS} className="lg:col-span-5 space-y-2.5">
            {BEYOND_CATEGORIES.map((cat, idx) => {
              const active = idx === selectedCatIdx;
              return (
                <RevealItem key={cat.id} index={idx}>
                  <button
                    type="button"
                    onClick={() => setSelectedCatIdx(idx)}
                    onMouseEnter={() => setSelectedCatIdx(idx)}
                    className={`ys-card ys-card-dark w-full text-left p-5 rounded-2xl border transition-colors duration-200 cursor-pointer ${
                      active
                        ? 'bg-[#121918] border-[#E9A34A]/65 shadow-md'
                        : 'bg-transparent border-white/12 hover:border-white/25 hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3
                        className={`font-editorial text-xl sm:text-2xl font-semibold transition-colors ${
                          active ? 'text-[#E9A34A]' : 'text-white'
                        }`}
                      >
                        {cat.title}
                      </h3>
                      <span className="ys-icon-float shrink-0">
                        <Compass
                          className={`w-4 h-4 transition-transform duration-300 ${
                            active ? 'text-[#E9A34A] rotate-45' : 'text-white/35'
                          }`}
                          aria-hidden="true"
                        />
                      </span>
                    </div>
                    <p className="text-sm sm:text-[15px] text-[#F8F6F0]/75 mt-1.5 leading-relaxed">
                      {cat.subtitle}
                    </p>
                  </button>
                </RevealItem>
              );
            })}
          </RevealGroup>

          {/* Straight, Aligned 2-Column Category Cards */}
          <RevealGroup
            retriggerKey={activeCategory.id}
            immediate
            direction="x"
            durationMs={DUR_SLIDE_MS}
            staggerMs={STAGGER_CARDS_MS}
            className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5 items-stretch"
          >
            {activeCategory.cards.map((card, idx) => (
              <RevealItem key={`${activeCategory.id}-${card.name}`} index={idx}>
                <button
                  type="button"
                  onClick={(e) => handleOpenGalleryCard(card, idx, e.currentTarget)}
                  className="ys-card ys-card-dark group block w-full text-left relative aspect-[4/5] rounded-2xl overflow-hidden border border-white/18 hover:border-[#E9A34A]/65 shadow-xl bg-[#141817] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E9A34A]"
                >
                  <SafeImage
                    src={card.image}
                    alt={`${card.name} — ${card.place}`}
                    darkSkeleton
                    className="ys-card-img w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5 space-y-1">
                    <p className="text-xs font-semibold text-[#8CC9E8]">{activeCategory.title}</p>
                    <p className="font-editorial text-xl sm:text-2xl font-semibold text-white leading-snug">
                      {card.name}
                    </p>
                    <p className="text-sm text-[#F8F6F0]/80">{card.place}</p>
                  </div>
                </button>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
 * SECTION 4 — STAY REALITY ("Know your stay before you arrive.")
 * -------------------------------------------------------------------------- */

export function StayConfidenceSection() {
  return (
    <section className="relative py-20 sm:py-24 bg-[#0E1312] text-[#F8F6F0] overflow-x-clip border-t border-white/10">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Clean Straight Stay Pair */}
          <RevealGroup staggerMs={STAGGER_CARDS_MS} className="lg:col-span-7 space-y-4">
            <RevealItem index={0}>
              <div className="ys-card ys-card-dark rounded-2xl overflow-hidden border border-white/15 aspect-[16/10] shadow-xl bg-[#121716]">
                <SafeImage
                  src={IMAGES.heritageHaveli}
                  alt="Sunlit Indian heritage courtyard guesthouse checked for lane access"
                  darkSkeleton
                  className="ys-card-img w-full h-full object-cover"
                />
              </div>
            </RevealItem>

            <RevealItem index={1}>
              <div className="ys-card ys-card-dark grid grid-cols-1 sm:grid-cols-12 gap-4 items-center rounded-2xl overflow-hidden border border-white/15 bg-[#121716] p-4">
                <div className="sm:col-span-5 aspect-[16/10] rounded-xl overflow-hidden bg-[#18201E]">
                  <SafeImage
                    src={IMAGES.homestayRoom}
                    alt="Clean Indian homestay room checked for fiber Wi-Fi and ventilation"
                    darkSkeleton
                    className="ys-card-img w-full h-full object-cover"
                  />
                </div>
                <div className="sm:col-span-7 flex items-start justify-between gap-3 px-1">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-[#E9A34A] uppercase tracking-wider">
                      Ground Audit Notes
                    </p>
                    <p className="font-editorial text-lg font-semibold text-white">
                      Parking · Fiber Wi-Fi · Cleanliness
                    </p>
                    <p className="text-sm text-[#F8F6F0]/75 leading-relaxed">
                      Check old-city cab walk distances, Airtel/Jio 5G reception, and extra utility fees upfront.
                    </p>
                  </div>
                  <span className="ys-icon-float shrink-0 mt-1">
                    <ShieldCheck className="w-5 h-5 text-[#E9A34A]" aria-hidden="true" />
                  </span>
                </div>
              </div>
            </RevealItem>
          </RevealGroup>

          {/* Right Editorial Copy */}
          <Reveal className="lg:col-span-5 space-y-5">
            <p className="eyebrow-mono text-[#8CC9E8]">04. Stay Reality</p>
            <h2 className="font-editorial text-3xl sm:text-5xl font-semibold text-white leading-[1.1] text-balance">
              Know your stay before you{' '}
              <span className="text-[#E9A34A] italic font-normal">arrive</span>.
            </h2>
            <p className="text-base sm:text-[17px] text-[#F8F6F0]/80 leading-relaxed max-w-[58ch]">
              Booking thumbnails rarely show if four-wheelers are restricted inside narrow lanes, whether fiber Wi-Fi reaches your room, or if heaters cost extra. Inspect practical ground-level facts upfront.
            </p>

            <RevealGroup staggerMs={STAGGER_CARDS_MS} className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-white/10 text-sm">
              <RevealItem index={0}>
                <p className="font-semibold text-white text-base">Lane &amp; Parking Reality</p>
                <p className="text-sm text-[#F8F6F0]/72 mt-1 leading-relaxed">
                  Exact walk distances from cab drop-offs and gated parking slots.
                </p>
              </RevealItem>
              <RevealItem index={1}>
                <p className="font-semibold text-white text-base">Practical Field Notes</p>
                <p className="text-sm text-[#F8F6F0]/72 mt-1 leading-relaxed">
                  Housekeeping standards, mobile reception &amp; upfront utility charges.
                </p>
              </RevealItem>
            </RevealGroup>

            <div className="pt-2">
              <Link
                to="/stay-reality"
                className="ys-btn-primary inline-flex items-center gap-2.5 px-7 py-3.5 min-h-[50px] rounded-full bg-[#E9A34A] text-[#142322] font-bold text-base hover:bg-[#DF9538] shadow-lg whitespace-nowrap"
              >
                <span>Open Stay Reality</span>
                <ArrowRight className="ys-arrow w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
 * SECTION 5 — FINAL CTA
 * -------------------------------------------------------------------------- */

export function FinalCtaSection({ ctaTo }: { ctaTo: string }) {
  return (
    <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden bg-[#090B0A] text-white py-20 border-t border-white/10">
      <div className="absolute inset-0">
        <SafeImage
          src={IMAGES.spitiRoad}
          alt="High-altitude Himalayan mountain road winding toward sunlit peaks"
          darkSkeleton
          className="w-full h-full object-cover opacity-40"
        />
      </div>

      <div
        className="absolute inset-0 bg-gradient-to-b from-[#090B0A]/90 via-[#0A0C0B]/65 to-[#070908]/95 pointer-events-none"
        aria-hidden="true"
      />

      <Reveal className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <p className="eyebrow-mono text-[#8CC9E8]">Yatra Saathi</p>
        <h2 className="font-editorial text-3xl sm:text-5xl lg:text-[60px] font-semibold text-white leading-[1.1] text-balance">
          Your next journey starts{' '}
          <span className="text-[#E9A34A] italic font-normal">here</span>.
        </h2>
        <p className="text-base sm:text-xl text-[#F8F6F0]/82 max-w-2xl mx-auto leading-relaxed">
          Use Travel Assist for smart local hops, Explore &amp; Plan to organize your stops, and Stay Reality to check practical room details before booking.
        </p>
        <div className="pt-2">
          <Link
            to={ctaTo}
            className="ys-btn-primary inline-flex items-center justify-center gap-2.5 px-9 py-4 min-h-[54px] rounded-full bg-[#E9A34A] text-[#142322] font-bold text-base sm:text-lg hover:bg-[#DF9538] shadow-[0_16px_45px_rgba(233,163,74,0.28)] whitespace-nowrap"
          >
            <span>Get Started</span>
            <ArrowRight className="ys-arrow w-5 h-5" aria-hidden="true" />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
