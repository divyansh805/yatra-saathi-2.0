import type { SharedJourney, SmartHopPlace } from './smartHopTypes';

const JOURNEY_KEY_PREFIX = 'ys_smart_hop_journey_';
const LATEST_JOURNEY_ID_KEY = 'ys_smart_hop_latest_id';
const PLANNER_DRAFT_KEY = 'ys_smart_hop_planner_draft_v1';
export const JOURNEY_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

export interface PlannerDraftState {
  originCategory: string;
  originQuery: string;
  originPlace: SmartHopPlace | null;
  destCategory: string;
  destQuery: string;
  destPlace: SmartHopPlace | null;
}

export function createJourneyId(): string {
  const rand = Math.random().toString(36).slice(2, 8);
  const ts = Date.now().toString(36).slice(-5);
  return `hop-${ts}-${rand}`;
}

export function saveSharedJourney(journey: SharedJourney): void {
  try {
    localStorage.setItem(`${JOURNEY_KEY_PREFIX}${journey.journeyId}`, JSON.stringify(journey));
    localStorage.setItem(LATEST_JOURNEY_ID_KEY, journey.journeyId);
  } catch {
    // Ignore storage quota / privacy mode errors cleanly
  }
}

export function loadSharedJourney(journeyIdFromUrl?: string | null): {
  journey: SharedJourney | null;
  status: 'found' | 'missing' | 'expired';
} {
  try {
    const targetId = journeyIdFromUrl?.trim() || localStorage.getItem(LATEST_JOURNEY_ID_KEY);
    if (!targetId) {
      return { journey: null, status: 'missing' };
    }
    const raw = localStorage.getItem(`${JOURNEY_KEY_PREFIX}${targetId}`);
    if (!raw) {
      return { journey: null, status: 'missing' };
    }
    const parsed = JSON.parse(raw) as SharedJourney;
    if (!parsed || !parsed.origin || !parsed.destination || !Number.isFinite(parsed.distanceKm)) {
      return { journey: null, status: 'missing' };
    }
    if (typeof parsed.expiresAt === 'number' && Date.now() > parsed.expiresAt) {
      localStorage.removeItem(`${JOURNEY_KEY_PREFIX}${targetId}`);
      if (localStorage.getItem(LATEST_JOURNEY_ID_KEY) === targetId) {
        localStorage.removeItem(LATEST_JOURNEY_ID_KEY);
      }
      return { journey: null, status: 'expired' };
    }
    return { journey: parsed, status: 'found' };
  } catch {
    return { journey: null, status: 'missing' };
  }
}

export function clearSharedJourney(journeyId?: string): void {
  try {
    if (journeyId) {
      localStorage.removeItem(`${JOURNEY_KEY_PREFIX}${journeyId}`);
      if (localStorage.getItem(LATEST_JOURNEY_ID_KEY) === journeyId) {
        localStorage.removeItem(LATEST_JOURNEY_ID_KEY);
      }
    } else {
      const latest = localStorage.getItem(LATEST_JOURNEY_ID_KEY);
      if (latest) localStorage.removeItem(`${JOURNEY_KEY_PREFIX}${latest}`);
      localStorage.removeItem(LATEST_JOURNEY_ID_KEY);
    }
  } catch {
    // Ignore
  }
}

export function readPlannerDraft(): PlannerDraftState | null {
  try {
    const raw = sessionStorage.getItem(PLANNER_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PlannerDraftState;
  } catch {
    return null;
  }
}

export function writePlannerDraft(draft: PlannerDraftState): void {
  try {
    sessionStorage.setItem(PLANNER_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Ignore
  }
}
