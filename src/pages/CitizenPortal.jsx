import React, { useState, useEffect, useRef } from 'react';
import Map, { Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { submitIncident, uploadEvidence } from '../lib/supabaseClient';
import { calculateSeverity, calculateRouting } from '../utils/engine';
import zonesData from '../data/mysuru_zones.json';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN;

export default function CitizenPortal() {
  const [location, setLocation] = useState({ lat: 12.3051, lng: 76.6413 }); // Mysuru center
  const [address, setAddress] = useState('Fetching address...');
  const [formData, setFormData] = useState({ category: '', description: '' });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trackingId, setTrackingId] = useState(null);
  const [language, setLanguage] = useState('en');

  const mapRef = useRef();

  const dict = {
    en: { title: "Report an Issue", desc: "Help keep Mysuru clean.", loc: "Use My Location", sub: "Submit Report", loading: "Processing..." },
    kn: { title: "ಸಮಸ್ಯೆಯನ್ನು ವರದಿ ಮಾಡಿ", desc: "ಮೈಸೂರನ್ನು ಸ್ವಚ್ಛವಾಗಿಡಲು ಸಹಾಯ ಮಾಡಿ.", loc: "ನನ್ನ ಸ್ಥಳವನ್ನು ಬಳಸಿ", sub: "ವರದಿಯನ್ನು ಸಲ್ಲಿಸಿ", loading: "ಪ್ರಕ್ರಿಯೆಯಲ್ಲಿದೆ..." }
  };
  const t = dict[language];

  // Geolocation
  const handleUseLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setLocation({ lat: latitude, lng: longitude });
          mapRef.current?.flyTo({ center: [longitude, latitude], zoom: 15 });
          reverseGeocode(latitude, longitude);
        },
        () => alert("Location access denied or unavailable.")
      );
    }
  };

  // Debounced Geocoding
  const reverseGeocode = async (lat, lng) => {
    if (!MAPBOX_TOKEN) return;
    try {
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`);
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        setAddress(data.features[0].place_name);
      } else {
        setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      }
    } catch {
      setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => reverseGeocode(location.lat, location.lng), 500);
    return () => clearTimeout(timeout);
  }, [location]);

  const handleFile = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category || !file) return alert("Category and Photo are required");

    // Rate Limiting (Spam Prevention)
    const lastSubmit = localStorage.getItem('last_submit_time');
    if (lastSubmit && Date.now() - parseInt(lastSubmit) < 60000) {
        return alert("Please wait 60 seconds before submitting another report.");
    }

    setIsSubmitting(true);
    try {
      // 1. Process Metadata
      const severity = calculateSeverity(formData.category, formData.description, 150); // mocked 150m from arterial

      // 2. Fetch Zonal Capacities (Mocking an RPC call for demo purposes by hardcoding)
      // In production, this would query the `fleet_assets` and `incidents` view
      const mockZonalCapacities = {
        'MCC_ZONE_3': 45.0,
        'TP_BOGADI': 140.0
      };

      // 3. Routing Engine
      const routing = calculateRouting(location.lat, location.lng, zonesData, mockZonalCapacities);
      if (!routing.targetZoneId) throw new Error("Location out of bounds.");

      // 4. Upload Image (Compress in prod, raw here for MVP)
      const fileName = `before_${Date.now()}.jpg`;
      const publicUrl = await uploadEvidence(file, fileName);

      // 5. Submit Payload
      const payload = {
        tracking_code: `MYS-${Math.floor(1000 + Math.random() * 9000)}`,
        latitude: location.lat,
        longitude: location.lng,
        category: formData.category,
        description: formData.description,
        evidence_photo_url: publicUrl,
        before_image_url: publicUrl,
        severity_rank: severity,
        home_zone_id: routing.homeZoneId,
        dispatched_zone_id: routing.targetZoneId,
        is_spillover: routing.isSpillover
      };

      const result = await submitIncident(payload);
      localStorage.setItem('last_submit_time', Date.now().toString());
      setTrackingId(result.data.tracking_code);
    } catch (err) {
      console.error(err);
      alert("Submission failed: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (trackingId) {
    return (
      <div className="flex-grow flex items-center justify-center p-6">
         <div className="bg-white p-10 rounded-2xl shadow-sm text-center max-w-md w-full border border-slate-100">
           <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">✓</div>
           <h2 className="text-2xl font-bold text-slate-900 mb-2">Report Submitted</h2>
           <p className="text-slate-600 mb-6">Your tracking ID is:</p>
           <div className="bg-slate-100 p-4 rounded-xl text-2xl font-mono text-slate-800 tracking-widest mb-8">{trackingId}</div>
           <button onClick={() => window.location.reload()} className="text-orange-600 font-medium hover:underline">Report Another Issue</button>
         </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 grid md:grid-cols-2 gap-8 h-full">
      {/* Left: Map */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 relative h-[50vh] md:h-auto min-h-[400px]">
        {MAPBOX_TOKEN ? (
            <Map
            ref={mapRef}
            initialViewState={{ longitude: location.lng, latitude: location.lat, zoom: 13 }}
            mapStyle="mapbox://styles/mapbox/streets-v12"
            mapboxAccessToken={MAPBOX_TOKEN}
            onClick={(e) => setLocation({ lat: e.lngLat.lat, lng: e.lngLat.lng })}
            >
            <Marker longitude={location.lng} latitude={location.lat} color="#ea580c" draggable onDragEnd={(e) => setLocation({ lat: e.lngLat.lat, lng: e.lngLat.lng })} />
            </Map>
        ) : (
            <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-500">Mapbox Token Missing</div>
        )}

        <div className="absolute top-4 left-4 right-4 bg-white/95 backdrop-blur p-4 rounded-xl shadow-md">
           <p className="text-sm text-slate-500 font-medium uppercase tracking-wider mb-1">Selected Location</p>
           <p className="text-slate-900 font-semibold truncate">{address}</p>
        </div>

        <button
          onClick={handleUseLocation}
          className="absolute bottom-6 right-6 bg-slate-900 text-white px-6 py-3 rounded-full font-medium shadow-lg hover:bg-slate-800 transition"
        >
          {t.loc}
        </button>
      </div>

      {/* Right: Form */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-slate-900">{t.title}</h1>
            <button onClick={() => setLanguage(lang => lang === 'en' ? 'kn' : 'en')} className="text-sm bg-slate-100 px-3 py-1 rounded-md text-slate-600 hover:bg-slate-200">
                {language === 'en' ? 'ಕನ್ನಡ' : 'English'}
            </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Issue Category</label>
            <select
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value})}
            >
              <option value="">Select an issue type...</option>
              <option value="CD_DEBRIS">Construction & Demolition Debris</option>
              <option value="OVERFLOWING_BIN">Overflowing Public Bin</option>
              <option value="POTHOLE">Pothole / Cave-in</option>
              <option value="DRAINAGE_CLOG">Drainage Clog</option>
              <option value="STREETLIGHT_OUT">Streetlight Outage</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
            <textarea
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none h-32 resize-none"
              placeholder="Provide brief details..."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Photo Evidence</label>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition overflow-hidden">
                {preview ? (
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                    <div className="text-slate-500 flex flex-col items-center">
                        <span className="text-2xl mb-2">📸</span>
                        <span className="text-sm font-medium">Tap to upload or take photo</span>
                    </div>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !formData.category || !file}
            className="w-full bg-orange-500 text-white font-bold text-lg py-4 rounded-xl hover:bg-orange-600 disabled:opacity-50 transition"
          >
            {isSubmitting ? t.loading : t.sub}
          </button>
        </form>
      </div>
    </div>
  );
}
