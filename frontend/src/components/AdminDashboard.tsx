import React, { useState } from 'react';
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
  ShieldAlert, 
  ArrowLeft, 
  Activity, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Filter,
  FileText,
  Building2,
  Receipt,
  Scale,
  CreditCard,
  Check,
  Eye,
  Camera,
  Truck,
  Wrench,
  ChevronRight,
  ChevronDown,
  X,
  MapPin,
  Maximize2,
  ExternalLink,
  Copy,
  RotateCcw,
  User,
  Image as ImageIcon,
  Layers,
  AlertCircle,
  Search,
  Users,
  Star
} from 'lucide-react';

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

  // Derive Bogadi and MCC Zone 3 capacities dynamically from live active tasks
  const bogadiCapacity = bogadiDynamic?.capacityPercent ?? 110;
  const mccCapacity = mccDynamic?.capacityPercent ?? 45;

  const isBogadiOverloaded = bogadiCapacity > 100;

  // Jurisdiction filter for Capacity Matrix
  const [jurisdictionTab, setJurisdictionTab] = useState<'all' | 'mcc' | 'town_panchayat' | 'gram_panchayat' | 'buffer_zone' | 'overloaded'>('all');

  // Ticket table / list filters
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showBufferOnly, setShowBufferOnly] = useState<boolean>(false);
  const [showQuarantinedOnly, setShowQuarantinedOnly] = useState<boolean>(false);
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

  const quarantinedTicketsCount = issues.filter((i) => 
    i.status === 'quarantined' || Boolean(i.isQuarantined)
  ).length;

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
        className={`group flex items-center gap-4 p-3.5 rounded-xl border cursor-pointer transition-all hover:shadow-sm ${
          issue.isQuarantined || issue.status === 'quarantined'
            ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900 hover:border-rose-400'
            : inBuffer
            ? 'bg-amber-50/40 dark:bg-amber-950/15 border-amber-200 dark:border-amber-900 hover:border-amber-400'
            : 'bg-white dark:bg-stone-800/40 border-stone-200 dark:border-stone-700 hover:border-emerald-400 dark:hover:border-emerald-600'
        }`}
      >
        {/* Severity dot */}
        <div className="flex-shrink-0">
          <div className={`w-3 h-3 rounded-full ${severityMeta.dotColor}`} />
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[11px] font-extrabold text-stone-600 dark:text-stone-300">
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
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                Buffer
              </span>
            )}
            {reporterCount > 1 && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {reporterCount} Reporters
              </span>
            )}
            {issue.citizenRating && (
              <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                <span>{issue.citizenRating}/5</span>
              </span>
            )}
          </div>
          <div className="text-xs font-semibold text-stone-900 dark:text-white mt-0.5 line-clamp-1">
            {issue.title}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
            <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
            <span className="line-clamp-1">{issue.location}</span>
            <span className="text-stone-300 dark:text-stone-600">•</span>
            <span>{issue.reportedBy || 'Resident'}</span>
          </div>
        </div>

        {/* Status badge */}
        <div className="flex-shrink-0 flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
              issue.status === 'resolved'
                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                : issue.status === 'closed'
                ? 'bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-300 border border-stone-300 dark:border-stone-700'
                : issue.status === 'quarantined'
                ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                : issue.status === 'in_progress'
                ? 'bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
            }`}
          >
            {issue.status.replace('_', ' ')}
          </span>
          <ChevronRight className="w-4 h-4 text-stone-300 dark:text-stone-600 group-hover:text-emerald-500 transition-colors" />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-stone-50 dark:bg-stone-950 py-8 px-4 sm:px-6 lg:px-8 text-stone-900 dark:text-stone-100 transition-colors">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Ledger Voucher Confirmation Modal */}
        {showVoucherModal && (
          <div className="fixed inset-0 z-[50] w-screen h-[100dvh] overflow-hidden backdrop-blur-sm bg-stone-950/80 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
              <div className="flex items-center gap-3 border-b border-stone-100 dark:border-stone-800 pb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-white">Inter-Agency Debit Voucher Generated</h3>
                  <p className="text-xs text-stone-500 font-mono">Ref: MYS-IA-CLEAR-2026-09</p>
                </div>
              </div>

              <div className="bg-stone-50 dark:bg-stone-800/60 p-4 rounded-xl border border-stone-200 dark:border-stone-700 text-xs space-y-2">
                <div className="flex justify-between font-semibold">
                  <span className="text-stone-500">Debtor Entity:</span>
                  <span className="text-stone-900 dark:text-white">Bogadi Town Panchayat Development Office</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-stone-500">Creditor Entity:</span>
                  <span className="text-stone-900 dark:text-white">Mysuru City Corporation (MCC Zone 3)</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-stone-500">Spillover Incidents:</span>
                  <span className="text-stone-900 dark:text-white">{ledgerSummary.spilloverTicketsCount} Incidents</span>
                </div>
                <div className="flex justify-between font-bold text-sm pt-2 border-t border-stone-200 dark:border-stone-700">
                  <span className="text-stone-700 dark:text-stone-300">Total Settlement Debit:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                    ₹{ledgerSummary.totalBogadiOwesMCC.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Departmental clearing voucher logged with Finance & Accounts Division. Awaiting monthly inter-departmental treasury reconciliation.
              </p>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowVoucherModal(false)}
                  className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-900 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Acknowledge & Close
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
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl animate-in zoom-in-95 overflow-hidden">
                
                {/* Header: Tracking ID, Category, Status, Priority & Close (Fixed at top) */}
                <div className="p-4 sm:p-6 border-b border-stone-100 dark:border-stone-800 shrink-0 bg-white dark:bg-stone-900 flex items-start justify-between gap-4 z-10">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Clickable / Copyable Tracking ID */}
                      <button
                        type="button"
                        onClick={() => handleCopyTrackingId(inspectingIssue.trackingId || inspectingIssue.id)}
                        className="font-mono text-sm font-extrabold px-3 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-900 dark:text-white border border-stone-300 dark:border-stone-700 inline-flex items-center gap-1.5 transition-colors group/copy cursor-pointer"
                        title="Click to copy Tracking ID"
                      >
                        <span>{inspectingIssue.trackingId || inspectingIssue.id}</span>
                        {copiedTrackingId ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-stone-400 group-hover/copy:text-stone-700 dark:group-hover/copy:text-stone-200" />
                        )}
                      </button>

                      <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                        {inspectingIssue.category}
                      </span>

                      {/* Total Reports Badge (Aggregated View) */}
                      <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200 border border-purple-300 dark:border-purple-800 flex items-center gap-1">
                        <Layers className="w-3 h-3 text-purple-600" />
                        <span>Total Reports: {totalReportsCount}</span>
                      </span>

                      <span className={`text-xs font-bold px-2.5 py-1 rounded-md border uppercase ${
                        isQuarantined
                          ? 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950 dark:text-rose-200'
                          : inspectingIssue.status === 'resolved' 
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200'
                          : inspectingIssue.status === 'closed'
                          ? 'bg-stone-200 text-stone-800 border-stone-300 dark:bg-stone-800 dark:text-stone-300'
                          : inspectingIssue.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-200'
                          : 'bg-stone-100 text-stone-800 border-stone-300 dark:bg-stone-800 dark:text-stone-300'
                      }`}>
                        {inspectingIssue.status.replace('_', ' ')}
                      </span>

                      <span className="text-xs font-bold px-2 py-1 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                        Rank {inspectingIssue.severityRank || 3}/5 Priority
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-stone-900 dark:text-white pt-1">
                      {inspectingIssue.title}
                    </h3>

                    {/* List of All Reporter Names */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500 dark:text-stone-400">
                      <span className="inline-flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-stone-400" />
                        <span>
                          Reported by: <strong>
                            {inspectingIssue.reporters && inspectingIssue.reporters.length > 0
                              ? inspectingIssue.reporters.map((r) => r.name).join(', ')
                              : inspectingIssue.reportedBy || 'Mysuru Resident'}
                          </strong>
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        {inspectingIssue.reportedAt}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-stone-400" />
                        {inspectingIssue.location}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    id="btn-close-inspect-modal"
                    onClick={() => setInspectingIssue(null)}
                    className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white transition-colors shrink-0 cursor-pointer"
                    aria-label="Close dialog"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Scrollable Body: Details, Photos, Actions */}
                <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1 overscroll-contain">
                  {/* Quarantine Alert Banner */}
                  {isQuarantined && (
                    <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>QUARANTINED BY CONTENT MODERATION:</strong>
                          <p className="mt-0.5 text-rose-800 dark:text-rose-300">
                            {inspectingIssue.quarantineReason || 'Flagged for abusive content, gibberish or promotional spam. Excluded from public lists and capacity matrix.'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          adminUpdateIssue(inspectingIssue.id, {
                            status: 'reported',
                            adminNotes: 'Admin cleared ticket from quarantine after manual review.',
                          });
                          onUpdateStatus(inspectingIssue.id, 'reported');
                          setInspectingIssue({
                            ...inspectingIssue,
                            status: 'reported',
                            isQuarantined: false,
                          });
                          setModalFeedback('Ticket approved from quarantine and queued for dispatch.');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shrink-0 cursor-pointer shadow-xs"
                      >
                        Approve & Dispatch
                      </button>
                    </div>
                  )}

                  {/* Full Issue Details: Location, Corridor, GPS & Telemetry */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-700 text-xs">
                    <div>
                      <span className="text-[10px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                        Corridor & Jurisdiction
                      </span>
                      <span className="font-bold text-stone-900 dark:text-white mt-0.5 block">
                        {inspectingIssue.assignedDepot || 'MCC Zone 3 Jurisdiction'}
                      </span>
                      {inspectingIssue.isBufferZone && (
                        <span className="inline-block mt-1 text-[10px] font-extrabold px-1.5 py-0.5 bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 rounded border border-amber-300 dark:border-amber-800">
                          Buffer Corridor Zone
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                        GPS Coordinates
                      </span>
                      <span className="font-mono font-bold text-stone-900 dark:text-white mt-0.5 block">
                        {inspectingIssue.coordinatesStr || (inspectingIssue.coordinates ? `${inspectingIssue.coordinates.lat.toFixed(4)}, ${inspectingIssue.coordinates.lng.toFixed(4)}` : '12.3020° N, 76.6180° E')}
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 inline-block">
                        ✓ Geotag Verified
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                        Inter-Agency Clearing Cost
                      </span>
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 block">
                        ₹{(inspectingIssue.clearingCost || 3500).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-stone-500 dark:text-stone-400 mt-1 inline-block">
                        Municipal Treasury Clearing Rate
                      </span>
                    </div>
                  </div>

                  {/* Photos & Photographic Evidence Comparison Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 1. Citizen Uploaded Photo Proof & Gallery */}
                    <div className="space-y-2 p-4 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-700">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                          <Camera className="w-4 h-4 text-emerald-600" />
                          <span>Citizen Evidence Photo ({allCitizenPhotos.length} Total)</span>
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                          INTAKE VERIFIED
                        </span>
                      </div>

                      {allCitizenPhotos.length > 0 ? (
                        <div className="space-y-2">
                          <div className="relative rounded-xl overflow-hidden border border-stone-300 dark:border-stone-700 bg-black aspect-video flex items-center justify-center group/img">
                            <img
                              src={allCitizenPhotos[0]}
                              alt="Citizen proof"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white font-mono text-[9px]">
                              PRIMARY EVIDENCE • GEO: {inspectingIssue.coordinatesStr || '12.3020, 76.6180'}
                            </div>
                            <button
                              type="button"
                              onClick={() => setLightboxImage({
                                url: allCitizenPhotos[0],
                                title: `Citizen Primary Evidence: ${inspectingIssue.trackingId || inspectingIssue.id}`,
                                subtitle: inspectingIssue.location
                              })}
                              className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs opacity-80 group-hover/img:opacity-100 transition-opacity flex items-center gap-1 cursor-pointer"
                              title="Enlarge photo"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                              <span className="text-[10px]">Zoom</span>
                            </button>
                          </div>

                          {/* Scrollable Row of All Submitted Photos */}
                          {allCitizenPhotos.length > 1 && (
                            <div className="pt-1">
                              <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 block mb-1">
                                All Submitted Incident Photos ({allCitizenPhotos.length}):
                              </span>
                              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                {allCitizenPhotos.map((img, idx) => {
                                  const rep = inspectingIssue.reporters?.[idx];
                                  return (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => setLightboxImage({
                                        url: img,
                                        title: `Evidence Photo #${idx + 1} • ${inspectingIssue.trackingId || inspectingIssue.id}`,
                                        subtitle: rep ? `Reported by ${rep.name} (${rep.timestamp})` : inspectingIssue.location
                                      })}
                                      className="relative shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 border-stone-300 dark:border-stone-700 hover:border-emerald-500 transition-all cursor-pointer group/thumb"
                                    >
                                      <img src={img} alt={`Evidence #${idx + 1}`} className="w-full h-full object-cover" />
                                      <span className="absolute bottom-0.5 right-0.5 text-[8px] font-bold px-1 rounded bg-black/70 text-white">
                                        #{idx + 1}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="h-44 rounded-xl border-2 border-dashed border-stone-300 dark:border-stone-700 flex flex-col items-center justify-center text-stone-400 p-4 text-center text-xs">
                          <Camera className="w-8 h-8 mb-2 opacity-50" />
                          <span>No citizen photo attached with report</span>
                        </div>
                      )}

                      <div className="text-[11px] text-stone-600 dark:text-stone-300 pt-1">
                        <strong className="text-stone-900 dark:text-white">Resident Description:</strong>
                        <p className="mt-0.5 italic leading-relaxed text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-900 p-2 rounded-lg border border-stone-200 dark:border-stone-800">
                          "{inspectingIssue.description}"
                        </p>
                      </div>
                    </div>

                  {/* 2. Field Worker Resolution & Audit Proof */}
                  <div className="space-y-2 p-4 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-700">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                        <Wrench className="w-4 h-4 text-blue-600" />
                        <span>Field Worker Resolution Audit</span>
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold uppercase ${
                        inspectingIssue.status === 'resolved' || inspectingIssue.status === 'closed'
                          ? (inspectingIssue.isFlagged || inspectingIssue.verificationStatus === 'flagged_unverified'
                              ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
                              : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200')
                          : 'bg-stone-200 text-stone-800 dark:bg-stone-800 dark:text-stone-300'
                      }`}>
                        {inspectingIssue.status === 'resolved' || inspectingIssue.status === 'closed' 
                          ? (inspectingIssue.isFlagged || inspectingIssue.verificationStatus === 'flagged_unverified' ? 'FLAGGED FOR AUDIT' : 'PROOF VERIFIED')
                          : 'WORK IN PROGRESS'}
                      </span>
                    </div>

                    {inspectingIssue.resolvedImageUrl ? (
                      <div className="relative rounded-xl overflow-hidden border border-stone-300 dark:border-stone-700 bg-black aspect-video flex items-center justify-center group/img">
                        <img
                          src={inspectingIssue.resolvedImageUrl}
                          alt="Worker completion proof"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white font-mono text-[9px]">
                          WORKER AUDIT PROOF VERIFIED
                        </div>
                        <button
                          type="button"
                          onClick={() => setLightboxImage({
                            url: inspectingIssue.resolvedImageUrl!,
                            title: `Worker Resolution Proof: ${inspectingIssue.trackingId || inspectingIssue.id}`,
                            subtitle: inspectingIssue.location
                          })}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs opacity-80 group-hover/img:opacity-100 transition-opacity flex items-center gap-1 cursor-pointer"
                          title="Enlarge photo"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span className="text-[10px]">Zoom</span>
                        </button>
                      </div>
                    ) : (
                      <div className="h-44 rounded-xl border-2 border-dashed border-stone-300 dark:border-stone-700 flex flex-col items-center justify-center text-stone-400 p-4 text-center text-xs">
                        <Truck className="w-8 h-8 mb-2 opacity-50 text-blue-500" />
                        <span className="font-medium text-stone-600 dark:text-stone-300">Field Crew Dispatched</span>
                        <span className="text-[11px] text-stone-400 mt-0.5">Final photographic resolution proof pending completion.</span>
                      </div>
                    )}

                    <div className="text-[11px] text-stone-600 dark:text-stone-300 space-y-1 pt-1 bg-white dark:bg-stone-900 p-2 rounded-lg border border-stone-200 dark:border-stone-800">
                      <div className="flex justify-between">
                        <strong>Assigned Crew Lead:</strong>
                        <span className="font-semibold text-stone-900 dark:text-white">
                          {inspectingIssue.assignedCrew || 'Manjunatha S. (MCC Depot 3)'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <strong>Assigned Vehicle:</strong>
                        <span className="font-mono text-stone-800 dark:text-stone-200">
                          {inspectingIssue.assignedVehicle || 'Canter KA-09-G-4412'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <strong>Worker Status:</strong>
                        <span className="capitalize font-semibold text-emerald-700 dark:text-emerald-400">
                          {inspectingIssue.status === 'resolved' || inspectingIssue.status === 'closed' ? 'Task Completed & Audited' : 'Active Field Remediation'}
                        </span>
                      </div>
                      {inspectingIssue.resolutionNotes && (
                        <div className="pt-1.5 border-t border-stone-200 dark:border-stone-800 text-[11px]">
                          <strong className="text-stone-700 dark:text-stone-300 block">AI Resolution Audit:</strong>
                          <span className="text-stone-600 dark:text-stone-400 leading-tight block mt-0.5">{inspectingIssue.resolutionNotes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Citizen Satisfaction Feedback & Rating Card (Citizen Feedback Loop) */}
                {inspectingIssue.citizenRating && (
                  <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/60 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span>Citizen Satisfaction Rating</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= (inspectingIssue.citizenRating || 0)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-stone-300 dark:text-stone-600'
                            }`}
                          />
                        ))}
                        <span className="text-xs font-extrabold text-amber-900 dark:text-amber-200 ml-1.5">
                          {inspectingIssue.citizenRating} / 5 Stars
                        </span>
                      </div>
                    </div>
                    {inspectingIssue.citizenFeedback && (
                      <div className="text-xs italic text-stone-700 dark:text-stone-300 bg-white/80 dark:bg-stone-900/80 p-2.5 rounded-lg border border-amber-100 dark:border-amber-900/40">
                        &ldquo;{inspectingIssue.citizenFeedback}&rdquo;
                      </div>
                    )}
                  </div>
                )}

                {/* Administrative Actions Form */}
                <div className="p-4 bg-stone-100 dark:bg-stone-800/60 rounded-xl border border-stone-200 dark:border-stone-700 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Administrative Authority Actions</span>
                    </h4>
                    <span className="text-[11px] text-stone-500 dark:text-stone-400">
                      Direct Grievance Governance
                    </span>
                  </div>

                  {/* Direct Action Buttons: 'Reopen' and 'Close' */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
                    <button
                      type="button"
                      id="btn-admin-reopen"
                      onClick={handleReopenGrievance}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-950 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 font-bold text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                      <span>Reopen Grievance for Remediation</span>
                    </button>

                    <button
                      type="button"
                      id="btn-admin-close"
                      onClick={handleCloseGrievance}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 font-bold text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                      <span>Close Grievance with Sign-off</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Status update */}
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                        Resolution Status
                      </label>
                      <select
                        value={modalNewStatus}
                        onChange={(e) => setModalNewStatus(e.target.value as CivicIssue['status'])}
                        className="w-full text-xs px-3 py-2 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl font-medium"
                      >
                        <option value="reported">Reported (Pending Triage)</option>
                        <option value="assigned">Assigned to Crew</option>
                        <option value="in_progress">In Progress (Field Work)</option>
                        <option value="resolved">Resolved (Work Completed)</option>
                        <option value="closed">Closed (Signed Off)</option>
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
                        className="w-full text-xs px-3 py-2 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl font-medium"
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
                        className="w-full text-xs px-3 py-2 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl font-medium"
                      >
                        <option value="1">Rank 1 - Low (Streetlights)</option>
                        <option value="2">Rank 2 - Minor (Garbage Dump)</option>
                        <option value="3">Rank 3 - Moderate (Drainage)</option>
                        <option value="4">Rank 4 - High (Potholes)</option>
                        <option value="5">Rank 5 - Critical (Debris)</option>
                      </select>
                    </div>
                  </div>

                  {/* Administrative Notes / Reason field */}
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                      Administrative Audit Notes & Directives
                    </label>
                    <input
                      type="text"
                      value={modalAdminNotes}
                      onChange={(e) => setModalAdminNotes(e.target.value)}
                      placeholder="e.g. Approved for asphalt resurfacing sign-off or Reopened: pothole patch leveled incorrectly"
                      className="w-full text-xs px-3.5 py-2 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white"
                    />
                  </div>

                  {modalFeedback && (
                    <div className="p-3 rounded-xl bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{modalFeedback}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer Controls (Fixed at bottom) */}
              <div className="p-3 sm:px-6 sm:py-4 border-t border-stone-100 dark:border-stone-800 shrink-0 bg-stone-50/90 dark:bg-stone-900/90 backdrop-blur-xs flex flex-wrap items-center justify-between gap-3 z-10">
                <span className="text-[11px] text-stone-400">
                  Ticket ID: {inspectingIssue.id}
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
                    className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    Save Administrative Updates
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

        {/* Admin Header - Cleaned up to Admin Dashboard with NO officer references */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-stone-900 dark:bg-emerald-800 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-white">
                  Admin Dashboard
                </h1>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Real-Time Civic Mesh
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Centralized Governance for All 9 MCC Zones, 4 Town Panchayats, 8 Gram Panchayats & Contested Buffer Corridors
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="admin-reset-data"
              onClick={onResetDb}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:text-stone-950 dark:hover:text-white bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 rounded-xl transition-colors cursor-pointer border border-stone-200 dark:border-stone-700"
              title="Demo Reset: Seed Bogadi (110% Overload, 22 Load) & MCC Zone 3 (45% Load, 13 Load), Clear All Other Jurisdictions"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Demo Reset</span>
            </button>
            <button
              id="admin-back-home"
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Portal Hub</span>
            </button>
          </div>
        </div>

        {/* Dynamic Capacity Monitor covering ALL 9 MCC Zones, 4 Town Panchayats, 8 Gram Panchayats & Buffer Zones */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-4">
            <div className="flex items-center gap-2.5">
              <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <h2 className="text-base font-bold text-stone-900 dark:text-white">
                  Mysuru Municipal & Panchayat Live Capacity Matrix
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Capacities dynamically auto-calculate in real time based on active tasks and dedicated field workforce.
                </p>
              </div>
            </div>

            {ledgerSummary.spilloverTicketsCount > 0 && (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-bold animate-pulse">
                <Zap className="w-3.5 h-3.5 text-rose-600" />
                <span>Geo-Elastic Spillover ACTIVE ({ledgerSummary.spilloverTicketsCount} Tickets Rerouted to MCC)</span>
              </div>
            )}
          </div>

          {/* Tab bar for filtering jurisdictions */}
          <div className="flex flex-wrap items-center gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
            <button
              onClick={() => setJurisdictionTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                jurisdictionTab === 'all'
                  ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              All Jurisdictions ({dynamicCapacities.length})
            </button>
            <button
              onClick={() => setJurisdictionTab('mcc')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                jurisdictionTab === 'mcc'
                  ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              MCC Zones (9)
            </button>
            <button
              onClick={() => setJurisdictionTab('town_panchayat')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                jurisdictionTab === 'town_panchayat'
                  ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              Town Panchayats / TMC (4)
            </button>
            <button
              onClick={() => setJurisdictionTab('gram_panchayat')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                jurisdictionTab === 'gram_panchayat'
                  ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              Gram Panchayats (8)
            </button>
            <button
              onClick={() => setJurisdictionTab('buffer_zone')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                jurisdictionTab === 'buffer_zone'
                  ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
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
                      ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900 shadow-xs'
                      : isMod
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900'
                      : 'bg-stone-50/70 dark:bg-stone-800/40 border-stone-200 dark:border-stone-700'
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
                  <div className="w-full h-2 bg-stone-200 dark:bg-stone-700 rounded-full mt-3 overflow-hidden">
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
                      <Zap className="w-3 h-3 text-rose-600 shrink-0" />
                      <span>Over Capacity • Spillover Enabled</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Inter-Agency Clearing Ledger Summary Box */}
        <div className="bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 flex items-center justify-center">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-stone-900 dark:text-white">
                  Inter-Agency Clearing Ledger
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Automated financial debit/credit clearing ledger between Peripheral Panchayats and MCC
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold">
                Cycle: Sep 2026
              </span>
              <button
                id="btn-reconcile-ledger"
                type="button"
                onClick={handleReconcileLedger}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-900 dark:bg-emerald-700 hover:bg-stone-800 dark:hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Reconcile Ledger</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700 space-y-1">
              <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                Total Panchayats Debit Owed to MCC
              </span>
              <div className="text-2xl font-extrabold text-stone-900 dark:text-white font-mono tracking-tight">
                ₹{ledgerSummary.totalBogadiOwesMCC.toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium block">
                Calculated on active spillover workload rates
              </span>
            </div>

            <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700 space-y-1">
              <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                Spillover Incident Volume
              </span>
              <div className="text-2xl font-extrabold text-stone-900 dark:text-white font-mono tracking-tight">
                {ledgerSummary.spilloverTicketsCount} Tickets
              </div>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 block">
                Buffer boundary tickets absorbed by MCC fleet
              </span>
            </div>

            <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700 space-y-1">
              <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                Clearing Status
              </span>
              <div className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-1.5 pt-1">
                {ledgerSettled ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700 dark:text-emerald-400">Voucher Logged (Pending Treasury Transfer)</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Pending Monthly Inter-Departmental Settlement</span>
                  </>
                )}
              </div>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 block">
                Statutory clearing rules: Mysuru Urban District Joint Committee
              </span>
            </div>
          </div>
        </div>

        {/* Admin Dashboard: Leaflet Map Centered on Mysuru with Overlays */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-white">
                Geospatial Corridor Telemetry & Buffer Overlays
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Visualizing Bogadi Panchayat, MCC Zone 3, and Contested Buffer Zones with real-time ticket pins
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg">
                {bufferZoneTicketsCount} Incidents in Buffer Zone
              </span>
            </div>
          </div>

          <AdminLeafletMap
            issues={issues}
            bogadiCapacity={bogadiCapacity}
            mccCapacity={mccCapacity}
            onSelectIssue={(issue) => handleOpenInspection(issue)}
          />
        </div>

        {/* Master Civic Triage Ledger - Three-Tier Accordion with Global Search */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-stone-100 dark:border-stone-800 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-stone-900 dark:text-white">
                    Active Civic Resolution Ledger & Geo-Elastic Router
                  </h2>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                    {displayedIssues.length} Tickets
                  </span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Click any ticket to inspect citizen photos, worker resolution audits, and take governance actions.
                </p>
              </div>

              {/* Filter controls */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowBufferOnly(!showBufferOnly);
                    if (!showBufferOnly) setShowQuarantinedOnly(false);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
                    showBufferOnly
                      ? 'bg-amber-600 text-white font-semibold'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                  }`}
                >
                  Buffer Zone Only ({bufferZoneTicketsCount})
                </button>

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="text-xs px-3 py-1.5 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-200 focus:outline-none cursor-pointer font-medium"
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
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500 pointer-events-none" />
              <input
                id="admin-search-tickets"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tickets by ID, description, category, reporter name, or location..."
                className="w-full pl-10 pr-4 py-3 text-sm bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 dark:focus:border-emerald-600 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
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
                      <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 flex items-center justify-center">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-stone-900 dark:text-white">Quarantined & Flagged</h3>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400">Tickets caught by AI content filter for abusive language, spam, or explicit content</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                        {quarantinedIssues.length}
                      </span>
                      {expandedSections.quarantined ? <ChevronDown className="w-4 h-4 text-stone-400" /> : <ChevronRight className="w-4 h-4 text-stone-400" />}
                    </div>
                  </button>
                  {expandedSections.quarantined && (
                    <div className="px-6 pb-4 space-y-3">
                      {quarantinedIssues.length === 0 ? (
                        <div className="text-center py-6 text-xs text-stone-400 dark:text-stone-500 italic">
                          No quarantined tickets. AI content filters have not flagged any reports.
                        </div>
                      ) : (
                        <>
                          {active.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-3.5 h-3.5 text-amber-500" />
                                <span className="text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider">Active / Pending ({active.length})</span>
                              </div>
                              <div className="space-y-2">{active.map(issue => renderTicketCard(issue))}</div>
                            </div>
                          )}
                          {completed.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-2 mt-3">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider">Completed / Resolved ({completed.length})</span>
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
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-stone-900 dark:text-white">Clustered Reports</h3>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400">Multi-reporter grouped tickets with corroborated evidence from 2+ citizens</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {clusteredIssues.length}
                      </span>
                      {expandedSections.clustered ? <ChevronDown className="w-4 h-4 text-stone-400" /> : <ChevronRight className="w-4 h-4 text-stone-400" />}
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
                                <Clock className="w-3.5 h-3.5 text-amber-500" />
                                <span className="text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider">Active / Pending ({active.length})</span>
                              </div>
                              <div className="space-y-2">{active.map(issue => renderTicketCard(issue))}</div>
                            </div>
                          )}
                          {completed.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-2 mt-3">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider">Completed / Resolved ({completed.length})</span>
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
                      <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-stone-900 dark:text-white">Standard Reports</h3>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400">Normal single-reporter civic issue tickets</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                        {standardIssues.length}
                      </span>
                      {expandedSections.standard ? <ChevronDown className="w-4 h-4 text-stone-400" /> : <ChevronRight className="w-4 h-4 text-stone-400" />}
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
                                <Clock className="w-3.5 h-3.5 text-amber-500" />
                                <span className="text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider">Active / Pending ({active.length})</span>
                              </div>
                              <div className="space-y-2">{active.map(issue => renderTicketCard(issue))}</div>
                            </div>
                          )}
                          {completed.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-2 mt-3">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider">Completed / Resolved ({completed.length})</span>
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
        </div>

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
                  className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="max-h-[75vh] flex items-center justify-center bg-black rounded-xl overflow-hidden">
                <img
                  src={lightboxImage.url}
                  alt={lightboxImage.title}
                  className="max-h-[75vh] w-auto object-contain"
                />
              </div>

              <div className="text-center text-[11px] text-stone-400 pb-1">
                Official Geotagged Photographic Proof • Mysuru Municipal Digital Register
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
