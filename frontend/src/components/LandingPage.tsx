import React from 'react';
import { CivicIssue, DepartmentCapacity } from '../types';
import {
  Users,
  Wrench,
  ShieldAlert,
  ArrowRight,
  Cpu,
  Activity,
  CheckCircle2,
  Clock,
  Layers,
  MapPin
} from 'lucide-react';

interface LandingPageProps {
  onEnterCitizenPortal: () => void;
  onEnterWorkerDesk: () => void;
  onEnterAdminDashboard: () => void;
  issues: CivicIssue[];
  departments: DepartmentCapacity[];
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterCitizenPortal,
  onEnterWorkerDesk,
  onEnterAdminDashboard,
  issues,
  departments,
}) => {
  const reportedCount = issues.filter(i => i.status === 'reported').length;
  const inProgressCount = issues.filter(i => i.status === 'in_progress' || i.status === 'assigned').length;
  const resolvedCount = issues.filter(i => i.status === 'resolved').length;

  const totalLoad = departments.reduce((acc, d) => acc + d.currentLoad, 0);
  const totalCapacity = departments.reduce((acc, d) => acc + d.maxCapacity, 0);
  const systemLoadPercentage = Math.round((totalLoad / (totalCapacity || 1)) * 100);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-stone-50 dark:bg-stone-950 py-12 px-4 sm:px-6 lg:px-8 text-stone-900 dark:text-stone-100 transition-colors">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Hero Section */}
        <section className="text-center space-y-4 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-stone-200/80 dark:bg-stone-800 text-stone-800 dark:text-stone-200 tracking-wide">
            <Cpu className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Civic Operating Mesh</span>
            <span className="text-stone-400">•</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Mysuru City Mesh Active
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-stone-900 dark:text-white">
            Civic Mesh
          </h1>

          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-stone-600 dark:text-stone-300 font-normal leading-relaxed">
            Dynamic capacity balancing and distributed dispatch for real-time civic issue reporting, field resolution, and municipal oversight.
          </p>
        </section>

        {/* The Three Portal Action Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Citizen Portal */}
          <div
            id="portal-card-citizen"
            className="group relative bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-5 border border-emerald-100 dark:border-emerald-800">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl font-bold text-stone-900 dark:text-white">Citizen Portal</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100/70 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  Public Intake
                </span>
              </div>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed mb-6">
                Pinpoint infrastructure issues on the interactive Mysuru map, upload on-site evidence, and follow civic repair timelines.
              </p>
              <div className="text-xs text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-stone-800/60 rounded-lg p-3 border border-stone-100 dark:border-stone-800 mb-6 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Geospatial pin-drop intake with automatic duplicate grouping</span>
              </div>
            </div>

            <button
              id="btn-citizen-portal"
              onClick={onEnterCitizenPortal}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-stone-900 dark:bg-emerald-700 text-white font-medium text-sm hover:bg-emerald-700 dark:hover:bg-emerald-600 active:scale-[0.99] transition-all"
            >
              <span>Citizen Portal</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* 2. Worker Desk */}
          <div
            id="portal-card-worker"
            className="group relative bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-400 flex items-center justify-center mb-5 border border-blue-100 dark:border-blue-800">
                <Wrench className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl font-bold text-stone-900 dark:text-white">Worker Desk</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-100/70 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                  Field Dispatch
                </span>
              </div>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed mb-6">
                Receive dynamically balanced work tickets, claim on-site diagnostics, and log completed civic repairs.
              </p>
              <div className="text-xs text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-stone-800/60 rounded-lg p-3 border border-stone-100 dark:border-stone-800 mb-6 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>Field crew load limits balanced dynamically across active units</span>
              </div>
            </div>

            <button
              id="btn-worker-desk"
              onClick={onEnterWorkerDesk}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-stone-900 dark:bg-blue-700 text-white font-medium text-sm hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-[0.99] transition-all"
            >
              <span>Worker Desk</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* 3. Admin Dashboard */}
          <div
            id="portal-card-admin"
            className="group relative bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-rose-300 dark:hover:border-rose-700 transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-400 flex items-center justify-center mb-5 border border-rose-100 dark:border-rose-800">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl font-bold text-stone-900 dark:text-white">Admin Dashboard</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-rose-100/70 dark:bg-rose-950 text-rose-800 dark:text-rose-300">
                  Officer Clearance
                </span>
              </div>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed mb-6">
                Municipal command center for capacity rebalancing, department load distribution, and cross-ward resolution audits.
              </p>
              <div className="text-xs text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-stone-800/60 rounded-lg p-3 border border-stone-100 dark:border-stone-800 mb-6 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>Requires authorized municipal clearance credentials</span>
              </div>
            </div>

            <button
              id="btn-admin-dashboard"
              onClick={onEnterAdminDashboard}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-stone-900 dark:bg-rose-700 text-white font-medium text-sm hover:bg-rose-700 dark:hover:bg-rose-600 active:scale-[0.99] transition-all"
            >
              <span>Admin Dashboard</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </section>

        {/* Dynamic Capacity Balancing Snapshot */}
        <section className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-100 dark:border-stone-800">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h3 className="text-base font-bold text-stone-900 dark:text-white">Live Dynamic Capacity Telemetry</h3>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Real-time municipal capacity status across Mysuru engineering divisions
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-stone-600 dark:text-stone-300">City Mesh Load:</span>
              <div className="w-36 bg-stone-100 dark:bg-stone-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all ${systemLoadPercentage > 80 ? 'bg-rose-500' : systemLoadPercentage > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                  style={{ width: `${Math.min(systemLoadPercentage, 100)}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-stone-900 dark:text-white">{systemLoadPercentage}%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5">
            <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mb-1">
                <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Pending Intake</span>
              </div>
              <div className="text-2xl font-bold text-stone-900 dark:text-white">{reportedCount}</div>
              <div className="text-[11px] text-stone-400 dark:text-stone-500 mt-1">Awaiting dispatch queue</div>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mb-1">
                <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Active in Field</span>
              </div>
              <div className="text-2xl font-bold text-stone-900 dark:text-white">{inProgressCount}</div>
              <div className="text-[11px] text-stone-400 dark:text-stone-500 mt-1">Balanced across crews</div>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Resolved</span>
              </div>
              <div className="text-2xl font-bold text-stone-900 dark:text-white">{resolvedCount}</div>
              <div className="text-[11px] text-stone-400 dark:text-stone-500 mt-1">Verified resolutions</div>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mb-1">
                <Cpu className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Capacity Pool</span>
              </div>
              <div className="text-2xl font-bold text-stone-900 dark:text-white">{totalLoad} / {totalCapacity}</div>
              <div className="text-[11px] text-stone-400 dark:text-stone-500 mt-1">Workload unit balance</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
