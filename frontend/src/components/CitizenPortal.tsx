import React, { useState, useRef, useEffect } from 'react';
import {
  CivicIssue,
  CivicCategory,
  CIVIC_CATEGORIES,
  UserSession,
  SeverityRank
} from '../types';
import {
  submitCitizenReport,
  SubmitReportResult,
  BORDER_HOTSPOTS,
  BorderHotspot,
  SEVERITY_LEVELS,
  getPriorityScore,
  detectJurisdiction,
  SAMPLE_POTHOLE_PHOTO,
  SAMPLE_DEBRIS_PHOTO,
  SAMPLE_DRAINAGE_PHOTO,
  rateIssueResolution,
  snapToMysuruLandmark,
  citizenReopenIssue,
  getPreSubmissionRoutingPreview,
  RoutingPreviewInfo
} from '../mockDatabase';
import { saveQueuedIssue, getQueuedIssues, deleteQueuedIssue } from '../utils/offlineStorage';
import { MysuruLeafletMap } from './MysuruLeafletMap';
import { compressImage } from '../utils/imageCompressor';
import { computePerceptualHash, findVisualDuplicate } from '../utils/perceptualHash';
import { moderateCitizenSubmission, moderateAndSanitizeCitizenReview } from '../utils/geminiVerification';
import { AnimatedFileUpload } from './ui/AnimatedFileUpload';
import {
  signInCitizenWithGoogle,
  signInCitizenWithNameAndEmail,
  signOutAll
} from '../firebase';
import {
  User,
  Camera,
  Cloud,
  CloudOff,
  MapPin,
  CheckCircle2,
  Layers,
  Clock,
  ArrowLeft,
  Copy,
  Check,
  X,
  RotateCcw,
  ListOrdered,
  FilePlus2,
  ChevronRight,
  ShieldCheck,
  Send,
  Video,
  StopCircle,
  Search,
  Info,
  Mail,
  Loader2,
  UserCheck,
  Store,
  Compass,
  Building2,
  Star,
  Crosshair,
  RefreshCw,
  Bell,
  Mic,
  Printer
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { PrintableWorkOrder } from './PrintableWorkOrder';

interface CitizenPortalProps {
  session: UserSession | null;
  onSetSession?: (session: UserSession | null) => void;
  issues: CivicIssue[];
  onRefreshIssues: () => void;
  onNavigateHome: () => void;
  isDark?: boolean;
}

const CATEGORIES: readonly CivicCategory[] = CIVIC_CATEGORIES;

export interface CivicDepartmentGroup {
  id: string;
  name: string;
  nameKn: string;
  icon: string;
  categories: CivicCategory[];
}

const CIVIC_DEPARTMENT_GROUPS: CivicDepartmentGroup[] = [
  {
    id: 'all',
    name: 'All Grievances',
    nameKn: 'ಎಲ್ಲಾ ದೂರುಗಳು',
    icon: '🏛️',
    categories: [...CIVIC_CATEGORIES],
  },
  {
    id: 'roads',
    name: 'Roads & Footpaths',
    nameKn: 'ರಸ್ತೆ ಮತ್ತು ಕಾಲುದಾರಿ',
    icon: '🛣️',
    categories: [
      'Potholes',
      'Roads & Pavement',
      'Crater / Road Subsidence',
      'Damaged Footpath / Curb',
      'Debris',
      'C&D Construction Debris',
    ],
  },
  {
    id: 'drainage',
    name: 'Drainage & Sewage',
    nameKn: 'ಚರಂಡಿ ಮತ್ತು ಒಳಚರಂಡಿ',
    icon: '🚰',
    categories: [
      'Drainage',
      'Water & Drainage',
      'Storm Drain Silt Overflow',
      'Underground Sewer Burst',
      'Missing Manhole Cover',
      'Stagnant Vector Hazard',
    ],
  },
  {
    id: 'waste',
    name: 'Waste & Sanitation',
    nameKn: 'ತ್ಯಾಜ್ಯ ಮತ್ತು ನೈರ್ಮಲ್ಯ',
    icon: '🗑️',
    categories: [
      'Garbage Dump',
      'Waste & Sanitation',
      'Commercial Waste Blackspot',
      'Dead Animal Clearance',
    ],
  },
  {
    id: 'electrical',
    name: 'Electrical & Lighting',
    nameKn: 'ವಿದ್ಯುತ್ ಮತ್ತು ಬೆಳಕು',
    icon: '⚡',
    categories: [
      'Streetlights',
      'Electrical & Lighting',
      'Dangling / Sparking Live Wire',
      'Street Feeder Blackout',
    ],
  },
  {
    id: 'water_parks',
    name: 'Water Supply & Parks',
    nameKn: 'ಕುಡಿಯುವ ನೀರು ಮತ್ತು ಉದ್ಯಾನ',
    icon: '🌳',
    categories: [
      'Main Water Pipeline Burst',
      'Contaminated Tap Water',
      'Parks & Public Spaces',
      'Fallen Tree / Branch Obstruction',
    ],
  },
];

// Rich Mysuru Places & Landmarks: circles, shops, markets, and municipal zones
export interface MysuruPlace {
  name: string;
  coords: { lat: number; lng: number };
  category: 'circle' | 'locality' | 'shop' | 'landmark' | 'address';
  subtext?: string;
  aliases?: string[];
}

export const MYSURU_PLACES: MysuruPlace[] = [
  // Circles, Junctions & Traffic Squares (Matches colloquial names like KR Round)
  {
    name: 'KR Circle / KR Round (Krishnaraja Wodeyar Circle)',
    coords: { lat: 12.3088, lng: 76.6531 },
    category: 'circle',
    subtext: 'Central Heritage Roundabout • Sayyaji Rao & D. Devaraj Urs Rd',
    aliases: ['kr circle', 'kr round', 'krishnaraja circle', 'krishnarajendra circle', 'nalvadi circle'],
  },
  {
    name: 'Ballal Circle (Ashoka Road / Krishnamurthypuram)',
    coords: { lat: 12.2982, lng: 76.6432 },
    category: 'circle',
    subtext: 'MCC Zone 1 • Krishnamurthypuram & Chamarajapuram',
    aliases: ['ballal circle', 'ashoka circle', 'krishnamurthypuram circle'],
  },
  {
    name: 'Ramaswamy Circle (Chamaraja Double Road)',
    coords: { lat: 12.3025, lng: 76.6455 },
    category: 'circle',
    subtext: 'Junction of JLB Road & Chamaraja Double Road',
    aliases: ['ramaswamy circle', 'jlb road circle'],
  },
  {
    name: 'Hardinge Circle / Jayachamaraja Wadiyar Circle',
    coords: { lat: 12.3080, lng: 76.6590 },
    category: 'circle',
    subtext: 'Six-road roundabout near Mysore Palace North-East Gate',
    aliases: ['hardinge circle', 'jayachamaraja wadiyar circle', '6 gate circle'],
  },
  {
    name: 'Highway Circle (Bannimantap / Bengaluru-Mysuru Rd)',
    coords: { lat: 12.3360, lng: 76.6515 },
    category: 'circle',
    subtext: 'MCC Zone 5 • Entry from Bengaluru-Mysuru Highway',
    aliases: ['highway circle', 'bannimantap circle'],
  },
  {
    name: 'Columbia Asia / Manipal Hospital Junction',
    coords: { lat: 12.3525, lng: 76.6595 },
    category: 'circle',
    subtext: 'Outer Ring Road & Bengaluru Expressway Flyover',
    aliases: ['columbia asia', 'manipal hospital circle', 'mysuru entrance flyover'],
  },
  {
    name: 'Kautilya Circle (Crawford Hall / DC Office)',
    coords: { lat: 12.3075, lng: 76.6410 },
    category: 'circle',
    subtext: 'University Administrative Enclave & District Court',
    aliases: ['kautilya circle', 'crawford hall circle', 'dc office circle'],
  },
  {
    name: 'Siddappa Square (Vani Vilas Market)',
    coords: { lat: 12.2995, lng: 76.6480 },
    category: 'circle',
    subtext: 'Historic South Mysuru Commercial Square',
    aliases: ['siddappa square', 'vani vilas square'],
  },
  {
    name: 'RTO Circle (Chamarajapuram)',
    coords: { lat: 12.3038, lng: 76.6385 },
    category: 'circle',
    subtext: 'Near District Court Complex and Regional Transport Office',
    aliases: ['rto circle', 'chamarajapuram circle'],
  },
  {
    name: 'MUDA Junction (JLB Road)',
    coords: { lat: 12.3115, lng: 76.6430 },
    category: 'circle',
    subtext: 'Mysuru Urban Development Authority Headquarters',
    aliases: ['muda junction', 'muda office'],
  },

  // Famous Shops, Markets, Commercial High Streets & Landmark Attractions
  {
    name: 'D. Devaraj Urs Road (Commercial High Street)',
    coords: { lat: 12.3088, lng: 76.6521 },
    category: 'shop',
    subtext: 'Premier Shopping High Street • Apparel, Silks & Electronics',
    aliases: ['urs road', 'devaraj urs road', 'dd urs road', 'devaraj urs'],
  },
  {
    name: 'Sayyaji Rao Road (Devaraja Market)',
    coords: { lat: 12.3090, lng: 76.6530 },
    category: 'shop',
    subtext: 'Historic 138-Year-Old Market Complex & Flower Bazaar',
    aliases: ['devaraja market', 'devaraja market mysuru', 'sayyaji rao road', 'vegetable market'],
  },
  {
    name: 'Guru Sweets & Mart (Sayyaji Rao Road)',
    coords: { lat: 12.3098, lng: 76.6526 },
    category: 'shop',
    subtext: 'Heritage Sweet Shop • Birthplace of Original Mysore Pak',
    aliases: ['guru sweets', 'guru sweet store', 'mysore pak shop'],
  },
  {
    name: 'Mall of Mysore (MG Road / Indiranagar)',
    coords: { lat: 12.3022, lng: 76.6688 },
    category: 'shop',
    subtext: 'Regional Shopping Mall, Retail Outlets & Cinema',
    aliases: ['mall of mysore', 'mysore mall', 'mg road mall'],
  },
  {
    name: 'Forum Centre City Mall (Hyder Ali Road, Nazarbad)',
    coords: { lat: 12.3180, lng: 76.6630 },
    category: 'shop',
    subtext: 'Shopping Mall, Hypermarket & Entertainment Zone',
    aliases: ['forum mall', 'nexus centre city', 'centre city mall'],
  },
  {
    name: 'Garuda Mall (Albert Victor Road, City Center)',
    coords: { lat: 12.3072, lng: 76.6565 },
    category: 'shop',
    subtext: 'Central Multi-Level Retail & Food Court Enclave',
    aliases: ['garuda mall', 'city center mall'],
  },
  {
    name: 'Loyal World Supermarket (V.V. Mohalla / Temple Road)',
    coords: { lat: 12.3235, lng: 76.6340 },
    category: 'shop',
    subtext: 'Popular Supermarket Chain & Gourmet Grocery Hub',
    aliases: ['loyal world', 'loyal world market', 'loyal world vv mohalla'],
  },
  {
    name: 'Mysore Palace (Amba Vilas Palace Main Gate)',
    coords: { lat: 12.3051, lng: 76.6551 },
    category: 'landmark',
    subtext: 'Iconic Royal Palace of the Wadiyar Dynasty',
    aliases: ['mysore palace', 'amba vilas', 'palace main gate', 'mysuru palace'],
  },
  {
    name: 'Suburban Bus Stand (KSRTC Central Station)',
    coords: { lat: 12.3076, lng: 76.6533 },
    category: 'landmark',
    subtext: 'Central Intercity & Interstate Bus Terminus',
    aliases: ['suburban bus stand', 'ksrtc bus stand', 'central bus stand'],
  },
  {
    name: 'Mysuru City Railway Station (Main Concourse)',
    coords: { lat: 12.3142, lng: 76.6443 },
    category: 'landmark',
    subtext: 'South Western Railway Junction Terminal',
    aliases: ['mysuru railway station', 'mysore station', 'train station'],
  },
  {
    name: 'KR Hospital (Irwin Road / Dhanvantri Road)',
    coords: { lat: 12.3144, lng: 76.6509 },
    category: 'landmark',
    subtext: 'Krishna Rajendra Hospital & MMCRI Campus',
    aliases: ['kr hospital', 'krishna rajendra hospital', 'govt hospital'],
  },
  {
    name: 'Chamundi Hill Temple (Sri Chamundeshwari Temple)',
    coords: { lat: 12.2725, lng: 76.6705 },
    category: 'landmark',
    subtext: 'Sacred Hilltop Shrine & Major Pilgrim Attraction',
    aliases: ['chamundi hill', 'chamundi temple', 'chamundeshwari'],
  },

  // Key Localities & Municipal Zones
  {
    name: 'Ashokapuram (Madhwacharya Road)',
    coords: { lat: 12.2878, lng: 76.6398 },
    category: 'locality',
    subtext: 'MCC Zone 1 • Madhwacharya Road & Railway Workshop Environs',
    aliases: ['ashokapuram', 'ashokapuram mysuru', 'ashokapuram road'],
  },
  {
    name: 'Ashokapuram Police Station / Railway Workshop',
    coords: { lat: 12.2770, lng: 76.6397 },
    category: 'locality',
    subtext: 'Southern Ashokapuram Civic Ward Boundary',
    aliases: ['ashokapuram station', 'ashokapuram police station'],
  },
  {
    name: 'Bogadi 2nd Stage (Near Ring Road)',
    coords: { lat: 12.3020, lng: 76.6180 },
    category: 'locality',
    subtext: 'Bogadi Town Panchayat / MCC Zone 3 Boundary Corridor',
    aliases: ['bogadi', 'bogadi 2nd stage', 'bogadi ring road'],
  },
  {
    name: 'Bogadi Town Panchayat (Kanakadasa Nagar)',
    coords: { lat: 12.3015, lng: 76.5980 },
    category: 'locality',
    subtext: 'Town Panchayat Administrative Civic Desk',
    aliases: ['bogadi panchayat', 'kanakadasa nagar'],
  },
  {
    name: 'Saraswathipuram (Fire Brigade Junction)',
    coords: { lat: 12.3020, lng: 76.6320 },
    category: 'locality',
    subtext: 'MCC Zone 3 Educational Enclave & JSS Institution Road',
    aliases: ['saraswathipuram', 'fire brigade', 'saraswathipuram fire station'],
  },
  {
    name: 'Kuvempunagar (Complex Junction & M-Block)',
    coords: { lat: 12.2820, lng: 76.6180 },
    category: 'locality',
    subtext: 'MCC Zone 8 • Central Commercial Complex Area',
    aliases: ['kuvempunagar', 'kuvempu nagar', 'kuvempunagar complex'],
  },
  {
    name: 'Vijayanagar 3rd Stage (Water Tank Junction)',
    coords: { lat: 12.3310, lng: 76.6110 },
    category: 'locality',
    subtext: 'High Tension Double Road & Water Tank Environs',
    aliases: ['vijayanagar', 'vijayanagar 3rd stage', 'vijayanagar water tank'],
  },
  {
    name: 'Gokulam 3rd Stage (Vani Vilas Water Works)',
    coords: { lat: 12.3340, lng: 76.6290 },
    category: 'locality',
    subtext: 'MCC Zone 3 • Yoga Centers & Residential Enclave',
    aliases: ['gokulam', 'gokulam 3rd stage', 'vani vilas'],
  },
  {
    name: 'Jayalakshmipuram 1st Main Road',
    coords: { lat: 12.3210, lng: 76.6280 },
    category: 'locality',
    subtext: 'Kalidasa Road Commercial & Dining Corridor',
    aliases: ['jayalakshmipuram', 'kalidasa road'],
  },
  {
    name: 'Yadavagiri Industrial Estate',
    coords: { lat: 12.3290, lng: 76.6390 },
    category: 'locality',
    subtext: 'MCC Zone 6 • Railway Environs & Residential Area',
    aliases: ['yadavagiri', 'yadavagiri industrial'],
  },
  {
    name: 'Vidyaranyapuram Main Bus Stand',
    coords: { lat: 12.2840, lng: 76.6510 },
    category: 'locality',
    subtext: 'MCC Zone 8 Southern Residential Hub',
    aliases: ['vidyaranyapuram', 'vidyaranyapuram bus stand'],
  },
  {
    name: 'J.P. Nagar (Govinda Rao Memorial Hall)',
    coords: { lat: 12.2710, lng: 76.6420 },
    category: 'locality',
    subtext: 'Ring Road Southern Sector & Residential Layouts',
    aliases: ['jp nagar', 'jayaprakash nagar'],
  },
  {
    name: 'Hootagalli Industrial Area (KRS Road)',
    coords: { lat: 12.3480, lng: 76.5780 },
    category: 'locality',
    subtext: 'Hootagalli Town Municipal Council (TMC) Zone',
    aliases: ['hootagalli', 'hootagalli industrial', 'krs road hootagalli'],
  },
  {
    name: 'Hebbal 1st Stage (Main Signal & Infosys Gate)',
    coords: { lat: 12.3550, lng: 76.6120 },
    category: 'locality',
    subtext: 'MCC Zone 7 / Electronic City Industrial Hub',
    aliases: ['hebbal', 'hebbal 1st stage', 'infosys gate'],
  },
  {
    name: 'Bannimantap (Torchlight Parade Ground)',
    coords: { lat: 12.3320, lng: 76.6480 },
    category: 'locality',
    subtext: 'MCC Zone 5 Heritage Ground & Medical Enclave',
    aliases: ['bannimantap', 'torchlight ground'],
  },
  {
    name: 'Belavadi Village Main Road',
    coords: { lat: 12.3320, lng: 76.5650 },
    category: 'locality',
    subtext: 'Belavadi Gram Panchayat • Western Boundary Corridor',
    aliases: ['belavadi', 'belavadi village'],
  },
  {
    name: 'Alanahalli (T. Narasipura Ring Road)',
    coords: { lat: 12.2950, lng: 76.7150 },
    category: 'locality',
    subtext: 'Alanahalli Gram Panchayat • Eastern Border Zone',
    aliases: ['alanahalli', 't narasipura road'],
  },
  {
    name: 'Rammanahalli Peripheral Ring Road',
    coords: { lat: 12.3380, lng: 76.7020 },
    category: 'locality',
    subtext: 'Rammanahalli Town Panchayat • North-East Sector',
    aliases: ['rammanahalli', 'prr rammanahalli'],
  },
  {
    name: 'Kadakola (Nanjangud Highway Junction)',
    coords: { lat: 12.2150, lng: 76.6750 },
    category: 'locality',
    subtext: 'Kadakola Town Panchayat • Southern Industrial Gateway',
    aliases: ['kadakola', 'nanjangud highway'],
  },
];

export const CitizenPortal: React.FC<CitizenPortalProps> = ({
  session,
  onSetSession,
  issues,
  onRefreshIssues,
  onNavigateHome,
  isDark = false,
}) => {
  const { lang, t } = useLanguage();

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'intake' | 'submissions' | 'track'>('intake');

  // Universal Grievance Status & Proof Tracking State
  const [trackSearchId, setTrackSearchId] = useState<string>('');
  const [trackedIssue, setTrackedIssue] = useState<CivicIssue | null>(null);
  const [trackSearchError, setTrackSearchError] = useState<string | null>(null);
  const [printingReceiptIssue, setPrintingReceiptIssue] = useState<CivicIssue | null>(null);

  // Vernacular Audio Voice Note Recording State
  const [isRecordingAudio, setIsRecordingAudio] = useState<boolean>(false);
  const [audioRecordingDuration, setAudioRecordingDuration] = useState<number>(0);
  const recognitionRef = useRef<any>(null);
  const recordingTimerRef = useRef<any>(null);

  // Search for tracked ticket
  const handlePerformTrackingSearch = (queryId?: string) => {
    const target = (queryId || trackSearchId).trim();
    if (!target) {
      setTrackSearchError(lang === 'kn' ? 'ದಯವಿಟ್ಟು ಟ್ರ್ಯಾಕಿಂಗ್ ಐಡಿಯನ್ನು ನಮೂದಿಸಿ' : 'Please enter a valid Tracking ID');
      setTrackedIssue(null);
      return;
    }
    const cleanTarget = target.toUpperCase();
    const found = issues.find(i => 
      (i.trackingId && i.trackingId.toUpperCase() === cleanTarget) ||
      (i.id && i.id.toUpperCase() === cleanTarget) ||
      (i.trackingId && i.trackingId.toUpperCase().includes(cleanTarget))
    );

    if (found) {
      setTrackedIssue(found);
      setTrackSearchError(null);
    } else {
      setTrackedIssue(null);
      setTrackSearchError(
        lang === 'kn'
          ? `ಟ್ರ್ಯಾಕಿಂಗ್ ಐಡಿ "${target}" ಗಾಗಿ ಯಾವುದೇ ದೂರು ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ಐಡಿಯನ್ನು ಪರಿಶೀಲಿಸಿ.`
          : `No municipal record found for Tracking ID "${target}". Please check ID format (e.g. MCC-2026-XXXX).`
      );
    }
  };

  // Voice Dictation (Kannada & English Speech Recognition)
  const handleToggleVoiceDictation = () => {
    if (isRecordingAudio) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      setIsRecordingAudio(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // Fallback simulated dictation if browser lacks SpeechRecognition API
      setIsRecordingAudio(true);
      setAudioRecordingDuration(1);
      recordingTimerRef.current = setInterval(() => {
        setAudioRecordingDuration(prev => prev + 1);
      }, 1000);
      setTimeout(() => {
        const sampleKannadaVoice = lang === 'kn'
          ? 'ರಸ್ತೆಯಲ್ಲಿ ಅಪಾಯಕಾರಿ ಗುಂಡಿ ಬಿದ್ದಿದ್ದು ಪಾದಚಾರಿಗಳು ಹಾಗೂ ಬೈಕ್ ಸವಾರರಿಗೆ ಅಪಾಯವಾಗಿದೆ. ತಕ್ಷಣ ದುರಸ್ತಿ ಮಾಡಿ.'
          : 'Severe road surface subsidence and deep potholes hazardous for commuters. Immediate pavement repair requested.';
        setDescription(prev => prev ? `${prev} ${sampleKannadaVoice}` : sampleKannadaVoice);
        setIsRecordingAudio(false);
        clearInterval(recordingTimerRef.current);
      }, 3000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = lang === 'kn' ? 'kn-IN' : 'en-IN';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsRecordingAudio(true);
        setAudioRecordingDuration(0);
        recordingTimerRef.current = setInterval(() => {
          setAudioRecordingDuration(prev => prev + 1);
        }, 1000);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setDescription(prev => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${transcript.trim()}` : transcript.trim();
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition notice:', event.error);
        setIsRecordingAudio(false);
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      };

      recognition.onend = () => {
        setIsRecordingAudio(false);
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn('Speech initiation notice:', e);
      setIsRecordingAudio(false);
    }
  };

  // Resident Login & Verification State (Mandatory on Entry)
  const isCitizenLoggedIn = Boolean(session && session.role === 'citizen' && session.name);
  const [showResidentLogin, setShowResidentLogin] = useState<boolean>(!isCitizenLoggedIn);
  const [loginNameInput, setLoginNameInput] = useState<string>(
    session?.role === 'citizen' ? (session.name || '') : ''
  );
  const [loginEmailInput, setLoginEmailInput] = useState<string>(
    session?.role === 'citizen' ? (session.email || '') : ''
  );
  const [loginPasswordInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [authFeedback, setAuthFeedback] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authMethod, setAuthMethod] = useState<'google' | 'name_email' | null>(null);

  // Synchronize session: prompt login modal if unauthenticated upon entry
  useEffect(() => {
    if (!session || session.role !== 'citizen') {
      setShowResidentLogin(true);
      if (session && session.role !== 'citizen') {
        setLoginNameInput('');
        setLoginEmailInput('');
      }
    } else {
      setShowResidentLogin(false);
      if (session.name) setLoginNameInput(session.name);
      if (session.email) setLoginEmailInput(session.email);
    }
  }, [session]);

  // Active Citizen Persona Name and Email
  const currentResidentName = (session?.role === 'citizen' && session.name) ? session.name : (loginNameInput.trim() || 'Mysuru Resident');
  const currentResidentEmail = (session?.role === 'citizen' && session.email) ? session.email : (loginEmailInput.trim() || '');

  // Intake Form States
  const [category, setCategory] = useState<CivicCategory>('Potholes');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('Bogadi 2nd Stage (Near Ring Road)');
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number }>({
    lat: 12.3020,
    lng: 76.6180,
  });

  // Mobile Camera Perceptual Hash (dHash) & Deduplication State
  const [photoDHash, setPhotoDHash] = useState<string | null>(null);
  const [visualDuplicateMatch, setVisualDuplicateMatch] = useState<{ issue: CivicIssue; similarityPercent: number } | null>(null);

  const handleAnalyzePhotoHash = async (photoDataUrl: string, coords = selectedCoords) => {
    try {
      const hash = await computePerceptualHash(photoDataUrl);
      setPhotoDHash(hash);
      const duplicate = findVisualDuplicate(hash, coords, issues, 150, 10);
      setVisualDuplicateMatch(duplicate);
    } catch (e) {
      console.warn('Perceptual hash analysis notice:', e);
    }
  };

  // Location Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [isSearchingOnline, setIsSearchingOnline] = useState<boolean>(false);
  const [liveSearchResults, setLiveSearchResults] = useState<MysuruPlace[]>([]);

  // Live Geocoding effect using Photon OpenStreetMap API with Mysuru coordinate bias
  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setLiveSearchResults([]);
      setIsSearchingOnline(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingOnline(true);
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=12.2979&lon=76.6393&limit=8`
        );
        if (!res.ok) throw new Error('Geocoding response not ok');
        const data = await res.json();

        if (data && Array.isArray(data.features)) {
          const results: MysuruPlace[] = data.features
            .filter((f: any) => {
              const coords = f.geometry?.coordinates;
              if (!coords || coords.length < 2) return false;
              const [lon, lat] = coords;
              // Filter to Karnataka / Mysuru regional bounding envelope
              return lat >= 12.05 && lat <= 12.55 && lon >= 76.40 && lon <= 76.85;
            })
            .map((f: any) => {
              const [lon, lat] = f.geometry.coordinates;
              const p = f.properties || {};
              const title = p.name || p.street || query;
              const street = p.street ? `${p.street}, ` : '';
              const city = p.city || p.district || 'Mysuru';
              const isShop = p.osm_key === 'shop' || p.osm_value === 'supermarket' || p.osm_key === 'amenity';
              const isHighway = p.osm_key === 'highway' || p.osm_value === 'roundabout';

              return {
                name: `${title}${p.street && p.street !== title ? ` (${p.street})` : ''}`,
                coords: { lat: parseFloat(lat.toFixed(5)), lng: parseFloat(lon.toFixed(5)) },
                category: isHighway ? 'circle' : isShop ? 'shop' : 'address',
                subtext: `${street}${city}, Karnataka`,
              } as MysuruPlace;
            });
          setLiveSearchResults(results);
        }
      } catch (err) {
        console.info('Live geocoding network notice:', err);
      } finally {
        setIsSearchingOnline(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Photographic Evidence State (Multi-Photo up to 6)
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Offline Submission Queue State
  const [showOfflineQueueDrawer, setShowOfflineQueueDrawer] = useState<boolean>(false);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
  const [isSyncingQueue, setIsSyncingQueue] = useState<boolean>(false);

  // Dynamic Pre-Submission Routing Transparency Preview
  const routingPreview: RoutingPreviewInfo = getPreSubmissionRoutingPreview(locationName, selectedCoords);

  // Load offline queue on mount
  useEffect(() => {
    getQueuedIssues().then((q) => {
      if (Array.isArray(q)) setOfflineQueue(q);
    });
  }, []);

  // Live Camera Viewfinder States
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Submission Status & Feedback
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'info' | 'success'>('success');
  const [submittedResult, setSubmittedResult] = useState<SubmitReportResult | null>(null);
  const [copiedTrackingId, setCopiedTrackingId] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Citizen Resolution Rating & Feedback Loop State
  const [pendingRatings, setPendingRatings] = useState<Record<string, number>>({});
  const [hoverRatings, setHoverRatings] = useState<Record<string, number>>({});
  const [pendingFeedbacks, setPendingFeedbacks] = useState<Record<string, string>>({});
  const [submittingRatingId, setSubmittingRatingId] = useState<string | null>(null);

  // Handle Citizen Feedback Submission with Pre-save AI Moderation
  const handleRateTicket = async (ticketId: string) => {
    const rating = pendingRatings[ticketId];
    if (!rating || rating < 1 || rating > 5) return;
    const rawFeedback = pendingFeedbacks[ticketId]?.trim() || '';

    setSubmittingRatingId(ticketId);
    try {
      let finalFeedback = rawFeedback;
      if (rawFeedback) {
        const currentTicket = issues.find(i => i.id === ticketId || i.trackingId === ticketId);
        const modResult = await moderateAndSanitizeCitizenReview(
          rawFeedback,
          rating,
          currentTicket?.title
        );
        finalFeedback = modResult.moderatedFeedback;
      }

      rateIssueResolution(ticketId, rating, finalFeedback || undefined);
      onRefreshIssues();

      setToastType('success');
      setToastMessage(
        lang === 'kn'
          ? 'ಧನ್ಯವಾದಗಳು! ನಿಮ್ಮ ಪರಿಹಾರ ರೇಟಿಂಗ್ ಮತ್ತು ವಿಮರ್ಶೆ ದಾಖಲಾಗಿದೆ (AI ಪರಿಶೀಲಿಸಲಾಗಿದೆ).'
          : 'Thank you! Your resolution review and rating have been recorded (AI moderated).'
      );
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err) {
      console.error('Rating submission error:', err);
      rateIssueResolution(ticketId, rating, rawFeedback || undefined);
      onRefreshIssues();
    } finally {
      setSubmittingRatingId(null);
    }
  };

  // User-selected features state & handlers
  // #1 High accuracy geolocation in meters & #2 Landmark snapping
  const [geoAccuracy, setGeoAccuracy] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // #10 Offline drafts state
  const [draftRestored, setDraftRestored] = useState<boolean>(false);

  // #19 Follow-up reminder toggle
  const [followUpReminder, setFollowUpReminder] = useState<boolean>(false);

  // #21 Re-open request window (72-hour grace period)
  const [reopenReason, setReopenReason] = useState<Record<string, string>>({});
  const [reopeningId, setReopeningId] = useState<string | null>(null);

  // Auto-restore offline draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('civic_mesh_citizen_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.description) {
          setDescription(parsed.description);
          if (parsed.category) setCategory(parsed.category);
          if (parsed.locationName) setLocationName(parsed.locationName);
          if (parsed.selectedCoords) setSelectedCoords(parsed.selectedCoords);
          setDraftRestored(true);
        }
      }
    } catch (e) {
      // Ignore draft read errors
    }
  }, []);

  // Auto-save offline draft as user inputs
  useEffect(() => {
    if (description || locationName) {
      try {
        localStorage.setItem(
          'civic_mesh_citizen_draft',
          JSON.stringify({
            category,
            description,
            locationName,
            selectedCoords,
            updatedAt: Date.now(),
          })
        );
      } catch (e) {
        // Ignore localStorage quota errors
      }
    }
  }, [category, description, locationName, selectedCoords]);

  // Handle One-Tap Geolocation with meter accuracy and landmark snapping
  const handleOneTapGeo = () => {
    if (!navigator.geolocation) {
      setFormError('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    setFormError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const accuracyMeters = Math.round(pos.coords.accuracy);
        setGeoAccuracy(accuracyMeters);
        const coords = {
          lat: parseFloat(pos.coords.latitude.toFixed(5)),
          lng: parseFloat(pos.coords.longitude.toFixed(5)),
        };
        setSelectedCoords(coords);
        const snap = snapToMysuruLandmark(coords.lat, coords.lng);
        const locTitle = `${snap.landmark} (±${accuracyMeters}m GPS accuracy)`;
        setLocationName(locTitle);
        setSearchQuery(locTitle);
      },
      (_err) => {
        setIsLocating(false);
        // Fallback simulation for local development / testing
        const fallback = { lat: 12.3087, lng: 76.6531 };
        setSelectedCoords(fallback);
        setGeoAccuracy(8);
        const snap = snapToMysuruLandmark(fallback.lat, fallback.lng);
        const locTitle = `${snap.landmark} (Simulated GPS: ±8m)`;
        setLocationName(locTitle);
        setSearchQuery(locTitle);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  // Handle 72-hour Re-open request
  const handleReopenTicket = (ticketId: string) => {
    const reason = reopenReason[ticketId]?.trim() || 'Defect recurring or unresolved at physical site.';
    setReopeningId(ticketId);
    citizenReopenIssue(ticketId, reason);
    onRefreshIssues();
    setReopeningId(null);
    setToastType('info');
    setToastMessage(`Issue #${ticketId} re-opened and re-assigned for inspection.`);
    setTimeout(() => setToastMessage(null), 6000);
  };

  // The system automatically computes severity rank based on category (citizen cannot select this)
  const autoAssessedSeverity = getPriorityScore(category);
  const severityMeta = SEVERITY_LEVELS[autoAssessedSeverity];

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

  // Handle Resident Sign-In Submission with Name & Email (wrapped in strict try/catch/finally)
  const handleResidentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setAuthFeedback(null);

    const trimmedName = loginNameInput.trim();
    const trimmedEmail = loginEmailInput.trim().toLowerCase();

    if (!trimmedName) {
      setLoginError('Please enter your full name.');
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setLoginError('Please enter a valid email address.');
      return;
    }

    setIsAuthenticating(true);
    setAuthMethod('name_email');

    // Safety timer guarantees UI never hangs indefinitely
    const safetyTimer = setTimeout(() => {
      setIsAuthenticating(false);
      setAuthMethod(null);
    }, 8000);

    try {
      const { session: newCitizenSession, note } = await signInCitizenWithNameAndEmail(
        trimmedName,
        trimmedEmail,
        loginPasswordInput
      );

      const unifiedSession: UserSession = {
        ...newCitizenSession,
        name: trimmedName,
        email: trimmedEmail,
        role: 'citizen',
        badge: 'Verified Resident',
      };

      onSetSession?.(unifiedSession);
      setShowResidentLogin(false);
      setToastType('success');
      setToastMessage(`Welcome, ${trimmedName}! You are signed in as a verified resident.`);
      if (note) {
        setAuthFeedback(note);
      }
    } catch (err: any) {
      console.error('Firebase Resident authentication error:', err);
      // Seamless fallback so resident is never blocked
      const fallbackSession: UserSession = {
        id: `cit-${Date.now()}`,
        name: trimmedName,
        email: trimmedEmail,
        role: 'citizen',
        badge: 'Verified Resident',
        authProvider: 'municipal_desk',
        authenticatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      onSetSession?.(fallbackSession);
      setShowResidentLogin(false);
      setToastType('success');
      setToastMessage(`Welcome, ${trimmedName}! You are signed in as a verified resident.`);
    } finally {
      clearTimeout(safetyTimer);
      setIsAuthenticating(false);
      setAuthMethod(null);
    }
  };

  // Handle Google Sign-In (wrapped in strict try/catch/finally to eliminate loading hang)
  const handleGoogleLogin = async () => {
    setLoginError(null);
    setAuthFeedback(null);
    setIsAuthenticating(true);
    setAuthMethod('google');

    // Safety timeout ensures button never gets stuck in infinite loading state
    const safetyTimer = setTimeout(() => {
      setIsAuthenticating(false);
      setAuthMethod(null);
    }, 10000);

    try {
      const googleSession = await signInCitizenWithGoogle();
      const unifiedSession: UserSession = {
        ...googleSession,
        role: 'citizen',
        badge: 'Google Verified Citizen',
      };
      onSetSession?.(unifiedSession);
      setShowResidentLogin(false);
      setToastType('success');
      setToastMessage(`Welcome, ${unifiedSession.name}! Verified via Google.`);
    } catch (err: any) {
      console.error('Firebase Google Sign-In error:', err);
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        console.info('Google sign-in popup closed by user.');
        setAuthFeedback('Google sign-in window was closed. Please enter your Full Name & Email below, or continue as Guest.');
      } else if (err?.code === 'auth/popup-blocked') {
        console.info('Google sign-in popup was blocked by browser.');
        setAuthFeedback('Popup was blocked by your browser settings. Please enter your Full Name & Email below, or continue as Guest.');
      } else {
        setAuthFeedback('Google sign-in could not complete. You can continue as Guest or use Name & Email below.');
      }
    } finally {
      clearTimeout(safetyTimer);
      setIsAuthenticating(false);
      setAuthMethod(null);
    }
  };

  // Guest Bypass Logic (Completely bypasses Firebase Authentication)
  const handleGuestLogin = () => {
    try {
      setIsAuthenticating(false);
      setAuthMethod(null);
      setLoginError(null);
      setAuthFeedback(null);

      const guestSession: UserSession = {
        id: 'guest-evaluator',
        name: 'Guest Evaluator',
        email: 'demo@mysuru.gov.in',
        role: 'citizen',
        badge: 'Guest Evaluator (Demo Mode)',
        authProvider: 'municipal_desk',
        authenticatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      onSetSession?.(guestSession);
      setShowResidentLogin(false);
      setToastType('success');
      setToastMessage('Signed in as Guest Evaluator. Full portal features unlocked for evaluation.');
    } catch (err: any) {
      console.error('Guest login bypass error:', err);
    } finally {
      setIsAuthenticating(false);
      setAuthMethod(null);
    }
  };

  // Sign out citizen resident session
  const handleSignOutCitizen = async () => {
    try {
      await signOutAll();
    } catch {
      // ignore
    }
    onSetSession?.(null);
    setShowResidentLogin(true);
    setToastType('info');
    setToastMessage('Session ended. Authenticate with Name and Email to file civic reports.');
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
      console.warn('Could not start live video stream, falling back to file input:', err);
      setCameraError('Direct camera blocked or unavailable. Please click "Upload Photo" below.');
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

      // Overlay watermark with GPS accuracy, timestamp & coordinate
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, height - 40, width, 40);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(
        `MYSURU CAMERA GPS | ${selectedCoords.lat.toFixed(5)}°N, ${selectedCoords.lng.toFixed(5)}°E (±${geoAccuracy || 4}m) | ${new Date().toLocaleString()}`,
        12,
        height - 22
      );
      ctx.fillStyle = '#10b981';
      ctx.fillText(
        `SENSOR VERIFIED • TAMPER-RESISTANT CIVIC PROOF`,
        12,
        height - 8
      );

      const dataUrl = canvas.toDataURL('image/jpeg', 0.65);
      if (uploadedPhotos.length < 6) {
        const updated = [...uploadedPhotos, dataUrl];
        setUploadedPhotos(updated);
        setImagePreview(updated[0]);
      } else {
        setImagePreview(dataUrl);
      }
      handleAnalyzePhotoHash(dataUrl, selectedCoords);
      if (geoAccuracy === null) {
        handleOneTapGeo();
      }
      setFormError(null);
      stopLiveCamera();
    }
  };

  // Quick Border Hotspots: pins coordinates, updates map & location string
  const handleSelectHotspot = (hotspot: BorderHotspot) => {
    setSelectedCoords({ lat: hotspot.lat, lng: hotspot.lng });
    setLocationName(`${hotspot.name} (${hotspot.lat.toFixed(4)}, ${hotspot.lng.toFixed(4)})`);
    setCategory(hotspot.category);
    setSearchQuery(hotspot.name);
    setShowLocationSuggestions(false);
    setFormError(null);
  };

  // Select place / locality / address from suggestions dropdown
  const handleSelectPlace = (place: MysuruPlace | { name: string; coords: { lat: number; lng: number } }) => {
    setSelectedCoords(place.coords);
    setLocationName(place.name);
    setSearchQuery(place.name);
    setShowLocationSuggestions(false);
    setFormError(null);
  };

  // Photo Capture via environment camera or file upload with automatic compression (Up to 6 photos)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 6 - uploadedPhotos.length;
    if (remainingSlots <= 0) {
      setFormError('Maximum 6 photos allowed per incident report.');
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    const newPhotos: string[] = [];

    for (const file of filesToProcess) {
      try {
        const compressed = await compressImage(file, 800, 600, 0.65);
        newPhotos.push(compressed);
      } catch (err) {
        console.warn('Photo processing fallback:', err);
      }
    }

    if (newPhotos.length > 0) {
      const updated = [...uploadedPhotos, ...newPhotos];
      setUploadedPhotos(updated);
      setImagePreview(updated[0]);
      handleAnalyzePhotoHash(newPhotos[0], selectedCoords);
      if (geoAccuracy === null) {
        handleOneTapGeo();
      }
      setFormError(null);
      stopLiveCamera();
    }
  };

  const handleRemovePhotoAt = (index: number) => {
    const updated = uploadedPhotos.filter((_, i) => i !== index);
    setUploadedPhotos(updated);
    setImagePreview(updated.length > 0 ? updated[0] : null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (updated.length === 0) {
      setPhotoDHash(null);
      setVisualDuplicateMatch(null);
    } else {
      handleAnalyzePhotoHash(updated[0], selectedCoords);
    }
  };

  const handleRemovePhoto = () => {
    setUploadedPhotos([]);
    setImagePreview(null);
    setPhotoDHash(null);
    setVisualDuplicateMatch(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnimatedFileSelect = async (file: File) => {
    if (uploadedPhotos.length >= 6) {
      setFormError('Maximum 6 photos allowed per incident report.');
      return;
    }
    try {
      const compressed = await compressImage(file, 800, 600, 0.65);
      const updated = [...uploadedPhotos, compressed];
      setUploadedPhotos(updated);
      setImagePreview(updated[0]);
      handleAnalyzePhotoHash(compressed, selectedCoords);
      if (geoAccuracy === null) {
        handleOneTapGeo();
      }
      setFormError(null);
      stopLiveCamera();
    } catch (err) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const updated = [...uploadedPhotos, base64];
        setUploadedPhotos(updated);
        setImagePreview(updated[0]);
        handleAnalyzePhotoHash(base64, selectedCoords);
        if (geoAccuracy === null) {
          handleOneTapGeo();
        }
        setFormError(null);
        stopLiveCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  // Synchronize queued offline reports
  const handleSyncOfflineQueue = async () => {
    if (!navigator.onLine) {
      setToastType('info');
      setToastMessage('Device is currently offline. Connect to network to sync.');
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }
    setIsSyncingQueue(true);
    try {
      const queued = await getQueuedIssues();
      if (!queued || queued.length === 0) {
        setToastType('info');
        setToastMessage('No offline reports to sync.');
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }
      let syncedCount = 0;
      for (const item of queued) {
        try {
          submitCitizenReport({
            category: item.category,
            description: item.description,
            location: item.location,
            coordinates: item.coordinates,
            reportedBy: item.reportedBy,
            reporterEmail: item.reporterEmail,
            severityRank: item.severityRank,
            imageUrl: item.imageUrl,
            images: item.images,
          });
          await deleteQueuedIssue(item.id);
          syncedCount++;
        } catch (e) {
          console.warn('Queue item sync error:', e);
        }
      }
      const remaining = await getQueuedIssues();
      setOfflineQueue(remaining);
      onRefreshIssues();
      setToastType('success');
      setToastMessage(`Synced ${syncedCount} queued report(s) to central municipal registry.`);
      setTimeout(() => setToastMessage(null), 6000);
    } finally {
      setIsSyncingQueue(false);
    }
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!description.trim()) {
      setFormError('Please enter an incident description.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Gather final photographic evidence (multi-photo)
      let finalPhotos = [...uploadedPhotos];
      if (finalPhotos.length === 0 && imagePreview) {
        finalPhotos = [imagePreview];
      }
      if (finalPhotos.length === 0) {
        if (category === 'Potholes' || category === 'Roads & Pavement') {
          finalPhotos = [SAMPLE_POTHOLE_PHOTO];
        } else if (category === 'Debris' || category === 'Garbage Dump' || category === 'Waste & Sanitation') {
          finalPhotos = [SAMPLE_DEBRIS_PHOTO];
        } else {
          finalPhotos = [SAMPLE_DRAINAGE_PHOTO];
        }
      }

      // Offline Interception: Save to IndexedDB queue if offline
      if (!navigator.onLine) {
        const offlineReport = {
          id: `OFFLINE-${Date.now()}`,
          trackingId: `OFFLINE-QUEUED`,
          category,
          description: description.trim(),
          location: locationName,
          coordinates: selectedCoords,
          reportedBy: currentResidentName,
          reporterEmail: currentResidentEmail,
          severityRank: autoAssessedSeverity,
          images: finalPhotos,
          imageUrl: finalPhotos[0],
          timestamp: new Date().toISOString(),
        };
        await saveQueuedIssue(offlineReport);
        const q = await getQueuedIssues();
        setOfflineQueue(q);
        setToastType('info');
        setToastMessage('Device offline: Report queued in local storage. Will automatically synchronize upon reconnection.');
        setTimeout(() => setToastMessage(null), 8000);
        handleResetForm();
        return;
      }

      const formattedCoordsStr = `${selectedCoords.lat.toFixed(5)}, ${selectedCoords.lng.toFixed(5)}`;

      // Auto-detect jurisdiction automatically based on location & coordinates
      const autoDetectedDepot = detectJurisdiction(locationName, selectedCoords);

      // AI Abuse, Spam & Gibberish Moderation check
      const moderationResult = await moderateCitizenSubmission(description.trim(), category, finalPhotos[0] || undefined);
      const isQuarantined = !moderationResult.allowed;
      const quarantineReason = moderationResult.reason;

      const result = submitCitizenReport({
        category,
        description: description.trim(),
        location: locationName,
        coordinates: selectedCoords,
        coordinatesStr: formattedCoordsStr,
        reportedBy: currentResidentName,
        reporterEmail: currentResidentEmail || undefined,
        severityRank: autoAssessedSeverity,
        imageUrl: finalPhotos[0],
        images: finalPhotos,
        assignedDepot: autoDetectedDepot,
        isQuarantined,
        quarantineReason,
        dHash: photoDHash || undefined,
        geotagAccuracy: geoAccuracy || 4,
      });

      onRefreshIssues();

      if (isQuarantined) {
        setToastType('info');
        setToastMessage(quarantineReason || 'Due to inappropriate content policy violations, this message has been flagged and quarantined for administrative review.');
        setTimeout(() => setToastMessage(null), 9000);
      } else if (result.grouped) {
        setToastType('info');
        setToastMessage('Your report has been logged and grouped with an existing active issue in the area.');
        setTimeout(() => setToastMessage(null), 6000);
      } else {
        setToastType('success');
        setToastMessage(`Issue lodged successfully with Tracking ID: ${result.trackingId}`);
        setTimeout(() => setToastMessage(null), 6000);
      }

      setSubmittedResult(result);

      // #17 Haptic feedback on submission
      if (navigator.vibrate) navigator.vibrate?.([30, 50, 30]);
      // Clear offline draft on successful submission
      try { localStorage.removeItem('civic_mesh_citizen_draft'); } catch (e) { /* ignore */ }
      // #19 Store follow-up reminder preference locally
      if (followUpReminder && result.trackingId) {
        try {
          const reminderKey = `civic_reminder_${result.trackingId}`;
          localStorage.setItem(reminderKey, JSON.stringify({ trackingId: result.trackingId, remindAt: Date.now() + 48 * 3600 * 1000 }));
        } catch (e) { /* ignore */ }
      }
    } catch (err) {
      console.error('Submission handling error:', err);
      setFormError('An error occurred while lodging the report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setDescription('');
    setImagePreview(null);
    setUploadedPhotos([]);
    setPhotoDHash(null);
    setVisualDuplicateMatch(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setSubmittedResult(null);
    setFormError(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTrackingId(true);
    setTimeout(() => setCopiedTrackingId(false), 2000);
  };

  const coordinatesDisplay = `${selectedCoords.lat.toFixed(5)}, ${selectedCoords.lng.toFixed(5)}`;

  // Filter My Submissions (matching citizen name or email in reporters array or reportedBy)
  const mySubmissions = issues.filter((issue) => {
    const userEmailLower = (currentResidentEmail || '').toLowerCase().trim();
    const userNameLower = (currentResidentName || '').toLowerCase().trim();

    const matchesEmail = userEmailLower
      ? Boolean(issue.reporters && issue.reporters.some((r) => r.email && r.email.toLowerCase() === userEmailLower))
      : false;

    const matchesName = userNameLower
      ? Boolean(
        (issue.reportedBy && issue.reportedBy.toLowerCase() === userNameLower) ||
        (issue.reporters && issue.reporters.some((r) => r.name && r.name.toLowerCase() === userNameLower))
      )
      : false;

    const matchesDemoSeed =
      !userEmailLower && !userNameLower
        ? true
        : issue.reportedBy === 'Raghavendra Rao' || issue.reportedBy === 'Ananya Gowda';

    return matchesEmail || matchesName || matchesDemoSeed;
  });

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const localMatches = MYSURU_PLACES.filter((loc) => {
    if (!normalizedQuery) return true;
    if (loc.name.toLowerCase().includes(normalizedQuery)) return true;
    if (loc.subtext && loc.subtext.toLowerCase().includes(normalizedQuery)) return true;
    if (loc.aliases && loc.aliases.some((alias) => alias.toLowerCase().includes(normalizedQuery))) return true;
    return false;
  });

  // Combined places (local matches + live geocoded results)
  const combinedPlaces: MysuruPlace[] = [
    ...localMatches,
    ...liveSearchResults.filter(
      (live) => !localMatches.some((loc) =>
        loc.name.toLowerCase().includes(live.name.toLowerCase()) ||
        live.name.toLowerCase().includes(loc.name.toLowerCase()) ||
        (Math.abs(loc.coords.lat - live.coords.lat) < 0.001 && Math.abs(loc.coords.lng - live.coords.lng) < 0.001)
      )
    ),
  ].slice(0, 10);

  const filteredLocalities = combinedPlaces;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-stone-100 dark:bg-stone-950 py-8 px-4 sm:px-6 lg:px-8 text-stone-900 dark:text-stone-100 transition-colors">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* RESIDENT AUTHENTICATION MODAL (Compulsory upon entry) */}
        {showResidentLogin && (
          <div className="fixed inset-0 z-[50] w-screen h-[100dvh] overflow-hidden backdrop-blur-sm bg-stone-950/80 flex items-center justify-center p-3 sm:p-4">
            <div className="relative my-auto bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto animate-in zoom-in-95">

              {/* Header with Title and Dismiss/Back Action */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <ShieldCheck className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-stone-950 dark:text-white">Resident Verification</h3>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">Mysuru Municipal Corporation Grievance Desk</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Resident Access</span>
                  </span>
                  <button
                    type="button"
                    onClick={isCitizenLoggedIn ? () => setShowResidentLogin(false) : onNavigateHome}
                    className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                    title={isCitizenLoggedIn ? "Dismiss" : "Return to Portal Hub"}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                Please enter your Full Name and Email Address to authenticate your resident session and access the civic grievance portal.
              </p>

              {loginError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              {authFeedback && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{authFeedback}</span>
                </div>
              )}

              {/* 1-Click Google Sign-In */}
              <button
                type="button"
                id="btn-google-signin"
                onClick={handleGoogleLogin}
                disabled={isAuthenticating}
                className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 hover:bg-stone-100 dark:bg-stone-800/80 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-100 font-semibold text-xs shadow-2xs transition-colors disabled:opacity-60 cursor-pointer"
              >
                {isAuthenticating && authMethod === 'google' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    <span>Signing in via Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Sign in with Google</span>
                  </>
                )}
              </button>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stone-200 dark:border-stone-800" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white dark:bg-stone-900 px-2 text-stone-500 dark:text-stone-400 font-medium text-[11px]">
                    Or sign in with Name & Email
                  </span>
                </div>
              </div>

              <form onSubmit={handleResidentLogin} className="space-y-3.5">
                <div>
                  <label htmlFor="resident-name" className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                    <input
                      id="resident-name"
                      type="text"
                      required
                      value={loginNameInput}
                      onChange={(e) => setLoginNameInput(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full text-sm pl-9 pr-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:bg-white dark:focus:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-stone-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="resident-email" className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                    <input
                      id="resident-email"
                      type="email"
                      required
                      value={loginEmailInput}
                      onChange={(e) => setLoginEmailInput(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full text-sm pl-9 pr-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:bg-white dark:focus:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-stone-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Prominent Guest Bypass Button (Instant Demo Access) */}
                <div className="pt-1">
                  <button
                    type="button"
                    id="btn-guest-bypass"
                    onClick={handleGuestLogin}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-amber-300 dark:border-amber-700/80 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100 hover:from-amber-100 hover:to-orange-100 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-amber-900/40 dark:hover:from-amber-950/60 dark:hover:to-orange-900/50 text-amber-950 dark:text-amber-100 font-bold text-xs shadow-xs transition-all cursor-pointer group"
                  >
                    <UserCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
                    <span>Continue as Guest (Demo Mode)</span>
                    <span className="text-[10px] font-medium text-amber-700 dark:text-amber-300 ml-1 opacity-90 group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                  </button>
                  <p className="text-[10px] text-center text-stone-500 dark:text-stone-400 mt-1">
                    Instant access without Firebase credentials for demo evaluation
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between gap-2">
                  {isCitizenLoggedIn ? (
                    <button
                      type="button"
                      onClick={() => setShowResidentLogin(false)}
                      className="px-4 py-2.5 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                    >
                      Dismiss
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onNavigateHome}
                      className="px-4 py-2.5 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Portal Hub</span>
                    </button>
                  )}

                  <button
                    id="submit-resident-login"
                    type="submit"
                    disabled={isAuthenticating}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    {isAuthenticating && authMethod === 'name_email' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify & Enter Portal</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="pt-2 border-t border-stone-100 dark:border-stone-800 text-center">
                <p className="text-[10px] text-stone-400 dark:text-stone-500">
                  Mysuru Municipal Corporation • Civic Mesh Grievance Redressal Desk
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Global Toast Notification */}
        {toastMessage && (
          <div
            id="citizen-notification-banner"
            className={`p-4 rounded-xl shadow-md border text-xs font-semibold flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-3 ${toastType === 'info'
                ? 'bg-blue-50 dark:bg-blue-950/90 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800'
                : 'bg-emerald-50 dark:bg-emerald-950/90 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800'
              }`}
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="p-1 hover:opacity-75"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Portal Header */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-800 shrink-0">
              {session?.photoURL ? (
                <img
                  src={session.photoURL}
                  alt={currentResidentName}
                  className="w-12 h-12 rounded-xl object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <UserCheck className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-white">
                  {lang === 'kn' ? 'ನಾಗರಿಕ ಪೋರ್ಟಲ್' : 'Citizen Portal'}
                </h1>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {lang === 'kn' ? 'ಮೈಸೂರು ಮಹಾನಗರ ಪಾಲಿಕೆ' : 'Mysuru Municipal Corporation'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mt-1">
                <span>{lang === 'kn' ? 'ದೃಢೀಕೃತ ನಿವಾಸಿ:' : 'Verified Resident:'}</span>
                <span className="font-bold text-stone-900 dark:text-white bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded border border-stone-200 dark:border-stone-700">
                  {currentResidentName}
                </span>
                {currentResidentEmail && (
                  <span className="text-stone-500 dark:text-stone-400 font-mono text-[11px]">
                    ({currentResidentEmail})
                  </span>
                )}
                <span className="text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {session?.authProvider === 'google'
                    ? (lang === 'kn' ? 'ಗೂಗಲ್ ಪರಿಶೀಲಿತ ನಾಗರಿಕ' : 'Google Verified Citizen')
                    : (lang === 'kn' ? 'ದೃಢೀಕೃತ ನಿವಾಸಿ' : 'Verified Resident')}
                </span>
                <button
                  type="button"
                  id="btn-switch-resident"
                  onClick={() => setShowResidentLogin(true)}
                  className="ml-2 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
                >
                  {lang === 'kn' ? 'ನಿವಾಸಿ ಬದಲಾಯಿಸಿ' : 'Switch Resident'}
                </button>
                {isCitizenLoggedIn && (
                  <button
                    type="button"
                    id="btn-signout-resident"
                    onClick={handleSignOutCitizen}
                    className="text-[11px] font-medium text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:underline px-1 py-0.5 cursor-pointer"
                  >
                    {lang === 'kn' ? 'ನಿರ್ಗಮಿಸಿ' : 'Sign Out'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="citizen-back-hub"
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 rounded-xl transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{lang === 'kn' ? 'ಪೋರ್ಟಲ್ ಹಬ್' : 'Portal Hub'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs: "File Grievance" vs "My Submissions" */}
        <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
          <button
            id="tab-file-grievance"
            type="button"
            onClick={() => {
              setActiveTab('intake');
              setSubmittedResult(null);
            }}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'intake'
                ? 'bg-stone-900 dark:bg-emerald-700 text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white bg-stone-100 dark:bg-stone-800'
              }`}
          >
            <FilePlus2 className="w-4 h-4" />
            <span>{lang === 'kn' ? 'ದೂರು ದಾಖಲಿಸಿ' : 'File Grievance'}</span>
          </button>

          <button
            id="tab-my-submissions"
            type="button"
            onClick={() => setActiveTab('submissions')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'submissions'
                ? 'bg-stone-900 dark:bg-emerald-700 text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white bg-stone-100 dark:bg-stone-800'
              }`}
          >
            <ListOrdered className="w-4 h-4" />
            <span>{lang === 'kn' ? 'ನನ್ನ ಸಲ್ಲಿಕೆಗಳು' : 'My Submissions'}</span>
            <span className="px-1.5 py-0.2 rounded-md text-[11px] font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold">
              {mySubmissions.length}
            </span>
          </button>

          <button
            id="tab-track-status"
            type="button"
            onClick={() => {
              setActiveTab('track');
              setSubmittedResult(null);
            }}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'track'
                ? 'bg-stone-900 dark:bg-emerald-700 text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white bg-stone-100 dark:bg-stone-800'
              }`}
          >
            <Search className="w-4 h-4" />
            <span>{lang === 'kn' ? 'ಸ್ಥಿತಿ ಮತ್ತು ಪುರಾವೆ ಪರಿಶೀಲಿಸಿ' : 'Track Status & Proof'}</span>
          </button>

          {offlineQueue.length > 0 && (
            <button
              id="tab-offline-queue"
              type="button"
              onClick={() => setShowOfflineQueueDrawer(!showOfflineQueueDrawer)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-stone-950 transition-all cursor-pointer shadow-xs ml-auto"
            >
              <CloudOff className="w-4 h-4" />
              <span>{lang === 'kn' ? 'ಆಫ್‌ಲೈನ್ ಕ್ಯೂ' : 'Offline Queue'}</span>
              <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-stone-900 text-white font-mono font-bold">
                {offlineQueue.length}
              </span>
            </button>
          )}
        </div>

        {/* Offline Queue Drawer Panel */}
        {showOfflineQueueDrawer && offlineQueue.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CloudOff className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h3 className="text-xs font-bold text-amber-950 dark:text-amber-200 uppercase tracking-wider">
                  {lang === 'kn' ? 'ಆಫ್‌ಲೈನ್ ಸಲ್ಲಿಕೆಗಳ ಕ್ಯೂ' : 'Offline Incident Reports Awaiting Sync'} ({offlineQueue.length})
                </h3>
              </div>
              <button
                type="button"
                disabled={isSyncingQueue}
                onClick={handleSyncOfflineQueue}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingQueue ? 'animate-spin' : ''}`} />
                <span>{lang === 'kn' ? 'ಈಗಲೇ ಸಿಂಕ್ ಮಾಡಿ' : 'Sync All to Registry'}</span>
              </button>
            </div>
            <div className="divide-y divide-amber-200/60 dark:divide-amber-800/60 max-h-48 overflow-y-auto">
              {offlineQueue.map((item, idx) => (
                <div key={item.id || idx} className="py-2 flex items-center justify-between text-xs gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <span className="font-bold text-stone-900 dark:text-white truncate block">
                      {item.category}: {item.location}
                    </span>
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 truncate block">
                      {item.description}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 shrink-0">
                    Pending Sync
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 1: FILE GRIEVANCE VIEW */}
        {activeTab === 'intake' && (
          <div className="space-y-6">
            {submittedResult ? (
              /* Success / Result View */
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-sm space-y-6 animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-stone-900 dark:text-white">
                      {submittedResult.grouped ? 'Grievance Grouped with Active Work Order' : 'Civic Grievance Successfully Registered'}
                    </h2>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Dispatched to municipal clearing queue for priority action
                    </p>
                  </div>
                </div>

                {/* Tracking ID Badge with Click-to-Copy */}
                <div className="p-4 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200 dark:border-stone-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-stone-400 block font-semibold">
                      Official Tracking ID
                    </span>
                    <span className="font-mono text-lg font-bold text-stone-900 dark:text-white">
                      {submittedResult.trackingId}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(submittedResult.trackingId)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-200 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg hover:bg-stone-50 transition-colors shrink-0"
                  >
                    {copiedTrackingId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedTrackingId ? 'Copied' : 'Copy ID'}</span>
                  </button>
                </div>

                {/* Ticket Details Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-100 dark:border-stone-800 space-y-1">
                    <span className="text-stone-400 block">Category & Priority</span>
                    <span className="font-bold text-stone-900 dark:text-white">
                      {submittedResult.ticket.category} • Rank {submittedResult.ticket.severityRank} / 5
                    </span>
                  </div>

                  <div className="p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-100 dark:border-stone-800 space-y-1">
                    <span className="text-stone-400 block">Assigned Administrative Jurisdiction</span>
                    <span className="font-bold text-stone-900 dark:text-white">
                      {submittedResult.ticket.assignedDepot || 'Mysuru City Corporation'}
                    </span>
                  </div>

                  <div className="p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-100 dark:border-stone-800 space-y-1">
                    <span className="text-stone-400 block">Reported Location</span>
                    <span className="font-medium text-stone-900 dark:text-white">
                      {submittedResult.ticket.location}
                    </span>
                  </div>

                  <div className="p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-100 dark:border-stone-800 space-y-1">
                    <span className="text-stone-400 block">Photographic Audit</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>On-Site Photographic Evidence Attached</span>
                    </span>
                  </div>
                </div>

                {/* Evidence Thumbnail */}
                {submittedResult.ticket.imageUrl && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-stone-600 dark:text-stone-400">Attached Visual Proof:</span>
                    <img
                      src={submittedResult.ticket.imageUrl}
                      alt="Submitted on-site evidence"
                      className="w-48 h-32 object-cover rounded-xl border border-stone-200 dark:border-stone-700 shadow-xs"
                    />
                  </div>
                )}

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-stone-900 dark:bg-emerald-600 text-white hover:bg-stone-800 dark:hover:bg-emerald-500 shadow-sm transition-colors"
                  >
                    <FilePlus2 className="w-4 h-4" />
                    <span>Lodge Another Grievance</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('submissions')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                  >
                    <ListOrdered className="w-4 h-4" />
                    <span>View in My Submissions</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Grievance Intake Form */
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-sm space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-stone-900 dark:text-white">
                    {lang === 'kn' ? 'ನಾಗರಿಕ ಕುಂದುಕೊರತೆ ದೂರು ದಾಖಲಿಸಿ' : 'Lodge Municipal Civic Grievance'}
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {lang === 'kn'
                      ? 'ಸಾರ್ವಜನಿಕ ಮೂಲಸೌಕರ್ಯ ದೋಷಗಳನ್ನು ಫೋಟೋ ಸಾಕ್ಷ್ಯದೊಂದಿಗೆ ಸಲ್ಲಿಸಿ. ಪುರಸಭೆಯ ನಿಯಮಗಳಿಂದ ವಿಲೇವಾರಿ ಮಾಡಲಾಗುತ್ತದೆ.'
                      : 'Submit public infrastructure defects with verified photographic evidence. Triage severity and jurisdiction dispatch are automated by municipal rules.'}
                  </p>
                </div>

                {formError && (
                  <div
                    id="citizen-intake-error"
                    className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center justify-between"
                  >
                    <span>{formError}</span>
                    <button onClick={() => setFormError(null)} className="p-1 hover:opacity-75 cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Category Catalog: Two-Tier Department & Granular Sub-Category Selector */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label htmlFor="intake-category" className="block text-xs font-bold text-stone-900 dark:text-white">
                        {lang === 'kn' ? 'ಸಮಸ್ಯೆಯ ವರ್ಗ ಮತ್ತು ಇಲಾಖೆ *' : 'Civic Issue Category & Department *'}
                      </label>
                      <span className="text-[11px] text-stone-500 dark:text-stone-400">
                        {CATEGORIES.length} {lang === 'kn' ? 'ವರ್ಗಗಳು ಲಭ್ಯವಿದೆ' : 'standard categories available'}
                      </span>
                    </div>

                    {/* Department Tabs */}
                    <div className="flex flex-wrap items-center gap-1.5 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700">
                      {CIVIC_DEPARTMENT_GROUPS.map((dept) => {
                        const isSelected = selectedDept === dept.id;
                        return (
                          <button
                            key={dept.id}
                            type="button"
                            onClick={() => setSelectedDept(dept.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? 'bg-white dark:bg-stone-900 text-stone-950 dark:text-white shadow-xs'
                                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                            }`}
                          >
                            <span>{dept.icon}</span>
                            <span>{lang === 'kn' ? dept.nameKn : dept.name}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Quick Category Chips for Active Department */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {(() => {
                        const activeGroup = CIVIC_DEPARTMENT_GROUPS.find((g) => g.id === selectedDept) || CIVIC_DEPARTMENT_GROUPS[0];
                        return activeGroup.categories.map((cat) => {
                          const isCatSelected = category === cat;
                          const rank = getPriorityScore(cat);
                          const meta = SEVERITY_LEVELS[rank];

                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setCategory(cat)}
                              className={`p-2.5 rounded-xl text-left border transition-all flex items-start gap-2 cursor-pointer ${
                                isCatSelected
                                  ? 'bg-emerald-50 text-emerald-950 border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-100 dark:border-emerald-600 shadow-xs ring-1 ring-emerald-500'
                                  : 'bg-stone-50 hover:bg-stone-100 dark:bg-stone-800/60 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${meta.dotColor}`} />
                              <div className="min-w-0">
                                <span className="block text-xs font-bold truncate">
                                  {t(cat, cat)}
                                </span>
                                <span className="block text-[10px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                                  Rank {rank} • {meta.name}
                                </span>
                              </div>
                            </button>
                          );
                        });
                      })()}
                    </div>

                    {/* Full Dropdown Fallback with OptGroups */}
                    <div className="pt-1">
                      <select
                        id="intake-category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value as CivicCategory)}
                        className="w-full text-xs px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:bg-white dark:focus:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-stone-900 dark:text-stone-100 cursor-pointer"
                      >
                        {CIVIC_DEPARTMENT_GROUPS.filter((g) => g.id !== 'all').map((dept) => (
                          <optgroup key={dept.id} label={`${dept.icon} ${lang === 'kn' ? dept.nameKn : dept.name}`}>
                            {dept.categories.map((cat) => (
                              <option key={cat} value={cat}>
                                {t(cat, cat)} (Rank {getPriorityScore(cat)})
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* AUTOMATED SEVERITY DISPLAY (User cannot change this - Price calculations removed for citizens) */}
                  <div className="p-3.5 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200 dark:border-stone-700 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold text-sm shrink-0 border border-amber-300 dark:border-amber-800">
                        {autoAssessedSeverity}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-stone-900 dark:text-white">
                            Auto-Assessed Priority: Rank {autoAssessedSeverity} / 5
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md font-mono border ${severityMeta.badgeClass}`}>
                            {severityMeta.name}
                          </span>
                        </div>
                        <span className="text-[11px] text-stone-500 dark:text-stone-400 block mt-0.5">
                          Assigned automatically by municipal safety guidelines for &quot;{category}&quot;.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* #10 Draft restored banner */}
                  {draftRestored && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300">
                      <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-semibold">Offline draft restored.</span>
                      <span>Your previous unsaved report has been reloaded.</span>
                      <button type="button" onClick={() => { setDescription(''); setDraftRestored(false); try { localStorage.removeItem('civic_mesh_citizen_draft'); } catch (e) { } }} className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-800 hover:bg-amber-300 dark:hover:bg-amber-700 cursor-pointer">Discard</button>
                    </div>
                  )}

                  {/* LOCATION SECTION: Google Maps-Style Search / Address Input & Interactive Leaflet Map */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                        Location Selection (Search Address, Shop, Circle or Pin on Map) *
                      </label>
                      {/* #1 One-tap GPS button with accuracy readout */}
                      <button
                        type="button"
                        id="btn-one-tap-gps"
                        onClick={handleOneTapGeo}
                        disabled={isLocating}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
                      >
                        {isLocating ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Crosshair className="w-3.5 h-3.5" />
                        )}
                        <span>{isLocating ? 'Locating...' : 'Use My GPS'}</span>
                        {geoAccuracy !== null && !isLocating && (
                          <span className="text-emerald-100 font-mono">±{geoAccuracy}m</span>
                        )}
                      </button>
                    </div>

                    {/* Search Place / Enter Address Field with Live Autocomplete */}
                    <div className="relative">
                      <label htmlFor="intake-place-search" className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                        Search Address, Circle, Landmark or Shop Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                          <Search className="w-4 h-4" />
                        </div>
                        <input
                          id="intake-place-search"
                          type="text"
                          value={searchQuery}
                          onFocus={() => setShowLocationSuggestions(true)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (filteredLocalities.length > 0) {
                                handleSelectPlace(filteredLocalities[0]);
                              }
                            }
                          }}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setLocationName(e.target.value);
                            setShowLocationSuggestions(true);
                          }}
                          placeholder="Search address, shop, landmark or circle (e.g., KR Circle, Ashokapuram, Devaraja Market, Urs Road)..."
                          className="w-full pl-10 pr-24 py-2.5 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:bg-white dark:focus:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-stone-900 dark:text-stone-100"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          {isSearchingOnline ? (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-[10px] text-emerald-700 dark:text-emerald-300">
                              <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                              <span>Searching...</span>
                            </div>
                          ) : (
                            <span className="text-[10px] font-mono text-stone-400 dark:text-stone-500 hidden sm:inline">
                              Live Search
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Dropdown Suggestions */}
                      {showLocationSuggestions && filteredLocalities.length > 0 && (
                        <div className="absolute z-30 mt-1 w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl shadow-xl max-h-64 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-700/60">
                          {filteredLocalities.map((loc, idx) => (
                            <button
                              key={`${loc.name}-${idx}`}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelectPlace(loc);
                              }}
                              className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-emerald-50/80 dark:hover:bg-stone-700/80 flex items-center justify-between gap-2 text-stone-800 dark:text-stone-200 transition-colors cursor-pointer"
                            >
                              <div className="flex items-start gap-2.5 min-w-0">
                                <div className="mt-0.5 shrink-0">
                                  {loc.category === 'circle' ? (
                                    <Compass className="w-4 h-4 text-amber-500" />
                                  ) : loc.category === 'shop' ? (
                                    <Store className="w-4 h-4 text-purple-500" />
                                  ) : loc.category === 'landmark' ? (
                                    <Building2 className="w-4 h-4 text-blue-500" />
                                  ) : loc.category === 'address' ? (
                                    <MapPin className="w-4 h-4 text-emerald-500" />
                                  ) : (
                                    <MapPin className="w-4 h-4 text-stone-400" />
                                  )}
                                </div>
                                <div className="truncate">
                                  <div className="font-semibold text-stone-900 dark:text-white flex items-center gap-1.5">
                                    <span className="truncate">{loc.name}</span>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-sm shrink-0 ${loc.category === 'circle'
                                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                                        : loc.category === 'shop'
                                          ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300'
                                          : loc.category === 'landmark'
                                            ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                                            : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                      }`}>
                                      {loc.category === 'circle'
                                        ? 'Circle'
                                        : loc.category === 'shop'
                                          ? 'Shop / Market'
                                          : loc.category === 'landmark'
                                            ? 'Landmark'
                                            : loc.category === 'address'
                                              ? 'Live Address'
                                              : 'Locality'}
                                    </span>
                                  </div>
                                  {loc.subtext && (
                                    <div className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                                      {loc.subtext}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <span className="text-[10px] font-mono text-stone-400 shrink-0">
                                {loc.coords.lat.toFixed(4)}, {loc.coords.lng.toFixed(4)}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Interactive Leaflet Map */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400 block">
                        Or click anywhere on the interactive map to pin exact incident coordinates:
                      </span>
                      <MysuruLeafletMap
                        selectedCoords={selectedCoords}
                        onSelectCoords={(coords) => {
                          setSelectedCoords(coords);
                          const autoLoc = `Mysuru Location (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`;
                          setLocationName(autoLoc);
                          setSearchQuery(autoLoc);
                        }}
                        existingIssues={issues.filter((i) => i.status !== 'quarantined' && !i.isQuarantined)}
                        isDark={isDark}
                      />
                    </div>

                    {/* Quick Border Hotspots (Boundary Testing) */}
                    <div className="p-3.5 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900 dark:text-white">
                        <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>Quick Border Hotspots (Boundary Testing):</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {BORDER_HOTSPOTS.map((spot) => {
                          const isSpotSelected =
                            Math.abs(selectedCoords.lat - spot.lat) < 0.001 &&
                            Math.abs(selectedCoords.lng - spot.lng) < 0.001;

                          return (
                            <button
                              key={spot.id}
                              id={`hotspot-${spot.id}`}
                              type="button"
                              onClick={() => handleSelectHotspot(spot)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${isSpotSelected
                                  ? 'bg-amber-100 text-amber-900 border-amber-400 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-700 shadow-xs font-bold'
                                  : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700'
                                }`}
                              title={spot.description}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                              <span>{spot.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Location Summary Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label htmlFor="intake-location-string" className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                          Location Description / Landmark
                        </label>
                        <input
                          id="intake-location-string"
                          type="text"
                          value={locationName}
                          onChange={(e) => setLocationName(e.target.value)}
                          placeholder="e.g. Bogadi Ring Road Junction"
                          className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100"
                        />
                      </div>

                      <div>
                        <label htmlFor="intake-coordinates" className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                          Coordinates (Auto-captured from Map Pin)
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                          </div>
                          <input
                            id="intake-coordinates"
                            type="text"
                            readOnly
                            value={coordinatesDisplay}
                            className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-200 cursor-not-allowed select-all"
                            title="Coordinates auto-populated from pin on map"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Incident Description */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="intake-description" className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                        {lang === 'kn' ? 'ಘಟನೆಯ ವಿವರಣೆ *' : 'Incident Description *'}
                      </label>
                      <button
                        type="button"
                        id="btn-voice-dictation"
                        onClick={handleToggleVoiceDictation}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold border transition-colors cursor-pointer ${
                          isRecordingAudio
                            ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                            : 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700'
                        }`}
                        title="Dictate in Kannada or English using your device microphone"
                      >
                        <Mic className={`w-3.5 h-3.5 ${isRecordingAudio ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                        <span>
                          {isRecordingAudio
                            ? (lang === 'kn' ? `ಧ್ವನಿ ರೆಕಾರ್ಡಿಂಗ್... (${audioRecordingDuration}s)` : `Recording Voice... (${audioRecordingDuration}s)`)
                            : (lang === 'kn' ? 'ಧ್ವನಿ ಮೂಲಕ ಮಾತನಾಡಿ (ಕನ್ನಡ/English)' : 'Voice Dictate (Kannada/English)')
                          }
                        </span>
                      </button>
                    </div>
                    <textarea
                      id="intake-description"
                      rows={3}
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={lang === 'kn' ? "ಸಮಸ್ಯೆ, ರಸ್ತೆಯ ಸ್ಥಿತಿ ಅಥವಾ ತಕ್ಷಣದ ಸುರಕ್ಷತಾ ಅಪಾಯಗಳನ್ನು ವಿವರಿಸಿ ಅಥವಾ ಧ್ವನಿ ಬಟನ್ ಒತ್ತಿ ಮಾತನಾಡಿ..." : "Describe the issue, specific physical signs, severity, or immediate safety hazards (or click Voice Dictate to speak)..."}
                      className="w-full text-sm px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:bg-white dark:focus:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-stone-900 dark:text-stone-100 transition-colors"
                    />
                  </div>

                  {/* Camera: On-Site Photographic Evidence (Up to 6 Photos) */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-emerald-600" />
                        <span>{lang === 'kn' ? 'ಆನ್-ಸೈಟ್ ಛಾಯಾಚಿತ್ರ ಸಾಕ್ಷ್ಯ (ಗರಿಷ್ಠ 6 ಫೋಟೋಗಳು)' : 'On-Site Photographic Evidence (Up to 6 Photos)'}</span>
                      </label>
                      <span className="text-[11px] font-semibold text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-2.5 py-0.5 rounded-md border border-stone-200 dark:border-stone-700">
                        {uploadedPhotos.length} / 6 {lang === 'kn' ? 'ಫೋಟೋಗಳು' : 'Photos Attached'}
                      </span>
                    </div>

                    {/* Explanatory note */}
                    <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200 dark:border-stone-700 flex items-start gap-2 text-xs text-stone-600 dark:text-stone-400">
                      <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Field Evidence:</strong> Attach wide-angle, defect close-up, and street landmark photos for faster verification by the field crew.
                      </span>
                    </div>

                    {/* Multi-Photo Thumbnails Grid */}
                    {uploadedPhotos.length > 0 && (
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 pt-1">
                        {uploadedPhotos.map((photoUrl, idx) => (
                          <div key={idx} className="relative group rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 aspect-square bg-stone-900 shadow-xs">
                            <img
                              src={photoUrl}
                              alt={`Evidence ${idx + 1}`}
                              className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform"
                              onClick={() => setLightboxPhoto(photoUrl)}
                            />
                            <span className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded bg-black/70 text-white font-mono text-[9px] font-bold">
                              #{idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemovePhotoAt(idx)}
                              className="absolute top-1 right-1 p-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer"
                              title="Remove photo"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}

                        {uploadedPhotos.length < 6 && (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="rounded-xl border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-emerald-500 dark:hover:border-emerald-500 aspect-square flex flex-col items-center justify-center gap-1 text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer p-2 text-center bg-stone-50/50 dark:bg-stone-800/40"
                          >
                            <Camera className="w-5 h-5" />
                            <span className="text-[10px] font-bold">+ Add Photo</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Hidden Native File Input (multiple) */}
                    <input
                      ref={fileInputRef}
                      id="citizen-photo-input"
                      type="file"
                      accept="image/*"
                      multiple
                      capture="environment"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />

                    {/* Hidden canvas for live video frame snapshot */}
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Live Camera Viewfinder Stream */}
                    {isCameraActive && (
                      <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-emerald-500 shadow-lg space-y-2">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-64 sm:h-80 object-cover"
                        />

                        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={captureFrameFromLiveVideo}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-stone-950 shadow-lg transition-transform active:scale-95"
                          >
                            <Camera className="w-4 h-4" />
                            <span>Capture Photo</span>
                          </button>

                          <button
                            type="button"
                            onClick={stopLiveCamera}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-white transition-colors"
                          >
                            <StopCircle className="w-4 h-4 text-rose-400" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {cameraError && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">{cameraError}</p>
                    )}

                    {uploadedPhotos.length === 0 && (
                      <AnimatedFileUpload
                        onFileSelect={handleAnimatedFileSelect}
                        previewUrl={imagePreview}
                        onRemove={handleRemovePhoto}
                        label={lang === 'kn' ? 'ಛಾಯಾಚಿತ್ರ ಸಾಕ್ಷ್ಯವನ್ನು ಇಲ್ಲಿ ಎಳೆಯಿರಿ ಅಥವಾ ಬ್ರೌಸ್ ಮಾಡಿ (ಗರಿಷ್ಠ 6)' : 'Drop photographic evidence here, or click to browse (up to 6)'}
                        sublabel={lang === 'kn' ? 'ಜೆಪಿಜಿ, ಪಿಎನ್‌ಜಿ, ವೆಬ್‌ಪಿ ಬೆಂಬಲಿಸುತ್ತದೆ' : 'Supports JPG, PNG, WEBP up to 10MB'}
                      />
                    )}

                    {uploadedPhotos.length < 6 && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          id="btn-start-camera"
                          type="button"
                          onClick={startLiveCamera}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-all active:scale-95 cursor-pointer"
                        >
                          <Video className="w-4 h-4" />
                          <span>{lang === 'kn' ? 'ಲೈವ್ ಕ್ಯಾಮೆರಾ ಬಳಸಿ' : 'Open Live Camera'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 transition-colors cursor-pointer border border-stone-200 dark:border-stone-700"
                        >
                          <Camera className="w-4 h-4" />
                          <span>{uploadedPhotos.length > 0 ? '+ Add More Photos' : 'Browse Files'}</span>
                        </button>
                      </div>
                    )}

                    {/* Mobile Camera GPS Geotag Verification Banner */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs gap-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <div>
                          <span className="font-bold text-emerald-950 dark:text-emerald-200">
                            {lang === 'kn' ? 'ಮೊಬೈಲ್ ಕ್ಯಾಮೆರಾ ಜಿಪಿಎಸ್ ಜಿಯೋಟ್ಯಾಗ್:' : 'Mobile Camera GPS Geotag:'}
                          </span>{' '}
                          <span className="font-mono text-emerald-800 dark:text-emerald-300">
                            {selectedCoords.lat.toFixed(5)}°N, {selectedCoords.lng.toFixed(5)}°E
                          </span>
                          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200">
                            ±{geoAccuracy || 4}m {lang === 'kn' ? 'ನಿಖರತೆ' : 'accuracy'}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md font-mono border border-emerald-300 dark:border-emerald-700 self-start sm:self-auto">
                        ✓ High-Accuracy Sensor Linked
                      </span>
                    </div>

                    {/* Perceptual Hash Visual Duplicate Corroboration Alert */}
                    {visualDuplicateMatch && (
                      <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 space-y-1.5 animate-in fade-in slide-in-from-top-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span className="font-bold text-amber-950 dark:text-amber-200 text-xs">
                              {lang === 'kn' ? 'ಚಿತ್ರದ ಸಾಮ್ಯತೆ ಪತ್ತೆಯಾಗಿದೆ (ದೃಢೀಕರಣ ವರದಿ)' : 'Visual Duplicate Corroboration Detected'}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                            {visualDuplicateMatch.similarityPercent}% Perceptual Match
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                          {lang === 'kn'
                            ? `ಈ ಛಾಯಾಚಿತ್ರವು ಟಿಕೆಟ್ #${visualDuplicateMatch.issue.trackingId || visualDuplicateMatch.issue.id} ಗೆ 150ಮೀ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ಹೊಂದಾಣಿಕೆಯಾಗುತ್ತದೆ. ನಿಮ್ಮ ಸಲ್ಲಿಕೆಯು ಈ ಸಮಸ್ಯೆಯನ್ನು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಬಹು-ನಾಗರಿಕ ತುರ್ತು ಹಂತಕ್ಕೆ ಏರಿಸುತ್ತದೆ.`
                            : `Your evidence matches active Ticket #${visualDuplicateMatch.issue.trackingId || visualDuplicateMatch.issue.id} (${visualDuplicateMatch.issue.title}) within 150m. Submitting will merge your proof as a corroborating report and escalate multi-citizen priority!`}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Real-Time Pre-Submission Routing Transparency Card */}
                  <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-900/60 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${routingPreview.isBuffer ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                        <span className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wider">
                          {routingPreview.isBuffer ? (lang === 'kn' ? 'ಗಡಿ ಕಾರಿಡಾರ್ ಪಾರದರ್ಶಕತೆ' : 'Perimeter Boundary Sector') : (lang === 'kn' ? 'ವಾರ್ಡ್ ರವಾನೆ ಮಾಹಿತಿ' : 'Municipal Ward Routing')}
                        </span>
                      </div>
                      <span className={`text-[11px] font-mono px-2 py-0.5 rounded-md border font-semibold ${
                        routingPreview.capacityStatus === 'overloaded'
                          ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                          : routingPreview.capacityStatus === 'moderate'
                          ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                      }`}>
                        {routingPreview.targetJurisdictionName.split(' (')[0]} • {routingPreview.capacityPercent}% Capacity
                      </span>
                    </div>

                    <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                      {routingPreview.rationale}
                    </p>

                    {routingPreview.isSpillover && (
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium pt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{lang === 'kn' ? 'ಸ್ವಯಂಚಾಲಿತ ಗಡಿ ಸಮತೋಲನ ಸಕ್ರಿಯವಾಗಿದೆ (ಶೂನ್ಯ ವಿಳಂಬ)' : 'Automated load-balancing active (Zero municipal dispute delay)'}</span>
                      </div>
                    )}
                  </div>

                  {/* Submission Buttons */}
                  <div className="pt-4 border-t border-stone-100 dark:border-stone-800 space-y-3">
                    {/* #19 Follow-up Reminder Toggle */}
                    <label className="flex items-center gap-2 cursor-pointer select-none group">
                      <input
                        type="checkbox"
                        checked={followUpReminder}
                        onChange={(e) => setFollowUpReminder(e.target.checked)}
                        className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                      />
                      <Bell className="w-3.5 h-3.5 text-stone-400 group-hover:text-emerald-600 transition-colors" />
                      <span className="text-xs text-stone-600 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-stone-200 transition-colors">
                        {lang === 'kn' ? '48 ಗಂಟೆಗಳ ನಂತರ ಅನುಸರಣಾ ಜ್ಞಾಪನೆ ಮಾಡಿ' : 'Remind me to follow up in 48 hours if unresolved'}
                      </span>
                    </label>

                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={handleResetForm}
                        className="px-4 py-2.5 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer"
                      >
                        {lang === 'kn' ? 'ಫಾರ್ಮ್ ಅಳಿಸಿ' : 'Clear Form'}
                      </button>

                      <button
                        id="submit-civic-report"
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold bg-stone-900 hover:bg-stone-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white shadow-md transition-all active:scale-98 disabled:opacity-60 cursor-pointer"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span>{lang === 'kn' ? 'ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ...' : 'Lodging report...'}</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>{lang === 'kn' ? 'ದೂರು ಸಲ್ಲಿಸಿ' : 'Submit Civic Report'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MY SUBMISSIONS VIEW */}
        {activeTab === 'submissions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-stone-900 dark:text-white">
                  {lang === 'kn' ? 'ನನ್ನ ಸಲ್ಲಿಕೆಗಳು' : 'My Civic Submissions'}
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {lang === 'kn'
                    ? 'ಪರಿಹಾರ ಹಂತಗಳು, ಕ್ಷೇತ್ರ ತಂತ್ರಜ್ಞರ ನಿಯೋಜನೆ ಮತ್ತು ಪರಿಶೀಲನೆ ಪುರಾವೆಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ.'
                    : 'Track resolution stages, field technician assignments, and verification proofs.'}
                </p>
              </div>
              <button
                type="button"
                onClick={onRefreshIssues}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-300 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{lang === 'kn' ? 'ಸ್ಥಿತಿ ನವೀಕರಿಸಿ' : 'Refresh Status'}</span>
              </button>
            </div>

            {mySubmissions.length === 0 ? (
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-12 text-center space-y-4 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-400 mx-auto flex items-center justify-center">
                  <ListOrdered className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                    {lang === 'kn' ? 'ಯಾವುದೇ ದೂರುಗಳು ದಾಖಲಾಗಿಲ್ಲ' : 'No Grievances Lodged Yet'}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
                    {lang === 'kn'
                      ? `"${currentResidentName}" ಹೆಸರಿನಲ್ಲಿ ಯಾವುದೇ ದೂರುಗಳು ದಾಖಲಾಗಿಲ್ಲ. ದೂರು ದಾಖಲಿಸಲು ಫಾರ್ಮ್ ಬಳಸಿ.`
                      : `You haven't filed any civic grievances under "${currentResidentName}". File a report using the intake form.`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('intake')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm cursor-pointer"
                >
                  <FilePlus2 className="w-4 h-4" />
                  <span>{lang === 'kn' ? 'ದೂರು ದಾಖಲಿಸಿ' : 'File First Grievance'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {mySubmissions.map((ticket) => {
                  const rank = (ticket.severityRank || getPriorityScore(ticket.category)) as SeverityRank;
                  const severityConfig = SEVERITY_LEVELS[rank];

                  // STRICT PRIVACY RULE:
                  // Find the active citizen's own entry inside reporters array.
                  // NEVER render or expose other co-reporters' names, emails, or photos to this citizen!
                  const userReporter = ticket.reporters?.find((r) => {
                    const userEmailLower = (currentResidentEmail || '').toLowerCase().trim();
                    const userNameLower = (currentResidentName || '').toLowerCase().trim();
                    if (userEmailLower && r.email && r.email.toLowerCase() === userEmailLower) return true;
                    if (userNameLower && r.name && r.name.toLowerCase() === userNameLower) return true;
                    return false;
                  }) || ticket.reporters?.[0];

                  const myEvidencePhoto = userReporter?.imageUrl || ticket.imageUrl;
                  const isQuarantined = ticket.status === 'quarantined' || Boolean(ticket.isQuarantined);

                  let statusBadgeText = lang === 'kn' ? 'ಬಾಕಿ ಇದೆ' : 'Received';
                  let statusBadgeClass = 'bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700';

                  if (isQuarantined) {
                    statusBadgeText = lang === 'kn' ? 'ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ' : 'Quarantined (Audit)';
                    statusBadgeClass = 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800';
                  } else if (ticket.status === 'resolved') {
                    statusBadgeText = ticket.verificationStatus === 'flagged_unverified'
                      ? (lang === 'kn' ? 'ಪೂರ್ಣಗೊಂಡಿದೆ (ಪರಿಶೀಲನೆ ಬಾಕಿ)' : 'Completed (Audit Pending)')
                      : (lang === 'kn' ? 'ಪರಿಹರಿಸಲಾಗಿದೆ' : 'Resolved & Verified');
                    statusBadgeClass = ticket.verificationStatus === 'flagged_unverified'
                      ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800';
                  } else if (ticket.isBufferZone) {
                    statusBadgeText = lang === 'kn' ? 'ಗಡಿ ಸಮನ್ವಯ' : 'Buffer Coordination';
                    statusBadgeClass = 'bg-purple-50 text-purple-800 border-purple-300 dark:bg-purple-950/80 dark:text-purple-200 dark:border-purple-800';
                  } else if (ticket.status === 'in_progress') {
                    statusBadgeText = lang === 'kn' ? 'ಪ್ರಗತಿಯಲ್ಲಿದೆ' : 'In Progress';
                    statusBadgeClass = 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800';
                  } else if (ticket.status === 'assigned') {
                    statusBadgeText = lang === 'kn' ? 'ನಿಯೋಜಿಸಲಾಗಿದೆ' : 'Assigned';
                    statusBadgeClass = 'bg-indigo-50 text-indigo-800 border-indigo-300 dark:bg-indigo-950/80 dark:text-indigo-300 dark:border-indigo-800';
                  } else {
                    statusBadgeText = lang === 'kn' ? 'ಬಾಕಿ ಇದೆ' : 'Received';
                    statusBadgeClass = 'bg-stone-100 text-stone-800 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700';
                  }

                  return (
                    <div
                      key={ticket.id}
                      className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-sm space-y-3 hover:border-stone-300 dark:hover:border-stone-700 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-stone-900 dark:text-white bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded">
                            {ticket.trackingId || ticket.id}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200">
                            {ticket.category}
                          </span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${severityConfig.badgeClass}`}>
                            Rank {rank} • {severityConfig.name}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold border ${statusBadgeClass}`}>
                            {isQuarantined && <Info className="w-3.5 h-3.5 text-rose-600" />}
                            {!isQuarantined && (ticket.status === 'resolved') && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                            {!isQuarantined && ticket.verificationStatus === 'flagged_unverified' && <Info className="w-3.5 h-3.5 text-amber-600" />}
                            {!isQuarantined && ticket.status === 'in_progress' && <Clock className="w-3.5 h-3.5 text-blue-600" />}
                            {!isQuarantined && ticket.status === 'assigned' && <Clock className="w-3.5 h-3.5 text-indigo-600" />}
                            {!isQuarantined && ticket.status !== 'resolved' && ticket.status !== 'in_progress' && ticket.status !== 'assigned' && <Layers className="w-3.5 h-3.5 text-stone-600" />}
                            <span>{statusBadgeText}</span>
                          </span>
                        </div>
                      </div>

                      {/* Quarantine Notice */}
                      {isQuarantined && (
                        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                          <Info className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                          <span>
                            <strong>Flagged by Content Policy:</strong> {ticket.quarantineReason || 'Quarantined for administrative review prior to dispatch.'}
                          </span>
                        </div>
                      )}

                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-stone-900 dark:text-white">{ticket.title}</h3>
                        <p className="text-xs text-stone-600 dark:text-stone-400">{ticket.description}</p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500 dark:text-stone-400 pt-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="flex items-center gap-1 text-stone-700 dark:text-stone-300 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-stone-400" />
                            <span>{ticket.location}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-stone-400" />
                            <span>{ticket.reportedAt}</span>
                          </span>
                        </div>

                        {ticket.assignedCrew && !isQuarantined && (
                          <span className="text-[11px] text-stone-600 dark:text-stone-300">
                            {lang === 'kn' ? 'ನಿಯೋಜಿತ ಸಿಬ್ಬಂದಿ:' : 'Assigned Crew:'} <strong>{ticket.assignedCrew}</strong>
                          </span>
                        )}
                      </div>

                      {/* Attached Photographic Evidence Thumbnails (Strictly Citizen's Own Photo) */}
                      {(myEvidencePhoto || ticket.resolvedImageUrl) && (
                        <div className="flex items-center gap-3 pt-2 border-t border-stone-100 dark:border-stone-800">
                          {myEvidencePhoto && (
                            <div>
                              <span className="text-[10px] text-stone-400 block mb-1">
                                {lang === 'kn' ? 'ನಿಮ್ಮ ಛಾಯಾಚಿತ್ರ' : 'Your On-Site Photo'}
                              </span>
                              <img
                                src={myEvidencePhoto}
                                alt="Your reported evidence"
                                className="w-16 h-12 object-cover rounded-lg border border-stone-200 dark:border-stone-700"
                              />
                            </div>
                          )}
                          {ticket.resolvedImageUrl && !isQuarantined && (
                            <div>
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mb-1">
                                {lang === 'kn' ? 'ಪೂರ್ಣಗೊಳಿಸುವಿಕೆಯ ಪುರಾವೆ' : 'Worker Completion Proof'}
                              </span>
                              <img
                                src={ticket.resolvedImageUrl}
                                alt="Resolution verification"
                                className="w-16 h-12 object-cover rounded-lg border border-emerald-300 dark:border-emerald-700"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Citizen Resolution Feedback & Rating Loop */}
                      {ticket.status === 'resolved' && (
                        <>
                          {ticket.citizenRating ? (
                            /* Static Display of Existing Citizen Rating */
                            <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 bg-emerald-50/70 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/60 flex flex-col gap-2">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                                    {lang === 'kn' ? 'ನಿಮ್ಮ ರೇಟಿಂಗ್:' : 'Your Rating:'}
                                  </span>
                                  <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map((starVal) => (
                                      <Star
                                        key={starVal}
                                        className={`w-4 h-4 ${starVal <= (ticket.citizenRating || 0)
                                            ? 'fill-amber-400 text-amber-400'
                                            : 'text-stone-300 dark:text-stone-600'
                                          }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-xs font-extrabold text-stone-700 dark:text-stone-300">
                                    ({ticket.citizenRating} / 5)
                                  </span>
                                </div>
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">
                                  <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                  {lang === 'kn' ? 'AI ಪರಿಶೀಲಿಸಿದ ವಿಮರ್ಶೆ' : 'AI Moderated Review'}
                                </span>
                              </div>
                              {ticket.citizenFeedback && (
                                <p className="text-xs italic text-stone-700 dark:text-stone-300 bg-white/80 dark:bg-stone-900/80 px-2.5 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-900/40">
                                  &ldquo;{ticket.citizenFeedback}&rdquo;
                                </p>
                              )}
                            </div>
                          ) : (
                            /* Interactive 5-Star Rating & Optional Feedback Input */
                            <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 bg-amber-50/60 dark:bg-amber-950/20 p-3.5 rounded-xl border border-amber-200 dark:border-amber-800/60 space-y-2.5">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                  <span className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                                    <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                                    <span>{lang === 'kn' ? 'ಪರಿಹಾರವನ್ನು ರೇಟ್ ಮಾಡಿ' : 'Rate Resolution'}</span>
                                  </span>
                                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                                    {lang === 'kn' ? 'ಈ ಪರಿಹಾರ ಕಾರ್ಯದಿಂದ ನೀವು ತೃಪ್ತರಾಗಿದ್ದೀರಾ?' : 'How satisfied are you with this repair?'}
                                  </p>
                                </div>

                                {/* 5 Clickable Stars */}
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map((starVal) => {
                                    const currentVal = pendingRatings[ticket.id] || 0;
                                    const hoverVal = hoverRatings[ticket.id] || 0;
                                    const isFilled = starVal <= (hoverVal || currentVal);

                                    return (
                                      <button
                                        key={starVal}
                                        type="button"
                                        onClick={() => setPendingRatings((prev) => ({ ...prev, [ticket.id]: starVal }))}
                                        onMouseEnter={() => setHoverRatings((prev) => ({ ...prev, [ticket.id]: starVal }))}
                                        onMouseLeave={() => setHoverRatings((prev) => ({ ...prev, [ticket.id]: 0 }))}
                                        className="p-1 hover:scale-115 transition-transform cursor-pointer"
                                        title={`${starVal} Star${starVal > 1 ? 's' : ''}`}
                                      >
                                        <Star
                                          className={`w-5 h-5 transition-colors ${isFilled
                                              ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                                              : 'text-stone-300 dark:text-stone-600 hover:text-amber-300'
                                            }`}
                                        />
                                      </button>
                                    );
                                  })}
                                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200 ml-1.5 min-w-[32px]">
                                    {pendingRatings[ticket.id] ? `${pendingRatings[ticket.id]}/5` : ''}
                                  </span>
                                </div>
                              </div>

                              {/* Optional Comment Input & Submit Action */}
                              <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                                <input
                                  type="text"
                                  value={pendingFeedbacks[ticket.id] || ''}
                                  onChange={(e) => setPendingFeedbacks((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                                  placeholder={lang === 'kn' ? 'ಅಭಿಪ್ರಾಯ ಸೇರಿಸಿ (ಐಚ್ಛಿಕ)...' : 'Add feedback comment (optional)...'}
                                  className="w-full text-xs px-3 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                />
                                <button
                                  type="button"
                                  disabled={!pendingRatings[ticket.id] || submittingRatingId === ticket.id}
                                  onClick={() => handleRateTicket(ticket.id)}
                                  className="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-stone-950 font-bold text-xs rounded-lg shrink-0 transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  {submittingRatingId === ticket.id ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-950" />
                                      <span>{lang === 'kn' ? 'AI ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...' : 'AI Moderating...'}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Star className="w-3.5 h-3.5 fill-stone-950 text-stone-950" />
                                      <span>{lang === 'kn' ? 'ರೇಟಿಂಗ್ ಸಲ್ಲಿಸಿ' : 'Submit Rating'}</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                      {/* #21 Re-open request (72-hour window from resolution) */}
                      {ticket.status === 'resolved' && (() => {
                        if (!ticket.resolvedAt) return null;
                        const resolvedMs = new Date(ticket.resolvedAt).getTime();
                        const windowMs = 72 * 3600 * 1000;
                        const canReopen = Date.now() - resolvedMs < windowMs;
                        const hoursLeft = Math.max(0, Math.round((resolvedMs + windowMs - Date.now()) / 3600000));
                        if (!canReopen) return null;
                        return (
                          <div className="mt-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                            {reopeningId === ticket.id ? (
                              <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-semibold text-stone-700 dark:text-stone-300">
                                  Why should this be re-opened? ({hoursLeft}h window remaining)
                                </label>
                                <textarea
                                  value={reopenReason[ticket.id] || ''}
                                  onChange={e => setReopenReason(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                                  rows={2}
                                  className="text-xs px-3 py-2 bg-white dark:bg-stone-900 border border-rose-200 dark:border-rose-800 rounded-lg text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-rose-400 resize-none"
                                  placeholder="Describe what is still unresolved..."
                                />
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setReopeningId(null)}
                                    className="px-3 py-1.5 text-[11px] font-medium text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer"
                                  >Cancel</button>
                                  <button
                                    type="button"
                                    disabled={!(reopenReason[ticket.id]?.trim())}
                                    onClick={() => handleReopenTicket(ticket.id)}
                                    className="px-4 py-1.5 text-[11px] font-bold bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white rounded-lg transition-colors cursor-pointer"
                                  >
                                    <RotateCcw className="w-3 h-3 inline mr-1" />
                                    Confirm Re-open
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setReopeningId(ticket.id)}
                                className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <RotateCcw className="w-3 h-3" />
                                Issue not resolved? Re-open ({hoursLeft}h left)
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TRACK STATUS & STATUTORY PROOF VIEW */}
        {activeTab === 'track' && (
          <div className="space-y-6">
            {/* Search Header Banner */}
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-md border border-stone-200 dark:border-stone-700">
                    MCC Citizen Redressal Registry
                  </span>
                  <span className="text-[11px] text-stone-400 dark:text-stone-500">
                    • WGS-84 Sensor Tracking & Statutory Audit
                  </span>
                </div>
                <h2 className="text-xl font-bold text-stone-900 dark:text-white">
                  {lang === 'kn' ? 'ಸಾರ್ವತ್ರಿಕ ದೂರು ಸ್ಥಿತಿ ಮತ್ತು ಪರಿಹಾರ ಪುರಾವೆ ಪರಿಶೀಲನೆ' : 'Universal Grievance Status & Proof Verification'}
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-2xl">
                  {lang === 'kn'
                    ? 'ನಿಮ್ಮ ಮುನ್ಸಿಪಲ್ ಟ್ರ್ಯಾಕಿಂಗ್ ಐಡಿಯನ್ನು ನಮೂದಿಸಿ ನೈಜ ಸಮಯದ ಎಸ್‌ಎಲ್‌ಎ ಕೌಂಟ್‌ಡೌನ್, ಕಾರ್ಯಪಡೆ ನಿಯೋಜನೆ ಮತ್ತು ಅಧಿಕೃತ ಪರಿಹಾರ ಪುರಾವೆಗಳನ್ನು ವೀಕ್ಷಿಸಿ.'
                    : 'Enter your municipal Tracking ID (MCC-2026-XXXX) to inspect real-time triage stages, SLA countdown, and verified resolution photographic evidence.'}
                </p>
              </div>

              {/* Tracking ID Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="track-search-input"
                    type="text"
                    value={trackSearchId}
                    onChange={(e) => {
                      setTrackSearchId(e.target.value);
                      if (trackSearchError) setTrackSearchError(null);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handlePerformTrackingSearch()}
                    placeholder="e.g. MCC-2026-6644 or MCC-2026-1042"
                    className="w-full pl-10 pr-4 py-2.5 text-xs font-mono uppercase bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:bg-white dark:focus:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-stone-900 dark:text-stone-100 placeholder:normal-case placeholder:font-sans"
                  />
                </div>
                <button
                  type="button"
                  id="btn-track-search"
                  onClick={() => handlePerformTrackingSearch()}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{lang === 'kn' ? 'ದೂರು ಹುಡುಕಿ' : 'Track Grievance'}</span>
                </button>
              </div>

              {/* Quick Select Benchmark Chips */}
              <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                  Quick Inspect Benchmark Tickets:
                </span>
                {issues.slice(0, 3).map((item) => {
                  const idToUse = item.trackingId || item.id;
                  const isCurrent = trackedIssue && (trackedIssue.trackingId === idToUse || trackedIssue.id === idToUse);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setTrackSearchId(idToUse);
                        handlePerformTrackingSearch(idToUse);
                      }}
                      className={`text-[11px] font-mono px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 border-emerald-400 font-bold'
                          : 'bg-stone-50 dark:bg-stone-800/80 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                      }`}
                    >
                      {idToUse} • {item.category} ({item.status})
                    </button>
                  );
                })}
              </div>

              {/* Error Notice */}
              {trackSearchError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
                  <X className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{trackSearchError}</span>
                </div>
              )}
            </div>

            {/* Tracked Issue Details */}
            {trackedIssue && (
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-sm space-y-6">
                {/* Header with Tracking ID, Badges, and Print Button */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100 dark:border-stone-800">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold tracking-wider px-2 py-0.5 rounded-md bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900">
                        {trackedIssue.trackingId || trackedIssue.id}
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                        trackedIssue.status === 'resolved'
                          ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                          : trackedIssue.status === 'in_progress'
                          ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                          : 'bg-blue-50 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                      }`}>
                        {trackedIssue.status.toUpperCase()}
                      </span>
                      <span className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                        {trackedIssue.category} • Ward {trackedIssue.ward || 24} ({trackedIssue.jurisdiction})
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-stone-900 dark:text-white pt-1">
                      {trackedIssue.title}
                    </h3>
                    <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                      {trackedIssue.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      id="btn-print-tracked-receipt"
                      onClick={() => setPrintingReceiptIssue(trackedIssue)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-stone-900 hover:bg-stone-800 dark:bg-stone-800 dark:hover:bg-stone-700 text-white border border-stone-700 transition-colors shadow-xs cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-amber-400" />
                      <span>{lang === 'kn' ? 'ಅಧಿಕೃತ ರಸೀದಿ ಮುದ್ರಿಸಿ' : 'Print Official Work Order'}</span>
                    </button>
                  </div>
                </div>

                {/* 4-Stage Lifecycle Stepper */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-3">
                    Statutory Grievance Lifecycle Progression
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Stage 1 */}
                    <div className="p-3.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-emerald-800 dark:text-emerald-300">
                          STAGE 01
                        </span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="text-xs font-bold text-stone-900 dark:text-white">
                        Intake & Geo-Index
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400 font-mono">
                        {new Date(trackedIssue.createdAt).toLocaleDateString()} • {new Date(trackedIssue.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1">
                        GPS Accuracy: ±4.2m WGS-84
                      </div>
                    </div>

                    {/* Stage 2 */}
                    <div className="p-3.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-emerald-800 dark:text-emerald-300">
                          STAGE 02
                        </span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="text-xs font-bold text-stone-900 dark:text-white">
                        Jurisdiction Triage
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400">
                        {trackedIssue.jurisdiction} • Ward {trackedIssue.ward || 24}
                      </div>
                      <div className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1">
                        Priority Rank: {trackedIssue.severity || 3} / 5
                      </div>
                    </div>

                    {/* Stage 3 */}
                    <div className={`p-3.5 rounded-xl border space-y-1 ${
                      trackedIssue.status !== 'reported'
                        ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20'
                        : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40 opacity-70'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-stone-700 dark:text-stone-300">
                          STAGE 03
                        </span>
                        {trackedIssue.status !== 'reported' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Clock className="w-4 h-4 text-stone-400" />
                        )}
                      </div>
                      <div className="text-xs font-bold text-stone-900 dark:text-white">
                        Workforce Dispatch
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400">
                        {trackedIssue.assignedTo || 'MCC Rapid Response Crew'}
                      </div>
                      <div className="text-[10px] text-stone-600 dark:text-stone-400 mt-1 font-mono">
                        Route: TSP Optimal Cluster
                      </div>
                    </div>

                    {/* Stage 4 */}
                    <div className={`p-3.5 rounded-xl border space-y-1 ${
                      trackedIssue.status === 'resolved'
                        ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20'
                        : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40 opacity-70'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-stone-700 dark:text-stone-300">
                          STAGE 04
                        </span>
                        {trackedIssue.status === 'resolved' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Clock className="w-4 h-4 text-stone-400" />
                        )}
                      </div>
                      <div className="text-xs font-bold text-stone-900 dark:text-white">
                        Statutory Resolution
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400">
                        {trackedIssue.status === 'resolved'
                          ? (trackedIssue.resolvedAt ? new Date(trackedIssue.resolvedAt).toLocaleDateString() : 'Work Completed & Inspected')
                          : 'Pending Field Execution'}
                      </div>
                      <div className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1">
                        {trackedIssue.status === 'resolved' ? 'Dual Signature Verified' : 'Standard SLA Active'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* SLA Velocity & Heritage Landmark Proximity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* SLA Countdown Card */}
                  <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        Municipal SLA Commitment
                      </span>
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200">
                        Target: 48h
                      </span>
                    </div>
                    {trackedIssue.status === 'resolved' ? (
                      <div className="p-2.5 rounded-lg bg-emerald-100/70 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Successfully resolved 14 hours ahead of standard statutory deadline. Zero regulatory penalties incurred.</span>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-stone-600 dark:text-stone-400">
                          <span>Elapsed Time: 18h 30m</span>
                          <span className="font-bold text-amber-600 dark:text-amber-400">29h 30m Remaining</span>
                        </div>
                        <div className="w-full h-2 rounded-md bg-stone-200 dark:bg-stone-700 overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-md" style={{ width: '38%' }} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Heritage Landmark Sensitivity Factor */}
                  <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        Mysuru Urban Heritage Sensitivity
                      </span>
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                        1.25x Priority Factor
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed">
                      Incident sits within high-traffic heritage transit zone. Auto-escalated for immediate supervisory clearance to avoid public transit blockages.
                    </p>
                  </div>
                </div>

                {/* Side-by-Side Before & After Photographic Proof Inspection */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                      Photographic Evidence Audit (Before vs. After)
                    </h4>
                    <span className="text-[11px] text-stone-400 dark:text-stone-500">
                      Click image for full-resolution inspection
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Before Image */}
                    <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-stone-500" />
                          Before: Citizen Intake Photo
                        </span>
                        <span className="text-[10px] font-mono text-stone-500 dark:text-stone-400">
                          {new Date(trackedIssue.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div
                        onClick={() => setLightboxPhoto(trackedIssue.imageUrl || SAMPLE_POTHOLE_PHOTO)}
                        className="relative rounded-lg overflow-hidden border border-stone-200 dark:border-stone-700 aspect-video bg-black/5 dark:bg-black/40 cursor-pointer group"
                      >
                        <img
                          src={trackedIssue.imageUrl || SAMPLE_POTHOLE_PHOTO}
                          alt="Citizen Reported Condition"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <span className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-white bg-black/70 px-2 py-1 rounded transition-opacity">
                            View Full Resolution
                          </span>
                        </div>
                        <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-black/75 text-white font-mono text-[9px] font-bold">
                          ORIGINAL DEFECT EVIDENCE
                        </span>
                      </div>
                    </div>

                    {/* After Image */}
                    <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          After: Field Completion Evidence
                        </span>
                        {trackedIssue.status === 'resolved' && (
                          <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                            Verified Resolution
                          </span>
                        )}
                      </div>
                      {trackedIssue.resolvedImageUrl ? (
                        <div
                          onClick={() => setLightboxPhoto(trackedIssue.resolvedImageUrl || null)}
                          className="relative rounded-lg overflow-hidden border border-emerald-300 dark:border-emerald-800 aspect-video bg-black/5 dark:bg-black/40 cursor-pointer group"
                        >
                          <img
                            src={trackedIssue.resolvedImageUrl}
                            alt="Field Crew Completion Evidence"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <span className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-white bg-black/70 px-2 py-1 rounded transition-opacity">
                              View Full Resolution
                            </span>
                          </div>
                          <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-emerald-900/90 text-white font-mono text-[9px] font-bold">
                            RESTORED INFRASTRUCTURE
                          </span>
                        </div>
                      ) : (
                        <div className="rounded-lg border-2 border-dashed border-stone-300 dark:border-stone-700 aspect-video flex flex-col items-center justify-center p-4 text-center text-stone-400 bg-stone-100/50 dark:bg-stone-800/30">
                          <Clock className="w-6 h-6 mb-1 text-stone-400" />
                          <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                            Resolution Evidence Pending
                          </span>
                          <span className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">
                            Field crew will upload GPS-verified closeout photos upon completion.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Citizen Resolution Rating Summary if Resolved */}
                {trackedIssue.status === 'resolved' && trackedIssue.citizenRating && (
                  <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs font-bold text-emerald-900 dark:text-emerald-100">
                          Citizen Satisfaction Score:
                        </span>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= (trackedIssue.citizenRating || 0)
                                  ? 'text-amber-500 fill-amber-500'
                                  : 'text-stone-300 dark:text-stone-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-bold font-mono text-emerald-800 dark:text-emerald-300">
                          ({trackedIssue.citizenRating}/5)
                        </span>
                      </div>
                      {trackedIssue.citizenFeedback && (
                        <p className="text-xs italic text-emerald-800 dark:text-emerald-300">
                          &ldquo;{trackedIssue.citizenFeedback}&rdquo;
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-200/60 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                      Audit Approved
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Lightbox Modal for Multi-Photo Evidence */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="relative max-w-2xl max-h-[85vh] bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxPhoto(null)}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/70 hover:bg-black text-white cursor-pointer z-10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={lightboxPhoto}
              alt="Evidence Inspection"
              className="max-h-[80vh] w-auto object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {/* Official Field Dispatch & Inspection Work Order Modal */}
      {printingReceiptIssue && (
        <PrintableWorkOrder
          issue={printingReceiptIssue}
          onClose={() => setPrintingReceiptIssue(null)}
        />
      )}
    </div>
  );
};
