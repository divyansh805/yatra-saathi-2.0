import type { SmartHopFareOption, CityTariffProfile } from '../../data/fareEngine';

export interface SmartHopPlace {
  id?: string;
  label: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  placeType?: string;
  groundTip?: string;
  source?: string;
}

export interface SharedJourney {
  journeyId: string;
  origin: SmartHopPlace;
  destination: SmartHopPlace;
  city: string;
  state: string;
  distanceKm: number;
  durationMinutes: number;
  trafficAwareDurationMinutes: number | null;
  isTrafficAware: boolean;
  routeSource: string;
  trafficSourceLabel: string;
  routeGeometry: Array<{ lat: number; lng: number }>;
  routeTimestamp: string;
  createdAt: number;
  expiresAt: number;
}

export interface SmartHopFareResponse {
  distanceKm: number | null;
  durationMinutes: number | null;
  profile: CityTariffProfile;
  options: SmartHopFareOption[];
  curatedTips: string[];
  matchedLandmarkSummary?: {
    name: string;
    shortDescription: string;
    bestVisitingTime: string;
    openingHoursText?: string;
    openingHoursVerified?: boolean;
  } | null;
  disclaimer: string;
}

export interface SmartHopLocalVoiceResponse {
  languageCode: string;
  languageLabel: string;
  aiPowered: boolean;
  aiProvider: string | null;
  groqConfigured: boolean;
  groqStatus: 'ok' | 'not_configured' | 'error';
  statusMessage: string;
  phraseNative: string;
  transliteration: string;
  englishTranslation: string;
  toneNote: string;
  ttsLangTag: string;
  generatedAt: string;
}

export type TimingStatus = 'SAFE' | 'HURRY' | 'RISK' | 'INFO_ONLY';

export interface SmartHopTimingResponse {
  status: TimingStatus;
  statusHeadline: string;
  nowIso: string;
  travelDurationMin: number;
  isTrafficAware: boolean;
  walkingBufferMin: number;
  parkingBufferMin: number;
  activityBufferMin: number;
  totalTimeNeededMin: number;
  estimatedVenueArrivalIso: string;
  estimatedCompletionIso: string;
  safeMarginMin: number | null;
  deadlineUsedLabel: string | null;
  deadlineIso: string | null;
  openingHoursInfo: {
    text: string;
    verified: boolean;
    source: string;
    isOpenEstimate?: boolean | null;
  };
  returnPlanner: {
    hasReturnDeparture: boolean;
    returnDepartureIso: string | null;
    isUserEntered: boolean;
    verificationNotice: string;
    returnTravelMin: number;
    recommendedCheckInBufferMin: number;
    mustLeaveByIso: string | null;
    returnMarginMin: number | null;
    returnStatus: TimingStatus | null;
  };
  crowd: {
    status: 'Information Unavailable';
    available: false;
    message: string;
    note: string;
  };
}

export type PitstopCategory =
  | 'washroom'
  | 'pure_veg'
  | 'local_food'
  | 'atm'
  | 'pharmacy'
  | 'cloakroom';

export interface EnroutePitstop {
  id: string;
  name: string;
  category: PitstopCategory;
  address: string;
  lat: number;
  lng: number;
  routeProgressPercent: number;
  corridorOffsetKm: number;
  additionalDistanceKm: number | null;
  additionalMinutes: number | null;
  isZeroDetour: boolean;
  detourLabel: string;
  detourVerified: boolean;
  rating: number | null;
  userRatingCount: number | null;
  openNow: boolean | null;
  photoUrl: string | null;
  directionsUrl: string;
  sourceNote: string;
}

export interface SmartHopPitstopsResponse {
  category: PitstopCategory;
  placesAvailable: boolean;
  quotaExceeded: boolean;
  status: 'ok' | 'empty' | 'unavailable' | 'quota_exceeded' | 'error';
  message: string;
  originalDistanceKm: number;
  originalDurationMin: number;
  stops: EnroutePitstop[];
}
