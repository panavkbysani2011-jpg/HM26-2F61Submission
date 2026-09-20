export type ViewType = 'landing' | 'citizen' | 'worker' | 'admin-login' | 'admin';

export type IssueStatus = 'reported' | 'assigned' | 'in_progress' | 'resolved' | 'closed';

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
  reportedBy: string;
  assignedCrew?: string;
  assignedVehicle?: string;
  reportedAt: string;
  updatedAt: string;
  loadWeight: number; // 1 to 5
  isBufferZone?: boolean;
  isFlagged?: boolean;
  verificationStatus?: 'verified' | 'flagged_unverified' | 'pending';
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
  authenticatedAt: string;
  authProvider?: 'google' | 'firebase' | 'municipal_desk';
  photoURL?: string;
  firebaseUid?: string;
}

