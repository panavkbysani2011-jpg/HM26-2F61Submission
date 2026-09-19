import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Activity, CheckCircle } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <header className="text-center max-w-3xl mb-16 mt-10">
        <h1 className="text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">Modernizing Mysuru's Civic Infrastructure</h1>
        <p className="text-xl text-slate-600 leading-relaxed">
          The Geo-Elastic Routing Engine (G-ERE) replaces rigid boundary walls with dynamic buffer geofences, balancing tasks across municipal zones seamlessly.
        </p>
      </header>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl w-full">
        <Link to="/citizen" className="group block bg-white p-8 rounded-2xl shadow-sm hover:shadow-md border border-slate-100 transition-all">
          <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
             <MapPin size={24} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Report an Issue</h2>
          <p className="text-slate-600 mb-6">Citizens: Help keep Mysuru clean. Report C&D waste, potholes, and civic issues instantly.</p>
          <div className="flex items-center text-orange-600 font-medium">
             Open Citizen Portal <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link to="/dispatch" className="group block bg-slate-900 p-8 rounded-2xl shadow-md hover:shadow-lg transition-all text-white">
           <div className="w-12 h-12 bg-slate-800 text-emerald-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
             <Activity size={24} />
          </div>
          <h2 className="text-2xl font-bold mb-3">Dispatch Center</h2>
          <p className="text-slate-400 mb-6">Officials: Monitor live capacity, track spillover tasks, and manage the inter-agency ledger.</p>
          <div className="flex items-center text-emerald-400 font-medium">
             Open Dispatch Hub <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link to="/field" className="group block bg-white p-8 rounded-2xl shadow-sm hover:shadow-md border border-slate-100 transition-all">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
             <CheckCircle size={24} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Field Execution</h2>
          <p className="text-slate-600 mb-6">Workers: View assigned tasks and verify physical closure with GPS and camera proofs.</p>
          <div className="flex items-center text-blue-600 font-medium">
             Open Worker Desk <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      <footer className="mt-20 text-slate-500 text-sm flex gap-4">
        <Link to="/privacy" className="hover:text-slate-800 underline">Privacy Policy</Link>
        <Link to="/terms" className="hover:text-slate-800 underline">Terms of Service</Link>
      </footer>
    </div>
  );
}
