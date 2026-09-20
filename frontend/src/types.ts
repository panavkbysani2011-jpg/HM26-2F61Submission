export type ViewType = 'landing' | 'citizen' | 'worker-login' | 'worker' | 'admin-login' | 'admin';

export type LanguageType = 'en' | 'kn';

export type IssueStatus = 'reported' | 'assigned' | 'in_progress' | 'resolved' | 'closed' | 'quarantined';

export type IssuePriority = 'low' | 'medium' | 'high' | 'critical';

export type SeverityRank = 1 | 2 | 3 | 4 | 5;

export type CivicCategory =
  | 'Debris'
  | 'Potholes'
  | 'Drainage'
  | 'Streetlights'
  | 'Garbage Dump'
  | 'Roads & Pavement'
  | 'Water & Drainage'
  | 'Electrical & Lighting'
  | 'Waste & Sanitation'
  | 'Parks & Public Spaces';

export const CIVIC_CATEGORIES: readonly CivicCategory[] = [
  'Debris',
  'Potholes',
  'Drainage',
  'Streetlights',
  'Garbage Dump',
  'Roads & Pavement',
  'Water & Drainage',
  'Electrical & Lighting',
  'Waste & Sanitation',
  'Parks & Public Spaces',
] as const;

export type JurisdictionType = 'mcc_zone' | 'town_panchayat' | 'gram_panchayat' | 'buffer_zone';

export interface MysuruJurisdiction {
  id: string;
  name: string;
  type: JurisdictionType;
  baseWorkers: number;
  description: string;
  taluk?: string;
  centerCoords?: { lat: number; lng: number };
}

export interface WorkerRosterEntry {
  jurisdictionId: string;
  name: string;
  vehicle: string;
  role: string;
  jurisdictionName: string;
  zoneType: 'mcc_zone' | 'town_panchayat' | 'gram_panchayat';
}

export interface ReporterInfo {
  name: string;
  email: string;
  timestamp: string;
  imageUrl?: string;
}

export interface CivicIssue {
  id: string;
  trackingId?: string;
  title: string;
  category: CivicCategory;
  description: string;
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  coordinatesStr?: string;
  priority: IssuePriority;
  severityRank: SeverityRank; // Strict 1 to 5
  status: IssueStatus;

  // Primary single reporter string (retained for backward compatibility)
  reportedBy: string;

  // Array-based reporter records
  reporters?: ReporterInfo[];

  // Array-based photographic evidence
  images?: string[];

  assignedCrew?: string;
  assignedCrewLead?: string;
  assignedVehicle?: string;
  assignedJurisdictionId?: string;
  reportedAt: string;
  updatedAt: string;
  loadWeight: number; // 1 to 5
  isBufferZone?: boolean;
  targetJurisdictionId?: string; // e.g., 'mcc-zone-3' for live buffer load delegation
  isFlagged?: boolean;
  isQuarantined?: boolean;
  quarantineReason?: string;
  verificationStatus?: 'verified' | 'flagged_unverified' | 'pending' | 'quarantined';
  reportCount?: number;
  imageUrl?: string;
  assignedDepot?: string;
  resolvedImageUrl?: string;
  clearingCost?: number; // In INR (₹) for inter-agency clearing
  adminNotes?: string;
  resolutionNotes?: string;
}

export interface DepartmentCapacity {
  id: string;
  name: string;
  activeWorkers: number;
  currentLoad: number; // total load weight
  maxCapacity: number;
  status: 'optimal' | 'moderate' | 'overloaded';
}

export interface UserSession {
  id: string;
  name: string;
  email?: string;
  role: 'citizen' | 'worker' | 'admin';
  badge?: string;
  vehicle?: string;
  jurisdictionId?: string;
  jurisdictionName?: string;
  workerRole?: string;
  authenticatedAt: string;
  authProvider?: 'google' | 'firebase' | 'municipal_desk';
  photoURL?: string;
  firebaseUid?: string;
}


