export interface IndianStateUT {
  code: string;
  name: string;
  type: 'State' | 'Union Territory';
  capital: string;
  lat: number;
  lng: number;
}

export type ArrivalKind = 'Railway Station' | 'Bus Stand' | 'Airport' | 'Other Location';

export interface IndianTransitHub {
  id: string;
  name: string;
  stationCode?: string;
  type: 'Railway Station' | 'Bus Stand' | 'Airport';
  city: string;
  state: string;
  lat: number;
  lng: number;
  groundTip?: string;
}

export type CuratedLandmarkCategory =
  | 'Popular Places'
  | 'Temples & Heritage'
  | 'Nature & Beaches'
  | 'Cafe Corner'
  | 'Adventure & Experiences'
  | 'Museums & Culture'
  | 'Hidden Gems';

export interface IndianCuratedLandmark {
  id: string;
  name: string;
  aliases?: string[];
  placeType: string;
  discoverCategory: CuratedLandmarkCategory;
  city: string;
  state: string;
  lat: number;
  lng: number;
  shortDescription: string;
  bestVisitingTime: string;
  groundTip?: string;
  openingHoursText?: string;
  openingHoursVerified?: boolean;
  typicalOpenHour24?: number;
  typicalCloseHour24?: number;
  recommendedWalkMinutes?: number;
  recommendedActivityMinutes?: number;
}

export interface CityCoverageProfile {
  tier: 'metro-full' | 'regional-partial' | 'local-only' | 'unknown';
  cityLabel: string;
  uber: 'Supported' | 'Not Supported' | 'Unknown';
  ola: 'Supported' | 'Not Supported' | 'Unknown';
  rapido: 'Supported' | 'Not Supported' | 'Unknown';
  localAutoNote: string;
  localCabNote: string;
  hasLocalPrepaidStand: boolean;
}

export const INDIA_STATES_AND_UTS: IndianStateUT[] = [
  { code: 'AN', name: 'Andaman and Nicobar Islands', type: 'Union Territory', capital: 'Port Blair', lat: 11.6234, lng: 92.7265 },
  { code: 'AP', name: 'Andhra Pradesh', type: 'State', capital: 'Amaravati', lat: 16.5062, lng: 80.6480 },
  { code: 'AR', name: 'Arunachal Pradesh', type: 'State', capital: 'Itanagar', lat: 27.0844, lng: 93.6053 },
  { code: 'AS', name: 'Assam', type: 'State', capital: 'Dispur', lat: 26.1445, lng: 91.7362 },
  { code: 'BR', name: 'Bihar', type: 'State', capital: 'Patna', lat: 25.5941, lng: 85.1376 },
  { code: 'CH', name: 'Chandigarh', type: 'Union Territory', capital: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
  { code: 'CG', name: 'Chhattisgarh', type: 'State', capital: 'Raipur', lat: 21.2514, lng: 81.6296 },
  { code: 'DN', name: 'Dadra and Nagar Haveli and Daman and Diu', type: 'Union Territory', capital: 'Daman', lat: 20.3974, lng: 72.8328 },
  { code: 'DL', name: 'Delhi', type: 'Union Territory', capital: 'New Delhi', lat: 28.6139, lng: 77.2090 },
  { code: 'GA', name: 'Goa', type: 'State', capital: 'Panaji', lat: 15.4909, lng: 73.8278 },
  { code: 'GJ', name: 'Gujarat', type: 'State', capital: 'Gandhinagar', lat: 23.2156, lng: 72.6369 },
  { code: 'HR', name: 'Haryana', type: 'State', capital: 'Chandigarh', lat: 29.0588, lng: 76.0856 },
  { code: 'HP', name: 'Himachal Pradesh', type: 'State', capital: 'Shimla', lat: 31.1048, lng: 77.1734 },
  { code: 'JK', name: 'Jammu and Kashmir', type: 'Union Territory', capital: 'Srinagar', lat: 34.0837, lng: 74.7973 },
  { code: 'JH', name: 'Jharkhand', type: 'State', capital: 'Ranchi', lat: 23.3441, lng: 85.3096 },
  { code: 'KA', name: 'Karnataka', type: 'State', capital: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
  { code: 'KL', name: 'Kerala', type: 'State', capital: 'Thiruvananthapuram', lat: 8.5241, lng: 76.9366 },
  { code: 'LA', name: 'Ladakh', type: 'Union Territory', capital: 'Leh', lat: 34.1526, lng: 77.5771 },
  { code: 'LD', name: 'Lakshadweep', type: 'Union Territory', capital: 'Kavaratti', lat: 10.5593, lng: 72.6358 },
  { code: 'MP', name: 'Madhya Pradesh', type: 'State', capital: 'Bhopal', lat: 23.2599, lng: 77.4126 },
  { code: 'MH', name: 'Maharashtra', type: 'State', capital: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { code: 'MN', name: 'Manipur', type: 'State', capital: 'Imphal', lat: 24.8170, lng: 93.9368 },
  { code: 'ML', name: 'Meghalaya', type: 'State', capital: 'Shillong', lat: 25.5788, lng: 91.8933 },
  { code: 'MZ', name: 'Mizoram', type: 'State', capital: 'Aizawl', lat: 23.7271, lng: 92.7176 },
  { code: 'NL', name: 'Nagaland', type: 'State', capital: 'Kohima', lat: 25.6751, lng: 94.1086 },
  { code: 'OR', name: 'Odisha', type: 'State', capital: 'Bhubaneswar', lat: 20.2961, lng: 85.8245 },
  { code: 'PY', name: 'Puducherry', type: 'Union Territory', capital: 'Puducherry', lat: 11.9416, lng: 79.8083 },
  { code: 'PB', name: 'Punjab', type: 'State', capital: 'Chandigarh', lat: 31.1471, lng: 75.3412 },
  { code: 'RJ', name: 'Rajasthan', type: 'State', capital: 'Jaipur', lat: 26.9124, lng: 75.7873 },
  { code: 'SK', name: 'Sikkim', type: 'State', capital: 'Gangtok', lat: 27.3314, lng: 88.6138 },
  { code: 'TN', name: 'Tamil Nadu', type: 'State', capital: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { code: 'TG', name: 'Telangana', type: 'State', capital: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
  { code: 'TR', name: 'Tripura', type: 'State', capital: 'Agartala', lat: 23.8315, lng: 91.2868 },
  { code: 'UP', name: 'Uttar Pradesh', type: 'State', capital: 'Lucknow', lat: 26.8467, lng: 80.9462 },
  { code: 'UK', name: 'Uttarakhand', type: 'State', capital: 'Dehradun', lat: 30.3165, lng: 78.0322 },
  { code: 'WB', name: 'West Bengal', type: 'State', capital: 'Kolkata', lat: 22.5726, lng: 88.3639 },
];

// High-precision transit hubs across India with official IRCTC/IATA codes.
// Dynamic Google Places (New) & OpenStreetMap Nominatim supplement this for any town across India.
export const INDIAN_TRANSIT_HUBS: IndianTransitHub[] = [
  // Odisha
  {
    id: 'hub-puri-rail',
    name: 'Puri Railway Station',
    stationCode: 'PURI',
    type: 'Railway Station',
    city: 'Puri',
    state: 'Odisha',
    lat: 19.8077,
    lng: 85.8388,
    groundTip: 'Prepaid auto & e-rickshaw stand sits right outside the main Station Road exit; Grand Road leads straight to Jagannath Temple.',
  },
  {
    id: 'hub-puri-bus',
    name: 'Puri Bus Stand (Gundicha Vihar)',
    stationCode: 'PURI-BUS',
    type: 'Bus Stand',
    city: 'Puri',
    state: 'Odisha',
    lat: 19.8118,
    lng: 85.8442,
    groundTip: 'Inter-city buses from Bhubaneswar & Cuttack terminate near Atharnala / Gundicha; shared autos and cycle-rickshaws wait outside.',
  },
  {
    id: 'hub-bbs-rail',
    name: 'Bhubaneswar Railway Station',
    stationCode: 'BBS',
    type: 'Railway Station',
    city: 'Bhubaneswar',
    state: 'Odisha',
    lat: 20.2665,
    lng: 85.8436,
    groundTip: 'Platform 1 & 6 exits have dedicated Mo Bus stops, prepaid auto booths, and app cab pickup lanes.',
  },
  {
    id: 'hub-bbi-air',
    name: 'Biju Patnaik International Airport, Bhubaneswar',
    stationCode: 'BBI',
    type: 'Airport',
    city: 'Bhubaneswar',
    state: 'Odisha',
    lat: 20.2444,
    lng: 85.8178,
    groundTip: '60 km north of Puri (~1 hr 20 mins via NH316); app cabs and state-run AC buses depart outside Arrivals.',
  },

  // Uttar Pradesh
  {
    id: 'hub-lko-rail',
    name: 'Lucknow Charbagh Railway Station',
    stationCode: 'LKO',
    type: 'Railway Station',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    lat: 26.8318,
    lng: 80.9191,
    groundTip: 'Charbagh Metro station connects directly outside the heritage portico; app cab & auto pickup zones sit past the station forecourt.',
  },
  {
    id: 'hub-lko-air',
    name: 'Chaudhary Charan Singh International Airport, Lucknow',
    stationCode: 'LKO',
    type: 'Airport',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    lat: 26.7606,
    lng: 80.8893,
    groundTip: 'Located in Amausi; Lucknow Metro Red Line connects Terminal 2/3 toward Charbagh & Hazratganj.',
  },
  {
    id: 'hub-lko-bus',
    name: 'Alambagh Inter-State Bus Terminal, Lucknow',
    stationCode: 'LKO-BUS',
    type: 'Bus Stand',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    lat: 26.8141,
    lng: 80.9038,
    groundTip: 'Integrated with Alambagh Metro station and direct cab/auto bays.',
  },
  {
    id: 'hub-vns-rail',
    name: 'Varanasi Junction Railway Station',
    stationCode: 'BSB',
    type: 'Railway Station',
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    lat: 25.3268,
    lng: 82.9866,
    groundTip: 'Old-city Ghat lanes near Dashashwamedh close to four-wheelers; take an auto to Godowlia Chowk and walk the final 500m.',
  },
  {
    id: 'hub-agc-rail',
    name: 'Agra Cantt Railway Station',
    stationCode: 'AGC',
    type: 'Railway Station',
    city: 'Agra',
    state: 'Uttar Pradesh',
    lat: 27.1578,
    lng: 77.9896,
    groundTip: 'Government prepaid taxi & auto booth is right outside Main Gate 1.',
  },

  // Delhi NCR
  {
    id: 'hub-ndls-rail',
    name: 'New Delhi Railway Station',
    stationCode: 'NDLS',
    type: 'Railway Station',
    city: 'New Delhi',
    state: 'Delhi',
    lat: 28.6429,
    lng: 77.2191,
    groundTip: 'Ajmeri Gate side connects directly to Delhi Metro Yellow Line & Airport Express; Paharganj side is crowded for four-wheelers.',
  },
  {
    id: 'hub-del-air',
    name: 'Indira Gandhi International Airport, Delhi',
    stationCode: 'DEL',
    type: 'Airport',
    city: 'New Delhi',
    state: 'Delhi',
    lat: 28.5562,
    lng: 77.1000,
    groundTip: 'Dedicated Uber/Ola pickup zones in Terminal 3 multi-level parking; Airport Express Metro reaches NDLS in 20 mins.',
  },
  {
    id: 'hub-del-bus',
    name: 'Kashmere Gate ISBT, Delhi',
    stationCode: 'DEL-ISBT',
    type: 'Bus Stand',
    city: 'New Delhi',
    state: 'Delhi',
    lat: 28.6675,
    lng: 77.2282,
    groundTip: 'Three-line Delhi Metro interchange directly below the bus terminal.',
  },

  // Rajasthan
  {
    id: 'hub-jp-rail',
    name: 'Jaipur Junction Railway Station',
    stationCode: 'JP',
    type: 'Railway Station',
    city: 'Jaipur',
    state: 'Rajasthan',
    lat: 26.9197,
    lng: 75.7878,
    groundTip: 'Jaipur Metro Pink Line is 350m from Main Exit; Ola/Uber pickup bay is at Gate 2.',
  },
  {
    id: 'hub-jai-air',
    name: 'Jaipur International Airport',
    stationCode: 'JAI',
    type: 'Airport',
    city: 'Jaipur',
    state: 'Rajasthan',
    lat: 26.8242,
    lng: 75.8122,
    groundTip: '12 km south of Walled City; prepaid taxi and app cab bays outside Terminal 2.',
  },
  {
    id: 'hub-jp-bus',
    name: 'Sindhi Camp Central Bus Stand, Jaipur',
    stationCode: 'JP-BUS',
    type: 'Bus Stand',
    city: 'Jaipur',
    state: 'Rajasthan',
    lat: 26.9225,
    lng: 75.7995,
    groundTip: 'Sindhi Camp Metro station stands directly adjacent to the terminal entrance.',
  },
  {
    id: 'hub-udz-rail',
    name: 'Udaipur City Railway Station',
    stationCode: 'UDZ',
    type: 'Railway Station',
    city: 'Udaipur',
    state: 'Rajasthan',
    lat: 24.5686,
    lng: 73.6994,
    groundTip: 'Prepaid auto booth outside Gate 1; Old City ghats restrict cars 9 AM – 8 PM.',
  },
  {
    id: 'hub-udr-air',
    name: 'Maharana Pratap Airport, Udaipur',
    stationCode: 'UDR',
    type: 'Airport',
    city: 'Udaipur',
    state: 'Rajasthan',
    lat: 24.6177,
    lng: 73.8961,
    groundTip: '22 km east at Dabok; prepaid cabs wait outside Arrivals.',
  },

  // Uttarakhand
  {
    id: 'hub-ddn-rail',
    name: 'Dehradun Railway Station',
    stationCode: 'DDN',
    type: 'Railway Station',
    city: 'Dehradun',
    state: 'Uttarakhand',
    lat: 30.3137,
    lng: 78.0332,
    groundTip: 'Located near Clock Tower corridor; Vikram shared autos and prepaid taxis queue at the station exit.',
  },
  {
    id: 'hub-ded-air',
    name: 'Jolly Grant Airport, Dehradun',
    stationCode: 'DED',
    type: 'Airport',
    city: 'Dehradun',
    state: 'Uttarakhand',
    lat: 30.1897,
    lng: 78.1803,
    groundTip: 'Serves both Dehradun (25 km NW) and Rishikesh (21 km SE).',
  },
  {
    id: 'hub-ynrk-rail',
    name: 'Yog Nagari Rishikesh Railway Station',
    stationCode: 'YNRK',
    type: 'Railway Station',
    city: 'Rishikesh',
    state: 'Uttarakhand',
    lat: 30.1016,
    lng: 78.2827,
    groundTip: 'Shared Vikram autos run up Badrinath Highway toward Laxman Jhula & Tapovan.',
  },

  // Himachal Pradesh
  {
    id: 'hub-manali-bus',
    name: 'Manali Volvo & HRTC Bus Stand',
    stationCode: 'MNL-BUS',
    type: 'Bus Stand',
    city: 'Manali',
    state: 'Himachal Pradesh',
    lat: 32.2396,
    lng: 77.1887,
    groundTip: 'App cabs do not operate inside Kullu-Manali; use the Himachal Taxi Union rate-card booth.',
  },
  {
    id: 'hub-kuu-air',
    name: 'Kullu–Manali Airport, Bhuntar',
    stationCode: 'KUU',
    type: 'Airport',
    city: 'Bhuntar',
    state: 'Himachal Pradesh',
    lat: 31.8767,
    lng: 77.1544,
    groundTip: '50 km south of Manali along Beas river.',
  },

  // Maharashtra, Karnataka, Tamil Nadu, Telangana, West Bengal, Kerala, Gujarat, Punjab, Goa, Assam, J&K
  { id: 'hub-csmt-rail', name: 'Chhatrapati Shivaji Maharaj Terminus, Mumbai', stationCode: 'CSMT', type: 'Railway Station', city: 'Mumbai', state: 'Maharashtra', lat: 18.9402, lng: 72.8356 },
  { id: 'hub-bom-air', name: 'Chhatrapati Shivaji Maharaj International Airport, Mumbai', stationCode: 'BOM', type: 'Airport', city: 'Mumbai', state: 'Maharashtra', lat: 19.0896, lng: 72.8656 },
  { id: 'hub-pune-rail', name: 'Pune Junction Railway Station', stationCode: 'PUNE', type: 'Railway Station', city: 'Pune', state: 'Maharashtra', lat: 18.5289, lng: 73.8744 },
  { id: 'hub-sbc-rail', name: 'KSR Bengaluru City Junction', stationCode: 'SBC', type: 'Railway Station', city: 'Bengaluru', state: 'Karnataka', lat: 12.9781, lng: 77.5697 },
  { id: 'hub-blr-air', name: 'Kempegowda International Airport, Bengaluru', stationCode: 'BLR', type: 'Airport', city: 'Bengaluru', state: 'Karnataka', lat: 13.1986, lng: 77.7066 },
  { id: 'hub-mas-rail', name: 'Puratchi Thalaivar Dr. MGR Chennai Central', stationCode: 'MAS', type: 'Railway Station', city: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2750 },
  { id: 'hub-maa-air', name: 'Chennai International Airport', stationCode: 'MAA', type: 'Airport', city: 'Chennai', state: 'Tamil Nadu', lat: 12.9941, lng: 80.1709 },
  { id: 'hub-sc-rail', name: 'Secunderabad Junction Railway Station', stationCode: 'SC', type: 'Railway Station', city: 'Hyderabad', state: 'Telangana', lat: 17.4344, lng: 78.5013 },
  { id: 'hub-hyd-air', name: 'Rajiv Gandhi International Airport, Hyderabad', stationCode: 'HYD', type: 'Airport', city: 'Hyderabad', state: 'Telangana', lat: 17.2403, lng: 78.4294 },
  { id: 'hub-hwh-rail', name: 'Howrah Junction Railway Station', stationCode: 'HWH', type: 'Railway Station', city: 'Kolkata', state: 'West Bengal', lat: 22.5839, lng: 88.3426 },
  { id: 'hub-ccu-air', name: 'Netaji Subhas Chandra Bose International Airport, Kolkata', stationCode: 'CCU', type: 'Airport', city: 'Kolkata', state: 'West Bengal', lat: 22.6547, lng: 88.4467 },
  { id: 'hub-allp-rail', name: 'Alappuzha Railway Station', stationCode: 'ALLP', type: 'Railway Station', city: 'Alleppey', state: 'Kerala', lat: 9.4932, lng: 76.3186 },
  { id: 'hub-cok-air', name: 'Cochin International Airport, Kochi', stationCode: 'COK', type: 'Airport', city: 'Kochi', state: 'Kerala', lat: 10.1520, lng: 76.4019 },
  { id: 'hub-ers-rail', name: 'Ernakulam Junction Railway Station', stationCode: 'ERS', type: 'Railway Station', city: 'Kochi', state: 'Kerala', lat: 9.9693, lng: 76.2907 },
  { id: 'hub-adi-rail', name: 'Ahmedabad Junction (Kalupur)', stationCode: 'ADI', type: 'Railway Station', city: 'Ahmedabad', state: 'Gujarat', lat: 23.0268, lng: 72.6009 },
  { id: 'hub-asr-rail', name: 'Amritsar Junction Railway Station', stationCode: 'ASR', type: 'Railway Station', city: 'Amritsar', state: 'Punjab', lat: 31.6331, lng: 74.8675 },
  { id: 'hub-cdg-rail', name: 'Chandigarh Junction Railway Station', stationCode: 'CDG', type: 'Railway Station', city: 'Chandigarh', state: 'Chandigarh', lat: 30.7016, lng: 76.8213 },
  { id: 'hub-mao-rail', name: 'Madgaon Junction Railway Station, Goa', stationCode: 'MAO', type: 'Railway Station', city: 'Margao', state: 'Goa', lat: 15.2683, lng: 73.9694 },
  { id: 'hub-goi-air', name: 'Goa Dabolim International Airport', stationCode: 'GOI', type: 'Airport', city: 'Vasco da Gama', state: 'Goa', lat: 15.3808, lng: 73.8314 },
  { id: 'hub-ghy-rail', name: 'Guwahati Railway Station', stationCode: 'GHY', type: 'Railway Station', city: 'Guwahati', state: 'Assam', lat: 26.1820, lng: 91.7514 },
  { id: 'hub-pnbe-rail', name: 'Patna Junction Railway Station', stationCode: 'PNBE', type: 'Railway Station', city: 'Patna', state: 'Bihar', lat: 25.6032, lng: 85.1370 },
  { id: 'hub-sxr-air', name: 'Sheikh ul-Alam International Airport, Srinagar', stationCode: 'SXR', type: 'Airport', city: 'Srinagar', state: 'Jammu and Kashmir', lat: 33.9871, lng: 74.7742 },
  { id: 'hub-ixl-air', name: 'Kushok Bakula Rimpochee Airport, Leh', stationCode: 'IXL', type: 'Airport', city: 'Leh', state: 'Ladakh', lat: 34.1359, lng: 77.5465 },

  // Jammu, Katra & Vaishno Devi Sector (Jammu and Kashmir)
  {
    id: 'hub-svdk-rail',
    name: 'Shri Mata Vaishno Devi Katra Railway Station',
    stationCode: 'SVDK',
    type: 'Railway Station',
    city: 'Katra',
    state: 'Jammu and Kashmir',
    lat: 32.9813,
    lng: 74.9498,
    groundTip: 'Official auto and taxi stands operate right outside Station Gate 1; Banganga Darshani Deodi yatra gate is ~2.5 km uphill.',
  },
  {
    id: 'hub-katra-bus',
    name: 'Katra Bus Stand (Main Chowk)',
    stationCode: 'KTR-BUS',
    type: 'Bus Stand',
    city: 'Katra',
    state: 'Jammu and Kashmir',
    lat: 32.9916,
    lng: 74.9318,
    groundTip: 'Direct JKRTC buses and shared cabs link Katra Bus Stand with Jammu (~48 km); Banganga trailhead lies 1.4 km north.',
  },
  {
    id: 'hub-jat-rail',
    name: 'Jammu Tawi Railway Station',
    stationCode: 'JAT',
    type: 'Railway Station',
    city: 'Jammu',
    state: 'Jammu and Kashmir',
    lat: 32.7072,
    lng: 74.8808,
    groundTip: 'Prepaid auto and taxi counters operate outside Exit 1; regular buses and cabs toward Katra / Raghunath Bazaar depart from Station Chowk.',
  },
  {
    id: 'hub-ixj-air',
    name: 'Jammu Airport (Satwari)',
    stationCode: 'IXJ',
    type: 'Airport',
    city: 'Jammu',
    state: 'Jammu and Kashmir',
    lat: 32.6891,
    lng: 74.8374,
    groundTip: '7 km south of old Jammu and ~50 km from Katra via NH44/Domel; prepaid airport taxi counter sits outside Arrivals.',
  },
  {
    id: 'hub-jammu-bus',
    name: 'Jammu General Bus Stand (BC Road)',
    stationCode: 'JAT-BUS',
    type: 'Bus Stand',
    city: 'Jammu',
    state: 'Jammu and Kashmir',
    lat: 32.7347,
    lng: 74.8648,
    groundTip: 'Central multi-level terminal near Raghunath Temple with frequent Katra, Udhampur, Patnitop, and Srinagar buses.',
  },
];

// Extensible India curated landmark registry for corridors where shrine paths,
// hillside stops, or regional landmarks need reliable search & attraction discovery.
export const INDIAN_CURATED_LANDMARKS: IndianCuratedLandmark[] = [
  // Katra & Shri Mata Vaishno Devi Corridor
  {
    id: 'curated-vaishno-devi-bhawan',
    name: 'Shri Mata Vaishno Devi Bhawan',
    aliases: ['Vaishno Devi', 'Mata Vaishno Devi', 'Vaishno Devi Mandir', 'Bhawan', 'SMVD Bhawan'],
    placeType: 'Sacred Cave Shrine',
    discoverCategory: 'Temples & Heritage',
    city: 'Katra',
    state: 'Jammu and Kashmir',
    lat: 33.0308,
    lng: 74.949,
    shortDescription:
      'Revered Trikuta Hills cave shrine at 5,200 ft above sea level. Motor vehicles terminate at Banganga or Tarakote in Katra, followed by the 12 km yatra track or helicopter to Sanjichhat.',
    bestVisitingTime: 'Open 24 hours · early morning or night darshan',
    groundTip: 'Carry an official Shrine Board RFID Yatra Access Card obtained near Katra Station, Bus Stand, or Tarakote.',
  },
  {
    id: 'curated-katra-banganga',
    name: 'Banganga Darshani Deodi (Vaishno Devi Yatra Gate)',
    aliases: ['Banganga', 'Darshani Deodi', 'Banganga Check Post'],
    placeType: 'Pilgrimage Trailhead',
    discoverCategory: 'Temples & Heritage',
    city: 'Katra',
    state: 'Jammu and Kashmir',
    lat: 32.9977,
    lng: 74.9347,
    shortDescription:
      'Primary road drop-off point and sacred riverside entry gate at the foot of the Trikuta Hills where the traditional foot climb toward Vaishno Devi begins.',
    bestVisitingTime: 'All day · lively dawn and dusk',
    groundTip: 'Autos and cabs from Katra Station (SVDK) drop passengers directly at the Banganga vehicle barrier.',
  },
  {
    id: 'curated-katra-ardhkuwari',
    name: 'Ardhkuwari Temple (Garbh Joon Cave)',
    aliases: ['Ardhkuwari', 'Adhkuwari', 'Ardh Kuwari', 'Garbh Joon'],
    placeType: 'Pilgrimage Stop',
    discoverCategory: 'Temples & Heritage',
    city: 'Katra',
    state: 'Jammu and Kashmir',
    lat: 33.0145,
    lng: 74.9462,
    shortDescription:
      'Midway sacred stop ~6 km up from Banganga, featuring the narrow Garbh Joon cave shrine and the junction connecting to the battery-car road to Bhawan.',
    bestVisitingTime: 'Early morning · queue tokens issued on arrival',
  },
  {
    id: 'curated-katra-sanjichhat',
    name: 'Sanjichhat Ridge & Helipad',
    aliases: ['Sanjichhat', 'Sanji Chhat', 'Sanjichhat Helipad'],
    placeType: 'Mountain Ridge & Helipad',
    discoverCategory: 'Adventure & Experiences',
    city: 'Katra',
    state: 'Jammu and Kashmir',
    lat: 33.0258,
    lng: 74.9436,
    shortDescription:
      'High ridge at ~6,200 ft ~9.5 km above Katra with panoramic Pir Panjal views, Shrine Board accommodation, and the helipad serving Katra–Sanjichhat shuttles.',
    bestVisitingTime: 'Sunrise & clear mornings',
  },
  {
    id: 'curated-katra-bhairon-temple',
    name: 'Bhairon Temple (Bhairavnath Mandir)',
    aliases: ['Bhairon Temple', 'Bhairon Baba', 'Bhairavnath'],
    placeType: 'Hilltop Temple',
    discoverCategory: 'Temples & Heritage',
    city: 'Katra',
    state: 'Jammu and Kashmir',
    lat: 33.0338,
    lng: 74.9547,
    shortDescription:
      'Hilltop shrine 1.5 km above Bhawan reached via a short steep trail or the passenger ropeway, traditionally visited to complete the Vaishno Devi yatra.',
    bestVisitingTime: 'Morning to afternoon · ropeway closes near dusk',
  },
  {
    id: 'curated-katra-tarakote',
    name: 'Tarakote Marg Trailhead, Katra',
    aliases: ['Tarakote', 'Tarakote Marg', 'Tarakote Track'],
    placeType: 'Scenic Pilgrimage Track',
    discoverCategory: 'Nature & Beaches',
    city: 'Katra',
    state: 'Jammu and Kashmir',
    lat: 32.9998,
    lng: 74.9288,
    shortDescription:
      'Wide, landscaped pedestrian-only approach path ~7 km up to Ardhkuwari with rest shelters, langar stops, and mountain views—free of ponies.',
    bestVisitingTime: 'Morning or late afternoon',
  },
  {
    id: 'curated-katra-nau-devi',
    name: 'Nau Devi Cave Temple, Katra',
    aliases: ['Nau Devi', 'Nau Devian'],
    placeType: 'Cave Temple',
    discoverCategory: 'Hidden Gems',
    city: 'Katra',
    state: 'Jammu and Kashmir',
    lat: 33.0195,
    lng: 74.9718,
    shortDescription:
      'Quiet hillside cave shrine ~10 km east of Katra reached along a winding mountain road near a seasonal stream.',
    bestVisitingTime: 'Morning hours',
  },

  // Jammu City Landmarks
  {
    id: 'curated-jammu-raghunath-temple',
    name: 'Raghunath Temple, Jammu',
    aliases: ['Raghunath Temple', 'Raghunath Mandir', 'Raghunath Bazaar'],
    placeType: 'Historic Temple Complex',
    discoverCategory: 'Temples & Heritage',
    city: 'Jammu',
    state: 'Jammu and Kashmir',
    lat: 32.733,
    lng: 74.8673,
    shortDescription:
      '19th-century Dogra-era seven-shrine temple complex in central Jammu overlooking the bustling Raghunath Bazaar.',
    bestVisitingTime: '6:00 AM – 12:00 PM & evening aarti',
  },
  {
    id: 'curated-jammu-bahu-fort',
    name: 'Bahu Fort & Bawe Wali Mata Temple',
    aliases: ['Bahu Fort', 'Bawe Wali Mata'],
    placeType: 'Historic Hilltop Fort',
    discoverCategory: 'Temples & Heritage',
    city: 'Jammu',
    state: 'Jammu and Kashmir',
    lat: 32.7248,
    lng: 74.8797,
    shortDescription:
      'Ancient fort perched above the left bank of the Tawi River housing the revered Bawe Wali Mata shrine and wide city rampart views.',
    bestVisitingTime: 'Morning or sunset',
  },
  {
    id: 'curated-jammu-bagh-e-bahu',
    name: 'Bagh-e-Bahu Gardens & Aquarium',
    aliases: ['Bagh-e-Bahu', 'Bagh e Bahu', 'Bahu Garden'],
    placeType: 'Terraced Park & Garden',
    discoverCategory: 'Nature & Beaches',
    city: 'Jammu',
    state: 'Jammu and Kashmir',
    lat: 32.7232,
    lng: 74.8825,
    shortDescription:
      'Terraced hillside Mughal-style gardens overlooking the Tawi River beside Bahu Fort, paired with an underground freshwater aquarium.',
    bestVisitingTime: '4:00 PM – 7:00 PM',
  },
  {
    id: 'curated-jammu-amar-mahal',
    name: 'Amar Mahal Palace Museum, Jammu',
    aliases: ['Amar Mahal', 'Amar Mahal Palace'],
    placeType: 'Palace Museum',
    discoverCategory: 'Museums & Culture',
    city: 'Jammu',
    state: 'Jammu and Kashmir',
    lat: 32.7438,
    lng: 74.8726,
    shortDescription:
      'Red-sandstone French-chateau-inspired Dogra palace overlooking the Tawi bend, exhibiting miniature Pahari paintings and royal archives.',
    bestVisitingTime: '10:00 AM – 5:00 PM (check Monday closure)',
  },
  {
    id: 'curated-jammu-mubarak-mandi',
    name: 'Mubarak Mandi Heritage Complex, Jammu',
    aliases: ['Mubarak Mandi', 'Mubarak Mandi Palace'],
    placeType: 'Heritage Palace Courtyard',
    discoverCategory: 'Museums & Culture',
    city: 'Jammu',
    state: 'Jammu and Kashmir',
    lat: 32.7351,
    lng: 74.8698,
    shortDescription:
      'Historic 18th–19th century royal courtyard complex of Dogra rulers blending Rajasthani, Mughal, and European arcades in old Jammu.',
    bestVisitingTime: 'Daylight hours',
  },
  {
    id: 'curated-jammu-mansar-lake',
    name: 'Mansar Lake',
    aliases: ['Mansar', 'Mansar Lake'],
    placeType: 'Sacred Foothill Lake',
    discoverCategory: 'Nature & Beaches',
    city: 'Jammu',
    state: 'Jammu and Kashmir',
    lat: 32.6968,
    lng: 75.1462,
    shortDescription:
      'Forest-ringed oval lake ~62 km east of Jammu city popular for lakeside walks, temple shrines, and peaceful foothill excursions.',
    bestVisitingTime: 'Morning to late afternoon',
  },

  // Puri Corridor (Odisha)
  {
    id: 'curated-puri-jagannath-temple',
    name: 'Shri Jagannath Temple, Puri',
    aliases: ['Jagannath Temple', 'Shree Jagannath Temple', 'Puri Temple', 'Jagannath Mandir'],
    placeType: 'Sacred Temple Complex',
    discoverCategory: 'Temples & Heritage',
    city: 'Puri',
    state: 'Odisha',
    lat: 19.8049,
    lng: 85.8179,
    shortDescription:
      '12th-century Kalinga sandstone temple on Grand Road (Bada Danda). Phones, cameras, and leather items are not allowed inside the sanctum; deposit counters sit outside Singhadwara.',
    bestVisitingTime: '5:30 AM – 8:30 AM or 6:30 PM – 8:30 PM',
    groundTip:
      'Autos and e-rickshaws drop near Market Chhak or the Singhadwara barricade (~250m walk to the Lion Gate shoe & phone cloakroom).',
    openingHoursText: 'Typically 5:30 AM – 10:00 PM daily (ritual intervals may pause inner darshan)',
    openingHoursVerified: false,
    typicalOpenHour24: 5.5,
    typicalCloseHour24: 22,
    recommendedWalkMinutes: 10,
    recommendedActivityMinutes: 90,
  },
  {
    id: 'curated-puri-golden-beach',
    name: 'Golden Beach (Blue Flag Seafront), Puri',
    aliases: ['Golden Beach', 'Puri Beach', 'Puri Sea Beach', 'Blue Flag Beach Puri'],
    placeType: 'Coastal Beachfront',
    discoverCategory: 'Nature & Beaches',
    city: 'Puri',
    state: 'Odisha',
    lat: 19.7949,
    lng: 85.8266,
    shortDescription:
      'Cleaned Bay of Bengal shoreline along Marine Drive featuring paved promenade benches, lifeguard zones, and calm sunrise & sunset breezes.',
    bestVisitingTime: '5:30 AM – 8:00 AM & 4:30 PM – 6:45 PM',
    groundTip:
      'Marine Drive / Chakra Tirtha Road runs parallel to the seafront; autos drop directly outside beach access gates.',
    openingHoursText: 'Public promenade open early morning until evening (Blue Flag gates typically 6:00 AM – 8:00 PM)',
    openingHoursVerified: false,
    typicalOpenHour24: 6,
    typicalCloseHour24: 20,
    recommendedWalkMinutes: 5,
    recommendedActivityMinutes: 60,
  },

  // Varanasi Corridor (Uttar Pradesh)
  {
    id: 'curated-varanasi-kashi-vishwanath',
    name: 'Kashi Vishwanath Temple, Varanasi',
    aliases: ['Kashi Vishwanath', 'Vishwanath Temple', 'Kashi Vishwanath Corridor'],
    placeType: 'Sacred Jyotirlinga Shrine',
    discoverCategory: 'Temples & Heritage',
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    lat: 25.3109,
    lng: 83.0107,
    shortDescription:
      'Historic Shiva temple linked directly to the Ganga via the Kashi Vishwanath Corridor. Vehicles stop near Godowlia or Maidagin barricades.',
    bestVisitingTime: '4:00 AM – 7:30 AM or after evening Aarti',
    groundTip:
      'Four-wheelers and regular autos cannot enter narrow lane barricades past Godowlia Chowk — expect a 450–700m pedestrian walk to the Gate 4 corridor entrance.',
    openingHoursText: 'Typically 3:00 AM – 11:00 PM daily (closed briefly during Mangala/Bhog/Shayan Aarti rituals)',
    openingHoursVerified: false,
    typicalOpenHour24: 3,
    typicalCloseHour24: 23,
    recommendedWalkMinutes: 15,
    recommendedActivityMinutes: 75,
  },
  {
    id: 'curated-varanasi-dashashwamedh-ghat',
    name: 'Dashashwamedh Ghat, Varanasi',
    aliases: ['Dashashwamedh Ghat', 'Ganga Aarti Ghat', 'Godowlia'],
    placeType: 'Historic Ganga Ghat',
    discoverCategory: 'Temples & Heritage',
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    lat: 25.3069,
    lng: 83.0104,
    shortDescription:
      'Central riverfront steps famous for the evening Ganga Aarti ceremony and wooden sunrise boat rides.',
    bestVisitingTime: '5:30 AM – 7:00 AM (dawn) or 5:30 PM onwards for evening Aarti',
    groundTip:
      'Auto drop stops near Godowlia Chowk; walk ~500m east toward the river steps.',
    openingHoursText: 'Open 24 hours (Evening Aarti begins around 6:00 PM – 6:45 PM depending on season)',
    openingHoursVerified: false,
    typicalOpenHour24: 0,
    typicalCloseHour24: 24,
    recommendedWalkMinutes: 12,
    recommendedActivityMinutes: 90,
  },

  // Jaipur & Udaipur Heritage Landmarks
  {
    id: 'curated-jaipur-hawa-mahal',
    name: 'Hawa Mahal, Jaipur',
    aliases: ['Hawa Mahal', 'Palace of Winds', 'Badi Chaupar'],
    placeType: 'Historic Monument',
    discoverCategory: 'Temples & Heritage',
    city: 'Jaipur',
    state: 'Rajasthan',
    lat: 26.9239,
    lng: 75.8267,
    shortDescription:
      'Five-storey 1799 red-and-pink sandstone facade with 953 ventilated jharokhas inside the Walled City near Badi Chaupar.',
    bestVisitingTime: '9:00 AM – 11:00 AM (front facade sunlit in morning)',
    groundTip:
      'Badi Chaupar Metro station sits ~250m from Hawa Mahal; inner monument entry is from the rear courtyard side lane.',
    openingHoursText: '9:00 AM – 5:00 PM daily (verify evening night-visit hours at ticket window)',
    openingHoursVerified: true,
    typicalOpenHour24: 9,
    typicalCloseHour24: 17,
    recommendedWalkMinutes: 5,
    recommendedActivityMinutes: 60,
  },
  {
    id: 'curated-jaipur-amber-fort',
    name: 'Amber Fort (Amer Palace), Jaipur',
    aliases: ['Amber Fort', 'Amer Fort', 'Amer Palace'],
    placeType: 'Hilltop Fort Palace',
    discoverCategory: 'Temples & Heritage',
    city: 'Jaipur',
    state: 'Rajasthan',
    lat: 26.9855,
    lng: 75.8513,
    shortDescription:
      '16th-century hilltop Rajput citadel featuring Sheesh Mahal, Suraj Pol, and views across Maota Lake.',
    bestVisitingTime: '8:00 AM – 10:30 AM before midday crowds',
    groundTip:
      'Cabs drop near the lower Suraj Pol / Jaleb Chowk ramp; electric golf carts and pedestrian ramps ascend to the main courtyard.',
    openingHoursText: '8:00 AM – 5:30 PM daytime (check evening light-show hours separately)',
    openingHoursVerified: true,
    typicalOpenHour24: 8,
    typicalCloseHour24: 17.5,
    recommendedWalkMinutes: 12,
    recommendedActivityMinutes: 120,
  },
  {
    id: 'curated-udaipur-city-palace',
    name: 'City Palace, Udaipur',
    aliases: ['Udaipur City Palace', 'City Palace Museum Udaipur'],
    placeType: 'Lakeside Royal Palace',
    discoverCategory: 'Temples & Heritage',
    city: 'Udaipur',
    state: 'Rajasthan',
    lat: 24.5764,
    lng: 73.6835,
    shortDescription:
      'Mewar royal palace complex overlooking Lake Pichola with 11 interconnected courtyards and museum galleries.',
    bestVisitingTime: '9:30 AM – 11:30 AM',
    groundTip:
      'Old City streets restrict four-wheelers 9 AM – 8 PM; auto-rickshaws drop right outside Badi Pol / Sheetla Mata Gate.',
    openingHoursText: '9:30 AM – 5:30 PM daily',
    openingHoursVerified: true,
    typicalOpenHour24: 9.5,
    typicalCloseHour24: 17.5,
    recommendedWalkMinutes: 8,
    recommendedActivityMinutes: 105,
  },
];

export function findCuratedGroundTips(
  originLabel = '',
  destLabel = '',
  city = '',
  state = ''
): { tips: string[]; matchedLandmark?: IndianCuratedLandmark } {
  const hay = `${originLabel} ${destLabel} ${city} ${state}`.toLowerCase();
  const tips: string[] = [];

  for (const hub of INDIAN_TRANSIT_HUBS) {
    if (!hub.groundTip) continue;
    const matchName =
      hay.includes(hub.name.toLowerCase()) ||
      (hub.stationCode && hay.includes(hub.stationCode.toLowerCase())) ||
      (originLabel && originLabel.toLowerCase().includes(hub.city.toLowerCase()) && hay.includes(hub.type.toLowerCase().split(' ')[0]));
    if (matchName && !tips.includes(hub.groundTip)) {
      tips.push(hub.groundTip);
    }
  }

  let matchedLandmark: IndianCuratedLandmark | undefined;
  for (const lm of INDIAN_CURATED_LANDMARKS) {
    const names = [lm.name, ...(lm.aliases || [])].map((n) => n.toLowerCase());
    if (names.some((n) => hay.includes(n))) {
      matchedLandmark = lm;
      if (lm.groundTip && !tips.includes(lm.groundTip)) {
        tips.push(lm.groundTip);
      }
    }
  }

  return { tips: tips.slice(0, 4), matchedLandmark };
}

const METRO_FULL_CITIES = [
  'delhi', 'new delhi', 'noida', 'gurugram', 'gurgaon', 'faridabad', 'ghaziabad',
  'mumbai', 'thane', 'navi mumbai', 'pune', 'nagpur', 'nashik',
  'bengaluru', 'bangalore', 'mysuru', 'mysore', 'mangaluru',
  'hyderabad', 'secunderabad', 'chennai', 'coimbatore', 'madurai',
  'kolkata', 'howrah', 'bhubaneswar', 'cuttack',
  'jaipur', 'lucknow', 'kanpur', 'varanasi', 'agra', 'prayagraj', 'allahabad',
  'ahmedabad', 'surat', 'vadodara', 'rajkot',
  'chandigarh', 'ludhiana', 'amritsar', 'jalandhar',
  'indore', 'bhopal', 'patna', 'ranchi', 'raipur',
  'kochi', 'ernakulam', 'thiruvananthapuram', 'trivandrum', 'kozhikode',
  'guwahati', 'dehradun', 'visakhapatnam', 'vijayawada', 'tirupati', 'puducherry', 'pondicherry',
];

const REGIONAL_PARTIAL_CITIES = [
  'udaipur', 'jodhpur', 'bikaner', 'ajmer', 'kota',
  'rishikesh', 'haridwar', 'haldwani', 'nainital',
  'alleppey', 'alappuzha', 'thrissur', 'kottayam',
  'puri', 'konark', 'mathura', 'vrindavan', 'ayodhya',
  'aurangabad', 'shirdi', 'jammu', 'katra', 'vaishno devi', 'srinagar', 'shimla', 'dharamshala',
  'siliguri', 'darjeeling', 'gaya', 'bodh gaya', 'ujjain', 'jabalpur', 'gwalior',
];

const LOCAL_ONLY_CITIES = [
  'manali', 'bhuntar', 'kullu', 'bir', 'spiti', 'leh', 'kargil', 'gangtok',
  'tawang', 'port blair', 'havelock', 'kavaratti', 'goa', 'panaji', 'margao', 'calangute',
  'vasco da gama', 'dabolim', 'hampi', 'gokarna', 'varkala',
];

export function evaluateCityCoverage(cityOrLabel: string, stateName = ''): CityCoverageProfile {
  const hay = `${cityOrLabel} ${stateName}`.toLowerCase();

  if (LOCAL_ONLY_CITIES.some((c) => hay.includes(c))) {
    const matched = LOCAL_ONLY_CITIES.find((c) => hay.includes(c)) || cityOrLabel;
    const isGoa = hay.includes('goa') || hay.includes('panaji') || hay.includes('margao') || hay.includes('dabolim');
    return {
      tier: 'local-only',
      cityLabel: matched,
      uber: 'Not Supported',
      ola: 'Not Supported',
      rapido: 'Not Supported',
      hasLocalPrepaidStand: true,
      localAutoNote: isGoa
        ? 'Goa relies on state-regulated yellow/black taxis, local pilot bike stands, and GoaMiles rather than Uber/Ola/Rapido.'
        : 'App-based bike & auto aggregators do not operate here. Use station/bus-stand taxi or union counters.',
      localCabNote: isGoa
        ? 'Use GoaMiles or official prepaid airport/station taxi counters.'
        : 'Regional taxi union counters follow fixed zone rate cards at major transit exits.',
    };
  }

  if (METRO_FULL_CITIES.some((c) => hay.includes(c))) {
    const matched = METRO_FULL_CITIES.find((c) => hay.includes(c)) || cityOrLabel;
    return {
      tier: 'metro-full',
      cityLabel: matched,
      uber: 'Supported',
      ola: 'Supported',
      rapido: 'Supported',
      hasLocalPrepaidStand: true,
      localAutoNote: 'Metered and prepaid auto stands operate at major railway stations and bus stands.',
      localCabNote: 'Airport & railway prepaid taxi booths provide fixed-zone backup alongside app cabs.',
    };
  }

  if (REGIONAL_PARTIAL_CITIES.some((c) => hay.includes(c))) {
    const matched = REGIONAL_PARTIAL_CITIES.find((c) => hay.includes(c)) || cityOrLabel;
    const isPuri = hay.includes('puri') || hay.includes('konark');
    const isUdaipur = hay.includes('udaipur');
    const isKatra = hay.includes('katra') || hay.includes('vaishno') || hay.includes('banganga') || hay.includes('tarakote');
    const isJammu = hay.includes('jammu') || hay.includes('raghunath') || hay.includes('bahu');
    return {
      tier: 'regional-partial',
      cityLabel: matched,
      uber: isUdaipur || isPuri || isJammu ? 'Supported' : 'Unknown',
      ola: isUdaipur || isPuri || isJammu ? 'Supported' : 'Unknown',
      rapido: isUdaipur || isPuri || isJammu ? 'Supported' : 'Supported',
      hasLocalPrepaidStand: true,
      localAutoNote: isPuri
        ? 'Puri Railway Station & Bus Stand have official prepaid auto/e-rickshaw stands; app availability varies near Grand Road—confirm inside app.'
        : isKatra
        ? 'Official Katra prepaid autos drop at Banganga Darshani Deodi or Tarakote Marg; roads beyond the yatra gates are pedestrian/Shrine Board controlled.'
        : isJammu
        ? 'Prepaid auto booths sit outside Jammu Tawi Rail Exit 1 and BC Road Bus Stand alongside app autos.'
        : 'Prepaid / union auto stands operate outside major transit exits.',
      localCabNote: isPuri
        ? 'Prepaid / tourist taxi stands operate at Puri Station alongside regional Bhubaneswar–Puri aggregator pickups.'
        : isKatra
        ? 'Prepaid taxis & Jammu–Katra cabs operate from SVDK Station & Katra Bus Stand up to Banganga / Helipad.'
        : isJammu
        ? 'Prepaid Jammu taxis & Katra sector cabs operate directly from Jammu Tawi Station and IXJ Airport.'
        : 'Regional union & prepaid taxi booths operate at main railway/bus terminals.',
    };
  }

  return {
    tier: 'unknown',
    cityLabel: cityOrLabel || 'Selected Indian City',
    uber: 'Unknown',
    ola: 'Unknown',
    rapido: 'Unknown',
    hasLocalPrepaidStand: true,
    localAutoNote: 'Check station exit for municipal prepaid auto booth or state transport counter.',
    localCabNote: 'Verify Uber/Ola/Rapido serviceability directly inside each provider app for this town.',
  };
}
