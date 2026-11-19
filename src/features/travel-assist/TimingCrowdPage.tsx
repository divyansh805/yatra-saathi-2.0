import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Footprints,
  Info,
  Loader2,
  ParkingCircle,
  ShieldAlert,
  Train,
  Users,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { JourneyMissingCard, SmartHopHeader } from './SmartHopHeader';
import { loadSharedJourney } from './travelAssistSession';
import type { SharedJourney, SmartHopTimingResponse, TimingStatus } from './smartHopTypes';

const TIMING_PRESETS: Array<{
  label: string;
  walk: number;
  park: number;
  activity: number;
}> = [
  { label: 'Temple / Darshan', walk: 12, park: 5, activity: 45 },
  { label: 'Fort / Monument', walk: 10, park: 5, activity: 75 },
  { label: 'Beach / Sunset', walk: 8, park: 5, activity: 60 },
  { label: 'Sightseeing', walk: 10, park: 5, activity: 60 },
  { label: 'Return Train', walk: 10, park: 5, activity: 20 },
  { label: 'Return Bus', walk: 8, park: 5, activity: 15 },
  { label: 'Custom Deadline', walk: 10, park: 5, activity: 45 },
];

function formatClock(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusStyles(status: TimingStatus): {
  bg: string;
  border: string;
  text: string;
  badge: string;
  badgeText: string;
} {
  switch (status) {
    case 'SAFE':
      return {
        bg: 'bg-emerald-50',
        border: 'border-emerald-300',
        text: 'text-emerald-950',
        badge: 'bg-emerald-700 text-white',
        badgeText: 'SAFE',
      };
    case 'HURRY':
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-300',
        text: 'text-amber-950',
        badge: 'bg-amber-600 text-white',
        badgeText: 'HURRY',
      };
    case 'RISK':
      return {
        bg: 'bg-rose-50',
        border: 'border-rose-300',
        text: 'text-rose-950',
        badge: 'bg-rose-700 text-white',
        badgeText: 'RISK',
      };
    case 'INFO_ONLY':
    default:
      return {
        bg: 'bg-[#F3EFE6]',
        border: 'border-[#D7CFC1]',
        text: 'text-[#142322]',
        badge: 'bg-[#123D3A] text-white',
        badgeText: 'INFO ONLY',
      };
  }
}

export function TimingCrowdPage() {
  const [searchParams] = useSearchParams();
  const journeyLookup = useMemo(
    () => loadSharedJourney(searchParams.get('j')),
    [searchParams]
  );
  const journey: SharedJourney | null = journeyLookup.journey;

  const [presetType, setPresetType] = useState<string>('Temple / Darshan');
  const [walkingBufferMin, setWalkingBufferMin] = useState<number>(12);
  const [parkingBufferMin, setParkingBufferMin] = useState<number>(5);
  const [activityBufferMin, setActivityBufferMin] = useState<number>(45);
  const [customDeadlineTime, setCustomDeadlineTime] = useState<string>('');
  const [returnDepartureTime, setReturnDepartureTime] = useState<string>('');
  const [returnStationLabel, setReturnStationLabel] = useState<string>(
    journey?.origin.label || ''
  );
  const [returnCheckInBufferMin, setReturnCheckInBufferMin] = useState<number>(25);

  const [timingData, setTimingData] = useState<SmartHopTimingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!journey) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/smart-hop/timing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            durationMinutes: journey.durationMinutes,
            trafficAwareDurationMinutes: journey.trafficAwareDurationMinutes,
            origin: { lat: journey.origin.lat, lng: journey.origin.lng },
            destination: { lat: journey.destination.lat, lng: journey.destination.lng },
            destLabel: journey.destination.label,
            city: journey.city,
            state: journey.state,
            presetType,
            walkingBufferMin,
            parkingBufferMin,
            activityBufferMin,
            customDeadlineTime,
            returnDepartureTime,
            returnCheckInBufferMin,
          }),
        });
        const data = (await res.json()) as SmartHopTimingResponse & { error?: string };
        if (!res.ok) {
          throw new Error(data.error || 'Could not calculate timing clock.');
        }
        if (!cancelled) setTimingData(data);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to compute timing schedule.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 180);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    journey,
    presetType,
    walkingBufferMin,
    parkingBufferMin,
    activityBufferMin,
    customDeadlineTime,
    returnDepartureTime,
    returnCheckInBufferMin,
  ]);

  const handleSelectPreset = (preset: (typeof TIMING_PRESETS)[number]) => {
    setPresetType(preset.label);
    if (preset.label !== 'Custom Deadline') {
      setWalkingBufferMin(preset.walk);
      setParkingBufferMin(preset.park);
      setActivityBufferMin(preset.activity);
    }
  };

  const statusStyle = timingData ? getStatusStyles(timingData.status) : null;

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
              activeTab="timing"
              eyebrow="SMART LOCAL HOP · FEATURE 02"
              title="Reach at the right time."
              subtitle="Factor in real road time, walk & parking buffers, darshan or sunset windows, and your return train or bus schedule — with zero invented crowd data."
            />

            {/* Status Banner */}
            {loading && !timingData && (
              <div className="rounded-2xl bg-white border border-[#DFD8C8] p-6 flex items-center gap-3 text-[#495553]">
                <Loader2 className="w-5 h-5 animate-spin text-[#123D3A]" />
                <span>Checking road travel window and opening hours...</span>
              </div>
            )}

            {error && (
              <div className="rounded-2xl bg-amber-50 border border-amber-300 p-5 text-sm text-amber-950 flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {timingData && statusStyle && (
              <section
                aria-label="Timing status summary"
                className={`rounded-3xl border p-5 sm:p-6 ${statusStyle.bg} ${statusStyle.border} ${statusStyle.text}`}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-mono font-bold tracking-wider ${statusStyle.badge}`}
                      >
                        {statusStyle.badgeText}
                      </span>
                      <span className="text-xs font-mono uppercase tracking-[0.06em] opacity-80">
                        {presetType}
                      </span>
                    </div>
                    <p className="font-editorial text-xl sm:text-2xl font-semibold leading-snug">
                      {timingData.statusHeadline}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <div className="rounded-xl bg-white/80 border border-black/10 px-4 py-2.5">
                      <p className="text-[11px] font-mono uppercase text-[#5A6664]">
                        Venue Arrival
                      </p>
                      <p className="text-lg font-bold font-mono tabular-figures text-[#142322]">
                        {formatClock(timingData.estimatedVenueArrivalIso)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/80 border border-black/10 px-4 py-2.5">
                      <p className="text-[11px] font-mono uppercase text-[#5A6664]">
                        Total Time Needed
                      </p>
                      <p className="text-lg font-bold font-mono tabular-figures text-[#142322]">
                        {timingData.totalTimeNeededMin} min
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-6 items-start">
              {/* Left Column: Preset Controls + Buffers + Visual Timeline */}
              <div className="space-y-6">
                <section className="rounded-3xl bg-white border border-[#DFD8C8] p-6 space-y-5 shadow-xs">
                  <div>
                    <h2 className="font-editorial text-2xl font-semibold text-[#142322]">
                      Visit Type & Ground Buffers
                    </h2>
                    <p className="text-sm text-[#5A6664] mt-0.5">
                      Adjust walking access, drop-off/parking time, and expected activity time.
                    </p>
                  </div>

                  {/* Presets */}
                  <div className="flex flex-wrap items-center gap-2">
                    {TIMING_PRESETS.map((preset) => {
                      const active = presetType === preset.label;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => handleSelectPreset(preset)}
                          className={`ys-chip px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                            active
                              ? 'bg-[#123D3A] text-white border-[#123D3A]'
                              : 'bg-[#FAF8F3] text-[#394543] border-[#E2DAC9] hover:border-[#123D3A]/40'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Sliders / Numeric Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <label className="rounded-2xl bg-[#FAF8F3] border border-[#E5DFD3] p-4 space-y-1.5 block">
                      <span className="text-xs font-mono uppercase text-[#123D3A] flex items-center gap-1.5 font-semibold">
                        <Footprints className="w-3.5 h-3.5 text-[#E9A34A]" />
                        Walking (min)
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={180}
                        value={walkingBufferMin}
                        onChange={(e) =>
                          setWalkingBufferMin(Math.max(0, Math.min(180, Number(e.target.value) || 0)))
                        }
                        className="ys-input w-full px-3 py-2 rounded-lg bg-white border border-[#D7CFC1] text-base font-mono font-semibold text-[#142322]"
                      />
                    </label>

                    <label className="rounded-2xl bg-[#FAF8F3] border border-[#E5DFD3] p-4 space-y-1.5 block">
                      <span className="text-xs font-mono uppercase text-[#123D3A] flex items-center gap-1.5 font-semibold">
                        <ParkingCircle className="w-3.5 h-3.5 text-[#E9A34A]" />
                        Parking / Drop (min)
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={90}
                        value={parkingBufferMin}
                        onChange={(e) =>
                          setParkingBufferMin(Math.max(0, Math.min(90, Number(e.target.value) || 0)))
                        }
                        className="ys-input w-full px-3 py-2 rounded-lg bg-white border border-[#D7CFC1] text-base font-mono font-semibold text-[#142322]"
                      />
                    </label>

                    <label className="rounded-2xl bg-[#FAF8F3] border border-[#E5DFD3] p-4 space-y-1.5 block">
                      <span className="text-xs font-mono uppercase text-[#123D3A] flex items-center gap-1.5 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-[#E9A34A]" />
                        Visit / Darshan (min)
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={480}
                        value={activityBufferMin}
                        onChange={(e) =>
                          setActivityBufferMin(Math.max(0, Math.min(480, Number(e.target.value) || 0)))
                        }
                        className="ys-input w-full px-3 py-2 rounded-lg bg-white border border-[#D7CFC1] text-base font-mono font-semibold text-[#142322]"
                      />
                    </label>
                  </div>

                  {/* Custom Deadline Time */}
                  <div className="rounded-2xl bg-[#FAF8F3] border border-[#E5DFD3] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <label
                        htmlFor="custom-cutoff-time"
                        className="text-sm font-semibold text-[#142322] block"
                      >
                        Closing / Cutoff Deadline (Optional, 24h)
                      </label>
                      <p className="text-xs text-[#5A6664]">
                        Overrides default sunset or temple closing estimate when entered.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id="custom-cutoff-time"
                        type="time"
                        value={customDeadlineTime}
                        onChange={(e) => setCustomDeadlineTime(e.target.value)}
                        className="ys-input px-3 py-2 rounded-xl bg-white border border-[#D7CFC1] text-sm font-mono text-[#142322]"
                      />
                      {customDeadlineTime && (
                        <button
                          type="button"
                          onClick={() => setCustomDeadlineTime('')}
                          className="text-xs font-semibold text-[#123D3A] underline px-2"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                </section>

                {/* Step-by-Step Arrival Timeline */}
                {timingData && (
                  <section className="rounded-3xl bg-white border border-[#DFD8C8] p-6 space-y-4 shadow-xs">
                    <h2 className="font-editorial text-2xl font-semibold text-[#142322]">
                      Estimated Journey Timeline
                    </h2>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-xl bg-[#FAF8F3] border border-[#E5DFD3] px-4 py-3">
                        <span className="text-sm font-medium text-[#394543]">1. Leave Starting Point Now</span>
                        <span className="font-mono font-bold text-[#142322]">
                          {formatClock(timingData.nowIso)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl bg-[#FAF8F3] border border-[#E5DFD3] px-4 py-3">
                        <span className="text-sm font-medium text-[#394543]">
                          2. Road Travel ({timingData.isTrafficAware ? 'Traffic-aware' : 'Road estimate'})
                        </span>
                        <span className="font-mono font-semibold text-[#123D3A]">
                          +{timingData.travelDurationMin} min
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl bg-[#FAF8F3] border border-[#E5DFD3] px-4 py-3">
                        <span className="text-sm font-medium text-[#394543]">
                          3. Walking & Drop/Parking Access
                        </span>
                        <span className="font-mono font-semibold text-[#123D3A]">
                          +{timingData.walkingBufferMin + timingData.parkingBufferMin} min
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl bg-[#123D3A] text-white px-4 py-3.5">
                        <span className="text-sm font-semibold">4. Estimated Venue Entry / Arrival</span>
                        <span className="font-mono font-bold text-lg text-[#E9A34A]">
                          {formatClock(timingData.estimatedVenueArrivalIso)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl bg-[#FAF8F3] border border-[#E5DFD3] px-4 py-3">
                        <span className="text-sm font-medium text-[#394543]">
                          5. Finish Activity (+{timingData.activityBufferMin} min on site)
                        </span>
                        <span className="font-mono font-bold text-[#142322]">
                          {formatClock(timingData.estimatedCompletionIso)}
                        </span>
                      </div>
                      {timingData.deadlineIso && (
                        <div className="flex items-center justify-between rounded-xl bg-[#F5F1E8] border border-[#DFD8C8] px-4 py-3">
                          <span className="text-sm font-semibold text-[#123D3A]">
                            Target Cutoff: {timingData.deadlineUsedLabel}
                          </span>
                          <span className="font-mono font-bold text-[#123D3A]">
                            {formatClock(timingData.deadlineIso)}
                          </span>
                        </div>
                      )}
                    </div>
                  </section>
                )}
              </div>

              {/* Right Column: Opening Hours, Return Journey Planner & Honest Crowd Card */}
              <div className="space-y-6">
                {/* Destination Opening & Closing Hours */}
                {timingData && (
                  <section className="rounded-3xl bg-white border border-[#DFD8C8] p-6 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="font-editorial text-xl font-semibold text-[#142322]">
                        Opening & Closing Info
                      </h2>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                          timingData.openingHoursInfo.verified
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                            : 'bg-amber-50 text-amber-900 border-amber-200'
                        }`}
                      >
                        {timingData.openingHoursInfo.verified ? 'Hours Checked' : 'Hours Unverified'}
                      </span>
                    </div>
                    <p className="text-sm text-[#394543] leading-relaxed">
                      {timingData.openingHoursInfo.text}
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#F0ECE1] text-xs text-[#5A6664]">
                      <span>Source: {timingData.openingHoursInfo.source}</span>
                      {typeof timingData.openingHoursInfo.isOpenEstimate === 'boolean' && (
                        <span className="inline-flex items-center gap-1 font-semibold text-[#123D3A]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {timingData.openingHoursInfo.isOpenEstimate ? 'Currently Open' : 'Currently Closed'}
                        </span>
                      )}
                    </div>
                  </section>
                )}

                {/* Return Train / Bus Planner */}
                <section className="rounded-3xl bg-white border border-[#DFD8C8] p-6 space-y-4 shadow-xs">
                  <div className="flex items-center gap-2">
                    <Train className="w-5 h-5 text-[#123D3A]" aria-hidden="true" />
                    <h2 className="font-editorial text-xl font-semibold text-[#142322]">
                      Return Train / Bus Planner
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="space-y-1 block">
                      <span className="text-xs font-mono uppercase text-[#5A6664]">
                        Departure Time (User-entered)
                      </span>
                      <input
                        type="time"
                        value={returnDepartureTime}
                        onChange={(e) => setReturnDepartureTime(e.target.value)}
                        className="ys-input w-full px-3 py-2.5 rounded-xl bg-[#FAF8F3] border border-[#D7CFC1] text-sm font-mono text-[#142322]"
                      />
                    </label>

                    <label className="space-y-1 block">
                      <span className="text-xs font-mono uppercase text-[#5A6664]">
                        Reporting Buffer (min)
                      </span>
                      <input
                        type="number"
                        min={5}
                        max={120}
                        value={returnCheckInBufferMin}
                        onChange={(e) =>
                          setReturnCheckInBufferMin(
                            Math.max(5, Math.min(120, Number(e.target.value) || 25))
                          )
                        }
                        className="ys-input w-full px-3 py-2.5 rounded-xl bg-[#FAF8F3] border border-[#D7CFC1] text-sm font-mono text-[#142322]"
                      />
                    </label>
                  </div>

                  <label className="space-y-1 block">
                    <span className="text-xs font-mono uppercase text-[#5A6664]">
                      Return Station / Terminal
                    </span>
                    <input
                      type="text"
                      value={returnStationLabel}
                      onChange={(e) => setReturnStationLabel(e.target.value)}
                      placeholder="Station or Bus Terminal name"
                      className="ys-input w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F3] border border-[#D7CFC1] text-sm text-[#142322]"
                    />
                  </label>

                  {timingData?.returnPlanner.hasReturnDeparture && timingData.returnPlanner.mustLeaveByIso && (
                    <div className="rounded-2xl bg-[#123D3A] text-white p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase text-[#8CC9E8]">
                          Must Leave Venue By
                        </span>
                        {timingData.returnPlanner.returnStatus && (
                          <span className="px-2 py-0.5 rounded bg-[#E9A34A] text-[#142322] text-xs font-bold">
                            {timingData.returnPlanner.returnStatus}
                          </span>
                        )}
                      </div>
                      <p className="font-editorial text-2xl font-bold text-white">
                        {formatClock(timingData.returnPlanner.mustLeaveByIso)}
                      </p>
                      <p className="text-xs text-white/80">
                        Includes {timingData.returnPlanner.returnTravelMin} min return travel +{' '}
                        {timingData.returnPlanner.recommendedCheckInBufferMin} min station reporting buffer
                        {returnStationLabel ? ` to ${returnStationLabel}` : ''}.
                        {timingData.returnPlanner.returnMarginMin !== null &&
                          (timingData.returnPlanner.returnMarginMin >= 0
                            ? ` Buffer after finishing visit: ~${timingData.returnPlanner.returnMarginMin} min.`
                            : ` Exceeds finish time by ${Math.abs(timingData.returnPlanner.returnMarginMin)} min.`)}
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-[#5A6664] flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#123D3A]" />
                    <span>
                      {timingData?.returnPlanner.verificationNotice ||
                        'Return departure times are user-entered and not auto-fetched from IRCTC or bus operators.'}
                    </span>
                  </p>
                </section>

                {/* Crowd Information — Strictly Honest Availability Status */}
                <section className="rounded-3xl bg-white border border-[#DFD8C8] p-6 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-[#123D3A]" aria-hidden="true" />
                      <h2 className="font-editorial text-xl font-semibold text-[#142322]">
                        Live Crowd Status
                      </h2>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-stone-100 border border-stone-300 text-xs font-semibold text-stone-700">
                      {timingData?.crowd.status || 'Information Unavailable'}
                    </span>
                  </div>

                  <div className="rounded-2xl bg-[#FAF8F3] border border-[#E5DFD3] p-4 flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-[#123D3A] shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="space-y-1 text-sm text-[#394543]">
                      <p className="font-semibold text-[#142322]">
                        {timingData?.crowd.message || 'Crowd information is currently unavailable.'}
                      </p>
                      <p className="text-xs text-[#5A6664] leading-relaxed">
                        {timingData?.crowd.note ||
                          'Yatra Saathi does not show simulated or fabricated live crowd densities.'}
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
