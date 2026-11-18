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
];

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
  'aurangabad', 'shirdi', 'jammu', 'srinagar', 'shimla', 'dharamshala',
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
    return {
      tier: 'regional-partial',
      cityLabel: matched,
      uber: isUdaipur || isPuri ? 'Supported' : 'Unknown',
      ola: isUdaipur || isPuri ? 'Supported' : 'Unknown',
      rapido: isUdaipur || isPuri ? 'Supported' : 'Supported',
      hasLocalPrepaidStand: true,
      localAutoNote: isPuri
        ? 'Puri Railway Station & Bus Stand have official prepaid auto/e-rickshaw stands; app availability varies near Grand Road—confirm inside app.'
        : 'Prepaid / union auto stands operate outside major transit exits.',
      localCabNote: isPuri
        ? 'Prepaid / tourist taxi stands operate at Puri Station alongside regional Bhubaneswar–Puri aggregator pickups.'
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
