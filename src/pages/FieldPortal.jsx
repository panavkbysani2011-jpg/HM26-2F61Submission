import React, { useState, useEffect } from 'react';
import { fetchActiveIncidents, resolveIncident, uploadEvidence, writeLedger } from '../lib/supabaseClient';
import { checkGeofence, calculateFinance } from '../utils/engine';
import { Navigation, Camera, CheckCircle } from 'lucide-react';

export default function FieldPortal() {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);

  // Geolocation state

  const [geoError, setGeoError] = useState('');
  const [watchId, setWatchId] = useState(null);
  const [distanceInfo, setDistanceInfo] = useState(null);

  // Resolution state
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
      loadTasks();
      return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
  }, []);

  const loadTasks = () => {
      // In prod, this fetches only tasks for the logged-in worker's zone.
      fetchActiveIncidents().then(res => {
          if (res.data) setTasks(res.data);
      });
  };

  const handleSelectTask = (task) => {
      setSelectedTask(task);
      setFile(null);
      setPreview(null);
      setDistanceInfo(null);

      // Start tracking location for geofence
      if (watchId) navigator.geolocation.clearWatch(watchId);
      if (navigator.geolocation) {
          const id = navigator.geolocation.watchPosition(
              (pos) => {
                  const { latitude, longitude } = pos.coords;


                  // Run scanning algorithm
                  const result = checkGeofence(task.latitude, task.longitude, latitude, longitude);
                  setDistanceInfo(result);
              },
              () => setGeoError("Location access required for task closure."),
              { enableHighAccuracy: true }
          );
          setWatchId(id);
      }
  };

  const handleFile = (e) => {
      const selected = e.target.files[0];
      if (selected) {
          setFile(selected);
          setPreview(URL.createObjectURL(selected));
      }
  };

  const handleSubmitResolution = async () => {
      if (!distanceInfo?.isValid) return alert("You are too far from the site.");
      if (!file) return alert("Verification photo is required.");

      setIsSubmitting(true);
      try {
          const fileName = `after_${selectedTask.id}_${Date.now()}.jpg`;
          const publicUrl = await uploadEvidence(file, fileName);

          // If spillover, calculate finance and write ledger
          if (selectedTask.is_spillover) {
              const cost = calculateFinance(2.5, 5, 2); // Mocked values for demo
              await writeLedger({
                  incident_id: selectedTask.id,
                  debtor_zone_id: selectedTask.home_zone_id,
                  creditor_zone_id: selectedTask.dispatched_zone_id,
                  clearing_cost_inr: cost
              });
          }

          await resolveIncident(selectedTask.id, publicUrl);
          alert("Task Resolved Successfully.");
          setSelectedTask(null);
          loadTasks();
      return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
      } catch (err) {
          console.error(err);
          alert("Failed to close task: " + err.message);
      } finally {
          setIsSubmitting(false);
      }
  };

  if (selectedTask) {
      return (
          <div className="max-w-md mx-auto p-4 h-full bg-slate-900 text-slate-100 min-h-screen pt-8">
              <button onClick={() => setSelectedTask(null)} className="text-orange-400 font-bold mb-6">← Back to Queue</button>

              <h2 className="text-2xl font-bold mb-2">{selectedTask.tracking_code}</h2>
              <p className="text-slate-400 mb-6">{selectedTask.category} • Rank {selectedTask.severity_rank}</p>

              {/* Geofence Telemetry */}
              <div className="bg-slate-800 p-4 rounded-xl mb-6 border border-slate-700">
                  <h3 className="font-semibold text-slate-300 mb-2 uppercase text-xs tracking-widest">GPS Geofence Lock</h3>
                  {distanceInfo ? (
                      <div>
                          <p className={`text-xl font-bold ${distanceInfo.isValid ? 'text-emerald-400' : 'text-red-400'}`}>
                             {distanceInfo.distanceMeters}m away
                          </p>
                          <p className="text-sm mt-1 text-slate-400">
                              {distanceInfo.isValid ? '✓ You are within the 50m verification zone.' : '✗ Move closer to the pinned location to unlock camera.'}
                          </p>
                      </div>
                  ) : (
                      <p className="text-amber-400 animate-pulse">Acquiring GPS Lock...</p>
                  )}
                  {geoError && <p className="text-red-400 text-sm mt-2">{geoError}</p>}
              </div>

              {/* Camera Enforcer */}
              <div className={`transition-opacity ${!distanceInfo?.isValid ? 'opacity-50 pointer-events-none' : ''}`}>
                 <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-600 rounded-xl cursor-pointer bg-slate-800 hover:bg-slate-700 transition overflow-hidden">
                    {preview ? (
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                        <div className="text-slate-400 flex flex-col items-center">
                            <Camera size={32} className="mb-2" />
                            <span className="text-sm font-medium">Capture Proof of Resolution</span>
                            <span className="text-xs text-slate-500 mt-1">Native Camera Only</span>
                        </div>
                    )}
                    {/* CRITICAL: capture="environment" bypasses gallery on mobile */}
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
                </label>

                <button
                    onClick={handleSubmitResolution}
                    disabled={!file || isSubmitting}
                    className="w-full bg-emerald-600 text-white font-bold text-lg py-4 rounded-xl mt-6 hover:bg-emerald-500 disabled:opacity-50 transition"
                >
                    {isSubmitting ? 'Verifying & Closing...' : 'Submit Resolution'}
                </button>
              </div>
          </div>
      );
  }

  return (
    <div className="max-w-md mx-auto p-4 bg-slate-100 min-h-screen">
       <h1 className="text-2xl font-bold text-slate-900 mb-6 px-2">Assigned Work Orders</h1>

       <div className="space-y-4">
           {tasks.map(task => (
               <div key={task.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                   <div className="flex justify-between items-start mb-3">
                       <span className="font-mono font-bold text-slate-800">{task.tracking_code}</span>
                       <span className={`px-2 py-1 rounded text-xs font-bold ${
                           task.severity_rank >= 4 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                       }`}>
                           Rank {task.severity_rank}
                       </span>
                   </div>
                   <h3 className="font-bold text-slate-900 mb-1">{task.category}</h3>
                   <p className="text-sm text-slate-600 line-clamp-2 mb-4">{task.description}</p>

                   <div className="flex gap-3">
                       <a
                          href={`https://maps.google.com/?q=${task.latitude},${task.longitude}`}
                          target="_blank" rel="noreferrer"
                          className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl flex items-center justify-center font-medium hover:bg-slate-200 transition"
                       >
                           <Navigation size={18} className="mr-2" /> Navigate
                       </a>
                       <button
                          onClick={() => handleSelectTask(task)}
                          className="flex-1 bg-blue-600 text-white py-3 rounded-xl flex items-center justify-center font-medium hover:bg-blue-700 transition"
                       >
                           <CheckCircle size={18} className="mr-2" /> Resolve
                       </button>
                   </div>
               </div>
           ))}

           {tasks.length === 0 && (
               <div className="text-center p-10 text-slate-500">
                   No pending work orders in your queue.
               </div>
           )}
       </div>
    </div>
  );
}
