import React, { useState, useRef, useEffect } from 'react';
import { CivicIssue, UserSession, DepartmentCapacity, SeverityRank } from '../types';
import { compressImage } from '../utils/imageCompressor';
import { 
  getPriorityScore, 
  resolveIssueWithProof,
  SEVERITY_LEVELS 
} from '../mockDatabase';
import { 
  verifyFieldWorkerProof, 
  isGeminiConfigured, 
  GeminiVerificationResult 
} from '../utils/geminiVerification';
import { 
  WrenchIcon as Wrench, 
  CheckCircleIcon as CheckCircle2, 
  ClockIcon as Clock, 
  MapPinIcon as MapPin, 
  ArrowLeftIcon as ArrowLeft, 
  CameraIcon as Camera, 
  ExclamationCircleIcon as AlertCircle, 
  PlayCircleIcon as PlayCircle, 
  CheckIcon as Check, 
  TruckIcon as Truck, 
  FireIcon as Flame, 
  XMarkIcon as X, 
  ArrowUpTrayIcon as Upload, 
  ExclamationTriangleIcon as AlertTriangle, 
  VideoCameraIcon as Video, 
  StopCircleIcon as StopCircle, 
  ShieldCheckIcon as ShieldCheck, 
  InformationCircleIcon as Info, 
  SparklesIcon as Sparkles, 
  ArrowTopRightOnSquareIcon as ExternalLink, 
  ChevronRightIcon as ChevronRight, 
  ClipboardDocumentIcon as Copy, 
  PaperAirplaneIcon as Navigation, 
  UserGroupIcon as Users 
} from '@heroicons/react/24/outline';
import { useLanguage } from '../context/LanguageContext';

interface WorkerDeskProps {
  session: UserSession | null;
  issues: CivicIssue[];
  departments: DepartmentCapacity[];
  onUpdateStatus: (id: string, status: CivicIssue['status'], crew?: string) => void;
  onNavigateHome: () => void;
  onRefreshIssues?: () => void;
  onSwitchWorker?: () => void;
}

export const WorkerDesk: React.FC<WorkerDeskProps> = ({
  session,
  issues,
  onUpdateStatus,
  onNavigateHome,
  onSwitchWorker,
}) => {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [completionNotice, setCompletionNotice] = useState<string | null>(null);
  
  // Dedicated Task Detail & Resolution Modal
  const [selectedDetailTask, setSelectedDetailTask] = useState<CivicIssue | null>(null);
  const [copiedTrackingId, setCopiedTrackingId] = useState<boolean>(false);
  const [pendingPhotoPreview, setPendingPhotoPreview] = useState<string | null>(null);
  
  // Civic Mesh AI Verification states
  const [isVerifyingWithAI, setIsVerifyingWithAI] = useState<boolean>(false);
  const [aiVerificationResult, setAiVerificationResult] = useState<GeminiVerificationResult | null>(null);

  // Administrative completion override toggle (for testing/verification bypass)
  const [adminOverrideEnabled, setAdminOverrideEnabled] = useState<boolean>(true);
  const [resolutionError, setResolutionError] = useState<string | null>(null);

  // Live Camera states
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Native camera/file input ref for desktop testing fallback
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Field Worker identity from session (dynamic roster login)
  const workerName = session?.name || 'Manjunatha S.';
  const workerJurisdictionName = session?.jurisdictionName || 'MCC Zone 3';
  const workerJurisdictionId = session?.jurisdictionId || 'mcc-zone-3';
  const workerRole = session?.workerRole || 'Field Operator';
  const workerVehicle = session?.vehicle || 'Canter KA-09-G-4412';

  // Helper: Open location in Google Maps
  const getGoogleMapsUrl = (task: CivicIssue) => {
    if (task.coordinates && typeof task.coordinates.lat === 'number' && typeof task.coordinates.lng === 'number') {
      return `https://www.google.com/maps/search/?api=1&query=${task.coordinates.lat},${task.coordinates.lng}`;
    }
    const query = `${task.location}, Mysuru, Karnataka, India`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  // Helper: Copy tracking ID
  const handleCopyTrackingId = (id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(id);
      setCopiedTrackingId(true);
      setTimeout(() => setCopiedTrackingId(false), 2000);
    }
  };

  // Stop camera stream safely
  const stopLiveCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setCameraError(null);
  };

  useEffect(() => {
    return () => {
      stopLiveCamera();
    };
  }, []);

  // Deduplicate queue: strictly one card per unique tracking ID / title
  const uniqueIssuesMap = new Map<string, CivicIssue>();
  issues.forEach((issue) => {
    const key = issue.id || issue.trackingId || `${issue.title}-${issue.location}`;
    if (!uniqueIssuesMap.has(key)) {
      uniqueIssuesMap.set(key, issue);
    }
  });
  const deduplicatedIssues = Array.from(uniqueIssuesMap.values());

  // Filter tasks strictly to the current worker's jurisdiction
  const myJurisdictionIssues = deduplicatedIssues.filter((i) => {
    if (!workerJurisdictionId) return true;
    if (i.assignedJurisdictionId === workerJurisdictionId) return true;
    if (i.targetJurisdictionId === workerJurisdictionId) return true;
    
    // Check if assignedCrewLead matches worker name
    if (i.assignedCrewLead && i.assignedCrewLead.toLowerCase().includes(workerName.toLowerCase())) return true;

    // Fallback checks for depot or location string matching
    const jurBase = workerJurisdictionName.split(' (')[0].trim().toLowerCase();
    if (i.assignedDepot && i.assignedDepot.toLowerCase().includes(jurBase)) return true;
    if (i.location && i.location.toLowerCase().includes(jurBase)) return true;
    return false;
  });

  const activeTasks = myJurisdictionIssues.filter(
    (i) => i.status !== 'resolved' && i.status !== 'quarantined' && !i.isQuarantined
  );
  const completedTasks = myJurisdictionIssues.filter(
    (i) => i.status === 'resolved' && !i.isQuarantined
  );

  // Trigger Task Detail View
  const handleOpenTaskDetail = (task: CivicIssue) => {
    setSelectedDetailTask(task);
    setPendingPhotoPreview(task.resolvedImageUrl || null);
    setResolutionError(null);
    setAiVerificationResult(null);
    stopLiveCamera();
  };

  // Close Task Detail View
  const handleCloseTaskDetail = () => {
    setSelectedDetailTask(null);
    setPendingPhotoPreview(null);
    setAiVerificationResult(null);
    setResolutionError(null);
    stopLiveCamera();
  };

  // Transition task into In Progress from inside Task Detail
  const handleStartWorkFromDetail = () => {
    if (!selectedDetailTask) return;
    onUpdateStatus(selectedDetailTask.id, 'in_progress', `${workerName} (${workerJurisdictionName})`);
    setSelectedDetailTask((prev) => (prev ? { ...prev, status: 'in_progress' } : null));
  };

  // Trigger Civic Mesh AI Multimodal verification on the uploaded or captured photo
  const triggerCivicMeshAiVerification = async (photoDataUrl: string, issue: CivicIssue) => {
    setIsVerifyingWithAI(true);
    setResolutionError(null);
    try {
      const result = await verifyFieldWorkerProof(photoDataUrl, {
        id: issue.id,
        trackingId: issue.trackingId,
        title: issue.title,
        category: issue.category,
        description: issue.description,
        location: issue.location,
      });
      setAiVerificationResult(result);
    } catch (err: any) {
      console.warn('Civic Mesh AI verification execution error:', err);
    } finally {
      setIsVerifyingWithAI(false);
    }
  };

  // Start live device camera stream
  const startLiveCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not accessible in this browser environment.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Could not start live camera in worker desk:', err);
      setCameraError('Camera stream unavailable. Please use "Upload Photo" below.');
      setTimeout(() => {
        fileInputRef.current?.click();
      }, 400);
    }
  };

  // Capture frame from active live video stream
  const captureFrameFromLiveVideo = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, width, height);

      // Add audit watermark
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, height - 36, width, 36);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(
        `WORKER COMPLETION AUDIT | ${workerName} | ${new Date().toLocaleString()}`,
        12,
        height - 14
      );

      const dataUrl = canvas.toDataURL('image/jpeg', 0.65);
      setPendingPhotoPreview(dataUrl);
      setResolutionError(null);
      stopLiveCamera();
      if (selectedDetailTask) {
        triggerCivicMeshAiVerification(dataUrl, selectedDetailTask);
      }
    }
  };

  // Handle file photo uploaded
  const handlePhotoUploaded = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 800, 600, 0.65);
        setPendingPhotoPreview(compressed);
        setResolutionError(null);
        stopLiveCamera();
        if (selectedDetailTask) {
          triggerCivicMeshAiVerification(compressed, selectedDetailTask);
        }
      } catch (err) {
        console.warn('Worker photo compression fallback:', err);
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          setPendingPhotoPreview(base64);
          setResolutionError(null);
          stopLiveCamera();
          if (selectedDetailTask) {
            triggerCivicMeshAiVerification(base64, selectedDetailTask);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Confirm completion with audit logic
  const handleConfirmResolution = async () => {
    if (!selectedDetailTask) return;

    if (!pendingPhotoPreview) {
      setResolutionError('On-site photographic completion proof is compulsory. Please take or upload a photo.');
      return;
    }

    const ticketId = selectedDetailTask.id;
    const ticketRef = selectedDetailTask.trackingId || selectedDetailTask.id;

    // Determine verification status:
    // If admin override is checked -> verified
    // If admin override is NOT checked -> follows Civic Mesh AI verification verdict (or unverified if AI rejected/flagged)
    let isVerified = adminOverrideEnabled;
    let isFlagged = !adminOverrideEnabled;
    let auditNote = '';

    if (aiVerificationResult) {
      if (!adminOverrideEnabled) {
        isVerified = aiVerificationResult.isVerified;
        isFlagged = !aiVerificationResult.isVerified;
      }
      auditNote = `Civic Mesh AI (${aiVerificationResult.confidence}% confidence): ${aiVerificationResult.detectedSubject}. ${aiVerificationResult.reason}${adminOverrideEnabled ? ' [Admin Override Active]' : ''}`;
    } else {
      auditNote = adminOverrideEnabled 
        ? 'Resolution verified via Administrative Override.' 
        : 'Resolution marked Unverified (Pending Supervisor Review).';
    }

    let finalProof = pendingPhotoPreview;
    if (finalProof && !finalProof.startsWith('data:image/svg') && finalProof.length > 50000) {
      finalProof = await compressImage(finalProof, 800, 600, 0.6);
    }

    resolveIssueWithProof(ticketId, finalProof, {
      isVerified,
      isFlagged,
      status: 'resolved',
      resolutionNotes: auditNote,
    });

    onUpdateStatus(ticketId, 'resolved', `${workerName} (${workerJurisdictionName})`);

    setSelectedDetailTask(null);
    setPendingPhotoPreview(null);
    setAiVerificationResult(null);
    stopLiveCamera();

    if (isVerified) {
      setCompletionNotice(`Work order ${ticketRef} marked completed and verified with on-site visual audit proof.`);
    } else {
      setCompletionNotice(`Work order ${ticketRef} marked completed, but flagged as Unverified (${aiVerificationResult?.reason || 'Subject Mismatch / Face Detected'}). Flagged for supervisor audit.`);
    }

    setTimeout(() => setCompletionNotice(null), 6000);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f8f9fa] dark:bg-[#09090b] py-8 px-4 sm:px-6 lg:px-8 text-stone-900 dark:text-stone-100 transition-colors">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Completion Toast Notification */}
        {completionNotice && (
          <div
            id="worker-resolution-notice"
            className="p-4 rounded-xl shadow-md border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-white text-xs font-semibold flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-3"
          >
            <div className="flex items-center gap-2.5">
              {completionNotice.includes('Unverified') ? (
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              )}
              <span>{completionNotice}</span>
            </div>
            <button
              onClick={() => setCompletionNotice(null)}
              className="p-1 hover:opacity-75"
              aria-label="Close notice"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Dedicated Task Detail View (Full Modal with Citizen Workflow Data & Integrated Resolution Flow) */}
        {selectedDetailTask && (() => {
          const rank = (selectedDetailTask.severityRank || getPriorityScore(selectedDetailTask.category)) as SeverityRank;
          const severityMeta = SEVERITY_LEVELS[rank] || SEVERITY_LEVELS[3];
          const isUnderway = selectedDetailTask.status === 'in_progress';
          const isResolved = selectedDetailTask.status === 'resolved';

          return (
            <div 
              id="task-detail-modal-backdrop" 
              className="fixed inset-0 z-[50] w-screen h-[100dvh] overflow-hidden backdrop-blur-sm bg-stone-950/80 flex items-center justify-center p-3 sm:p-4"
            >
              <div 
                id="task-detail-card" 
                className="bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-800 rounded-2xl max-w-2xl w-full shadow-2xl space-y-0 animate-in zoom-in-95 max-h-[92vh] flex flex-col overflow-hidden"
              >
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-800/40 flex items-start justify-between gap-3 shrink-0">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-stone-900 dark:text-stone-100 bg-stone-200/80 dark:bg-stone-800 px-2.5 py-0.5 rounded flex items-center gap-1.5">
                        <span>{selectedDetailTask.trackingId || selectedDetailTask.id}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyTrackingId(selectedDetailTask.trackingId || selectedDetailTask.id)}
                          className="text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors cursor-pointer"
                          title="Copy Tracking ID"
                        >
                          {copiedTrackingId ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700">
                        {selectedDetailTask.category}
                      </span>
                      {selectedDetailTask.isBufferZone && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          Buffer Zone
                        </span>
                      )}
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-extrabold border uppercase tracking-wider ${severityMeta.badgeClass}`}>
                        <span className={`w-2 h-2 rounded-full ${severityMeta.dotColor}`} />
                        <span>Rank {rank} • {severityMeta.name}</span>
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-stone-950 dark:text-white leading-snug">
                      {selectedDetailTask.title}
                    </h3>
                  </div>

                  <button
                    id="btn-close-task-detail"
                    type="button"
                    onClick={handleCloseTaskDetail}
                    className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors shrink-0 cursor-pointer"
                    aria-label="Close task details"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Scrollable Content Body */}
                <div className="overflow-y-auto p-5 sm:p-6 space-y-6 flex-1">
                  
                  {/* Grievance Description & Meta Grid */}
                  <div className="space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                      Grievance Details &amp; Citizen Context
                    </div>
                    <div className="p-3.5 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                      {selectedDetailTask.description}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div className="p-2.5 rounded-lg bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/80">
                        <span className="text-stone-500 dark:text-stone-400 block text-[11px]">Reported By</span>
                        <strong className="text-stone-900 dark:text-white">{selectedDetailTask.reportedBy || 'Resident Citizen'}</strong>
                      </div>
                      <div className="p-2.5 rounded-lg bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/80">
                        <span className="text-stone-500 dark:text-stone-400 block text-[11px]">Logged Timestamp</span>
                        <strong className="text-stone-900 dark:text-white">{selectedDetailTask.reportedAt}</strong>
                      </div>
                      <div className="p-2.5 rounded-lg bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/80">
                        <span className="text-stone-500 dark:text-stone-400 block text-[11px]">Jurisdiction / Depot</span>
                        <strong className="text-stone-900 dark:text-white">{selectedDetailTask.assignedDepot || (selectedDetailTask.isBufferZone ? 'Buffer Zone Area' : 'MCC Jurisdiction')}</strong>
                      </div>
                      <div className="p-2.5 rounded-lg bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/80">
                        <span className="text-stone-500 dark:text-stone-400 block text-[11px]">Assigned Vehicle / Crew</span>
                        <strong className="text-stone-900 dark:text-white font-mono">{selectedDetailTask.assignedVehicle || workerVehicle}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Location & Google Maps Integration */}
                  <div className="p-4 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span>Incident Site Location</span>
                      </div>
                      <p className="text-xs sm:text-sm text-stone-800 dark:text-stone-200 font-medium">
                        {selectedDetailTask.location}
                      </p>
                    </div>
                    <a
                      id="btn-open-google-maps"
                      href={getGoogleMapsUrl(selectedDetailTask)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors shrink-0"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>Open Location in Google Maps</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                    </a>
                  </div>

                  {/* Original Citizen Photographic Evidence */}
                  {(() => {
                    const taskImages = (selectedDetailTask.images && selectedDetailTask.images.length > 0)
                      ? selectedDetailTask.images
                      : (selectedDetailTask.imageUrl ? [selectedDetailTask.imageUrl] : []);

                    return (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                            <Camera className="w-4 h-4 text-stone-600 dark:text-stone-400" />
                            <span>Original Citizen Photographic Evidence ({taskImages.length})</span>
                          </span>
                          <span className="text-[10px] font-mono text-stone-400">Citizen Submission</span>
                        </div>
                        {taskImages.length > 0 ? (
                          <div className="space-y-2">
                            <div className="relative rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-950 max-h-60">
                              <img
                                src={taskImages[0]}
                                alt="Original citizen evidence"
                                className="w-full h-52 object-cover"
                              />
                              <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-black/75 text-white text-[10px] font-mono flex items-center gap-1">
                                <span>Primary Grievance Photographic Record</span>
                              </div>
                            </div>
                            {taskImages.length > 1 && (
                              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                {taskImages.map((img, idx) => (
                                  <div
                                    key={idx}
                                    className="shrink-0 w-20 h-14 rounded-lg overflow-hidden border border-stone-300 dark:border-stone-700 relative"
                                  >
                                    <img src={img} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
                                    <span className="absolute bottom-0.5 right-0.5 text-[8px] font-bold px-1 rounded bg-black/70 text-white">
                                      #{idx + 1}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 text-center text-xs text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-800/30">
                            No photographic evidence was attached by the citizen during initial submission.
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Status Timeline */}
                  <div className="space-y-2.5">
                    <div className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                      Lifecycle Status Timeline
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {/* Step 1: Reported */}
                      <div className="space-y-1">
                        <div className="h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block">1. Reported</span>
                      </div>
                      {/* Step 2: Dispatched */}
                      <div className="space-y-1">
                        <div className={`h-1.5 rounded-full ${selectedDetailTask.status !== 'reported' ? 'bg-emerald-500' : 'bg-stone-200 dark:bg-stone-700'}`} />
                        <span className={`text-[10px] font-bold block ${selectedDetailTask.status !== 'reported' ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-400'}`}>2. Dispatched</span>
                      </div>
                      {/* Step 3: In Progress */}
                      <div className="space-y-1">
                        <div className={`h-1.5 rounded-full ${isUnderway || isResolved ? 'bg-blue-500' : 'bg-stone-200 dark:bg-stone-700'}`} />
                        <span className={`text-[10px] font-bold block ${isUnderway ? 'text-blue-600 dark:text-blue-400' : isResolved ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-400'}`}>3. In Progress</span>
                      </div>
                      {/* Step 4: AI Verified */}
                      <div className="space-y-1">
                        <div className={`h-1.5 rounded-full ${isResolved ? 'bg-emerald-500' : 'bg-stone-200 dark:bg-stone-700'}`} />
                        <span className={`text-[10px] font-bold block ${isResolved ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-400'}`}>4. AI Verified</span>
                      </div>
                    </div>
                  </div>

                  {/* ACTION FLOW: State-driven in-screen controls */}
                  <div className="pt-2 border-t border-stone-200 dark:border-stone-800 space-y-4">
                    {resolutionError && (
                      <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold">
                        {resolutionError}
                      </div>
                    )}

                    {/* State 1: Task Not Yet Started */}
                    {!isUnderway && !isResolved && (
                      <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-blue-950 dark:text-blue-200">Ready to begin resolution?</h4>
                          <p className="text-[11px] text-blue-800 dark:text-blue-300">
                            Click Start Task to transition this work order into active execution and reveal resolution proof controls.
                          </p>
                        </div>
                        <button
                          id="btn-detail-start-task"
                          type="button"
                          onClick={handleStartWorkFromDetail}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                        >
                          <PlayCircle className="w-4 h-4" />
                          <span>{lang === 'kn' ? 'ಕೆಲಸ ಪ್ರಾರಂಭಿಸಿ' : 'Start Task'}</span>
                        </button>
                      </div>
                    )}

                    {/* State 2: Task In Progress -> Resolution Proof Capture */}
                    {isUnderway && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                            <Camera className="w-4 h-4 text-emerald-600" />
                            <span>On-Site Completion Photograph * (Compulsory)</span>
                          </label>
                          <span className="text-[10px] font-mono text-stone-400">Resolution Audit Proof</span>
                        </div>

                        {/* Explanatory note */}
                        <div className="p-2.5 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200 dark:border-stone-700 flex items-start gap-2 text-[11px] text-stone-600 dark:text-stone-400">
                          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          <span>
                            Capture on-site resolution evidence (e.g. cleared waste, repaired surface). Desktop file upload is enabled for workstation testing.
                          </span>
                        </div>

                        {/* Hidden File Input & Canvas */}
                        <input
                          ref={fileInputRef}
                          id="worker-photo-input"
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handlePhotoUploaded}
                          className="hidden"
                        />
                        <canvas ref={canvasRef} className="hidden" />

                        {/* Live Camera Viewfinder */}
                        {isCameraActive && (
                          <div className="relative rounded-xl overflow-hidden bg-black border-2 border-emerald-500 shadow-md">
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted
                              className="w-full h-56 object-cover"
                            />
                            <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 to-transparent flex items-center justify-center gap-3">
                              <button
                                type="button"
                                onClick={captureFrameFromLiveVideo}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-stone-950 shadow-md active:scale-95 cursor-pointer"
                              >
                                <Camera className="w-4 h-4" />
                                <span>Take Photo</span>
                              </button>
                              <button
                                type="button"
                                onClick={stopLiveCamera}
                                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-800 text-white cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {cameraError && (
                          <p className="text-xs text-amber-600">{cameraError}</p>
                        )}

                        {/* Photo Preview Card with Civic Mesh AI Status */}
                        {pendingPhotoPreview ? (
                          <div className="space-y-3">
                            <div className="relative rounded-xl overflow-hidden border-2 border-emerald-500/50 max-h-52 bg-stone-950 group">
                              <img
                                src={pendingPhotoPreview}
                                alt="Work completed evidence"
                                className="w-full h-48 object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPendingPhotoPreview(null);
                                    setAiVerificationResult(null);
                                  }}
                                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
                                >
                                  Remove / Retake
                                </button>
                              </div>
                              <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-black/75 text-white text-[10px] font-mono flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Evidence Attached</span>
                              </div>
                            </div>

                            {/* Civic Mesh AI Verification Feedback Display */}
                            {isVerifyingWithAI ? (
                              <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center gap-3 text-xs text-blue-900 dark:text-blue-200 animate-pulse">
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
                                <div className="space-y-0.5">
                                  <p className="font-bold flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                    <span>Civic Mesh AI Analyzing Resolution Photo...</span>
                                  </p>
                                  <p className="text-[11px] text-blue-700 dark:text-blue-300">
                                    Auditing civic scene authenticity and verifying category resolution proof.
                                  </p>
                                </div>
                              </div>
                            ) : aiVerificationResult ? (
                              <div className={`p-3.5 rounded-xl border space-y-1.5 text-xs ${
                                aiVerificationResult.isVerified
                                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100'
                                  : 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-100'
                              }`}>
                                <div className="flex items-center justify-between">
                                  <span className="font-bold flex items-center gap-1.5">
                                    {aiVerificationResult.isVerified ? (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    ) : (
                                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                                    )}
                                    <span>
                                      {aiVerificationResult.isVerified ? 'Civic Mesh AI Verified' : 'Civic Mesh AI Flagged for Audit'}
                                    </span>
                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-normal">
                                      {aiVerificationResult.confidence}% confidence
                                    </span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => selectedDetailTask && triggerCivicMeshAiVerification(pendingPhotoPreview, selectedDetailTask)}
                                    className="text-[10px] font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                                    title="Re-run verification"
                                  >
                                    <Sparkles className="w-3 h-3" />
                                    <span>Re-run</span>
                                  </button>
                                </div>
                                <p className="text-[11px]">
                                  <strong>Subject:</strong> {aiVerificationResult.detectedSubject}
                                </p>
                                <p className="text-[11px] opacity-90">
                                  {aiVerificationResult.reason}
                                </p>
                                {!aiVerificationResult.isVerified && (
                                  <p className="text-[10px] text-amber-800 dark:text-amber-300/90 pt-1 border-t border-amber-200 dark:border-amber-800/60 font-medium">
                                    * Task will be recorded as <em>Completed (Unverified)</em> and forwarded to supervisors, unless Administrative Override is enabled below.
                                  </p>
                                )}
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2.5">
                            <button
                              type="button"
                              onClick={startLiveCamera}
                              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                            >
                              <Video className="w-4 h-4" />
                              <span>Click Photo (Camera)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium text-stone-700 dark:text-stone-300 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 cursor-pointer"
                            >
                              <Upload className="w-4 h-4 text-stone-500" />
                              <span>Upload Photo</span>
                            </button>
                          </div>
                        )}

                        {/* ADMINISTRATIVE COMPLETION OVERRIDE */}
                        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl space-y-1.5">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              id="worker-admin-override-toggle"
                              checked={adminOverrideEnabled}
                              onChange={(e) => setAdminOverrideEnabled(e.target.checked)}
                              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-xs font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                              <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                              <span>Administrative Completion (Force Verified Mode)</span>
                            </span>
                          </label>
                          <p className="text-[11px] text-amber-900 dark:text-amber-300 pl-6 leading-tight">
                            {adminOverrideEnabled ? (
                              <span>
                                <strong>Mode: Override Active.</strong> Resolution will be marked as <em>Verified &amp; Completed</em> regardless of image subject matter (enabled for testing).
                              </span>
                            ) : (
                              <span>
                                <strong>Mode: Strict AI Verification.</strong> If the photo contains an unverified subject (such as an unrelated photo or selfie), system flags the task as <em>Completed (Unverified - Flagged for Audit)</em>.
                              </span>
                            )}
                          </p>
                        </div>

                        {/* Action Buttons inside In Progress */}
                        <div className="flex items-center justify-end gap-3 pt-2">
                          <button
                            type="button"
                            onClick={handleCloseTaskDetail}
                            className="px-4 py-2 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white cursor-pointer"
                          >
                            Close
                          </button>
                          <button
                            id="btn-confirm-complete-work"
                            type="button"
                            onClick={handleConfirmResolution}
                            className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-2 transition-all active:scale-98 cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{lang === 'kn' ? 'ಪೂರ್ಣಗೊಳಿಸುವಿಕೆಯನ್ನು ಸಲ್ಲಿಸಿ' : 'Submit Completion'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* State 3: Task Already Resolved */}
                    {isResolved && (
                      <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 space-y-3">
                        <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 text-xs font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>
                            {lang === 'kn'
                              ? 'ಈ ಕಾರ್ಯ ಆದೇಶವು ಪೂರ್ಣಗೊಂಡಿದೆ ಮತ್ತು ಪುರಸಭೆಯ ದಾಖಲೆಗಳಲ್ಲಿ ದಾಖಲಾಗಿದೆ.'
                              : 'This work order has been completed and logged in municipal records.'}
                          </span>
                        </div>
                        {selectedDetailTask.resolvedImageUrl && (
                          <div className="rounded-xl overflow-hidden border border-emerald-300/60 max-h-48">
                            <img
                              src={selectedDetailTask.resolvedImageUrl}
                              alt="Resolution proof"
                              className="w-full h-40 object-cover"
                            />
                          </div>
                        )}
                        {selectedDetailTask.resolutionNotes && (
                          <p className="text-xs text-stone-600 dark:text-stone-300 font-mono bg-white/60 dark:bg-stone-900/60 p-2.5 rounded-lg border border-stone-200 dark:border-stone-800">
                            {selectedDetailTask.resolutionNotes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>
          );
        })()}

        {/* Worker Desk Header */}
        <div className="bg-white dark:bg-[#121214] border border-stone-200/80 dark:border-stone-800 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-stone-950 dark:text-white font-display">
                  {lang === 'kn' ? 'ಕಾರ್ಮಿಕ ಪೋರ್ಟಲ್' : 'Worker Desk'}
                </h1>
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-800">
                  {workerJurisdictionName}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600 dark:text-stone-300 mt-1">
                <span>{lang === 'kn' ? 'ಕ್ಷೇತ್ರ ನಿರ್ವಾಹಕ:' : 'Field Operator:'}</span>
                <strong className="text-stone-950 dark:text-white">{workerName} ({workerRole})</strong>
                <span>•</span>
                <span className="inline-flex items-center gap-1 font-mono font-semibold text-stone-800 dark:text-stone-200">
                  <Truck className="w-3.5 h-3.5 text-blue-600" />
                  <span>{lang === 'kn' ? 'ವಾಹನ:' : 'Vehicle:'} {workerVehicle}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onSwitchWorker && (
              <button
                id="worker-switch-profile"
                type="button"
                onClick={onSwitchWorker}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 rounded-xl transition-colors cursor-pointer"
                title="Switch to another jurisdiction worker profile"
              >
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>{lang === 'kn' ? 'ಕಾರ್ಮಿಕರನ್ನು ಬದಲಾಯಿಸಿ' : 'Switch Worker'}</span>
              </button>
            )}
            <button
              id="worker-back-home"
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 rounded-xl transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{lang === 'kn' ? 'ಪೋರ್ಟಲ್ ಹಬ್' : 'Portal Hub'}</span>
            </button>
          </div>
        </div>

        {/* Queue Switcher Tabs */}
        <div className="flex items-center justify-between gap-4 border-b border-stone-300 dark:border-stone-800 pb-2">
          <div className="flex items-center gap-2">
            <button
              id="tab-active-tasks"
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'active'
                  ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-950 shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white bg-stone-200/70 dark:bg-stone-800'
              }`}
            >
              <span>{lang === 'kn' ? 'ಸಕ್ರಿಯ ಕಾರ್ಯಗಳು' : 'Active Work Orders'}</span>
              <span className="px-1.5 py-0.5 rounded-md text-[11px] bg-amber-400 text-stone-950 font-extrabold">
                {activeTasks.length}
              </span>
            </button>

            <button
              id="tab-completed-tasks"
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'completed'
                  ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-950 shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white bg-stone-200/70 dark:bg-stone-800'
              }`}
            >
              <span>{lang === 'kn' ? 'ಪರಿಹರಿಸಲಾಗಿದೆ' : 'Resolved Log'}</span>
              <span className="text-[11px] opacity-75">({completedTasks.length})</span>
            </button>
          </div>

          <span className="text-xs font-medium text-stone-500 dark:text-stone-400 hidden sm:block">
            {lang === 'kn' ? 'ಕ್ಷೇತ್ರ ನಿರ್ವಹಣಾ ಡೆಸ್ಕ್' : 'Field Execution Desk'}
          </span>
        </div>

        {/* Active Tasks Queue */}
        {activeTab === 'active' && (
          <div className="space-y-4">
            {activeTasks.length === 0 ? (
              <div className="bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-800 rounded-2xl p-12 text-center space-y-3 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 mx-auto flex items-center justify-center">
                  <Check className="w-6 h-6" />
                </div>
                <h2 className="text-base font-bold text-stone-900 dark:text-white">
                  {lang === 'kn' ? 'ಎಲ್ಲಾ ಸಕ್ರಿಯ ಕಾರ್ಯಗಳು ಪೂರ್ಣಗೊಂಡಿವೆ' : 'Active Queue Cleared'}
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
                  {lang === 'kn'
                    ? `ನಿಮ್ಮ ಸರದಿಯಲ್ಲಿ ನಿಯೋಜಿಸಲಾದ ಎಲ್ಲಾ ಪುರಸಭೆಯ ಕಾರ್ಯಗಳು (${workerJurisdictionName}) ಪೂರ್ಣಗೊಂಡಿವೆ.`
                    : `All assigned municipal tasks in your queue (${workerJurisdictionName}) have been completed. Check back when new dispatches arrive or switch worker profiles.`}
                </p>
              </div>
            ) : (
              activeTasks.map((task) => {
                const rank = (task.severityRank || getPriorityScore(task.category)) as SeverityRank;
                const severityMeta = SEVERITY_LEVELS[rank] || SEVERITY_LEVELS[3];
                const isUnderway = task.status === 'in_progress';

                return (
                  <div
                    key={task.id}
                    id={`task-card-${task.id}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleOpenTaskDetail(task)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleOpenTaskDetail(task);
                      }
                    }}
                    className={`bg-white dark:bg-[#121214] border rounded-2xl p-6 shadow-xs cursor-pointer group hover:shadow-sm transition-all select-none ${
                      rank === 5
                        ? 'border-rose-300 dark:border-rose-900/90 bg-rose-50/20 dark:bg-rose-950/10 hover:border-rose-400'
                        : rank === 4
                        ? 'border-orange-300 dark:border-orange-900/80 hover:border-orange-400'
                        : rank === 3
                        ? 'border-amber-300 dark:border-amber-900/70 hover:border-amber-400'
                        : 'border-stone-200/80 dark:border-stone-800 hover:border-blue-500 dark:hover:border-blue-500'
                    }`}
                  >
                    {/* Header: Ticket ID & Severity */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100 dark:border-stone-800">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-stone-950 dark:text-white bg-stone-100 dark:bg-stone-800 px-2.5 py-0.5 rounded">
                          {task.trackingId || task.id}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200">
                          {task.category}
                        </span>
                        {task.isBufferZone && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            Buffer Zone
                          </span>
                        )}
                      </div>

                      {/* Severity Badge */}
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-extrabold border uppercase tracking-wider ${severityMeta.badgeClass}`}
                        >
                          {rank === 5 && <Flame className="w-3.5 h-3.5 text-rose-600 animate-pulse" />}
                          {rank === 4 && <AlertCircle className="w-3.5 h-3.5 text-orange-600" />}
                          <span className={`w-2 h-2 rounded-full ${severityMeta.dotColor}`} />
                          <span>Rank {rank} • {severityMeta.name}</span>
                        </span>
                      </div>
                    </div>

                    {/* Body: Title & Incident Details */}
                    <div className="py-4 space-y-2">
                      <h2 className="text-lg font-bold text-stone-950 dark:text-white tracking-tight leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors font-display">
                        {task.title}
                      </h2>
                      <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-normal line-clamp-2">
                        {task.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600 dark:text-stone-400 pt-2">
                        <span className="flex items-center gap-1.5 font-semibold text-stone-800 dark:text-stone-200">
                          <MapPin className="w-4 h-4 text-stone-500 shrink-0" />
                          <span>{task.location}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-stone-400" />
                          <span>Logged: {task.reportedAt}</span>
                        </span>
                        <span>•</span>
                        <span>Assigned Vehicle: <strong className="font-mono text-stone-800 dark:text-stone-200">{task.assignedVehicle || workerVehicle}</strong></span>
                      </div>
                    </div>

                    {/* Footer: Status and Detail Navigation Callout */}
                    <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Current State:</span>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md capitalize ${
                          isUnderway
                            ? 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200'
                            : 'bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-200'
                        }`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
                        <span>{lang === 'kn' ? 'ಕಾರ್ಯ ವಿವರಗಳನ್ನು ನೋಡಿ' : 'View Task Details & Actions'}</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Resolved Tasks Log View */}
        {activeTab === 'completed' && (
          <div className="space-y-3">
            {completedTasks.length === 0 ? (
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-8 text-center text-xs text-stone-500">
                No resolved incidents recorded in this session yet.
              </div>
            ) : (
              completedTasks.map((task) => {
                const isFlagged = task.isFlagged || task.verificationStatus === 'flagged_unverified';

                return (
                  <div
                    key={task.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleOpenTaskDetail(task)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleOpenTaskDetail(task);
                      }
                    }}
                    className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 opacity-95 hover:border-emerald-400 dark:hover:border-emerald-600 cursor-pointer transition-all select-none"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-stone-500 dark:text-stone-400">
                          {task.trackingId || task.id}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                          {task.category}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600">
                          Rank {task.severityRank || getPriorityScore(task.category)}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                        {task.title}
                      </h3>
                      <p className="text-xs text-stone-500 dark:text-stone-400">{task.location}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                      {task.resolvedImageUrl && (
                        <div className="w-14 h-11 rounded-lg overflow-hidden border border-stone-200 dark:border-stone-700 shrink-0">
                          <img src={task.resolvedImageUrl} alt="Resolution proof" className="w-full h-full object-cover" />
                        </div>
                      )}

                      {isFlagged ? (
                        <div className="space-y-1 sm:text-right max-w-xs">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 rounded-lg text-xs font-bold">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Completed (Unverified - Flagged for Audit)</span>
                          </span>
                          <span className="block text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                            {task.resolutionNotes || 'AI audit: Face or non-civic scene detected. Flagged for review.'}
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-1 sm:text-right max-w-xs">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Verified &amp; Completed</span>
                          </span>
                          {task.resolutionNotes && (
                            <span className="block text-[10px] text-stone-600 dark:text-stone-400 font-medium line-clamp-2" title={task.resolutionNotes}>
                              {task.resolutionNotes}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

      </div>
    </div>
  );
};
