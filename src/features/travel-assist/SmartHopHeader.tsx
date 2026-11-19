import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Compass,
  IndianRupee,
  Map as MapIcon,
  MapPin,
  Navigation,
  Route,
  Sparkles,
} from 'lucide-react';
import type { SharedJourney } from './smartHopTypes';
import { GoogleRouteMap } from '../../components/GoogleRouteMap';

interface SmartHopHeaderProps {
  journey: SharedJourney;
  activeTab: 'fare' | 'timing' | 'pitstops';
  eyebrow: string;
  title: string;
  subtitle: string;
}

export function SmartHopHeader({
  journey,
  activeTab,
  eyebrow,
  title,
  subtitle,
}: SmartHopHeaderProps) {
  const [showMap, setShowMap] = useState(false);
  const displayDurationMin = journey.trafficAwareDurationMinutes ?? journey.durationMinutes;
  const formattedTime = new Date(journey.routeTimestamp).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const tabs: Array<{
    id: 'fare' | 'timing' | 'pitstops';
    label: string;
    to: string;
    icon: typeof IndianRupee;
  }> = [
    {
      id: 'fare',
      label: 'Fair Fare & Voice Pass',
      to: `/travel-assist/fare?j=${encodeURIComponent(journey.journeyId)}`,
      icon: IndianRupee,
    },
    {
      id: 'timing',
      label: 'Timing & Crowd Clock',
      to: `/travel-assist/timing?j=${encodeURIComponent(journey.journeyId)}`,
      icon: Clock,
    },
    {
      id: 'pitstops',
      label: 'En-route Pitstops',
      to: `/travel-assist/pitstops?j=${encodeURIComponent(journey.journeyId)}`,
      icon: Compass,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Top breadcrumb + sibling route switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to={`/travel-assist?j=${encodeURIComponent(journey.journeyId)}`}
          className="ys-btn-secondary inline-flex items-center gap-2 px-3.5 py-2 min-h-[40px] rounded-xl bg-white border border-[#DFD8C8] text-sm font-semibold text-[#123D3A] shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to Smart Local Hop</span>
        </Link>

        <nav aria-label="Smart Local Hop tools" className="flex flex-wrap items-center gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTab;
            return (
              <Link
                key={tab.id}
                to={tab.to}
                className={`ys-chip inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl text-sm font-medium border ${
                  isActive
                    ? 'bg-[#123D3A] text-white border-[#123D3A] shadow-2xs font-semibold'
                    : 'bg-white text-[#394543] border-[#DFD8C8] hover:border-[#123D3A]/40 hover:text-[#123D3A]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Editorial Page Heading */}
      <div className="space-y-2">
        <p className="eyebrow-mono font-semibold text-[#123D3A] flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#E9A34A]" aria-hidden="true" />
          <span>{eyebrow}</span>
        </p>
        <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#142322] tracking-tight leading-[1.15]">
          {title}
        </h1>
        <p className="text-base text-[#495553] max-w-3xl leading-relaxed">{subtitle}</p>
      </div>

      {/* Shared Journey Context Strip */}
      <div className="rounded-2xl bg-[#123D3A] text-white p-5 sm:p-6 shadow-[0_14px_34px_-14px_rgba(18,61,58,0.45)] border border-[#1B4E4A]">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono uppercase tracking-[0.08em] text-[#8CC9E8]">
              <span>Active Shared Journey</span>
              <span>·</span>
              <span>{journey.city || journey.state || 'India Local Route'}</span>
              <span>·</span>
              <span>Calculated {formattedTime}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-base sm:text-lg font-medium leading-snug">
              <span className="inline-flex items-center gap-1.5 text-white font-semibold">
                <MapPin className="w-4 h-4 text-[#E9A34A] shrink-0" aria-hidden="true" />
                <span>{journey.origin.label}</span>
              </span>
              <ArrowRight className="w-4 h-4 text-[#E9A34A] shrink-0" aria-hidden="true" />
              <span className="inline-flex items-center gap-1.5 text-white font-semibold">
                <Navigation className="w-4 h-4 text-[#8CC9E8] shrink-0" aria-hidden="true" />
                <span>{journey.destination.label}</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="rounded-xl bg-white/10 border border-white/15 px-3.5 py-2">
              <p className="text-[11px] font-mono uppercase tracking-[0.06em] text-[#8CC9E8]">
                Road Distance
              </p>
              <p className="text-lg font-bold font-mono tabular-figures text-white">
                {journey.distanceKm} km
              </p>
            </div>

            <div className="rounded-xl bg-white/10 border border-white/15 px-3.5 py-2">
              <p className="text-[11px] font-mono uppercase tracking-[0.06em] text-[#8CC9E8]">
                {journey.isTrafficAware ? 'Traffic-Aware Time' : 'Road Estimate'}
              </p>
              <p className="text-lg font-bold font-mono tabular-figures text-white">
                ~{displayDurationMin} min
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowMap((v) => !v)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-xl bg-[#E9A34A] text-[#142322] text-sm font-semibold hover:bg-[#DF9538] transition-colors"
            >
              <MapIcon className="w-4 h-4" aria-hidden="true" />
              <span>{showMap ? 'Hide Route Map' : 'View Route Map'}</span>
            </button>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-white/12 flex flex-wrap items-center justify-between gap-2 text-xs text-white/80">
          <span className="inline-flex items-center gap-1.5">
            <Route className="w-3.5 h-3.5 text-[#E9A34A]" aria-hidden="true" />
            <span>{journey.trafficSourceLabel}</span>
          </span>
          <span className="font-mono text-white/65">Source: {journey.routeSource}</span>
        </div>

        {showMap && (
          <div className="mt-4 rounded-xl overflow-hidden border border-white/15 bg-[#F8F6F0]">
            <GoogleRouteMap
              heightClass="h-[290px]"
              routeGeometry={journey.routeGeometry}
              stops={[
                {
                  id: 'origin',
                  label: journey.origin.label,
                  lat: journey.origin.lat,
                  lng: journey.origin.lng,
                  kind: 'origin',
                },
                {
                  id: 'dest',
                  label: journey.destination.label,
                  lat: journey.destination.lat,
                  lng: journey.destination.lng,
                  kind: 'destination',
                },
              ]}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function JourneyMissingCard({ status }: { status: 'missing' | 'expired' }) {
  return (
    <div className="max-w-2xl mx-auto rounded-2xl bg-white border border-[#DFD8C8] p-8 text-center space-y-4 shadow-sm">
      <div className="w-12 h-12 rounded-2xl bg-[#123D3A]/10 text-[#123D3A] flex items-center justify-center mx-auto">
        <Compass className="w-6 h-6" aria-hidden="true" />
      </div>
      <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#142322]">
        {status === 'expired' ? 'This local journey session expired' : 'Select a local journey first'}
      </h1>
      <p className="text-base text-[#495553] leading-relaxed">
        {status === 'expired'
          ? 'Saved Smart Local Hop routes expire after 6 hours so fare, timing, and stop details stay fresh. Start a quick route in Smart Local Hop to inspect details.'
          : 'Enter your starting point and destination on Smart Local Hop first, then open any feature card to inspect fares, timings, or route pitstops.'}
      </p>
      <div className="pt-2">
        <Link
          to="/travel-assist"
          className="ys-btn-primary inline-flex items-center gap-2 px-6 py-3 min-h-[46px] rounded-xl bg-[#E9A34A] text-[#142322] text-sm font-bold shadow-xs"
        >
          <span>Plan Route in Smart Local Hop</span>
          <ArrowRight className="w-4 h-4 ys-arrow" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
