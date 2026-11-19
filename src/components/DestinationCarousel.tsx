import { useRef, useState } from 'react';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coffee,
  Compass,
  Landmark,
  MapPin,
  Mountain,
  Sparkles,
  Star,
  Trees,
} from 'lucide-react';
import { RevealGroup, RevealItem } from './Reveal';
import { STAGGER_LIST_MS } from '../motion/tokens';

export type AttractionCategory =
  | 'Popular Places'
  | 'Temples & Heritage'
  | 'Nature & Beaches'
  | 'Cafe Corner'
  | 'Adventure & Experiences'
  | 'Museums & Culture'
  | 'Hidden Gems';

export interface DiscoveredAttraction {
  id: string;
  name: string;
  category: AttractionCategory;
  rawType: string;
  location: string;
  lat: number;
  lng: number;
  image: string | null;
  shortDescription: string;
  distanceFromPickupKm: number;
  bestVisitingTime: string;
  rating?: number;
  userRatingCount?: number;
  openingHours?: string;
  source: string;
  sourceUrl?: string;
}

interface AttractionPhotoProps {
  image: string | null;
  name: string;
  category: AttractionCategory;
  location: string;
}

function CategoryFallbackIcon({ category }: { category: AttractionCategory }) {
  if (category === 'Cafe Corner') return <Coffee className="w-4 h-4 text-[#E9A34A]" aria-hidden="true" />;
  if (category === 'Adventure & Experiences') return <Mountain className="w-4 h-4 text-[#8CC9E8]" aria-hidden="true" />;
  if (category === 'Temples & Heritage') return <Landmark className="w-4 h-4 text-[#E9A34A]" aria-hidden="true" />;
  if (category === 'Nature & Beaches') return <Trees className="w-4 h-4 text-[#8CC9E8]" aria-hidden="true" />;
  if (category === 'Museums & Culture') return <Sparkles className="w-4 h-4 text-[#E9A34A]" aria-hidden="true" />;
  return <Compass className="w-4 h-4 text-[#E9A34A]" aria-hidden="true" />;
}

function getFallbackGradient(category: AttractionCategory): string {
  if (category === 'Cafe Corner') {
    return 'from-[#3B261D] via-[#4D3227] to-[#6B4535]';
  }
  if (category === 'Adventure & Experiences') {
    return 'from-[#103846] via-[#154A59] to-[#1D626E]';
  }
  if (category === 'Temples & Heritage') {
    return 'from-[#2A261E] via-[#3F3626] to-[#56482F]';
  }
  return 'from-[#123D3A] via-[#1B514D] to-[#23635E]';
}

function AttractionPhoto({ image, name, category, location }: AttractionPhotoProps) {
  const [imgError, setImgError] = useState(false);

  if (!image || imgError) {
    return (
      <div
        className={`ys-card-img w-full h-full bg-gradient-to-br ${getFallbackGradient(
          category
        )} p-6 flex flex-col justify-between text-[#F8F6F0] relative overflow-hidden`}
      >
        <div
          className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full border border-[#E9A34A]/25"
          aria-hidden="true"
        />
        <div className="flex items-center justify-between eyebrow-mono text-[#8CC9E8]">
          <span>{category}</span>
          <CategoryFallbackIcon category={category} />
        </div>
        <div>
          <p className="font-serif text-xl font-semibold leading-snug text-white line-clamp-2">
            {name}
          </p>
          <p className="text-sm text-[#F8F6F0]/80 mt-1 line-clamp-1">{location}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <img
        src={image}
        alt={`${name} — ${location}`}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className="ys-card-img w-full h-full object-cover object-center"
        loading="lazy"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent pointer-events-none"
        aria-hidden="true"
      />
    </>
  );
}

interface DestinationCarouselProps {
  title: string;
  subtitle?: string;
  attractions: DiscoveredAttraction[];
  selectedAttractionId: string | null;
  pickupLabel: string;
  onPreviewAttraction?: (attraction: DiscoveredAttraction) => void;
  onSelectAttraction: (attraction: DiscoveredAttraction) => void;
  onOpenDetailCard?: (attraction: DiscoveredAttraction) => void;
}

export function DestinationCarousel({
  title,
  subtitle,
  attractions,
  selectedAttractionId,
  pickupLabel,
  onPreviewAttraction,
  onSelectAttraction,
  onOpenDetailCard,
}: DestinationCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [expandedCount, setExpandedCount] = useState(10);

  if (attractions.length === 0) return null;

  const visibleItems = attractions.slice(0, expandedCount);
  const hasMore = attractions.length > expandedCount;

  const scrollByCards = (direction: 'prev' | 'next') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const step = Math.max(320, el.clientWidth * 0.78);
    el.scrollBy({
      left: direction === 'next' ? step : -step,
      behavior: 'smooth',
    });
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h3 className="font-serif text-2xl sm:text-[28px] font-semibold text-[#142322]">
            {title}
          </h3>
          {subtitle && (
            <p className="text-[15px] text-[#495553] mt-0.5">
              {subtitle} · <span className="font-mono tabular-figures">{attractions.length}</span> places
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {hasMore && (
            <button
              type="button"
              onClick={() => setExpandedCount((prev) => prev + 10)}
              className="ys-chip px-4 py-2 min-h-[42px] rounded-xl border border-[#E5DFD3] bg-white text-sm font-medium text-[#123D3A] hover:bg-[#F3EFE6] mr-1 cursor-pointer"
            >
              Show More ({attractions.length - expandedCount})
            </button>
          )}
          <button
            type="button"
            onClick={() => scrollByCards('prev')}
            aria-label={`Scroll ${title} left`}
            className="ys-chip w-11 h-11 rounded-full border border-[#E5DFD3] bg-white text-[#142322] flex items-center justify-center hover:border-[#123D3A] hover:bg-[#F8F6F0] shadow-xs cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => scrollByCards('next')}
            aria-label={`Scroll ${title} right`}
            className="ys-chip w-11 h-11 rounded-full border border-[#E5DFD3] bg-white text-[#142322] flex items-center justify-center hover:border-[#123D3A] hover:bg-[#F8F6F0] shadow-xs cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Horizontal Sliding Carousel Track */}
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto snap-x snap-mandatory pb-4 pt-1 scroll-smooth [scrollbar-width:thin] touch-pan-x"
      >
        <RevealGroup
          immediate
          direction="x"
          retriggerKey={`${title}-${visibleItems.length}`}
          staggerMs={STAGGER_LIST_MS}
          maxAnimatedItems={12}
          className="flex gap-5"
        >
          {visibleItems.map((item, idx) => {
            const isSelected = item.id === selectedAttractionId;
            const handleCardSelect = onOpenDetailCard || onPreviewAttraction || onSelectAttraction;

            return (
              <RevealItem key={item.id} index={idx} className="snap-start shrink-0">
                <article
                  className={`ys-card group w-[304px] sm:w-[348px] h-full bg-white rounded-2xl border overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#123D3A] ring-2 ring-[#E9A34A]/65'
                      : 'border-[#E5DFD3] hover:border-[#123D3A]/40'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleCardSelect(item)}
                    className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#123D3A] cursor-pointer flex-1 flex flex-col"
                  >
                    {/* Crisp 16:10 Landscape Photo */}
                    <div className="aspect-[16/10] w-full overflow-hidden bg-[#EFEAE0] relative">
                      <AttractionPhoto
                        image={item.image}
                        name={item.name}
                        category={item.category}
                        location={item.location}
                      />
                      <div className="absolute top-3 inset-x-3 flex items-start justify-between gap-2 pointer-events-none">
                        <span className="px-2.5 py-1 rounded-lg bg-[#142322]/85 backdrop-blur-xs text-[#F8F6F0] text-xs sm:text-sm font-semibold tracking-wide shadow-2xs leading-snug">
                          {isSelected ? 'Selected' : item.category}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {typeof item.rating === 'number' && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#142322]/85 text-[#E9A34A] font-mono text-xs sm:text-sm font-bold shadow-xs tabular-figures">
                              <Star className="w-3.5 h-3.5 fill-[#E9A34A] text-[#E9A34A]" aria-hidden="true" />
                              <span>{item.rating.toFixed(1)}</span>
                            </span>
                          )}
                          <span className="px-2 py-1 rounded-lg bg-white/95 text-[#123D3A] font-mono text-xs sm:text-sm font-bold shadow-xs tabular-figures">
                            {item.distanceFromPickupKm} km
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Copy */}
                    <div className="p-5 space-y-2.5 flex-1 flex flex-col justify-between w-full">
                      <div className="space-y-1.5">
                        <p className="text-sm font-medium text-[#5A6664] leading-snug">
                          {item.location} <span aria-hidden="true">·</span> {item.category}
                        </p>
                        <h4 className="font-serif text-xl font-semibold text-[#142322] leading-snug line-clamp-2 group-hover:text-[#123D3A] transition-colors">
                          {item.name}
                        </h4>
                        <p className="text-[15px] text-[#495553] leading-relaxed line-clamp-2 pt-0.5">
                          {item.shortDescription}
                        </p>
                      </div>

                      <div className="pt-2.5 border-t border-[#E5DFD3]/80 flex items-center justify-between gap-2 text-sm text-[#495553]">
                        <span className="inline-flex items-center gap-1.5 min-w-0">
                          <MapPin className="w-4 h-4 text-[#E9A34A] shrink-0" aria-hidden="true" />
                          <span className="truncate">From {pickupLabel}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 shrink-0 text-[#123D3A] font-medium">
                          <Clock className="w-4 h-4 shrink-0" aria-hidden="true" />
                          <span className="max-w-[130px] truncate">
                            {item.openingHours || item.bestVisitingTime}
                          </span>
                        </span>
                      </div>
                    </div>
                  </button>

                  <div className="px-5 pb-5 flex items-center gap-2">
                    {onPreviewAttraction && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreviewAttraction(item);
                        }}
                        className={`ys-chip px-3.5 py-2.5 min-h-[42px] rounded-xl text-sm font-semibold border whitespace-nowrap shrink-0 cursor-pointer ${
                          isSelected
                            ? 'border-[#123D3A] bg-[#123D3A]/10 text-[#123D3A]'
                            : 'border-[#E5DFD3] bg-[#F8F6F0] text-[#142322] hover:border-[#123D3A]'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Preview'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAttraction(item);
                      }}
                      className={`ys-btn-primary flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[42px] rounded-xl text-sm font-semibold cursor-pointer ${
                        isSelected
                          ? 'bg-[#E9A34A] text-[#142322] hover:bg-[#DF9538]'
                          : 'bg-[#123D3A] text-white hover:bg-[#194E4A]'
                      }`}
                    >
                      <span>Compare Rides</span>
                      <ArrowRight className="ys-arrow w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </article>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
