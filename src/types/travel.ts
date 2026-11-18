export type LanguageCode = 'en' | 'hi' | 'ta' | 'mr';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface ArrivalHub {
  id: string;
  name: string;
  type: 'Railway Station' | 'Airport' | 'Bus Stand';
  lat: number;
  lng: number;
  groundTip: string;
}

export interface AttractionItem {
  id: string;
  destinationId: string;
  name: string;
  category: 'Historical' | 'Natural' | 'Cultural' | 'Hidden Gem' | 'Popular';
  location: string;
  lat: number;
  lng: number;
  image: string;
  shortDescription: string;
  fullDescription: string;
  bestVisitingTime: string;
  openingHours: string;
  openingHoursVerified: boolean;
  entryFee: string;
  entryFeeVerified: boolean;
  sourceNote: string;
}

export type CafeTag =
  | 'Solo Friendly'
  | 'Work Friendly'
  | 'Scenic View'
  | 'Budget Friendly'
  | 'Group Friendly';

export interface CafeItem {
  id: string;
  destinationId: string;
  name: string;
  setting: string;
  location: string;
  lat: number;
  lng: number;
  image: string;
  shortDescription: string;
  fullDescription: string;
  tags: CafeTag[];
  priceRange: string | null;
  priceSource: string;
  openingHours: string | null;
  hoursVerified: boolean;
  soloTravellerNote: string;
  mapsQueryUrl: string;
}

export interface AdventureItem {
  id: string;
  destinationId: string;
  name: string;
  activityType: string;
  location: string;
  lat: number;
  lng: number;
  image: string;
  shortDescription: string;
  fullDescription: string;
  approxCost: string | null;
  costBasis: string;
  duration: string;
  seasonWindow: string;
  safetyRequirements: string;
  ageRequirement: string;
  operatorLink: string | null;
  operatorLabel: string;
}

export interface StayProperty {
  id: string;
  destinationId: string;
  name: string;
  propertyType: string;
  area: string;
  location: string;
  lat: number;
  lng: number;
  images: string[];
  pricePerNightInr: number | null;
  priceSource: string;
  landmarkDistances: Array<{ landmark: string; distance: string }>;
  facilities: string[];
  cleanlinessInfo: string;
  parkingInfo: string;
  parkingAvailable: boolean;
  networkInfo: string;
  networkQuality: 'Strong Fiber + 5G' | 'Reliable 4G' | 'Limited / Patchy';
  hiddenCharges: string;
  verificationStatus: 'Public Listing + Field Notes' | 'Unverified Public Directory';
  verificationDate: string;
  sourceName: string;
  ownerContact: string | null;
  bookingReferenceUrl: string;
}

export interface DestinationProfile {
  id: string;
  name: string;
  state: string;
  tagline: string;
  heroImage: string;
  coords: Coordinates;
  bestSeason: string;
  groundIntelligence: string;
  arrivalHubs: ArrivalHub[];
  popularStaysAreas: Array<{ id: string; name: string; lat: number; lng: number }>;
  attractions: AttractionItem[];
  cafes: CafeItem[];
  adventures: AdventureItem[];
  stays: StayProperty[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface SavedItem {
  id: string;
  type: 'attraction' | 'cafe' | 'adventure' | 'stay' | 'destination';
  destinationId: string;
  title: string;
  subtitle: string;
  image: string;
  savedAt: string;
  cachedSummary?: string;
}

export interface SavedRoute {
  id: string;
  destinationId: string;
  destinationName: string;
  pickupLabel: string;
  stops: Array<{ id: string; name: string; lat: number; lng: number }>;
  totalDistanceKm: number | null;
  totalDurationMin: number | null;
  estimatedTransportInr: number | null;
  savedAt: string;
}

export interface ViewedDestination {
  destinationId: string;
  destinationName: string;
  image: string;
  viewedAt: string;
}

export interface WeatherSnapshot {
  status: 'live' | 'cached' | 'unavailable';
  source: string;
  fetchedAt: string;
  message?: string;
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    weather_code: number;
    wind_speed_10m: number;
  } | null;
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
  } | null;
}
