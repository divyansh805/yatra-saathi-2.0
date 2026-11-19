// Transparent Configurable Local Tariff & Estimate Engine for Smart Local Hop

export type FareVehicleCategory = 'bike' | 'auto' | 'cab';
export type FareProviderName = 'Rapido' | 'Ola' | 'Uber' | 'Local Prepaid Stand';

export type FareEstimateType =
  | 'Verified Local Tariff'
  | 'Calculated Indicative Estimate'
  | 'Approximate Estimate'
  | 'Fare Information Unavailable';

export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

export interface CityTariffProfile {
  regionId: string;
  regionLabel: string;
  matchKeywords: string[];
  hasVerifiedCityBenchmark: boolean;
  confidenceLevel: ConfidenceLevel;
  effectiveDate: string;
  verificationDate: string;
  source: string;
  nightChargeNote: string | null;
  categories: {
    auto: {
      available: boolean;
      label: string;
      baseFareInr: number;
      includedDistanceKm: number;
      perKmRateInr: number;
      perMinRateInr: number;
      minimumFareInr: number;
      waitingCharges: string;
      nightCharges: string | null;
      capacityNote: string;
    };
    cab: {
      available: boolean;
      label: string;
      baseFareInr: number;
      includedDistanceKm: number;
      perKmRateInr: number;
      perMinRateInr: number;
      minimumFareInr: number;
      waitingCharges: string;
      nightCharges: string | null;
      capacityNote: string;
    };
    bike: {
      available: boolean;
      label: string;
      baseFareInr: number;
      includedDistanceKm: number;
      perKmRateInr: number;
      perMinRateInr: number;
      minimumFareInr: number;
      waitingCharges: string;
      nightCharges: string | null;
      capacityNote: string;
    };
  };
}

export interface SmartHopFareOption {
  category: FareVehicleCategory;
  categoryTitle: string;
  available: boolean;
  label: FareEstimateType;
  confidenceLevel: ConfidenceLevel;
  fareMinInr: number | null;
  fareMaxInr: number | null;
  indicativeMidInr: number | null;
  capacityNote: string;
  calculationExplanation: string;
  breakdown: {
    baseFareInr: number;
    includedDistanceKm: number;
    billableExtraKm: number;
    perKmRateInr: number;
    perMinRateInr: number;
    distanceComponentInr: number;
    timeComponentInr: number;
    minimumFareInr: number;
    minimumApplied: boolean;
    waitingCharges: string;
    nightCharges: string;
  } | null;
  metadata: {
    regionLabel: string;
    effectiveDate: string;
    verificationDate: string;
    source: string;
  };
  unavailableReason?: string;
}

const CITY_TARIFF_PROFILES: CityTariffProfile[] = [
  {
    regionId: 'odisha-puri-bbs',
    regionLabel: 'Odisha (Puri – Bhubaneswar Corridor)',
    matchKeywords: ['puri', 'konark', 'bhubaneswar', 'cuttack', 'chilika', 'odisha'],
    hasVerifiedCityBenchmark: true,
    confidenceLevel: 'Medium',
    effectiveDate: '2026-01-15',
    verificationDate: '2026-02-15',
    source: 'Odisha STA Auto/Taxi Stand Reference & Regional Distance Rate Model',
    nightChargeNote: 'Late-night rates after 11 PM are often negotiated — confirm at prepaid booth.',
    categories: {
      auto: {
        available: true,
        label: 'Auto / E-Rickshaw',
        baseFareInr: 40,
        includedDistanceKm: 1.5,
        perKmRateInr: 15,
        perMinRateInr: 0.75,
        minimumFareInr: 40,
        waitingCharges: 'Confirm waiting rate beforehand (typically ₹1–₹2/min after 5 mins)',
        nightCharges: null,
        capacityNote: 'Up to 3 adults + small cabin bags',
      },
      cab: {
        available: true,
        label: 'Cab (Hatchback / Sedan)',
        baseFareInr: 75,
        includedDistanceKm: 2.0,
        perKmRateInr: 17.5,
        perMinRateInr: 1.4,
        minimumFareInr: 90,
        waitingCharges: '₹2–₹3/min after 5 mins',
        nightCharges: null,
        capacityNote: 'Up to 4 adults + trunk luggage',
      },
      bike: {
        available: true,
        label: 'Two-Wheeler / Bike Hop',
        baseFareInr: 22,
        includedDistanceKm: 1.5,
        perKmRateInr: 8,
        perMinRateInr: 0.6,
        minimumFareInr: 28,
        waitingCharges: 'Free 2–3 mins pickup wait',
        nightCharges: null,
        capacityNote: '1 solo rider + backpack only (confirm helmet)',
      },
    },
  },
  {
    regionId: 'jk-katra-jammu',
    regionLabel: 'Jammu & Katra Foothills Sector (J&K)',
    matchKeywords: ['katra', 'vaishno devi', 'banganga', 'tarakote', 'jammu', 'svdk', 'jammu and kashmir'],
    hasVerifiedCityBenchmark: true,
    confidenceLevel: 'Medium',
    effectiveDate: '2026-01-10',
    verificationDate: '2026-02-14',
    source: 'Katra / Jammu Local Stand & Foothill Distance Benchmark',
    nightChargeNote: 'Early dawn & late night drops around Katra are subject to stand schedule.',
    categories: {
      auto: {
        available: true,
        label: 'Auto / Local Shuttle',
        baseFareInr: 50,
        includedDistanceKm: 1.5,
        perKmRateInr: 17,
        perMinRateInr: 0.8,
        minimumFareInr: 50,
        waitingCharges: 'Confirm waiting time upfront near Banganga gate',
        nightCharges: null,
        capacityNote: 'Up to 3 adults (drops at Banganga / Tarakote vehicle point)',
      },
      cab: {
        available: true,
        label: 'Cab / Foothill Taxi',
        baseFareInr: 95,
        includedDistanceKm: 2.0,
        perKmRateInr: 19.5,
        perMinRateInr: 1.5,
        minimumFareInr: 110,
        waitingCharges: 'Fixed point-to-point stand cards at SVDK / Jammu Tawi',
        nightCharges: null,
        capacityNote: 'Up to 4 adults (larger SUVs available for hill sector)',
      },
      bike: {
        available: false,
        label: 'Two-Wheeler / Bike Hop',
        baseFareInr: 0,
        includedDistanceKm: 0,
        perKmRateInr: 0,
        perMinRateInr: 0,
        minimumFareInr: 0,
        waitingCharges: 'App bike taxis have limited or no local stand availability in Katra hills',
        nightCharges: null,
        capacityNote: 'Not reliably available on Katra hill roads — use Station/Bus auto or taxi stand',
      },
    },
  },
  {
    regionId: 'up-varanasi-lko-agra',
    regionLabel: 'Uttar Pradesh (Varanasi / Lucknow / Agra)',
    matchKeywords: ['varanasi', 'kashi', 'lucknow', 'agra', 'prayagraj', 'ayodhya', 'mathura', 'uttar pradesh'],
    hasVerifiedCityBenchmark: true,
    confidenceLevel: 'Medium',
    effectiveDate: '2026-01-15',
    verificationDate: '2026-02-14',
    source: 'UP Urban Auto / E-Rickshaw & City Taxi Reference Model',
    nightChargeNote: null,
    categories: {
      auto: {
        available: true,
        label: 'Auto / E-Rickshaw',
        baseFareInr: 32,
        includedDistanceKm: 1.5,
        perKmRateInr: 13.5,
        perMinRateInr: 0.75,
        minimumFareInr: 35,
        waitingCharges: 'Confirm wait rules before entering ghat approach zones',
        nightCharges: null,
        capacityNote: 'Up to 3 adults (old-city barricades may require final short walk)',
      },
      cab: {
        available: true,
        label: 'Cab (Hatchback / Sedan)',
        baseFareInr: 62,
        includedDistanceKm: 2.0,
        perKmRateInr: 15.5,
        perMinRateInr: 1.4,
        minimumFareInr: 80,
        waitingCharges: '₹2/min after 3–5 mins',
        nightCharges: null,
        capacityNote: 'Up to 4 adults + luggage',
      },
      bike: {
        available: true,
        label: 'Two-Wheeler / Bike Hop',
        baseFareInr: 22,
        includedDistanceKm: 1.5,
        perKmRateInr: 7.5,
        perMinRateInr: 0.7,
        minimumFareInr: 28,
        waitingCharges: 'Free 2–3 mins pickup wait',
        nightCharges: null,
        capacityNote: '1 solo rider + small backpack (helpful near narrow bazaars)',
      },
    },
  },
  {
    regionId: 'rajasthan-jaipur-udaipur',
    regionLabel: 'Rajasthan (Jaipur / Udaipur / Jodhpur)',
    matchKeywords: ['jaipur', 'udaipur', 'jodhpur', 'bikaner', 'ajmer', 'kota', 'amber', 'rajasthan'],
    hasVerifiedCityBenchmark: true,
    confidenceLevel: 'Medium',
    effectiveDate: '2026-01-12',
    verificationDate: '2026-02-12',
    source: 'Rajasthan Urban Stand & Walled City Transit Rate Benchmarks',
    nightChargeNote: null,
    categories: {
      auto: {
        available: true,
        label: 'Auto / E-Rickshaw',
        baseFareInr: 35,
        includedDistanceKm: 1.5,
        perKmRateInr: 14,
        perMinRateInr: 0.85,
        minimumFareInr: 40,
        waitingCharges: 'Free 3 min wait, ~₹1.5/min thereafter',
        nightCharges: null,
        capacityNote: 'Up to 3 adults · preferred inside Walled City / Old City gates',
      },
      cab: {
        available: true,
        label: 'Cab (Hatchback / Sedan)',
        baseFareInr: 65,
        includedDistanceKm: 2.0,
        perKmRateInr: 16,
        perMinRateInr: 1.5,
        minimumFareInr: 85,
        waitingCharges: '₹2.5/min after 3 mins',
        nightCharges: null,
        capacityNote: 'Up to 4 adults + luggage',
      },
      bike: {
        available: true,
        label: 'Two-Wheeler / Bike Hop',
        baseFareInr: 24,
        includedDistanceKm: 1.5,
        perKmRateInr: 7.8,
        perMinRateInr: 0.75,
        minimumFareInr: 30,
        waitingCharges: 'Free 2–3 mins pickup wait',
        nightCharges: null,
        capacityNote: '1 solo rider + backpack only',
      },
    },
  },
  {
    regionId: 'delhi-ncr',
    regionLabel: 'Delhi NCR',
    matchKeywords: ['delhi', 'new delhi', 'noida', 'gurugram', 'gurgaon', 'faridabad', 'ghaziabad'],
    hasVerifiedCityBenchmark: true,
    confidenceLevel: 'High',
    effectiveDate: '2026-01-20',
    verificationDate: '2026-02-20',
    source: 'Delhi Transport Dept Notified Meter Card & NCR City Tariff Model',
    nightChargeNote: 'Delhi official meter night surcharge (+25% between 11 PM and 5 AM).',
    categories: {
      auto: {
        available: true,
        label: 'Metered Auto-Rickshaw',
        baseFareInr: 30,
        includedDistanceKm: 1.5,
        perKmRateInr: 11,
        perMinRateInr: 0.75,
        minimumFareInr: 30,
        waitingCharges: '₹0.75/min waiting on traffic/meter',
        nightCharges: '+25% between 11:00 PM and 5:00 AM on notified meter trips',
        capacityNote: 'Up to 3 adults + small luggage',
      },
      cab: {
        available: true,
        label: 'Cab (AC Hatchback / Sedan)',
        baseFareInr: 68,
        includedDistanceKm: 2.0,
        perKmRateInr: 16.5,
        perMinRateInr: 1.65,
        minimumFareInr: 85,
        waitingCharges: '₹2–₹3/min after 3 mins',
        nightCharges: 'Peak/late-night dynamic rates vary by corridor',
        capacityNote: 'Up to 4 adults + trunk bags',
      },
      bike: {
        available: true,
        label: 'Two-Wheeler / Bike Hop',
        baseFareInr: 22,
        includedDistanceKm: 1.5,
        perKmRateInr: 7.5,
        perMinRateInr: 0.8,
        minimumFareInr: 28,
        waitingCharges: 'Free 3 min pickup wait',
        nightCharges: null,
        capacityNote: '1 solo rider + backpack',
      },
    },
  },
  {
    regionId: 'maharashtra-metro',
    regionLabel: 'Maharashtra (Mumbai / Pune)',
    matchKeywords: ['mumbai', 'thane', 'navi mumbai', 'pune', 'nagpur', 'shirdi', 'maharashtra'],
    hasVerifiedCityBenchmark: true,
    confidenceLevel: 'High',
    effectiveDate: '2026-01-18',
    verificationDate: '2026-02-18',
    source: 'MMRTA / Pune RTA Meter Tariff Structure & City Benchmarks',
    nightChargeNote: 'MMRTA / Pune RTA night tariff (+25% between 12 AM and 5 AM).',
    categories: {
      auto: {
        available: true,
        label: 'Metered Auto-Rickshaw',
        baseFareInr: 26,
        includedDistanceKm: 1.5,
        perKmRateInr: 17.14,
        perMinRateInr: 0.6,
        minimumFareInr: 26,
        waitingCharges: 'Notified meter waiting pulse',
        nightCharges: '+25% midnight to 5:00 AM',
        capacityNote: 'Up to 3 adults (note: South Mumbai restricts autos)',
      },
      cab: {
        available: true,
        label: 'Cab (Kaali-Peeli / AC Cab)',
        baseFareInr: 55,
        includedDistanceKm: 1.5,
        perKmRateInr: 20.66,
        perMinRateInr: 1.5,
        minimumFareInr: 55,
        waitingCharges: 'Meter / app wait timer applies',
        nightCharges: '+25% midnight to 5:00 AM on metered taxis',
        capacityNote: 'Up to 4 adults + luggage',
      },
      bike: {
        available: false,
        label: 'Two-Wheeler / Bike Hop',
        baseFareInr: 0,
        includedDistanceKm: 0,
        perKmRateInr: 0,
        perMinRateInr: 0,
        minimumFareInr: 0,
        waitingCharges: 'Commercial bike-taxi rules vary — verify local availability',
        nightCharges: null,
        capacityNote: 'Check local availability before relying on bike taxis',
      },
    },
  },
  {
    regionId: 'karnataka-metro',
    regionLabel: 'Karnataka (Bengaluru / Mysuru / Hampi)',
    matchKeywords: ['bengaluru', 'bangalore', 'mysuru', 'mysore', 'hampi', 'mangaluru', 'karnataka'],
    hasVerifiedCityBenchmark: true,
    confidenceLevel: 'High',
    effectiveDate: '2026-01-18',
    verificationDate: '2026-02-18',
    source: 'Karnataka Transport Dept City Auto/Cab Structure',
    nightChargeNote: '+50% night surcharge between 10 PM and 5 AM on official auto meters.',
    categories: {
      auto: {
        available: true,
        label: 'Auto-Rickshaw',
        baseFareInr: 30,
        includedDistanceKm: 2.0,
        perKmRateInr: 15,
        perMinRateInr: 0.9,
        minimumFareInr: 30,
        waitingCharges: 'Free first 5 mins, nominal wait thereafter',
        nightCharges: '+50% between 10:00 PM and 5:00 AM on official meter',
        capacityNote: 'Up to 3 adults',
      },
      cab: {
        available: true,
        label: 'Cab (Hatchback / Sedan)',
        baseFareInr: 72,
        includedDistanceKm: 2.0,
        perKmRateInr: 18,
        perMinRateInr: 1.75,
        minimumFareInr: 95,
        waitingCharges: '₹2.5/min after 3 mins',
        nightCharges: null,
        capacityNote: 'Up to 4 adults + luggage',
      },
      bike: {
        available: true,
        label: 'Two-Wheeler / Bike Hop',
        baseFareInr: 25,
        includedDistanceKm: 1.5,
        perKmRateInr: 8.5,
        perMinRateInr: 0.8,
        minimumFareInr: 30,
        waitingCharges: 'Free 3 min wait',
        nightCharges: null,
        capacityNote: '1 solo rider + small backpack',
      },
    },
  },
  {
    regionId: 'south-coastal',
    regionLabel: 'South Metro & Coastal (Kerala / Chennai / Hyderabad / Goa)',
    matchKeywords: ['kochi', 'ernakulam', 'alleppey', 'alappuzha', 'varkala', 'kerala', 'chennai', 'hyderabad', 'goa', 'panaji', 'margao', 'tamil nadu', 'telangana'],
    hasVerifiedCityBenchmark: true,
    confidenceLevel: 'Medium',
    effectiveDate: '2026-01-16',
    verificationDate: '2026-02-16',
    source: 'State Transport Auto/Taxi Benchmarks & Coastal Stand Guidelines',
    nightChargeNote: null,
    categories: {
      auto: {
        available: true,
        label: 'Auto-Rickshaw',
        baseFareInr: 32,
        includedDistanceKm: 1.5,
        perKmRateInr: 15,
        perMinRateInr: 0.8,
        minimumFareInr: 35,
        waitingCharges: 'Confirm waiting rule before boarding',
        nightCharges: null,
        capacityNote: 'Up to 3 adults (note: Goa coastal hubs mostly use taxis/pilots)',
      },
      cab: {
        available: true,
        label: 'Cab (Hatchback / Sedan)',
        baseFareInr: 70,
        includedDistanceKm: 2.0,
        perKmRateInr: 17.5,
        perMinRateInr: 1.5,
        minimumFareInr: 90,
        waitingCharges: '₹2–₹3/min after 5 mins',
        nightCharges: null,
        capacityNote: 'Up to 4 adults + bags',
      },
      bike: {
        available: true,
        label: 'Two-Wheeler / Bike Hop',
        baseFareInr: 25,
        includedDistanceKm: 1.5,
        perKmRateInr: 8.5,
        perMinRateInr: 0.75,
        minimumFareInr: 30,
        waitingCharges: 'Confirm helmet availability',
        nightCharges: null,
        capacityNote: '1 solo rider + small pack (in Goa look for local yellow-plate Pilot bikes)',
      },
    },
  },
  {
    regionId: 'hill-stations',
    regionLabel: 'Himalayan & Northeast Hill Sector',
    matchKeywords: ['manali', 'kullu', 'bhuntar', 'shimla', 'dharamshala', 'rishikesh', 'dehradun', 'shillong', 'gangtok', 'darjeeling', 'leh', 'srinagar', 'himachal', 'uttarakhand', 'meghalaya', 'sikkim', 'ladakh'],
    hasVerifiedCityBenchmark: true,
    confidenceLevel: 'Medium',
    effectiveDate: '2026-01-10',
    verificationDate: '2026-02-10',
    source: 'Hill Union Stand Rate Adjustment & Mountain Terrain Distance Model',
    nightChargeNote: 'Hill transport often stops or shifts to union contract rates after sunset.',
    categories: {
      auto: {
        available: true,
        label: 'Auto / Shared Vikram',
        baseFareInr: 45,
        includedDistanceKm: 1.5,
        perKmRateInr: 18,
        perMinRateInr: 0.9,
        minimumFareInr: 50,
        waitingCharges: 'Agree point-to-point union tariff before departure',
        nightCharges: null,
        capacityNote: 'Up to 3 adults (not present in steep upper Manali/Leh sectors — check cab)',
      },
      cab: {
        available: true,
        label: 'Union Taxi / Cab',
        baseFareInr: 100,
        includedDistanceKm: 2.0,
        perKmRateInr: 22,
        perMinRateInr: 1.6,
        minimumFareInr: 120,
        waitingCharges: 'Union rate cards apply for hill gradients',
        nightCharges: null,
        capacityNote: 'Up to 4 adults (SUVs recommended on high passes)',
      },
      bike: {
        available: false,
        label: 'Two-Wheeler / Bike Hop',
        baseFareInr: 0,
        includedDistanceKm: 0,
        perKmRateInr: 0,
        perMinRateInr: 0,
        minimumFareInr: 0,
        waitingCharges: 'Commercial bike-taxi apps generally unavailable in steep hill sectors',
        nightCharges: null,
        capacityNote: 'Use registered taxi unions or local shared jeeps',
      },
    },
  },
];

const GENERAL_FALLBACK_PROFILE: CityTariffProfile = {
  regionId: 'india-general',
  regionLabel: 'All-India General District Estimate',
  matchKeywords: [],
  hasVerifiedCityBenchmark: false,
  confidenceLevel: 'Low',
  effectiveDate: '2026-01-01',
  verificationDate: '2026-02-01',
  source: 'All-India General Distance Indicative Formula (No Verified City Tariff on File)',
  nightChargeNote: null,
  categories: {
    auto: {
      available: true,
      label: 'Auto / E-Rickshaw',
      baseFareInr: 35,
      includedDistanceKm: 1.5,
      perKmRateInr: 15,
      perMinRateInr: 0.85,
      minimumFareInr: 40,
      waitingCharges: 'Confirm waiting terms with driver before boarding',
      nightCharges: null,
      capacityNote: 'Up to 3 adults',
    },
    cab: {
      available: true,
      label: 'Cab (Hatchback / Sedan)',
      baseFareInr: 70,
      includedDistanceKm: 2.0,
      perKmRateInr: 17.5,
      perMinRateInr: 1.5,
      minimumFareInr: 90,
      waitingCharges: 'Confirm waiting terms beforehand',
      nightCharges: null,
      capacityNote: 'Up to 4 adults + bags',
    },
    bike: {
      available: true,
      label: 'Two-Wheeler / Bike Hop',
      baseFareInr: 24,
      includedDistanceKm: 1.5,
      perKmRateInr: 8.5,
      perMinRateInr: 0.75,
      minimumFareInr: 30,
      waitingCharges: 'Subject to city availability',
      nightCharges: null,
      capacityNote: '1 solo rider + small backpack',
    },
  },
};

export function resolveCityTariffProfile(cityOrLabel: string, stateName = ''): CityTariffProfile {
  const hay = `${cityOrLabel} ${stateName}`.toLowerCase();
  for (const profile of CITY_TARIFF_PROFILES) {
    if (profile.matchKeywords.some((kw) => hay.includes(kw))) {
      return profile;
    }
  }
  return GENERAL_FALLBACK_PROFILE;
}

export function computeSmartLocalHopFares(params: {
  distanceKm: number | null;
  durationMin: number | null;
  cityOrLabel: string;
  stateName?: string;
}): {
  profile: CityTariffProfile;
  options: SmartHopFareOption[];
} {
  const { distanceKm, durationMin, cityOrLabel, stateName = '' } = params;
  const profile = resolveCityTariffProfile(cityOrLabel, stateName);
  const categories: FareVehicleCategory[] = ['auto', 'cab', 'bike'];

  if (distanceKm === null || durationMin === null || !Number.isFinite(distanceKm) || distanceKm < 0) {
    return {
      profile,
      options: categories.map((cat) => {
        const cfg = profile.categories[cat];
        return {
          category: cat,
          categoryTitle: cfg.label,
          available: false,
          label: 'Fare Information Unavailable',
          confidenceLevel: 'Low',
          fareMinInr: null,
          fareMaxInr: null,
          indicativeMidInr: null,
          capacityNote: cfg.capacityNote,
          calculationExplanation: 'Road distance and duration could not be verified for this journey.',
          breakdown: null,
          metadata: {
            regionLabel: profile.regionLabel,
            effectiveDate: profile.effectiveDate,
            verificationDate: profile.verificationDate,
            source: profile.source,
          },
          unavailableReason: 'Road routing distance is unavailable; fare is withheld rather than invented.',
        };
      }),
    };
  }

  const isIntercityLongDistance = distanceKm > 120;

  const options: SmartHopFareOption[] = categories.map((cat) => {
    const cfg = profile.categories[cat];

    if (isIntercityLongDistance) {
      return {
        category: cat,
        categoryTitle: cfg.label,
        available: false,
        label: 'Fare Information Unavailable',
        confidenceLevel: 'Low',
        fareMinInr: null,
        fareMaxInr: null,
        indicativeMidInr: null,
        capacityNote: cfg.capacityNote,
        calculationExplanation: `Distance (${distanceKm} km) exceeds typical local-hop coverage (≤120 km). Outstation round-trip or intercity tariffs differ.`,
        breakdown: null,
        metadata: {
          regionLabel: profile.regionLabel,
          effectiveDate: profile.effectiveDate,
          verificationDate: profile.verificationDate,
          source: profile.source,
        },
        unavailableReason: 'Long intercity corridor (>120 km) — check outstation taxi counter instead of local hop.',
      };
    }

    if (!cfg.available || (cat === 'bike' && distanceKm > 35) || (cat === 'auto' && distanceKm > 60)) {
      const reason = !cfg.available
        ? cfg.capacityNote
        : `${cfg.label} hops typically serve routes under ${cat === 'bike' ? 35 : 60} km.`;
      return {
        category: cat,
        categoryTitle: cfg.label,
        available: false,
        label: 'Fare Information Unavailable',
        confidenceLevel: 'Low',
        fareMinInr: null,
        fareMaxInr: null,
        indicativeMidInr: null,
        capacityNote: cfg.capacityNote,
        calculationExplanation: reason,
        breakdown: null,
        metadata: {
          regionLabel: profile.regionLabel,
          effectiveDate: profile.effectiveDate,
          verificationDate: profile.verificationDate,
          source: profile.source,
        },
        unavailableReason: reason,
      };
    }

    const extraKm = Math.max(0, Number((distanceKm - cfg.includedDistanceKm).toFixed(2)));
    const distanceComponent = Math.round(extraKm * cfg.perKmRateInr);
    const timeComponent = Math.round(durationMin * cfg.perMinRateInr);
    const rawTotal = cfg.baseFareInr + distanceComponent + timeComponent;
    const minimumApplied = rawTotal < cfg.minimumFareInr;
    const indicativeMid = Math.max(cfg.minimumFareInr, rawTotal);

    // Honest realistic street band (+14% peak/traffic margin around mid)
    const fareMinInr = Math.max(cfg.minimumFareInr, Math.round(indicativeMid * 0.92));
    const fareMaxInr = Math.max(fareMinInr + 10, Math.round(indicativeMid * 1.15));

    const label: FareEstimateType =
      profile.confidenceLevel === 'High'
        ? 'Verified Local Tariff'
        : profile.hasVerifiedCityBenchmark
        ? 'Calculated Indicative Estimate'
        : 'Approximate Estimate';

    const explanation = `Base ₹${cfg.baseFareInr} (includes ${cfg.includedDistanceKm} km) + ${extraKm.toFixed(
      1
    )} extra km × ₹${cfg.perKmRateInr}/km + ${durationMin} min × ₹${cfg.perMinRateInr}/min${
      minimumApplied ? ` (minimum ₹${cfg.minimumFareInr} applied)` : ''
    }.`;

    return {
      category: cat,
      categoryTitle: cfg.label,
      available: true,
      label,
      confidenceLevel: profile.confidenceLevel,
      fareMinInr,
      fareMaxInr,
      indicativeMidInr: indicativeMid,
      capacityNote: cfg.capacityNote,
      calculationExplanation: explanation,
      breakdown: {
        baseFareInr: cfg.baseFareInr,
        includedDistanceKm: cfg.includedDistanceKm,
        billableExtraKm: extraKm,
        perKmRateInr: cfg.perKmRateInr,
        perMinRateInr: cfg.perMinRateInr,
        distanceComponentInr: distanceComponent,
        timeComponentInr: timeComponent,
        minimumFareInr: cfg.minimumFareInr,
        minimumApplied,
        waitingCharges: cfg.waitingCharges,
        nightCharges:
          cfg.nightCharges || 'Night charges not verified for this zone — confirm before late-night rides',
      },
      metadata: {
        regionLabel: profile.regionLabel,
        effectiveDate: profile.effectiveDate,
        verificationDate: profile.verificationDate,
        source: profile.source,
      },
    };
  });

  return { profile, options };
}

// Legacy compatibility interface & wrapper for pre-existing callers
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

export function computeProviderFare(
  templateId: string,
  distanceKm: number,
  durationMin: number,
  cityOrLabel: string,
  stateName = '',
  passengers = 2
) {
  const cat: FareVehicleCategory = templateId.includes('bike') || templateId.includes('moto')
    ? 'bike'
    : templateId.includes('cab') || templateId.includes('sedan') || templateId.includes('mini') || templateId.includes('go') || templateId.includes('taxi')
    ? 'cab'
    : 'auto';

  const { profile, options } = computeSmartLocalHopFares({
    distanceKm,
    durationMin,
    cityOrLabel,
    stateName,
  });
  const opt = options.find((o) => o.category === cat);
  if (!opt || !opt.breakdown || opt.indicativeMidInr === null || opt.fareMinInr === null || opt.fareMaxInr === null) {
    return null;
  }

  return {
    config: {
      id: templateId,
      provider: 'Local Prepaid Stand' as FareProviderName,
      providerTitle: opt.categoryTitle,
      category: cat,
      categoryLabel: opt.categoryTitle,
      vehicleType: opt.categoryTitle,
      maxPassengers: cat === 'bike' ? 1 : cat === 'auto' ? 3 : passengers > 4 ? 6 : 4,
      luggageCapacity: cat === 'bike' ? '1 backpack' : cat === 'auto' ? '2 cabin bags' : '2–3 suitcases',
      regionId: profile.regionId,
      regionLabel: profile.regionLabel,
      baseFareInr: opt.breakdown.baseFareInr,
      baseIncludedKm: opt.breakdown.includedDistanceKm,
      perKmRateInr: opt.breakdown.perKmRateInr,
      perMinRateInr: opt.breakdown.perMinRateInr,
      minimumFareInr: opt.breakdown.minimumFareInr,
      bookingFeeInr: 0,
      taxRatePercent: 0,
      waitingPolicy: opt.breakdown.waitingCharges,
      effectiveDate: opt.metadata.effectiveDate,
      verificationDate: opt.metadata.verificationDate,
      sourceLabel: opt.metadata.source,
      estimateType: opt.label,
    },
    breakdown: {
      baseFareInr: opt.breakdown.baseFareInr,
      baseIncludedKm: opt.breakdown.includedDistanceKm,
      billableExtraKm: opt.breakdown.billableExtraKm,
      distanceChargeInr: opt.breakdown.distanceComponentInr,
      perKmRateInr: opt.breakdown.perKmRateInr,
      timeChargeInr: opt.breakdown.timeComponentInr,
      perMinRateInr: opt.breakdown.perMinRateInr,
      bookingFeeInr: 0,
      taxesAndFeesInr: 0,
      minimumFareInr: opt.breakdown.minimumFareInr,
      minimumApplied: opt.breakdown.minimumApplied,
      waitingPolicy: opt.breakdown.waitingCharges,
      regionLabel: profile.regionLabel,
      effectiveDate: opt.metadata.effectiveDate,
      verificationDate: opt.metadata.verificationDate,
      sourceLabel: opt.metadata.source,
      estimateType: opt.label,
      calculatedFareInr: opt.indicativeMidInr,
    },
    fareMinInr: opt.fareMinInr,
    fareMaxInr: opt.fareMaxInr,
  };
}
