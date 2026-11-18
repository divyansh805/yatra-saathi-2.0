import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import {
  INDIA_STATES_AND_UTS,
  INDIAN_TRANSIT_HUBS,
  evaluateCityCoverage,
} from './src/data/indiaLocations';
import {
  computeProviderFare,
  type FareBreakdown,
  type FareEstimateType,
} from './src/data/fareEngine';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.join(__dirname, '.data');
const DB_PATH = path.join(DATA_DIR, 'yatra_saathi_store.json');
const SESSION_COOKIE = 'ys_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
}

interface ResetTokenRecord {
  token: string;
  email: string;
  expiresAt: number;
}

interface SavedItemRecord {
  id: string;
  type: 'attraction' | 'cafe' | 'adventure' | 'stay' | 'destination';
  destinationId: string;
  title: string;
  subtitle: string;
  image: string;
  savedAt: string;
  cachedSummary?: string;
}

interface SavedRouteRecord {
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

interface ViewedDestinationRecord {
  destinationId: string;
  destinationName: string;
  image: string;
  viewedAt: string;
}

interface UserWorkspace {
  savedItems: SavedItemRecord[];
  savedRoutes: SavedRouteRecord[];
  recentlyViewed: ViewedDestinationRecord[];
}

interface StoreSchema {
  users: UserRecord[];
  resetTokens: ResetTokenRecord[];
  workspaces: Record<string, UserWorkspace>;
}

let cachedStore: StoreSchema | null = null;
let writeQueue: Promise<void> = Promise.resolve();

function getSessionSecret(): string {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16) {
    return process.env.SESSION_SECRET;
  }
  const seed = process.env.APP_URL || __dirname;
  return crypto.createHash('sha256').update(`yatra-saathi-dev-${seed}`).digest('hex');
}

async function loadStore(): Promise<StoreSchema> {
  if (cachedStore) return cachedStore;
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const raw = await fs.readFile(DB_PATH, 'utf8');
    const parsed = JSON.parse(raw) as StoreSchema;
    cachedStore = {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      resetTokens: Array.isArray(parsed.resetTokens) ? parsed.resetTokens : [],
      workspaces: parsed.workspaces && typeof parsed.workspaces === 'object' ? parsed.workspaces : {},
    };
  } catch {
    cachedStore = { users: [], resetTokens: [], workspaces: {} };
    await saveStore(cachedStore);
  }
  return cachedStore;
}

async function saveStore(store: StoreSchema): Promise<void> {
  cachedStore = store;
  writeQueue = writeQueue.then(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmpPath = `${DB_PATH}.tmp`;
    await fs.writeFile(tmpPath, JSON.stringify(store, null, 2), 'utf8');
    await fs.rename(tmpPath, DB_PATH);
  });
  return writeQueue;
}

function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, actualSalt, 64).toString('hex');
  return { hash: derived, salt: actualSalt };
}

function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  const { hash } = hashPassword(password, salt);
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(storedHash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function signSessionToken(userId: string): string {
  const exp = Date.now() + SESSION_TTL_MS;
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp })).toString('base64url');
  const sig = crypto.createHmac('sha256', getSessionSecret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifySessionToken(token: string | undefined): string | null {
  if (!token || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expectedSig = crypto.createHmac('sha256', getSessionSecret()).update(payload).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      uid?: string;
      exp?: number;
    };
    if (!decoded.uid || !decoded.exp || decoded.exp < Date.now()) return null;
    return decoded.uid;
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0) {
      const key = part.slice(0, idx).trim();
      const val = decodeURIComponent(part.slice(idx + 1).trim());
      cookies[key] = val;
    }
  }
  return cookies;
}

function setSessionCookie(req: Request, res: Response, token: string): void {
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
    isHttps ? 'SameSite=None' : 'SameSite=Lax',
  ];
  if (isHttps) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearSessionCookie(req: Request, res: Response): void {
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  const parts = [
    `${SESSION_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    'Max-Age=0',
    isHttps ? 'SameSite=None' : 'SameSite=Lax',
  ];
  if (isHttps) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

async function getAuthenticatedUser(req: Request): Promise<UserRecord | null> {
  const cookies = parseCookies(req.headers.cookie);
  const userId = verifySessionToken(cookies[SESSION_COOKIE]);
  if (!userId) return null;
  const store = await loadStore();
  return store.users.find((u) => u.id === userId) || null;
}

function getOrCreateWorkspace(store: StoreSchema, userId: string): UserWorkspace {
  if (!store.workspaces[userId]) {
    store.workspaces[userId] = {
      savedItems: [],
      savedRoutes: [],
      recentlyViewed: [],
    };
  }
  return store.workspaces[userId];
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function decodeGooglePolyline(encoded: string): Array<{ lat: number; lng: number }> {
  const points: Array<{ lat: number; lng: number }> = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const dLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dLat;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const dLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dLng;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

function downsamplePath(
  coords: Array<{ lat: number; lng: number }>,
  maxPoints = 180
): Array<{ lat: number; lng: number }> {
  if (coords.length <= maxPoints) return coords;
  const step = Math.ceil(coords.length / maxPoints);
  const out: Array<{ lat: number; lng: number }> = [];
  for (let i = 0; i < coords.length; i += step) {
    out.push(coords[i]);
  }
  const last = coords[coords.length - 1];
  if (out[out.length - 1] !== last) out.push(last);
  return out;
}

interface RoadRouteResult {
  routeAvailable: boolean;
  distanceKm: number | null;
  durationMin: number | null;
  geometry: Array<{ lat: number; lng: number }>;
  source: string;
  isLiveRoute: boolean;
  error?: string;
}

async function computeRoadDistance(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<RoadRouteResult> {
  // 1. Primary: OSRM Public Driving Network (real road distance, duration & GeoJSON geometry)
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5500);
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
      const osrmRes = await fetch(osrmUrl, {
        headers: { 'User-Agent': 'YatraSaathiTravelIntelligence/1.0' },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (osrmRes.ok) {
        const osrmData = (await osrmRes.json()) as {
          code?: string;
          routes?: Array<{
            distance?: number;
            duration?: number;
            geometry?: { coordinates?: Array<[number, number]> };
          }>;
        };
        const first = osrmData.routes?.[0];
        if (osrmData.code === 'Ok' && typeof first?.distance === 'number' && typeof first?.duration === 'number') {
          const rawCoords = first.geometry?.coordinates || [];
          const pathCoords = downsamplePath(rawCoords.map(([lng, lat]) => ({ lat, lng })));
          return {
            routeAvailable: true,
            distanceKm: Number(Math.max(0.1, first.distance / 1000).toFixed(1)),
            durationMin: Math.max(2, Math.round(first.duration / 60)),
            geometry: pathCoords,
            source: 'OSRM Road Network',
            isLiveRoute: true,
          };
        }
      }
    } catch {
      // Retry once, then try secondary real-routing API
    }
  }

  // 2. Secondary Real-Road Routing Backup: Google Maps Routes API (only if key is configured)
  const gmpKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
  if (gmpKey) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4500);
      const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': gmpKey,
          'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline',
        },
        body: JSON.stringify({
          origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
          destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
          travelMode: 'DRIVE',
          routingPreference: 'TRAFFIC_AWARE',
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (response.ok) {
        const data = (await response.json()) as {
          routes?: Array<{
            distanceMeters?: number;
            duration?: string;
            polyline?: { encodedPolyline?: string };
          }>;
        };
        const route = data.routes?.[0];
        if (route?.distanceMeters && route?.duration) {
          const durationSec = Number(route.duration.replace('s', '')) || 0;
          const decoded = route.polyline?.encodedPolyline
            ? downsamplePath(decodeGooglePolyline(route.polyline.encodedPolyline))
            : [];
          return {
            routeAvailable: true,
            distanceKm: Number((route.distanceMeters / 1000).toFixed(1)),
            durationMin: Math.max(2, Math.round(durationSec / 60)),
            geometry: decoded,
            source: 'Google Maps Routes API',
            isLiveRoute: true,
          };
        }
      }
    } catch {
      // Fall through cleanly without inventing values
    }
  }

  // 3. Do NOT invent distance or duration from straight-line coordinates when routing fails
  return {
    routeAvailable: false,
    distanceKm: null,
    durationMin: null,
    geometry: [],
    source: 'Routing Unavailable',
    isLiveRoute: false,
    error: 'OSRM road routing is currently unavailable for these coordinates. Distance, duration, and fares are withheld rather than invented.',
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Health & Config
  app.get('/api/config/runtime', (_req: Request, res: Response) => {
    const mapsKey = process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '';
    res.json({
      mapsEnabled: Boolean(mapsKey),
      mapsApiKey: process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '',
      integrations: {
        googleMaps: Boolean(mapsKey),
        openMeteoWeather: true,
        wikipediaSummaries: true,
        groq: Boolean(process.env.GROQ_API_KEY),
        openRouter: Boolean(process.env.OPENROUTER_API_KEY),
        gemini: Boolean(process.env.GEMINI_API_KEY),
      },
      authMode: process.env.NODE_ENV === 'production' ? 'production-session' : 'development-session',
    });
  });

  // Auth routes
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    const { name, email, password, confirmPassword } = req.body as {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    };

    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();

    if (cleanName.length < 2) {
      res.status(400).json({ error: 'Please enter your full name (at least 2 characters).' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (!password || password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      return;
    }
    if (confirmPassword !== undefined && password !== confirmPassword) {
      res.status(400).json({ error: 'Passwords do not match.' });
      return;
    }

    const store = await loadStore();
    if (store.users.some((u) => u.email === cleanEmail)) {
      res.status(409).json({ error: 'An account with this email already exists. Please sign in instead.' });
      return;
    }

    const { hash, salt } = hashPassword(password);
    const user: UserRecord = {
      id: `usr_${crypto.randomUUID()}`,
      name: cleanName,
      email: cleanEmail,
      passwordHash: hash,
      salt,
      createdAt: new Date().toISOString(),
    };
    store.users.push(user);
    getOrCreateWorkspace(store, user.id);
    await saveStore(store);

    const token = signSessionToken(user.id);
    setSessionCookie(req, res, token);
    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    const { email, password } = req.body as { email?: string; password?: string };
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const store = await loadStore();
    const user = store.users.find((u) => u.email === cleanEmail);
    if (!user || !verifyPassword(password, user.passwordHash, user.salt)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = signSessionToken(user.id);
    setSessionCookie(req, res, token);
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    clearSessionCookie(req, res);
    res.json({ ok: true });
  });

  app.get('/api/auth/me', async (req: Request, res: Response) => {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      res.json({ user: null });
      return;
    }
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  });

  app.post('/api/auth/forgot-password', async (req: Request, res: Response) => {
    const { email } = req.body as { email?: string };
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }

    const store = await loadStore();
    const user = store.users.find((u) => u.email === cleanEmail);
    if (!user) {
      res.status(404).json({ error: 'No registered Yatra Saathi account was found for this email.' });
      return;
    }

    const resetToken = crypto.randomBytes(3).toString('hex').toUpperCase();
    store.resetTokens = store.resetTokens.filter((t) => t.email !== cleanEmail);
    store.resetTokens.push({
      token: resetToken,
      email: cleanEmail,
      expiresAt: Date.now() + 15 * 60 * 1000,
    });
    await saveStore(store);

    // Since external SMTP is not configured in local dev, return explicit development verification code
    res.json({
      ok: true,
      deliveryMode: 'development-verification',
      devResetCode: process.env.NODE_ENV === 'production' ? undefined : resetToken,
      message:
        process.env.NODE_ENV === 'production'
          ? 'If an SMTP relay is configured, a verification code has been dispatched.'
          : 'Development mode: SMTP email delivery is not configured, so use the verification code below to reset your password.',
    });
  });

  app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
    const { email, code, newPassword } = req.body as {
      email?: string;
      code?: string;
      newPassword?: string;
    };
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanEmail || !cleanCode || !newPassword || newPassword.length < 8) {
      res.status(400).json({ error: 'Valid email, reset code, and new password (8+ chars) are required.' });
      return;
    }

    const store = await loadStore();
    const tokenRecord = store.resetTokens.find(
      (t) => t.email === cleanEmail && t.token === cleanCode && t.expiresAt > Date.now()
    );
    if (!tokenRecord) {
      res.status(400).json({ error: 'Reset code is invalid or expired.' });
      return;
    }

    const user = store.users.find((u) => u.email === cleanEmail);
    if (!user) {
      res.status(404).json({ error: 'Account not found.' });
      return;
    }

    const { hash, salt } = hashPassword(newPassword);
    user.passwordHash = hash;
    user.salt = salt;
    store.resetTokens = store.resetTokens.filter((t) => t.email !== cleanEmail);
    await saveStore(store);

    res.json({ ok: true, message: 'Password updated. You can now sign in with your new password.' });
  });

  // Workspace (Saved Items, Routes, History)
  app.get('/api/user/workspace', async (req: Request, res: Response) => {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    const store = await loadStore();
    const workspace = getOrCreateWorkspace(store, user.id);
    res.json(workspace);
  });

  app.post('/api/user/saved-items', async (req: Request, res: Response) => {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Sign in to save places to your account.' });
      return;
    }
    const item = req.body as SavedItemRecord;
    if (!item?.id || !item?.title || !item?.type) {
      res.status(400).json({ error: 'Invalid item payload.' });
      return;
    }

    const store = await loadStore();
    const workspace = getOrCreateWorkspace(store, user.id);
    const existsIdx = workspace.savedItems.findIndex((i) => i.id === item.id && i.type === item.type);
    let saved = false;
    if (existsIdx >= 0) {
      workspace.savedItems.splice(existsIdx, 1);
      saved = false;
    } else {
      workspace.savedItems.unshift({ ...item, savedAt: new Date().toISOString() });
      saved = true;
    }
    await saveStore(store);
    res.json({ saved, savedItems: workspace.savedItems });
  });

  app.post('/api/user/routes', async (req: Request, res: Response) => {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Sign in to save planned routes.' });
      return;
    }
    const routeInput = req.body as Omit<SavedRouteRecord, 'id' | 'savedAt'>;
    if (!routeInput?.destinationId || !Array.isArray(routeInput.stops) || routeInput.stops.length === 0) {
      res.status(400).json({ error: 'Route must contain a destination and at least one stop.' });
      return;
    }

    const store = await loadStore();
    const workspace = getOrCreateWorkspace(store, user.id);
    const newRoute: SavedRouteRecord = {
      ...routeInput,
      id: `rte_${crypto.randomUUID().slice(0, 8)}`,
      savedAt: new Date().toISOString(),
    };
    workspace.savedRoutes.unshift(newRoute);
    await saveStore(store);
    res.status(201).json({ route: newRoute, savedRoutes: workspace.savedRoutes });
  });

  app.delete('/api/user/routes/:id', async (req: Request, res: Response) => {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    const store = await loadStore();
    const workspace = getOrCreateWorkspace(store, user.id);
    workspace.savedRoutes = workspace.savedRoutes.filter((r) => r.id !== req.params.id);
    await saveStore(store);
    res.json({ savedRoutes: workspace.savedRoutes });
  });

  app.post('/api/user/history', async (req: Request, res: Response) => {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      res.json({ ok: false });
      return;
    }
    const { destinationId, destinationName, image } = req.body as {
      destinationId?: string;
      destinationName?: string;
      image?: string;
    };
    if (!destinationId || !destinationName) {
      res.status(400).json({ error: 'destinationId and destinationName required.' });
      return;
    }
    const store = await loadStore();
    const workspace = getOrCreateWorkspace(store, user.id);
    workspace.recentlyViewed = [
      {
        destinationId,
        destinationName,
        image: image || '',
        viewedAt: new Date().toISOString(),
      },
      ...workspace.recentlyViewed.filter((item) => item.destinationId !== destinationId),
    ].slice(0, 6);
    await saveStore(store);
    res.json({ recentlyViewed: workspace.recentlyViewed });
  });

  // Live Weather API (Open-Meteo)
  app.get('/api/weather', async (req: Request, res: Response) => {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      res.status(400).json({ error: 'Valid lat and lng query parameters are required.' });
      return;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FKolkata&forecast_days=3`;
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Open-Meteo HTTP ${response.status}`);
      }
      const data = (await response.json()) as {
        current?: {
          temperature_2m: number;
          relative_humidity_2m: number;
          apparent_temperature: number;
          weather_code: number;
          wind_speed_10m: number;
        };
        daily?: {
          time: string[];
          temperature_2m_max: number[];
          temperature_2m_min: number[];
          precipitation_probability_max: number[];
        };
      };

      res.json({
        status: 'live',
        source: 'Open-Meteo Live Weather',
        fetchedAt: new Date().toISOString(),
        current: data.current || null,
        daily: data.daily || null,
      });
    } catch {
      res.json({
        status: 'unavailable',
        source: 'Open-Meteo Live Weather',
        fetchedAt: new Date().toISOString(),
        message: 'Live meteorological feed temporarily unreachable. Check connection before travel.',
        current: null,
        daily: null,
      });
    }
  });

  // Destination editorial background from Wikipedia REST API
  app.get('/api/destination-brief', async (req: Request, res: Response) => {
    const query = String(req.query.query || '').trim();
    if (!query) {
      res.status(400).json({ error: 'query parameter required.' });
      return;
    }
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);
      const encoded = encodeURIComponent(query.replace(/\s+/g, '_'));
      const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`, {
        headers: { 'User-Agent': 'YatraSaathiTravelIntelligence/1.0 (https://yatrasaathi.in)' },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!response.ok) {
        throw new Error('Summary unavailable');
      }
      const json = (await response.json()) as {
        title?: string;
        extract?: string;
        description?: string;
        content_urls?: { desktop?: { page?: string } };
      };
      res.json({
        status: 'verified',
        source: 'Wikipedia Editorial Summary',
        fetchedAt: new Date().toISOString(),
        title: json.title || query,
        description: json.description || '',
        extract: json.extract || '',
        url: json.content_urls?.desktop?.page || '',
      });
    } catch {
      res.json({
        status: 'unavailable',
        source: 'Wikipedia Editorial Summary',
        fetchedAt: new Date().toISOString(),
        extract: '',
      });
    }
  });

  // Shared strict India landmark vs non-landmark / admin / transit classifiers
  const NON_LANDMARK_ADMIN_REGEX =
    /\b(division|district|tehsil|taluk|taluka|subdivision|mandal|gram panchayat|panchayat|municipality|municipal corporation|development authority|nagarpalika|nagar nigam|constituency|vidhan sabha|lok sabha|vidhan bhavan|jan bhavan|raj bhavan|legislative assembly|parliament|secretariat|collectorate|cantonment board|metropolitan region|urban agglomeration|census town|union territory|high court|supreme court|police station|police headquarters|commissionerate|election commission|commission|department of|directorate|ministry of|government of|medical university|university|vishwavidyalaya|college|polytechnic|research institute|school|vidyalaya|vidya mandir|saraswati mandir|bal mandir|shishu mandir|academy|library|diocese|archdiocese|darul uloom|seminary|coaching center|railway station|train station|metro station|bus stand|bus depot|bus station|bus terminal|isbt|airport|aerodrome|highway|expressway|marg|sadak|flyover|chauraha|overbridge|battle of|siege of|treaty of|timeline of|demographics of|economy of|climate of|architecture of|culture of|history of|tourism in|list of|category:|portal:|template:|housing society|apartments)\b/i;

  const NON_ATTRACTION_DESC_REGEX =
    /\b(city in|town in|village in|village of|capital of|state in|state of|union territory|administrative division|revenue division|suburb of|neighbourhood in|neighborhood in|neighbourhood of|neighborhood of|residential area|locality in|ward in|electoral constituency|assembly constituency|parliamentary constituency|educational institution|public school|high school|medical school|medical university|hospital in|roman catholic|islamic seminary|metro station|railway station|road in|street in|government agency|government building|public library|headquarters of)\b/i;

  const GENUINE_LANDMARK_SIGNAL_REGEX =
    /\b(temple|mandir|masjid|mosque|imambara|darwaza|fort|quila|kila|palace|mahal|haveli|kothi|manzil|museum|gallery|planetarium|science city|observatory|jantar mantar|garden|bagh|park|zoo|prani udyan|zoological|botanical|aquarium|lake|sagar|sarovar|talab|kund|stepwell|baori|baoli|beach|seafront|marine drive|waterfall|falls|hill|peak|valley|cave|caves|springs|island|ghat|lighthouse|monument|memorial|tomb|mausoleum|makbara|shrine|church|cathedral|basilica|gurudwara|gurdwara|monastery|gompa|stupa|pagoda|ashram|math|matha|residency|clock tower|ghanta ghar|sanctuary|national park|wildlife|biosphere|reserve|heritage|landmark|tourist attraction|historic site|historical place|craft village|raghurajpur|viewpoint|marina|backwater|cenotaph|chhatri|gateway|arch)\b/i;

  const isNonLandmarkAdminOrTransit = (
    title: string,
    desc = '',
    rawType = '',
    allowTransit = false
  ): boolean => {
    const cleanTitle = title.trim();
    const combined = `${cleanTitle} ${desc} ${rawType}`;
    if (!cleanTitle) return true;
    if (/^(temple|park|beach|museum|riverside|awadh|cafe|coffee|restaurant|india)$/i.test(cleanTitle)) return true;
    if (/^list of\b|^tourism in\b|^history of\b|^category:/i.test(cleanTitle)) return true;
    if (NON_LANDMARK_ADMIN_REGEX.test(cleanTitle)) {
      if (allowTransit && /\b(railway station|bus stand|airport)\b/i.test(cleanTitle)) {
        return false;
      }
      return true;
    }
    if (NON_ATTRACTION_DESC_REGEX.test(desc) || NON_ATTRACTION_DESC_REGEX.test(rawType)) {
      // Allow real named heritage / tourist sites even if Wiki summary mentions "in <city>"
      if (!GENUINE_LANDMARK_SIGNAL_REGEX.test(cleanTitle) || /\b(school|college|library|commission|department|university|vishwavidyalaya)\b/i.test(`${desc} ${rawType}`)) {
        return true;
      }
    }
    if (!allowTransit && /\b(metro station|railway station|train station|bus stand|bus depot|bus terminal|airport|expressway|highway)\b/i.test(combined)) {
      return true;
    }
    if (/\b(development authority|vidhan bhavan|legislative assembly|election commission|medical university|vishwavidyalaya|diocese|darul uloom|subdivision|constituency|municipal corporation|public library|vidya mandir)\b/i.test(combined)) {
      return true;
    }
    return false;
  };

  const isGenuineVisitorLandmark = (
    title: string,
    desc = '',
    rawType = '',
    gmpTypes: string[] = []
  ): boolean => {
    if (isNonLandmarkAdminOrTransit(title, desc, rawType, false)) return false;

    const validGmpTypes = new Set([
      'tourist_attraction',
      'historical_landmark',
      'historical_place',
      'cultural_landmark',
      'hindu_temple',
      'place_of_worship',
      'museum',
      'art_gallery',
      'park',
      'national_park',
      'zoo',
      'aquarium',
      'botanical_garden',
      'monument',
      'beach',
      'natural_feature',
      'wildlife_park',
      'wildlife_refuge',
      'scenic_spot',
      'observation_deck',
    ]);
    if (gmpTypes.some((t) => validGmpTypes.has(t))) {
      return true;
    }

    const combined = `${title} ${desc} ${rawType}`;
    return GENUINE_LANDMARK_SIGNAL_REGEX.test(combined);
  };

  const BAD_IMAGE_REGEX =
    /flag_of|map|locator|location_dot|coat_of_arms|emblem|seal|logo|icon|diagram|plan|blueprint|schematic|route_map|metro_map|railway|poster|banner|stamp|signature|inscription|ticket|placeholder|\.svg(\?|$)/i;

  const isValidAttractionPhoto = (
    url: string | undefined | null,
    width?: number,
    height?: number
  ): url is string => {
    if (!url || typeof url !== 'string') return false;
    if (BAD_IMAGE_REGEX.test(url)) return false;
    if (typeof width === 'number' && typeof height === 'number') {
      if (width < 320 || height < 200) return false;
      // Reject extreme vertical skyscraper/tower strips that crop awkwardly in 16:10 horizontal cards
      if (height / Math.max(1, width) > 1.38) return false;
    }
    return true;
  };

  const COMMONS_STOPWORDS = new Set([
    'india',
    'indian',
    'temple',
    'mandir',
    'masjid',
    'mosque',
    'palace',
    'mahal',
    'fort',
    'park',
    'garden',
    'lake',
    'beach',
    'museum',
    'state',
    'national',
    'memorial',
    'monument',
    'historic',
    'heritage',
    'tourist',
    'attraction',
    'sanctuary',
    'wildlife',
    'centre',
    'center',
    'lucknow',
    'jaipur',
    'udaipur',
    'puri',
    'delhi',
    'mumbai',
    'kolkata',
    'chennai',
    'varanasi',
    'agra',
  ]);

  const resolveWikimediaCommonsPhoto = async (
    placeName: string,
    cityName: string,
    usedImages: Set<string>
  ): Promise<string | null> => {
    try {
      const cleanName = placeName.replace(/\([^)]*\)/g, '').split(',')[0].trim();
      const words = cleanName
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length >= 4);
      const distinctive = words.filter((w) => !COMMONS_STOPWORDS.has(w));
      const searchStr = distinctive.length > 0 ? cleanName : `${cleanName} ${cityName}`.trim();

      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 3200);
      const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(
        searchStr
      )}&gsrlimit=6&prop=imageinfo&iiprop=url|size|mime&iiurlwidth=960&format=json`;
      const r = await fetch(url, {
        headers: { 'User-Agent': 'YatraSaathiTravelIntelligence/1.0 (https://yatrasaathi.in)' },
        signal: ctrl.signal,
      });
      clearTimeout(t);
      if (!r.ok) return null;

      const json = (await r.json()) as {
        query?: {
          pages?: Record<
            string,
            {
              title: string;
              imageinfo?: Array<{
                url?: string;
                thumburl?: string;
                width?: number;
                height?: number;
                mime?: string;
              }>;
            }
          >;
        };
      };

      const pages = Object.values(json.query?.pages || {});
      for (const page of pages) {
        const info = page.imageinfo?.[0];
        if (!info || !info.mime || !/^image\/(jpeg|jpg|png|webp)$/i.test(info.mime)) continue;
        const candidateUrl = info.thumburl || info.url;
        if (!isValidAttractionPhoto(candidateUrl, info.width, info.height)) continue;
        if (usedImages.has(candidateUrl)) continue;

        const fileTitleLower = page.title.toLowerCase();
        // Verify filename actually refers to this landmark (prevent random mismatched photos)
        if (distinctive.length > 0) {
          const matchesDistinctive = distinctive.some((kw) => fileTitleLower.includes(kw));
          if (!matchesDistinctive) continue;
        } else if (cityName && !fileTitleLower.includes(cityName.toLowerCase())) {
          continue;
        }

        usedImages.add(candidateUrl);
        return candidateUrl;
      }
      return null;
    } catch {
      return null;
    }
  };

  interface WikiPageData {
    pageid: number;
    title: string;
    description?: string;
    extract?: string;
    thumbnail?: { source?: string; width?: number; height?: number };
    coordinates?: Array<{ lat: number; lon: number }>;
  }

  const fetchWikiCategoryPages = async (
    categoryTitle: string,
    includeSubcats = false
  ): Promise<{ pages: WikiPageData[]; subcats: string[] }> => {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 3800);
      const gcmtype = includeSubcats ? 'page|subcat' : 'page';
      const url = `https://en.wikipedia.org/w/api.php?action=query&generator=categorymembers&gcmtitle=${encodeURIComponent(
        categoryTitle
      )}&gcmlimit=45&gcmtype=${gcmtype}&prop=coordinates|pageimages|extracts|description&colimit=45&pilimit=45&exlimit=20&piprop=thumbnail&pithumbsize=960&exintro=1&explaintext=1&exsentences=2&format=json`;
      const r = await fetch(url, {
        headers: { 'User-Agent': 'YatraSaathiTravelIntelligence/1.0 (https://yatrasaathi.in)' },
        signal: ctrl.signal,
      });
      clearTimeout(t);
      if (!r.ok) return { pages: [], subcats: [] };
      const json = (await r.json()) as {
        query?: { pages?: Record<string, WikiPageData & { ns?: number }> };
      };
      const all = Object.values(json.query?.pages || {});
      const subcats = all
        .filter((p) => p.ns === 14 && p.title.startsWith('Category:'))
        .map((p) => p.title);
      const pages = all.filter((p) => p.ns !== 14);
      return { pages, subcats };
    } catch {
      return { pages: [], subcats: [] };
    }
  };

  // Detect known Indian city from query text or coordinate bias
  const resolveKnownCity = (queryText: string, biasLat?: number, biasLng?: number): string => {
    const qNorm = queryText.toLowerCase().trim();
    const sortedCities = [...new Set(INDIAN_TRANSIT_HUBS.map((h) => h.city))].sort(
      (a, b) => b.length - a.length
    );
    for (const c of sortedCities) {
      const escaped = c.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (new RegExp(`\\b${escaped}\\b`, 'i').test(qNorm)) {
        return c;
      }
    }
    if (Number.isFinite(biasLat) && Number.isFinite(biasLng)) {
      let bestCity = '';
      let bestDist = 45;
      for (const h of INDIAN_TRANSIT_HUBS) {
        const d = haversineKm(biasLat as number, biasLng as number, h.lat, h.lng);
        if (d < bestDist) {
          bestDist = d;
          bestCity = h.city;
        }
      }
      if (bestCity) return bestCity;
    }
    return '';
  };

  // India-Wide Category-Strict Place Autocomplete (station | bus | airport | landmark | hotel | address | all)
  app.get('/api/places/suggest', async (req: Request, res: Response) => {
    const query = String(req.query.q || '').trim();
    const stateFilter = String(req.query.state || '').trim();
    const kind = String(req.query.kind || 'all').trim().toLowerCase();
    const biasLat = Number(req.query.biasLat);
    const biasLng = Number(req.query.biasLng);

    interface SuggestResult {
      id: string;
      label: string;
      subtitle: string;
      city: string;
      state: string;
      stationCode?: string;
      placeType: string;
      lat: number;
      lng: number;
      groundTip?: string;
      rating?: number;
      userRatingCount?: number;
      openingHours?: string;
      source: string;
    }

    const qLower = query.toLowerCase();
    const stateLower = stateFilter.toLowerCase();
    const isTransitKind = kind === 'station' || kind === 'bus' || kind === 'airport';
    const isArrivalAll = kind === 'all';
    const isLandmarkKind = kind === 'landmark';
    const isHotelKind = kind === 'hotel';

    // 1. Indian Transit Index — ONLY included when searching transit hubs (station / bus / airport) or Arrival "Other Location" (all).
    // NEVER included for Temple / Landmark, Hotel / Stay, or Custom Address!
    const hubMatches: SuggestResult[] =
      isTransitKind || isArrivalAll
        ? INDIAN_TRANSIT_HUBS.filter((hub) => {
            if (stateLower && hub.state.toLowerCase() !== stateLower) {
              if (!qLower || qLower.length < 3) return false;
              const codeExact = hub.stationCode?.toLowerCase() === qLower;
              if (!codeExact && !hub.name.toLowerCase().includes(qLower) && !hub.city.toLowerCase().includes(qLower)) {
                return false;
              }
            }
            if (kind === 'station' && hub.type !== 'Railway Station') return false;
            if (kind === 'bus' && hub.type !== 'Bus Stand') return false;
            if (kind === 'airport' && hub.type !== 'Airport') return false;
            if (!qLower) return true;
            return (
              hub.name.toLowerCase().includes(qLower) ||
              hub.city.toLowerCase().includes(qLower) ||
              hub.state.toLowerCase().includes(qLower) ||
              (hub.stationCode && hub.stationCode.toLowerCase().includes(qLower))
            );
          }).map((hub) => ({
            id: hub.id,
            label: hub.stationCode && !hub.stationCode.includes('-') ? `${hub.name} (${hub.stationCode})` : hub.name,
            subtitle: `${hub.type} · ${hub.city}, ${hub.state}`,
            city: hub.city,
            state: hub.state,
            stationCode: hub.stationCode,
            placeType: hub.type,
            lat: hub.lat,
            lng: hub.lng,
            groundTip: hub.groundTip,
            source: 'Indian Transit Index',
          }))
        : [];

    // Early return on focus (< 2 chars) for station/bus/airport/all
    if (query.length < 2 && (isTransitKind || isArrivalAll)) {
      res.json({ suggestions: hubMatches.slice(0, 8) });
      return;
    }

    const hasBias = Number.isFinite(biasLat) && Number.isFinite(biasLng);
    const stateAnchor = INDIA_STATES_AND_UTS.find((s) => s.name.toLowerCase() === stateLower);
    const focusLat = hasBias ? biasLat : stateAnchor?.lat ?? null;
    const focusLng = hasBias ? biasLng : stateAnchor?.lng ?? null;
    const gmpKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;

    // Focus suggestions (< 2 chars) for Temple / Landmark or Hotel / Stay
    if (query.length < 2) {
      if (isLandmarkKind && focusLat !== null && focusLng !== null) {
        let cityAnchor = resolveKnownCity('', focusLat, focusLng);
        if (!cityAnchor && stateAnchor?.capital) {
          cityAnchor = stateAnchor.capital;
        }
        if (!cityAnchor) {
          try {
            const revCtrl = new AbortController();
            const revT = setTimeout(() => revCtrl.abort(), 2000);
            const revRes = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${focusLat}&lon=${focusLng}&zoom=10`,
              {
                headers: { 'User-Agent': 'YatraSaathiTravelIntelligence/1.0', Accept: 'application/json' },
                signal: revCtrl.signal,
              }
            );
            clearTimeout(revT);
            if (revRes.ok) {
              const revJson = (await revRes.json()) as {
                address?: { city?: string; town?: string; state_district?: string };
              };
              cityAnchor =
                revJson.address?.city ||
                revJson.address?.town ||
                revJson.address?.state_district?.replace(/\s+district$/i, '') ||
                '';
            }
          } catch {
            // Optional reverse city detection
          }
        }

        const landmarkCandidates: SuggestResult[] = [];
        const tasks: Array<Promise<void>> = [];

        // A. Optional Google Places Nearby Search
        if (gmpKey) {
          tasks.push(
            (async () => {
              try {
                const ctrl = new AbortController();
                const t = setTimeout(() => ctrl.abort(), 2800);
                const gRes = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': gmpKey,
                    'X-Goog-FieldMask':
                      'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.userRatingCount,places.regularOpeningHours',
                  },
                  body: JSON.stringify({
                    includedTypes: [
                      'tourist_attraction',
                      'historical_landmark',
                      'hindu_temple',
                      'museum',
                      'park',
                    ],
                    maxResultCount: 10,
                    locationRestriction: {
                      circle: { center: { latitude: focusLat, longitude: focusLng }, radius: 22000 },
                    },
                  }),
                  signal: ctrl.signal,
                });
                clearTimeout(t);
                if (!gRes.ok) return;
                const gData = (await gRes.json()) as {
                  places?: Array<{
                    id: string;
                    displayName?: { text?: string };
                    formattedAddress?: string;
                    location?: { latitude?: number; longitude?: number };
                    types?: string[];
                    rating?: number;
                    userRatingCount?: number;
                    regularOpeningHours?: { weekdayDescriptions?: string[] };
                  }>;
                };
                for (const p of gData.places || []) {
                  if (!p.displayName?.text || !p.location?.latitude || !p.location?.longitude) continue;
                  if (!isGenuineVisitorLandmark(p.displayName.text, p.formattedAddress || '', '', p.types || [])) {
                    continue;
                  }
                  landmarkCandidates.push({
                    id: `gmp-nb-${p.id}`,
                    label: p.displayName.text,
                    subtitle: p.formattedAddress || `${cityAnchor || stateFilter || 'India'}`,
                    city: cityAnchor,
                    state: stateFilter || '',
                    placeType: (p.types?.[0] || 'Landmark').replace(/_/g, ' '),
                    lat: p.location.latitude,
                    lng: p.location.longitude,
                    rating: typeof p.rating === 'number' ? p.rating : undefined,
                    userRatingCount: typeof p.userRatingCount === 'number' ? p.userRatingCount : undefined,
                    openingHours: p.regularOpeningHours?.weekdayDescriptions?.[0],
                    source: 'Google Places',
                  });
                }
              } catch {
                // Silent fallback
              }
            })()
          );
        }

        // B. Wikipedia Categories for the destination city (real temples, monuments, palaces, museums, parks)
        if (cityAnchor) {
          const catNames = [
            `Category:Tourist attractions in ${cityAnchor}`,
            `Category:Temples in ${cityAnchor}`,
            `Category:Monuments and memorials in ${cityAnchor}`,
          ];
          for (const catTitle of catNames) {
            tasks.push(
              (async () => {
                const { pages } = await fetchWikiCategoryPages(catTitle, false);
                for (const p of pages) {
                  const coord = p.coordinates?.[0];
                  if (!coord) continue;
                  if (haversineKm(focusLat, focusLng, coord.lat, coord.lon) > 55) continue;
                  if (!isGenuineVisitorLandmark(p.title, p.description || p.extract || '', 'Landmark')) continue;
                  landmarkCandidates.push({
                    id: `wiki-cat-${p.pageid}`,
                    label: p.title,
                    subtitle: p.description || `${cityAnchor}${stateFilter ? `, ${stateFilter}` : ''}`,
                    city: cityAnchor,
                    state: stateFilter || '',
                    placeType: 'Landmark',
                    lat: coord.lat,
                    lng: coord.lon,
                    source: 'Verified Landmark Directory',
                  });
                }
              })()
            );
          }

          // C. Wikipedia targeted landmark query
          tasks.push(
            (async () => {
              try {
                const ctrl = new AbortController();
                const t = setTimeout(() => ctrl.abort(), 3200);
                const wUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
                  `${cityAnchor} temple monument palace fort museum park`
                )}&gsrlimit=18&prop=coordinates|description&colimit=18&format=json`;
                const r = await fetch(wUrl, {
                  headers: { 'User-Agent': 'YatraSaathiTravelIntelligence/1.0' },
                  signal: ctrl.signal,
                });
                clearTimeout(t);
                if (!r.ok) return;
                const j = (await r.json()) as {
                  query?: { pages?: Record<string, WikiPageData> };
                };
                for (const p of Object.values(j.query?.pages || {})) {
                  const coord = p.coordinates?.[0];
                  if (!coord) continue;
                  if (haversineKm(focusLat, focusLng, coord.lat, coord.lon) > 55) continue;
                  if (!isGenuineVisitorLandmark(p.title, p.description || '', 'Landmark')) continue;
                  landmarkCandidates.push({
                    id: `wiki-focus-${p.pageid}`,
                    label: p.title,
                    subtitle: p.description || `${cityAnchor}${stateFilter ? `, ${stateFilter}` : ''}`,
                    city: cityAnchor,
                    state: stateFilter || '',
                    placeType: 'Landmark',
                    lat: coord.lat,
                    lng: coord.lon,
                    source: 'Verified Landmark Directory',
                  });
                }
              } catch {
                // Ignore timeout
              }
            })()
          );
        }

        // D. Strictly filtered regional geosearch backup (only accepts true temples/monuments/palaces/parks/beaches)
        tasks.push(
          (async () => {
            try {
              const ctrl = new AbortController();
              const t = setTimeout(() => ctrl.abort(), 3200);
              const url = `https://en.wikipedia.org/w/api.php?action=query&generator=geosearch&ggscoord=${focusLat}|${focusLng}&ggsradius=10000&ggslimit=35&prop=coordinates|description&colimit=35&format=json`;
              const r = await fetch(url, {
                headers: { 'User-Agent': 'YatraSaathiTravelIntelligence/1.0' },
                signal: ctrl.signal,
              });
              clearTimeout(t);
              if (!r.ok) return;
              const j = (await r.json()) as {
                query?: { pages?: Record<string, WikiPageData> };
              };
              for (const p of Object.values(j.query?.pages || {})) {
                const coord = p.coordinates?.[0];
                if (!coord) continue;
                if (!isGenuineVisitorLandmark(p.title, p.description || '', 'Landmark')) continue;
                landmarkCandidates.push({
                  id: `wiki-lm-${p.pageid}`,
                  label: p.title,
                  subtitle: p.description || `${cityAnchor || stateFilter || 'India'} Landmark`,
                  city: cityAnchor,
                  state: stateFilter || '',
                  placeType: 'Landmark',
                  lat: coord.lat,
                  lng: coord.lon,
                  source: 'Verified Landmark Directory',
                });
              }
            } catch {
              // Ignore timeout
            }
          })()
        );

        await Promise.all(tasks);

        // Deduplicate & rank genuine nearby landmarks by verified category importance + proximity
        const uniqueFocus: SuggestResult[] = [];
        for (const item of landmarkCandidates) {
          const norm = item.label.toLowerCase().trim();
          const exists = uniqueFocus.some(
            (e) => e.label.toLowerCase().trim() === norm || haversineKm(e.lat, e.lng, item.lat, item.lng) < 0.25
          );
          if (!exists) uniqueFocus.push(item);
        }
        const focusPriorityOffset = (item: SuggestResult): number => {
          if (item.source === 'Google Places') return -30;
          if (item.id.startsWith('wiki-cat-')) return -25;
          if (item.id.startsWith('wiki-focus-')) return -15;
          return 15;
        };
        uniqueFocus.sort((a, b) => {
          return (
            haversineKm(focusLat, focusLng, a.lat, a.lng) + focusPriorityOffset(a) -
            (haversineKm(focusLat, focusLng, b.lat, b.lng) + focusPriorityOffset(b))
          );
        });

        res.json({ suggestions: uniqueFocus.slice(0, 10) });
        return;
      }

      if (isHotelKind && focusLat !== null && focusLng !== null) {
        try {
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), 3500);
          const viewbox = `${(focusLng - 0.12).toFixed(4)},${(focusLat + 0.12).toFixed(4)},${(focusLng + 0.12).toFixed(4)},${(focusLat - 0.12).toFixed(4)}`;
          const r = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&limit=8&bounded=1&viewbox=${viewbox}&addressdetails=1&q=hotel`,
            {
              headers: { 'User-Agent': 'YatraSaathiTravelIntelligence/1.0', Accept: 'application/json' },
              signal: ctrl.signal,
            }
          );
          clearTimeout(t);
          if (r.ok) {
            const rows = (await r.json()) as Array<{
              place_id: number;
              name?: string;
              display_name: string;
              lat: string;
              lon: string;
              type?: string;
              address?: { city?: string; town?: string; state?: string };
            }>;
            const hotels: SuggestResult[] = rows
              .filter((row) => row.name && !/station|bus stand|airport/i.test(row.name))
              .map((row) => {
                const parts = row.display_name.split(',').map((s) => s.trim());
                return {
                  id: `osm-ht-${row.place_id}`,
                  label: row.name || parts[0],
                  subtitle: parts.slice(1, 4).join(', '),
                  city: row.address?.city || row.address?.town || '',
                  state: row.address?.state || stateFilter || '',
                  placeType: (row.type || 'Hotel').replace(/_/g, ' '),
                  lat: Number(row.lat),
                  lng: Number(row.lon),
                  source: 'OpenStreetMap Stays',
                };
              });
            res.json({ suggestions: hotels });
            return;
          }
        } catch {
          // Fall through cleanly
        }
      }

      res.json({ suggestions: [] });
      return;
    }

    const externalResults: SuggestResult[] = [];
    const matchedCityInQuery = isLandmarkKind ? resolveKnownCity(query) : '';
    const isCityWideLandmarkQuery =
      isLandmarkKind &&
      Boolean(matchedCityInQuery) &&
      (qLower === matchedCityInQuery.toLowerCase() ||
        /\b(places|attractions|landmarks|temples|monuments|visit|sightseeing|famous)\b/i.test(qLower));

    // Strict post-filter to guarantee category relevance
    const matchesSelectedCategory = (item: SuggestResult): boolean => {
      const text = `${item.label} ${item.placeType} ${item.subtitle}`.toLowerCase();
      const userExplicitStation = /\b(railway station|junction|terminus|train station|bus stand|isbt|airport)\b/i.test(qLower);

      if (kind === 'station') {
        if (!/\bairport\b/i.test(qLower) && /\bairport\b/i.test(text)) return false;
        return /\b(railway|train|station|junction|terminus|halt|central|cantt|rail)\b/i.test(text);
      }
      if (kind === 'bus') {
        if (/\brailway station\b/i.test(text)) return false;
        return /\b(bus|isbt|terminal|stand|depot)\b/i.test(text);
      }
      if (kind === 'airport') {
        return /\b(airport|aerodrome|aviation|airfield|terminal)\b/i.test(text);
      }
      if (kind === 'landmark') {
        const labelLower = item.label.toLowerCase().trim();
        if (labelLower === stateLower || labelLower === qLower && Boolean(matchedCityInQuery)) return false;
        if (labelLower.includes('(city)')) return false;
        return isGenuineVisitorLandmark(item.label, item.subtitle, item.placeType);
      }
      if (kind === 'hotel') {
        if (!userExplicitStation && /\b(railway station|train station|bus stand|bus terminal|isbt|airport)\b/i.test(text)) {
          return false;
        }
        return /\b(hotel|resort|guest|lodge|inn|stay|homestay|hostel|motel|palace|cottage|villa|dharamshala|haveli|retreat|ashram|suites|residency|lodging|tourism)\b/i.test(
          text
        );
      }
      return true;
    };

    // 2. Google Places API (New) Text Search with Category-Specific includedType
    if (gmpKey) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3000);
        const typeHint =
          kind === 'station'
            ? 'railway station'
            : kind === 'bus'
            ? 'bus stand terminal'
            : kind === 'airport'
            ? 'airport'
            : kind === 'landmark'
            ? 'temple monument palace fort tourist attraction'
            : kind === 'hotel'
            ? 'hotel resort homestay lodge'
            : '';
        const includedTypeMap: Record<string, string | undefined> = {
          station: 'train_station',
          bus: 'bus_station',
          airport: 'airport',
          landmark: 'tourist_attraction',
          hotel: 'lodging',
        };
        const textQuery = [query, typeHint, stateFilter, 'India'].filter(Boolean).join(' ');
        const body: Record<string, unknown> = {
          textQuery,
          regionCode: 'IN',
          languageCode: 'en',
          maxResultCount: 10,
        };
        if (includedTypeMap[kind]) {
          body.includedType = includedTypeMap[kind];
        }
        if (hasBias) {
          body.locationBias = {
            circle: {
              center: { latitude: biasLat, longitude: biasLng },
              radius: 50000,
            },
          };
        }
        const gRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': gmpKey,
            'X-Goog-FieldMask':
              'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.addressComponents,places.rating,places.userRatingCount,places.regularOpeningHours',
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        clearTimeout(timer);

        if (gRes.ok) {
          const gData = (await gRes.json()) as {
            places?: Array<{
              id: string;
              displayName?: { text?: string };
              formattedAddress?: string;
              location?: { latitude?: number; longitude?: number };
              types?: string[];
              addressComponents?: Array<{ longText?: string; types?: string[] }>;
              rating?: number;
              userRatingCount?: number;
              regularOpeningHours?: { weekdayDescriptions?: string[] };
            }>;
          };
          for (const p of gData.places || []) {
            if (!p.location?.latitude || !p.location?.longitude || !p.displayName?.text) continue;
            const cityComp = p.addressComponents?.find(
              (c) => c.types?.includes('locality') || c.types?.includes('administrative_area_level_2')
            );
            const stateComp = p.addressComponents?.find((c) =>
              c.types?.includes('administrative_area_level_1')
            );
            if (
              kind === 'landmark' &&
              !isGenuineVisitorLandmark(p.displayName.text, p.formattedAddress || '', '', p.types || [])
            ) {
              continue;
            }
            const candidate: SuggestResult = {
              id: `gmp-${p.id}`,
              label: p.displayName.text,
              subtitle: p.formattedAddress || [cityComp?.longText, stateComp?.longText].filter(Boolean).join(', '),
              city: cityComp?.longText || matchedCityInQuery || '',
              state: stateComp?.longText || stateFilter || '',
              placeType: (p.types?.[0] || kind).replace(/_/g, ' '),
              lat: p.location.latitude,
              lng: p.location.longitude,
              rating: typeof p.rating === 'number' ? p.rating : undefined,
              userRatingCount: typeof p.userRatingCount === 'number' ? p.userRatingCount : undefined,
              openingHours: p.regularOpeningHours?.weekdayDescriptions?.[0],
              source: 'Google Places',
            };
            if (matchesSelectedCategory(candidate)) {
              externalResults.push(candidate);
            }
          }
        }
      } catch {
        // Fallback below
      }
    }

    // 3A. Wikipedia City Category + Targeted Landmark Search when kind === 'landmark'
    if (isLandmarkKind && externalResults.length < 7) {
      const wikiTasks: Array<Promise<void>> = [];

      if (isCityWideLandmarkQuery && matchedCityInQuery) {
        const catTitles = [
          `Category:Tourist attractions in ${matchedCityInQuery}`,
          `Category:Temples in ${matchedCityInQuery}`,
          `Category:Monuments and memorials in ${matchedCityInQuery}`,
        ];
        for (const ct of catTitles) {
          wikiTasks.push(
            (async () => {
              const { pages } = await fetchWikiCategoryPages(ct, false);
              for (const p of pages) {
                const coord = p.coordinates?.[0];
                if (!coord) continue;
                if (coord.lat < 6 || coord.lat > 38 || coord.lon < 68 || coord.lon > 98) continue;
                const candidate: SuggestResult = {
                  id: `wiki-cat-${p.pageid}`,
                  label: p.title,
                  subtitle: p.description || `${matchedCityInQuery} · Landmark`,
                  city: matchedCityInQuery,
                  state: stateFilter || '',
                  placeType: p.description || 'Landmark',
                  lat: coord.lat,
                  lng: coord.lon,
                  source: 'Verified Landmark Directory',
                };
                if (matchesSelectedCategory(candidate)) {
                  externalResults.push(candidate);
                }
              }
            })()
          );
        }
      }

      const searchQueries = isCityWideLandmarkQuery
        ? [
            `${matchedCityInQuery} tourist attractions temple palace fort monument museum park`,
            `${matchedCityInQuery} famous temples heritage sites`,
          ]
        : [
            stateFilter && !qLower.includes(stateLower)
              ? `${query} ${stateFilter} temple monument palace fort heritage`
              : `${query} landmark temple monument`,
            query,
          ];

      for (const sq of searchQueries) {
        wikiTasks.push(
          (async () => {
            try {
              const ctrl = new AbortController();
              const t = setTimeout(() => ctrl.abort(), 3200);
              const wUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
                sq
              )}&gsrlimit=14&prop=coordinates|description&colimit=14&format=json`;
              const wRes = await fetch(wUrl, {
                headers: { 'User-Agent': 'YatraSaathiTravelIntelligence/1.0' },
                signal: ctrl.signal,
              });
              clearTimeout(t);
              if (!wRes.ok) return;
              const wJson = (await wRes.json()) as {
                query?: { pages?: Record<string, WikiPageData> };
              };
              for (const p of Object.values(wJson.query?.pages || {})) {
                const coord = p.coordinates?.[0];
                if (!coord) continue;
                if (coord.lat < 6 || coord.lat > 38 || coord.lon < 68 || coord.lon > 98) continue;
                const candidate: SuggestResult = {
                  id: `wiki-search-${p.pageid}`,
                  label: p.title,
                  subtitle: p.description || [matchedCityInQuery || stateFilter || 'India', 'Landmark'].join(' · '),
                  city: matchedCityInQuery || '',
                  state: stateFilter || '',
                  placeType: p.description || 'Landmark',
                  lat: coord.lat,
                  lng: coord.lon,
                  source: 'Verified Landmark Directory',
                };
                if (matchesSelectedCategory(candidate)) {
                  externalResults.push(candidate);
                }
              }
            } catch {
              // Ignore transient timeout
            }
          })()
        );
      }

      await Promise.all(wikiTasks);
    }

    // 3B. OpenStreetMap Nominatim (India-wide category-scoped search)
    if (externalResults.length < 7) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3800);

        const buildOsmQuery = (): string => {
          if (kind === 'station' && !/station|junction|terminus/i.test(qLower)) {
            return `${query} railway station`;
          }
          if (kind === 'bus' && !/bus|isbt|stand/i.test(qLower)) {
            return `${query} bus stand`;
          }
          if (kind === 'airport' && !/airport/i.test(qLower)) {
            return `${query} airport`;
          }
          if (kind === 'hotel' && !/hotel|resort|guest|lodge|hostel|stay/i.test(qLower)) {
            return `${query} hotel`;
          }
          if (isCityWideLandmarkQuery && matchedCityInQuery) {
            return `temple monument attraction in ${matchedCityInQuery}`;
          }
          return query;
        };

        const baseQ = buildOsmQuery();
        const scopedQuery = stateFilter && !qLower.includes(stateLower) ? `${baseQ}, ${stateFilter}, India` : baseQ;
        const viewboxParam =
          hasBias && (kind === 'hotel' || kind === 'landmark')
            ? `&viewbox=${(biasLng - 0.6).toFixed(3)},${(biasLat + 0.6).toFixed(3)},${(biasLng + 0.6).toFixed(3)},${(biasLat - 0.6).toFixed(3)}`
            : '';

        const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&limit=12&addressdetails=1${viewboxParam}&q=${encodeURIComponent(
          scopedQuery
        )}`;
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'YatraSaathiTravelIntelligence/1.0 (https://yatrasaathi.in)',
            Accept: 'application/json',
          },
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (response.ok) {
          const rows = (await response.json()) as Array<{
            place_id: number;
            display_name: string;
            lat: string;
            lon: string;
            name?: string;
            type?: string;
            class?: string;
            address?: {
              city?: string;
              town?: string;
              village?: string;
              county?: string;
              state_district?: string;
              state?: string;
            };
          }>;
          for (const row of rows) {
            const lat = Number(row.lat);
            const lng = Number(row.lon);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
            const parts = row.display_name.split(',').map((s) => s.trim());
            const shortTitle = row.name || parts[0] || row.display_name;
            const cityVal =
              row.address?.city ||
              row.address?.town ||
              row.address?.village ||
              row.address?.state_district ||
              parts[1] ||
              '';
            const stateVal = row.address?.state || stateFilter || '';
            const subtitle = parts.slice(1, 4).join(', ');
            const rawPlaceType = (row.type || row.class || 'Location').replace(/_/g, ' ');
            // For landmark searches, skip OSM road/highway/suburb/administrative classes
            if (isLandmarkKind && row.class && /^(highway|boundary|place|railway)$/i.test(row.class)) {
              continue;
            }
            const candidate: SuggestResult = {
              id: `osm-${row.place_id}`,
              label: shortTitle,
              subtitle,
              city: cityVal.replace(/ district$/i, ''),
              state: stateVal,
              placeType: rawPlaceType,
              lat,
              lng,
              source: isHotelKind ? 'OpenStreetMap Stays' : 'OpenStreetMap India',
            };
            if (matchesSelectedCategory(candidate)) {
              externalResults.push(candidate);
            }
          }
        }
      } catch {
        // Ignore transient network timeout
      }
    }

    // Anchor coordinates for city-wide typed searches (e.g., searching "Lucknow" or "Jaipur" in landmark field)
    const cityHubAnchor = matchedCityInQuery
      ? INDIAN_TRANSIT_HUBS.find((h) => h.city.toLowerCase() === matchedCityInQuery.toLowerCase())
      : undefined;
    const rankAnchorLat = hasBias ? biasLat : cityHubAnchor?.lat;
    const rankAnchorLng = hasBias ? biasLng : cityHubAnchor?.lng;

    // For city-wide queries ("Lucknow", "Jaipur"), keep only landmarks actually in/near that city (~75 km)
    const scopedExternalResults =
      isCityWideLandmarkQuery && rankAnchorLat !== undefined && rankAnchorLng !== undefined
        ? externalResults.filter((item) => haversineKm(rankAnchorLat, rankAnchorLng, item.lat, item.lng) <= 75)
        : externalResults;

    // Score & rank cleanly for regional proximity & exact name relevance
    const scoreSuggest = (item: SuggestResult): number => {
      let score = 0;
      const lbl = item.label.toLowerCase();
      if (lbl === qLower) score += 60;
      else if (lbl.startsWith(qLower)) score += 35;
      else if (lbl.includes(qLower)) score += 20;

      if (item.source === 'Google Places') score += 22;
      if (item.id.startsWith('wiki-cat-')) score += 20;
      if (rankAnchorLat !== undefined && rankAnchorLng !== undefined) {
        const dist = haversineKm(rankAnchorLat, rankAnchorLng, item.lat, item.lng);
        if (dist <= 30) score += 50;
        else if (dist <= 80) score += 25;
        else if (dist > 250) score -= 50;
      }
      return score;
    };

    scopedExternalResults.sort((a, b) => scoreSuggest(b) - scoreSuggest(a));

    // Deduplicate combined results
    const combined: SuggestResult[] = [];
    const seen = new Set<string>();
    for (const item of [...hubMatches, ...scopedExternalResults]) {
      const norm = item.label.toLowerCase().replace(/\s*\([A-Z0-9-]+\)\s*$/, '').trim();
      const duplicateCoord = combined.some(
        (existing) =>
          existing.label.toLowerCase().replace(/\s*\([A-Z0-9-]+\)\s*$/, '').trim() === norm ||
          (haversineKm(existing.lat, existing.lng, item.lat, item.lng) < 0.35 &&
            existing.label.slice(0, 8).toLowerCase() === item.label.slice(0, 8).toLowerCase())
      );
      if (!duplicateCoord && !seen.has(item.id)) {
        seen.add(item.id);
        combined.push(item);
      }
    }

    res.json({ suggestions: combined.slice(0, 10) });
  });

  // Server-side proxy for Google Places photos (never exposes API key to client)
  app.get('/api/places/photo', async (req: Request, res: Response) => {
    const name = String(req.query.name || '').trim();
    const gmpKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!name || !gmpKey || !name.startsWith('places/')) {
      res.status(404).end();
      return;
    }
    try {
      const url = `https://places.googleapis.com/v1/${name}/media?maxWidthPx=1000&key=${encodeURIComponent(gmpKey)}`;
      const upstream = await fetch(url);
      if (!upstream.ok) {
        res.status(404).end();
        return;
      }
      const contentType = upstream.headers.get('content-type') || 'image/jpeg';
      const buf = Buffer.from(await upstream.arrayBuffer());
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(buf);
    } catch {
      res.status(404).end();
    }
  });

  // In-memory cache for India-wide regional attraction discovery
  const discoverCache = new Map<string, { expiresAt: number; payload: unknown }>();

  // India-Wide Regional Attraction Discovery (Wikipedia Categories + Targeted Landmark Search + Wikimedia Commons + Places API New)
  app.get('/api/travel-assist/discover', async (req: Request, res: Response) => {
    const city = String(req.query.city || '').trim();
    const state = String(req.query.state || '').trim();
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const pickupLat = Number(req.query.pickupLat);
    const pickupLng = Number(req.query.pickupLng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      res.status(400).json({ error: 'Valid destination coordinates (lat, lng) are required.' });
      return;
    }

    const refPickup =
      Number.isFinite(pickupLat) && Number.isFinite(pickupLng)
        ? { lat: pickupLat, lng: pickupLng }
        : { lat, lng };

    const resolvedCity = city || resolveKnownCity('', lat, lng);
    const cacheKey = `v3|${resolvedCity.toLowerCase()}|${state.toLowerCase()}|${lat.toFixed(2)},${lng.toFixed(2)}`;
    const cached = discoverCache.get(cacheKey);

    interface RawAttraction {
      id: string;
      name: string;
      category:
        | 'Popular Places'
        | 'Temples & Heritage'
        | 'Nature & Beaches'
        | 'Cafe Corner'
        | 'Adventure & Experiences'
        | 'Museums & Culture'
        | 'Hidden Gems';
      rawType: string;
      location: string;
      lat: number;
      lng: number;
      image: string | null;
      shortDescription: string;
      bestVisitingTime: string;
      rating?: number;
      userRatingCount?: number;
      openingHours?: string;
      source: string;
      sourceUrl?: string;
    }

    let baseAttractions: RawAttraction[] | null = null;
    if (cached && cached.expiresAt > Date.now()) {
      baseAttractions = cached.payload as RawAttraction[];
    }

    if (!baseAttractions) {
      function classifyAttraction(
        title: string,
        desc: string,
        rawType: string,
        distFromCenterKm: number
      ): RawAttraction['category'] {
        const titleLower = title.toLowerCase();
        const combined = `${title} ${rawType} ${desc}`.toLowerCase();

        if (
          /\b(cafe|café|coffee|bakery|tea house|roastery|bistro|patisserie|confectionery|sweet house|chai|eatery|ice cream)\b/i.test(
            `${titleLower} ${rawType}`
          )
        ) {
          return 'Cafe Corner';
        }
        if (
          /\b(boating|boat club|water sport|water sports|rafting|paragliding|trek|trekking|safari|wildlife sanctuary|national park|biosphere|marine drive|ropeway|cable car|kayaking|surfing|zip line|bungee|adventure|diving|snorkeling|marina|backwater cruise|water park|viewpoint)\b/i.test(
            `${titleLower} ${rawType}`
          )
        ) {
          return 'Adventure & Experiences';
        }
        if (
          /\b(craft|artist village|museum|gallery|planetarium|science city|handicraft|raghurajpur|cultural|amphitheatre|auditorium)\b/i.test(
            `${titleLower} ${rawType}`
          )
        ) {
          return 'Museums & Culture';
        }
        if (
          /\b(temple|mandir|masjid|mosque|imambara|church|cathedral|basilica|gurudwara|gurdwara|monastery|pagoda|stupa|math|matha|fort|quila|kila|palace|mahal|haveli|kothi|manzil|tomb|makbara|darwaza|residency|stepwell|kund|ruins|heritage|monument|memorial|ashram|clock tower|ghat)\b/i.test(
            `${titleLower} ${rawType}`
          )
        ) {
          return 'Temples & Heritage';
        }
        if (
          /\b(beach|lake|sagar|sarovar|lagoon|riverfront|waterfall|falls|hill|peak|garden|bagh|park|zoo|prani udyan|zoological|sanctuary|wildlife|cave|springs|valley|island|botanical|reserve|seafront)\b/i.test(
            `${titleLower} ${rawType}`
          )
        ) {
          return 'Nature & Beaches';
        }

        if (/\b(cafe|coffee house|bakery|tea room|roastery)\b/i.test(combined)) {
          return 'Cafe Corner';
        }
        if (/\b(boating|water sports|trekking|paragliding|river rafting|safari park|adventure|ropeway)\b/i.test(combined)) {
          return 'Adventure & Experiences';
        }
        if (/\b(museum|craft|gallery|cultural|planetarium|observatory)\b/i.test(combined)) {
          return 'Museums & Culture';
        }
        if (/\b(temple|mandir|masjid|mosque|imambara|shrine|fort|palace|heritage|monument|memorial|tomb|darwaza|kothi)\b/i.test(combined)) {
          return 'Temples & Heritage';
        }
        if (/\b(beach|lake|lagoon|wildlife|sanctuary|waterfall|park|garden|botanical|zoo)\b/i.test(combined)) {
          return 'Nature & Beaches';
        }
        if (distFromCenterKm > 14) {
          return 'Hidden Gems';
        }
        return 'Popular Places';
      }

      function inferBestTime(category: RawAttraction['category'], title: string): string {
        const lower = title.toLowerCase();
        if (category === 'Cafe Corner') return 'Daytime & evenings · check local hours';
        if (category === 'Adventure & Experiences') return 'Daylight hours · verify weather';
        if (lower.includes('beach') || lower.includes('lake') || lower.includes('ghat')) {
          return 'Sunrise or sunset hours';
        }
        if (category === 'Museums & Culture') return 'Daytime hours · check weekly closure';
        if (category === 'Temples & Heritage') return 'Morning or early evening';
        return 'Daylight hours';
      }

      const cityLower = resolvedCity.toLowerCase();
      const stateLower = state.toLowerCase();
      const collected = new Map<string, RawAttraction>();

      const addCandidate = (item: RawAttraction, skipLandmarkStrict = false) => {
        const cleanTitle = item.name.trim();
        const titleLower = cleanTitle.toLowerCase();
        if (!cleanTitle || titleLower === cityLower || titleLower === `${cityLower} (city)` || titleLower === stateLower) return;

        if (!skipLandmarkStrict) {
          if (!isGenuineVisitorLandmark(cleanTitle, item.shortDescription, item.rawType)) {
            return;
          }
        } else {
          if (isNonLandmarkAdminOrTransit(cleanTitle, item.shortDescription, item.rawType, false)) {
            return;
          }
        }

        // Guard against Wikipedia coordinate typos tagging other major metros
        if (
          /,\s*(bengaluru|bangalore|kolkata|digha|chennai|mumbai|new delhi|hyderabad)$/i.test(cleanTitle) &&
          !cityLower.includes(cleanTitle.split(',').pop()!.trim().toLowerCase())
        ) {
          return;
        }

        const distKm = haversineKm(lat, lng, item.lat, item.lng);
        if (distKm > 75) return;

        const normKey = cleanTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
        const nearDuplicate = [...collected.values()].find(
          (e) =>
            e.name.toLowerCase().replace(/[^a-z0-9]/g, '') === normKey ||
            (haversineKm(e.lat, e.lng, item.lat, item.lng) < 0.18 && e.name.split(' ')[0] === cleanTitle.split(' ')[0])
        );
        if (!nearDuplicate) {
          collected.set(item.id, item);
        } else {
          if (!nearDuplicate.image && item.image) nearDuplicate.image = item.image;
          if (!nearDuplicate.rating && item.rating) {
            nearDuplicate.rating = item.rating;
            nearDuplicate.userRatingCount = item.userRatingCount;
            nearDuplicate.openingHours = item.openingHours;
          }
        }
      };

      const fetchWikiGeo = async (cLat: number, cLng: number): Promise<WikiPageData[]> => {
        try {
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), 5000);
          const url = `https://en.wikipedia.org/w/api.php?action=query&generator=geosearch&ggscoord=${cLat}|${cLng}&ggsradius=10000&ggslimit=35&prop=coordinates|pageimages|extracts|description&colimit=35&pilimit=35&exlimit=20&piprop=thumbnail&pithumbsize=960&exintro=1&explaintext=1&exsentences=2&format=json`;
          const r = await fetch(url, {
            headers: { 'User-Agent': 'YatraSaathiTravelIntelligence/1.0 (https://yatrasaathi.in)' },
            signal: ctrl.signal,
          });
          clearTimeout(t);
          if (!r.ok) return [];
          const json = (await r.json()) as { query?: { pages?: Record<string, WikiPageData> } };
          return Object.values(json.query?.pages || {});
        } catch {
          return [];
        }
      };

      const fetchWikiSearch = async (searchQuery: string): Promise<WikiPageData[]> => {
        try {
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), 5000);
          const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
            searchQuery
          )}&gsrlimit=20&prop=coordinates|pageimages|extracts|description&colimit=20&pilimit=20&exlimit=20&piprop=thumbnail&pithumbsize=960&exintro=1&explaintext=1&exsentences=2&format=json`;
          const r = await fetch(url, {
            headers: { 'User-Agent': 'YatraSaathiTravelIntelligence/1.0 (https://yatrasaathi.in)' },
            signal: ctrl.signal,
          });
          clearTimeout(t);
          if (!r.ok) return [];
          const json = (await r.json()) as { query?: { pages?: Record<string, WikiPageData> } };
          return Object.values(json.query?.pages || {});
        } catch {
          return [];
        }
      };

      const targetCityLabel = resolvedCity || state || 'Destination';
      const sweepCoords = [
        { lat, lng },
        { lat: lat + 0.16, lng: lng + 0.16 },
        { lat: lat - 0.16, lng: lng - 0.16 },
        { lat: lat + 0.08, lng: lng + 0.25 },
        { lat: lat - 0.08, lng: lng - 0.25 },
        { lat: lat + 0.26, lng: lng - 0.06 },
      ];

      const searchQueries = [
        `${targetCityLabel} tourist attractions places to visit`,
        `${targetCityLabel} temple palace fort monument darwaza imambara`,
        `${targetCityLabel} beach lake waterfall sanctuary park zoo garden`,
        `${targetCityLabel} museum heritage craft cultural observatory`,
        `${targetCityLabel} boating water sports safari trekking adventure`,
        state ? `${state} tourism attractions near ${targetCityLabel}` : `${targetCityLabel} tourism`,
      ];

      // Primary category lookups for this destination city
      const primaryCategoryTitles = resolvedCity
        ? [
            `Category:Tourist attractions in ${resolvedCity}`,
            `Category:Temples in ${resolvedCity}`,
            `Category:Monuments and memorials in ${resolvedCity}`,
            `Category:Museums in ${resolvedCity}`,
            `Category:Parks in ${resolvedCity}`,
          ]
        : [];

      // Fast-timeout Overpass lookup (2s) so slow public Overpass mirrors never block response
      const fetchOverpassSpots = async () => {
        try {
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), 2200);
          const query = `[out:json][timeout:2];(node["amenity"="cafe"]["name"](around:15000,${lat},${lng});node["shop"="bakery"]["name"](around:12000,${lat},${lng});node["leisure"~"marina|water_park|nature_reserve"]["name"](around:30000,${lat},${lng});node["tourism"="viewpoint"]["name"](around:25000,${lat},${lng}););out center 25;`;
          const r = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
              'User-Agent': 'YatraSaathiTravelIntelligence/1.0',
            },
            body: `data=${encodeURIComponent(query)}`,
            signal: ctrl.signal,
          });
          clearTimeout(t);
          if (!r.ok) return [];
          const json = (await r.json()) as {
            elements?: Array<{
              id: number;
              lat?: number;
              lon?: number;
              center?: { lat: number; lon: number };
              tags?: Record<string, string>;
            }>;
          };
          return json.elements || [];
        } catch {
          return [];
        }
      };

      const [catBatches, geoBatches, searchBatches, overpassSpots] = await Promise.all([
        Promise.all(primaryCategoryTitles.map((ct, idx) => fetchWikiCategoryPages(ct, idx === 0))),
        Promise.all(sweepCoords.map((pt) => fetchWikiGeo(pt.lat, pt.lng))),
        Promise.all(searchQueries.map((sq) => fetchWikiSearch(sq))),
        fetchOverpassSpots(),
      ]);

      // Fetch up to 4 relevant Wikipedia attraction subcategories (e.g. Imambaras, Palaces, Gardens, Forts, Beaches)
      const discoveredSubcats = [
        ...new Set(
          catBatches
            .flatMap((b) => b.subcats)
            .filter(
              (sc) =>
                /\b(temple|imambara|palace|fort|monument|memorial|museum|garden|park|lake|beach|ghat|heritage|building|tomb|zoo)\b/i.test(
                  sc
                ) &&
                !/\b(station|transport|sport|school|college|hospital|neighbourhood|suburb|road|district|people|politics|history)\b/i.test(
                  sc
                )
            )
        ),
      ].slice(0, 4);

      const subcatBatches =
        discoveredSubcats.length > 0
          ? await Promise.all(discoveredSubcats.map((sc) => fetchWikiCategoryPages(sc, false)))
          : [];

      // Track used thumbnail URLs so no two attraction cards ever display duplicate images
      const usedImages = new Set<string>();
      const allWikiPages = [
        ...catBatches.flatMap((b) => b.pages),
        ...subcatBatches.flatMap((b) => b.pages),
        ...searchBatches.flat(),
        ...geoBatches.flat(),
      ];

      for (const page of allWikiPages) {
        const coord = page.coordinates?.[0];
        if (!coord) continue;
        const distFromDest = haversineKm(lat, lng, coord.lat, coord.lon);
        if (distFromDest > 75) continue;

        const thumbSrc = page.thumbnail?.source;
        const validThumb = isValidAttractionPhoto(thumbSrc, page.thumbnail?.width, page.thumbnail?.height)
          ? thumbSrc
          : null;
        const uniqueThumb = validThumb && !usedImages.has(validThumb) ? validThumb : null;
        if (uniqueThumb) usedImages.add(uniqueThumb);

        const descText = (page.extract || page.description || '').replace(/\s+/g, ' ').trim();
        const rawType = page.description || '';
        const cat = classifyAttraction(page.title, descText, rawType, distFromDest);
        addCandidate({
          id: `wiki-${page.pageid}`,
          name: page.title,
          category: cat,
          rawType: rawType || cat,
          location: [targetCityLabel, state].filter(Boolean).join(', ') || 'India',
          lat: coord.lat,
          lng: coord.lon,
          image: uniqueThumb,
          shortDescription:
            descText.length > 190 ? `${descText.slice(0, 187).trim()}...` : descText || `${page.title} in ${targetCityLabel}.`,
          bestVisitingTime: inferBestTime(cat, page.title),
          source: 'Wikipedia & Wikimedia Commons',
          sourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/\s+/g, '_'))}`,
        });
      }

      // Add Cafe Corner & Adventure & Experiences items returned from OpenStreetMap Overpass
      let cafeCount = 0;
      let advCount = 0;
      for (const el of overpassSpots) {
        const pName = el.tags?.['name:en'] || el.tags?.name;
        const pLat = el.lat ?? el.center?.lat;
        const pLng = el.lon ?? el.center?.lon;
        if (!pName || !Number.isFinite(pLat) || !Number.isFinite(pLng)) continue;
        const amenity = el.tags?.amenity || '';
        const shop = el.tags?.shop || '';
        const leisure = el.tags?.leisure || '';
        const sport = el.tags?.sport || '';
        const tourism = el.tags?.tourism || '';

        let forcedCat: RawAttraction['category'] | null = null;
        let desc = '';
        if (amenity === 'cafe' || shop === 'bakery') {
          if (cafeCount >= 8) continue;
          forcedCat = 'Cafe Corner';
          const locality = el.tags?.['addr:street'] || el.tags?.['addr:suburb'] || targetCityLabel;
          desc = `Local ${shop === 'bakery' ? 'bakery & tea spot' : 'cafe'} in ${locality}. Check local hours before visiting.`;
          cafeCount += 1;
        } else if (leisure === 'marina' || leisure === 'water_park' || leisure === 'nature_reserve' || sport || tourism === 'viewpoint') {
          if (advCount >= 8) continue;
          forcedCat = 'Adventure & Experiences';
          desc = sport
            ? `Outdoor ${sport.replace(/;/g, ', ')} experience near ${targetCityLabel}.`
            : tourism === 'viewpoint'
            ? `Scenic viewpoint around ${targetCityLabel}.`
            : `${leisure.replace(/_/g, ' ')} outdoor destination near ${targetCityLabel}.`;
          advCount += 1;
        }

        if (!forcedCat) continue;
        addCandidate(
          {
            id: `ovp-${el.id}`,
            name: pName,
            category: forcedCat,
            rawType: amenity || leisure || sport || tourism || forcedCat,
            location: el.tags?.['addr:suburb'] || el.tags?.['addr:city'] || `${targetCityLabel}${state ? `, ${state}` : ''}`,
            lat: pLat as number,
            lng: pLng as number,
            image: null,
            shortDescription: desc,
            bestVisitingTime: inferBestTime(forcedCat, pName),
            source: 'OpenStreetMap Directory',
          },
          true
        );
      }

      // Optional Google Places API (New) enrichment when key is configured & Places API (New) is enabled
      const gmpKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
      if (gmpKey) {
        const gmpQueries: Array<{ textQuery: string; forcedCat?: RawAttraction['category'] }> = [
          { textQuery: `top tourist attractions temples monuments parks museums in ${targetCityLabel} ${state} India` },
        ];
        if (cafeCount < 5) {
          gmpQueries.push({
            textQuery: `cafes coffee houses in ${targetCityLabel} ${state} India`,
            forcedCat: 'Cafe Corner',
          });
        }
        if (advCount < 5) {
          gmpQueries.push({
            textQuery: `boating park viewpoint safari adventure in ${targetCityLabel} ${state} India`,
            forcedCat: 'Adventure & Experiences',
          });
        }

        await Promise.all(
          gmpQueries.map(async (gq) => {
            try {
              const ctrl = new AbortController();
              const t = setTimeout(() => ctrl.abort(), 2800);
              const gRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Goog-Api-Key': gmpKey,
                  'X-Goog-FieldMask':
                    'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.editorialSummary,places.photos,places.rating,places.userRatingCount,places.regularOpeningHours',
                },
                body: JSON.stringify({
                  textQuery: gq.textQuery,
                  regionCode: 'IN',
                  languageCode: 'en',
                  maxResultCount: gq.forcedCat ? 8 : 14,
                  locationBias: {
                    circle: { center: { latitude: lat, longitude: lng }, radius: 40000 },
                  },
                }),
                signal: ctrl.signal,
              });
              clearTimeout(t);
              if (!gRes.ok) return;
              const gJson = (await gRes.json()) as {
                places?: Array<{
                  id: string;
                  displayName?: { text?: string };
                  formattedAddress?: string;
                  location?: { latitude?: number; longitude?: number };
                  types?: string[];
                  editorialSummary?: { text?: string };
                  photos?: Array<{ name?: string }>;
                  rating?: number;
                  userRatingCount?: number;
                  regularOpeningHours?: { weekdayDescriptions?: string[] };
                }>;
              };
              for (const p of gJson.places || []) {
                if (!p.displayName?.text || !p.location?.latitude || !p.location?.longitude) continue;
                const distFromDest = haversineKm(lat, lng, p.location.latitude, p.location.longitude);
                if (
                  !gq.forcedCat &&
                  !isGenuineVisitorLandmark(p.displayName.text, p.editorialSummary?.text || '', '', p.types || [])
                ) {
                  continue;
                }
                const photoName = p.photos?.[0]?.name;
                const photoUrl = photoName ? `/api/places/photo?name=${encodeURIComponent(photoName)}` : null;
                if (photoUrl) usedImages.add(photoUrl);
                const cat =
                  gq.forcedCat ||
                  classifyAttraction(
                    p.displayName.text,
                    p.editorialSummary?.text || '',
                    (p.types || []).join(' '),
                    distFromDest
                  );
                addCandidate(
                  {
                    id: `gmp-${p.id}`,
                    name: p.displayName.text,
                    category: cat,
                    rawType: (p.types?.[0] || cat).replace(/_/g, ' '),
                    location: p.formattedAddress || `${targetCityLabel}, ${state}`,
                    lat: p.location.latitude,
                    lng: p.location.longitude,
                    image: photoUrl,
                    shortDescription:
                      p.editorialSummary?.text ||
                      `${cat === 'Cafe Corner' ? 'Local cafe & hangout' : 'Visitor destination'} in ${targetCityLabel}${state ? `, ${state}` : ''}.`,
                    bestVisitingTime: p.regularOpeningHours?.weekdayDescriptions?.[0] || inferBestTime(cat, p.displayName.text),
                    rating: typeof p.rating === 'number' ? p.rating : undefined,
                    userRatingCount: typeof p.userRatingCount === 'number' ? p.userRatingCount : undefined,
                    openingHours: p.regularOpeningHours?.weekdayDescriptions?.[0],
                    source: 'Google Places',
                  },
                  Boolean(gq.forcedCat)
                );
              }
            } catch {
              // Graceful fallback
            }
          })
        );
      }

      // OpenStreetMap Nominatim supplement for Cafe Corner & Adventure & Experiences (with bounded viewbox around destination!)
      const hasCafesNow = [...collected.values()].filter((c) => c.category === 'Cafe Corner').length >= 4;
      const hasAdvNow = [...collected.values()].filter((c) => c.category === 'Adventure & Experiences').length >= 3;
      if ((!hasCafesNow || !hasAdvNow || collected.size < 12) && targetCityLabel) {
        const osmQueries: Array<{ word: string; forcedCat?: RawAttraction['category'] }> = [];
        if (collected.size < 12) {
          osmQueries.push({ word: 'temple' }, { word: 'museum' }, { word: 'park' });
        }
        if (!hasCafesNow) {
          osmQueries.push({ word: 'cafe', forcedCat: 'Cafe Corner' });
          osmQueries.push({ word: 'bakery', forcedCat: 'Cafe Corner' });
        }
        if (!hasAdvNow) {
          osmQueries.push({ word: 'boating', forcedCat: 'Adventure & Experiences' });
          osmQueries.push({ word: 'wildlife', forcedCat: 'Adventure & Experiences' });
        }

        const viewbox = `${(lng - 0.35).toFixed(3)},${(lat + 0.35).toFixed(3)},${(lng + 0.35).toFixed(3)},${(lat - 0.35).toFixed(3)}`;
        const osmBatches = await Promise.all(
          osmQueries.map(async ({ word, forcedCat }) => {
            try {
              const ctrl = new AbortController();
              const t = setTimeout(() => ctrl.abort(), 3200);
              const qStr = `${word} in ${targetCityLabel}${state ? `, ${state}` : ''}`;
              const r = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&limit=6&bounded=1&viewbox=${viewbox}&addressdetails=1&q=${encodeURIComponent(
                  qStr
                )}`,
                {
                  headers: { 'User-Agent': 'YatraSaathiTravelIntelligence/1.0', Accept: 'application/json' },
                  signal: ctrl.signal,
                }
              );
              clearTimeout(t);
              if (!r.ok) return [];
              const rows = (await r.json()) as Array<{
                place_id: number;
                name?: string;
                display_name: string;
                lat: string;
                lon: string;
                type?: string;
                class?: string;
              }>;
              return rows.map((row) => ({ row, forcedCat }));
            } catch {
              return [];
            }
          })
        );

        for (const { row, forcedCat } of osmBatches.flat()) {
          const pLat = Number(row.lat);
          const pLng = Number(row.lon);
          const pName = row.name || row.display_name.split(',')[0]?.trim();
          if (!pName || !Number.isFinite(pLat) || !Number.isFinite(pLng)) continue;
          const distFromDest = haversineKm(lat, lng, pLat, pLng);
          if (distFromDest > 45) continue;
          if (!forcedCat && row.class && /^(highway|boundary|place|railway)$/i.test(row.class)) continue;
          const rawRowType = (row.type || '').replace(/_/g, ' ');
          const cat = forcedCat || classifyAttraction(pName, '', rawRowType, distFromDest);
          addCandidate(
            {
              id: `osm-att-${row.place_id}`,
              name: pName,
              category: cat,
              rawType: (row.type || cat).replace(/_/g, ' '),
              location: row.display_name.split(',').slice(1, 3).join(', ').trim() || `${targetCityLabel}, ${state}`,
              lat: pLat,
              lng: pLng,
              image: null,
              shortDescription: `${pName} in ${targetCityLabel}.`,
              bestVisitingTime: inferBestTime(cat, pName),
              source: 'OpenStreetMap Regional Directory',
            },
            Boolean(forcedCat)
          );
        }
      }

      // Resolve missing or filtered portrait/map images for top visitor landmarks via Wikimedia Commons (keyword-verified)
      const needsCommonsPhoto = [...collected.values()]
        .filter((a) => !a.image && a.category !== 'Cafe Corner')
        .sort((a, b) => haversineKm(lat, lng, a.lat, a.lng) - haversineKm(lat, lng, b.lat, b.lng))
        .slice(0, 12);

      if (needsCommonsPhoto.length > 0) {
        await Promise.all(
          needsCommonsPhoto.map(async (item) => {
            const commonsUrl = await resolveWikimediaCommonsPhoto(item.name, targetCityLabel, usedImages);
            if (commonsUrl) {
              item.image = commonsUrl;
            }
          })
        );
      }

      // Sort prioritizing verified landmark photography first, then closer to main destination center
      baseAttractions = [...collected.values()].sort((a, b) => {
        const aScore = (a.image ? 100 : 0) + (a.rating ? 15 : 0) - haversineKm(lat, lng, a.lat, a.lng);
        const bScore = (b.image ? 100 : 0) + (b.rating ? 15 : 0) - haversineKm(lat, lng, b.lat, b.lng);
        return bScore - aScore;
      });

      discoverCache.set(cacheKey, {
        expiresAt: Date.now() + 20 * 60 * 1000,
        payload: baseAttractions,
      });
    }

    // Dynamically compute distance from current editable pickup coordinates on every request
    const enriched = baseAttractions.map((item) => {
      const straightKm = haversineKm(refPickup.lat, refPickup.lng, item.lat, item.lng);
      const estRoadKm = Number(Math.max(0.4, straightKm * 1.28).toFixed(1));
      return {
        ...item,
        distanceFromPickupKm: estRoadKm,
      };
    });

    res.json({
      region: { city: resolvedCity || city || 'Selected Destination', state: state || 'India', lat, lng },
      total: enriched.length,
      fetchedAt: new Date().toISOString(),
      attractions: enriched,
    });
  });

  // Travel Assist Fare & Route Comparison (India-Wide Bike / Auto / Cab)
  app.post('/api/travel-assist/compare', async (req: Request, res: Response) => {
    const {
      originLat,
      originLng,
      originLabel,
      destLat,
      destLng,
      destLabel,
      passengers = 1,
      cityName = '',
      stateName = '',
    } = req.body as {
      originLat: number;
      originLng: number;
      originLabel: string;
      destLat: number;
      destLng: number;
      destLabel: string;
      passengers?: number;
      cityName?: string;
      stateName?: string;
    };

    if (
      !originLabel?.trim() ||
      !destLabel?.trim() ||
      !Number.isFinite(originLat) ||
      !Number.isFinite(originLng) ||
      !Number.isFinite(destLat) ||
      !Number.isFinite(destLng)
    ) {
      res.status(400).json({ error: 'Valid starting point and destination coordinates are required.' });
      return;
    }

    const routeInfo = await computeRoadDistance(
      { lat: originLat, lng: originLng },
      { lat: destLat, lng: destLng }
    );

    if (!routeInfo.routeAvailable || routeInfo.distanceKm === null || routeInfo.durationMin === null) {
      res.status(503).json({
        routeAvailable: false,
        error:
          routeInfo.error ||
          'OSRM road routing is temporarily unreachable for these coordinates. Road distance, duration, and calculated fares could not be computed.',
      });
      return;
    }

    const dist = routeInfo.distanceKm;
    const dur = routeInfo.durationMin;
    const pax = Math.max(1, Math.min(8, Number(passengers) || 1));

    const coverage = evaluateCityCoverage(`${cityName} ${originLabel} ${destLabel}`, stateName);

    const encodedOrigin = encodeURIComponent(originLabel.trim());
    const encodedDest = encodeURIComponent(destLabel.trim());
    const uberDeepLink = `https://m.uber.com/ul/?action=setPickup&dropoff[latitude]=${destLat}&dropoff[longitude]=${destLng}&dropoff[nickname]=${encodedDest}`;
    const olaWebLink = `https://book.olacabs.com/?pickup_name=${encodedOrigin}&drop_name=${encodedDest}`;
    const rapidoWebLink = 'https://www.rapido.bike/';

    type RideCategory = 'bike' | 'auto' | 'cab';
    type CoverageStatus = 'Supported' | 'Not Supported' | 'Unknown';
    type CategorySupportStatus = 'Supported' | 'Not Supported' | 'Unknown';
    type LiveAvailabilityStatus =
      | 'Live Availability Confirmed'
      | 'No Vehicles Available'
      | 'Not Confirmed'
      | 'Unavailable to Verify';
    type FareStatus = FareEstimateType | 'Fare Unavailable';

    interface RideQuote {
      id: string;
      category: RideCategory;
      categoryLabel: string;
      provider: 'Rapido' | 'Uber' | 'Ola' | 'Local Prepaid Stand';
      providerTitle: string;
      vehicleType: string;
      maxPassengers: number;
      luggageCapacity: string;
      cityCoverage: CoverageStatus;
      vehicleTypeSupport: CategorySupportStatus;
      liveAvailability: LiveAvailabilityStatus;
      liveAvailabilityMessage: string;
      fareStatus: FareStatus;
      calculatedFareInr: number | null;
      fareMinInr: number | null;
      fareMaxInr: number | null;
      estimatedMinutes: number | null;
      fareSourceNote: string;
      fareBreakdown: FareBreakdown | null;
      bookingUrl: string | null;
      bookingLabel: string;
      capacityExceeded: boolean;
      isPrimarySupported: boolean;
      lastUpdated: string;
    }

    const nowIso = new Date().toISOString();
    const regionSeed = `${cityName} ${stateName} ${originLabel} ${destLabel}`;
    const bikeOk = pax <= 1 && dist <= 35;
    const autoOk = pax <= 3 && dist <= 55;
    const sedanOk = pax <= 4;
    const suvOk = pax <= 6;

    const specs: Array<{
      id: string;
      category: RideCategory;
      provider: 'Rapido' | 'Uber' | 'Ola' | 'Local Prepaid Stand';
      providerCoverage: CoverageStatus;
      vehicleSupported: CategorySupportStatus;
      eligibleForTrip: boolean;
      capacityExceeded: boolean;
      estMinutes: number;
      bookingUrl: string | null;
      bookingLabel: string;
      customAvailabilityNote?: string;
    }> = [
      // BIKE TAXI
      {
        id: 'rapido-bike',
        category: 'bike',
        provider: 'Rapido',
        providerCoverage: coverage.rapido,
        vehicleSupported: coverage.rapido,
        eligibleForTrip: coverage.rapido === 'Supported' && bikeOk,
        capacityExceeded: pax > 1,
        estMinutes: Math.max(2, Math.round(dur * 0.85)),
        bookingUrl: rapidoWebLink,
        bookingLabel: 'Open in App',
      },
      {
        id: 'ola-bike',
        category: 'bike',
        provider: 'Ola',
        providerCoverage: coverage.ola,
        vehicleSupported: coverage.tier === 'metro-full' ? 'Supported' : coverage.ola === 'Unknown' ? 'Unknown' : 'Not Supported',
        eligibleForTrip: coverage.tier === 'metro-full' && bikeOk,
        capacityExceeded: pax > 1,
        estMinutes: Math.max(2, Math.round(dur * 0.88)),
        bookingUrl: olaWebLink,
        bookingLabel: 'Open in App',
      },
      {
        id: 'uber-moto',
        category: 'bike',
        provider: 'Uber',
        providerCoverage: coverage.uber,
        vehicleSupported: coverage.tier === 'metro-full' ? 'Supported' : coverage.uber === 'Unknown' ? 'Unknown' : 'Not Supported',
        eligibleForTrip: coverage.tier === 'metro-full' && bikeOk,
        capacityExceeded: pax > 1,
        estMinutes: Math.max(2, Math.round(dur * 0.9)),
        bookingUrl: uberDeepLink,
        bookingLabel: 'Open in App',
      },

      // AUTO
      {
        id: 'rapido-auto',
        category: 'auto',
        provider: 'Rapido',
        providerCoverage: coverage.rapido,
        vehicleSupported: coverage.rapido,
        eligibleForTrip: coverage.rapido === 'Supported' && autoOk,
        capacityExceeded: pax > 3,
        estMinutes: dur,
        bookingUrl: rapidoWebLink,
        bookingLabel: 'Open in App',
      },
      {
        id: 'ola-auto',
        category: 'auto',
        provider: 'Ola',
        providerCoverage: coverage.ola,
        vehicleSupported: coverage.ola,
        eligibleForTrip: coverage.ola === 'Supported' && autoOk,
        capacityExceeded: pax > 3,
        estMinutes: dur,
        bookingUrl: olaWebLink,
        bookingLabel: 'Open in App',
      },
      {
        id: 'uber-auto',
        category: 'auto',
        provider: 'Uber',
        providerCoverage: coverage.uber,
        vehicleSupported: coverage.uber,
        eligibleForTrip: coverage.uber === 'Supported' && autoOk,
        capacityExceeded: pax > 3,
        estMinutes: Math.max(2, Math.round(dur * 1.05)),
        bookingUrl: uberDeepLink,
        bookingLabel: 'Open in App',
      },
      {
        id: 'local-prepaid-auto',
        category: 'auto',
        provider: 'Local Prepaid Stand',
        providerCoverage: 'Supported',
        vehicleSupported: 'Supported',
        eligibleForTrip: autoOk,
        capacityExceeded: pax > 3,
        estMinutes: dur,
        bookingUrl: null,
        bookingLabel: 'Exit Auto Stand',
        customAvailabilityNote: coverage.localAutoNote,
      },

      // CAB
      {
        id: 'ola-mini',
        category: 'cab',
        provider: 'Ola',
        providerCoverage: coverage.ola,
        vehicleSupported: coverage.ola,
        eligibleForTrip: coverage.ola === 'Supported' && sedanOk,
        capacityExceeded: !sedanOk,
        estMinutes: Math.max(3, Math.round(dur * 1.05)),
        bookingUrl: olaWebLink,
        bookingLabel: 'Open in App',
      },
      {
        id: 'uber-go',
        category: 'cab',
        provider: 'Uber',
        providerCoverage: coverage.uber,
        vehicleSupported: coverage.uber,
        eligibleForTrip: coverage.uber === 'Supported' && sedanOk,
        capacityExceeded: !sedanOk,
        estMinutes: Math.max(3, Math.round(dur * 1.08)),
        bookingUrl: uberDeepLink,
        bookingLabel: 'Open in App',
      },
      {
        id: 'ola-prime-sedan',
        category: 'cab',
        provider: 'Ola',
        providerCoverage: coverage.ola,
        vehicleSupported: coverage.ola,
        eligibleForTrip: coverage.ola === 'Supported' && sedanOk,
        capacityExceeded: !sedanOk,
        estMinutes: Math.max(3, Math.round(dur * 1.05)),
        bookingUrl: olaWebLink,
        bookingLabel: 'Open in App',
      },
      {
        id: 'uber-sedan',
        category: 'cab',
        provider: 'Uber',
        providerCoverage: coverage.uber,
        vehicleSupported: coverage.uber,
        eligibleForTrip: coverage.uber === 'Supported' && sedanOk,
        capacityExceeded: !sedanOk,
        estMinutes: Math.max(3, Math.round(dur * 1.08)),
        bookingUrl: uberDeepLink,
        bookingLabel: 'Open in App',
      },
      {
        id: 'local-taxi-stand',
        category: 'cab',
        provider: 'Local Prepaid Stand',
        providerCoverage: 'Supported',
        vehicleSupported: 'Supported',
        eligibleForTrip: suvOk,
        capacityExceeded: !suvOk,
        estMinutes: Math.max(3, Math.round(dur * 1.1)),
        bookingUrl: null,
        bookingLabel: 'Prepaid Taxi Booth',
        customAvailabilityNote: coverage.localCabNote,
      },
    ];

    const quotes: RideQuote[] = specs
      .map((spec) => {
        const calc = computeProviderFare(spec.id, dist, spec.estMinutes, regionSeed, stateName, pax);
        if (!calc) return null;

        const hasFare = spec.eligibleForTrip && !spec.capacityExceeded;
        const isPrimarySupported =
          spec.providerCoverage === 'Supported' &&
          spec.vehicleSupported === 'Supported' &&
          !spec.capacityExceeded &&
          hasFare;

        const liveMessage =
          spec.provider === 'Local Prepaid Stand'
            ? spec.customAvailabilityNote || 'Available at station prepaid stand'
            : isPrimarySupported
            ? 'Check Availability in App'
            : spec.capacityExceeded
            ? `Max ${calc.config.maxPassengers} ${calc.config.maxPassengers === 1 ? 'person' : 'people'} per ride`
            : `Check ${spec.provider} app for regional availability`;

        return {
          id: spec.id,
          category: spec.category,
          categoryLabel: calc.config.categoryLabel,
          provider: spec.provider,
          providerTitle: calc.config.providerTitle,
          vehicleType: calc.config.vehicleType,
          maxPassengers: calc.config.maxPassengers,
          luggageCapacity: calc.config.luggageCapacity,
          cityCoverage: spec.providerCoverage,
          vehicleTypeSupport: spec.vehicleSupported,
          liveAvailability: spec.provider === 'Local Prepaid Stand' ? 'Not Confirmed' : 'Unavailable to Verify',
          liveAvailabilityMessage: liveMessage,
          fareStatus: hasFare ? calc.config.estimateType : 'Fare Unavailable',
          calculatedFareInr: hasFare ? calc.breakdown.calculatedFareInr : null,
          fareMinInr: hasFare ? calc.fareMinInr : null,
          fareMaxInr: hasFare ? calc.fareMaxInr : null,
          estimatedMinutes: hasFare ? spec.estMinutes : null,
          fareSourceNote: hasFare
            ? calc.config.sourceLabel
            : spec.capacityExceeded
            ? `Exceeds ${calc.config.maxPassengers}-passenger capacity (${pax} selected).`
            : `Coverage in ${coverage.cityLabel} is not confirmed for ${calc.config.providerTitle}.`,
          fareBreakdown: hasFare ? calc.breakdown : null,
          bookingUrl: spec.bookingUrl,
          bookingLabel: spec.bookingLabel,
          capacityExceeded: spec.capacityExceeded,
          isPrimarySupported,
          lastUpdated: nowIso,
        };
      })
      .filter((q): q is RideQuote => q !== null);

    // Order primary supported options first (sorted lowest to highest calculated fare), then other providers
    quotes.sort((a, b) => {
      if (a.isPrimarySupported !== b.isPrimarySupported) {
        return a.isPrimarySupported ? -1 : 1;
      }
      if (a.calculatedFareInr !== null && b.calculatedFareInr !== null) {
        return a.calculatedFareInr - b.calculatedFareInr;
      }
      if (a.calculatedFareInr !== null) return -1;
      if (b.calculatedFareInr !== null) return 1;
      return 0;
    });

    const comparableWithPrice = quotes.filter(
      (q) => q.isPrimarySupported && q.calculatedFareInr !== null
    );
    const cheapestComparableId = comparableWithPrice.length >= 2 ? comparableWithPrice[0].id : null;

    res.json({
      routeAvailable: true,
      route: {
        originLabel: originLabel.trim(),
        destLabel: destLabel.trim(),
        origin: { lat: originLat, lng: originLng },
        destination: { lat: destLat, lng: destLng },
        distanceKm: routeInfo.distanceKm,
        durationMin: routeInfo.durationMin,
        geometry: routeInfo.geometry,
        routeSource: routeInfo.source,
        isLiveRoute: routeInfo.isLiveRoute,
      },
      coverageSummary: {
        cityLabel: coverage.cityLabel,
        tier: coverage.tier,
      },
      cheapestComparableId,
      quoteDisclaimer:
        'Distances and durations come from live OSRM road routing. Uber, Ola, and Rapido do not expose public real-time fare or driver-availability APIs in India—fares shown are transparent provider-wise Calculated / Approximate Estimates from regional tariff configs, never official live provider quotes. Confirm live availability inside the provider app before booking.',
      lastUpdated: nowIso,
      quotes,
    });
  });

  // Sightseeing multi-stop route optimization & transport budget
  app.post('/api/explore/sightseeing-plan', async (req: Request, res: Response) => {
    const { pickup, stops, citySlug = 'jaipur' } = req.body as {
      pickup: { label: string; lat: number; lng: number };
      stops: Array<{ id: string; name: string; lat: number; lng: number }>;
      citySlug?: string;
    };

    if (!pickup || !Array.isArray(stops) || stops.length === 0) {
      res.status(400).json({ error: 'Pickup location and at least one attraction are required.' });
      return;
    }

    // Nearest-neighbor geographic ordering suggestion starting from pickup
    const remaining = [...stops];
    const suggestedOrder: typeof stops = [];
    let current = { lat: pickup.lat, lng: pickup.lng };
    while (remaining.length > 0) {
      let bestIdx = 0;
      let bestDist = Infinity;
      for (let i = 0; i < remaining.length; i++) {
        const d = haversineKm(current.lat, current.lng, remaining[i].lat, remaining[i].lng);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      }
      const next = remaining.splice(bestIdx, 1)[0];
      suggestedOrder.push(next);
      current = { lat: next.lat, lng: next.lng };
    }

    const isHillTown = ['manali', 'rishikesh', 'bir'].includes(citySlug);
    const hillMult = isHillTown ? 1.35 : 1;

    // Compute leg-by-leg from pickup -> stop1 -> stop2... AND direct from pickup to each attraction
    const legs: Array<{
      stopId: string;
      attractionName: string;
      fromLabel: string;
      distanceKm: number;
      durationMin: number;
      autoEstimateInr: number;
      cabEstimateInr: number;
      routeSource: string;
    }> = [];

    let prevLabel = pickup.label;
    let prevLat = pickup.lat;
    let prevLng = pickup.lng;

    for (const stop of stops) {
      const road = await computeRoadDistance(
        { lat: prevLat, lng: prevLng },
        { lat: stop.lat, lng: stop.lng }
      );
      if (!road.routeAvailable || road.distanceKm === null || road.durationMin === null) {
        res.status(503).json({
          error: road.error || 'OSRM road routing is unavailable for one or more stops.',
        });
        return;
      }
      const autoEst = Math.max(35, Math.round((30 + road.distanceKm * 14.5) * hillMult));
      const cabEst = Math.max(70, Math.round((55 + road.distanceKm * 18.0) * hillMult));
      legs.push({
        stopId: stop.id,
        attractionName: stop.name,
        fromLabel: prevLabel,
        distanceKm: road.distanceKm,
        durationMin: road.durationMin,
        autoEstimateInr: autoEst,
        cabEstimateInr: cabEst,
        routeSource: road.source,
      });
      prevLabel = stop.name;
      prevLat = stop.lat;
      prevLng = stop.lng;
    }

    const totalDistanceKm = Number(legs.reduce((sum, l) => sum + l.distanceKm, 0).toFixed(1));
    const totalDurationMin = legs.reduce((sum, l) => sum + l.durationMin, 0);
    const totalAutoInr = legs.reduce((sum, l) => sum + l.autoEstimateInr, 0);
    const totalCabInr = legs.reduce((sum, l) => sum + l.cabEstimateInr, 0);

    res.json({
      legs,
      suggestedOrderIds: suggestedOrder.map((s) => s.id),
      totals: {
        totalDistanceKm,
        totalDurationMin,
        totalAutoInr,
        totalCabInr,
      },
      quoteType: 'Estimated fare',
      lastUpdated: new Date().toISOString(),
    });
  });

  // Vite or Static serving
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.use((_req: Request, res: Response, next: NextFunction) => {
      if (_req.path.startsWith('/api/')) {
        next();
        return;
      }
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Yatra Saathi server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Yatra Saathi server:', err);
  process.exit(1);
});
