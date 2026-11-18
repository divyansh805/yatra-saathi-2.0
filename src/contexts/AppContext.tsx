import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type {
  LanguageCode,
  SavedItem,
  SavedRoute,
  UserProfile,
  ViewedDestination,
} from '../types/travel';
import { getDestinationById } from '../data/destinations';

const OFFLINE_CACHE_KEY = 'yatra_saathi_offline_cache_v1';

interface OfflineSnapshot {
  cachedAt: string;
  savedItems: SavedItem[];
  savedRoutes: SavedRoute[];
  recentlyViewed: ViewedDestination[];
}

interface RuntimeConfig {
  mapsEnabled: boolean;
  mapsApiKey: string;
  integrations: {
    googleMaps: boolean;
    openMeteoWeather: boolean;
    wikipediaSummaries: boolean;
    groq: boolean;
    openRouter: boolean;
    gemini: boolean;
  };
  authMode: string;
}

interface SharedTripContext {
  destinationId: string;
  pickupLabel: string;
  pickupCoords: { lat: number; lng: number } | null;
  travelDateTime: string;
  passengers: number;
}

interface AppContextValue {
  user: UserProfile | null;
  authLoading: boolean;
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  isOnline: boolean;
  offlineCachedAt: string | null;
  mapsQuotaExceeded: boolean;
  runtimeConfig: RuntimeConfig;
  savedItems: SavedItem[];
  savedRoutes: SavedRoute[];
  recentlyViewed: ViewedDestination[];
  tripContext: SharedTripContext;
  updateTripContext: (patch: Partial<SharedTripContext>) => void;
  refreshAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  toggleSaveItem: (item: Omit<SavedItem, 'savedAt'>) => Promise<boolean>;
  isItemSaved: (id: string, type: SavedItem['type']) => boolean;
  savePlannedRoute: (route: Omit<SavedRoute, 'id' | 'savedAt'>) => Promise<void>;
  deleteSavedRoute: (routeId: string) => Promise<void>;
  recordDestinationView: (destinationId: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

function readOfflineSnapshot(): OfflineSnapshot | null {
  try {
    const raw = localStorage.getItem(OFFLINE_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OfflineSnapshot;
  } catch {
    return null;
  }
}

function writeOfflineSnapshot(snapshot: OfflineSnapshot): void {
  try {
    localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore storage quota errors
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [offlineCachedAt, setOfflineCachedAt] = useState<string | null>(null);
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState(false);

  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<ViewedDestination[]>([]);

  const envMapsKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) || '';

  const [runtimeConfig, setRuntimeConfig] = useState<RuntimeConfig>({
    mapsEnabled: Boolean(envMapsKey),
    mapsApiKey: envMapsKey,
    integrations: {
      googleMaps: Boolean(envMapsKey),
      openMeteoWeather: true,
      wikipediaSummaries: true,
      groq: false,
      openRouter: false,
      gemini: false,
    },
    authMode: 'development-session',
  });

  const defaultDest = getDestinationById('udaipur');
  const [tripContext, setTripContext] = useState<SharedTripContext>({
    destinationId: 'udaipur',
    pickupLabel: defaultDest.arrivalHubs[0].name,
    pickupCoords: {
      lat: defaultDest.arrivalHubs[0].lat,
      lng: defaultDest.arrivalHubs[0].lng,
    },
    travelDateTime: '',
    passengers: 1,
  });

  const updateTripContext = useCallback((patch: Partial<SharedTripContext>) => {
    setTripContext((prev) => ({ ...prev, ...patch }));
  }, []);

  // Listen to online/offline + Maps quota events
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    const onQuota = () => setMapsQuotaExceeded(true);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('gmp-quota-exceeded', onQuota);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('gmp-quota-exceeded', onQuota);
    };
  }, []);

  const loadWorkspace = useCallback(async () => {
    try {
      const res = await fetch('/api/user/workspace', { credentials: 'include' });
      if (res.ok) {
        const data = (await res.json()) as {
          savedItems: SavedItem[];
          savedRoutes: SavedRoute[];
          recentlyViewed: ViewedDestination[];
        };
        const items = data.savedItems || [];
        const routes = data.savedRoutes || [];
        const viewed = data.recentlyViewed || [];
        setSavedItems(items);
        setSavedRoutes(routes);
        setRecentlyViewed(viewed);
        const now = new Date().toISOString();
        setOfflineCachedAt(now);
        writeOfflineSnapshot({
          cachedAt: now,
          savedItems: items,
          savedRoutes: routes,
          recentlyViewed: viewed,
        });
      }
    } catch {
      const cached = readOfflineSnapshot();
      if (cached) {
        setSavedItems(cached.savedItems);
        setSavedRoutes(cached.savedRoutes);
        setRecentlyViewed(cached.recentlyViewed);
        setOfflineCachedAt(cached.cachedAt);
      }
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    setAuthLoading(true);
    try {
      const [meRes, cfgRes] = await Promise.all([
        fetch('/api/auth/me', { credentials: 'include' }),
        fetch('/api/config/runtime'),
      ]);
      if (cfgRes.ok) {
        const cfg = (await cfgRes.json()) as RuntimeConfig;
        setRuntimeConfig((prev) => ({
          ...cfg,
          mapsApiKey: cfg.mapsApiKey || prev.mapsApiKey,
          mapsEnabled: Boolean(cfg.mapsApiKey || prev.mapsApiKey),
        }));
      }
      if (meRes.ok) {
        const data = (await meRes.json()) as { user: UserProfile | null };
        setUser(data.user);
        if (data.user) {
          await loadWorkspace();
        } else {
          setSavedItems([]);
          setSavedRoutes([]);
          setRecentlyViewed([]);
        }
      }
    } catch {
      const cached = readOfflineSnapshot();
      if (cached) {
        setSavedItems(cached.savedItems);
        setSavedRoutes(cached.savedRoutes);
        setRecentlyViewed(cached.recentlyViewed);
        setOfflineCachedAt(cached.cachedAt);
      }
    } finally {
      setAuthLoading(false);
    }
  }, [loadWorkspace]);

  useEffect(() => {
    void refreshAuth();
  }, [refreshAuth]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { user?: UserProfile; error?: string };
      if (!res.ok || !data.user) {
        throw new Error(data.error || 'Unable to sign in.');
      }
      setUser(data.user);
      await loadWorkspace();
    },
    [loadWorkspace]
  );

  const register = useCallback(
    async (name: string, email: string, password: string, confirmPassword: string) => {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });
      const data = (await res.json()) as { user?: UserProfile; error?: string };
      if (!res.ok || !data.user) {
        throw new Error(data.error || 'Unable to register account.');
      }
      setUser(data.user);
      await loadWorkspace();
    },
    [loadWorkspace]
  );

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    setSavedItems([]);
    setSavedRoutes([]);
    setRecentlyViewed([]);
  }, []);

  const isItemSaved = useCallback(
    (id: string, type: SavedItem['type']) =>
      savedItems.some((item) => item.id === id && item.type === type),
    [savedItems]
  );

  const toggleSaveItem = useCallback(
    async (item: Omit<SavedItem, 'savedAt'>): Promise<boolean> => {
      const res = await fetch('/api/user/saved-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(item),
      });
      const data = (await res.json()) as {
        saved?: boolean;
        savedItems?: SavedItem[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || 'Please sign in to save places.');
      }
      const nextItems = data.savedItems || [];
      setSavedItems(nextItems);
      const now = new Date().toISOString();
      setOfflineCachedAt(now);
      writeOfflineSnapshot({
        cachedAt: now,
        savedItems: nextItems,
        savedRoutes,
        recentlyViewed,
      });
      return Boolean(data.saved);
    },
    [savedRoutes, recentlyViewed]
  );

  const savePlannedRoute = useCallback(
    async (route: Omit<SavedRoute, 'id' | 'savedAt'>) => {
      const res = await fetch('/api/user/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(route),
      });
      const data = (await res.json()) as { savedRoutes?: SavedRoute[]; error?: string };
      if (!res.ok) {
        throw new Error(data.error || 'Please sign in to save routes.');
      }
      const nextRoutes = data.savedRoutes || [];
      setSavedRoutes(nextRoutes);
      const now = new Date().toISOString();
      setOfflineCachedAt(now);
      writeOfflineSnapshot({
        cachedAt: now,
        savedItems,
        savedRoutes: nextRoutes,
        recentlyViewed,
      });
    },
    [savedItems, recentlyViewed]
  );

  const deleteSavedRoute = useCallback(async (routeId: string) => {
    const res = await fetch(`/api/user/routes/${encodeURIComponent(routeId)}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) {
      const data = (await res.json()) as { savedRoutes?: SavedRoute[] };
      setSavedRoutes(data.savedRoutes || []);
    }
  }, []);

  const recordDestinationView = useCallback(
    async (destinationId: string) => {
      const dest = getDestinationById(destinationId);
      if (!user) return;
      try {
        const res = await fetch('/api/user/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            destinationId: dest.id,
            destinationName: `${dest.name}, ${dest.state}`,
            image: dest.heroImage,
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as { recentlyViewed?: ViewedDestination[] };
          if (data.recentlyViewed) {
            setRecentlyViewed(data.recentlyViewed);
          }
        }
      } catch {
        // Offline - skip silent history update
      }
    },
    [user]
  );

  return (
    <AppContext.Provider
      value={{
        user,
        authLoading,
        language,
        setLanguage,
        isOnline,
        offlineCachedAt,
        mapsQuotaExceeded,
        runtimeConfig,
        savedItems,
        savedRoutes,
        recentlyViewed,
        tripContext,
        updateTripContext,
        refreshAuth,
        login,
        register,
        logout,
        toggleSaveItem,
        isItemSaved,
        savePlannedRoute,
        deleteSavedRoute,
        recordDestinationView,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
