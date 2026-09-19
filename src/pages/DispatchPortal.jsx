import React, { useState, useEffect } from 'react';
import Map, { Source, Layer, Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { fetchActiveIncidents, subscribeToIncidents, supabase } from '../lib/supabaseClient';
import zonesData from '../data/mysuru_zones.json';
import { AlertCircle, FileText } from 'lucide-react';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN;


export default function DispatchPortal() {
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null); // For the Side-by-Side Modal

  // Calculate Capacity
  const baseFleet = { 'MCC_ZONE_3': 10, 'TP_BOGADI': 3 }; // Simplified for demo
  const activeCounts = { 'MCC_ZONE_3': 0, 'TP_BOGADI': 0 };

  incidents.forEach(inc => {
      if(activeCounts[inc.assigned_zone] !== undefined) {
          activeCounts[inc.assigned_zone]++;
      }
  });

  const capacities = {
      'MCC_ZONE_3': (activeCounts['MCC_ZONE_3'] / baseFleet['MCC_ZONE_3']) * 100 || 0,
      'TP_BOGADI': (activeCounts['TP_BOGADI'] / baseFleet['TP_BOGADI']) * 100 || 0,
  };

  useEffect(() => {
    fetchActiveIncidents().then(res => {
      if(res.data) setIncidents(res.data);
    });

    const subscription = subscribeToIncidents((payload) => {
        if(payload.eventType === 'INSERT') {
            setIncidents(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
            setIncidents(prev => prev.map(inc => inc.id === payload.new.id ? payload.new : inc));
        }
    });

    return () => {
        supabase.removeChannel(subscription);
    };
  }, []);

  const handleExportLedger = async () => {
      // Mock Resend trigger
      alert(`Ledger Export Triggered.\nAn automated email with CSV attached has been sent to district.treasury@mysuru.gov.in using Resend API.`);
  };

  return (
    <div className="flex-grow flex flex-col md:flex-row h-full overflow-hidden bg-slate-50">

      {/* Side-by-Side Resolution Modal */}
      {selectedIncident && selectedIncident.after_image_url && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-2xl max-w-4xl w-full shadow-2xl relative">
                <button onClick={() => setSelectedIncident(null)} className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 text-2xl font-bold">&times;</button>
                <h2 className="text-2xl font-bold mb-6 text-slate-900">Verification Audit: {selectedIncident.tracking_code}</h2>
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <p className="font-semibold text-slate-700 mb-2 uppercase text-sm tracking-wider">Before (Citizen)</p>
                        <img src={selectedIncident.before_image_url} alt="Before" className="w-full h-64 object-cover rounded-xl border border-slate-200 bg-slate-100" />
                    </div>
                    <div>
                        <p className="font-semibold text-emerald-600 mb-2 uppercase text-sm tracking-wider">After (Verified Field Closure)</p>
                        <img src={selectedIncident.after_image_url} alt="After" className="w-full h-64 object-cover rounded-xl border border-emerald-200 bg-emerald-50" />
                    </div>
                </div>
                <div className="mt-6 flex justify-between items-center text-sm text-slate-500 border-t border-slate-100 pt-4">
                    <p>Resolved Zone: {selectedIncident.assigned_zone}</p>
                    <p>Timestamp: {new Date(selectedIncident.resolved_at).toLocaleString()}</p>
                </div>
            </div>
        </div>
      )}

      {/* Left: Dashboard panel */}
      <div className="w-full md:w-1/3 p-6 overflow-y-auto border-r border-slate-200 bg-white">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Dispatch Hub</h1>

        {/* Quota Governor Alert */}
        {capacities['TP_BOGADI'] > 100 && (
             <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                 <AlertCircle className="text-red-500 mt-1 shrink-0" size={20} />
                 <div>
                     <h3 className="font-bold text-red-900">Audit Alert: Bogadi Saturated</h3>
                     <p className="text-red-700 text-sm mt-1">TP_BOGADI is at {capacities['TP_BOGADI'].toFixed(0)}% capacity. All new boundary tickets are auto-spilling to MCC Zone 3.</p>
                 </div>
             </div>
        )}

        {/* Capacity Grid */}
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Live Capacity</h2>
        <div className="space-y-4 mb-10">
            {Object.keys(baseFleet).map(zoneId => {
                const cap = capacities[zoneId];
                const isOver = cap > 100;
                const color = isOver ? 'bg-red-500' : cap > 75 ? 'bg-amber-500' : 'bg-emerald-500';

                return (
                    <div key={zoneId} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold text-slate-900">{zoneId}</span>
                            <span className={`font-bold ${isOver ? 'text-red-600' : 'text-slate-600'}`}>{cap.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div className={`h-full ${color} transition-all`} style={{ width: `${Math.min(cap, 100)}%` }}></div>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">{activeCounts[zoneId]} Active Tasks / {baseFleet[zoneId]} Fleet Assets</p>
                    </div>
                );
            })}
        </div>

        {/* Inter-Agency Ledger */}
        <div className="flex justify-between items-end mb-4">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Inter-Agency Ledger</h2>
            <button onClick={handleExportLedger} className="flex items-center text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition">
                <FileText size={14} className="mr-1" /> Export CSV
            </button>
        </div>

        <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
            {incidents.filter(i => i.is_spillover).slice(0,5).map(inc => (
                <div key={inc.id} className="p-3 border-b border-slate-200 last:border-0 text-sm">
                    <div className="flex justify-between font-semibold text-slate-700">
                        <span>{inc.tracking_code}</span>
                        <span className="text-red-600">- ₹3,400</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                        Debit: {inc.home_zone_id} | Credit: {inc.assigned_zone}
                    </div>
                </div>
            ))}
            {incidents.filter(i => i.is_spillover).length === 0 && (
                <div className="p-4 text-sm text-slate-500 text-center">No cross-border transactions today.</div>
            )}
        </div>
      </div>

      {/* Right: Map */}
      <div className="w-full md:w-2/3 relative min-h-[500px]">
         {MAPBOX_TOKEN ? (
            <Map
                initialViewState={{ longitude: 76.6200, latitude: 12.3000, zoom: 12 }}
                mapStyle="mapbox://styles/mapbox/light-v11"
                mapboxAccessToken={MAPBOX_TOKEN}
            >
                {/* Render Zones */}
                <Source id="mysuru-zones" type="geojson" data={zonesData}>
                    <Layer
                        id="zone-fills"
                        type="fill"
                        paint={{
                            'fill-color': ['match', ['get', 'zone_id'], 'MCC_ZONE_3', '#3b82f6', 'TP_BOGADI', '#f59e0b', '#ccc'],
                            'fill-opacity': 0.1
                        }}
                    />
                    <Layer
                        id="zone-borders"
                        type="line"
                        paint={{ 'line-color': '#94a3b8', 'line-width': 2, 'line-dasharray': [2, 2] }}
                    />
                </Source>

                {/* Render Incidents */}
                {incidents.map(inc => (
                    <Marker key={inc.id} longitude={inc.longitude} latitude={inc.latitude} onClick={() => inc.after_image_url && setSelectedIncident(inc)}>
                        <div className={`w-4 h-4 rounded-full border-2 border-white shadow-md cursor-pointer ${
                            inc.status === 'RESOLVED' ? 'bg-emerald-500' :
                            inc.is_spillover ? 'bg-amber-500' : 'bg-red-500'
                        }`} />
                    </Marker>
                ))}
            </Map>
         ) : (
             <div className="w-full h-full bg-slate-200 flex items-center justify-center">Mapbox Token Missing</div>
         )}
      </div>

    </div>
  );
}
