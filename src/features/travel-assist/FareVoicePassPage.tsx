import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  Bike,
  Car,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Info,
  Loader2,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Square,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { MotionCard } from '../../components/MotionCard';
import { RevealGroup, RevealItem } from '../../components/Reveal';
import { STAGGER_CARDS_MS } from '../../motion/tokens';
import { JourneyMissingCard, SmartHopHeader } from './SmartHopHeader';
import { loadSharedJourney } from './travelAssistSession';
import type {
  SharedJourney,
  SmartHopFareResponse,
  SmartHopLocalVoiceResponse,
} from './smartHopTypes';
import type { FareEstimateType, FareVehicleCategory } from '../../data/fareEngine';

const SUPPORTED_VOICE_LANGUAGES: Array<{ code: string; label: string }> = [
  { code: 'hi', label: 'Hindi' },
  { code: 'en', label: 'English' },
  { code: 'or', label: 'Odia' },
  { code: 'ta', label: 'Tamil' },
  { code: 'mr', label: 'Marathi' },
  { code: 'bn', label: 'Bengali' },
  { code: 'te', label: 'Telugu' },
  { code: 'kn', label: 'Kannada' },
  { code: 'ml', label: 'Malayalam' },
  { code: 'gu', label: 'Gujarati' },
  { code: 'pa', label: 'Punjabi' },
];

function getLabelBadgeStyle(label: FareEstimateType): string {
  switch (label) {
    case 'Verified Local Tariff':
      return 'bg-emerald-50 text-emerald-900 border-emerald-200';
    case 'Calculated Indicative Estimate':
      return 'bg-[#123D3A]/10 text-[#123D3A] border-[#123D3A]/25';
    case 'Approximate Estimate':
      return 'bg-amber-50 text-amber-900 border-amber-200';
    case 'Fare Information Unavailable':
    default:
      return 'bg-stone-100 text-stone-700 border-stone-300';
  }
}

function getVehicleIcon(category: FareVehicleCategory) {
  if (category === 'bike') return Bike;
  if (category === 'cab') return Car;
  return Car;
}

export function FareVoicePassPage() {
  const [searchParams] = useSearchParams();
  const journeyLookup = useMemo(
    () => loadSharedJourney(searchParams.get('j')),
    [searchParams]
  );
  const journey: SharedJourney | null = journeyLookup.journey;

  const [fareData, setFareData] = useState<SmartHopFareResponse | null>(null);
  const [fareLoading, setFareLoading] = useState(false);
  const [fareError, setFareError] = useState<string | null>(null);
  const [expandedBreakdown, setExpandedBreakdown] = useState<Record<string, boolean>>({
    auto: true,
    cab: false,
    bike: false,
  });

  // Local Voice Pass state
  const [voiceLangCode, setVoiceLangCode] = useState<string>('hi');
  const [voiceMode, setVoiceMode] = useState<FareVehicleCategory>('auto');
  const [pickupNote, setPickupNote] = useState<string>('');
  const [voiceData, setVoiceData] = useState<SmartHopLocalVoiceResponse | null>(null);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Web SpeechSynthesis inspection (strictly checks actual browser voice availability)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsWarning, setTtsWarning] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const syncVoices = () => {
      try {
        setAvailableVoices(window.speechSynthesis.getVoices() || []);
      } catch {
        setAvailableVoices([]);
      }
    };
    syncVoices();
    window.speechSynthesis.addEventListener?.('voiceschanged', syncVoices);
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', syncVoices);
      window.speechSynthesis.cancel();
    };
  }, []);

  // Load Fare Estimates once for active SharedJourney
  useEffect(() => {
    if (!journey) return;
    let cancelled = false;
    setFareLoading(true);
    setFareError(null);

    fetch('/api/smart-hop/fare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        distanceKm: journey.distanceKm,
        durationMinutes: journey.trafficAwareDurationMinutes ?? journey.durationMinutes,
        originLabel: journey.origin.label,
        destLabel: journey.destination.label,
        city: journey.city,
        state: journey.state,
        origin: { lat: journey.origin.lat, lng: journey.origin.lng },
        destination: { lat: journey.destination.lat, lng: journey.destination.lng },
      }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Unable to load fare reference right now.');
        return (await res.json()) as SmartHopFareResponse;
      })
      .then((data) => {
        if (!cancelled) setFareData(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setFareError(err instanceof Error ? err.message : 'Unable to compute local fares.');
        }
      })
      .finally(() => {
        if (!cancelled) setFareLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [journey]);

  const selectedModeFare = useMemo(() => {
    return fareData?.options.find((opt) => opt.category === voiceMode) || null;
  }, [fareData, voiceMode]);

  const generateVoicePass = useCallback(
    async (targetLangCode: string, targetMode: FareVehicleCategory, note: string) => {
      if (!journey) return;
      setVoiceLoading(true);
      setVoiceError(null);
      setTtsWarning(null);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }

      const langMeta =
        SUPPORTED_VOICE_LANGUAGES.find((l) => l.code === targetLangCode) ||
        SUPPORTED_VOICE_LANGUAGES[0];

      const matchingFare = fareData?.options.find((opt) => opt.category === targetMode);

      try {
        const res = await fetch('/api/smart-hop/local-voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            originLabel: journey.origin.label,
            destLabel: journey.destination.label,
            languageCode: langMeta.code,
            languageLabel: langMeta.label,
            fareMinInr: matchingFare?.available ? matchingFare.fareMinInr : null,
            fareMaxInr: matchingFare?.available ? matchingFare.fareMaxInr : null,
            preferredMode: targetMode,
            pickupNote: note.trim(),
          }),
        });
        const data = (await res.json()) as SmartHopLocalVoiceResponse & { error?: string };
        if (!res.ok) {
          throw new Error(data.error || 'Could not generate Local Voice Pass.');
        }
        setVoiceData(data);
      } catch (err: unknown) {
        setVoiceError(
          err instanceof Error ? err.message : 'Unable to generate Local Voice Pass right now.'
        );
      } finally {
        setVoiceLoading(false);
      }
    },
    [journey, fareData]
  );

  // Auto-generate Hindi script once fare band is ready (still NEVER auto-plays audio!)
  useEffect(() => {
    if (!journey || !fareData || voiceData || voiceLoading) return;
    generateVoicePass(voiceLangCode, voiceMode, pickupNote);
  }, [journey, fareData, voiceData, voiceLoading, voiceLangCode, voiceMode, pickupNote, generateVoicePass]);

  const matchingSpeechVoice = useMemo(() => {
    if (!voiceData || availableVoices.length === 0) return null;
    const tagLower = voiceData.ttsLangTag.toLowerCase();
    const baseLang = tagLower.split('-')[0];
    return (
      availableVoices.find((v) => v.lang.toLowerCase() === tagLower) ||
      availableVoices.find((v) => v.lang.toLowerCase().startsWith(`${baseLang}-`)) ||
      availableVoices.find((v) => v.lang.toLowerCase() === baseLang) ||
      null
    );
  }, [voiceData, availableVoices]);

  const speechApiSupported =
    typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';

  const handleSpeak = () => {
    if (!voiceData) return;
    setTtsWarning(null);

    if (!speechApiSupported) {
      setTtsWarning(
        `Browser SpeechSynthesis is not supported on this device. You can read or copy the ${voiceData.languageLabel} script below.`
      );
      return;
    }

    if (!matchingSpeechVoice) {
      setTtsWarning(
        `No ${voiceData.languageLabel} (${voiceData.ttsLangTag}) speech voice is installed on this browser/OS. Spoken playback is unavailable for this language—please use the written script or Copy button.`
      );
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(voiceData.phraseNative);
      utterance.voice = matchingSpeechVoice;
      utterance.lang = matchingSpeechVoice.lang;
      utterance.rate = 0.94;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => {
        setIsSpeaking(false);
        setTtsWarning(
          `Audio playback for ${voiceData.languageLabel} failed on this device. Use the written script or Copy button.`
        );
      };
      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
      setTtsWarning(
        `Unable to start browser speech playback for ${voiceData.languageLabel}.`
      );
    }
  };

  const handleStopSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const handleCopyScript = async () => {
    if (!voiceData) return;
    try {
      await navigator.clipboard.writeText(voiceData.phraseNative);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setTtsWarning('Clipboard copy was blocked—please highlight and copy the script manually.');
    }
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
              activeTab="fare"
              eyebrow="SMART LOCAL HOP · FEATURE 01"
              title="Know the fare before you ride."
              subtitle="Transparent Auto/E-Rickshaw, Cab, and Bike tariff estimates for your route — paired with a polite, respectful Local Voice Pass in the driver's language."
            />

            {/* Section A: Fair Fare Estimates */}
            <section aria-labelledby="fair-fare-heading" className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                <div>
                  <h2
                    id="fair-fare-heading"
                    className="font-editorial text-2xl sm:text-3xl font-semibold text-[#142322]"
                  >
                    Indicative Local Fare Bands
                  </h2>
                  {fareData?.profile && (
                    <p className="text-sm text-[#495553] mt-0.5">
                      Tariff region: <strong className="text-[#123D3A]">{fareData.profile.regionLabel}</strong>
                    </p>
                  )}
                </div>
                <span className="text-xs font-mono text-[#5A6664]">
                  No live operator API claims · Transparent formulas
                </span>
              </div>

              {fareLoading && (
                <div className="rounded-2xl bg-white border border-[#DFD8C8] p-8 flex items-center gap-3 text-[#495553]">
                  <Loader2 className="w-5 h-5 animate-spin text-[#123D3A]" />
                  <span>Computing city tariff bands and curated local notes...</span>
                </div>
              )}

              {fareError && (
                <div className="rounded-2xl bg-amber-50 border border-amber-300 p-5 text-sm text-amber-950 flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
                  <span>{fareError}</span>
                </div>
              )}

              {fareData && (
                <>
                  <RevealGroup
                    immediate
                    staggerMs={STAGGER_CARDS_MS}
                    className="grid grid-cols-1 md:grid-cols-3 gap-5"
                  >
                    {fareData.options.map((opt, idx) => {
                      const Icon = getVehicleIcon(opt.category);
                      const isExpanded = Boolean(expandedBreakdown[opt.category]);
                      return (
                        <RevealItem key={opt.category} index={idx} className="h-full">
                          <MotionCard className="h-full rounded-2xl bg-white border border-[#DFD8C8] p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-xs">
                            <div className="space-y-3.5">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2.5">
                                  <span className="w-10 h-10 rounded-xl bg-[#123D3A] text-white flex items-center justify-center shrink-0">
                                    <Icon className="w-5 h-5" aria-hidden="true" />
                                  </span>
                                  <div>
                                    <h3 className="font-editorial text-xl font-semibold text-[#142322]">
                                      {opt.categoryTitle}
                                    </h3>
                                    <p className="text-xs text-[#5A6664]">{opt.capacityNote}</p>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${getLabelBadgeStyle(
                                    opt.label
                                  )}`}
                                >
                                  {opt.label}
                                </span>
                                <span className="px-2 py-1 rounded-lg bg-[#F5F1E8] border border-[#E5DFD3] text-[11px] font-mono text-[#394543]">
                                  Confidence: {opt.confidenceLevel}
                                </span>
                              </div>

                              {opt.available && opt.fareMinInr !== null && opt.fareMaxInr !== null ? (
                                <div className="rounded-xl bg-[#FAF8F3] border border-[#E5DFD3] p-4">
                                  <p className="text-xs font-mono uppercase tracking-[0.06em] text-[#5A6664]">
                                    Estimated Fair Range
                                  </p>
                                  <p className="font-editorial text-3xl font-bold text-[#123D3A] tabular-figures mt-0.5">
                                    {opt.fareMinInr === opt.fareMaxInr
                                      ? `₹${opt.fareMinInr}`
                                      : `₹${opt.fareMinInr}–₹${opt.fareMaxInr}`}
                                  </p>
                                  <p className="text-xs text-[#495553] mt-1 leading-relaxed">
                                    {opt.calculationExplanation}
                                  </p>
                                </div>
                              ) : (
                                <div className="rounded-xl bg-stone-50 border border-stone-200 p-4 text-sm text-stone-700 leading-relaxed">
                                  {opt.unavailableReason ||
                                    'Local tariff information is currently unavailable for this vehicle type on this corridor.'}
                                </div>
                              )}
                            </div>

                            {opt.breakdown && (
                              <div className="pt-2 border-t border-[#F0ECE1] space-y-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedBreakdown((prev) => ({
                                      ...prev,
                                      [opt.category]: !prev[opt.category],
                                    }))
                                  }
                                  className="w-full flex items-center justify-between text-xs font-semibold text-[#123D3A] py-1"
                                >
                                  <span>Formula, Source & Verification Details</span>
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </button>

                                {isExpanded && (
                                  <div className="rounded-xl bg-[#FAF8F3] border border-[#E5DFD3] p-3.5 text-xs space-y-2 text-[#394543]">
                                    <div className="flex justify-between">
                                      <span>Base fare (first {opt.breakdown.includedDistanceKm} km)</span>
                                      <span className="font-mono font-semibold">₹{opt.breakdown.baseFareInr}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>
                                        Distance ({opt.breakdown.billableExtraKm} km × ₹{opt.breakdown.perKmRateInr}/km)
                                      </span>
                                      <span className="font-mono font-semibold">
                                        ₹{opt.breakdown.distanceComponentInr}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Time component (₹{opt.breakdown.perMinRateInr}/min)</span>
                                      <span className="font-mono font-semibold">₹{opt.breakdown.timeComponentInr}</span>
                                    </div>
                                    {opt.breakdown.minimumApplied && (
                                      <div className="flex justify-between text-[#123D3A] font-medium">
                                        <span>Minimum fare floor applied</span>
                                        <span className="font-mono">₹{opt.breakdown.minimumFareInr}</span>
                                      </div>
                                    )}
                                    <div className="pt-2 border-t border-[#E5DFD3] space-y-1 text-[11px] text-[#5A6664]">
                                      <p>
                                        <strong>Waiting:</strong> {opt.breakdown.waitingCharges}
                                      </p>
                                      <p>
                                        <strong>Night rule:</strong> {opt.breakdown.nightCharges}
                                      </p>
                                      <p>
                                        <strong>Source:</strong> {opt.metadata.source}
                                      </p>
                                      <p>
                                        <strong>Effective / Verified:</strong> {opt.metadata.effectiveDate} /{' '}
                                        {opt.metadata.verificationDate}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </MotionCard>
                        </RevealItem>
                      );
                    })}
                  </RevealGroup>

                  <div className="rounded-xl bg-white border border-[#DFD8C8] px-4 py-3 text-xs text-[#495553] flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-[#123D3A] shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{fareData.disclaimer}</span>
                  </div>
                </>
              )}
            </section>

            {/* Section B: Local Voice Pass + Curated Local Tips */}
            <section className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.95fr] gap-6 items-start">
              {/* Prominent Local Voice Pass */}
              <div className="rounded-3xl bg-white border border-[#DFD8C8] p-6 sm:p-7 space-y-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <p className="eyebrow-mono font-semibold text-[#123D3A] flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-[#E9A34A]" aria-hidden="true" />
                      <span>LOCAL VOICE PASS</span>
                    </p>
                    <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#142322] mt-1">
                      Speak politely with local drivers
                    </h2>
                    <p className="text-sm text-[#495553] mt-1">
                      Generate a natural, respectful local-language script calibrated to your route and indicative fare band.
                    </p>
                  </div>

                  {voiceData && (
                    <span
                      className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                        voiceData.aiPowered
                          ? 'bg-[#123D3A]/10 text-[#123D3A] border-[#123D3A]/25'
                          : 'bg-amber-50 text-amber-900 border-amber-200'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#E9A34A]" aria-hidden="true" />
                      <span>{voiceData.aiPowered ? voiceData.aiProvider : 'Structured Template'}</span>
                    </span>
                  )}
                </div>

                {/* Controls: Vehicle Mode + Language */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono uppercase tracking-[0.06em] text-[#5A6664] mr-1">
                      Transport Mode:
                    </span>
                    {(['auto', 'cab', 'bike'] as FareVehicleCategory[]).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          setVoiceMode(m);
                          generateVoicePass(voiceLangCode, m, pickupNote);
                        }}
                        className={`ys-chip px-3 py-1.5 rounded-lg text-xs font-semibold border capitalize ${
                          voiceMode === m
                            ? 'bg-[#123D3A] text-white border-[#123D3A]'
                            : 'bg-[#FAF8F3] text-[#394543] border-[#E2DAC9]'
                        }`}
                      >
                        {m === 'auto' ? 'Auto / E-Rickshaw' : m === 'cab' ? 'Cab' : 'Bike'}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs font-mono uppercase tracking-[0.06em] text-[#5A6664]">
                      Target Driver Language:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {SUPPORTED_VOICE_LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => {
                            setVoiceLangCode(lang.code);
                            generateVoicePass(lang.code, voiceMode, pickupNote);
                          }}
                          className={`ys-chip px-3 py-1.5 rounded-lg text-xs font-medium border ${
                            voiceLangCode === lang.code
                              ? 'bg-[#E9A34A] text-[#142322] border-[#DF9538] font-bold'
                              : 'bg-[#FAF8F3] text-[#394543] border-[#E2DAC9] hover:border-[#123D3A]/40'
                          }`}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="text"
                      value={pickupNote}
                      onChange={(e) => setPickupNote(e.target.value)}
                      placeholder="Optional note (e.g., 2 bags, prepaid stand side, round trip)"
                      className="ys-input flex-1 px-3.5 py-2.5 rounded-xl bg-[#FAF8F3] border border-[#D7CFC1] text-sm text-[#142322] focus:bg-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => generateVoicePass(voiceLangCode, voiceMode, pickupNote)}
                      disabled={voiceLoading}
                      className="ys-btn-secondary inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[42px] rounded-xl bg-[#F5F1E8] border border-[#D7CFC1] text-sm font-semibold text-[#123D3A] shrink-0"
                    >
                      {voiceLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RotateCcw className="w-4 h-4" />
                      )}
                      <span>{voiceLoading ? 'Refreshing...' : 'Refresh Script'}</span>
                    </button>
                  </div>
                </div>

                {voiceError && (
                  <div className="rounded-xl bg-amber-50 border border-amber-300 p-4 text-sm text-amber-950">
                    {voiceError}
                  </div>
                )}

                {voiceData && (
                  <div className="rounded-2xl bg-[#123D3A] text-white p-5 sm:p-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-white/80">
                      <span>
                        {voiceData.languageLabel} · {voiceData.toneNote}
                      </span>
                      {selectedModeFare?.available && selectedModeFare.fareMinInr && (
                        <span className="font-mono text-[#E9A34A]">
                          Ref band: ₹{selectedModeFare.fareMinInr}–₹{selectedModeFare.fareMaxInr}
                        </span>
                      )}
                    </div>

                    <p className="text-xl sm:text-2xl font-semibold leading-relaxed text-white">
                      {voiceData.phraseNative}
                    </p>

                    <div className="rounded-xl bg-white/10 border border-white/15 p-3.5 space-y-2 text-sm">
                      <div>
                        <p className="text-[11px] font-mono uppercase tracking-[0.06em] text-[#8CC9E8]">
                          Pronunciation Guide
                        </p>
                        <p className="text-white/95 mt-0.5">{voiceData.transliteration}</p>
                      </div>
                      <div className="pt-2 border-t border-white/12">
                        <p className="text-[11px] font-mono uppercase tracking-[0.06em] text-[#8CC9E8]">
                          English Meaning
                        </p>
                        <p className="text-white/85 mt-0.5">{voiceData.englishTranslation}</p>
                      </div>
                    </div>

                    {!voiceData.aiPowered && (
                      <p className="text-xs text-amber-200 leading-relaxed">
                        {voiceData.statusMessage}
                      </p>
                    )}

                    {/* Manual Speech Controls (No Auto-Play) + Copy */}
                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                      {!isSpeaking ? (
                        <button
                          type="button"
                          onClick={handleSpeak}
                          className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-[#E9A34A] text-[#142322] text-sm font-bold hover:bg-[#DF9538] transition-colors"
                        >
                          {matchingSpeechVoice ? (
                            <Volume2 className="w-4 h-4" aria-hidden="true" />
                          ) : (
                            <VolumeX className="w-4 h-4" aria-hidden="true" />
                          )}
                          <span>Speak Script</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleStopSpeech}
                          className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-rose-500 text-white text-sm font-bold hover:bg-rose-600 transition-colors"
                        >
                          <Square className="w-4 h-4" aria-hidden="true" />
                          <span>Stop Audio</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleSpeak}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-xl bg-white/12 hover:bg-white/20 border border-white/20 text-white text-sm font-medium transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" aria-hidden="true" />
                        <span>Replay</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCopyScript}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-xl bg-white/12 hover:bg-white/20 border border-white/20 text-white text-sm font-medium transition-colors"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-300" aria-hidden="true" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" aria-hidden="true" />
                            <span>Copy Text</span>
                          </>
                        )}
                      </button>
                    </div>

                    {ttsWarning && (
                      <div
                        role="status"
                        className="rounded-xl bg-amber-950/60 border border-amber-300/40 px-3.5 py-2.5 text-xs text-amber-100 leading-relaxed"
                      >
                        {ttsWarning}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Practical Curated Local Tips */}
              <aside className="rounded-3xl bg-white border border-[#DFD8C8] p-6 space-y-4 shadow-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#123D3A]" aria-hidden="true" />
                  <h2 className="font-editorial text-2xl font-semibold text-[#142322]">
                    Curated Ground Tips
                  </h2>
                </div>

                {fareData?.matchedLandmarkSummary && (
                  <div className="rounded-2xl bg-[#F5F1E8] border border-[#E2DAC9] p-4 space-y-1.5">
                    <p className="text-xs font-mono uppercase tracking-[0.06em] text-[#123D3A] font-semibold">
                      Matched Location Note · {fareData.matchedLandmarkSummary.name}
                    </p>
                    <p className="text-sm text-[#394543] leading-relaxed">
                      {fareData.matchedLandmarkSummary.shortDescription}
                    </p>
                    <p className="text-xs text-[#5A6664]">
                      Best visiting window: {fareData.matchedLandmarkSummary.bestVisitingTime}
                    </p>
                  </div>
                )}

                <ul className="space-y-3">
                  {(
                    fareData?.curatedTips || [
                      'Compare the driver quote with the indicative range before boarding and ask whether a metered or prepaid stand rate is available.',
                    ]
                  ).map((tip, i) => (
                    <li
                      key={`${i}-${tip.slice(0, 18)}`}
                      className="rounded-xl bg-[#FAF8F3] border border-[#E5DFD3] p-3.5 text-sm text-[#394543] leading-relaxed flex items-start gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-full bg-[#123D3A] text-white text-xs font-mono flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </aside>
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
