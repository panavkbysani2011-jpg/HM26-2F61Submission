import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Crosshair } from 'lucide-react';
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
          // Script already added, wait for it
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

    // Prevent duplicate map initialization
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    try {
      const map = L.map(mapContainerRef.current, {
        center: selectedCoords ? [selectedCoords.lat, selectedCoords.lng] : MYSURU_CENTER,
        zoom: 14,
        zoomControl: true,
        attributionControl: true,
      });

      // OpenStreetMap Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Group for existing nearby issues
      existingMarkersGroupRef.current = L.layerGroup().addTo(map);

      // Map Click Handler: drop pin and capture coordinates
      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        onSelectCoords({
          lat: parseFloat(lat.toFixed(5)),
          lng: parseFloat(lng.toFixed(5)),
        });
      });

      // Invalidate size to ensure clean render
      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    } catch (err: any) {
      console.error('Leaflet initialization error:', err);
      setMapError('Failed to initialize interactive map.');
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isLoaded]);

  // 3. Update Selected Pin Marker when coordinates change
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L || !selectedCoords) return;

    const L = window.L;
    const map = mapInstanceRef.current;

    // Remove existing selection marker if present
    if (selectedMarkerRef.current) {
      map.removeLayer(selectedMarkerRef.current);
      selectedMarkerRef.current = null;
    }

    // Custom pulse pin icon for selected civic point
    const pinIcon = L.divIcon({
      className: 'custom-selected-pin',
      html: `
        <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 32px; height: 32px; border-radius: 9999px; background: rgba(16, 185, 129, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: relative; width: 22px; height: 22px; border-radius: 9999px; background: #059669; border: 3px solid #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

    const marker = L.marker([selectedCoords.lat, selectedCoords.lng], {
      icon: pinIcon,
      draggable: true,
    }).addTo(map);

    marker.bindPopup(`
      <div style="font-family: inherit; font-size: 12px; line-height: 1.4; color: #1c1917; padding: 2px;">
        <strong style="color: #059669; display: block; margin-bottom: 2px;">Selected Issue Location</strong>
        <span>${selectedCoords.lat.toFixed(5)}, ${selectedCoords.lng.toFixed(5)}</span>
        <div style="font-size: 11px; color: #78716c; margin-top: 4px;">Drag pin or click map to reposition</div>
      </div>
    `).openPopup();

    marker.on('dragend', (e: any) => {
      const { lat, lng } = e.target.getLatLng();
      onSelectCoords({
        lat: parseFloat(lat.toFixed(5)),
        lng: parseFloat(lng.toFixed(5)),
      });
    });

    selectedMarkerRef.current = marker;

    // Smoothly re-center map to the chosen coordinates
    try {
      map.panTo([selectedCoords.lat, selectedCoords.lng], { animate: true });
    } catch {
      // ignore
    }
  }, [selectedCoords]);

  // 4. Render existing civic issues markers in Mysuru
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L || !existingMarkersGroupRef.current) return;

    const L = window.L;
    existingMarkersGroupRef.current.clearLayers();

    existingIssues.forEach((issue) => {
      if (!issue.coordinates) return;

      const isResolved = issue.status === 'resolved';
      const color = isResolved ? '#10b981' : issue.priority === 'critical' ? '#e11d48' : '#d97706';

      const existingPinIcon = L.divIcon({
        className: 'custom-existing-issue-pin',
        html: `
          <div style="width: 14px; height: 14px; border-radius: 9999px; background: ${color}; border: 2px solid #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.25);"></div>
        `,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const marker = L.marker([issue.coordinates.lat, issue.coordinates.lng], {
        icon: existingPinIcon,
      });

      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4; max-width: 220px; color: #1c1917;">
          <div style="font-weight: 700; font-size: 11px; color: ${color}; text-transform: uppercase;">
            ${issue.category} • ${issue.status.replace('_', ' ')}
          </div>
          <div style="font-weight: 600; margin: 2px 0;">${issue.title}</div>
          <div style="font-size: 11px; color: #57534e;">${issue.location}</div>
          ${issue.reportCount && issue.reportCount > 1 ? `<div style="font-size: 10px; background: #f5f5f4; padding: 2px 4px; border-radius: 4px; margin-top: 4px; display: inline-block;">Grouped reports: ${issue.reportCount}</div>` : ''}
        </div>
      `);

      existingMarkersGroupRef.current.addLayer(marker);
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

  return (
    <div className="space-y-3">
      {/* Map Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-stone-700 dark:text-stone-300 font-medium">
          <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Click anywhere on the map to drop a pin</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCenterMysuru}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-medium transition-colors"
            title="Reset to Mysuru City Center"
          >
            <Crosshair className="w-3 h-3" />
            <span>Center Mysuru</span>
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative w-full h-72 sm:h-80 rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800 shadow-inner bg-stone-100 dark:bg-stone-900">
        {!isLoaded && !mapError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-stone-100 dark:bg-stone-900 text-stone-500 z-20">
            <Navigation className="w-6 h-6 animate-spin text-emerald-600" />
            <span className="text-xs">Loading Mysuru civic geospatial map...</span>
          </div>
        )}

        {mapError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-stone-100 dark:bg-stone-900 text-stone-600 text-center z-20">
            <span className="text-sm font-semibold text-rose-600 mb-1">Map Unavailable</span>
            <span className="text-xs">{mapError}</span>
          </div>
        )}

        <div ref={mapContainerRef} className="w-full h-full" id="mysuru-leaflet-container" />
      </div>

      {/* Quick Landmark Presets for Mysuru */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
        <span className="text-stone-500 dark:text-stone-400 text-[11px] font-medium mr-1">
          Quick Mysuru Landmarks:
        </span>
        {[
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
            className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-[11px] transition-colors"
          >
            {landmark.label}
          </button>
        ))}
      </div>
    </div>
  );
};
