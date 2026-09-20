import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CivicIssue, DepartmentCapacity, UserSession, SeverityRank } from '../types';
import { AdminLeafletMap } from './AdminLeafletMap';
import { 
  isInsideBufferZone, 
  getPriorityScore, 
  getEscalationInfo,
  calculateClearingLedger,
  SEVERITY_LEVELS,
  calculateDynamicCapacities,
  MYSURU_JURISDICTIONS,
  adminUpdateIssue
} from '../mockDatabase';
import {
  BuildingOffice2Icon,
  MapPinIcon,
  MapIcon,
  ArrowPathIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ClockIcon,
  ScaleIcon,
  CreditCardIcon,
  CheckIcon,
  EyeIcon,
  CameraIcon,
  TruckIcon,
  WrenchIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  UserIcon,
  DocumentTextIcon,
  ChartBarIcon,
  SparklesIcon,
  ArrowsPointingOutIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentCheckIcon,
  BoltIcon,
  PhotoIcon,
  FunnelIcon,
  ReceiptPercentIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface AdminDashboardProps {
  session: UserSession | null;
  issues: CivicIssue[];
  departments: DepartmentCapacity[];
  onUpdateStatus: (id: string, status: CivicIssue['status'], crew?: string) => void;
  onNavigateHome: () => void;
  onResetDb: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  session,
  issues,
  departments,
  onUpdateStatus,
  onNavigateHome,
  onResetDb,
}) => {
  // Dynamically calculate capacity across all 9 MCC zones, 4 Town Panchayats, 8 Gram Panchayats, and 5 Buffer Zones
  const dynamicCapacities = calculateDynamicCapacities(issues);

  // Derive Bogadi and MCC Zone 3 capacities dynamically from live active tasks
  const bogadiDynamic = dynamicCapacities.find(c => c.jurisdiction.id === 'tp-bogadi');
  const mccDynamic = dynamicCapacities.find(c => c.jurisdiction.id === 'mcc-zone-3');

  const bogadiCapacity = bogadiDynamic?.capacityPercent ?? 110;
  const mccCapacity = mccDynamic?.capacityPercent ?? 45;
  const isBogadiOverloaded = bogadiCapacity > 100;

  // Primary workflow segment tab to eliminate cognitive overload
  // Options: 'map' (GIS Telemetry), 'triage' (Resolution Queue), 'capacity' (26-Node Matrix), 'ledger' (Inter-Agency), 'all' (Expanded)
  const [activeWorkflowTab, setActiveWorkflowTab] = useState<'map' | 'triage' | 'capacity' | 'ledger' | 'all'>('map');

  // Jurisdiction filter for Capacity Matrix
  const [jurisdictionTab, setJurisdictionTab] = useState<'all' | 'mcc' | 'town_panchayat' | 'gram_panchayat' | 'buffer_zone' | 'overloaded'>('all');

  // Ticket table / list filters
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showBufferOnly, setShowBufferOnly] = useState<boolean>(false);
  const [ledgerSettled, setLedgerSettled] = useState<boolean>(false);
  const [showVoucherModal, setShowVoucherModal] = useState<boolean>(false);

  // Global search query for ticket filtering
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Accordion collapse state for three-tier sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    quarantined: true,
    clustered: true,
    standard: true,
  });

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Selected ticket for detailed inspection & action modal
  const [inspectingIssue, setInspectingIssue] = useState<CivicIssue | null>(null);

  // Action states inside inspection modal
  const [modalNewStatus, setModalNewStatus] = useState<CivicIssue['status']>('reported');
  const [modalNewDepot, setModalNewDepot] = useState<string>('');
  const [modalNewSeverity, setModalNewSeverity] = useState<SeverityRank>(3);
  const [modalAdminNotes, setModalAdminNotes] = useState<string>('');
  const [modalFeedback, setModalFeedback] = useState<string | null>(null);
  const [copiedTrackingId, setCopiedTrackingId] = useState<boolean>(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string; subtitle?: string } | null>(null);

  // Inter-Agency Clearing Ledger summary calculation
  const ledgerSummary = calculateClearingLedger(issues, bogadiCapacity);

  // Global search filter: matches across ID, description, category, reporter names
  const searchFiltered = issues.filter((issue) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const idMatch = (issue.id || '').toLowerCase().includes(q) || (issue.trackingId || '').toLowerCase().includes(q);
    const descMatch = (issue.description || '').toLowerCase().includes(q) || (issue.title || '').toLowerCase().includes(q);
    const catMatch = (issue.category || '').toLowerCase().includes(q);
    const reporterMatch = (issue.reportedBy || '').toLowerCase().includes(q) ||
      (issue.reporters || []).some(r => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q));
    const locMatch = (issue.location || '').toLowerCase().includes(q);
    return idMatch || descMatch || catMatch || reporterMatch || locMatch;
  });

  // Category + buffer filter on top of search
  const displayedIssues = searchFiltered.filter((issue) => {
    if (filterCategory !== 'all' && issue.category !== filterCategory) return false;
    if (showBufferOnly && !issue.isBufferZone) return false;
    return true;
  });

  // Three-tier categorization
  const quarantinedIssues = displayedIssues.filter(i => i.status === 'quarantined' || Boolean(i.isQuarantined));
  const clusteredIssues = displayedIssues.filter(i => {
    if (i.status === 'quarantined' || Boolean(i.isQuarantined)) return false;
    return Boolean(i.reporters && i.reporters.length > 1);
  });
  const standardIssues = displayedIssues.filter(i => {
    if (i.status === 'quarantined' || Boolean(i.isQuarantined)) return false;
    return !i.reporters || i.reporters.length <= 1;
  });

  // Helper: split issues into active/pending and completed/resolved
  const splitByStatus = (list: CivicIssue[]) => {
    const active = list.filter(i => !['resolved', 'closed'].includes(i.status));
    const completed = list.filter(i => ['resolved', 'closed'].includes(i.status));
    return { active, completed };
  };

  const bufferZoneTicketsCount = issues.filter((i) => Boolean(i.isBufferZone)).length;
  const activeTicketsCount = issues.filter((i) => !['resolved', 'closed'].includes(i.status)).length;
  const resolvedTicketsCount = issues.filter((i) => ['resolved', 'closed'].includes(i.status)).length;

  const handleReconcileLedger = () => {
    setLedgerSettled(true);
    setShowVoucherModal(true);
  };

  // Open inspection modal for a ticket
  const handleOpenInspection = (issue: CivicIssue) => {
    setInspectingIssue(issue);
    setModalNewStatus(issue.status);
    setModalNewDepot(issue.assignedDepot || 'MCC Zone 3 (Saraswathipuram / Chamarajapuram)');
    setModalNewSeverity((issue.severityRank || 3) as SeverityRank);
    setModalAdminNotes(issue.adminNotes || '');
    setModalFeedback(null);
  };

  // 1-Click Copy Tracking ID
  const handleCopyTrackingId = (trackingId: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(trackingId);
      setCopiedTrackingId(true);
      setTimeout(() => setCopiedTrackingId(false), 2000);
    }
  };

  // Administrative 'Reopen' Action
  const handleReopenGrievance = () => {
    if (!inspectingIssue) return;
    const noteText = modalAdminNotes.trim() || 'Reopened by Municipal Admin for field reinspection and remediation.';
    adminUpdateIssue(inspectingIssue.id, {
      status: 'in_progress',
      verificationStatus: 'pending',
      adminNotes: noteText,
      assignedDepot: modalNewDepot,
      severityRank: modalNewSeverity,
    });
    onUpdateStatus(inspectingIssue.id, 'in_progress');

    const updatedIssue: CivicIssue = {
      ...inspectingIssue,
      status: 'in_progress',
      verificationStatus: 'pending',
      adminNotes: noteText,
      assignedDepot: modalNewDepot,
      severityRank: modalNewSeverity,
    };
    setInspectingIssue(updatedIssue);
    setModalNewStatus('in_progress');
    setModalFeedback('Grievance marked as REOPENED. Status changed to In Progress and field crews re-dispatched.');
  };

  // Administrative 'Close' Action
  const handleCloseGrievance = () => {
    if (!inspectingIssue) return;
    const noteText = modalAdminNotes.trim() || 'Audited and officially closed with Municipal Authority sign-off.';
    adminUpdateIssue(inspectingIssue.id, {
      status: 'closed',
      verificationStatus: 'verified',
      adminNotes: noteText,
      assignedDepot: modalNewDepot,
      severityRank: modalNewSeverity,
    });
    onUpdateStatus(inspectingIssue.id, 'closed');

    const updatedIssue: CivicIssue = {
      ...inspectingIssue,
      status: 'closed',
      verificationStatus: 'verified',
      adminNotes: noteText,
      assignedDepot: modalNewDepot,
      severityRank: modalNewSeverity,
    };
    setInspectingIssue(updatedIssue);
    setModalNewStatus('closed');
    setModalFeedback('Grievance marked as officially CLOSED and archived in the municipal register.');
  };

  // Save general administrative modifications from modal
  const handleSaveModalAction = () => {
    if (!inspectingIssue) return;

    adminUpdateIssue(inspectingIssue.id, {
      status: modalNewStatus,
      assignedDepot: modalNewDepot,
      severityRank: modalNewSeverity,
      adminNotes: modalAdminNotes.trim() || undefined,
    });

    onUpdateStatus(inspectingIssue.id, modalNewStatus);

    const updatedIssue: CivicIssue = {
      ...inspectingIssue,
      status: modalNewStatus,
      assignedDepot: modalNewDepot,
      severityRank: modalNewSeverity,
      adminNotes: modalAdminNotes.trim() || inspectingIssue.adminNotes,
    };
    setInspectingIssue(updatedIssue);

    setModalFeedback('Grievance administrative record updated and synchronized across all municipal registers.');
  };

  // Filter capacities by tab
  const filteredCapacities = dynamicCapacities.filter((item) => {
    if (jurisdictionTab === 'all') return true;
    if (jurisdictionTab === 'mcc') return item.jurisdiction.type === 'mcc_zone';
    if (jurisdictionTab === 'town_panchayat') return item.jurisdiction.type === 'town_panchayat';
    if (jurisdictionTab === 'gram_panchayat') return item.jurisdiction.type === 'gram_panchayat';
    if (jurisdictionTab === 'buffer_zone') return item.jurisdiction.type === 'buffer_zone';
    if (jurisdictionTab === 'overloaded') return item.capacityPercent > 65 || item.isSpilloverActive;
    return true;
  });

  // Reusable ticket card renderer for the three-tier accordion sections
  const renderTicketCard = (issue: CivicIssue) => {
    const rank = (issue.severityRank || getPriorityScore(issue.category)) as SeverityRank;
    const severityMeta = SEVERITY_LEVELS[rank] || SEVERITY_LEVELS[3];
    const inBuffer = Boolean(issue.isBufferZone);
    const reporterCount = issue.reporters && issue.reporters.length > 0 ? issue.reporters.length : 1;

    return (
      <div
        key={issue.id}
        onClick={() => handleOpenInspection(issue)}
        className={`group flex items-center gap-4 p-3.5 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-xs hover:translate-y-[-1px] ${
          issue.isQuarantined || issue.status === 'quarantined'
            ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 hover:border-rose-300'
            : inBuffer
            ? 'bg-amber-50/40 dark:bg-amber-950/15 border-amber-200 dark:border-amber-900/60 hover:border-amber-300'
            : 'bg-white dark:bg-[#121214] border-stone-200/80 dark:border-stone-800 hover:border-emerald-500/50 dark:hover:border-emerald-600/50'
        }`}
      >
        {/* Severity dot */}
        <div className="flex-shrink-0">
          <div className={`w-2.5 h-2.5 rounded-full ${severityMeta.dotColor}`} />
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[11px] font-bold text-stone-600 dark:text-stone-300">
              {issue.trackingId || issue.id}
            </span>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border ${severityMeta.badgeClass}`}>
              R{rank} • {issue.category}
            </span>
            {issue.isFlagged && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 rounded border border-rose-200 dark:border-rose-800">
                Flagged
              </span>
            )}
            {inBuffer && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                Buffer
              </span>
            )}
            {reporterCount > 1 && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {reporterCount} Citizens Corroborated
              </span>
            )}
            {issue.citizenRating && (
              <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                <StarIconSolid className="w-2.5 h-2.5 text-amber-500" />
                <span>{issue.citizenRating}/5</span>
              </span>
            )}
          </div>
          <div className="text-xs font-semibold text-stone-900 dark:text-white mt-1 line-clamp-1">
            {issue.title}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
            <MapPinIcon className="w-3 h-3 text-stone-400 shrink-0" />
            <span className="line-clamp-1">{issue.location}</span>
            <span className="text-stone-300 dark:text-stone-700">•</span>
            <span>{issue.reportedBy || 'Resident'}</span>
          </div>
        </div>

        {/* Status badge */}
        <div className="flex-shrink-0 flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
              issue.status === 'resolved'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : issue.status === 'closed'
                ? 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
                : issue.status === 'quarantined'
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                : issue.status === 'in_progress'
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                : 'bg-stone-50 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
            }`}
          >
            {issue.status.replace('_', ' ')}
          </span>
          <ChevronRightIcon className="w-4 h-4 text-stone-300 dark:text-stone-600 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f8f9fa] dark:bg-[#09090b] py-8 px-4 sm:px-6 lg:px-8 text-stone-900 dark:text-stone-100 transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Ledger Voucher Confirmation Modal */}
        {showVoucherModal && (
          <div className="fixed inset-0 z-[50] w-screen h-[100dvh] overflow-hidden backdrop-blur-sm bg-stone-950/80 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#121214] border border-stone-200 dark:border-stone-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
              <div className="flex items-center gap-3 border-b border-stone-100 dark:border-stone-800 pb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <ReceiptPercentIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-white font-display">
                    Inter-Agency Debit Voucher Generated
                  </h3>
                  <p className="text-xs text-stone-500 font-mono">Ref: MYS-IA-CLEAR-2026-09</p>
                </div>
              </div>

              <div className="bg-stone-50 dark:bg-stone-900/60 p-4 rounded-xl border border-stone-200 dark:border-stone-800 text-xs space-y-2 font-sans">
                <div className="flex justify-between font-medium">
                  <span className="text-stone-500">Debtor Entity:</span>
                  <span className="text-stone-900 dark:text-white font-semibold">Bogadi Town Panchayat Development Office</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-stone-500">Creditor Entity:</span>
                  <span className="text-stone-900 dark:text-white font-semibold">Mysuru City Corporation (MCC Zone 3)</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-stone-500">Spillover Incidents:</span>
                  <span className="text-stone-900 dark:text-white font-semibold">{ledgerSummary.spilloverTicketsCount} Incidents</span>
                </div>
                <div className="flex justify-between font-bold text-sm pt-2 border-t border-stone-200 dark:border-stone-700">
                  <span className="text-stone-700 dark:text-stone-300">Total Settlement Debit:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono font-extrabold">
                    ₹{ledgerSummary.totalBogadiOwesMCC.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Departmental clearing voucher logged with Finance &amp; Accounts Division. Awaiting monthly inter-departmental treasury reconciliation under Mysuru Urban District Joint Committee.
              </p>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowVoucherModal(false)}
                  className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-900 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Acknowledge &amp; Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Incident Inspection & Action Modal */}
        {inspectingIssue && (() => {
          const allCitizenPhotos = (inspectingIssue.images && inspectingIssue.images.length > 0)
            ? inspectingIssue.images
            : (inspectingIssue.imageUrl ? [inspectingIssue.imageUrl] : []);
          const totalReportsCount = inspectingIssue.reporters && inspectingIssue.reporters.length > 0 ? inspectingIssue.reporters.length : 1;
          const isQuarantined = inspectingIssue.status === 'quarantined' || Boolean(inspectingIssue.isQuarantined);

          return (
            <div className="fixed inset-0 z-[50] w-screen h-[100dvh] overflow-hidden backdrop-blur-sm bg-stone-950/80 flex items-center justify-center p-3 sm:p-6">
              <div className="bg-white dark:bg-[#121214] border border-stone-200 dark:border-stone-800 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl animate-in zoom-in-95 overflow-hidden">
                
                {/* Header: Tracking ID, Category, Status, Priority & Close (Fixed at top) */}
                <div className="p-4 sm:p-6 border-b border-stone-100 dark:border-stone-800 shrink-0 bg-white dark:bg-[#121214] flex items-start justify-between gap-4 z-10">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Clickable / Copyable Tracking ID */}
                      <button
                        type="button"
                        onClick={() => handleCopyTrackingId(inspectingIssue.trackingId || inspectingIssue.id)}
                        className="font-mono text-sm font-bold px-3 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-900 dark:text-white border border-stone-200 dark:border-stone-700 inline-flex items-center gap-1.5 transition-colors group/copy cursor-pointer"
                        title="Click to copy Tracking ID"
                      >
                        <span>{inspectingIssue.trackingId || inspectingIssue.id}</span>
                        {copiedTrackingId ? (
                          <CheckIcon className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <ClipboardDocumentIcon className="w-3.5 h-3.5 text-stone-400 group-hover/copy:text-stone-700 dark:group-hover/copy:text-stone-200" />
                        )}
                      </button>

                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700">
                        {inspectingIssue.category}
                      </span>

                      {inspectingIssue.isBufferZone && (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          Buffer Zone
                        </span>
                      )}

                      {totalReportsCount > 1 && (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {totalReportsCount} Citizens Grouped
                        </span>
                      )}

                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 capitalize">
                        Status: {inspectingIssue.status.replace('_', ' ')}
                      </span>
                    </div>

                    <h2 className="text-base sm:text-lg font-bold text-stone-950 dark:text-white leading-snug line-clamp-2 font-display">
                      {inspectingIssue.title}
                    </h2>

                    <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                      <MapPinIcon className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{inspectingIssue.location}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setInspectingIssue(null)}
                    className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors shrink-0 cursor-pointer"
                    aria-label="Close inspection modal"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Scrollable Audit Body */}
                <div className="overflow-y-auto p-4 sm:p-6 space-y-6 flex-1">
                  
                  {/* Quarantined Warning Banner */}
                  {isQuarantined && (
                    <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200 text-xs space-y-1">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <ShieldExclamationIcon className="w-4 h-4 text-rose-600" />
                        <span>Content Quarantined by Automated Safety Policy</span>
                      </div>
                      <p className="text-[11px] text-rose-800 dark:text-rose-300 leading-relaxed">
                        Flag Reason: Abusive phrasing or safety violation detected in citizen report text. Kept in isolated quarantine register until administrative review.
                      </p>
                    </div>
                  )}

                  {/* Photos Section: Citizen Evidence vs Field Worker Resolution Proof */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                        <CameraIcon className="w-4 h-4 text-stone-400" />
                        <span>Photographic Audit Trail</span>
                      </h4>
                      <span className="text-[11px] text-stone-400">Click any photo to open full resolution preview</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Citizen Photos Card */}
                      <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300">
                          <span>Citizen Grievance Proof ({allCitizenPhotos.length})</span>
                          <span className="text-[10px] text-stone-400 font-mono">Logged at Submission</span>
                        </div>

                        {allCitizenPhotos.length === 0 ? (
                          <div className="h-36 rounded-lg bg-stone-100 dark:bg-stone-800/60 flex flex-col items-center justify-center text-xs text-stone-400 p-4 text-center">
                            <PhotoIcon className="w-6 h-6 mb-1 text-stone-300" />
                            <span>No citizen photo attached</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            {allCitizenPhotos.map((url, idx) => (
                              <div
                                key={idx}
                                onClick={() => setLightboxImage({
                                  url,
                                  title: `Citizen Evidence #${idx + 1}`,
                                  subtitle: `${inspectingIssue.trackingId || inspectingIssue.id} • ${inspectingIssue.location}`
                                })}
                                className="group/img relative h-32 rounded-lg overflow-hidden border border-stone-200 dark:border-stone-700 bg-black cursor-pointer"
                              >
                                <img
                                  src={url}
                                  alt={`Citizen evidence ${idx + 1}`}
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <ArrowsPointingOutIcon className="w-4 h-4" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Field Worker Completion Proof Card */}
                      <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300">
                          <span>Field Crew Remediation Proof</span>
                          <span className="text-[10px] text-stone-400 font-mono">Completion Audit</span>
                        </div>

                        {inspectingIssue.resolvedImageUrl ? (
                          <div
                            onClick={() => setLightboxImage({
                              url: inspectingIssue.resolvedImageUrl!,
                              title: 'Field Worker Resolution Proof',
                              subtitle: `Verified by Photographic Proof Audit • ${inspectingIssue.resolvedAt || 'Timestamp logged'}`
                            })}
                            className="group/img relative h-32 rounded-lg overflow-hidden border border-emerald-300 dark:border-emerald-800 bg-black cursor-pointer"
                          >
                            <img
                              src={inspectingIssue.resolvedImageUrl}
                              alt="Worker Resolution Proof"
                              className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <ArrowsPointingOutIcon className="w-4 h-4" />
                            </div>
                            <div className="absolute bottom-1 right-1 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                              Resolution Photo
                            </div>
                          </div>
                        ) : (
                          <div className="h-32 rounded-lg bg-stone-100 dark:bg-stone-800/60 flex flex-col items-center justify-center text-xs text-stone-400 p-4 text-center">
                            <WrenchIcon className="w-6 h-6 mb-1 text-stone-300" />
                            <span>Remediation in progress</span>
                            <span className="text-[10px] text-stone-400 mt-0.5">Field photo uploaded upon completion</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Civic Mesh Visual Verification Audit Card */}
                  {inspectingIssue.aiAuditDetails && (
                    <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200">
                          <SparklesIcon className="w-4 h-4 text-emerald-600" />
                          <span>Civic Mesh Visual Remediation Audit</span>
                        </div>
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-extrabold">
                          {inspectingIssue.aiAuditDetails.isApproved ? 'Remediation Verified' : 'Audit Pending'}
                        </span>
                      </div>
                      <p className="text-stone-700 dark:text-stone-300 leading-relaxed text-[11px]">
                        {inspectingIssue.aiAuditDetails.explanation || 'Visual evidence cross-referenced against historical municipal defect profiles.'}
                      </p>
                    </div>
                  )}

                  {/* Grievance Description & Resident Context */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                      Grievance Description &amp; Citizen Context
                    </h4>
                    <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 text-xs sm:text-sm text-stone-800 dark:text-stone-200 leading-relaxed">
                      {inspectingIssue.description}
                    </div>
                  </div>

                  {/* Citizen Satisfaction Rating */}
                  {inspectingIssue.citizenRating && (
                    <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-950 dark:text-amber-200">Citizen Post-Remediation Feedback:</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <StarIconSolid
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= (inspectingIssue.citizenRating || 0)
                                  ? 'text-amber-500'
                                  : 'text-stone-300 dark:text-stone-700'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-bold font-mono text-amber-800 dark:text-amber-300">
                          {inspectingIssue.citizenRating} / 5 Stars
                        </span>
                      </div>
                      {inspectingIssue.citizenComment && (
                        <p className="text-stone-700 dark:text-stone-300 italic pt-1">
                          "{inspectingIssue.citizenComment}"
                        </p>
                      )}
                    </div>
                  )}

                  {/* Administrative Action Directives */}
                  <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/40 space-y-4">
                    <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 pb-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                        <ScaleIcon className="w-4 h-4 text-emerald-600" />
                        <span>Administrative Governance Directives</span>
                      </h4>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleReopenGrievance}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-950 dark:hover:bg-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 transition-colors cursor-pointer"
                          title="Reopen ticket for field crew reinspection"
                        >
                          Reopen Grievance
                        </button>
                        <button
                          type="button"
                          onClick={handleCloseGrievance}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:hover:bg-stone-100 dark:text-stone-900 transition-colors cursor-pointer"
                          title="Official Municipal audit sign-off & close"
                        >
                          Official Close
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Status select */}
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                          Governance Status
                        </label>
                        <select
                          value={modalNewStatus}
                          onChange={(e) => setModalNewStatus(e.target.value as CivicIssue['status'])}
                          className="w-full text-xs px-3 py-2 bg-white dark:bg-[#121214] border border-stone-300 dark:border-stone-700 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500/20"
                        >
                          <option value="reported">Reported (Pending Triage)</option>
                          <option value="in_progress">In Progress (Field Dispatched)</option>
                          <option value="resolved">Resolved (Completed Proof)</option>
                          <option value="closed">Closed (Audited Sign-Off)</option>
                          <option value="quarantined">Quarantined (Safety Hold)</option>
                        </select>
                      </div>

                      {/* Reassign Jurisdiction / Depot */}
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                          Assigned Civic Jurisdiction
                        </label>
                        <select
                          value={modalNewDepot}
                          onChange={(e) => setModalNewDepot(e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-white dark:bg-[#121214] border border-stone-300 dark:border-stone-700 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500/20"
                        >
                          <optgroup label="MCC Zones">
                            {MYSURU_JURISDICTIONS.filter(j => j.type === 'mcc_zone').map(j => (
                              <option key={j.id} value={j.name}>{j.name}</option>
                            ))}
                          </optgroup>
                          <optgroup label="Town Panchayats">
                            {MYSURU_JURISDICTIONS.filter(j => j.type === 'town_panchayat').map(j => (
                              <option key={j.id} value={j.name}>{j.name}</option>
                            ))}
                          </optgroup>
                          <optgroup label="Gram Panchayats">
                            {MYSURU_JURISDICTIONS.filter(j => j.type === 'gram_panchayat').map(j => (
                              <option key={j.id} value={j.name}>{j.name}</option>
                            ))}
                          </optgroup>
                          <optgroup label="Buffer Zones">
                            {MYSURU_JURISDICTIONS.filter(j => j.type === 'buffer_zone').map(j => (
                              <option key={j.id} value={j.name}>{j.name}</option>
                            ))}
                          </optgroup>
                        </select>
                      </div>

                      {/* Severity Rank */}
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                          Severity Rating (1 to 5)
                        </label>
                        <select
                          value={modalNewSeverity}
                          onChange={(e) => setModalNewSeverity(parseInt(e.target.value, 10) as SeverityRank)}
                          className="w-full text-xs px-3 py-2 bg-white dark:bg-[#121214] border border-stone-300 dark:border-stone-700 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500/20"
                        >
                          <option value="1">Rank 1 - Low (Streetlights)</option>
                          <option value="2">Rank 2 - Minor (Garbage Dump)</option>
                          <option value="3">Rank 3 - Moderate (Drainage)</option>
                          <option value="4">Rank 4 - High (Potholes)</option>
                          <option value="5">Rank 5 - Critical (Debris)</option>
                        </select>
                      </div>
                    </div>

                    {/* Administrative Notes field */}
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                        Administrative Audit Directives
                      </label>
                      <input
                        type="text"
                        value={modalAdminNotes}
                        onChange={(e) => setModalAdminNotes(e.target.value)}
                        placeholder="e.g. Approved for asphalt resurfacing sign-off or Reopened: patch leveled incorrectly"
                        className="w-full text-xs px-3.5 py-2.5 bg-white dark:bg-[#121214] border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                    </div>

                    {modalFeedback && (
                      <div className="p-3 rounded-xl bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2 border border-emerald-200 dark:border-emerald-800 animate-in fade-in">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{modalFeedback}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Footer Controls (Fixed at bottom) */}
                <div className="p-3 sm:px-6 sm:py-4 border-t border-stone-100 dark:border-stone-800 shrink-0 bg-stone-50/90 dark:bg-stone-900/90 backdrop-blur-xs flex flex-wrap items-center justify-between gap-3 z-10">
                  <span className="text-[11px] text-stone-400 font-mono">
                    Node ID: {inspectingIssue.id}
                  </span>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setInspectingIssue(null)}
                      className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white cursor-pointer"
                    >
                      Dismiss
                    </button>
                    <button
                      type="button"
                      id="btn-save-admin-updates"
                      onClick={handleSaveModalAction}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      Save Administrative Updates
                    </button>
                  </div>
                </div>

              </div>
            </div>
          );
        })()}

        {/* TOP LEVEL EXECUTIVE HEADER */}
        <div className="bg-white dark:bg-[#121214] border border-stone-200/80 dark:border-stone-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-stone-900 dark:bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
              <BuildingOffice2Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-extrabold tracking-tight text-stone-900 dark:text-white font-display">
                  Municipal Administrative Console
                </h1>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Real-Time Civic Mesh</span>
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-sans">
                Unified cross-boundary governance for All 9 MCC Zones, 4 Town Panchayats, 8 Gram Panchayats, and 5 Contested Buffer Corridors.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              id="admin-reset-data"
              onClick={onResetDb}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-stone-700 dark:text-stone-200 hover:text-stone-950 dark:hover:text-white bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 rounded-xl transition-colors cursor-pointer border border-stone-200 dark:border-stone-700 shadow-2xs"
              title="Demo Reset: Seed Bogadi (110% Overload) and MCC Zone 3 (45% Load)"
            >
              <ArrowPathIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Demo Reset</span>
            </button>
            <button
              id="admin-back-home"
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Portal Hub</span>
            </button>
          </div>
        </div>

        {/* EXECUTIVE KPI RIBBON (4 High-Impact Summary Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* KPI 1: Active Triage Queue */}
          <div 
            onClick={() => setActiveWorkflowTab('triage')}
            className="p-4 rounded-2xl bg-white dark:bg-[#121214] border border-stone-200/80 dark:border-stone-800 shadow-xs hover:border-emerald-500/50 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs font-semibold">
              <span className="uppercase tracking-wider">Active Triage Queue</span>
              <DocumentTextIcon className="w-4 h-4 text-stone-400 group-hover:text-emerald-600 transition-colors" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-stone-900 dark:text-white font-mono">
                {activeTicketsCount}
              </span>
              <span className="text-xs text-stone-500 dark:text-stone-400">
                of {displayedIssues.length} tickets
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                {resolvedTicketsCount} Resolved &amp; Closed
              </span>
              <span className="text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200 font-medium flex items-center gap-0.5">
                Inspect <ChevronRightIcon className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* KPI 2: Buffer Zone Corridors */}
          <div 
            onClick={() => setActiveWorkflowTab('map')}
            className="p-4 rounded-2xl bg-white dark:bg-[#121214] border border-stone-200/80 dark:border-stone-800 shadow-xs hover:border-amber-500/50 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs font-semibold">
              <span className="uppercase tracking-wider">Buffer Corridors</span>
              <MapPinIcon className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                {bufferZoneTicketsCount}
              </span>
              <span className="text-xs text-stone-500 dark:text-stone-400">
                cross-boundary pins
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-amber-700 dark:text-amber-300 font-semibold">
                Outer Ring Road corridor
              </span>
              <span className="text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200 font-medium flex items-center gap-0.5">
                View GIS <ChevronRightIcon className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* KPI 3: Municipal Fleet Health */}
          <div 
            onClick={() => setActiveWorkflowTab('capacity')}
            className="p-4 rounded-2xl bg-white dark:bg-[#121214] border border-stone-200/80 dark:border-stone-800 shadow-xs hover:border-rose-500/50 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs font-semibold">
              <span className="uppercase tracking-wider">Fleet Spillover Health</span>
              <BoltIcon className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-3xl font-extrabold font-mono ${isBogadiOverloaded ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {bogadiCapacity}%
              </span>
              <span className="text-xs text-stone-500 dark:text-stone-400">
                Peak Depot Load
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className={`font-semibold ${isBogadiOverloaded ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                {isBogadiOverloaded ? 'Spillover Active to MCC' : 'All 26 Depots Balanced'}
              </span>
              <span className="text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200 font-medium flex items-center gap-0.5">
                Matrix <ChevronRightIcon className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* KPI 4: Inter-Agency Balance */}
          <div 
            onClick={() => setActiveWorkflowTab('ledger')}
            className="p-4 rounded-2xl bg-white dark:bg-[#121214] border border-stone-200/80 dark:border-stone-800 shadow-xs hover:border-emerald-500/50 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs font-semibold">
              <span className="uppercase tracking-wider">Inter-Agency Ledger</span>
              <ScaleIcon className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-stone-900 dark:text-white font-mono">
                ₹{ledgerSummary.totalBogadiOwesMCC.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-stone-500 dark:text-stone-400 font-medium">
                {ledgerSettled ? 'Voucher Logged' : 'Pending Settlement'}
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                Reconcile <ChevronRightIcon className="w-3 h-3" />
              </span>
            </div>
          </div>

        </div>

        {/* WORKFLOW SEGMENTED NAVIGATION TABS (Prevents Information Overload) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200/80 dark:border-stone-800 pb-2">
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Tab 1: Map */}
            <button
              type="button"
              onClick={() => setActiveWorkflowTab('map')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeWorkflowTab === 'map'
                  ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-xs'
                  : 'bg-white dark:bg-[#121214] text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800'
              }`}
            >
              <MapIcon className="w-4 h-4" />
              <span>Geospatial Corridor Telemetry</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                activeWorkflowTab === 'map'
                  ? 'bg-white/20 text-white dark:bg-stone-900/20 dark:text-stone-900'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
              }`}>
                {bufferZoneTicketsCount}
              </span>
            </button>

            {/* Tab 2: Triage Queue */}
            <button
              type="button"
              onClick={() => setActiveWorkflowTab('triage')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeWorkflowTab === 'triage'
                  ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-xs'
                  : 'bg-white dark:bg-[#121214] text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800'
              }`}
            >
              <DocumentTextIcon className="w-4 h-4" />
              <span>Triage &amp; Resolution Queue</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                activeWorkflowTab === 'triage'
                  ? 'bg-white/20 text-white dark:bg-stone-900/20 dark:text-stone-900'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
              }`}>
                {displayedIssues.length}
              </span>
            </button>

            {/* Tab 3: Capacity Matrix */}
            <button
              type="button"
              onClick={() => setActiveWorkflowTab('capacity')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeWorkflowTab === 'capacity'
                  ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-xs'
                  : 'bg-white dark:bg-[#121214] text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800'
              }`}
            >
              <ChartBarIcon className="w-4 h-4" />
              <span>Municipal Fleet Matrix</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                activeWorkflowTab === 'capacity'
                  ? 'bg-white/20 text-white dark:bg-stone-900/20 dark:text-stone-900'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
              }`}>
                26 Nodes
              </span>
            </button>

            {/* Tab 4: Inter-Agency Ledger */}
            <button
              type="button"
              onClick={() => setActiveWorkflowTab('ledger')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeWorkflowTab === 'ledger'
                  ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-xs'
                  : 'bg-white dark:bg-[#121214] text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800'
              }`}
            >
              <ScaleIcon className="w-4 h-4" />
              <span>Inter-Agency Ledger</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                activeWorkflowTab === 'ledger'
                  ? 'bg-white/20 text-white dark:bg-stone-900/20 dark:text-stone-900'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
              }`}>
                ₹{ledgerSummary.totalBogadiOwesMCC.toLocaleString('en-IN')}
              </span>
            </button>

          </div>

          {/* View Toggle: All Sections Expanded */}
          <button
            type="button"
            onClick={() => setActiveWorkflowTab(activeWorkflowTab === 'all' ? 'map' : 'all')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
              activeWorkflowTab === 'all'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 font-bold'
                : 'bg-white dark:bg-[#121214] text-stone-500 border-stone-200/80 dark:border-stone-800 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <ArrowsPointingOutIcon className="w-3.5 h-3.5" />
            <span>{activeWorkflowTab === 'all' ? 'Compact Tabbed Mode' : 'Expand All Modules'}</span>
          </button>
        </div>

        {/* SECTION 1: GEOSPATIAL CORRIDOR TELEMETRY (LEAFLET MAP) */}
        {(activeWorkflowTab === 'map' || activeWorkflowTab === 'all') && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="bg-white dark:bg-[#121214] border border-stone-200/80 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 dark:border-stone-800/80 pb-4">
              <div>
                <h2 className="text-base font-bold text-stone-900 dark:text-white font-display">
                  Mysuru Geospatial Corridor Telemetry &amp; Contested Buffer Corridors
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Visualizing Bogadi Panchayat, MCC Zone 3, and Outer Ring Road contested buffer zone with live pin telemetry. Click any circle marker to open incident audit.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-3 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl">
                  {bufferZoneTicketsCount} Incidents in Contested Buffer Corridor
                </span>
              </div>
            </div>

            <AdminLeafletMap
              issues={issues}
              bogadiCapacity={bogadiCapacity}
              mccCapacity={mccCapacity}
              onSelectIssue={(issue) => handleOpenInspection(issue)}
            />
          </motion.div>
        )}

        {/* SECTION 2: MASTER CIVIC TRIAGE & RESOLUTION LEDGER */}
        {(activeWorkflowTab === 'triage' || activeWorkflowTab === 'all') && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="bg-white dark:bg-[#121214] border border-stone-200/80 dark:border-stone-800 rounded-2xl shadow-xs overflow-hidden"
          >
            {/* Triage Search & Filters Header */}
            <div className="p-6 border-b border-stone-100 dark:border-stone-800 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-stone-900 dark:text-white font-display">
                      Active Civic Resolution Ledger &amp; Geo-Elastic Router
                    </h2>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                      {displayedIssues.length} Tickets
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Click any ticket to inspect citizen photos, field worker resolution audits, and issue municipal directives.
                  </p>
                </div>

                {/* Filter Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBufferOnly(!showBufferOnly)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer border ${
                      showBufferOnly
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 border-stone-200 dark:border-stone-700'
                    }`}
                  >
                    Buffer Zone Only ({bufferZoneTicketsCount})
                  </button>

                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="text-xs px-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-200 focus:outline-none cursor-pointer font-medium"
                  >
                    <option value="all">All Categories</option>
                    <option value="Debris">Debris (Rank 5 - Red)</option>
                    <option value="Potholes">Potholes (Rank 4 - Orange)</option>
                    <option value="Drainage">Drainage (Rank 3 - Yellow)</option>
                    <option value="Garbage Dump">Garbage Dump (Rank 2 - Blue)</option>
                    <option value="Streetlights">Streetlights (Rank 1 - Gray)</option>
                  </select>
                </div>
              </div>

              {/* Global Full-Width Search Bar */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500 pointer-events-none" />
                <input
                  id="admin-search-tickets"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tickets by ID, description, category, resident name, or location..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-stone-50/80 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-700/80 rounded-xl text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-sans"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
                  >
                    <XMarkIcon className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Three-Tier Accordion Sections */}
            <div className="divide-y divide-stone-100 dark:divide-stone-800">

              {/* SECTION 1: Quarantined & Flagged */}
              {(() => {
                const { active, completed } = splitByStatus(quarantinedIssues);
                return (
                  <div>
                    <button
                      type="button"
                      onClick={() => toggleSection('quarantined')}
                      className="w-full flex items-center justify-between px-6 py-4 hover:bg-stone-50/60 dark:hover:bg-stone-800/30 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 flex items-center justify-center shadow-2xs">
                          <ShieldExclamationIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-stone-900 dark:text-white font-display">
                            Quarantined &amp; Flagged
                          </h3>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400">
                            Tickets caught by automated content safety filter for abusive language or spam
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          {quarantinedIssues.length}
                        </span>
                        {expandedSections.quarantined ? (
                          <ChevronDownIcon className="w-4 h-4 text-stone-400" />
                        ) : (
                          <ChevronRightIcon className="w-4 h-4 text-stone-400" />
                        )}
                      </div>
                    </button>
                    {expandedSections.quarantined && (
                      <div className="px-6 pb-4 space-y-3">
                        {quarantinedIssues.length === 0 ? (
                          <div className="text-center py-6 text-xs text-stone-400 dark:text-stone-500 italic">
                            No quarantined tickets. Content safety filters have not flagged any reports.
                          </div>
                        ) : (
                          <>
                            {active.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <ClockIcon className="w-3.5 h-3.5 text-amber-500" />
                                  <span className="text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                                    Active / Pending ({active.length})
                                  </span>
                                </div>
                                <div className="space-y-2">{active.map(issue => renderTicketCard(issue))}</div>
                              </div>
                            )}
                            {completed.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-2 mt-3">
                                  <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" />
                                  <span className="text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                                    Completed / Resolved ({completed.length})
                                  </span>
                                </div>
                                <div className="space-y-2">{completed.map(issue => renderTicketCard(issue))}</div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* SECTION 2: Clustered Reports */}
              {(() => {
                const { active, completed } = splitByStatus(clusteredIssues);
                return (
                  <div>
                    <button
                      type="button"
                      onClick={() => toggleSection('clustered')}
                      className="w-full flex items-center justify-between px-6 py-4 hover:bg-stone-50/60 dark:hover:bg-stone-800/30 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center shadow-2xs">
                          <UserGroupIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-stone-900 dark:text-white font-display">
                            Clustered Reports
                          </h3>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400">
                            Multi-reporter grouped tickets with corroborated evidence from 2 or more citizens
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {clusteredIssues.length}
                        </span>
                        {expandedSections.clustered ? (
                          <ChevronDownIcon className="w-4 h-4 text-stone-400" />
                        ) : (
                          <ChevronRightIcon className="w-4 h-4 text-stone-400" />
                        )}
                      </div>
                    </button>
                    {expandedSections.clustered && (
                      <div className="px-6 pb-4 space-y-3">
                        {clusteredIssues.length === 0 ? (
                          <div className="text-center py-6 text-xs text-stone-400 dark:text-stone-500 italic">
                            No clustered reports. All current tickets have single reporters.
                          </div>
                        ) : (
                          <>
                            {active.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <ClockIcon className="w-3.5 h-3.5 text-amber-500" />
                                  <span className="text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                                    Active / Pending ({active.length})
                                  </span>
                                </div>
                                <div className="space-y-2">{active.map(issue => renderTicketCard(issue))}</div>
                              </div>
                            )}
                            {completed.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-2 mt-3">
                                  <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" />
                                  <span className="text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                                    Completed / Resolved ({completed.length})
                                  </span>
                                </div>
                                <div className="space-y-2">{completed.map(issue => renderTicketCard(issue))}</div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* SECTION 3: Standard Reports */}
              {(() => {
                const { active, completed } = splitByStatus(standardIssues);
                return (
                  <div>
                    <button
                      type="button"
                      onClick={() => toggleSection('standard')}
                      className="w-full flex items-center justify-between px-6 py-4 hover:bg-stone-50/60 dark:hover:bg-stone-800/30 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center shadow-2xs">
                          <DocumentTextIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-stone-900 dark:text-white font-display">
                            Standard Reports
                          </h3>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400">
                            Normal single-reporter civic issue tickets
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                          {standardIssues.length}
                        </span>
                        {expandedSections.standard ? (
                          <ChevronDownIcon className="w-4 h-4 text-stone-400" />
                        ) : (
                          <ChevronRightIcon className="w-4 h-4 text-stone-400" />
                        )}
                      </div>
                    </button>
                    {expandedSections.standard && (
                      <div className="px-6 pb-4 space-y-3">
                        {standardIssues.length === 0 ? (
                          <div className="text-center py-6 text-xs text-stone-400 dark:text-stone-500 italic">
                            No standard reports match the current filters.
                          </div>
                        ) : (
                          <>
                            {active.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <ClockIcon className="w-3.5 h-3.5 text-amber-500" />
                                  <span className="text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                                    Active / Pending ({active.length})
                                  </span>
                                </div>
                                <div className="space-y-2">{active.map(issue => renderTicketCard(issue))}</div>
                              </div>
                            )}
                            {completed.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-2 mt-3">
                                  <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" />
                                  <span className="text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                                    Completed / Resolved ({completed.length})
                                  </span>
                                </div>
                                <div className="space-y-2">{completed.map(issue => renderTicketCard(issue))}</div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

            </div>
          </motion.div>
        )}

        {/* SECTION 3: MYSURU MUNICIPAL & PANCHAYAT LIVE CAPACITY MATRIX */}
        {(activeWorkflowTab === 'capacity' || activeWorkflowTab === 'all') && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="bg-white dark:bg-[#121214] border border-stone-200/80 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 dark:border-stone-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  <ChartBarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-stone-900 dark:text-white font-display">
                    Mysuru Municipal &amp; Panchayat Live Capacity Matrix
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Capacities dynamically auto-calculate in real time based on active tasks and dedicated field workforce across 26 jurisdictions.
                  </p>
                </div>
              </div>

              {ledgerSummary.spilloverTicketsCount > 0 && (
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-bold animate-pulse">
                  <BoltIcon className="w-3.5 h-3.5 text-rose-600" />
                  <span>Geo-Elastic Spillover ACTIVE ({ledgerSummary.spilloverTicketsCount} Tickets Rerouted to MCC)</span>
                </div>
              )}
            </div>

            {/* Sub-Tabs for Filtering Jurisdictions */}
            <div className="flex flex-wrap items-center gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
              <button
                type="button"
                onClick={() => setJurisdictionTab('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  jurisdictionTab === 'all'
                    ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                All Jurisdictions ({dynamicCapacities.length})
              </button>
              <button
                type="button"
                onClick={() => setJurisdictionTab('mcc')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  jurisdictionTab === 'mcc'
                    ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                MCC Zones (9)
              </button>
              <button
                type="button"
                onClick={() => setJurisdictionTab('town_panchayat')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  jurisdictionTab === 'town_panchayat'
                    ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                Town Panchayats (4)
              </button>
              <button
                type="button"
                onClick={() => setJurisdictionTab('gram_panchayat')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  jurisdictionTab === 'gram_panchayat'
                    ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                Gram Panchayats (8)
              </button>
              <button
                type="button"
                onClick={() => setJurisdictionTab('buffer_zone')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  jurisdictionTab === 'buffer_zone'
                    ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                Buffer Corridors (5)
              </button>
            </div>

            {/* Grid of All Jurisdictions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[460px] overflow-y-auto pr-1">
              {filteredCapacities.map((item) => {
                const jur = item.jurisdiction;
                const isOver = item.capacityPercent > 100;
                const isMod = item.capacityPercent > 65 && !isOver;

                return (
                  <div
                    key={jur.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isOver
                        ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900 shadow-2xs'
                        : isMod
                        ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900'
                        : 'bg-stone-50/70 dark:bg-stone-900/40 border-stone-200/80 dark:border-stone-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500 dark:text-stone-400 block">
                          {jur.type.replace('_', ' ')}
                        </span>
                        <h4 className="text-xs font-bold text-stone-900 dark:text-white line-clamp-1 mt-0.5" title={jur.name}>
                          {jur.name}
                        </h4>
                      </div>

                      <span className={`text-xs font-mono font-extrabold px-2 py-0.5 rounded ${
                        isOver
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                          : isMod
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                      }`}>
                        {item.capacityPercent}%
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full mt-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOver
                            ? 'bg-rose-600'
                            : isMod
                            ? 'bg-amber-500'
                            : 'bg-emerald-600'
                        }`}
                        style={{ width: `${Math.min(100, item.capacityPercent)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 mt-2 font-medium">
                      <span>{item.activeIssuesCount} Active Tasks ({item.activeLoad} Load Units)</span>
                      <span>{jur.baseWorkers} Workers</span>
                    </div>

                    {isOver && (
                      <div className="mt-2.5 text-[10px] font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                        <BoltIcon className="w-3 h-3 text-rose-600 shrink-0" />
                        <span>Over Capacity • Spillover Enabled</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* SECTION 4: INTER-AGENCY CLEARING LEDGER */}
        {(activeWorkflowTab === 'ledger' || activeWorkflowTab === 'all') && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="bg-white dark:bg-[#121214] border border-stone-200/80 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 flex items-center justify-center shadow-2xs">
                  <ScaleIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-stone-900 dark:text-white font-display">
                    Inter-Agency Clearing Ledger
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Automated financial debit and credit clearing ledger between Peripheral Panchayats and MCC Zone 3.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold">
                  Cycle: Sep 2026
                </span>
                <button
                  id="btn-reconcile-ledger"
                  type="button"
                  onClick={handleReconcileLedger}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 dark:bg-emerald-600 hover:bg-stone-800 dark:hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <CreditCardIcon className="w-3.5 h-3.5" />
                  <span>Reconcile Ledger</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-stone-50/70 dark:bg-stone-900/40 rounded-xl border border-stone-200/80 dark:border-stone-800 space-y-1">
                <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                  Total Panchayats Debit Owed to MCC
                </span>
                <div className="text-2xl font-extrabold text-stone-900 dark:text-white font-mono tracking-tight">
                  ₹{ledgerSummary.totalBogadiOwesMCC.toLocaleString('en-IN')}
                </div>
                <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium block">
                  Calculated on active spillover workload rates
                </span>
              </div>

              <div className="p-4 bg-stone-50/70 dark:bg-stone-900/40 rounded-xl border border-stone-200/80 dark:border-stone-800 space-y-1">
                <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                  Spillover Incident Volume
                </span>
                <div className="text-2xl font-extrabold text-stone-900 dark:text-white font-mono tracking-tight">
                  {ledgerSummary.spilloverTicketsCount} Tickets
                </div>
                <span className="text-[11px] text-stone-500 dark:text-stone-400 block">
                  Buffer boundary tickets absorbed by MCC fleet
                </span>
              </div>

              <div className="p-4 bg-stone-50/70 dark:bg-stone-900/40 rounded-xl border border-stone-200/80 dark:border-stone-800 space-y-1">
                <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                  Clearing Status
                </span>
                <div className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-1.5 pt-1">
                  {ledgerSettled ? (
                    <>
                      <CheckIcon className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700 dark:text-emerald-400">Voucher Logged (Pending Treasury Transfer)</span>
                    </>
                  ) : (
                    <>
                      <ClockIcon className="w-4 h-4 text-amber-600" />
                      <span>Pending Monthly Inter-Departmental Settlement</span>
                    </>
                  )}
                </div>
                <span className="text-[11px] text-stone-500 dark:text-stone-400 block">
                  Statutory clearing rules: Mysuru Urban District Joint Committee
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* High-Resolution Image Lightbox Modal */}
        {lightboxImage && (
          <div 
            className="fixed inset-0 z-[60] w-screen h-[100dvh] overflow-hidden bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in"
            onClick={() => setLightboxImage(null)}
          >
            <div 
              className="relative max-w-4xl w-full bg-stone-900 rounded-2xl overflow-hidden border border-stone-800 shadow-2xl p-2 space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-3 pt-2 text-white">
                <div>
                  <h4 className="text-sm font-bold">{lightboxImage.title}</h4>
                  {lightboxImage.subtitle && (
                    <p className="text-xs text-stone-400">{lightboxImage.subtitle}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setLightboxImage(null)}
                  className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors cursor-pointer"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="max-h-[75vh] flex items-center justify-center bg-black rounded-xl overflow-hidden">
                <img
                  src={lightboxImage.url}
                  alt={lightboxImage.title}
                  className="max-h-[75vh] w-auto object-contain"
                />
              </div>

              <div className="text-center text-[11px] text-stone-400 pb-1 font-mono">
                Official Geotagged Photographic Proof • Mysuru Municipal Digital Register
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
