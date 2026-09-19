import React from 'react';

export default function Terms() {
  return (
    <div className="max-w-3xl mx-auto p-10 bg-white shadow-sm mt-10 rounded-xl">
      <h1 className="text-3xl font-bold mb-6 text-slate-900">Terms of Service</h1>
      <div className="prose text-slate-700">
        <p className="mb-4">
          Welcome to the Geo-Elastic Routing Engine (G-ERE), a civic-tech prototype for HackMysuru 1.0.
        </p>
        <h2 className="text-xl font-semibold mt-6 mb-2">1. Proper Usage</h2>
        <p className="mb-4">
          This platform is intended for reporting legitimate civic issues (C&D waste, potholes, etc.) within the greater Mysuru district.
        </p>
        <h2 className="text-xl font-semibold mt-6 mb-2">2. Penalties for False Reporting</h2>
        <p className="mb-4">
          Intentionally submitting fraudulent reports, spoofing GPS coordinates, or uploading fake images may result in administrative penalties as determined by the Mysuru City Corporation.
        </p>
      </div>
    </div>
  );
}
