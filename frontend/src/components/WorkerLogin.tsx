import React, { useState, useMemo } from 'react';
import { WORKER_ROSTER } from '../mockDatabase';
import { UserSession, CivicIssue, WorkerRosterEntry } from '../types';
import { 
  Wrench, 
  Truck, 
  ArrowLeft, 
  Search, 
  AlertCircle, 
  Building2, 
  ArrowRight
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface WorkerLoginProps {
  issues: CivicIssue[];
  onSelectWorker: (session: UserSession) => void;
  onCancel: () => void;
  isDark?: boolean;
}

export const WorkerLogin: React.FC<WorkerLoginProps> = ({
  issues,
  onSelectWorker,
  onCancel,
}) => {
  const { lang } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'mcc_zone' | 'town_panchayat' | 'gram_panchayat'>('all');

  const rosterList = useMemo(() => Object.values(WORKER_ROSTER), []);

  // Calculate real-time active task counts per jurisdiction
  const activeTaskCountByJurisdiction = useMemo(() => {
    const counts: Record<string, number> = {};
    issues.forEach((issue) => {
      if (issue.status === 'resolved' || issue.status === 'closed' || issue.status === 'quarantined' || issue.isQuarantined) {
        return;
      }
      // Check assignedJurisdictionId or targetJurisdictionId or assignedDepot
      if (issue.assignedJurisdictionId) {
        counts[issue.assignedJurisdictionId] = (counts[issue.assignedJurisdictionId] || 0) + 1;
      } else if (issue.targetJurisdictionId) {
        counts[issue.targetJurisdictionId] = (counts[issue.targetJurisdictionId] || 0) + 1;
      } else if (issue.assignedDepot) {
        const depotLower = issue.assignedDepot.toLowerCase();
        rosterList.forEach((worker) => {
          const namePart = worker.jurisdictionName.split(' (')[0].toLowerCase();
          if (depotLower.includes(namePart)) {
            counts[worker.jurisdictionId] = (counts[worker.jurisdictionId] || 0) + 1;
          }
        });
      }
    });
    return counts;
  }, [issues, rosterList]);

  // Filtered roster list based on category tab & search query
  const filteredRoster = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return rosterList.filter((worker) => {
      if (selectedFilter !== 'all' && worker.zoneType !== selectedFilter) {
        return false;
      }
      if (!q) return true;
      return (
        worker.name.toLowerCase().includes(q) ||
        worker.jurisdictionName.toLowerCase().includes(q) ||
        worker.vehicle.toLowerCase().includes(q) ||
        worker.role.toLowerCase().includes(q)
      );
    });
  }, [rosterList, selectedFilter, searchQuery]);

  const handleProfileClick = (worker: WorkerRosterEntry) => {
    const workerSession: UserSession = {
      id: `wrk-${worker.jurisdictionId}`,
      name: worker.name,
      role: 'worker',
      badge: `${worker.role} • ${worker.jurisdictionName.split(' (')[0]}`,
      vehicle: worker.vehicle,
      jurisdictionId: worker.jurisdictionId,
      jurisdictionName: worker.jurisdictionName,
      workerRole: worker.role,
      authenticatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    onSelectWorker(workerSession);
  };

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header Navigation & Identity */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                id="worker-login-back-button"
                onClick={onCancel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer"
                title="Return to Portal Hub"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{lang === 'kn' ? 'ಪೋರ್ಟಲ್ ಹಬ್' : 'Portal Hub'}</span>
              </button>
              <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {lang === 'kn' ? 'ಕಾರ್ಮಿಕ ಪೋರ್ಟಲ್ ಪ್ರವೇಶ' : 'Worker Portal Authentication'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white mt-2 tracking-tight">
              {lang === 'kn' ? 'ಕ್ಷೇತ್ರ ಕಾರ್ಮಿಕರ ನಿಯೋಜನೆ ರೋಸ್ಟರ್' : 'Field Worker Dispatch Roster'}
            </h1>
            <p className="text-sm text-stone-600 dark:text-stone-400 mt-1 max-w-2xl">
              {lang === 'kn'
                ? 'ಸ್ಥಳೀಯ ಕಾರ್ಯ ಸರತಿ ಸಾಲುಗಳು, ಮಾರ್ಗ ತೆರವು ಪ್ರೋಟೋಕಾಲ್‌ಗಳು ಮತ್ತು ರಿಪೇರಿ ಪರಿಶೀಲನಾ ಡೆಸ್ಕ್ ಪ್ರವೇಶಿಸಲು ಕ್ಷೇತ್ರ ಕಾರ್ಯಾಚರಣೆಗಳ ಪ್ರೊಫೈಲ್ ಆಯ್ಕೆಮಾಡಿ.'
                : 'Select a field operations profile below to access real-time localized task queues, route-clearing protocols, and Civic Mesh repair verification desk.'}
            </p>
          </div>

          {/* Quick Roster Metrics */}
          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-right">
              <div className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                {lang === 'kn' ? 'ಪ್ರಾಥಮಿಕ ವಲಯಗಳು' : 'Primary Jurisdictions'}
              </div>
              <div className="text-xl font-bold text-stone-900 dark:text-white">
                {lang === 'kn' ? '21 ಪ್ರೊಫೈಲ್‌ಗಳು' : '21 Profiles'}
              </div>
            </div>
            <div className="px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-right">
              <div className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                {lang === 'kn' ? 'ಗಡಿ ಕಾರಿಡಾರ್‌ಗಳು' : 'Buffer Corridors'}
              </div>
              <div className="text-xl font-bold text-amber-800 dark:text-amber-300">
                {lang === 'kn' ? 'ಸ್ಪಿಲ್‌ಓವರ್ ಮಾತ್ರ' : 'Spillover Only'}
              </div>
            </div>
          </div>
        </div>

        {/* Search & Category Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
          {/* Search Box */}
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="worker-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'kn' ? 'ಕಾರ್ಮಿಕರ ಹೆಸರು, ವಾಹನ ಅಥವಾ ವಲಯ ಹುಡುಕಿ...' : 'Search worker name, vehicle, or jurisdiction...'}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              id="filter-all-workers"
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                selectedFilter === 'all'
                  ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-950 shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              All Jurisdictions (21)
            </button>
            <button
              type="button"
              id="filter-mcc-workers"
              onClick={() => setSelectedFilter('mcc_zone')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                selectedFilter === 'mcc_zone'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
              }`}
            >
              MCC Zones (9)
            </button>
            <button
              type="button"
              id="filter-tp-workers"
              onClick={() => setSelectedFilter('town_panchayat')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                selectedFilter === 'town_panchayat'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60'
              }`}
            >
              Town Panchayats (4)
            </button>
            <button
              type="button"
              id="filter-gp-workers"
              onClick={() => setSelectedFilter('gram_panchayat')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                selectedFilter === 'gram_panchayat'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60'
              }`}
            >
              Gram Panchayats (8)
            </button>
          </div>
        </div>

        {/* Worker Profiles 21-Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRoster.map((worker) => {
            const activeTasks = activeTaskCountByJurisdiction[worker.jurisdictionId] || 0;
            const isMcc = worker.zoneType === 'mcc_zone';
            const isTp = worker.zoneType === 'town_panchayat';

            const badgeBg = isMcc 
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' 
              : isTp 
              ? 'bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800' 
              : 'bg-purple-50 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800';

            const typeLabel = isMcc ? 'MCC Zone' : isTp ? 'Town Panchayat / TMC' : 'Gram Panchayat';

            return (
              <div
                key={worker.jurisdictionId}
                id={`worker-card-${worker.jurisdictionId}`}
                onClick={() => handleProfileClick(worker)}
                className="group relative bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200 dark:border-stone-800 hover:border-blue-500 dark:hover:border-blue-500 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between text-left"
              >
                <div>
                  {/* Top Category Badge & Task Count */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${badgeBg}`}>
                      {typeLabel}
                    </span>
                    <span className={`px-2 py-0.5 text-[11px] font-bold font-mono rounded-md border flex items-center gap-1.5 ${
                      activeTasks > 0
                        ? 'bg-rose-50 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                        : 'bg-stone-50 text-stone-600 dark:bg-stone-800/80 dark:text-stone-400 border-stone-200 dark:border-stone-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${activeTasks > 0 ? 'bg-rose-500 animate-pulse' : 'bg-stone-400'}`} />
                      <span>{activeTasks} Active {activeTasks === 1 ? 'Task' : 'Tasks'}</span>
                    </span>
                  </div>

                  {/* Worker Name & Role */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 font-bold text-sm shadow-xs group-hover:scale-105 transition-transform">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-base text-stone-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {worker.name}
                      </h3>
                      <div className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                        {worker.role}
                      </div>
                    </div>
                  </div>

                  {/* Jurisdiction Details */}
                  <div className="mt-4 p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200/80 dark:border-stone-700/80 space-y-2">
                    <div className="flex items-start gap-2 text-xs">
                      <Building2 className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
                      <span className="font-medium text-stone-800 dark:text-stone-200 line-clamp-2">
                        {worker.jurisdictionName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-300">
                      <Truck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span className="font-mono font-bold">{worker.vehicle}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Button */}
                <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">
                  <span>Dispatch Worker Desk</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>

        {filteredRoster.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
            <AlertCircle className="w-8 h-8 text-stone-400 mx-auto mb-2" />
            <div className="font-bold text-stone-800 dark:text-stone-200">No worker profiles found</div>
            <div className="text-xs text-stone-500">No profiles match &quot;{searchQuery}&quot;. Try adjusting your search query or filter.</div>
          </div>
        )}
      </div>
    </div>
  );
};
