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
  Wrench, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  ArrowLeft, 
  Camera, 
  AlertCircle, 
  PlayCircle, 
  Check, 
  Truck,
  Flame,
  X,
  Upload,
  AlertTriangle,
  Video,
  StopCircle,
  ShieldCheck,
  Info,
  Sparkles
} from 'lucide-react';

interface WorkerDeskProps {
  session: UserSession | null;
  issues: CivicIssue[];
  departments: DepartmentCapacity[];
  onUpdateStatus: (id: string, status: CivicIssue['status'], crew?: string) => void;
  onNavigateHome: () => void;
  onRefreshIssues?: () => void;
}

export const WorkerDesk: React.FC<WorkerDeskProps> = ({
  session,
  issues,
  onUpdateStatus,
  onNavigateHome,
}) => {
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [completionNotice, setCompletionNotice] = useState<string | null>(null);
  
  // Active resolving work order dialog
  const [activeResolvingIssue, setActiveResolvingIssue] = useState<CivicIssue | null>(null);
  const [pendingPhotoPreview, setPendingPhotoPreview] = useState<string | null>(null);
  
  // Gemini AI Verification states
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

  // Field Worker identity
  const workerName = session?.name || 'Manjunatha S.';
  const workerDepot = 'MCC Depot 3';
  const workerVehicle = session?.vehicle || 'Canter KA-09-G-4412';

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

  const activeTasks = deduplicatedIssues.filter((i) => i.status !== 'resolved');
  const completedTasks = deduplicatedIssues.filter((i) => i.status === 'resolved');

  // Trigger Completion Modal for task
  const handleInitiateCompletion = (task: CivicIssue) => {
    setActiveResolvingIssue(task);
    setPendingPhotoPreview(null);
    setResolutionError(null);
    setAiVerificationResult(null);
    setIsCameraActive(false);
  };

  // Trigger Gemini AI Multimodal verification on the uploaded or captured photo
  const triggerGeminiVerification = async (photoDataUrl: string, issue: CivicIssue) => {
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
      console.warn('Gemini verification execution error:', err);
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
      if (activeResolvingIssue) {
        triggerGeminiVerification(dataUrl, activeResolvingIssue);
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
        if (activeResolvingIssue) {
          triggerGeminiVerification(compressed, activeResolvingIssue);
        }
      } catch (err) {
        console.warn('Worker photo compression fallback:', err);
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          setPendingPhotoPreview(base64);
          setResolutionError(null);
          stopLiveCamera();
          if (activeResolvingIssue) {
            triggerGeminiVerification(base64, activeResolvingIssue);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Confirm completion with audit logic
  const handleConfirmResolution = async () => {
    if (!activeResolvingIssue) return;

    if (!pendingPhotoPreview) {
      setResolutionError('On-site photographic completion proof is compulsory. Please take or upload a photo.');
      return;
    }

    const ticketId = activeResolvingIssue.id;
    const ticketRef = activeResolvingIssue.trackingId || activeResolvingIssue.id;

    // Determine verification status:
    // If admin override is checked -> verified
    // If admin override is NOT checked -> follows Gemini AI verification verdict (or unverified if AI rejected/flagged)
    let isVerified = adminOverrideEnabled;
    let isFlagged = !adminOverrideEnabled;
    let auditNote = '';

    if (aiVerificationResult) {
      if (!adminOverrideEnabled) {
        isVerified = aiVerificationResult.isVerified;
        isFlagged = !aiVerificationResult.isVerified;
      }
      auditNote = `Gemini AI (${aiVerificationResult.confidence}% confidence): ${aiVerificationResult.detectedSubject}. ${aiVerificationResult.reason}${adminOverrideEnabled ? ' [Admin Override Active]' : ''}`;
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

    onUpdateStatus(ticketId, 'resolved', `${workerName} (${workerDepot})`);

    setActiveResolvingIssue(null);
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
    <div className="min-h-[calc(100vh-4rem)] bg-stone-100 dark:bg-stone-950 py-8 px-4 sm:px-6 lg:px-8 text-stone-900 dark:text-stone-100 transition-colors">
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

        {/* Work Order Completion Modal with Live Camera & Admin Override */}
        {activeResolvingIssue && (
          <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Camera className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-stone-950 dark:text-white">Complete Work Order</h3>
                    <p className="text-xs text-stone-500 font-mono">{activeResolvingIssue.trackingId || activeResolvingIssue.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActiveResolvingIssue(null);
                    setPendingPhotoPreview(null);
                    setAiVerificationResult(null);
                    stopLiveCamera();
                  }}
                  className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg"
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1.5 bg-stone-50 dark:bg-stone-800/50 p-3.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs">
                <div className="font-bold text-stone-900 dark:text-white">
                  {activeResolvingIssue.title}
                </div>
                <div className="text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  <span>{activeResolvingIssue.location}</span>
                </div>
              </div>

              {resolutionError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold">
                  {resolutionError}
                </div>
              )}

              {/* Photo Evidence Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-600" />
                    <span>On-Site Completion Photograph * (Compulsory)</span>
                  </label>
                  <span className="text-[10px] font-mono text-stone-400">Audit Proof</span>
                </div>

                {/* Explanatory note */}
                <div className="p-2.5 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200 dark:border-stone-700 flex items-start gap-2 text-[11px] text-stone-600 dark:text-stone-400">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    Capture on-site resolution evidence (e.g. cleared waste, repaired surface). Desktop file upload is enabled for workstation testing.
                  </span>
                </div>

                {/* Hidden File Input */}
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
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-stone-950 shadow-md active:scale-95"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Take Photo</span>
                      </button>
                      <button
                        type="button"
                        onClick={stopLiveCamera}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold bg-stone-800 text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {cameraError && (
                  <p className="text-xs text-amber-600">{cameraError}</p>
                )}

                {/* Photo Preview Card with Gemini AI Status */}
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
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                        >
                          Remove / Retake
                        </button>
                      </div>
                      <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-black/75 text-white text-[10px] font-mono flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Evidence Attached</span>
                      </div>
                    </div>

                    {/* Gemini AI Verification Feedback Display */}
                    {isVerifyingWithAI ? (
                      <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center gap-3 text-xs text-blue-900 dark:text-blue-200 animate-pulse">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
                        <div className="space-y-0.5">
                          <p className="font-bold flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span>Gemini AI Analyzing Resolution Photo...</span>
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
                              {aiVerificationResult.isVerified ? 'Gemini AI Verified' : 'Gemini AI Flagged for Audit'}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-normal">
                              {aiVerificationResult.confidence}% confidence
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => activeResolvingIssue && triggerGeminiVerification(pendingPhotoPreview, activeResolvingIssue)}
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
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                    >
                      <Video className="w-4 h-4" />
                      <span>Click Photo (Camera)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium text-stone-700 dark:text-stone-300 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700"
                    >
                      <Upload className="w-4 h-4 text-stone-500" />
                      <span>Upload Photo</span>
                    </button>
                  </div>
                )}
              </div>

              {/* ADMINISTRATIVE COMPLETION OVERRIDE (For testing & exceptions) */}
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
                      <strong>Mode: Strict AI Verification.</strong> If the photo contains an unverified subject (such as a human face/selfie instead of civic site debris), system flags the task as <em>Completed (Unverified - Flagged for Audit)</em>.
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => {
                    setActiveResolvingIssue(null);
                    setPendingPhotoPreview(null);
                    setAiVerificationResult(null);
                    stopLiveCamera();
                  }}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-complete-work"
                  type="button"
                  onClick={handleConfirmResolution}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-2 transition-all active:scale-98"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Completion</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Worker Desk Header */}
        <div className="bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-stone-950 dark:text-white">
                  Worker Desk
                </h1>
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-800">
                  Field Dispatch
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600 dark:text-stone-300 mt-1">
                <span>Field Operator:</span>
                <strong className="text-stone-950 dark:text-white">{workerName} ({workerDepot})</strong>
                <span>•</span>
                <span className="inline-flex items-center gap-1 font-mono font-semibold text-stone-800 dark:text-stone-200">
                  <Truck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Vehicle: {workerVehicle}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="worker-back-home"
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Portal Hub</span>
            </button>
          </div>
        </div>

        {/* Queue Switcher Tabs */}
        <div className="flex items-center justify-between gap-4 border-b border-stone-300 dark:border-stone-800 pb-2">
          <div className="flex items-center gap-2">
            <button
              id="tab-active-tasks"
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
                activeTab === 'active'
                  ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-950 shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white bg-stone-200/70 dark:bg-stone-800'
              }`}
            >
              <span>Active Work Orders</span>
              <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-amber-400 text-stone-950 font-extrabold">
                {activeTasks.length}
              </span>
            </button>

            <button
              id="tab-completed-tasks"
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
                activeTab === 'completed'
                  ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-950 shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white bg-stone-200/70 dark:bg-stone-800'
              }`}
            >
              <span>Resolved Log</span>
              <span className="text-[11px] opacity-75">({completedTasks.length})</span>
            </button>
          </div>

          <span className="text-xs font-medium text-stone-500 dark:text-stone-400 hidden sm:block">
            Field Execution Desk
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
                <h2 className="text-base font-bold text-stone-900 dark:text-white">Active Queue Cleared</h2>
                <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
                  All assigned municipal tasks in your queue have been completed. Check back when new dispatches arrive.
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
                    className={`bg-white dark:bg-stone-900 border-2 rounded-2xl p-6 shadow-sm transition-all ${
                      rank === 5
                        ? 'border-rose-400 dark:border-rose-900/90 bg-rose-50/20 dark:bg-rose-950/10'
                        : rank === 4
                        ? 'border-orange-300 dark:border-orange-900/80'
                        : rank === 3
                        ? 'border-amber-300 dark:border-amber-900/70'
                        : 'border-stone-200 dark:border-stone-800'
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
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border uppercase tracking-wider ${severityMeta.badgeClass}`}
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
                      <h2 className="text-lg font-bold text-stone-950 dark:text-white tracking-tight leading-snug">
                        {task.title}
                      </h2>
                      <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-normal">
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

                    {/* Footer: Operator Action Controls */}
                    <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Current State:</span>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full capitalize ${
                          isUnderway
                            ? 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200'
                            : 'bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-200'
                        }`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5">
                        {!isUnderway && (
                          <button
                            id={`btn-start-${task.id}`}
                            type="button"
                            onClick={() => onUpdateStatus(task.id, 'in_progress', `${workerName} (${workerDepot})`)}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-900 dark:text-white text-xs font-bold rounded-xl transition-colors"
                          >
                            <PlayCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span>Start Work</span>
                          </button>
                        )}

                        {/* "Mark Completed" Button */}
                        <button
                          id={`btn-complete-${task.id}`}
                          type="button"
                          onClick={() => handleInitiateCompletion(task)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold rounded-xl shadow-sm transition-all active:scale-[0.98]"
                        >
                          <Camera className="w-4 h-4 text-amber-300" />
                          <span>Mark Completed</span>
                        </button>
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
                    className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 opacity-95"
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
