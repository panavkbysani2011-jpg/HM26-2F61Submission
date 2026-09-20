import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Crosshair, Maximize2, Minimize2 } from 'lucide-react';
import { CivicIssue } from '../types';

interface MysuruLeafletMapProps {
  selectedCoords: { lat: number; lng: number } | null;
  onSelectCoords: (coords: { lat: number; lng: number }) => void;
  existingIssues?: CivicIssue[];
  isDark?: boolean;
}

// Center: Mysuru (Lat: 12.2979, Lng: 76.6393)
const MYSURU_CENTER: [number, number] = [12.2979, 76.6393];

declare global {
  interface Window {
    L: any;
  }
}

export const MysuruLeafletMap: React.FC<MysuruLeafletMapProps> = ({
  selectedCoords,
  onSelectCoords,
  existingIssues = [],
  isDark = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const selectedMarkerRef = useRef<any>(null);
  const existingMarkersGroupRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 1. Inject Leaflet CSS and JS via CDN directly
  useEffect(() => {
    let isMounted = true;

    const loadLeafletAssets = async () => {
      // CSS
      if (!document.getElementById('leaflet-cdn-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-cdn-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        link.crossOrigin = '';
        document.head.appendChild(link);
      }

      // JS
      if (!window.L) {
        if (!document.getElementById('leaflet-cdn-js')) {
          const script = document.createElement('script');
          script.id = 'leaflet-cdn-js';
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
          script.crossOrigin = '';
          script.async = true;
          script.onload = () => {
            if (isMounted) setIsLoaded(true);
          };
          script.onerror = () => {
            if (isMounted) setMapError('Could not load map service. Check network.');
          };
          document.body.appendChild(script);
        } else {
          const existingScript = document.getElementById('leaflet-cdn-js') as HTMLScriptElement;
          existingScript.addEventListener('load', () => {
            if (isMounted) setIsLoaded(true);
          });
        }
      } else {
        if (isMounted) setIsLoaded(true);
      }
    };

    loadLeafletAssets();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Initialize Map once Leaflet is loaded
  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current || !window.L) return;

    const L = window.L;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    try {
      const map = L.map(mapContainerRef.current, {
        center: selectedCoords ? [selectedCoords.lat, selectedCoords.lng] : MYSURU_CENTER,
        zoom: 14,
        minZoom: 11,
        maxZoom: 18,
        zoomControl: true,
      });

      // OpenStreetMap Tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Layer group for existing issues
      const markersGroup = L.layerGroup().addTo(map);
      existingMarkersGroupRef.current = markersGroup;

      // Click event for user pin placement
      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        onSelectCoords({ lat: parseFloat(lat.toFixed(5)), lng: parseFloat(lng.toFixed(5)) });
      });

      mapInstanceRef.current = map;
    } catch (err: any) {
      console.error('Error initializing Leaflet map:', err);
      setMapError('Failed to initialize map display.');
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isLoaded]);

  // Invalidate map size when fullscreen toggles
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [isFullscreen]);

  // 3. Update Selected Pin Marker
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return;
    const L = window.L;
    const map = mapInstanceRef.current;

    if (selectedMarkerRef.current) {
      map.removeLayer(selectedMarkerRef.current);
      selectedMarkerRef.current = null;
    }

    if (selectedCoords) {
      const customPinIcon = L.divIcon({
        className: 'custom-selected-pin',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 34px; height: 34px; border-radius: 9999px; background: rgba(16, 185, 129, 0.3); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 24px; height: 24px; border-radius: 9999px; background: #059669; border: 3px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([selectedCoords.lat, selectedCoords.lng], {
        icon: customPinIcon,
        draggable: true,
      }).addTo(map);

      marker.on('dragend', (e: any) => {
        const { lat, lng } = e.target.getLatLng();
        onSelectCoords({ lat: parseFloat(lat.toFixed(5)), lng: parseFloat(lng.toFixed(5)) });
      });

      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; color: #1c1917; line-height: 1.4;">
          <div style="font-weight: 800; color: #059669; margin-bottom: 2px;">SELECTED REPORT LOCATION</div>
          <div style="font-family: monospace; font-size: 11px; color: #57534e;">${selectedCoords.lat.toFixed(5)}° N, ${selectedCoords.lng.toFixed(5)}° E</div>
          <div style="font-size: 11px; margin-top: 4px; color: #44403c;">Drag pin to fine-tune exact position</div>
        </div>
      `).openPopup();

      selectedMarkerRef.current = marker;
    }
  }, [selectedCoords]);

  // 4. Render Nearby Active Incidents
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L || !existingMarkersGroupRef.current) return;
    const L = window.L;
    const markersGroup = existingMarkersGroupRef.current;
    markersGroup.clearLayers();

    existingIssues.forEach((issue) => {
      if (!issue.coordinates) return;

      const markerIcon = L.divIcon({
        className: 'custom-existing-issue-pin',
        html: `
          <div style="width: 14px; height: 14px; border-radius: 9999px; background: ${
            issue.status === 'resolved' ? '#10b981' : issue.priority === 'critical' ? '#ef4444' : '#f59e0b'
          }; border: 2px solid #ffffff; box-shadow: 0 1px 4px rgba(0,0,0,0.25);"></div>
        `,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const marker = L.marker([issue.coordinates.lat, issue.coordinates.lng], {
        icon: markerIcon,
      });

      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; color: #1c1917; line-height: 1.4; max-width: 220px;">
          <div style="font-weight: 800; font-size: 10px; color: ${
            issue.status === 'resolved' ? '#059669' : '#dc2626'
          }; text-transform: uppercase;">
            ${issue.status.replace('_', ' ')} • Priority ${issue.priority}
          </div>
          <div style="font-weight: 700; font-size: 12px; margin: 2px 0;">${issue.title}</div>
          <div style="font-size: 11px; color: #57534e;">${issue.location}</div>
        </div>
      `);

      markersGroup.addLayer(marker);
    });
  }, [existingIssues]);

  const handleCenterMysuru = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(MYSURU_CENTER, 14);
    }
  };

  const handlePresetLocation = (coords: [number, number]) => {
    onSelectCoords({ lat: coords[0], lng: coords[1] });
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(coords, 15);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  return (
    <div className={`space-y-3 ${isFullscreen ? 'fixed inset-0 z-50 bg-stone-900/95 backdrop-blur-md p-4 sm:p-6 flex flex-col justify-between' : 'relative'}`}>
      {/* Map Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-stone-700 dark:text-stone-300 font-semibold">
          <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Click anywhere on the map to drop a pin</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCenterMysuru}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold transition-all active:scale-95 cursor-pointer border border-stone-200/60 dark:border-stone-700/60"
            title="Reset to Mysuru City Center"
          >
            <Crosshair className="w-3 h-3 text-stone-600 dark:text-stone-400" />
            <span>Center Mysuru</span>
          </button>

          {/* Full Screen Mode Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold transition-all active:scale-95 cursor-pointer border border-stone-200/60 dark:border-stone-700/60"
            title={isFullscreen ? 'Exit Full Screen' : 'View Map Full Screen'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3 h-3 text-amber-500" />
                <span>Exit Full Screen</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>Full Screen</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className={`relative w-full rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800 shadow-inner bg-stone-100 dark:bg-stone-900 ${
        isFullscreen ? 'grow min-h-[75vh]' : 'h-72 sm:h-80'
      }`}>
        {!isLoaded && !mapError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-stone-100 dark:bg-stone-900 text-stone-500 z-20">
            <Navigation className="w-6 h-6 animate-spin text-emerald-600" />
            <span className="text-xs font-medium">Loading Mysuru civic geospatial map...</span>
          </div>
        )}

        {mapError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-stone-100 dark:bg-stone-900 text-stone-600 text-center z-20">
            <span className="text-sm font-bold text-rose-600 mb-1">Map Unavailable</span>
            <span className="text-xs">{mapError}</span>
          </div>
        )}

        <div ref={mapContainerRef} className="w-full h-full" id="mysuru-leaflet-container" />
      </div>

      {/* Quick Landmark Presets for Mysuru */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
        <span className="text-stone-500 dark:text-stone-400 text-[11px] font-bold mr-1">
          Quick Mysuru Landmarks:
        </span>
        {[
          { label: 'KR Circle', coords: [12.3088, 76.6531] as [number, number] },
          { label: 'Ballal Circle', coords: [12.2982, 76.6432] as [number, number] },
          { label: 'Mysore Palace', coords: [12.3051, 76.6551] as [number, number] },
          { label: 'Devaraja Market', coords: [12.3093, 76.6517] as [number, number] },
          { label: 'Kuvempunagar', coords: [12.2891, 76.6275] as [number, number] },
          { label: 'Vijayanagar', coords: [12.3382, 76.6085] as [number, number] },
          { label: 'Chamundi Foothills', coords: [12.2845, 76.6712] as [number, number] },
        ].map((landmark) => (
          <button
            key={landmark.label}
            type="button"
            onClick={() => handlePresetLocation(landmark.coords)}
            className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-[11px] font-semibold transition-all active:scale-95 cursor-pointer border border-stone-200/50 dark:border-stone-700/50"
          >
            {landmark.label}
          </button>
        ))}
      </div>
    </div>
  );
};
