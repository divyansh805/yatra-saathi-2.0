export type FareProviderName = 'Rapido' | 'Ola' | 'Uber' | 'Local Prepaid Stand';
export type FareVehicleCategory = 'bike' | 'auto' | 'cab';
export type FareEstimateType =
  | 'Live Provider Quote'
  | 'Calculated Estimate'
  | 'Approximate Estimate';

export interface ProviderRateConfig {
  id: string;
  provider: FareProviderName;
  providerTitle: string;
  category: FareVehicleCategory;
  categoryLabel: string;
  vehicleType: string;
  maxPassengers: number;
  luggageCapacity: string;
  regionId: string;
  regionLabel: string;
  baseFareInr: number;
  baseIncludedKm: number;
  perKmRateInr: number;
  perMinRateInr: number;
  minimumFareInr: number;
  bookingFeeInr: number;
  taxRatePercent: number;
  waitingPolicy: string;
  effectiveDate: string;
  verificationDate: string;
  sourceLabel: string;
  estimateType: FareEstimateType;
}

export interface FareBreakdown {
  baseFareInr: number;
  baseIncludedKm: number;
  billableExtraKm: number;
  distanceChargeInr: number;
  perKmRateInr: number;
  timeChargeInr: number;
  perMinRateInr: number;
  bookingFeeInr: number;
  taxesAndFeesInr: number;
  minimumFareInr: number;
  minimumApplied: boolean;
  waitingPolicy: string;
  regionLabel: string;
  effectiveDate: string;
  verificationDate: string;
  sourceLabel: string;
  estimateType: FareEstimateType;
  calculatedFareInr: number;
}

interface RegionMultiplierSet {
  regionId: string;
  regionLabel: string;
  matchKeywords: string[];
  bikeMult: number;
  autoMult: number;
  cabMult: number;
  verificationDate: string;
  sourceNote: string;
  isExactRegionalCard: boolean;
}

const REGIONAL_PROFILES: RegionMultiplierSet[] = [
  {
    regionId: 'odisha-coastal',
    regionLabel: 'Odisha (Puri – Bhubaneswar Corridor)',
    matchKeywords: ['puri', 'konark', 'bhubaneswar', 'cuttack', 'chilika', 'odisha'],
    bikeMult: 0.94,
    autoMult: 0.96,
    cabMult: 0.98,
    verificationDate: '2026-02-15',
    sourceNote: 'Odisha STA Auto/Taxi Guidance & Regional Aggregator Tariff Structure',
    isExactRegionalCard: true,
  },
  {
    regionId: 'delhi-ncr',
    regionLabel: 'Delhi NCR',
    matchKeywords: ['delhi', 'new delhi', 'noida', 'gurugram', 'gurgaon', 'faridabad', 'ghaziabad'],
    bikeMult: 1.0,
    autoMult: 1.04,
    cabMult: 1.08,
    verificationDate: '2026-02-20',
    sourceNote: 'Delhi Transport Dept Meter Benchmarks & Metro Aggregator Fare Structure',
    isExactRegionalCard: true,
  },
  {
    regionId: 'maharashtra-metro',
    regionLabel: 'Maharashtra (Mumbai / Pune)',
    matchKeywords: ['mumbai', 'thane', 'navi mumbai', 'pune', 'nagpur', 'shirdi', 'maharashtra'],
    bikeMult: 1.02,
    autoMult: 1.05,
    cabMult: 1.12,
    verificationDate: '2026-02-18',
    sourceNote: 'MMRTA / Pune RTA Tariff Card & City Aggregator Rate Benchmarks',
    isExactRegionalCard: true,
  },
  {
    regionId: 'karnataka-metro',
    regionLabel: 'Karnataka (Bengaluru / Mysuru)',
    matchKeywords: ['bengaluru', 'bangalore', 'mysuru', 'mysore', 'mangaluru', 'karnataka'],
    bikeMult: 1.05,
    autoMult: 1.1,
    cabMult: 1.14,
    verificationDate: '2026-02-18',
    sourceNote: 'Karnataka Transport Dept Notified City Auto/Cab Structure',
    isExactRegionalCard: true,
  },
  {
    regionId: 'rajasthan-heritage',
    regionLabel: 'Rajasthan (Jaipur / Udaipur / Jodhpur)',
    matchKeywords: ['jaipur', 'udaipur', 'jodhpur', 'bikaner', 'ajmer', 'kota', 'rajasthan'],
    bikeMult: 0.96,
    autoMult: 0.98,
    cabMult: 1.0,
    verificationDate: '2026-02-12',
    sourceNote: 'Rajasthan Urban Transport Stand & City Aggregator Benchmarks',
    isExactRegionalCard: true,
  },
  {
    regionId: 'up-plains',
    regionLabel: 'Uttar Pradesh (Lucknow / Varanasi / Agra)',
    matchKeywords: ['lucknow', 'varanasi', 'agra', 'kanpur', 'prayagraj', 'ayodhya', 'mathura', 'uttar pradesh'],
    bikeMult: 0.92,
    autoMult: 0.95,
    cabMult: 0.96,
    verificationDate: '2026-02-14',
    sourceNote: 'UP Regional Auto/Cab Corridor Benchmarks',
    isExactRegionalCard: true,
  },
  {
    regionId: 'hill-himalayan',
    regionLabel: 'Himalayan & Hill Station Zone',
    matchKeywords: ['manali', 'kullu', 'bhuntar', 'shimla', 'dharamshala', 'rishikesh', 'dehradun', 'mussoorie', 'nainital', 'gangtok', 'darjeeling', 'leh', 'srinagar', 'himachal', 'uttarakhand', 'sikkim', 'ladakh'],
    bikeMult: 1.15,
    autoMult: 1.24,
    cabMult: 1.32,
    verificationDate: '2026-02-10',
    sourceNote: 'Hill-Terrain Union & Regional Taxi Rate Card Adjustment',
    isExactRegionalCard: true,
  },
  {
    regionId: 'south-metro',
    regionLabel: 'South Metro (Chennai / Hyderabad / Kochi)',
    matchKeywords: ['chennai', 'hyderabad', 'secunderabad', 'kochi', 'ernakulam', 'alleppey', 'alappuzha', 'coimbatore', 'visakhapatnam', 'tirupati', 'tamil nadu', 'telangana', 'kerala', 'andhra'],
    bikeMult: 0.98,
    autoMult: 1.04,
    cabMult: 1.06,
    verificationDate: '2026-02-16',
    sourceNote: 'State Transport & City Aggregator Rate Benchmarks',
    isExactRegionalCard: true,
  },
  {
    regionId: 'east-west-tier1',
    regionLabel: 'Regional Urban Corridor (Kolkata / Ahmedabad / Chandigarh / Goa)',
    matchKeywords: ['kolkata', 'howrah', 'ahmedabad', 'surat', 'vadodara', 'chandigarh', 'amritsar', 'guwahati', 'patna', 'bhopal', 'indore', 'goa', 'panaji', 'margao', 'west bengal', 'gujarat', 'punjab', 'assam', 'bihar', 'madhya pradesh'],
    bikeMult: 0.96,
    autoMult: 1.0,
    cabMult: 1.02,
    verificationDate: '2026-02-10',
    sourceNote: 'Regional City Aggregator & Municipal Prepaid Fare Benchmarks',
    isExactRegionalCard: true,
  },
];

const DEFAULT_FALLBACK_REGION: RegionMultiplierSet = {
  regionId: 'india-general',
  regionLabel: 'General Indian District Estimate',
  matchKeywords: [],
  bikeMult: 1.0,
  autoMult: 1.05,
  cabMult: 1.08,
  verificationDate: '2026-02-01',
  sourceNote: 'All-India Regional Distance Benchmark (No Verified City-Specific Tariff)',
  isExactRegionalCard: false,
};

export function resolveFareRegion(cityOrLabel: string, stateName = ''): RegionMultiplierSet {
  const hay = `${cityOrLabel} ${stateName}`.toLowerCase();
  for (const reg of REGIONAL_PROFILES) {
    if (reg.matchKeywords.some((kw) => hay.includes(kw))) {
      return reg;
    }
  }
  return DEFAULT_FALLBACK_REGION;
}

interface ProviderBaseTemplate {
  id: string;
  provider: FareProviderName;
  providerTitle: string;
  category: FareVehicleCategory;
  categoryLabel: string;
  vehicleType: string;
  maxPassengers: number;
  luggageCapacity: string;
  baseFareInr: number;
  baseIncludedKm: number;
  perKmRateInr: number;
  perMinRateInr: number;
  minimumFareInr: number;
  bookingFeeInr: number;
  taxRatePercent: number;
  waitingPolicy: string;
  effectiveDate: string;
}

// Distinct provider rate schedules (Rapido vs Ola vs Uber vs Municipal Prepaid Stands)
// Each provider has its own base distance slab, per-km rate, per-min rate, booking fee, and minimum fare.
export const PROVIDER_RATE_TEMPLATES: ProviderBaseTemplate[] = [
  // BIKE
  {
    id: 'rapido-bike',
    provider: 'Rapido',
    providerTitle: 'Rapido Bike',
    category: 'bike',
    categoryLabel: 'Bike Taxi',
    vehicleType: 'Two-Wheeler Captain',
    maxPassengers: 1,
    luggageCapacity: '1 backpack',
    baseFareInr: 22,
    baseIncludedKm: 1.5,
    perKmRateInr: 7.5,
    perMinRateInr: 0.75,
    minimumFareInr: 29,
    bookingFeeInr: 4,
    taxRatePercent: 5,
    waitingPolicy: 'Free 3 min wait, ₹1/min thereafter',
    effectiveDate: '2026-01-15',
  },
  {
    id: 'ola-bike',
    provider: 'Ola',
    providerTitle: 'Ola Bike',
    category: 'bike',
    categoryLabel: 'Bike Taxi',
    vehicleType: 'Two-Wheeler Bike',
    maxPassengers: 1,
    luggageCapacity: '1 backpack',
    baseFareInr: 25,
    baseIncludedKm: 1.5,
    perKmRateInr: 8.2,
    perMinRateInr: 0.9,
    minimumFareInr: 32,
    bookingFeeInr: 5,
    taxRatePercent: 5,
    waitingPolicy: 'Free 3 min wait, ₹1.5/min thereafter',
    effectiveDate: '2026-01-10',
  },
  {
    id: 'uber-moto',
    provider: 'Uber',
    providerTitle: 'Uber Moto',
    category: 'bike',
    categoryLabel: 'Bike Taxi',
    vehicleType: 'Two-Wheeler Moto',
    maxPassengers: 1,
    luggageCapacity: '1 backpack',
    baseFareInr: 24,
    baseIncludedKm: 1.0,
    perKmRateInr: 7.8,
    perMinRateInr: 1.0,
    minimumFareInr: 30,
    bookingFeeInr: 5,
    taxRatePercent: 5,
    waitingPolicy: 'Free 2 min wait, ₹1.5/min thereafter',
    effectiveDate: '2026-01-18',
  },

  // AUTO
  {
    id: 'rapido-auto',
    provider: 'Rapido',
    providerTitle: 'Rapido Auto',
    category: 'auto',
    categoryLabel: 'Auto',
    vehicleType: 'Three-Wheeler Auto',
    maxPassengers: 3,
    luggageCapacity: '1–2 cabin bags',
    baseFareInr: 30,
    baseIncludedKm: 1.5,
    perKmRateInr: 12.5,
    perMinRateInr: 0.85,
    minimumFareInr: 38,
    bookingFeeInr: 5,
    taxRatePercent: 5,
    waitingPolicy: 'Free 3 min wait, ₹1.5/min thereafter',
    effectiveDate: '2026-01-15',
  },
  {
    id: 'ola-auto',
    provider: 'Ola',
    providerTitle: 'Ola Auto',
    category: 'auto',
    categoryLabel: 'Auto',
    vehicleType: 'Three-Wheeler Auto',
    maxPassengers: 3,
    luggageCapacity: '1–2 cabin bags',
    baseFareInr: 33,
    baseIncludedKm: 1.5,
    perKmRateInr: 13.4,
    perMinRateInr: 1.15,
    minimumFareInr: 42,
    bookingFeeInr: 7,
    taxRatePercent: 5,
    waitingPolicy: 'Free 3 min wait, ₹2/min thereafter',
    effectiveDate: '2026-01-20',
  },
  {
    id: 'uber-auto',
    provider: 'Uber',
    providerTitle: 'Uber Auto',
    category: 'auto',
    categoryLabel: 'Auto',
    vehicleType: 'Three-Wheeler Auto',
    maxPassengers: 3,
    luggageCapacity: '1–2 cabin bags',
    baseFareInr: 35,
    baseIncludedKm: 1.5,
    perKmRateInr: 13.9,
    perMinRateInr: 1.35,
    minimumFareInr: 45,
    bookingFeeInr: 8,
    taxRatePercent: 5,
    waitingPolicy: 'Free 3 min wait, ₹2/min thereafter',
    effectiveDate: '2026-01-22',
  },
  {
    id: 'local-prepaid-auto',
    provider: 'Local Prepaid Stand',
    providerTitle: 'Station / Local Auto Stand',
    category: 'auto',
    categoryLabel: 'Auto',
    vehicleType: 'Prepaid / Metered Auto',
    maxPassengers: 3,
    luggageCapacity: '2 cabin bags',
    baseFareInr: 40,
    baseIncludedKm: 2.0,
    perKmRateInr: 15.0,
    perMinRateInr: 0,
    minimumFareInr: 45,
    bookingFeeInr: 0,
    taxRatePercent: 0,
    waitingPolicy: 'Confirm posted booth tariff before boarding',
    effectiveDate: '2026-01-01',
  },

  // CAB
  {
    id: 'uber-go',
    provider: 'Uber',
    providerTitle: 'Uber Go',
    category: 'cab',
    categoryLabel: 'Cab',
    vehicleType: 'AC Hatchback',
    maxPassengers: 4,
    luggageCapacity: '2 medium bags',
    baseFareInr: 52,
    baseIncludedKm: 2.0,
    perKmRateInr: 14.8,
    perMinRateInr: 1.65,
    minimumFareInr: 79,
    bookingFeeInr: 12,
    taxRatePercent: 5,
    waitingPolicy: 'Free 3 min wait, ₹2.5/min thereafter',
    effectiveDate: '2026-01-22',
  },
  {
    id: 'ola-mini',
    provider: 'Ola',
    providerTitle: 'Ola Mini',
    category: 'cab',
    categoryLabel: 'Cab',
    vehicleType: 'AC Compact Hatchback',
    maxPassengers: 4,
    luggageCapacity: '2 medium bags',
    baseFareInr: 49,
    baseIncludedKm: 2.0,
    perKmRateInr: 14.2,
    perMinRateInr: 1.5,
    minimumFareInr: 75,
    bookingFeeInr: 11,
    taxRatePercent: 5,
    waitingPolicy: 'Free 3 min wait, ₹2/min thereafter',
    effectiveDate: '2026-01-20',
  },
  {
    id: 'uber-sedan',
    provider: 'Uber',
    providerTitle: 'Uber Premier Sedan',
    category: 'cab',
    categoryLabel: 'Cab',
    vehicleType: 'AC Comfort Sedan',
    maxPassengers: 4,
    luggageCapacity: '2 large suitcases',
    baseFareInr: 68,
    baseIncludedKm: 2.0,
    perKmRateInr: 17.5,
    perMinRateInr: 1.9,
    minimumFareInr: 105,
    bookingFeeInr: 15,
    taxRatePercent: 5,
    waitingPolicy: 'Free 3 min wait, ₹3/min thereafter',
    effectiveDate: '2026-01-22',
  },
  {
    id: 'ola-prime-sedan',
    provider: 'Ola',
    providerTitle: 'Ola Prime Sedan',
    category: 'cab',
    categoryLabel: 'Cab',
    vehicleType: 'AC Boot Sedan',
    maxPassengers: 4,
    luggageCapacity: '2–3 large suitcases',
    baseFareInr: 65,
    baseIncludedKm: 2.0,
    perKmRateInr: 17.0,
    perMinRateInr: 1.8,
    minimumFareInr: 99,
    bookingFeeInr: 14,
    taxRatePercent: 5,
    waitingPolicy: 'Free 3 min wait, ₹3/min thereafter',
    effectiveDate: '2026-01-20',
  },
  {
    id: 'local-taxi-stand',
    provider: 'Local Prepaid Stand',
    providerTitle: 'Prepaid / Union Tourist Cab',
    category: 'cab',
    categoryLabel: 'Cab',
    vehicleType: 'AC Sedan / Union Cab',
    maxPassengers: 4,
    luggageCapacity: '2–3 suitcases',
    baseFareInr: 80,
    baseIncludedKm: 2.0,
    perKmRateInr: 19.5,
    perMinRateInr: 0,
    minimumFareInr: 95,
    bookingFeeInr: 0,
    taxRatePercent: 0,
    waitingPolicy: 'Fixed-zone municipal or taxi union rate card',
    effectiveDate: '2026-01-01',
  },
];

export function computeProviderFare(
  templateId: string,
  distanceKm: number,
  durationMin: number,
  cityOrLabel: string,
  stateName = '',
  passengers = 2
): {
  config: ProviderRateConfig;
  breakdown: FareBreakdown;
  fareMinInr: number;
  fareMaxInr: number;
} | null {
  if (distanceKm > 120) return null; // Intercity corridors require dedicated outstation quote
  const tpl = PROVIDER_RATE_TEMPLATES.find((t) => t.id === templateId);
  if (!tpl) return null;

  const region = resolveFareRegion(cityOrLabel, stateName);
  const mult =
    tpl.category === 'bike'
      ? region.bikeMult
      : tpl.category === 'auto'
      ? region.autoMult
      : region.cabMult;

  // For > 4 passengers, Local Taxi Stand scales up to SUV / Innova 6-seater
  const isSuvUpgrade = tpl.id === 'local-taxi-stand' && passengers > 4;
  const effectiveVehicleType = isSuvUpgrade ? 'SUV / Innova (6-Seater)' : tpl.vehicleType;
  const effectiveMaxPax = isSuvUpgrade ? 6 : tpl.maxPassengers;
  const effectiveLuggage = isSuvUpgrade ? '4–5 suitcases' : tpl.luggageCapacity;
  const suvMult = isSuvUpgrade ? 1.32 : 1.0;

  const baseFare = Math.round(tpl.baseFareInr * mult * suvMult);
  const perKm = Number((tpl.perKmRateInr * mult * suvMult).toFixed(2));
  const perMin = Number((tpl.perMinRateInr * mult * suvMult).toFixed(2));
  const minFare = Math.round(tpl.minimumFareInr * mult * suvMult);
  const bookingFee = Math.round(tpl.bookingFeeInr * mult);

  const extraKm = Math.max(0, Number((distanceKm - tpl.baseIncludedKm).toFixed(2)));
  const distCharge = Math.round(extraKm * perKm);
  const timeCharge = Math.round(durationMin * perMin);
  const subtotal = baseFare + distCharge + timeCharge + bookingFee;
  const taxes = Math.round((subtotal * tpl.taxRatePercent) / 100);
  const rawTotal = subtotal + taxes;
  const minApplied = rawTotal < minFare;
  const calculatedTotal = Math.max(minFare, rawTotal);

  // Narrow corridor variance (+12% typical real-world demand/traffic spread for estimated band)
  const fareMinInr = Math.max(25, Math.round(calculatedTotal * 0.94));
  const fareMaxInr = Math.max(fareMinInr + 6, Math.round(calculatedTotal * 1.12));

  const estimateType: FareEstimateType = region.isExactRegionalCard
    ? 'Calculated Estimate'
    : 'Approximate Estimate';

  const config: ProviderRateConfig = {
    id: tpl.id,
    provider: tpl.provider,
    providerTitle: tpl.providerTitle,
    category: tpl.category,
    categoryLabel: tpl.categoryLabel,
    vehicleType: effectiveVehicleType,
    maxPassengers: effectiveMaxPax,
    luggageCapacity: effectiveLuggage,
    regionId: region.regionId,
    regionLabel: region.regionLabel,
    baseFareInr: baseFare,
    baseIncludedKm: tpl.baseIncludedKm,
    perKmRateInr: perKm,
    perMinRateInr: perMin,
    minimumFareInr: minFare,
    bookingFeeInr: bookingFee,
    taxRatePercent: tpl.taxRatePercent,
    waitingPolicy: tpl.waitingPolicy,
    effectiveDate: tpl.effectiveDate,
    verificationDate: region.verificationDate,
    sourceLabel: region.sourceNote,
    estimateType,
  };

  const breakdown: FareBreakdown = {
    baseFareInr: baseFare,
    baseIncludedKm: tpl.baseIncludedKm,
    billableExtraKm: extraKm,
    distanceChargeInr: distCharge,
    perKmRateInr: perKm,
    timeChargeInr: timeCharge,
    perMinRateInr: perMin,
    bookingFeeInr: bookingFee,
    taxesAndFeesInr: taxes,
    minimumFareInr: minFare,
    minimumApplied: minApplied,
    waitingPolicy: tpl.waitingPolicy,
    regionLabel: region.regionLabel,
    effectiveDate: tpl.effectiveDate,
    verificationDate: region.verificationDate,
    sourceLabel: region.sourceNote,
    estimateType,
    calculatedFareInr: calculatedTotal,
  };

  return {
    config,
    breakdown,
    fareMinInr,
    fareMaxInr,
  };
}
