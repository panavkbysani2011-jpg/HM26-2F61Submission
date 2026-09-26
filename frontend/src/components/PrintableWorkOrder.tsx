import React from 'react';
import { CivicIssue } from '../types';
import {
  PrinterIcon as Printer,
  XMarkIcon as X,
  MapPinIcon as MapPin,
  ClockIcon as Clock,
  ShieldCheckIcon as ShieldCheck,
  TruckIcon as Truck
} from '@heroicons/react/24/outline';

interface PrintableWorkOrderProps {
  issue: CivicIssue;
  onClose: () => void;
  workerName?: string;
  workerVehicle?: string;
}

export const PrintableWorkOrder: React.FC<PrintableWorkOrderProps> = ({
  issue,
  onClose,
  workerName = 'Manjunatha S. (Senior Field Lead)',
  workerVehicle = 'Canter KA-09-G-4412'
}) => {
  const handlePrint = () => {
    window.print();
  };

  const trackingId = issue.trackingId || issue.id;
  const coordsStr = issue.coordinates
    ? `${issue.coordinates.lat.toFixed(5)}° N, ${issue.coordinates.lng.toFixed(5)}° E`
    : '12.30200° N, 76.63200° E';

  return (
    <div
      id="printable-work-order-backdrop"
      className="fixed inset-0 z-[100] bg-stone-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="printable-work-order-container"
        className="bg-white text-stone-900 rounded-xl shadow-2xl max-w-3xl w-full border border-stone-300 overflow-hidden flex flex-col max-h-[96vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* On-screen control bar (Hidden during print) */}
        <div className="no-print bg-stone-900 text-white px-5 py-3 flex items-center justify-between border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider">
              MCC Official Field Dispatch Order Preview
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-trigger-print"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF (A4)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Sheet */}
        <div id="official-dispatch-work-order" className="p-6 sm:p-8 space-y-6 overflow-y-auto text-stone-900 bg-white font-sans">
          
          {/* Header Section: Government of Karnataka / MCC Emblem */}
          <div className="border-b-2 border-stone-900 pb-4 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 border border-stone-900 rounded-md bg-stone-100 flex items-center justify-center font-bold text-xs font-serif">
                  MCC
                </div>
                <div>
                  <h1 className="text-sm font-extrabold uppercase tracking-wide text-stone-950 font-serif">
                    ಮೈಸೂರು ಮಹಾನಗರ ಪಾಲಿಕೆ • MYSURU CITY CORPORATION
                  </h1>
                  <p className="text-[11px] font-semibold text-stone-700 uppercase tracking-wider">
                    Public Works &amp; Civic Infrastructure Maintenance Department
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-stone-600 font-mono">
                Office of the Assistant Executive Engineer (AEE) • Municipal Control Room, Mysuru - 570001
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="inline-block px-2.5 py-1 text-[10px] font-mono font-extrabold border border-stone-900 rounded-sm bg-stone-100 uppercase">
                Form: MCC-PWD-ACT-04
              </span>
              <div className="text-[10px] font-mono text-stone-600 mt-1">
                Generated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Title & Dispatch Reference Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-50 border border-stone-300 p-3 rounded-md">
            <div>
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest block">
                Dispatch Order Reference
              </span>
              <span className="font-mono text-sm font-extrabold text-stone-950 tracking-wider">
                MCC/DISP/2026/{trackingId}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] font-bold text-stone-500 uppercase block">Dynamic Priority</span>
                <span className="font-mono text-xs font-extrabold text-stone-950">
                  {issue.dynamicPriorityScore ? `${issue.dynamicPriorityScore}/100` : `Rank ${issue.severityRank || 3}`}
                </span>
              </div>
              <div className="text-right border-l border-stone-300 pl-3">
                <span className="text-[10px] font-bold text-stone-500 uppercase block">Target SLA</span>
                <span className="font-mono text-xs font-extrabold text-rose-700">
                  {issue.isEmergencyOverride ? '4 Hours (Fast-Path)' : '24 Hours (Standard)'}
                </span>
              </div>
            </div>
          </div>

          {/* Barcode & Incident Summary Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border border-stone-300 p-3.5 rounded-md">
            <div className="md:col-span-2 space-y-1.5">
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                Incident Classification &amp; Description
              </span>
              <h2 className="text-sm font-bold text-stone-950 leading-tight">
                {issue.title}
              </h2>
              <div className="flex items-center gap-2 text-xs font-semibold text-stone-800">
                <span className="px-2 py-0.5 border border-stone-400 bg-stone-100 rounded-sm">
                  {issue.category}
                </span>
                <span>•</span>
                <span>Logged: {issue.reportedAt}</span>
              </div>
              <p className="text-xs text-stone-700 leading-relaxed pt-1">
                {issue.description}
              </p>
            </div>

            {/* Simulated Barcode & Security Marker */}
            <div className="flex flex-col items-center justify-center p-3 border border-dashed border-stone-400 bg-stone-50/70 rounded-md text-center">
              {/* Authentic SVG Barcode graphic */}
              <div className="h-8 flex items-end gap-[2px]">
                {[3, 1, 4, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4, 1, 3, 2].map((w, i) => (
                  <div key={i} className="bg-stone-900 h-full" style={{ width: `${w * 1.5}px` }} />
                ))}
              </div>
              <span className="font-mono text-[9px] font-bold text-stone-700 mt-1 tracking-widest">
                *{trackingId}*
              </span>
              <span className="text-[9px] text-stone-500 uppercase mt-0.5">
                Authentic MCC Security Serial
              </span>
            </div>
          </div>

          {/* Site Telemetry & Landmark Geofence Matrix */}
          <div className="border border-stone-300 rounded-md overflow-hidden text-xs">
            <div className="bg-stone-100 px-3 py-1.5 font-bold uppercase text-[10px] tracking-wider text-stone-700 border-b border-stone-300">
              Site Geolocation &amp; Spatial Landmark Context
            </div>
            <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-stone-500 text-[10px] block uppercase font-semibold">Incident Site Address</span>
                <div className="flex items-start gap-1 font-bold text-stone-900 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-stone-600 shrink-0 mt-0.5" />
                  <span>{issue.location}</span>
                </div>
              </div>
              <div>
                <span className="text-stone-500 text-[10px] block uppercase font-semibold">Sensor Coordinates (WGS-84)</span>
                <span className="font-mono font-bold text-stone-900 block mt-0.5">
                  {coordsStr} {issue.geotagAccuracy && `(Accuracy: ±${issue.geotagAccuracy}m)`}
                </span>
              </div>
              {issue.escalationRationale && (
                <div className="sm:col-span-2 pt-1 border-t border-stone-200">
                  <span className="text-stone-500 text-[10px] block uppercase font-semibold">Landmark Sensitivity Factor</span>
                  <p className="text-stone-800 font-medium">
                    {issue.escalationRationale}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Field Operations Allocation & Unit Assignment */}
          <div className="border border-stone-300 rounded-md overflow-hidden text-xs">
            <div className="bg-stone-100 px-3 py-1.5 font-bold uppercase text-[10px] tracking-wider text-stone-700 border-b border-stone-300">
              Designated Field Operations Unit
            </div>
            <div className="p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-stone-500 text-[10px] block uppercase font-semibold">Zonal Depot</span>
                <strong className="text-stone-900 font-mono block mt-0.5">
                  {issue.assignedDepot || 'MCC Zone 3 Saraswathipuram Depot'}
                </strong>
              </div>
              <div>
                <span className="text-stone-500 text-[10px] block uppercase font-semibold">Field Crew Lead</span>
                <strong className="text-stone-900 block mt-0.5">
                  {issue.assignedCrewLead || workerName}
                </strong>
              </div>
              <div>
                <span className="text-stone-500 text-[10px] block uppercase font-semibold">Designated Vehicle</span>
                <div className="flex items-center gap-1 font-mono font-bold text-stone-900 mt-0.5">
                  <Truck className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                  <span>{issue.assignedVehicle || workerVehicle}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Standard Equipment & Material Requisition Checklist */}
          <div className="border border-stone-300 rounded-md overflow-hidden text-xs">
            <div className="bg-stone-100 px-3 py-1.5 font-bold uppercase text-[10px] tracking-wider text-stone-700 border-b border-stone-300">
              Required Material &amp; Safety Equipment Checklist
            </div>
            <div className="p-3.5 grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px]">
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded-xs" />
                <span>Cold-mix Bituminous Asphalt</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded-xs" />
                <span>Reflective Safety Cones (x6)</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded-xs" />
                <span>Submersible Slurry Pump</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded-xs" />
                <span>High-Visibility PPE Vests</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded-xs" />
                <span>Hazard Barricade Tape (50m)</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded-xs" />
                <span>Plate Compactor / Roller</span>
              </label>
            </div>
          </div>

          {/* Photographic Evidence Verification Box */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="border border-stone-300 rounded-md p-3 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                Primary Citizen Photographic Record
              </span>
              {issue.imageUrl || (issue.images && issue.images[0]) ? (
                <div className="relative rounded overflow-hidden border border-stone-300 h-28 bg-stone-100">
                  <img
                    src={issue.imageUrl || issue.images[0]}
                    alt="Citizen record"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/80 text-white font-mono text-[8px] rounded-xs">
                    {issue.reportedAt}
                  </div>
                </div>
              ) : (
                <div className="h-28 border border-dashed border-stone-300 rounded flex items-center justify-center text-stone-400 font-mono text-[10px]">
                  No photograph attached
                </div>
              )}
            </div>

            <div className="border border-stone-300 rounded-md p-3 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                Field Execution Completion Verification Box
              </span>
              {issue.resolvedImageUrl ? (
                <div className="relative rounded overflow-hidden border border-stone-300 h-28 bg-stone-100">
                  <img
                    src={issue.resolvedImageUrl}
                    alt="Resolved evidence"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-emerald-950 text-emerald-200 font-mono text-[8px] rounded-xs">
                    Verified Resolution
                  </div>
                </div>
              ) : (
                <div className="h-28 border border-dashed border-stone-300 rounded flex flex-col items-center justify-center text-stone-400 font-mono text-[10px] p-2 text-center">
                  <span>Affix On-Site Work Completion Photo</span>
                  <span className="text-[9px] text-stone-400">(Or Field Stamp &amp; Signature)</span>
                </div>
              )}
            </div>
          </div>

          {/* Statutory Sign-off & Verification Seal */}
          <div className="pt-4 border-t border-stone-300 grid grid-cols-2 gap-8 text-xs">
            <div className="space-y-6">
              <div className="border-b border-stone-400 h-8" />
              <div>
                <span className="font-bold text-stone-900 block">Signature of Field Supervisor / Crew Lead</span>
                <span className="text-[10px] text-stone-500">Name: {workerName}</span>
              </div>
            </div>

            <div className="space-y-6 text-right">
              <div className="border-b border-stone-400 h-8" />
              <div>
                <span className="font-bold text-stone-900 block">Assistant Executive Engineer (AEE) Verification Seal</span>
                <span className="text-[10px] text-stone-500 font-mono">Mysuru City Corporation Zonal Office</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
