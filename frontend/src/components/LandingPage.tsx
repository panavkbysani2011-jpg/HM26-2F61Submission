import React from 'react';
import { motion } from 'motion/react';
import { CivicIssue, DepartmentCapacity } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { CivicMeshLogo } from './CivicMeshLogo';
import { HoverFeatureCards, HoverFeatureCardItem } from './ui/HoverFeatureCards';
import {
  UserGroupIcon,
  WrenchScrewdriverIcon,
  ShieldCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

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
  const reportedCount = issues.filter((i) => i.status === 'reported').length;
  const inProgressCount = issues.filter((i) => i.status === 'in_progress' || i.status === 'assigned').length;
  const resolvedCount = issues.filter((i) => i.status === 'resolved').length;

  const totalLoad = departments.reduce((acc, d) => acc + d.currentLoad, 0);
  const totalCapacity = departments.reduce((acc, d) => acc + d.maxCapacity, 0);
  const systemLoadPercentage = Math.round((totalLoad / (totalCapacity || 1)) * 100);

  // Portal Feature Cards Specification for HoverFeatureCards component
  const portalCards: HoverFeatureCardItem[] = [
    {
      id: 'citizen',
      name: lang === 'kn' ? 'ನಾಗರಿಕ ಪೋರ್ಟಲ್' : 'Citizen Portal',
      badge: lang === 'kn' ? 'ಸಾರ್ವಜನಿಕ ಸೇವೆ' : 'Public Intake',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
      description:
        lang === 'kn'
          ? 'ಸಮಸ್ಯೆಗಳನ್ನು ಮೈಸೂರು ನಕ್ಷೆಯಲ್ಲಿ ಗುರುತಿಸಿ, ಸಾಕ್ಷ್ಯಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ ಮತ್ತು ನೈಜ-ಸಮಯದ ಪ್ರಕ್ರಿಯೆಯನ್ನು ಗಮನಿಸಿ.'
          : 'Drop a pin on the Mysuru GIS map, submit live on-site photo proof, and track verified resolution with zero border confusion.',
      subdetail:
        lang === 'kn'
          ? 'ಸ್ವಯಂಚಾಲಿತ ನಕಲು ಪರಿಶೀಲನೆ ಮತ್ತು ನಕ್ಷೆ ಗುರುತು'
          : 'Geospatial pin-drop with duplicate cluster grouping',
      ctaText: lang === 'kn' ? 'ನಾಗರಿಕ ಪೋರ್ಟಲ್ ಪ್ರವೇಶಿಸಿ' : 'Launch Citizen Portal',
      icon: <UserGroupIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
      iconBgClass: 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80',
      accentBorderClass: 'hover:border-emerald-400 dark:hover:border-emerald-500',
      onClick: onEnterCitizenPortal,
    },
    {
      id: 'worker',
      name: lang === 'kn' ? 'ಕಾರ್ಮಿಕ ಪೋರ್ಟಲ್' : 'Field Worker Desk',
      badge: lang === 'kn' ? 'ಕ್ಷೇತ್ರ ಕಾರ್ಯ' : 'Field Dispatch',
      badgeClass: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
      description:
        lang === 'kn'
          ? 'ಸಮತೋಲಿತ ಕಾರ್ಯಗಳನ್ನು ಸ್ವೀಕರಿಸಿ, ಸ್ಥಳದಲ್ಲಿ ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಪೂರ್ಣಗೊಂಡ ದುರಸ್ತಿಗಳನ್ನು ದಾಖಲಿಸಿ.'
          : 'Distraction-free task queue for 21 municipal zones with vehicle details, GPS range lock, and camera audit proof.',
      subdetail:
        lang === 'kn'
          ? 'ಕನ್ನಡ ಮತ್ತು ಇಂಗ್ಲಿಷ್ ದ್ವಿಭಾಷಾ ಬೆಂಬಲ'
          : '50-meter GPS range lock with on-site camera audit',
      ctaText: lang === 'kn' ? 'ಕಾರ್ಮಿಕ ಪೋರ್ಟಲ್ ಪ್ರವೇಶಿಸಿ' : 'Open Field Worker Desk',
      icon: <WrenchScrewdriverIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
      iconBgClass: 'bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/80',
      accentBorderClass: 'hover:border-blue-400 dark:hover:border-blue-500',
      onClick: onEnterWorkerDesk,
    },
    {
      id: 'admin',
      name: lang === 'kn' ? 'ಆಡಳಿತ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್' : 'Admin Dashboard',
      badge: lang === 'kn' ? 'ನಗರ ಆಡಳಿತ' : 'Command Center',
      badgeClass: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
      description:
        lang === 'kn'
          ? '26 ವಲಯಗಳ ನೈಜ-ಸಮಯದ ಸಾಮರ್ಥ್ಯ, ಗಡಿ ಕಾರಿಡಾರ್ ನಕ್ಷೆ ಮತ್ತು ಅಂತರ-ಏಜೆನ್ಸಿ ಲೆಡ್ಜರ್ ಲೆಕ್ಕಾಚಾರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.'
          : 'Monitor real-time fleet loads across all 26 zones, inspect contested buffer zones, and verify inter-agency clearing vouchers.',
      subdetail:
        lang === 'kn'
          ? 'ಸ್ವಯಂಚಾಲಿತ ಅಂತರ-ವಲಯ ಆರ್ಥಿಕ ಇತ್ಯರ್ಥ'
          : 'Automated Inter-Agency Cost Clearing Ledger',
      ctaText: lang === 'kn' ? 'ಆಡಳಿತ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ತೆರೆಯಿರಿ' : 'Launch Admin Dashboard',
      icon: <ShieldCheckIcon className="w-6 h-6 text-rose-600 dark:text-rose-400" />,
      iconBgClass: 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200/80 dark:border-rose-800/80',
      accentBorderClass: 'hover:border-rose-400 dark:hover:border-rose-500',
      onClick: onEnterAdminDashboard,
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f8f9fa] dark:bg-[#09090b] py-12 px-4 sm:px-6 lg:px-8 text-stone-900 dark:text-stone-100 transition-colors">
      <div className="max-w-6xl mx-auto space-y-14">
        {/* Hero Section */}
        <section className="text-center space-y-6 pt-2">
          {/* Municipal Coordination Indicator */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 text-stone-800 dark:text-stone-200 tracking-wide shadow-2xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>MCC & Peripheral Panchayats Joint Network</span>
            <span className="text-stone-300 dark:text-stone-700">•</span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold">21 Jurisdictions Active</span>
          </div>

          <div className="flex justify-center items-center">
            <CivicMeshLogo size="xl" showSubtitle={false} />
          </div>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-stone-600 dark:text-stone-300 font-sans leading-relaxed">
            {lang === 'kn'
              ? 'ಮೈಸೂರು ಮಹಾನಗರ ಪಾಲಿಕೆ ಮತ್ತು ಗಡಿ ಪಂಚಾಯಿತಿಗಳ ನಡುವಿನ ಸಾರ್ವಜನಿಕ ಸಮಸ್ಯೆಗಳ ನಿಖರ ಪರಿಹಾರ ಮತ್ತು ಸ್ವಯಂಚಾಲಿತ ಸಾಮರ್ಥ್ಯ ನಿರ್ವಹಣಾ ವೇದಿಕೆ.'
              : 'Overcoming civic border disputes across Mysuru City Corporation (MCC) and outer panchayats through real-time capacity routing and automated cost clearing.'}
          </p>
        </section>

        {/* Hover Feature Cards Section (3 Portals) */}
        <section>
          <HoverFeatureCards items={portalCards} />
        </section>

        {/* Live System Status & Animated Fleet Capacity Slider */}
        <section className="bg-white dark:bg-[#121214] border border-stone-200/90 dark:border-stone-800/90 rounded-3xl p-7 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <ChartBarIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-lg font-bold font-display text-stone-900 dark:text-white">
                  {lang === 'kn' ? 'ನಗರ ಸಾಮರ್ಥ್ಯ ಮತ್ತು ಸಕ್ರಿಯ ಸ್ಥಿತಿ' : 'City-Wide Fleet Load & Grievance Velocity'}
                </h2>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-sans">
                {lang === 'kn'
                  ? 'ಮೈಸೂರು ಜಿಲ್ಲೆಯ ಎಲ್ಲಾ ಕಾರ್ಯಾಚರಣೆ ಡಿಪೋಗಳಲ್ಲಿನ ನೈಜ-ಸಮಯದ ಕೆಲಸದ ಹೊರೆ.'
                  : 'Real-time aggregated workload across all active tipper trucks and sanitation crews.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                G-ERE Routing Active
              </span>
            </div>
          </div>

          {/* Animated Capacity Progress Bar */}
          <div className="space-y-3 mb-8">
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <span className="text-stone-600 dark:text-stone-400">
                {lang === 'kn' ? 'ನಗರ ಸಾಮರ್ಥ್ಯ ಬಳಕೆ:' : 'Aggregated Municipal Fleet Utilization:'}
              </span>
              <span className={`text-sm ${
                systemLoadPercentage > 100 
                  ? 'text-rose-600 dark:text-rose-400' 
                  : systemLoadPercentage > 75 
                  ? 'text-amber-600 dark:text-amber-400' 
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {systemLoadPercentage}% Dynamic Load
              </span>
            </div>

            <div className="w-full h-3 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden p-0.5">
              <motion.div
                className={`h-full rounded-full ${
                  systemLoadPercentage > 100
                    ? 'bg-rose-500'
                    : systemLoadPercentage > 75
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                initial={{ width: '0%' }}
                animate={{ width: `${Math.min(systemLoadPercentage, 100)}%` }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-stone-500 dark:text-stone-400 pt-0.5">
              <span>0% (Idle Fleet)</span>
              <span>75% (Nominal)</span>
              <span>100% (Spillover Threshold)</span>
            </div>
          </div>

          {/* Live Incident Velocity Counters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-stone-100 dark:border-stone-800/80">
            <div className="bg-[#f8f9fa] dark:bg-stone-900/60 p-4 rounded-2xl border border-stone-200/60 dark:border-stone-800/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-stone-500 dark:text-stone-400 font-sans">
                  {lang === 'kn' ? 'ದಾಖಲಾದ ಸಮಸ್ಯೆಗಳು' : 'Reported Grievances'}
                </span>
                <ClockIcon className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold font-display text-stone-900 dark:text-white mt-1">
                {reportedCount}
              </div>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                Pending field triage
              </span>
            </div>

            <div className="bg-[#f8f9fa] dark:bg-stone-900/60 p-4 rounded-2xl border border-stone-200/60 dark:border-stone-800/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-stone-500 dark:text-stone-400 font-sans">
                  {lang === 'kn' ? 'ಪ್ರಗತಿಯಲ್ಲಿರುವ ಕಾರ್ಯಗಳು' : 'Under Remediation'}
                </span>
                <WrenchScrewdriverIcon className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold font-display text-stone-900 dark:text-white mt-1">
                {inProgressCount}
              </div>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                Crews actively dispatched
              </span>
            </div>

            <div className="bg-[#f8f9fa] dark:bg-stone-900/60 p-4 rounded-2xl border border-stone-200/60 dark:border-stone-800/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-stone-500 dark:text-stone-400 font-sans">
                  {lang === 'kn' ? 'ಪರಿಹರಿಸಲಾದ ಸಮಸ್ಯೆಗಳು' : 'Verified Resolved'}
                </span>
                <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold font-display text-stone-900 dark:text-white mt-1">
                {resolvedCount}
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                With photographic audit proof
              </span>
            </div>
          </div>
        </section>

        {/* 3-Step Geo-Elastic Mesh Workflow */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold font-display text-stone-900 dark:text-white tracking-tight">
              {lang === 'kn' ? 'ಇದು ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ?' : 'The Geo-Elastic Resolution Architecture'}
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 max-w-xl mx-auto font-sans">
              {lang === 'kn'
                ? 'ಮೈಸೂರು ಗಡಿ ಸಮಸ್ಯೆಗಳನ್ನು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಪರಿಹರಿಸುವ 3-ಹಂತದ ತಂತ್ರಜ್ಞಾನ'
                : 'Three integrated tiers that eliminate jurisdictional squabbles and logistics backlogs.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-[#121214] border border-stone-200/80 dark:border-stone-800/80 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-sm font-mono">
                01
              </div>
              <h3 className="text-base font-bold font-display text-stone-900 dark:text-white">
                {lang === 'kn' ? '1. ಗಡಿ ಪತ್ತೆ ಮತ್ತು ಇಂಟೆಕ್' : '1. Buffer Zone GPS Intake'}
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed font-sans">
                {lang === 'kn'
                  ? 'ನಾಗರಿಕರು ನಕ್ಷೆಯಲ್ಲಿ ಪಿನ್ ಹಾಕಿದಾಗ ವ್ಯವಸ್ಥೆಯು 5 ಗಡಿ ಕಾರಿಡಾರ್‌ಗಳನ್ನು ಗುರುತಿಸುತ್ತದೆ.'
                  : 'Citizens drop a GPS pin. If the location touches a contested corridor (e.g., Bogadi - MCC Zone 3), the G-ERE engine designates it as a shared buffer issue.'}
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-[#121214] border border-stone-200/80 dark:border-stone-800/80 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-sm font-mono">
                02
              </div>
              <h3 className="text-base font-bold font-display text-stone-900 dark:text-white">
                {lang === 'kn' ? '2. ಸಾಮರ್ಥ್ಯ ಆಧಾರಿತ ಸ್ಪಿಲ್ಲೋವರ್' : '2. Capacity Spillover & Ledger'}
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed font-sans">
                {lang === 'kn'
                  ? 'ಸ್ಥಳೀಯ ಪಂಚಾಯಿತಿ 100% ಕ್ಕಿಂತ ಹೆಚ್ಚು ಹೊರೆ ಹೊಂದಿದ್ದರೆ, ಹತ್ತಿರದ ಮುಕ್ತ ಎಂಸಿಸಿ ಡಿಪೋಗೆ ಕಳುಹಿಸಲಾಗುತ್ತದೆ.'
                  : 'If the home panchayat is overloaded (>100% capacity), the task spillovers to the closest idle MCC depot. The Inter-Agency Ledger records a debit/credit balance.'}
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-[#121214] border border-stone-200/80 dark:border-stone-800/80 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-sm font-mono">
                03
              </div>
              <h3 className="text-base font-bold font-display text-stone-900 dark:text-white">
                {lang === 'kn' ? '3. ಜಿಪಿಎಸ್ ಲಾಕ್ ಮತ್ತು ಫೋಟೋ ರುಜುವಾತು' : '3. GPS Lock & Photographic Proof Audit'}
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed font-sans">
                {lang === 'kn'
                  ? 'ಕಾರ್ಮಿಕರು 50 ಮೀಟರ್ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ಮಾತ್ರ ಕ್ಯಾಮೆರಾ ಮೂಲಕ ಕಾರ್ಯ ಪೂರ್ಣಗೊಳಿಸಬಹುದು. ಅಧಿಕೃತ ಪರಿಶೀಲನೆ ನಂತರವೇ ಟಿಕೆಟ್ ಮುಕ್ತಾಯಗೊಳ್ಳುತ್ತದೆ.'
                  : 'Field workers must be within 50 meters of the incident site to capture resolution proof photos. Proximity verification and audit standards ensure genuine civic resolution before closing the ticket.'}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
