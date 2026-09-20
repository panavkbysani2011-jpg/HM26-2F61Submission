import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Crosshair, Navigation, Maximize2, Minimize2 } from 'lucide-react';
import { CivicIssue } from '../types';
import { getPriorityScore } from '../mockDatabase';

interface AdminLeafletMapProps {
  issues: CivicIssue[];
  bogadiCapacity: number;
  mccCapacity: number;
  onSelectIssue?: (issue: CivicIssue) => void;
  isDark?: boolean;
}

// Complete geospatial definitions for all 26 Mysuru Jurisdictions
interface JurisdictionGeo {
  id: string;
  name: string;
  type: 'mcc_zone' | 'town_panchayat' | 'gram_panchayat' | 'buffer_zone';
  center: [number, number];
  radius?: number; // meters for circle
  polygonCoords?: [number, number][]; // coordinates for buffer polygons
  color: string;
  fillColor: string;
  description: string;
  baseWorkers: number;
}

const ALL_JURISDICTIONS_GEO: JurisdictionGeo[] = [
  // 9 MCC Zones (Emerald Palette)
  {
    id: 'mcc-zone-1',
    name: 'MCC Zone 1 (Ashokapuram / Vani Vilas)',
    type: 'mcc_zone',
    center: [12.2880, 76.6450],
    radius: 1250,
    color: '#059669',
    fillColor: '#10b981',
    description: 'South-central municipal zone covering Ashokapuram, Vani Vilas, and Krishnamurthypuram.',
    baseWorkers: 16,
  },
  {
    id: 'mcc-zone-2',
    name: 'MCC Zone 2 (Krishnaraja / Agrahara)',
    type: 'mcc_zone',
    center: [12.2980, 76.6550],
    radius: 1250,
    color: '#059669',
    fillColor: '#10b981',
    description: 'Core heritage zone covering Krishnaraja Boulevard, Agrahara, and Chamundipuram.',
    baseWorkers: 18,
  },
  {
    id: 'mcc-zone-3',
    name: 'MCC Zone 3 (Saraswathipuram / Chamarajapuram)',
    type: 'mcc_zone',
    center: [12.3020, 76.6320],
    radius: 1350,
    color: '#059669',
    fillColor: '#10b981',
    description: 'Educational and administrative hub covering Saraswathipuram, Jayalakshmipuram, and Chamarajapuram.',
    baseWorkers: 15,
  },
  {
    id: 'mcc-zone-4',
    name: 'MCC Zone 4 (Nazarbad / Lashkar Mohalla)',
    type: 'mcc_zone',
    center: [12.3090, 76.6650],
    radius: 1300,
    color: '#059669',
    fillColor: '#10b981',
    description: 'Eastern central zone covering Nazarbad, Lashkar Mohalla, and Mysuru Zoo environs.',
    baseWorkers: 17,
  },
  {
    id: 'mcc-zone-5',
    name: 'MCC Zone 5 (Bannimantap / Mandi Mohalla)',
    type: 'mcc_zone',
    center: [12.3290, 76.6500],
    radius: 1350,
    color: '#059669',
    fillColor: '#10b981',
    description: 'Northern trade and transport boundary covering Bannimantap, Mandi Mohalla, and Torchlight ground.',
    baseWorkers: 15,
  },
  {
    id: 'mcc-zone-6',
    name: 'MCC Zone 6 (Tilak Nagar / Yadavagiri)',
    type: 'mcc_zone',
    center: [12.3200, 76.6350],
    radius: 1250,
    color: '#059669',
    fillColor: '#10b981',
    description: 'North-western zone covering Tilak Nagar, Yadavagiri, and Medar Block.',
    baseWorkers: 14,
  },
  {
    id: 'mcc-zone-7',
    name: 'MCC Zone 7 (Hebbal / KRS Road)',
    type: 'mcc_zone',
    center: [12.3450, 76.6120],
    radius: 1550,
    color: '#059669',
    fillColor: '#10b981',
    description: 'Major IT and industrial corridor covering Hebbal Industrial Area, Kumbarakoppal, and KRS Road.',
    baseWorkers: 16,
  },
  {
    id: 'mcc-zone-8',
    name: 'MCC Zone 8 (Kuvempunagar / Ramakrishnanagar)',
    type: 'mcc_zone',
    center: [12.2820, 76.6220],
    radius: 1450,
    color: '#059669',
    fillColor: '#10b981',
    description: 'Dense residential south-western zone covering Kuvempunagar, Ramakrishnanagar, and Dattagalli.',
    baseWorkers: 18,
  },
  {
    id: 'mcc-zone-9',
    name: 'MCC Zone 9 (Chamundipuram / Ittegagudu)',
    type: 'mcc_zone',
    center: [12.2920, 76.6740],
    radius: 1300,
    color: '#059669',
    fillColor: '#10b981',
    description: 'South-eastern zone bordering Chamundi Hills foothills, Ittegagudu, and Siddartha Layout.',
    baseWorkers: 14,
  },

  // 4 Town Municipal Councils / Town Panchayats (Blue Palette)
  {
    id: 'tp-bogadi',
    name: 'Bogadi Town Panchayat',
    type: 'town_panchayat',
    center: [12.3020, 76.5980],
    radius: 1500,
    color: '#2563eb',
    fillColor: '#3b82f6',
    description: 'Rapidly expanding western peripheral town panchayat adjoining Outer Ring Road.',
    baseWorkers: 10,
  },
  {
    id: 'tp-hootagalli',
    name: 'Hootagalli Town Municipal Council (TMC)',
    type: 'town_panchayat',
    center: [12.3440, 76.5920],
    radius: 1100,
    color: '#2563eb',
    fillColor: '#3b82f6',
    description: 'Western industrial township bordering Belavadi, Koorgalli, and Koorgalli BEML.',
    baseWorkers: 14,
  },
  {
    id: 'tp-kadakola',
    name: 'Kadakola Town Panchayat',
    type: 'town_panchayat',
    center: [12.2020, 76.6680],
    radius: 1200,
    color: '#2563eb',
    fillColor: '#3b82f6',
    description: 'Southern industrial growth corridor on Mysuru-Nanjangud Highway.',
    baseWorkers: 11,
  },
  {
    id: 'tp-rammanahalli',
    name: 'Rammanahalli Town Panchayat',
    type: 'town_panchayat',
    center: [12.3350, 76.7200],
    radius: 1100,
    color: '#2563eb',
    fillColor: '#3b82f6',
    description: 'North-eastern urbanizing boundary on Mahadevapura and Peripheral Ring Road.',
    baseWorkers: 10,
  },

  // 8 Gram Panchayats (Purple Palette)
  {
    id: 'gp-belavadi',
    name: 'Belavadi Gram Panchayat',
    type: 'gram_panchayat',
    center: [12.3320, 76.5650],
    radius: 1450,
    color: '#7c3aed',
    fillColor: '#8b5cf6',
    description: 'Rural-urban fringe adjoining Hootagalli industrial zone and western ring road.',
    baseWorkers: 8,
  },
  {
    id: 'gp-alanahalli',
    name: 'Alanahalli Gram Panchayat',
    type: 'gram_panchayat',
    center: [12.2950, 76.7050],
    radius: 1550,
    color: '#7c3aed',
    fillColor: '#8b5cf6',
    description: 'Eastern peripheral corridor along T. Narasipura & Bannur Road.',
    baseWorkers: 8,
  },
  {
    id: 'gp-siddalingapura',
    name: 'Siddalingapura Gram Panchayat',
    type: 'gram_panchayat',
    center: [12.3680, 76.6620],
    radius: 1550,
    color: '#7c3aed',
    fillColor: '#8b5cf6',
    description: 'Northern gateway panchayat on Bengaluru-Mysuru Expressway entrance.',
    baseWorkers: 7,
  },
  {
    id: 'gp-ilavala',
    name: 'Ilavala Gram Panchayat',
    type: 'gram_panchayat',
    center: [12.3550, 76.5350],
    radius: 1750,
    color: '#7c3aed',
    fillColor: '#8b5cf6',
    description: 'Western highway corridor towards Bilikere and Hunsur.',
    baseWorkers: 8,
  },
  {
    id: 'gp-chamundi-hill',
    name: 'Chamundi Hill Gram Panchayat',
    type: 'gram_panchayat',
    center: [12.2720, 76.6720],
    radius: 1550,
    color: '#7c3aed',
    fillColor: '#8b5cf6',
    description: 'Eco-sensitive peripheral panchayat covering hill base, temple steps, and pilgrim trails.',
    baseWorkers: 7,
  },
  {
    id: 'gp-koorgalli',
    name: 'Koorgalli Gram Panchayat',
    type: 'gram_panchayat',
    center: [12.3550, 76.5820],
    radius: 1550,
    color: '#7c3aed',
    fillColor: '#8b5cf6',
    description: 'Heavy manufacturing and industrial cluster on western periphery.',
    baseWorkers: 8,
  },
  {
    id: 'gp-varuna',
    name: 'Varuna Gram Panchayat',
    type: 'gram_panchayat',
    center: [12.2580, 76.7250],
    radius: 1650,
    color: '#7c3aed',
    fillColor: '#8b5cf6',
    description: 'South-eastern agricultural-residential transition zone near Varuna lake.',
    baseWorkers: 7,
  },
  {
    id: 'gp-dhanagalli',
    name: 'Dhanagalli Gram Panchayat',
    type: 'gram_panchayat',
    center: [12.2350, 76.6080],
    radius: 1550,
    color: '#7c3aed',
    fillColor: '#8b5cf6',
    description: 'Southern rural boundary near Jayapura and HD Kote Road.',
    baseWorkers: 6,
  },

  // 5 Contested Boundary Buffer Zones (Amber/Red Dashed Corridors)
  {
    id: 'buf-bogadi-mcc',
    name: 'Bogadi-MCC Zone 3 Ring Road Buffer',
    type: 'buffer_zone',
    center: [12.3020, 76.6180],
    polygonCoords: [
      [12.3110, 76.6110],
      [12.3120, 76.6260],
      [12.2900, 76.6260],
      [12.2890, 76.6110],
    ],
    color: '#d97706',
    fillColor: '#f59e0b',
    description: 'Contested 1.6km corridor along Ring Road where municipal and panchayat boundaries overlap.',
    baseWorkers: 6,
  },
  {
    id: 'buf-hootagalli-belavadi',
    name: 'Hootagalli-Belavadi Industrial Buffer',
    type: 'buffer_zone',
    center: [12.3390, 76.5770],
    polygonCoords: [
      [12.3480, 76.5710],
      [12.3480, 76.5860],
      [12.3310, 76.5860],
      [12.3310, 76.5710],
    ],
    color: '#d97706',
    fillColor: '#f59e0b',
    description: 'Contested road cuts and drain corridors along industrial development edge.',
    baseWorkers: 6,
  },
  {
    id: 'buf-rammanahalli-prr',
    name: 'Rammanahalli PRR Boundary Buffer',
    type: 'buffer_zone',
    center: [12.3330, 76.7050],
    polygonCoords: [
      [12.3430, 76.6970],
      [12.3430, 76.7130],
      [12.3240, 76.7130],
      [12.3240, 76.6970],
    ],
    color: '#d97706',
    fillColor: '#f59e0b',
    description: 'Corridor under active road widening with jurisdiction demarcations pending.',
    baseWorkers: 5,
  },
  {
    id: 'buf-alanahalli-foothills',
    name: 'Alanahalli-Chamundi Foothills Buffer',
    type: 'buffer_zone',
    center: [12.2830, 76.6920],
    polygonCoords: [
      [12.2930, 76.6840],
      [12.2930, 76.7010],
      [12.2740, 76.7010],
      [12.2740, 76.6840],
    ],
    color: '#d97706',
    fillColor: '#f59e0b',
    description: 'Eastern entry zone with mixed panchayat and MCC revenue survey numbers.',
    baseWorkers: 5,
  },
  {
    id: 'buf-kadakola-nanjangud',
    name: 'Kadakola Industrial Border Buffer',
    type: 'buffer_zone',
    center: [12.2210, 76.6660],
    polygonCoords: [
      [12.2330, 76.6540],
      [12.2330, 76.6770],
      [12.2090, 76.6770],
      [12.2090, 76.6540],
    ],
    color: '#d97706',
    fillColor: '#f59e0b',
    description: 'High-traffic industrial transport corridor crossing southern municipal limits.',
    baseWorkers: 5,
  },
];

export const AdminLeafletMap: React.FC<AdminLeafletMapProps> = ({
  issues,
  bogadiCapacity,
  mccCapacity,
  onSelectIssue,
  isDark: _isDark = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const zonesGroupRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Active filter for map layers
  const [activeZoneFilter, setActiveZoneFilter] = useState<'all' | 'mcc_zone' | 'town_panchayat' | 'gram_panchayat' | 'buffer_zone'>('all');
  const [selectedJurisdictionId, setSelectedJurisdictionId] = useState<string>('all');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Invalidate map dimensions when fullscreen toggles
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [isFullscreen]);

  // 1. Inject Leaflet CDN assets if not present
  useEffect(() => {
    let isMounted = true;

    const loadLeaflet = () => {
      if (!document.getElementById('leaflet-cdn-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-cdn-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      if (!window.L) {
        if (!document.getElementById('leaflet-cdn-js')) {
          const script = document.createElement('script');
          script.id = 'leaflet-cdn-js';
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.async = true;
          script.onload = () => {
            if (isMounted) setIsLoaded(true);
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

    loadLeaflet();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Initialize Leaflet Map centered to encompass all 26 Mysuru jurisdictions
  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current || !window.L) return;
    const L = window.L;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    try {
      const map = L.map(mapContainerRef.current, {
        center: [12.3050, 76.6400], // Centered on Mysuru urban-rural expanse
        zoom: 12,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;
      zonesGroupRef.current = L.layerGroup().addTo(map);
      markersGroupRef.current = L.layerGroup().addTo(map);

      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    } catch (e) {
      console.error('Failed to init Admin Map', e);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isLoaded]);

  // Expose global callback for Leaflet popup HTML buttons
  useEffect(() => {
    (window as any).__civicMeshOpenReport = (issueId: string) => {
      const target = issues.find((i) => i.id === issueId);
      if (target && onSelectIssue) {
        onSelectIssue(target);
      }
    };
    return () => {
      delete (window as any).__civicMeshOpenReport;
    };
  }, [issues, onSelectIssue]);

  // Count active incidents per jurisdiction
  const issuesCountByJurisdiction = useMemo(() => {
    const counts: Record<string, number> = {};
    issues.forEach((issue) => {
      if (issue.status === 'resolved') return;
      // Match against assignedDepot or location
      ALL_JURISDICTIONS_GEO.forEach((j) => {
        if (issue.assignedDepot && issue.assignedDepot.toLowerCase().includes(j.name.toLowerCase().split(' (')[0])) {
          counts[j.id] = (counts[j.id] || 0) + 1;
        } else if (issue.location.toLowerCase().includes(j.name.toLowerCase().split(' (')[0])) {
          counts[j.id] = (counts[j.id] || 0) + 1;
        }
      });
    });
    return counts;
  }, [issues]);

  // 3. Render ALL 26 Jurisdictions on the map
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L || !zonesGroupRef.current) return;
    const L = window.L;
    zonesGroupRef.current.clearLayers();

    const isBogadiOverloaded = bogadiCapacity > 100;

    ALL_JURISDICTIONS_GEO.forEach((geo) => {
      // Check filter
      if (activeZoneFilter !== 'all' && geo.type !== activeZoneFilter) {
        return;
      }
      if (selectedJurisdictionId !== 'all' && geo.id !== selectedJurisdictionId) {
        return;
      }

      const activeCount = issuesCountByJurisdiction[geo.id] || 0;

      // Find matching issues for this jurisdiction circle/zone
      const zoneIssues = issues.filter((iss) => {
        if (iss.jurisdictionId === geo.id) return true;
        const inBuf = Boolean(iss.isBufferZone);
        if (geo.type === 'buffer_zone' && inBuf) return true;
        const prefix = geo.name.toLowerCase().split(' (')[0];
        if (iss.assignedDepot && iss.assignedDepot.toLowerCase().includes(prefix)) return true;
        if (iss.location && iss.location.toLowerCase().includes(prefix)) return true;
        return false;
      });

      const issueReportsList = zoneIssues.slice(0, 3).map((iss) => `
        <button onclick="window.__civicMeshOpenReport && window.__civicMeshOpenReport('${iss.id}')" style="display: flex; align-items: center; justify-content: space-between; width: 100%; text-align: left; padding: 5px 7px; margin-top: 4px; font-size: 11px; font-weight: 600; border: 1px solid #cbd5e1; border-radius: 6px; background: #ffffff; cursor: pointer; color: #0f172a; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: background 0.15s;">
          <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 130px;">${iss.title}</span>
          <span style="color: #059669; font-weight: 700; font-size: 10px; margin-left: 4px; shrink-0;">Inspect &rarr;</span>
        </button>
      `).join('');

      const reportsHtml = zoneIssues.length > 0
        ? `
          <div style="margin-top: 8px; border-top: 1px solid #e2e8f0; padding-top: 6px;">
            <div style="font-weight: 700; font-size: 10px; color: #475569; text-transform: uppercase; margin-bottom: 3px;">
              Active Grievance Reports (${zoneIssues.length})
            </div>
            ${issueReportsList}
          </div>
        `
        : '';

      if (geo.type === 'buffer_zone' && geo.polygonCoords) {
        // Draw buffer corridor polygon
        const hasActiveBufferTicket = issues.some(i => Boolean(i.isBufferZone) && !['resolved', 'closed', 'quarantined'].includes(i.status));
        const isCorridorActive = isBogadiOverloaded && hasActiveBufferTicket && geo.id === 'buf-bogadi-mcc';
        const polygon = L.polygon(geo.polygonCoords, {
          color: isCorridorActive ? '#dc2626' : geo.color,
          fillColor: isCorridorActive ? '#ef4444' : geo.fillColor,
          fillOpacity: 0.28,
          weight: 2.5,
          dashArray: '6, 6',
        });

        polygon.bindTooltip(
          `<div style="font-family: inherit; font-size: 11px; padding: 2px;">
            <div style="font-weight: 800; color: ${isCorridorActive ? '#dc2626' : '#b45309'}; text-transform: uppercase;">
              ⚠️ ${geo.name}
            </div>
            <div style="font-size: 10px; color: #44403c; margin-top: 2px;">
              ${isCorridorActive ? '⚡ Geo-Elastic Spillover ACTIVE → Routed to MCC Zone 3' : 'Inter-Agency Boundary Corridor'}
            </div>
          </div>`,
          { permanent: false, direction: 'center', className: 'custom-map-tooltip' }
        );

        polygon.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; line-height: 1.4; color: #1c1917; min-width: 220px;">
            <div style="display:flex; align-items:center; gap:4px; font-weight:800; color:#b45309; text-transform:uppercase; font-size:10px;">
              <span>Boundary Buffer Corridor</span>
            </div>
            <div style="font-weight:700; font-size:13px; margin: 2px 0;">${geo.name}</div>
            <div style="font-size:11px; color:#57534e; margin-bottom:6px;">${geo.description}</div>
            <div style="background:#fef3c7; border:1px solid #fde68a; border-radius:6px; padding:6px; font-size:11px;">
              <div><strong>Joint Workforce Pool:</strong> ${geo.baseWorkers} Personnel</div>
              <div><strong>Spillover Routing:</strong> ${isCorridorActive ? 'Active (MCC absorbs tasks)' : 'Standard Joint Patrol'}</div>
            </div>
            ${reportsHtml}
          </div>
        `);

        zonesGroupRef.current.addLayer(polygon);
      } else {
        // Draw circular jurisdiction boundary
        const circle = L.circle(geo.center, {
          radius: geo.radius || 1300,
          color: geo.color,
          fillColor: geo.fillColor,
          fillOpacity: 0.16,
          weight: 2,
        });

        const typeLabel = 
          geo.type === 'mcc_zone' 
            ? 'MCC Zone' 
            : geo.type === 'town_panchayat' 
            ? 'Town Panchayat / TMC' 
            : 'Gram Panchayat';

        circle.bindTooltip(
          `<div style="font-family: inherit; font-size: 11px; padding: 2px;">
            <div style="font-weight: 700; color: ${geo.color};">
              ${geo.name}
            </div>
            <div style="font-size: 10px; color: #475569;">
              ${typeLabel} • ${geo.baseWorkers} Workers
            </div>
          </div>`,
          { permanent: false, direction: 'center', className: 'custom-map-tooltip' }
        );

        circle.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; line-height: 1.4; color: #1c1917; min-width: 220px;">
            <div style="display:flex; align-items:center; gap:4px; font-weight:800; color:${geo.color}; text-transform:uppercase; font-size:10px;">
              <span>${typeLabel}</span>
            </div>
            <div style="font-weight:700; font-size:13px; margin: 2px 0;">${geo.name}</div>
            <div style="font-size:11px; color:#57534e; margin-bottom:6px;">${geo.description}</div>
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:6px; font-size:11px;">
              <div><strong>Assigned Workforce:</strong> ${geo.baseWorkers} Field Workers</div>
              <div><strong>Active Incidents:</strong> ${activeCount}</div>
            </div>
            ${reportsHtml}
          </div>
        `);

        circle.on('click', () => {
          circle.openPopup();
        });

        zonesGroupRef.current.addLayer(circle);
      }
    });
  }, [isLoaded, activeZoneFilter, selectedJurisdictionId, bogadiCapacity, mccCapacity, issuesCountByJurisdiction, issues]);

  // 4. Render ticket pins on the map
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L || !markersGroupRef.current) return;
    const L = window.L;
    markersGroupRef.current.clearLayers();

    issues.forEach((issue) => {
      if (!issue.coordinates) return;

      const inBuffer = Boolean(issue.isBufferZone);
      const isSpillover = inBuffer && bogadiCapacity > 100;
      const effectiveDepot = isSpillover ? 'MCC Zone 3' : (issue.assignedDepot || (inBuffer ? 'Bogadi Panchayat' : 'MCC Zone 3'));
      const score = (issue.severityRank || getPriorityScore(issue.category)) as number;

      const pinColor = isSpillover 
        ? '#dc2626' 
        : score === 5 
        ? '#dc2626' 
        : score === 4 
        ? '#ea580c' 
        : score === 3 
        ? '#d97706' 
        : score === 2 
        ? '#2563eb' 
        : '#78716c';

      const customPin = L.divIcon({
        className: 'custom-admin-ticket-pin',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            ${isSpillover ? '<div style="position: absolute; width: 28px; height: 28px; border-radius: 9999px; background: rgba(220, 38, 38, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>' : ''}
            <div style="width: 22px; height: 22px; border-radius: 9999px; background: ${pinColor}; border: 2.5px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 11px;">
              ${score}
            </div>
            ${issue.isFlagged ? '<div style="position: absolute; top: -6px; right: -6px; width: 12px; height: 12px; background: #dc2626; border-radius: 9999px; border: 1.5px solid white;"></div>' : ''}
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      // Validation Rule: Ensure that if a ticket is mathematically routed as a spillover/buffer issue,
      // its visual map marker absolutely must render inside the contested dashed zones, not inside the primary jurisdiction circles.
      let markerLat = issue.coordinates.lat;
      let markerLng = issue.coordinates.lng;

      if (inBuffer) {
        // Check if coordinates already lie strictly inside one of the 5 contested buffer polygons
        const inBogadi = markerLat >= 12.2890 && markerLat <= 12.3120 && markerLng >= 76.6110 && markerLng <= 76.6260;
        const inHootagalli = markerLat >= 12.3310 && markerLat <= 12.3480 && markerLng >= 76.5710 && markerLng <= 76.5860;
        const inRammanahalli = markerLat >= 12.3240 && markerLat <= 12.3430 && markerLng >= 76.6970 && markerLng <= 76.7130;
        const inAlanahalli = markerLat >= 12.2740 && markerLat <= 12.2930 && markerLng >= 76.6840 && markerLng <= 76.7010;
        const inKadakola = markerLat >= 12.2090 && markerLat <= 12.2330 && markerLng >= 76.6540 && markerLng <= 76.6770;

        if (!inBogadi && !inHootagalli && !inRammanahalli && !inAlanahalli && !inKadakola) {
          // If ticket has legacy coordinates or drifted, snap strictly inside its contested buffer corridor polygon
          const locLower = (issue.location || '').toLowerCase();
          if (locLower.includes('hootagalli') || locLower.includes('belavadi')) {
            markerLat = 12.3390;
            markerLng = 76.5770;
          } else if (locLower.includes('rammanahalli') || locLower.includes('prr')) {
            markerLat = 12.3330;
            markerLng = 76.7050;
          } else if (locLower.includes('alanahalli') || locLower.includes('foothills') || locLower.includes('chamundi')) {
            markerLat = 12.2830;
            markerLng = 76.6920;
          } else if (locLower.includes('kadakola') || locLower.includes('industrial') || locLower.includes('nanjangud')) {
            markerLat = 12.2210;
            markerLng = 76.6660;
          } else {
            // Default Bogadi-MCC Zone 3 Buffer Zone corridor center
            markerLat = 12.3020;
            markerLng = 76.6180;
          }
        }
      }

      const marker = L.marker([markerLat, markerLng], {
        icon: customPin,
      });

      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4; color: #1c1917; min-width: 220px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-weight: 800; color: ${pinColor}; text-transform: uppercase; font-size: 11px;">
              Score: ${score}/5 • ${issue.category}
            </span>
            ${issue.isFlagged ? '<span style="color: #dc2626; font-size: 10px; font-weight: 700;">⚠️ Flagged</span>' : ''}
          </div>
          <div style="font-weight: 700; margin-bottom: 2px;">${issue.title}</div>
          <div style="font-size: 11px; color: #57534e; margin-bottom: 6px;">${issue.location}</div>
          ${inBuffer ? '<div style="color: #b45309; background: #fef3c7; border: 1px solid #fde68a; border-radius: 4px; padding: 2px 6px; font-size: 10px; font-weight: 700; margin-bottom: 4px;">⚠️ Contested Boundary Buffer Corridor</div>' : ''}
          <div style="background: #f5f5f4; border-radius: 6px; padding: 6px; font-size: 11px; margin-bottom: 4px;">
            <div><strong>Assigned Depot:</strong> <span style="color: ${isSpillover ? '#dc2626' : '#059669'}; font-weight: 700;">${effectiveDepot}</span></div>
            ${isSpillover ? '<div style="color: #dc2626; font-size: 10px; font-weight: 600; margin-top: 2px;">⚡ Spillover Assigned (Inter-Agency Ledger Credited)</div>' : ''}
            <div><strong>Status:</strong> ${issue.status.replace('_', ' ')}</div>
          </div>
        </div>
      `);

      marker.on('click', () => {
        if (onSelectIssue) onSelectIssue(issue);
      });

      markersGroupRef.current.addLayer(marker);
    });
  }, [issues, bogadiCapacity, mccCapacity, isLoaded]);

  // Center on specific jurisdiction when selected from dropdown
  const handleSelectJurisdiction = (id: string) => {
    setSelectedJurisdictionId(id);
    if (!mapInstanceRef.current) return;

    if (id === 'all') {
      mapInstanceRef.current.flyTo([12.3050, 76.6400], 12);
    } else {
      const match = ALL_JURISDICTIONS_GEO.find((j) => j.id === id);
      if (match) {
        mapInstanceRef.current.flyTo(match.center, 14);
      }
    }
  };

  const handleResetCenter = () => {
    setSelectedJurisdictionId('all');
    setActiveZoneFilter('all');
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([12.3050, 76.6400], 12);
    }
  };

  return (
    <div className="space-y-3">
      {/* Top Filter & Jurisdiction Selector Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => { setActiveZoneFilter('all'); setSelectedJurisdictionId('all'); }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              activeZoneFilter === 'all'
                ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300'
            }`}
          >
            All 26 Jurisdictions
          </button>
          <button
            type="button"
            onClick={() => { setActiveZoneFilter('mcc_zone'); setSelectedJurisdictionId('all'); }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
              activeZoneFilter === 'mcc_zone'
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>9 MCC Zones</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveZoneFilter('town_panchayat'); setSelectedJurisdictionId('all'); }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
              activeZoneFilter === 'town_panchayat'
                ? 'bg-blue-700 text-white'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>4 Town Panchayats</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveZoneFilter('gram_panchayat'); setSelectedJurisdictionId('all'); }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
              activeZoneFilter === 'gram_panchayat'
                ? 'bg-purple-700 text-white'
                : 'bg-purple-50 text-purple-800 hover:bg-purple-100 dark:bg-purple-950/60 dark:text-purple-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span>8 Gram Panchayats</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveZoneFilter('buffer_zone'); setSelectedJurisdictionId('all'); }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
              activeZoneFilter === 'buffer_zone'
                ? 'bg-amber-700 text-white'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300'
            }`}
          >
            <span className="w-2 h-2 rounded-sm bg-amber-500" />
            <span>5 Buffer Corridors</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Jump Dropdown */}
          <select
            id="map-jurisdiction-select"
            value={selectedJurisdictionId}
            onChange={(e) => handleSelectJurisdiction(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-medium text-stone-800 dark:text-stone-200"
          >
            <option value="all">Focus: Whole Mysuru District</option>
            <optgroup label="9 MCC Zones">
              {ALL_JURISDICTIONS_GEO.filter(j => j.type === 'mcc_zone').map(j => (
                <option key={j.id} value={j.id}>{j.name}</option>
              ))}
            </optgroup>
            <optgroup label="4 Town Panchayats">
              {ALL_JURISDICTIONS_GEO.filter(j => j.type === 'town_panchayat').map(j => (
                <option key={j.id} value={j.id}>{j.name}</option>
              ))}
            </optgroup>
            <optgroup label="8 Gram Panchayats">
              {ALL_JURISDICTIONS_GEO.filter(j => j.type === 'gram_panchayat').map(j => (
                <option key={j.id} value={j.id}>{j.name}</option>
              ))}
            </optgroup>
            <optgroup label="5 Contested Buffer Corridors">
              {ALL_JURISDICTIONS_GEO.filter(j => j.type === 'buffer_zone').map(j => (
                <option key={j.id} value={j.id}>{j.name}</option>
              ))}
            </optgroup>
          </select>

          <button
            type="button"
            onClick={handleResetCenter}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold transition-all active:scale-95 cursor-pointer border border-stone-200/60 dark:border-stone-700/60"
            title="Reset to whole Mysuru District"
          >
            <Crosshair className="w-3.5 h-3.5 text-stone-600 dark:text-stone-400" />
            <span>Reset View</span>
          </button>

          {/* Full Screen Mode Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold transition-all active:scale-95 cursor-pointer border border-stone-200/60 dark:border-stone-700/60"
            title={isFullscreen ? 'Exit Full Screen' : 'View Map Full Screen'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-amber-500" />
                <span>Exit Full Screen</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Full Screen</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className={`relative w-full rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 shadow-inner bg-stone-100 dark:bg-stone-900 ${
        isFullscreen ? 'grow min-h-[78vh]' : 'h-84 sm:h-96'
      }`}>
        {!isLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-stone-100 dark:bg-stone-900 text-stone-500 z-20">
            <Navigation className="w-6 h-6 animate-spin text-emerald-600" />
            <span className="text-xs font-medium">Loading Mysuru Jurisdictional Map...</span>
          </div>
        )}
        <div ref={mapContainerRef} className="w-full h-full" id="admin-leaflet-container" />
      </div>

      {/* Map Legend */}
      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-stone-600 dark:text-stone-400">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white"></span>
          <span>9 MCC Zones</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-500 border border-white"></span>
          <span>4 Town Panchayats</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-purple-500 border border-white"></span>
          <span>8 Gram Panchayats</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-amber-500 border border-dashed border-amber-800"></span>
          <span className="font-semibold text-amber-700 dark:text-amber-400">5 Boundary Buffers</span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-[11px] text-stone-500">Pins: Severity Score 1-5 • Red pulse = Spillover</span>
        </div>
      </div>
    </div>
  );
};
