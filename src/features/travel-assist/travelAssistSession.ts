import type { ArrivalKind } from '../../data/indiaLocations';

export type FirstDestKind =
  | 'Hotel / Stay'
  | 'Temple / Landmark'
  | 'Custom Address'
  | 'Other Location';

export type PreferredRideMode = 'bike' | 'auto' | 'cab' | 'all';

export interface SelectedPlace {
  label: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  groundTip?: string;
  source: string;
}

export interface TravelAssistSessionState {
  selectedState: string;
  arrivalKind: ArrivalKind;
  originQuery: string;
  originPlace: SelectedPlace | null;
  destKind: FirstDestKind;
  destQuery: string;
  destPlace: SelectedPlace | null;
  pickupPlace: SelectedPlace | null;
  passengers: number;
  preferredRideType?: PreferredRideMode;
}

const SESSION_KEY = 'yatra_travel_assist_session_v1';

export function readTravelAssistSession(): TravelAssistSessionState | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TravelAssistSessionState;
  } catch {
    return null;
  }
}

export function writeTravelAssistSession(state: TravelAssistSessionState): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage unavailability
  }
}
