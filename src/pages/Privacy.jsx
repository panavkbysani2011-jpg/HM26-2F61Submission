import React from 'react';

export default function Privacy() {
  return (
    <div className="max-w-3xl mx-auto p-10 bg-white shadow-sm mt-10 rounded-xl">
      <h1 className="text-3xl font-bold mb-6 text-slate-900">Privacy Policy (DPDP Act Compliance)</h1>
      <div className="prose text-slate-700">
        <p className="mb-4">
          Under India's Digital Personal Data Protection (DPDP) Act, 2023, the Geo-Elastic Routing Engine (G-ERE) operates as a Data Fiduciary on behalf of the Mysuru City Corporation.
        </p>
        <h2 className="text-xl font-semibold mt-6 mb-2">1. Data Collection</h2>
        <p className="mb-4">
          We collect high-precision geolocation data (latitude and longitude) strictly when you voluntarily submit a civic grievance. This is required to route the task to the correct municipal ward.
        </p>
        <h2 className="text-xl font-semibold mt-6 mb-2">2. Photographic Evidence</h2>
        <p className="mb-4">
          Photos uploaded to our servers undergo client-side processing to strip EXIF metadata (including device identifiers and hidden location tags) prior to transmission. The compressed image is stored securely on public-read buckets for municipal auditing.
        </p>
        <h2 className="text-xl font-semibold mt-6 mb-2">3. Consent</h2>
        <p className="mb-4">
          By utilizing the "Use My Location" feature or submitting a form, you provide explicit consent for temporary data processing necessary to execute civic repairs.
        </p>
      </div>
    </div>
  );
}
