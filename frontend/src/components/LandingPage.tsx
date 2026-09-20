import React from 'react';
import { CivicIssue, DepartmentCapacity } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { CivicMeshLogo } from './CivicMeshLogo';
import {
  Users,
  Wrench,
  ShieldCheck,
  ArrowRight,
  Activity,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  Scale,
  Camera,
  Compass
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
  const { lang } = useLanguage();
  const reportedCount = issues.filter(i => i.status === 'reported').length;
  const inProgressCount = issues.filter(i => i.status === 'in_progress' || i.status === 'assigned').length;
  const resolvedCount = issues.filter(i => i.status === 'resolved').length;

  const totalLoad = departments.reduce((acc, d) => acc + d.currentLoad, 0);
  const totalCapacity = departments.reduce((acc, d) => acc + d.maxCapacity, 0);
  const systemLoadPercentage = Math.round((totalLoad / (totalCapacity || 1)) * 100);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-stone-50 dark:bg-stone-950 py-10 px-4 sm:px-6 lg:px-8 text-stone-900 dark:text-stone-100 transition-colors">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Hero Section */}
        <section className="text-center space-y-5 pt-2">
          {/* Municipal Coordination Indicator */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-stone-200/80 dark:bg-stone-900 border border-stone-300/80 dark:border-stone-800 text-stone-800 dark:text-stone-200 tracking-wide shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>MCC & Peripheral Panchayats Joint Network</span>
            <span className="text-stone-400 dark:text-stone-600">•</span>
            <span className="text-amber-700 dark:text-amber-400 font-semibold">21 Jurisdictions Active</span>
          </div>

          <div className="flex justify-center items-center gap-3">
            <CivicMeshLogo size="lg" />
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-stone-950 dark:text-white">
            Civic Mesh
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-stone-600 dark:text-stone-300 font-normal leading-relaxed">
            {lang === 'kn'
              ? 'ಮೈಸೂರು ಮಹಾನಗರ ಪಾಲಿಕೆ ಮತ್ತು ಗಡಿ ಪಂಚಾಯಿತಿಗಳ ನಡುವಿನ ಸಾರ್ವಜನಿಕ ಸಮಸ್ಯೆಗಳ ನಿಖರ ಪರಿಹಾರ ಮತ್ತು ಸ್ವಯಂಚಾಲಿತ ಸಾಮರ್ಥ್ಯ ನಿರ್ವಹಣಾ ವೇದಿಕೆ.'
              : 'Overcoming civic border disputes across Mysuru City Corporation (MCC) and outer panchayats through real-time capacity routing and automated cost clearing.'}
          </p>
        </section>

        {/* The Three Portal Action Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Citizen Portal */}
          <div
            id="portal-card-citizen"
            className="group relative bg-white dark:bg-stone-900/90 border border-stone-200/90 dark:border-stone-800/90 rounded-2xl p-6 shadow-xs hover:shadow-lg hover:border-emerald-400 dark:hover:border-emerald-600 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-5 border border-emerald-500/20">
                <Users className="w-6 h-6 stroke-[1.8]" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl font-bold text-stone-900 dark:text-white">
                  {lang === 'kn' ? 'ನಾಗರಿಕ ಪೋರ್ಟಲ್' : 'Citizen Portal'}
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                  {lang === 'kn' ? 'ಸಾರ್ವಜನಿಕ ಸೇವೆ' : 'Public Intake'}
                </span>
              </div>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed mb-6">
                {lang === 'kn'
                  ? 'ಸಮಸ್ಯೆಗಳನ್ನು ಮೈಸೂರು ನಕ್ಷೆಯಲ್ಲಿ ಗುರುತಿಸಿ, ಸಾಕ್ಷ್ಯಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ ಮತ್ತು ಪರಿಹಾರ ಪ್ರಕ್ರಿಯೆಯನ್ನು ಗಮನಿಸಿ.'
                  : 'Drop a pin on the Mysuru district map, submit on-site photo proof, and track real-time resolution with zero border confusion.'}
              </p>
              <div className="text-xs text-stone-600 dark:text-stone-300 bg-stone-50 dark:bg-stone-800/50 rounded-xl p-3 border border-stone-200/60 dark:border-stone-800 mb-6 flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{lang === 'kn' ? 'ಸ್ವಯಂಚಾಲಿತ ನಕಲು ಪರಿಶೀಲನೆ ಮತ್ತು ನಕ್ಷೆ ಗುರುತು' : 'Geospatial pin-drop with duplicate report grouping'}</span>
              </div>
            </div>

            <button
              id="btn-citizen-portal"
              onClick={onEnterCitizenPortal}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-stone-900 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-semibold text-sm active:scale-[0.98] transition-all cursor-pointer shadow-xs"
            >
              <span>{lang === 'kn' ? 'ನಾಗರಿಕ ಪೋರ್ಟಲ್ ಪ್ರವೇಶಿಸಿ' : 'Launch Citizen Portal'}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* 2. Worker Desk */}
          <div
            id="portal-card-worker"
            className="group relative bg-white dark:bg-stone-900/90 border border-stone-200/90 dark:border-stone-800/90 rounded-2xl p-6 shadow-xs hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-400 flex items-center justify-center mb-5 border border-blue-500/20">
                <Wrench className="w-6 h-6 stroke-[1.8]" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl font-bold text-stone-900 dark:text-white">
                  {lang === 'kn' ? 'ಕಾರ್ಮಿಕ ಪೋರ್ಟಲ್' : 'Worker Desk'}
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                  {lang === 'kn' ? 'ಕ್ಷೇತ್ರ ಕಾರ್ಯ' : 'Field Dispatch'}
                </span>
              </div>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed mb-6">
                {lang === 'kn'
                  ? 'ಸಮತೋಲಿತ ಕಾರ್ಯಗಳನ್ನು ಸ್ವೀಕರಿಸಿ, ಸ್ಥಳದಲ್ಲಿ ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಪೂರ್ಣಗೊಂಡ ದುರಸ್ತಿಗಳನ್ನು ದಾಖಲಿಸಿ.'
                  : 'Distraction-free task queue for 21 municipal zones with vehicle details, GPS range locks, and camera audit proof.'}
              </p>
              <div className="text-xs text-stone-600 dark:text-stone-300 bg-stone-50 dark:bg-stone-800/50 rounded-xl p-3 border border-stone-200/60 dark:border-stone-800 mb-6 flex items-center gap-2.5">
                <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>{lang === 'kn' ? 'ಕನ್ನಡ ಮತ್ತು ಇಂಗ್ಲಿಷ್ ದ್ವಿಭಾಷಾ ಬೆಂಬಲ' : 'Bilingual Kannada/English with on-site photo audit'}</span>
              </div>
            </div>

            <button
              id="btn-worker-desk"
              onClick={onEnterWorkerDesk}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-stone-900 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-semibold text-sm active:scale-[0.98] transition-all cursor-pointer shadow-xs"
            >
              <span>{lang === 'kn' ? 'ಕಾರ್ಮಿಕ ಪೋರ್ಟಲ್ ಪ್ರವೇಶಿಸಿ' : 'Open Field Worker Desk'}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* 3. Admin Dashboard */}
          <div
            id="portal-card-admin"
            className="group relative bg-white dark:bg-stone-900/90 border border-stone-200/90 dark:border-stone-800/90 rounded-2xl p-6 shadow-xs hover:shadow-lg hover:border-rose-400 dark:hover:border-rose-600 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-400 flex items-center justify-center mb-5 border border-rose-500/20">
                <ShieldCheck className="w-6 h-6 stroke-[1.8]" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl font-bold text-stone-900 dark:text-white">
                  {lang === 'kn' ? 'ಆಡಳಿತ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್' : 'Admin Dashboard'}
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60">
                  {lang === 'kn' ? 'ಅಧಿಕಾರಿ ವೀಕ್ಷಣೆ' : 'Command Center'}
                </span>
              </div>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed mb-6">
                {lang === 'kn'
                  ? 'ನಗರ ಸಾಮರ್ಥ್ಯ ಮರುಸಮತೋಲನ, ಇಲಾಖಾ ಕಾರ್ಯಭಾರ ವಿತರಣೆ ಮತ್ತು ವಲಯ ಪರಿಹಾರ ಲೆಕ್ಕಪರಿಶೋಧನೆ.'
                  : 'Monitor fleet load across all 26 jurisdictions, view the Inter-Agency Clearing Ledger, and audit resolution proofs.'}
              </p>
              <div className="text-xs text-stone-600 dark:text-stone-300 bg-stone-50 dark:bg-stone-800/50 rounded-xl p-3 border border-stone-200/60 dark:border-stone-800 mb-6 flex items-center gap-2.5">
                <Scale className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>{lang === 'kn' ? 'ಅಂತರ್-ಏಜೆನ್ಸಿ ಲೆಕ್ಕಪತ್ರ ಕ್ಲಿಯರೆನ್ಸ್' : 'Inter-Agency cost ledger with auto-debit balances'}</span>
              </div>
            </div>

            <button
              id="btn-admin-dashboard"
              onClick={onEnterAdminDashboard}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-stone-900 hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-600 text-white font-semibold text-sm active:scale-[0.98] transition-all cursor-pointer shadow-xs"
            >
              <span>{lang === 'kn' ? 'ಆಡಳಿತ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಪ್ರವೇಶಿಸಿ' : 'Access Admin Command'}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </section>

        {/* Dynamic Capacity Balancing Snapshot */}
        <section className="bg-white dark:bg-stone-900/90 border border-stone-200/90 dark:border-stone-800/90 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200/70 dark:border-stone-800/70">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-600 dark:text-amber-400 stroke-[2]" />
                <h3 className="text-lg font-bold text-stone-950 dark:text-white">
                  {lang === 'kn' ? 'ಲೈವ್ ಡೈನಾಮಿಕ್ ಸಾಮರ್ಥ್ಯ ಟೆಲಿಮೆಟ್ರಿ' : 'Live Fleet & Capacity Telemetry'}
                </h3>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                {lang === 'kn'
                  ? 'ಮೈಸೂರು ಎಂಜಿನಿಯರಿಂಗ್ ವಿಭಾಗಗಳ ನೈಜ-ಸಮಯದ ಪುರಸಭೆ ಸಾಮರ್ಥ್ಯ ಸ್ಥಿತಿ'
                  : 'Real-time municipal capacity and dispatch load across active Mysuru zones'}
              </p>
            </div>
            <div className="flex items-center gap-3 bg-stone-50 dark:bg-stone-800/60 px-3.5 py-2 rounded-xl border border-stone-200/60 dark:border-stone-700/60">
              <span className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                {lang === 'kn' ? 'ನಗರ ಮೆಶ್ ಲೋಡ್:' : 'City Mesh Load:'}
              </span>
              <div className="w-32 bg-stone-200 dark:bg-stone-700 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    systemLoadPercentage > 80 ? 'bg-rose-500' : systemLoadPercentage > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(systemLoadPercentage, 100)}%` }}
                />
              </div>
              <span className="text-xs font-bold text-stone-900 dark:text-white font-mono">{systemLoadPercentage}%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
            <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/60 dark:border-stone-800">
              <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400 mb-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>{lang === 'kn' ? 'ಬಾಕಿ ಇದೆ' : 'Pending Intake'}</span>
              </div>
              <div className="text-2xl font-extrabold text-stone-950 dark:text-white font-mono">{reportedCount}</div>
              <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                {lang === 'kn' ? 'ರವಾನೆಗಾಗಿ ಕಾಯುತ್ತಿದೆ' : 'Awaiting dispatch queue'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/60 dark:border-stone-800">
              <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400 mb-1.5 font-medium">
                <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>{lang === 'kn' ? 'ಸಕ್ರಿಯ ಕಾರ್ಯಗಳು' : 'Active in Field'}</span>
              </div>
              <div className="text-2xl font-extrabold text-stone-950 dark:text-white font-mono">{inProgressCount}</div>
              <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                {lang === 'kn' ? 'ತಂಡಗಳ ನಡುವೆ ಸಮತೋಲಿತ' : 'Balanced across crews'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/60 dark:border-stone-800">
              <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400 mb-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{lang === 'kn' ? 'ಪರಿಹರಿಸಲಾಗಿದೆ' : 'Resolved'}</span>
              </div>
              <div className="text-2xl font-extrabold text-stone-950 dark:text-white font-mono">{resolvedCount}</div>
              <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                {lang === 'kn' ? 'ದೃಢಪಡಿಸಿದ ಪರಿಹಾರಗಳು' : 'Verified resolutions'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/60 dark:border-stone-800">
              <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400 mb-1.5 font-medium">
                <Compass className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>{lang === 'kn' ? 'ಸಾಮರ್ಥ್ಯ ಪೂಲ್' : 'Capacity Pool'}</span>
              </div>
              <div className="text-2xl font-extrabold text-stone-950 dark:text-white font-mono">{totalLoad} / {totalCapacity}</div>
              <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                {lang === 'kn' ? 'ಕಾರ್ಯಭಾರ ಘಟಕ ಸಮತೋಲನ' : 'Active load units'}
              </div>
            </div>
          </div>
        </section>

        {/* 3-Step Geo-Elastic Mesh Solution Walkthrough */}
        <section className="space-y-6 pt-2">
          <div className="text-center space-y-1.5">
            <h3 className="text-xl font-bold text-stone-950 dark:text-white">
              {lang === 'kn' ? 'ಜಿಯೋ-ಎಲಾಸ್ಟಿಕ್ ರೂಟಿಂಗ್ ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ' : 'How the Geo-Elastic Mesh Works'}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xl mx-auto">
              {lang === 'kn'
                ? 'ಗಡಿ ವಿವಾದಗಳನ್ನು ತೆಗೆದುಹಾಕಿ, ಸಾಮರ್ಥ್ಯದ ಆಧಾರದ ಮೇಲೆ ಸಮಸ್ಯೆಗಳನ್ನು ತ್ವರಿತವಾಗಿ ಪರಿಹರಿಸುವ ಪ್ರಕ್ರಿಯೆ.'
                : 'Overcoming rigid jurisdictional walls through real-time depot availability and inter-agency clearing.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-2xs space-y-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 font-extrabold text-sm flex items-center justify-center font-mono">
                01
              </div>
              <h4 className="text-base font-bold text-stone-900 dark:text-white">
                {lang === 'kn' ? 'ನಾಗರಿಕ ವರದಿ & ಗಡಿ ಪತ್ತೆ' : 'Intake & Buffer Detection'}
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                {lang === 'kn'
                  ? 'ನಾಗರಿಕರು ಗಡಿ ಪ್ರದೇಶದಲ್ಲಿ ಸಮಸ್ಯೆಯನ್ನು ನಮೂದಿಸಿದಾಗ, ವ್ಯವಸ್ಥೆಯು ಅದನ್ನು ಬಫರ್ ವಲಯವೆಂದು ಗುರುತಿಸುತ್ತದೆ.'
                  : 'A citizen drops a pin along contested borders (e.g. Bogadi Ring Road). The system auto-detects the overlapping buffer corridor and checks local fleet capacity.'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-2xs space-y-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-400 font-extrabold text-sm flex items-center justify-center font-mono">
                02
              </div>
              <h4 className="text-base font-bold text-stone-900 dark:text-white">
                {lang === 'kn' ? 'ಸ್ಪಿಲ್ಲೋವರ್ ರವಾನೆ & ಲೆಕ್ಕಪತ್ರ' : 'Capacity Spillover & Ledger'}
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                {lang === 'kn'
                  ? 'ಸ್ಥಳೀಯ ಕಚೇರಿ 100% ಕ್ಕಿಂತ ಹೆಚ್ಚು ಕಾರ್ಯಭಾರ ಹೊಂದಿದ್ದರೆ, ಹತ್ತಿರದ ಲಭ್ಯವಿರುವ ಡಿಪೋಗೆ ಕಾರ್ಯ ರವಾನೆಯಾಗುತ್ತದೆ.'
                  : 'If the home panchayat is over 100% capacity, the ticket spillover-routes to the nearest available depot (e.g. MCC Zone 3), logging an automated debit and credit in the Inter-Agency Ledger.'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-2xs space-y-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-extrabold text-sm flex items-center justify-center font-mono">
                03
              </div>
              <h4 className="text-base font-bold text-stone-900 dark:text-white">
                {lang === 'kn' ? 'ಸ್ಥಳದಲ್ಲೇ ದೃಢೀಕರಣ & ಪರಿಹಾರ' : 'GPS Proof & Verified Close'}
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                {lang === 'kn'
                  ? 'ಕ್ಷೇತ್ರ ಕಾರ್ಮಿಕರು ಸ್ಥಳದಲ್ಲಿ ದುರಸ್ತಿ ಮಾಡಿ ಕ್ಯಾಮೆರಾ ಸಾಕ್ಷ್ಯದೊಂದಿಗೆ ಕಾರ್ಯವನ್ನು ಮುಕ್ತಾಯಗೊಳಿಸುತ್ತಾರೆ.'
                  : 'Field crew travels to the site, executes the repair, and closes the ticket using GPS-locked camera proof, audited against fraudulent or unrelated photos.'}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
