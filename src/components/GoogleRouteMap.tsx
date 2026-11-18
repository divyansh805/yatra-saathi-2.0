/// <reference types="google.maps" />
import { useEffect, useRef, useState } from 'react';
import {
  APIProvider,
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { ExternalLink, MapPin, Navigation } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export interface MapStop {
  id: string;
  label: string;
  lat: number;
  lng: number;
  kind?: 'origin' | 'destination' | 'stop';
}

export interface LatLngPoint {
  lat: number;
  lng: number;
}

interface GoogleRouteMapProps {
  stops: MapStop[];
  routeGeometry?: LatLngPoint[];
  heightClass?: string;
  showRouteLine?: boolean;
  travelMode?: 'DRIVING' | 'WALKING' | 'TWO_WHEELER';
  onRouteMetrics?: (metrics: { distanceKm: number; durationMin: number; source: string }) => void;
}

function ProvidedGeometryPolylineLayer({
  stops,
  routeGeometry,
}: {
  stops: MapStop[];
  routeGeometry: LatLngPoint[];
}) {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');
  const coreLib = useMapsLibrary('core');
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  const geomKey = `${routeGeometry.length}:${routeGeometry[0]?.lat.toFixed(4)}:${routeGeometry[routeGeometry.length - 1]?.lng.toFixed(4)}`;

  useEffect(() => {
    if (!map || !mapsLib || !coreLib || routeGeometry.length < 2) return;

    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    const line = new mapsLib.Polyline({
      path: routeGeometry,
      strokeColor: '#123D3A',
      strokeWeight: 5,
      strokeOpacity: 0.9,
      geodesic: false,
    });
    line.setMap(map);
    polylineRef.current = line;

    const bounds = new coreLib.LatLngBounds();
    stops.forEach((s) => bounds.extend({ lat: s.lat, lng: s.lng }));
    const step = Math.max(1, Math.floor(routeGeometry.length / 25));
    for (let i = 0; i < routeGeometry.length; i += step) {
      bounds.extend(routeGeometry[i]);
    }
    bounds.extend(routeGeometry[routeGeometry.length - 1]);
    map.fitBounds(bounds, 44);

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, mapsLib, coreLib, geomKey]);

  return null;
}

function RoutePolylineLayer({
  stops,
  travelMode = 'DRIVING',
  onRouteMetrics,
}: {
  stops: MapStop[];
  travelMode: 'DRIVING' | 'WALKING' | 'TWO_WHEELER';
  onRouteMetrics?: (metrics: { distanceKm: number; durationMin: number; source: string }) => void;
}) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const onRouteMetricsRef = useRef(onRouteMetrics);
  onRouteMetricsRef.current = onRouteMetrics;

  const stopsKey = stops.map((s) => `${s.lat.toFixed(5)},${s.lng.toFixed(5)}`).join('|');

  useEffect(() => {
    if (!map || !routesLib || stops.length < 2) return;

    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    const origin = { lat: stops[0].lat, lng: stops[0].lng };
    const destination = { lat: stops[stops.length - 1].lat, lng: stops[stops.length - 1].lng };
    const intermediates =
      stops.length > 2
        ? stops.slice(1, -1).map((s) => ({ location: { lat: s.lat, lng: s.lng } }))
        : undefined;

    let cancelled = false;

    const request: Record<string, unknown> = {
      origin,
      destination,
      travelMode,
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
    };
    if (intermediates && intermediates.length > 0) {
      request.intermediates = intermediates;
    }

    (routesLib.Route as unknown as { computeRoutes: (req: unknown) => Promise<{ routes?: any[] }> })
      .computeRoutes(request)
      .then((res) => {
        if (cancelled) return;
        const primaryRoute = res?.routes?.[0];
        if (!primaryRoute) return;

        if (typeof primaryRoute.createPolylines === 'function') {
          const lines: google.maps.Polyline[] = primaryRoute.createPolylines();
          lines.forEach((line) => {
            line.setOptions({
              strokeColor: '#123D3A',
              strokeWeight: 5,
              strokeOpacity: 0.9,
            });
            line.setMap(map);
          });
          polylinesRef.current = lines;
        }

        if (primaryRoute.viewport) {
          map.fitBounds(primaryRoute.viewport);
        }

        if (onRouteMetricsRef.current && primaryRoute.distanceMeters) {
          onRouteMetricsRef.current({
            distanceKm: Number((primaryRoute.distanceMeters / 1000).toFixed(1)),
            durationMin: Math.max(4, Math.round((primaryRoute.durationMillis || 0) / 60000)),
            source: 'Google Maps Routes SDK',
          });
        }
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('OVER_QUERY_LIMIT') || msg.includes('429')) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
      });

    return () => {
      cancelled = true;
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, routesLib, stopsKey, travelMode]);

  return null;
}

const GOOGLE_MAPS_LIBRARIES = ['marker', 'routes', 'maps'];
const INTERNAL_ATTRIBUTION_IDS = ['gmp_mcp_codeassist_v1_aistudio'];

function InteractiveMapInner({
  stops,
  routeGeometry,
  showRouteLine,
  travelMode,
  onRouteMetrics,
}: {
  stops: MapStop[];
  routeGeometry?: LatLngPoint[];
  showRouteLine: boolean;
  travelMode: 'DRIVING' | 'WALKING' | 'TWO_WHEELER';
  onRouteMetrics?: (metrics: { distanceKm: number; durationMin: number; source: string }) => void;
}) {
  const [activeStop, setActiveStop] = useState<MapStop | null>(null);
  const center = stops[0] ? { lat: stops[0].lat, lng: stops[0].lng } : { lat: 24.5854, lng: 73.7125 };
  const hasProvidedGeometry = Boolean(routeGeometry && routeGeometry.length >= 2);

  return (
    <GoogleMap
      defaultCenter={center}
      defaultZoom={stops.length === 1 ? 14 : 12}
      mapId="DEMO_MAP_ID"
      gestureHandling="greedy"
      internalUsageAttributionIds={INTERNAL_ATTRIBUTION_IDS}
      style={{ width: '100%', height: '100%' }}
    >
      {stops.map((stop, idx) => (
        <AdvancedMarker
          key={stop.id}
          position={{ lat: stop.lat, lng: stop.lng }}
          title={stop.label}
          onClick={() => setActiveStop(stop)}
        >
          <Pin
            background={
              stop.kind === 'origin'
                ? '#123D3A'
                : stop.kind === 'destination'
                ? '#E9A34A'
                : '#1F5C58'
            }
            borderColor="#FFFFFF"
            glyphColor="#FFFFFF"
            glyphText={stop.kind === 'origin' ? 'A' : String(idx + 1)}
          />
        </AdvancedMarker>
      ))}

      {activeStop && (
        <InfoWindow
          position={{ lat: activeStop.lat, lng: activeStop.lng }}
          onCloseClick={() => setActiveStop(null)}
        >
          <div className="p-1.5 text-sm text-[#142322] max-w-[220px]">
            <p className="font-semibold">{activeStop.label}</p>
            <p className="font-mono text-sm text-[#5A6664] mt-0.5">
              {activeStop.lat.toFixed(4)}, {activeStop.lng.toFixed(4)}
            </p>
          </div>
        </InfoWindow>
      )}

      {showRouteLine && stops.length >= 2 && hasProvidedGeometry && routeGeometry && (
        <ProvidedGeometryPolylineLayer stops={stops} routeGeometry={routeGeometry} />
      )}

      {showRouteLine && stops.length >= 2 && !hasProvidedGeometry && (
        <RoutePolylineLayer
          stops={stops}
          travelMode={travelMode}
          onRouteMetrics={onRouteMetrics}
        />
      )}
    </GoogleMap>
  );
}

export function GoogleRouteMap({
  stops,
  routeGeometry,
  heightClass = 'h-[360px]',
  showRouteLine = true,
  travelMode = 'DRIVING',
  onRouteMetrics,
}: GoogleRouteMapProps) {
  const { runtimeConfig, mapsQuotaExceeded, isOnline } = useApp();
  const apiKey = runtimeConfig.mapsApiKey;
  const canRenderMaps = Boolean(apiKey) && !mapsQuotaExceeded && isOnline;

  const googleMapsDirectionsUrl =
    stops.length >= 2
      ? `https://www.google.com/maps/dir/?api=1&origin=${stops[0].lat},${stops[0].lng}&destination=${
          stops[stops.length - 1].lat
        },${stops[stops.length - 1].lng}${
          stops.length > 2
            ? `&waypoints=${stops
                .slice(1, -1)
                .map((s) => `${s.lat},${s.lng}`)
                .join('|')}`
            : ''
        }`
      : stops[0]
      ? `https://www.google.com/maps/search/?api=1&query=${stops[0].lat},${stops[0].lng}`
      : 'https://www.google.com/maps';

  if (!canRenderMaps) {
    return (
      <div
        className={`${heightClass} w-full rounded-xl border border-[#E5DFD3] bg-[#F3EFE6] flex flex-col justify-between p-5`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow-mono font-semibold text-[#123D3A]">
              ROUTE & COORDINATE OVERVIEW
            </p>
            <p className="text-sm text-[#495553] mt-1">
              {!isOnline
                ? 'Offline mode active — interactive map tiles require an active connection.'
                : mapsQuotaExceeded
                ? 'Google Maps interactive tile quota reached — displaying verified waypoint sequence.'
                : 'Google Maps API key not active in this session — displaying verified waypoint sequence.'}
            </p>
          </div>
          <a
            href={googleMapsDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-lg bg-[#123D3A] text-white text-sm font-medium hover:bg-[#194E4A] transition-colors shrink-0"
          >
            Open in Google Maps
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </a>
        </div>

        <div className="my-3 space-y-2.5 overflow-y-auto max-h-[210px] pr-1">
          {stops.map((stop, idx) => (
            <div
              key={stop.id}
              className="flex items-center justify-between gap-3 bg-white border border-[#E5DFD3] rounded-lg px-3.5 py-2.5"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-7 h-7 rounded-full bg-[#123D3A] text-white text-sm font-mono flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#142322] truncate">{stop.label}</p>
                  <p className="text-sm text-[#5A6664] font-mono tabular-figures">
                    {stop.lat.toFixed(4)}° N, {stop.lng.toFixed(4)}° E
                  </p>
                </div>
              </div>
              {idx === 0 ? (
                <MapPin className="w-4 h-4 text-[#123D3A] shrink-0" aria-hidden="true" />
              ) : (
                <Navigation className="w-4 h-4 text-[#E9A34A] shrink-0" aria-hidden="true" />
              )}
            </div>
          ))}
        </div>

        <p className="text-sm text-[#5A6664]">
          Waypoints remain inspectable and open directly in Google Maps navigation.
        </p>
      </div>
    );
  }

  return (
    <div className={`${heightClass} w-full rounded-xl overflow-hidden border border-[#E5DFD3] relative`}>
      <APIProvider apiKey={apiKey} language="en" region="IN" libraries={GOOGLE_MAPS_LIBRARIES}>
        <InteractiveMapInner
          stops={stops}
          routeGeometry={routeGeometry}
          showRouteLine={showRouteLine}
          travelMode={travelMode}
          onRouteMetrics={onRouteMetrics}
        />
      </APIProvider>
    </div>
  );
}
