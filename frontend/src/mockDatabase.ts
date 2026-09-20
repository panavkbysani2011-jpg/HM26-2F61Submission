import { CivicIssue, DepartmentCapacity, UserSession, CivicCategory, SeverityRank, MysuruJurisdiction, IssueStatus, IssuePriority, WorkerRosterEntry } from './types';
import { sanitizeImageString } from './utils/imageCompressor';
import { syncIssueToFirestore } from './firebase';

export const ISSUES_STORAGE_KEY = 'civic_mesh_issues_v4';
export const DEPARTMENTS_STORAGE_KEY = 'civic_mesh_departments_v4';
export const SESSION_STORAGE_KEY = 'civic_mesh_active_session_v3';

// Severity 1-5 Metadata Definition
export interface SeverityMeta {
  rank: SeverityRank;
  label: string;
  name: string;
  colorName: 'gray' | 'blue' | 'yellow' | 'orange' | 'red';
  badgeClass: string;
  dotColor: string;
  cardBorderClass: string;
  descriptionExample: string;
  defaultCost: number; // in ₹ INR for clearing ledger
}

export const SEVERITY_LEVELS: Record<SeverityRank, SeverityMeta> = {
  1: {
    rank: 1,
    label: 'Rank 1 (Low / Gray)',
    name: 'Low',
    colorName: 'gray',
    badgeClass: 'bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700',
    dotColor: 'bg-stone-400',
    cardBorderClass: 'border-stone-200 dark:border-stone-800',
    descriptionExample: 'Flickering streetlight, dry foliage',
    defaultCost: 750,
  },
  2: {
    rank: 2,
    label: 'Rank 2 (Minor / Blue)',
    name: 'Minor',
    colorName: 'blue',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800',
    dotColor: 'bg-blue-500',
    cardBorderClass: 'border-blue-200 dark:border-blue-900/60',
    descriptionExample: 'Corner waste accumulation, cracked curb',
    defaultCost: 1500,
  },
  3: {
    rank: 3,
    label: 'Rank 3 (Moderate / Yellow)',
    name: 'Moderate',
    colorName: 'yellow',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800',
    dotColor: 'bg-amber-500',
    cardBorderClass: 'border-amber-300 dark:border-amber-900/60',
    descriptionExample: 'Storm drain blockage, isolated pothole',
    defaultCost: 2500,
  },
  4: {
    rank: 4,
    label: 'Rank 4 (High / Orange)',
    name: 'High',
    colorName: 'orange',
    badgeClass: 'bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-950 dark:text-orange-200 dark:border-orange-800',
    dotColor: 'bg-orange-500',
    cardBorderClass: 'border-orange-300 dark:border-orange-900/80',
    descriptionExample: 'Deep road crater, broken water line',
    defaultCost: 4000,
  },
  5: {
    rank: 5,
    label: 'Rank 5 (Critical / Red)',
    name: 'Critical',
    colorName: 'red',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800',
    dotColor: 'bg-rose-600',
    cardBorderClass: 'border-rose-300 dark:border-rose-900 bg-rose-50/20 dark:bg-rose-950/10',
    descriptionExample: 'Multi-tonne arterial debris, toxic dump',
    defaultCost: 6500,
  },
};

// Priority & Severity mapping based on Category
export const getPriorityScore = (category: CivicCategory | string): SeverityRank => {
  switch (category) {
    case 'Debris':
      return 5;
    case 'Potholes':
    case 'Roads & Pavement':
      return 4;
    case 'Drainage':
    case 'Water & Drainage':
      return 3;
    case 'Garbage Dump':
    case 'Waste & Sanitation':
      return 2;
    case 'Streetlights':
    case 'Electrical & Lighting':
      return 1;
    default:
      return 3;
  }
};

export const getEscalationInfo = (rank: SeverityRank) => {
  const meta = SEVERITY_LEVELS[rank] || SEVERITY_LEVELS[3];
  if (rank === 5) {
    return {
      label: 'Rank 5 - Critical / Zonal Escalate',
      badgeClass: meta.badgeClass,
      dotColor: meta.dotColor,
      level: 'critical',
    };
  }
  if (rank === 4) {
    return {
      label: 'Rank 4 - High Priority',
      badgeClass: meta.badgeClass,
      dotColor: meta.dotColor,
      level: 'high',
    };
  }
  if (rank === 3) {
    return {
      label: 'Rank 3 - Moderate',
      badgeClass: meta.badgeClass,
      dotColor: meta.dotColor,
      level: 'medium',
    };
  }
  if (rank === 2) {
    return {
      label: 'Rank 2 - Minor',
      badgeClass: meta.badgeClass,
      dotColor: meta.dotColor,
      level: 'minor',
    };
  }
  return {
    label: 'Rank 1 - Low',
    badgeClass: meta.badgeClass,
    dotColor: meta.dotColor,
    level: 'low',
  };
};

// All 9 MCC Zones, 4 Town Panchayats/TMCs, 8 Gram Panchayats, and Buffer Zones across Mysuru
export const MYSURU_JURISDICTIONS: MysuruJurisdiction[] = [
  // 9 Mysuru City Corporation (MCC) Zones
  { id: 'mcc-zone-1', name: 'MCC Zone 1 (Ashokapuram / Vani Vilas)', type: 'mcc_zone', baseWorkers: 16, description: 'South-central municipal zone covering Ashokapuram, Vani Vilas, and Krishnamurthypuram.' },
  { id: 'mcc-zone-2', name: 'MCC Zone 2 (Krishnaraja / Agrahara)', type: 'mcc_zone', baseWorkers: 18, description: 'Core heritage zone covering Krishnaraja Boulevard, Agrahara, and Chamundipuram.' },
  { id: 'mcc-zone-3', name: 'MCC Zone 3 (Saraswathipuram / Chamarajapuram)', type: 'mcc_zone', baseWorkers: 16, description: 'Educational and administrative hub covering Saraswathipuram, Jayalakshmipuram, and Chamarajapuram.' },
  { id: 'mcc-zone-4', name: 'MCC Zone 4 (Nazarbad / Lashkar Mohalla)', type: 'mcc_zone', baseWorkers: 17, description: 'Eastern central zone covering Nazarbad, Lashkar Mohalla, and Zoo environs.' },
  { id: 'mcc-zone-5', name: 'MCC Zone 5 (Bannimantap / Mandi Mohalla)', type: 'mcc_zone', baseWorkers: 15, description: 'Northern trade and transport boundary covering Bannimantap, Mandi Mohalla, and Torchlight ground.' },
  { id: 'mcc-zone-6', name: 'MCC Zone 6 (Tilak Nagar / Yadavagiri)', type: 'mcc_zone', baseWorkers: 14, description: 'North-western zone covering Tilak Nagar, Yadavagiri, and Medar Block.' },
  { id: 'mcc-zone-7', name: 'MCC Zone 7 (Hebbal / KRS Road)', type: 'mcc_zone', baseWorkers: 16, description: 'Major IT and industrial corridor covering Hebbal Industrial Area, Kumbarakoppal, and KRS Road.' },
  { id: 'mcc-zone-8', name: 'MCC Zone 8 (Kuvempunagar / Ramakrishnanagar)', type: 'mcc_zone', baseWorkers: 18, description: 'Dense residential south-western zone covering Kuvempunagar, Ramakrishnanagar, and Dattagalli.' },
  { id: 'mcc-zone-9', name: 'MCC Zone 9 (Chamundipuram / Ittegagudu)', type: 'mcc_zone', baseWorkers: 14, description: 'South-eastern zone bordering Chamundi Hills foothills, Ittegagudu, and Siddartha Layout.' },

  // 4 Town Municipal Councils / Town Panchayats (TP/TMC)
  { id: 'tp-bogadi', name: 'Bogadi Town Panchayat', type: 'town_panchayat', baseWorkers: 11, description: 'Rapidly expanding western peripheral town panchayat adjoining Outer Ring Road.' },
  { id: 'tp-hootagalli', name: 'Hootagalli Town Municipal Council (TMC)', type: 'town_panchayat', baseWorkers: 14, description: 'Western industrial township bordering Belavadi, Koorgalli, and Koorgalli BEML.' },
  { id: 'tp-kadakola', name: 'Kadakola Town Panchayat', type: 'town_panchayat', baseWorkers: 11, description: 'Southern industrial growth corridor on Mysuru-Nanjangud Highway.' },
  { id: 'tp-rammanahalli', name: 'Rammanahalli Town Panchayat', type: 'town_panchayat', baseWorkers: 10, description: 'North-eastern urbanizing boundary on Mahadevapura and Peripheral Ring Road.' },

  // 8 Surrounding Gram Panchayats (GP)
  { id: 'gp-belavadi', name: 'Belavadi Gram Panchayat', type: 'gram_panchayat', baseWorkers: 8, description: 'Rural-urban fringe adjoining Hootagalli industrial zone and western ring road.' },
  { id: 'gp-alanahalli', name: 'Alanahalli Gram Panchayat', type: 'gram_panchayat', baseWorkers: 8, description: 'Eastern peripheral corridor along T. Narasipura & Bannur Road.' },
  { id: 'gp-siddalingapura', name: 'Siddalingapura Gram Panchayat', type: 'gram_panchayat', baseWorkers: 7, description: 'Northern gateway panchayat on Bengaluru-Mysuru Expressway entrance.' },
  { id: 'gp-ilavala', name: 'Ilavala Gram Panchayat', type: 'gram_panchayat', baseWorkers: 8, description: 'Western highway corridor towards Bilikere and Hunsur.' },
  { id: 'gp-chamundi-hill', name: 'Chamundi Hill Gram Panchayat', type: 'gram_panchayat', baseWorkers: 7, description: 'Eco-sensitive peripheral panchayat covering hill base, temple steps, and pilgrim trails.' },
  { id: 'gp-koorgalli', name: 'Koorgalli Gram Panchayat', type: 'gram_panchayat', baseWorkers: 8, description: 'Heavy manufacturing and industrial cluster on western periphery.' },
  { id: 'gp-varuna', name: 'Varuna Gram Panchayat', type: 'gram_panchayat', baseWorkers: 7, description: 'South-eastern agricultural-residential transition zone near Varuna lake.' },
  { id: 'gp-dhanagalli', name: 'Dhanagalli Gram Panchayat', type: 'gram_panchayat', baseWorkers: 6, description: 'Southern rural boundary near Jayapura and HD Kote Road.' },

  // Contested Boundary Buffer Zones
  { id: 'buf-bogadi-mcc', name: 'Bogadi-MCC Zone 3 Ring Road Buffer', type: 'buffer_zone', baseWorkers: 6, description: 'Contested 1.6km corridor along Ring Road where municipal and panchayat boundaries overlap.' },
  { id: 'buf-hootagalli-belavadi', name: 'Hootagalli-Belavadi Industrial Buffer', type: 'buffer_zone', baseWorkers: 6, description: 'Contested road cuts and drain corridors along industrial development edge.' },
  { id: 'buf-rammanahalli-prr', name: 'Rammanahalli PRR Boundary Buffer', type: 'buffer_zone', baseWorkers: 5, description: 'Corridor under active road widening with jurisdiction demarcations pending.' },
  { id: 'buf-alanahalli-foothills', name: 'Alanahalli-Chamundi Foothills Buffer', type: 'buffer_zone', baseWorkers: 5, description: 'Eastern entry zone with mixed panchayat and MCC revenue survey numbers.' },
];

// Primary Field Worker Roster: Maps every primary jurisdiction ID (9 MCC zones, 4 Town Panchayats, 8 Gram Panchayats = 21 Total)
// to a unique field worker profile. Buffer corridors are strictly omitted.
export const WORKER_ROSTER: Record<string, WorkerRosterEntry> = {
  // 9 Mysuru City Corporation (MCC) Zones
  'mcc-zone-1': {
    jurisdictionId: 'mcc-zone-1',
    name: 'Basavaraju M.',
    vehicle: 'Canter KA-09-G-3112',
    role: 'Field Operator',
    jurisdictionName: 'MCC Zone 1 (Ashokapuram / Vani Vilas)',
    zoneType: 'mcc_zone',
  },
  'mcc-zone-2': {
    jurisdictionId: 'mcc-zone-2',
    name: 'Shivanna K.',
    vehicle: 'Dumper KA-09-G-5204',
    role: 'Senior Field Lead',
    jurisdictionName: 'MCC Zone 2 (Krishnaraja / Agrahara)',
    zoneType: 'mcc_zone',
  },
  'mcc-zone-3': {
    jurisdictionId: 'mcc-zone-3',
    name: 'Manjunatha S.',
    vehicle: 'Canter KA-09-G-4412',
    role: 'Field Operator',
    jurisdictionName: 'MCC Zone 3 (Saraswathipuram / Chamarajapuram)',
    zoneType: 'mcc_zone',
  },
  'mcc-zone-4': {
    jurisdictionId: 'mcc-zone-4',
    name: 'Syed Nizamuddin',
    vehicle: 'Tipper KA-09-G-8821',
    role: 'Rapid Response Lead',
    jurisdictionName: 'MCC Zone 4 (Nazarbad / Lashkar Mohalla)',
    zoneType: 'mcc_zone',
  },
  'mcc-zone-5': {
    jurisdictionId: 'mcc-zone-5',
    name: 'Mohammed Rafiq',
    vehicle: 'Canter KA-09-G-6744',
    role: 'Field Operator',
    jurisdictionName: 'MCC Zone 5 (Bannimantap / Mandi Mohalla)',
    zoneType: 'mcc_zone',
  },
  'mcc-zone-6': {
    jurisdictionId: 'mcc-zone-6',
    name: 'Nagaraju P.',
    vehicle: 'Mini Truck KA-09-G-2219',
    role: 'Civic Maintenance Lead',
    jurisdictionName: 'MCC Zone 6 (Tilak Nagar / Yadavagiri)',
    zoneType: 'mcc_zone',
  },
  'mcc-zone-7': {
    jurisdictionId: 'mcc-zone-7',
    name: 'Chandrashekar H.',
    vehicle: 'Canter KA-09-G-9930',
    role: 'Field Technician',
    jurisdictionName: 'MCC Zone 7 (Hebbal / KRS Road)',
    zoneType: 'mcc_zone',
  },
  'mcc-zone-8': {
    jurisdictionId: 'mcc-zone-8',
    name: 'Venkatesh Murthy',
    vehicle: 'JCB / Loader KA-09-G-1102',
    role: 'Heavy Crew Operator',
    jurisdictionName: 'MCC Zone 8 (Kuvempunagar / Ramakrishnanagar)',
    zoneType: 'mcc_zone',
  },
  'mcc-zone-9': {
    jurisdictionId: 'mcc-zone-9',
    name: 'Mahesh Kumar R.',
    vehicle: 'Canter KA-09-G-7715',
    role: 'Field Operator',
    jurisdictionName: 'MCC Zone 9 (Chamundipuram / Ittegagudu)',
    zoneType: 'mcc_zone',
  },

  // 4 Town Municipal Councils / Town Panchayats
  'tp-bogadi': {
    jurisdictionId: 'tp-bogadi',
    name: 'Someshwara Gowda',
    vehicle: 'Tractor-Trailer KA-09-EA-1842',
    role: 'Panchayat Squad Lead',
    jurisdictionName: 'Bogadi Town Panchayat',
    zoneType: 'town_panchayat',
  },
  'tp-hootagalli': {
    jurisdictionId: 'tp-hootagalli',
    name: 'Ramegowda N.',
    vehicle: 'Canter KA-09-EA-3390',
    role: 'Industrial Sanitation Lead',
    jurisdictionName: 'Hootagalli Town Municipal Council (TMC)',
    zoneType: 'town_panchayat',
  },
  'tp-kadakola': {
    jurisdictionId: 'tp-kadakola',
    name: 'Devendrappa B.',
    vehicle: 'Tipper KA-09-EA-5501',
    role: 'Highway Corridor Lead',
    jurisdictionName: 'Kadakola Town Panchayat',
    zoneType: 'town_panchayat',
  },
  'tp-rammanahalli': {
    jurisdictionId: 'tp-rammanahalli',
    name: 'Anand Kumar K.',
    vehicle: 'Tractor KA-09-EA-7210',
    role: 'Town Works Operator',
    jurisdictionName: 'Rammanahalli Town Panchayat',
    zoneType: 'town_panchayat',
  },

  // 8 Surrounding Gram Panchayats
  'gp-belavadi': {
    jurisdictionId: 'gp-belavadi',
    name: 'Kariyappa M.',
    vehicle: 'Utility Mini-Truck KA-09-GP-101',
    role: 'Rural Works Supervisor',
    jurisdictionName: 'Belavadi Gram Panchayat',
    zoneType: 'gram_panchayat',
  },
  'gp-alanahalli': {
    jurisdictionId: 'gp-alanahalli',
    name: 'Puttegowda S.',
    vehicle: 'Utility Tractor KA-09-GP-102',
    role: 'Sanitation Inspector',
    jurisdictionName: 'Alanahalli Gram Panchayat',
    zoneType: 'gram_panchayat',
  },
  'gp-siddalingapura': {
    jurisdictionId: 'gp-siddalingapura',
    name: 'Girish Chandra N.',
    vehicle: 'Canter KA-09-GP-103',
    role: 'Expressway Route Lead',
    jurisdictionName: 'Siddalingapura Gram Panchayat',
    zoneType: 'gram_panchayat',
  },
  'gp-ilavala': {
    jurisdictionId: 'gp-ilavala',
    name: 'Lingaraju H.',
    vehicle: 'Utility Tractor KA-09-GP-104',
    role: 'Highway Works Lead',
    jurisdictionName: 'Ilavala Gram Panchayat',
    zoneType: 'gram_panchayat',
  },
  'gp-chamundi-hill': {
    jurisdictionId: 'gp-chamundi-hill',
    name: 'Madegowda C.',
    vehicle: 'Eco Electric Van KA-09-GP-105',
    role: 'Eco-Zone Supervisor',
    jurisdictionName: 'Chamundi Hill Gram Panchayat',
    zoneType: 'gram_panchayat',
  },
  'gp-koorgalli': {
    jurisdictionId: 'gp-koorgalli',
    name: 'Govindaraju T.',
    vehicle: 'Dumper KA-09-GP-106',
    role: 'Manufacturing Belt Lead',
    jurisdictionName: 'Koorgalli Gram Panchayat',
    zoneType: 'gram_panchayat',
  },
  'gp-varuna': {
    jurisdictionId: 'gp-varuna',
    name: 'Siddegowda R.',
    vehicle: 'Utility Tractor KA-09-GP-107',
    role: 'Rural Development Lead',
    jurisdictionName: 'Varuna Gram Panchayat',
    zoneType: 'gram_panchayat',
  },
  'gp-dhanagalli': {
    jurisdictionId: 'gp-dhanagalli',
    name: 'Kempegowda J.',
    vehicle: 'Utility Mini-Truck KA-09-GP-108',
    role: 'Southern Perimeter Operator',
    jurisdictionName: 'Dhanagalli Gram Panchayat',
    zoneType: 'gram_panchayat',
  },
};

export { CIVIC_CATEGORIES } from './types';

// Universal Buffer Zone Adjacency Map: Each buffer zone maps to its two adjacent primary jurisdictions
export const BUFFER_ZONE_ADJACENCY: Record<string, [string, string]> = {
  'buf-bogadi-mcc': ['tp-bogadi', 'mcc-zone-3'],
  'buf-hootagalli-belavadi': ['tp-hootagalli', 'gp-belavadi'],
  'buf-rammanahalli-prr': ['tp-rammanahalli', 'mcc-zone-9'],
  'buf-alanahalli-foothills': ['gp-alanahalli', 'gp-chamundi-hill'],
  'buf-kadakola-nanjangud': ['tp-kadakola', 'mcc-zone-8'],
};

// Detect which buffer zone a location/coordinates fall into (returns buffer zone ID or null)
export const detectBufferZoneId = (locationStr: string, coords?: { lat: number; lng: number }): string | null => {
  const locLower = (locationStr || '').toLowerCase();
  if (locLower.includes('bogadi') && (locLower.includes('buffer') || locLower.includes('ring road'))) return 'buf-bogadi-mcc';
  if (locLower.includes('hootagalli') && (locLower.includes('buffer') || locLower.includes('belavadi'))) return 'buf-hootagalli-belavadi';
  if (locLower.includes('rammanahalli') && (locLower.includes('buffer') || locLower.includes('prr'))) return 'buf-rammanahalli-prr';
  if (locLower.includes('alanahalli') && (locLower.includes('buffer') || locLower.includes('foothills') || locLower.includes('chamundi'))) return 'buf-alanahalli-foothills';
  if (locLower.includes('kadakola') && (locLower.includes('buffer') || locLower.includes('industrial') || locLower.includes('nanjangud'))) return 'buf-kadakola-nanjangud';

  // Geospatial fallback: match coordinates to exact buffer corridor polygon envelopes & centers
  if (coords) {
    // 1. Bogadi-MCC Zone 3 Ring Road Buffer: Lat [12.2890, 12.3120], Lng [76.6110, 76.6260], Center [12.3020, 76.6180]
    if (coords.lat >= 12.2890 && coords.lat <= 12.3120 && coords.lng >= 76.6110 && coords.lng <= 76.6260) return 'buf-bogadi-mcc';
    if (Math.abs(coords.lat - 12.3020) < 0.007 && Math.abs(coords.lng - 76.6180) < 0.007) return 'buf-bogadi-mcc';

    // 2. Hootagalli-Belavadi Industrial Buffer: Lat [12.3310, 12.3480], Lng [76.5710, 76.5860], Center [12.3390, 76.5770]
    if (coords.lat >= 12.3310 && coords.lat <= 12.3480 && coords.lng >= 76.5710 && coords.lng <= 76.5860) return 'buf-hootagalli-belavadi';
    if (Math.abs(coords.lat - 12.3390) < 0.007 && Math.abs(coords.lng - 76.5770) < 0.007) return 'buf-hootagalli-belavadi';

    // 3. Rammanahalli PRR Boundary Buffer: Lat [12.3240, 12.3430], Lng [76.6970, 76.7130], Center [12.3330, 76.7050]
    if (coords.lat >= 12.3240 && coords.lat <= 12.3430 && coords.lng >= 76.6970 && coords.lng <= 76.7130) return 'buf-rammanahalli-prr';
    if (Math.abs(coords.lat - 12.3330) < 0.007 && Math.abs(coords.lng - 76.7050) < 0.007) return 'buf-rammanahalli-prr';

    // 4. Alanahalli-Chamundi Foothills Buffer: Lat [12.2740, 12.2930], Lng [76.6840, 76.7010], Center [12.2830, 76.6920]
    if (coords.lat >= 12.2740 && coords.lat <= 12.2930 && coords.lng >= 76.6840 && coords.lng <= 76.7010) return 'buf-alanahalli-foothills';
    if (Math.abs(coords.lat - 12.2830) < 0.007 && Math.abs(coords.lng - 76.6920) < 0.007) return 'buf-alanahalli-foothills';

    // 5. Kadakola Industrial Border Buffer: Lat [12.2090, 12.2330], Lng [76.6540, 76.6770], Center [12.2210, 76.6660]
    if (coords.lat >= 12.2090 && coords.lat <= 12.2330 && coords.lng >= 76.6540 && coords.lng <= 76.6770) return 'buf-kadakola-nanjangud';
    if (Math.abs(coords.lat - 12.2210) < 0.007 && Math.abs(coords.lng - 76.6660) < 0.007) return 'buf-kadakola-nanjangud';
  }
  return null;
};

// Universal Dynamic Routing: Route buffer zone ticket to the adjacent jurisdiction with lower real-time load
export const routeBufferZoneTicket = (
  bufferZoneId: string,
  currentIssues: CivicIssue[]
): { targetJurisdictionId: string; targetJurisdictionName: string } => {
  const adjacentIds = BUFFER_ZONE_ADJACENCY[bufferZoneId];
  if (!adjacentIds) {
    // Fallback: default to MCC Zone 3
    return { targetJurisdictionId: 'mcc-zone-3', targetJurisdictionName: 'MCC Zone 3 (Saraswathipuram / Chamarajapuram)' };
  }

  const capacities = calculateDynamicCapacities(currentIssues);
  const [idA, idB] = adjacentIds;
  const capA = capacities.find(c => c.jurisdiction.id === idA);
  const capB = capacities.find(c => c.jurisdiction.id === idB);

  const loadA = capA?.capacityPercent ?? 0;
  const loadB = capB?.capacityPercent ?? 0;

  // Route to whichever adjacent jurisdiction has the LOWER current load percentage
  if (loadA <= loadB) {
    const jur = MYSURU_JURISDICTIONS.find(j => j.id === idA);
    return { targetJurisdictionId: idA, targetJurisdictionName: jur?.name || idA };
  } else {
    const jur = MYSURU_JURISDICTIONS.find(j => j.id === idB);
    return { targetJurisdictionId: idB, targetJurisdictionName: jur?.name || idB };
  }
};

// Quick Mysuru Border Landmarks (Boundary Testing)
// Synchronized strictly to lie INSIDE the drawn buffer corridor polygons in AdminLeafletMap
export interface BorderHotspot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description: string;
  category: CivicCategory;
  defaultRank: SeverityRank;
  jurisdictionId: string;
}

export const BORDER_HOTSPOTS: BorderHotspot[] = [
  {
    id: 'spot-bogadi-rr',
    name: 'Bogadi Ring Road Junction',
    lat: 12.3020,
    lng: 76.6180,
    description: 'Contested peripheral junction inside Bogadi-MCC Zone 3 Buffer Zone corridor.',
    category: 'Debris',
    defaultRank: 5,
    jurisdictionId: 'tp-bogadi',
  },
  {
    id: 'spot-hootagalli',
    name: 'Hootagalli-Belavadi Edge',
    lat: 12.3390,
    lng: 76.5770,
    description: 'Peripheral corridor inside Hootagalli-Belavadi Industrial Buffer polygon.',
    category: 'Potholes',
    defaultRank: 4,
    jurisdictionId: 'gp-belavadi',
  },
  {
    id: 'spot-rammanahalli',
    name: 'Rammanahalli PRR Entry',
    lat: 12.3330,
    lng: 76.7050,
    description: 'Proposed Peripheral Ring Road boundary inside Rammanahalli PRR Buffer corridor.',
    category: 'Drainage',
    defaultRank: 3,
    jurisdictionId: 'tp-rammanahalli',
  },
  {
    id: 'spot-alanahalli',
    name: 'Alanahalli T-Junction',
    lat: 12.2830,
    lng: 76.6920,
    description: 'Bannur Road intersection inside Alanahalli-Chamundi Foothills Buffer polygon.',
    category: 'Garbage Dump',
    defaultRank: 2,
    jurisdictionId: 'gp-alanahalli',
  },
  {
    id: 'spot-kadakola',
    name: 'Kadakola Peripheral Gate',
    lat: 12.2210,
    lng: 76.6660,
    description: 'Southern industrial corridor boundary inside Kadakola Industrial Border Buffer.',
    category: 'Streetlights',
    defaultRank: 1,
    jurisdictionId: 'tp-kadakola',
  },
];

// Contested Buffer Zone definition: Boundary corridor where jurisdiction is contested
export const isInsideBufferZone = (lat?: number, lng?: number, isExplicitBuffer?: boolean): boolean => {
  if (isExplicitBuffer) return true;
  if (lat == null || lng == null) return false;

  // 1. Direct match with preset buffer hotspots (exact centers with ±0.007 margin)
  if (Math.abs(lat - 12.3020) < 0.007 && Math.abs(lng - 76.6180) < 0.007) return true; // Bogadi-MCC
  if (Math.abs(lat - 12.3390) < 0.007 && Math.abs(lng - 76.5770) < 0.007) return true; // Hootagalli-Belavadi
  if (Math.abs(lat - 12.3330) < 0.007 && Math.abs(lng - 76.7050) < 0.007) return true; // Rammanahalli PRR
  if (Math.abs(lat - 12.2830) < 0.007 && Math.abs(lng - 76.6920) < 0.007) return true; // Alanahalli-Chamundi
  if (Math.abs(lat - 12.2210) < 0.007 && Math.abs(lng - 76.6660) < 0.007) return true; // Kadakola-Nanjangud

  // 2. Strict rectangular boundary envelopes matching AdminLeafletMap polygonCoords
  // Bogadi-MCC Zone 3 Buffer Zone: Lat [12.2890, 12.3120], Lng [76.6110, 76.6260]
  if (lat >= 12.2890 && lat <= 12.3120 && lng >= 76.6110 && lng <= 76.6260) return true;
  // Hootagalli-Belavadi Industrial Buffer: Lat [12.3310, 12.3480], Lng [76.5710, 76.5860]
  if (lat >= 12.3310 && lat <= 12.3480 && lng >= 76.5710 && lng <= 76.5860) return true;
  // Rammanahalli PRR Boundary Buffer: Lat [12.3240, 12.3430], Lng [76.6970, 76.7130]
  if (lat >= 12.3240 && lat <= 12.3430 && lng >= 76.6970 && lng <= 76.7130) return true;
  // Alanahalli-Chamundi Foothills Buffer: Lat [12.2740, 12.2930], Lng [76.6840, 76.7010]
  if (lat >= 12.2740 && lat <= 12.2930 && lng >= 76.6840 && lng <= 76.7010) return true;
  // Kadakola Industrial Border Buffer: Lat [12.2090, 12.2330], Lng [76.6540, 76.6770]
  if (lat >= 12.2090 && lat <= 12.2330 && lng >= 76.6540 && lng <= 76.6770) return true;

  return false;
};

// Clean realistic sample civic evidence photos (Base64 data URIs)
export const SAMPLE_BOGADI_DEBRIS_PHOTO = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#292524"/>
  <rect y="220" width="600" height="180" fill="#1c1917"/>
  <line x1="0" y1="310" x2="600" y2="310" stroke="#f59e0b" stroke-width="6" stroke-dasharray="24 16"/>
  <!-- Concrete debris rubble -->
  <polygon points="180,260 270,180 340,240 280,280" fill="#78716c" stroke="#a8a29e" stroke-width="3"/>
  <polygon points="250,270 360,190 420,270 330,300" fill="#57534e" stroke="#78716c" stroke-width="2"/>
  <polygon points="120,290 190,240 230,290 160,310" fill="#44403c" stroke="#a8a29e" stroke-width="2"/>
  <polygon points="380,280 460,220 510,280 430,310" fill="#78716c" stroke="#d6d3d1" stroke-width="2"/>
  <circle cx="280" cy="230" r="14" fill="#ef4444" opacity="0.8"/>
  <text x="30" y="50" fill="#ffffff" font-family="monospace" font-size="16" font-weight="bold">ON-SITE CAMERA CAPTURE: BOGADI RING ROAD BUFFER</text>
  <text x="30" y="75" fill="#f59e0b" font-family="monospace" font-size="12">GEO: 12.30200°N, 76.61800°E • TIMESTAMP: 2026-09-19 07:15</text>
  <text x="30" y="95" fill="#a8a29e" font-family="monospace" font-size="12">STATUS: MULTI-TONNE DEMOLITION RUBBLE BLOCKING DUAL CARRIAGEWAY</text>
</svg>`);

export const SAMPLE_BOGADI_POTHOLE_PHOTO = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#334155"/>
  <rect y="180" width="600" height="220" fill="#1e293b"/>
  <ellipse cx="300" cy="280" rx="140" ry="60" fill="#0f172a" stroke="#f97316" stroke-width="4"/>
  <path d="M 220 270 Q 300 320 380 270 Q 330 250 220 270" fill="#020617"/>
  <text x="30" y="50" fill="#ffffff" font-family="monospace" font-size="16" font-weight="bold">ON-SITE CAMERA CAPTURE: BOGADI 2ND STAGE MAIN ROAD</text>
  <text x="30" y="75" fill="#f97316" font-family="monospace" font-size="12">GEO: 12.29850°N, 76.60620°E • TIMESTAMP: 2026-09-19 08:00</text>
  <text x="30" y="95" fill="#94a3b8" font-family="monospace" font-size="12">STATUS: STRUCTURAL TRENCH CRATER DEPTH ~22CM NEAR BUS STAND</text>
</svg>`);

export const SAMPLE_BOGADI_DRAINAGE_PHOTO = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#1e293b"/>
  <rect x="80" y="140" width="440" height="200" fill="#0f172a" stroke="#eab308" stroke-width="4"/>
  <line x1="120" y1="140" x2="120" y2="340" stroke="#475569" stroke-width="8"/>
  <line x1="200" y1="140" x2="200" y2="340" stroke="#475569" stroke-width="8"/>
  <line x1="280" y1="140" x2="280" y2="340" stroke="#475569" stroke-width="8"/>
  <line x1="360" y1="140" x2="360" y2="340" stroke="#475569" stroke-width="8"/>
  <line x1="440" y1="140" x2="440" y2="340" stroke="#475569" stroke-width="8"/>
  <circle cx="280" cy="240" r="30" fill="#ca8a04" opacity="0.6"/>
  <text x="30" y="50" fill="#ffffff" font-family="monospace" font-size="16" font-weight="bold">ON-SITE CAMERA CAPTURE: BOGADI RING ROAD SERVICE LANE</text>
  <text x="30" y="75" fill="#eab308" font-family="monospace" font-size="12">GEO: 12.30120°N, 76.60450°E • TIMESTAMP: 2026-09-19 08:45</text>
  <text x="30" y="95" fill="#94a3b8" font-family="monospace" font-size="12">STATUS: STORMWATER CULVERT SILTATION & OVERFLOW</text>
</svg>`);

export const SAMPLE_BOGADI_WASTE_PHOTO = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#1c1917"/>
  <rect y="240" width="600" height="160" fill="#292524"/>
  <polygon points="160,320 230,220 310,320" fill="#78716c" stroke="#a8a29e" stroke-width="2"/>
  <polygon points="260,330 350,200 440,330" fill="#57534e" stroke="#78716c" stroke-width="2"/>
  <polygon points="380,330 430,250 490,330" fill="#44403c" stroke="#a8a29e" stroke-width="2"/>
  <text x="30" y="50" fill="#ffffff" font-family="monospace" font-size="16" font-weight="bold">ON-SITE CAMERA CAPTURE: BOGADI RADIAL LINK ROAD</text>
  <text x="30" y="75" fill="#f59e0b" font-family="monospace" font-size="12">GEO: 12.29500°N, 76.60900°E • TIMESTAMP: 2026-09-19 09:10</text>
  <text x="30" y="95" fill="#a8a29e" font-family="monospace" font-size="12">STATUS: COMMERCIAL BULK SCRAP & ILLEGAL WASTE DUMP</text>
</svg>`);

export const SAMPLE_MCC3_WATERMAIN_PHOTO = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#0f172a"/>
  <rect y="220" width="600" height="180" fill="#1e293b"/>
  <ellipse cx="300" cy="290" rx="180" ry="70" fill="#0284c7" opacity="0.7"/>
  <line x1="100" y1="290" x2="500" y2="290" stroke="#38bdf8" stroke-width="6"/>
  <circle cx="300" cy="260" r="28" fill="#38bdf8" opacity="0.9"/>
  <text x="30" y="50" fill="#ffffff" font-family="monospace" font-size="16" font-weight="bold">ON-SITE CAMERA CAPTURE: SARASWATHIPURAM 1ST MAIN</text>
  <text x="30" y="75" fill="#38bdf8" font-family="monospace" font-size="12">GEO: 12.29700°N, 76.63500°E • TIMESTAMP: 2026-09-18 16:20</text>
  <text x="30" y="95" fill="#94a3b8" font-family="monospace" font-size="12">STATUS: HIGH-PRESSURE WATER MAIN FRACTURE FLOODING ROADWAY</text>
</svg>`);

export const SAMPLE_MCC3_POTHOLE_PHOTO = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#1e293b"/>
  <rect y="190" width="600" height="210" fill="#0f172a"/>
  <ellipse cx="300" cy="280" rx="120" ry="50" fill="#020617" stroke="#f97316" stroke-width="4"/>
  <rect x="230" y="240" width="140" height="30" fill="#475569" stroke="#94a3b8" stroke-width="2"/>
  <text x="30" y="50" fill="#ffffff" font-family="monospace" font-size="16" font-weight="bold">ON-SITE CAMERA CAPTURE: CHAMARAJAPURAM DOUBLE ROAD</text>
  <text x="30" y="75" fill="#f97316" font-family="monospace" font-size="12">GEO: 12.30150°N, 76.64100°E • TIMESTAMP: 2026-09-19 08:15</text>
  <text x="30" y="95" fill="#94a3b8" font-family="monospace" font-size="12">STATUS: DISLODGED CAST-IRON STORM COVER & OPEN ROAD CAVITY</text>
</svg>`);

export const SAMPLE_RESOLVED_PHOTO = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#14532d"/>
  <rect y="200" width="600" height="200" fill="#166534"/>
  <circle cx="300" cy="180" r="70" fill="#22c55e"/>
  <path d="M 260 180 L 290 210 L 350 150" fill="none" stroke="#ffffff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="30" y="50" fill="#ffffff" font-family="monospace" font-size="16" font-weight="bold">FIELD WORKER AUDIT PROOF: CLEARED & RESOLVED</text>
  <text x="30" y="75" fill="#86efac" font-family="monospace" font-size="12">CREW: Manjunatha S. (MCC Depot 3) • VEHICLE: Canter KA-09-G-4412</text>
  <text x="30" y="95" fill="#dcfce7" font-family="monospace" font-size="12">VERIFICATION: 100% ROADWAY RESTORED & CIVIC SAFETY COMPLIANT</text>
</svg>`);

export const SAMPLE_DEBRIS_PHOTO = SAMPLE_BOGADI_DEBRIS_PHOTO;
export const SAMPLE_POTHOLE_PHOTO = SAMPLE_BOGADI_POTHOLE_PHOTO;
export const SAMPLE_DRAINAGE_PHOTO = SAMPLE_BOGADI_DRAINAGE_PHOTO;

// Demo Reset Seed Data:
// Bogadi Town Panchayat: 4 active tickets, 22 load units (~110% overload)
// MCC Zone 3 (Saraswathipuram): 2 active tickets, 13 load units (~45% load)
// All other jurisdictions: 0 active tickets, 0% load
const INITIAL_ISSUES: CivicIssue[] = [
  // 1. Bogadi Ticket 1 (Core Bogadi Debris, Load 6, Sev 5)
  {
    id: 'ISS-BOG-001',
    trackingId: 'MYS-2026-904121',
    title: 'Multi-Tonne Demolition Debris Spill on Main Road',
    category: 'Debris',
    description: 'Heavy concrete demolition slabs and foundation rubble blocking two lanes of Bogadi Main Road near the panchayat office.',
    location: 'Bogadi Town Panchayat Main Road, Mysuru',
    coordinates: { lat: 12.2965, lng: 76.5860 },
    coordinatesStr: '12.29650, 76.58600',
    priority: 'critical',
    severityRank: 5,
    status: 'assigned',
    reportedBy: 'Raghavendra Rao',
    reporters: [
      {
        name: 'Raghavendra Rao',
        email: 'raghavendra.rao@mysuru.gov.in',
        timestamp: '2026-09-19 07:15',
        imageUrl: SAMPLE_BOGADI_DEBRIS_PHOTO,
      },
    ],
    images: [SAMPLE_BOGADI_DEBRIS_PHOTO],
    assignedCrewLead: 'Someshwara Gowda',
    assignedCrew: 'Someshwara Gowda (Bogadi Town Panchayat)',
    assignedVehicle: 'Tractor-Trailer KA-09-EA-1842',
    assignedDepot: 'Bogadi Town Panchayat',
    assignedJurisdictionId: 'tp-bogadi',
    clearingCost: 6500,
    reportedAt: '2026-09-19 07:15',
    updatedAt: '2026-09-19 08:30',
    loadWeight: 6,
    reportCount: 1,
    isBufferZone: false,
    isFlagged: false,
    imageUrl: SAMPLE_BOGADI_DEBRIS_PHOTO,
  },
  // 2. Bogadi Ticket 2 (Pothole/Trench, Load 6, Sev 5)
  {
    id: 'ISS-BOG-002',
    trackingId: 'MYS-2026-904122',
    title: 'Deep Trench Crater & Road Subsidence near Bogadi Bus Stand',
    category: 'Potholes',
    description: 'Severe asphalt collapse and unpaved excavation trench depth ~22cm causing vehicular stoppage and two-wheeler accidents.',
    location: 'Bogadi 2nd Stage Central Market, Mysuru',
    coordinates: { lat: 12.2925, lng: 76.5840 },
    coordinatesStr: '12.29250, 76.58400',
    priority: 'critical',
    severityRank: 5,
    status: 'reported',
    reportedBy: 'Ananya Gowda',
    reporters: [
      {
        name: 'Ananya Gowda',
        email: 'ananya.gowda@mysuru.gov.in',
        timestamp: '2026-09-19 08:00',
        imageUrl: SAMPLE_BOGADI_POTHOLE_PHOTO,
      },
    ],
    images: [SAMPLE_BOGADI_POTHOLE_PHOTO],
    assignedCrewLead: 'Someshwara Gowda',
    assignedCrew: 'Someshwara Gowda (Bogadi Town Panchayat)',
    assignedVehicle: 'Tractor-Trailer KA-09-EA-1842',
    assignedDepot: 'Bogadi Town Panchayat',
    assignedJurisdictionId: 'tp-bogadi',
    clearingCost: 6500,
    reportedAt: '2026-09-19 08:00',
    updatedAt: '2026-09-19 08:00',
    loadWeight: 6,
    reportCount: 1,
    isBufferZone: false,
    isFlagged: false,
    imageUrl: SAMPLE_BOGADI_POTHOLE_PHOTO,
  },
  // 3. Bogadi Ticket 3 (Core Bogadi Drainage Siltation, Load 5, Sev 4)
  {
    id: 'ISS-BOG-003',
    trackingId: 'MYS-2026-904123',
    title: 'Stormwater Culvert Siltation & Silt Overflow',
    category: 'Drainage',
    description: 'Culvert heavily clogged with silt, construction sediment and plastic waste causing stormwater backflow onto carriageway.',
    location: 'Bogadi Village Panchayat Bus Stop Road, Mysuru',
    coordinates: { lat: 12.2980, lng: 76.5820 },
    coordinatesStr: '12.29800, 76.58200',
    priority: 'high',
    severityRank: 4,
    status: 'reported',
    reportedBy: 'Karthik Somanna',
    reporters: [
      {
        name: 'Karthik Somanna',
        email: 'karthik.somanna@mysuru.gov.in',
        timestamp: '2026-09-19 08:45',
        imageUrl: SAMPLE_BOGADI_DRAINAGE_PHOTO,
      },
    ],
    images: [SAMPLE_BOGADI_DRAINAGE_PHOTO],
    assignedCrewLead: 'Someshwara Gowda',
    assignedCrew: 'Someshwara Gowda (Bogadi Town Panchayat)',
    assignedVehicle: 'Tractor-Trailer KA-09-EA-1842',
    assignedDepot: 'Bogadi Town Panchayat',
    assignedJurisdictionId: 'tp-bogadi',
    clearingCost: 4000,
    reportedAt: '2026-09-19 08:45',
    updatedAt: '2026-09-19 08:45',
    loadWeight: 5,
    reportCount: 1,
    isBufferZone: false,
    isFlagged: false,
    imageUrl: SAMPLE_BOGADI_DRAINAGE_PHOTO,
  },
  // 4. Bogadi Ticket 4 (Waste Dump, Load 5, Sev 4)
  {
    id: 'ISS-BOG-004',
    trackingId: 'MYS-2026-904124',
    title: 'Commercial Bulk Waste & Plastic Dump on Village Road',
    category: 'Garbage Dump',
    description: 'Repeated midnight unauthorized commercial dump of plastic scraps, packing crates and organic waste obstructing walkway.',
    location: 'Bogadi Maramma Temple Street, Mysuru',
    coordinates: { lat: 12.2910, lng: 76.5880 },
    coordinatesStr: '12.29100, 76.58800',
    priority: 'high',
    severityRank: 4,
    status: 'in_progress',
    reportedBy: 'Sunil Kumar',
    reporters: [
      {
        name: 'Sunil Kumar',
        email: 'sunil.kumar@mysuru.gov.in',
        timestamp: '2026-09-19 09:10',
        imageUrl: SAMPLE_BOGADI_WASTE_PHOTO,
      },
    ],
    images: [SAMPLE_BOGADI_WASTE_PHOTO],
    assignedCrewLead: 'Someshwara Gowda',
    assignedCrew: 'Someshwara Gowda (Bogadi Town Panchayat)',
    assignedVehicle: 'Tractor-Trailer KA-09-EA-1842',
    assignedDepot: 'Bogadi Town Panchayat',
    assignedJurisdictionId: 'tp-bogadi',
    clearingCost: 4000,
    reportedAt: '2026-09-19 09:10',
    updatedAt: '2026-09-19 09:30',
    loadWeight: 5,
    reportCount: 1,
    isBufferZone: false,
    isFlagged: false,
    imageUrl: SAMPLE_BOGADI_WASTE_PHOTO,
  },
  // 5. MCC Zone 3 Ticket 1 (Water Main Fracture, Load 7, Sev 5)
  {
    id: 'ISS-MCC3-001',
    trackingId: 'MYS-2026-618290',
    title: 'High-Pressure Water Main Fracture on Saraswathipuram 1st Main',
    category: 'Drainage',
    description: 'Fractured 200mm distribution pipe flooding roadway and undermining pavement foundation opposite Saraswathipuram library.',
    location: 'Saraswathipuram 1st Main Road, MCC Zone 3, Mysuru',
    coordinates: { lat: 12.2970, lng: 76.6350 },
    coordinatesStr: '12.29700, 76.63500',
    priority: 'critical',
    severityRank: 5,
    status: 'in_progress',
    reportedBy: 'Raghavendra Rao',
    reporters: [
      {
        name: 'Raghavendra Rao',
        email: 'raghavendra.rao@mysuru.gov.in',
        timestamp: '2026-09-18 16:20',
        imageUrl: SAMPLE_MCC3_WATERMAIN_PHOTO,
      },
    ],
    images: [SAMPLE_MCC3_WATERMAIN_PHOTO],
    assignedCrewLead: 'Manjunatha S.',
    assignedCrew: 'Manjunatha S. (MCC Zone 3)',
    assignedVehicle: 'Canter KA-09-G-4412',
    assignedDepot: 'MCC Zone 3 (Saraswathipuram / Chamarajapuram)',
    assignedJurisdictionId: 'mcc-zone-3',
    clearingCost: 6500,
    reportedAt: '2026-09-18 16:20',
    updatedAt: '2026-09-19 09:15',
    loadWeight: 7,
    reportCount: 1,
    isBufferZone: false,
    isFlagged: false,
    imageUrl: SAMPLE_MCC3_WATERMAIN_PHOTO,
  },
  // 6. MCC Zone 3 Ticket 2 (Chamarajapuram Pothole / Grate, Load 6, Sev 4)
  {
    id: 'ISS-MCC3-002',
    trackingId: 'MYS-2026-618291',
    title: 'Dislodged Storm Grate & Road Sinkhole on Chamarajapuram Double Road',
    category: 'Potholes',
    description: 'Heavy cast-iron chamber cover cracked and displaced, creating an open 1.2-meter drop hazard in the active traffic lane.',
    location: 'Chamarajapuram Double Road, MCC Zone 3, Mysuru',
    coordinates: { lat: 12.3015, lng: 76.6410 },
    coordinatesStr: '12.30150, 76.64100',
    priority: 'high',
    severityRank: 4,
    status: 'assigned',
    reportedBy: 'Dr. Suresh V.',
    reporters: [
      {
        name: 'Dr. Suresh V.',
        email: 'suresh.v@mysuru.gov.in',
        timestamp: '2026-09-19 08:15',
        imageUrl: SAMPLE_MCC3_POTHOLE_PHOTO,
      },
    ],
    images: [SAMPLE_MCC3_POTHOLE_PHOTO],
    assignedCrewLead: 'Manjunatha S.',
    assignedCrew: 'Manjunatha S. (MCC Zone 3)',
    assignedVehicle: 'Canter KA-09-G-4412',
    assignedDepot: 'MCC Zone 3 (Saraswathipuram / Chamarajapuram)',
    assignedJurisdictionId: 'mcc-zone-3',
    clearingCost: 4000,
    reportedAt: '2026-09-19 08:15',
    updatedAt: '2026-09-19 09:00',
    loadWeight: 6,
    reportCount: 1,
    isBufferZone: false,
    isFlagged: false,
    imageUrl: SAMPLE_MCC3_POTHOLE_PHOTO,
  },
];

const INITIAL_DEPARTMENTS: DepartmentCapacity[] = [
  {
    id: 'dept-bogadi',
    name: 'Bogadi Town Panchayat Fleet',
    activeWorkers: 11,
    currentLoad: 22,
    maxCapacity: 20,
    status: 'overloaded',
  },
  {
    id: 'dept-mcc3',
    name: 'MCC Zone 3 Operations',
    activeWorkers: 16,
    currentLoad: 13,
    maxCapacity: 29,
    status: 'optimal',
  },
  {
    id: 'dept-roads',
    name: 'Road Infrastructure & Pavements',
    activeWorkers: 12,
    currentLoad: 0,
    maxCapacity: 24,
    status: 'optimal',
  },
  {
    id: 'dept-electrical',
    name: 'City Lighting & Power Mesh',
    activeWorkers: 8,
    currentLoad: 0,
    maxCapacity: 16,
    status: 'optimal',
  },
];

// Content Safety Filter
const ABUSIVE_WORDS = ['idiot', 'stupid', 'damn', 'fool', 'cheat'];

export const filterAbusiveContent = (text: string): { sanitizedText: string; isFlagged: boolean } => {
  let isFlagged = false;
  let sanitized = text;

  ABUSIVE_WORDS.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    if (regex.test(sanitized)) {
      isFlagged = true;
      sanitized = sanitized.replace(regex, '***');
    }
  });

  return { sanitizedText: sanitized, isFlagged };
};

// Geospatial Proximity Check (~150 meters)
export const isNearby = (
  coordA?: { lat: number; lng: number },
  coordB?: { lat: number; lng: number },
  thresholdDeg = 0.0018
): boolean => {
  if (!coordA || !coordB) return false;
  const latDiff = Math.abs(coordA.lat - coordB.lat);
  const lngDiff = Math.abs(coordA.lng - coordB.lng);
  return latDiff <= thresholdDeg && lngDiff <= thresholdDeg;
};

// Dynamic auto-calculating jurisdiction capacity based on live active tasks & assigned workforce
export interface DynamicJurisdictionCapacity {
  jurisdiction: MysuruJurisdiction;
  activeIssuesCount: number;
  activeLoad: number;
  maxCapacity: number;
  capacityPercent: number;
  status: 'optimal' | 'moderate' | 'overloaded';
  isSpilloverActive: boolean;
}

export const calculateDynamicCapacities = (issues: CivicIssue[]): DynamicJurisdictionCapacity[] => {
  return MYSURU_JURISDICTIONS.map((jur) => {
    const jurNameLower = jur.name.toLowerCase();
    const jurId = jur.id;

    // Filter issues belonging to this jurisdiction that are still active (not resolved, closed, or quarantined)
    const activeIssues = issues.filter((iss) => {
      if (
        iss.status === 'resolved' || 
        iss.status === 'closed' || 
        iss.status === 'quarantined' || 
        iss.isQuarantined || 
        iss.verificationStatus === 'quarantined'
      ) {
        return false;
      }
      const depot = (iss.assignedDepot || '').toLowerCase();
      const loc = (iss.location || '').toLowerCase();

      // Dynamically routed ticket targeted to this specific jurisdiction
      if (iss.targetJurisdictionId && iss.targetJurisdictionId === jurId) {
        return true;
      }

      if (jur.type === 'buffer_zone') {
        // A buffer zone includes active tickets that are explicitly tagged as buffer corridor tickets
        if (iss.isBufferZone) {
          const corridorId = detectBufferZoneId(iss.location, iss.coordinates) || (jurId === 'buf-bogadi-mcc' ? 'buf-bogadi-mcc' : null);
          if (corridorId === jurId) return true;
        }
        if (jurId === 'buf-bogadi-mcc') return depot.includes('buf-bogadi') || depot.includes('bogadi-mcc zone 3 ring road buffer') || iss.targetJurisdictionId === 'buf-bogadi-mcc';
        if (jurId === 'buf-hootagalli-belavadi') return depot.includes('buf-hootagalli') || depot.includes('hootagalli-belavadi') || iss.targetJurisdictionId === 'buf-hootagalli-belavadi';
        if (jurId === 'buf-rammanahalli-prr') return depot.includes('buf-rammanahalli') || depot.includes('rammanahalli prr') || iss.targetJurisdictionId === 'buf-rammanahalli-prr';
        if (jurId === 'buf-alanahalli-foothills') return depot.includes('buf-alanahalli') || depot.includes('alanahalli-chamundi') || iss.targetJurisdictionId === 'buf-alanahalli-foothills';
        if (jurId === 'buf-kadakola-nanjangud') return depot.includes('buf-kadakola') || depot.includes('kadakola industrial') || iss.targetJurisdictionId === 'buf-kadakola-nanjangud';
        return depot.includes(jur.name.toLowerCase()) || iss.targetJurisdictionId === jur.id;
      }

      // Check specific matching
      if (jurId === 'tp-bogadi') return depot.includes('bogadi') || loc.includes('bogadi');
      if (jurId === 'mcc-zone-3') return depot.includes('mcc zone 3') || depot.includes('saraswathipuram') || loc.includes('saraswathipuram') || loc.includes('chamarajapuram');
      if (jurId === 'mcc-zone-8') return depot.includes('mcc zone 8') || loc.includes('kuvempunagar') || loc.includes('ramakrishnanagar');
      if (jurId === 'mcc-zone-2') return depot.includes('mcc zone 2') || loc.includes('sayyaji') || loc.includes('devaraja') || loc.includes('chamundipuram') || loc.includes('agrahara');
      if (jurId === 'tp-hootagalli') return depot.includes('hootagalli') || loc.includes('hootagalli');
      if (jurId === 'gp-belavadi') return depot.includes('belavadi') || loc.includes('belavadi');
      if (jurId === 'tp-rammanahalli') return depot.includes('rammanahalli') || loc.includes('rammanahalli');
      if (jurId === 'gp-alanahalli') return depot.includes('alanahalli') || loc.includes('alanahalli');
      if (jurId === 'tp-kadakola') return depot.includes('kadakola') || loc.includes('kadakola');
      if (jurId === 'mcc-zone-1') return depot.includes('mcc zone 1') || loc.includes('ashokapuram') || loc.includes('vani vilas');
      if (jurId === 'mcc-zone-4') return depot.includes('mcc zone 4') || loc.includes('nazarbad') || loc.includes('lashkar');
      if (jurId === 'mcc-zone-5') return depot.includes('mcc zone 5') || loc.includes('bannimantap') || loc.includes('mandi');
      if (jurId === 'mcc-zone-6') return depot.includes('mcc zone 6') || loc.includes('tilak') || loc.includes('yadavagiri');
      if (jurId === 'mcc-zone-7') return depot.includes('mcc zone 7') || loc.includes('hebbal') || loc.includes('krs road');
      if (jurId === 'mcc-zone-9') return depot.includes('mcc zone 9') || loc.includes('ittegagudu');

      return depot.includes(jurNameLower) || depot.includes(jur.id);
    });

    // For buffer zones with no assigned tasks, guarantee strict 0 active tasks and 0% capacity
    const activeLoad = (jur.type === 'buffer_zone' && activeIssues.length === 0)
      ? 0
      : activeIssues.reduce((sum, iss) => sum + (iss.loadWeight || iss.severityRank || 2), 0);
    // Baseline capacity: Bogadi = 20 (22 load = 110%), MCC Zone 3 = 29 (13 load = 45%), others = workers * 1.8
    const maxCapacity = jur.id === 'tp-bogadi' 
      ? 20 
      : jur.id === 'mcc-zone-3' 
      ? 29 
      : Math.max(10, Math.round(jur.baseWorkers * 1.8));
    const capacityPercent = maxCapacity > 0 ? Math.round((activeLoad / maxCapacity) * 100) : 0;
    const isOverloaded = capacityPercent > 100;

    return {
      jurisdiction: jur,
      activeIssuesCount: activeIssues.length,
      activeLoad,
      maxCapacity,
      capacityPercent,
      status: isOverloaded ? 'overloaded' : capacityPercent > 65 ? 'moderate' : 'optimal',
      isSpilloverActive: isOverloaded && (jur.type === 'town_panchayat' || jur.type === 'gram_panchayat' || jur.type === 'buffer_zone'),
    };
  });
};

// Detect primary jurisdiction ID based on location string or coordinates (returns primary jurisdiction ID)
export const detectJurisdictionId = (locationStr: string, coords?: { lat: number; lng: number }): string => {
  const locLower = (locationStr || '').toLowerCase();

  // Town Municipal Councils / Town Panchayats
  if (locLower.includes('bogadi')) return 'tp-bogadi';
  if (locLower.includes('hootagalli')) return 'tp-hootagalli';
  if (locLower.includes('kadakola')) return 'tp-kadakola';
  if (locLower.includes('rammanahalli')) return 'tp-rammanahalli';

  // Gram Panchayats
  if (locLower.includes('belavadi')) return 'gp-belavadi';
  if (locLower.includes('alanahalli')) return 'gp-alanahalli';
  if (locLower.includes('siddalingapura')) return 'gp-siddalingapura';
  if (locLower.includes('ilavala')) return 'gp-ilavala';
  if (locLower.includes('chamundi')) return 'gp-chamundi-hill';
  if (locLower.includes('koorgalli')) return 'gp-koorgalli';
  if (locLower.includes('varuna')) return 'gp-varuna';
  if (locLower.includes('dhanagalli')) return 'gp-dhanagalli';

  // MCC Zones
  if (locLower.includes('ashokapuram') || locLower.includes('vani vilas') || locLower.includes('krishnamurthypuram') || locLower.includes('ballal')) {
    return 'mcc-zone-1';
  }
  if (
    locLower.includes('sayyaji') ||
    locLower.includes('devaraja') ||
    locLower.includes('krishnaraja') ||
    locLower.includes('kr circle') ||
    locLower.includes('kr round') ||
    locLower.includes('urs road') ||
    locLower.includes('agrahara') ||
    locLower.includes('guru sweets') ||
    locLower.includes('palace')
  ) {
    return 'mcc-zone-2';
  }
  if (
    locLower.includes('saraswathipuram') ||
    locLower.includes('chamarajapuram') ||
    locLower.includes('jayalakshmipuram') ||
    locLower.includes('gokulam') ||
    locLower.includes('kautilya')
  ) {
    return 'mcc-zone-3';
  }
  if (locLower.includes('bannimantap') || locLower.includes('mandi mohalla') || locLower.includes('highway circle')) {
    return 'mcc-zone-5';
  }
  if (locLower.includes('hebbal') || locLower.includes('krs road') || locLower.includes('kumbarakoppal')) {
    return 'mcc-zone-7';
  }
  if (locLower.includes('yadavagiri') || locLower.includes('tilak nagar')) {
    return 'mcc-zone-6';
  }
  if (locLower.includes('nazarbad') || locLower.includes('lashkar') || locLower.includes('forum mall')) {
    return 'mcc-zone-4';
  }
  if (locLower.includes('kuvempunagar') || locLower.includes('ramakrishnanagar') || locLower.includes('jp nagar') || locLower.includes('dattagalli')) {
    return 'mcc-zone-8';
  }
  if (locLower.includes('ittegagudu') || locLower.includes('siddartha') || locLower.includes('zoo')) {
    return 'mcc-zone-9';
  }

  // Geospatial fallback
  if (coords) {
    if (coords.lng < 76.61) return 'tp-bogadi';
    if (coords.lat > 12.33) return 'gp-belavadi';
    if (coords.lat < 12.25) return 'tp-kadakola';
    if (coords.lng > 76.69) return 'gp-alanahalli';
  }

  return 'mcc-zone-3';
};

// Auto-detect best suited jurisdiction based on name, location or coordinates
export const detectJurisdiction = (locationStr: string, coords?: { lat: number; lng: number }): string => {
  const jurId = detectJurisdictionId(locationStr, coords);
  return WORKER_ROSTER[jurId]?.jurisdictionName || 'MCC Zone 3 (Saraswathipuram / Chamarajapuram)';
};

// In-memory cache to guarantee zero data loss and eliminate quota crash blocks
let inMemoryIssuesCache: CivicIssue[] | null = null;

// Clean up stale or duplicate storage keys to maximize available browser storage quota
const freeLocalStorageSpace = () => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith('civic_mesh_issues_v1') ||
         key.startsWith('civic_mesh_issues_v2') ||
         key.startsWith('civic_mesh_issues_v3') ||
         (key.startsWith('civic_') &&
          key !== ISSUES_STORAGE_KEY &&
          key !== DEPARTMENTS_STORAGE_KEY &&
          key !== SESSION_STORAGE_KEY &&
          key !== 'civic_theme'))
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => {
      try { localStorage.removeItem(k); } catch {}
    });
  } catch {
    // Ignore storage iteration issues
  }
};

// Compacts issues payload to strictly fit within the ~5MB browser localStorage envelope
const compactIssuesForStorage = (issues: CivicIssue[], maxRecentWithFullPhotos = 4): CivicIssue[] => {
  return issues.map((issue, index) => {
    // For the most recent reports, preserve user photos up to 65KB
    if (index < maxRecentWithFullPhotos) {
      return {
        ...issue,
        imageUrl: sanitizeImageString(issue.imageUrl, 65000),
        resolvedImageUrl: sanitizeImageString(issue.resolvedImageUrl, 65000),
        images: (issue.images || []).map((img) => sanitizeImageString(img, 65000)).filter(Boolean) as string[],
        reporters: (issue.reporters || []).map((r) => ({
          ...r,
          imageUrl: sanitizeImageString(r.imageUrl, 65000),
        })),
      };
    }

    // For older archive issues, retain complete metadata and replace large base64 blobs with lightweight SVG proofs
    const isSvgImg = Boolean(issue.imageUrl?.startsWith('data:image/svg'));
    const isSvgResolved = Boolean(issue.resolvedImageUrl?.startsWith('data:image/svg'));
    const fallbackSvg: string = isSvgImg
      ? (issue.imageUrl || SAMPLE_DEBRIS_PHOTO)
      : (issue.category === 'Potholes' || issue.category === 'Roads & Pavement'
          ? SAMPLE_POTHOLE_PHOTO
          : issue.category === 'Drainage' || issue.category === 'Water & Drainage'
          ? SAMPLE_DRAINAGE_PHOTO
          : SAMPLE_DEBRIS_PHOTO);

    return {
      ...issue,
      imageUrl: fallbackSvg,
      resolvedImageUrl: isSvgResolved
        ? issue.resolvedImageUrl
        : (issue.status === 'resolved' ? SAMPLE_RESOLVED_PHOTO : undefined),
      images: (issue.images && issue.images.length > 0)
        ? (issue.images.map((img) => (img.startsWith('data:image/svg') ? img : fallbackSvg)).slice(0, 4) as string[])
        : [fallbackSvg],
      reporters: (issue.reporters || []).map((r) => ({
        ...r,
        imageUrl: r.imageUrl?.startsWith('data:image/svg') ? r.imageUrl : fallbackSvg,
      })),
    };
  });
};

// Persistence Handlers with immediate cross-component and cross-tab synchronization
export const getStoredIssues = (): CivicIssue[] => {
  if (inMemoryIssuesCache && inMemoryIssuesCache.length > 0) {
    return inMemoryIssuesCache;
  }

  if (typeof window === 'undefined' || !window.localStorage) {
    inMemoryIssuesCache = INITIAL_ISSUES;
    return INITIAL_ISSUES;
  }

  try {
    const raw = localStorage.getItem(ISSUES_STORAGE_KEY);
    if (!raw) {
      inMemoryIssuesCache = INITIAL_ISSUES;
      try {
        localStorage.setItem(ISSUES_STORAGE_KEY, JSON.stringify(INITIAL_ISSUES));
      } catch {
        // Safe quota bypass
      }
      return INITIAL_ISSUES;
    }
    const parsed = JSON.parse(raw);
    const loadedList = Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_ISSUES;
    // Guarantee that pre-loaded tickets are strictly assigned to core Bogadi Town Panchayat and buffer zones launch at 0%
    const sanitized = loadedList.map((item: CivicIssue) => {
      const seed = INITIAL_ISSUES.find((s) => s.id === item.id);
      if (seed && item.id.startsWith('ISS-BOG-')) {
        return {
          ...item,
          isBufferZone: false,
          targetJurisdictionId: undefined,
          assignedDepot: 'Bogadi Town Panchayat',
          location: seed.location,
          coordinates: seed.coordinates,
          coordinatesStr: seed.coordinatesStr,
          title: seed.title,
          description: seed.description,
        };
      }
      if (seed && item.id.startsWith('ISS-MCC3-')) {
        return {
          ...item,
          isBufferZone: false,
          targetJurisdictionId: undefined,
        };
      }
      return item;
    });
    inMemoryIssuesCache = sanitized;
    return inMemoryIssuesCache;
  } catch {
    inMemoryIssuesCache = INITIAL_ISSUES;
    return INITIAL_ISSUES;
  }
};

export const saveStoredIssues = (issues: CivicIssue[]) => {
  // 1. Immediately update in-memory state so all UI interactions remain instantaneous
  inMemoryIssuesCache = issues;

  // 2. Broadcast immediately to current window and other tabs
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('civic_issues_updated', { detail: issues }));
      const bc = new BroadcastChannel('civic_mesh_sync');
      bc.postMessage({ type: 'issues_updated', count: issues.length });
      bc.close();
    } catch {
      // BroadcastChannel optional fallback
    }
  }

  // 3. Background sync to Firestore without blocking local UI execution
  try {
    if (issues.length > 0) {
      syncIssueToFirestore(issues[0]);
    }
  } catch {
    // Cloud sync notice
  }

  if (typeof window === 'undefined' || !window.localStorage) return;

  // 4. Clean up any obsolete keys from previous versions
  freeLocalStorageSpace();

  // Tier 1: Normal storage with lightweight photo compaction
  try {
    const compacted = compactIssuesForStorage(issues, 4);
    localStorage.setItem(ISSUES_STORAGE_KEY, JSON.stringify(compacted));
    return;
  } catch (err: any) {
    console.warn('Storage quota limit reached on Tier 1 write, applying progressive compaction...', err?.message || err);
  }

  // Tier 2: Aggressive photo compaction (convert older photos to SVGs, keep top 2)
  try {
    const aggressive = compactIssuesForStorage(issues, 2);
    localStorage.setItem(ISSUES_STORAGE_KEY, JSON.stringify(aggressive));
    return;
  } catch (err: any) {
    console.warn('Storage quota limit reached on Tier 2 write, applying minimal archive...', err?.message || err);
  }

  // Tier 3: Emergency compaction - keep latest 20 issues with SVG vector references
  try {
    const minimal = compactIssuesForStorage(issues.slice(0, 20), 0);
    localStorage.setItem(ISSUES_STORAGE_KEY, JSON.stringify(minimal));
    return;
  } catch (err: any) {
    console.warn('Local storage quota completely exceeded by browser environment; in-memory resilience active.', err?.message || err);
  }
};

export interface SubmitReportResult {
  grouped: boolean;
  ticket: CivicIssue;
  trackingId: string;
}

export const submitCitizenReport = (data: {
  category: CivicCategory;
  description: string;
  location: string;
  coordinates?: { lat: number; lng: number };
  coordinatesStr?: string;
  reportedBy: string;
  reporterEmail?: string;
  imageUrl?: string;
  severityRank?: SeverityRank;
  assignedDepot?: string;
  isQuarantined?: boolean;
  quarantineReason?: string;
}): SubmitReportResult => {
  const current = getStoredIssues();
  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

  const { sanitizedText, isFlagged } = filterAbusiveContent(data.description);
  const rank: SeverityRank = data.severityRank || getPriorityScore(data.category);
  const cost = SEVERITY_LEVELS[rank]?.defaultCost || 2500;

  const reporterEmail =
    data.reporterEmail ||
    (data.reportedBy ? `${data.reportedBy.toLowerCase().replace(/\s+/g, '.')}@mysuru.gov.in` : 'citizen@mysuru.gov.in');

  const newReporterEntry = {
    name: data.reportedBy,
    email: reporterEmail,
    timestamp: now,
    imageUrl: data.imageUrl,
  };

  // If flagged by AI moderation or abusive words, quarantine immediately
  const isQuarantined = Boolean(data.isQuarantined);
  const quarantineReason = data.quarantineReason || (isFlagged ? 'Flagged by content safety filters' : undefined);

  // Grouping check: existing active ticket with same category and nearby coordinates.
  // Quarantined reports are NEVER merged into clean public tickets.
  const matchingIndex = isQuarantined
    ? -1
    : current.findIndex((issue) => {
        if (
          issue.status === 'resolved' ||
          issue.status === 'closed' ||
          issue.status === 'quarantined' ||
          issue.isQuarantined
        ) {
          return false;
        }
        if (issue.category !== data.category) return false;
        return isNearby(issue.coordinates, data.coordinates);
      });

  if (matchingIndex !== -1) {
    const existing = current[matchingIndex];
    const escalatedRank = Math.min(5, (existing.severityRank || 2) + 1) as SeverityRank;

    // Non-overwriting merge: push citizen details & photo into reporters and images arrays
    const existingReporters =
      existing.reporters && existing.reporters.length > 0
        ? [...existing.reporters]
        : [
            {
              name: existing.reportedBy,
              email: 'citizen@mysuru.gov.in',
              timestamp: existing.reportedAt,
              imageUrl: existing.imageUrl,
            },
          ];

    // Add new reporter entry
    existingReporters.push(newReporterEntry);

    const existingImages =
      existing.images && existing.images.length > 0
        ? [...existing.images]
        : existing.imageUrl
        ? [existing.imageUrl]
        : [];

    if (data.imageUrl && !existingImages.includes(data.imageUrl)) {
      existingImages.push(data.imageUrl);
    }

    const inBuffer = existing.isBufferZone || isInsideBufferZone(data.coordinates?.lat, data.coordinates?.lng);
    const targetJurisdictionId = existing.targetJurisdictionId || (inBuffer ? (() => {
      const bufId = detectBufferZoneId(data.location, data.coordinates);
      return bufId ? routeBufferZoneTicket(bufId, current).targetJurisdictionId : 'mcc-zone-3';
    })() : undefined);

    const assignedJurisdictionId = targetJurisdictionId || existing.assignedJurisdictionId || detectJurisdictionId(existing.location, existing.coordinates);
    const assignedWorker = WORKER_ROSTER[assignedJurisdictionId] || WORKER_ROSTER['mcc-zone-3'];

    const updatedTicket: CivicIssue = {
      ...existing,
      reportCount: existingReporters.length,
      isFlagged: existing.isFlagged || isFlagged,
      updatedAt: now,
      severityRank: escalatedRank,
      priority: escalatedRank >= 5 ? 'critical' : escalatedRank === 4 ? 'high' : 'medium',
      loadWeight: escalatedRank,
      imageUrl: existing.imageUrl || data.imageUrl, // preserve primary photo
      reporters: existingReporters,
      images: existingImages,
      isBufferZone: inBuffer,
      targetJurisdictionId,
      assignedJurisdictionId,
      assignedCrewLead: existing.assignedCrewLead || assignedWorker.name,
      assignedCrew: existing.assignedCrew || `${assignedWorker.name} (${assignedWorker.jurisdictionName.split(' (')[0]})`,
      assignedVehicle: existing.assignedVehicle || assignedWorker.vehicle,
      assignedDepot: existing.assignedDepot || assignedWorker.jurisdictionName,
    };

    const updatedList = [...current];
    updatedList[matchingIndex] = updatedTicket;
    saveStoredIssues(updatedList);

    return {
      grouped: true,
      ticket: updatedTicket,
      trackingId: updatedTicket.trackingId || updatedTicket.id,
    };
  }

  // Create new unique ticket
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  const newTrackingId = `MYS-2026-${randomNum}`;
  const newId = `ISS-${Math.floor(5100 + Math.random() * 800)}`;

  const inBuffer = isInsideBufferZone(data.coordinates?.lat, data.coordinates?.lng);
  const bufferZoneId = inBuffer ? detectBufferZoneId(data.location, data.coordinates) : null;
  const dynamicRoute = (inBuffer && bufferZoneId) ? routeBufferZoneTicket(bufferZoneId, current) : null;

  // Dynamically inherit assigned crew, lead and vehicle from WORKER_ROSTER
  const assignedJurisdictionId = dynamicRoute 
    ? dynamicRoute.targetJurisdictionId 
    : detectJurisdictionId(data.location, data.coordinates);

  const assignedWorker = WORKER_ROSTER[assignedJurisdictionId] || WORKER_ROSTER['mcc-zone-3'];
  const assignedCrewLead = assignedWorker.name;
  const assignedVehicle = assignedWorker.vehicle;
  const assignedCrew = `${assignedWorker.name} (${assignedWorker.jurisdictionName.split(' (')[0]})`;
  const assignedDepot = assignedWorker.jurisdictionName;

  const newTicket: CivicIssue = {
    id: newId,
    trackingId: newTrackingId,
    title: `${data.category} Incident at ${data.location.split(',')[0]}`,
    category: data.category,
    description: sanitizedText,
    location: data.location,
    coordinates: data.coordinates,
    coordinatesStr: data.coordinatesStr,
    priority: rank >= 5 ? 'critical' : rank === 4 ? 'high' : rank === 3 ? 'medium' : 'low',
    severityRank: rank,
    status: isQuarantined ? ('quarantined' as IssueStatus) : 'reported',
    reportedBy: data.reportedBy,
    reporters: [newReporterEntry],
    images: data.imageUrl ? [data.imageUrl] : [],
    assignedCrew,
    assignedCrewLead,
    assignedVehicle,
    assignedDepot,
    assignedJurisdictionId,
    clearingCost: cost,
    reportedAt: now,
    updatedAt: now,
    loadWeight: isQuarantined ? 0 : rank,
    isBufferZone: inBuffer,
    targetJurisdictionId: inBuffer ? assignedJurisdictionId : undefined,
    isFlagged: isFlagged || isQuarantined,
    isQuarantined,
    quarantineReason,
    verificationStatus: isQuarantined ? 'quarantined' : undefined,
    reportCount: 1,
    imageUrl: data.imageUrl,
  };

  const updated = [newTicket, ...current];
  saveStoredIssues(updated);

  return {
    grouped: false,
    ticket: newTicket,
    trackingId: newTrackingId,
  };
};

export const updateIssueStatus = (
  id: string, 
  status: IssueStatus, 
  crew?: string,
  vehicle?: string
): CivicIssue[] => {
  const current = getStoredIssues();
  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
  const updated = current.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        status,
        ...(crew ? { assignedCrew: crew } : {}),
        ...(vehicle ? { assignedVehicle: vehicle } : {}),
        updatedAt: now,
      };
    }
    return item;
  });
  saveStoredIssues(updated);
  return updated;
};

export const adminUpdateIssue = (
  id: string,
  updates: {
    status?: IssueStatus;
    assignedDepot?: string;
    assignedCrew?: string;
    assignedVehicle?: string;
    severityRank?: SeverityRank;
    adminNotes?: string;
    resolutionNotes?: string;
    verificationStatus?: 'verified' | 'flagged_unverified' | 'pending';
  }
): CivicIssue[] => {
  const current = getStoredIssues();
  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
  const updated = current.map((item) => {
    if (item.id === id) {
      const nextRank = updates.severityRank || item.severityRank;
      return {
        ...item,
        ...updates,
        ...(updates.severityRank ? { 
          severityRank: nextRank,
          loadWeight: nextRank,
          priority: (nextRank >= 5 ? 'critical' : nextRank === 4 ? 'high' : nextRank === 3 ? 'medium' : 'low') as IssuePriority,
          clearingCost: SEVERITY_LEVELS[nextRank]?.defaultCost || 2500
        } : {}),
        updatedAt: now,
      };
    }
    return item;
  });
  saveStoredIssues(updated);
  return updated;
};

export const resolveIssueWithProof = (
  id: string,
  proofImageUrl?: string,
  options?: {
    isVerified?: boolean;
    isFlagged?: boolean;
    status?: IssueStatus;
    resolutionNotes?: string;
  }
): CivicIssue[] => {
  const current = getStoredIssues();
  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
  const isVerified = options?.isVerified !== undefined ? options.isVerified : true;
  const isFlagged = options?.isFlagged !== undefined ? options.isFlagged : !isVerified;
  const targetStatus = options?.status || 'resolved';

  const updated = current.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        status: targetStatus,
        verificationStatus: isVerified ? ('verified' as const) : ('flagged_unverified' as const),
        isFlagged,
        resolvedImageUrl: proofImageUrl || item.resolvedImageUrl || SAMPLE_RESOLVED_PHOTO,
        resolutionNotes: options?.resolutionNotes !== undefined ? options.resolutionNotes : item.resolutionNotes,
        updatedAt: now,
      };
    }
    return item;
  });
  saveStoredIssues(updated);
  return updated;
};

// Citizen Feedback / Satisfaction Rating Handler
export const rateIssueResolution = (
  id: string,
  citizenRating: number,
  citizenFeedback?: string
): CivicIssue[] => {
  const current = getStoredIssues();
  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
  let updatedTarget: CivicIssue | null = null;

  const updated = current.map((item) => {
    if (item.id === id || item.trackingId === id) {
      updatedTarget = {
        ...item,
        citizenRating,
        citizenFeedback: citizenFeedback?.trim() || undefined,
        ratedAt: now,
      };
      return updatedTarget;
    }
    return item;
  });

  saveStoredIssues(updated);

  // Directly sync to Firestore so the text review & rating persist to the cloud database
  if (updatedTarget) {
    try {
      syncIssueToFirestore(updatedTarget);
    } catch (syncErr) {
      console.warn('Firestore feedback sync notice:', syncErr);
    }
  }

  return updated;
};

export const getStoredDepartments = (): DepartmentCapacity[] => {
  try {
    const raw = localStorage.getItem(DEPARTMENTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(DEPARTMENTS_STORAGE_KEY, JSON.stringify(INITIAL_DEPARTMENTS));
      return INITIAL_DEPARTMENTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEPARTMENTS;
  }
};

export const getStoredSession = (): UserSession | null => {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && (parsed.name === 'Maya Lin' || parsed.name?.includes('Maya Lin'))) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
    if (parsed) {
      if (parsed.badge && /firebase/i.test(parsed.badge)) {
        parsed.badge = parsed.badge.replace(/firebase\s*(authenticated\s*)?/gi, 'Verified ').trim();
      }
      if (parsed.role === 'citizen' && (!parsed.badge || /firebase/i.test(parsed.badge))) {
        parsed.badge = 'Verified Resident';
      }
    }
    return parsed;
  } catch {
    return null;
  }
};

export const setStoredSession = (session: UserSession | null) => {
  try {
    if (session) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch (e) {
    console.error('Failed to update session', e);
  }
};

export const resetToSeedData = () => {
  const freshIssues: CivicIssue[] = JSON.parse(JSON.stringify(INITIAL_ISSUES));
  const freshDepts: DepartmentCapacity[] = JSON.parse(JSON.stringify(INITIAL_DEPARTMENTS));
  inMemoryIssuesCache = freshIssues;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      freeLocalStorageSpace();
      localStorage.setItem(ISSUES_STORAGE_KEY, JSON.stringify(freshIssues));
      localStorage.setItem(DEPARTMENTS_STORAGE_KEY, JSON.stringify(freshDepts));
    } catch (e) {
      console.warn('Storage quota notice on reset:', e);
    }
    window.dispatchEvent(new CustomEvent('civic_issues_updated', { detail: freshIssues }));
    try {
      const bc = new BroadcastChannel('civic_mesh_sync');
      bc.postMessage({ type: 'issues_updated', count: freshIssues.length });
      bc.close();
    } catch {
      // Optional broadcast fallback
    }
  }
  return { issues: freshIssues, departments: freshDepts };
};

// Inter-Agency Clearing Ledger Calculations (Universal - NOT hardcoded to Bogadi/Zone 3)
export interface ClearingLedgerEntry {
  debtorJurisdiction: string;
  creditorJurisdiction: string;
  amount: number;
  tickets: CivicIssue[];
}

export interface ClearingLedgerSummary {
  spilloverTicketsCount: number;
  totalBogadiOwesMCC: number; // retained for backward compat display
  totalMCCReimbursed: number;
  pendingReconciliationCount: number;
  tickets: CivicIssue[];
  cycleMonth: string;
  overloadedPanchayats: string[];
  entries: ClearingLedgerEntry[];
  totalDebit: number;
}

export const calculateClearingLedger = (
  issues: CivicIssue[], 
  _bogadiCapacityPercent?: number
): ClearingLedgerSummary => {
  const capacities = calculateDynamicCapacities(issues);

  // Find ALL overloaded jurisdictions (not just Bogadi)
  const overloadedJurisdictions = capacities.filter(c => c.capacityPercent > 100);
  const overloadedIds = new Set(overloadedJurisdictions.map(c => c.jurisdiction.id));
  const overloadedNames = overloadedJurisdictions.map(c => c.jurisdiction.name);

  // Find actual active buffer tickets that were rerouted across jurisdictions
  const allSpilloverTickets: CivicIssue[] = [];
  const entries: ClearingLedgerEntry[] = [];

  // Check each buffer zone for spillover tickets
  Object.entries(BUFFER_ZONE_ADJACENCY).forEach(([bufId, [adjA, adjB]]) => {
    const aOverloaded = overloadedIds.has(adjA);
    const bOverloaded = overloadedIds.has(adjB);

    // Only count actual active buffer tickets (issue.isBufferZone === true)
    const bufTickets = issues.filter(issue => {
      if (
        issue.status === 'closed' || 
        issue.status === 'resolved' || 
        issue.status === 'quarantined' || 
        issue.isQuarantined
      ) {
        return false;
      }
      // Strictly require that the ticket is marked as an active buffer ticket!
      if (!issue.isBufferZone) return false;

      const corridorId = detectBufferZoneId(issue.location, issue.coordinates) || (issue.isBufferZone ? 'buf-bogadi-mcc' : null);
      if (corridorId !== bufId) return false;

      return Boolean(issue.targetJurisdictionId || issue.assignedDepot);
    });

    if (bufTickets.length > 0) {
      const debtor = aOverloaded ? adjA : (bOverloaded ? adjB : adjA);
      const creditor = aOverloaded ? adjB : (bOverloaded ? adjA : adjB);
      const debtorName = MYSURU_JURISDICTIONS.find(j => j.id === debtor)?.name || debtor;
      const creditorName = MYSURU_JURISDICTIONS.find(j => j.id === creditor)?.name || creditor;
      const amount = bufTickets.reduce((acc, issue) => acc + (issue.clearingCost || SEVERITY_LEVELS[issue.severityRank || 3]?.defaultCost || 2500), 0);

      entries.push({ debtorJurisdiction: debtorName, creditorJurisdiction: creditorName, amount, tickets: bufTickets });
      allSpilloverTickets.push(...bufTickets);
    }
  });

  // Deduplicate spillover tickets
  const uniqueSpillover = Array.from(new Map(allSpilloverTickets.map(t => [t.id, t])).values());
  const totalDebit = entries.reduce((acc, e) => acc + e.amount, 0);

  return {
    spilloverTicketsCount: uniqueSpillover.length,
    totalBogadiOwesMCC: totalDebit,
    totalMCCReimbursed: 0,
    pendingReconciliationCount: uniqueSpillover.length,
    tickets: uniqueSpillover,
    cycleMonth: 'September 2026',
    overloadedPanchayats: overloadedNames,
    entries,
    totalDebit,
  };
};

// Citizen GPS Landmark Snapping
const MYSURU_SNAP_LANDMARKS = [
  { name: 'KR Circle', lat: 12.3088, lng: 76.6531 },
  { name: 'Bogadi Ring Road Junction', lat: 12.3020, lng: 76.6180 },
  { name: 'Alanahalli T-Junction', lat: 12.2830, lng: 76.6920 },
  { name: 'Kukkarahalli Lake North Gate', lat: 12.3090, lng: 76.6340 },
  { name: 'Chamundi Hill Foothills', lat: 12.2740, lng: 76.6710 },
  { name: 'Bannimantap Highway Circle', lat: 12.3350, lng: 76.6490 },
  { name: 'Saraswathipuram Park', lat: 12.3010, lng: 76.6320 },
  { name: 'Hebbal Industrial Area', lat: 12.3550, lng: 76.6120 },
  { name: 'Kuvempunagar Bus Stand', lat: 12.2850, lng: 76.6280 },
  { name: 'Hootagalli Industrial Junction', lat: 12.3390, lng: 76.5770 },
];

export const snapToMysuruLandmark = (lat: number, lng: number): { landmark: string; distanceMeters: number } => {
  let closest = MYSURU_SNAP_LANDMARKS[0];
  let minDistSq = Number.MAX_VALUE;
  for (const lm of MYSURU_SNAP_LANDMARKS) {
    const dSq = Math.pow(lat - lm.lat, 2) + Math.pow(lng - lm.lng, 2);
    if (dSq < minDistSq) { minDistSq = dSq; closest = lm; }
  }
  const distanceMeters = Math.round(Math.sqrt(minDistSq) * 111000);
  return { landmark: distanceMeters < 50 ? closest.name : ('Near ' + closest.name + ' (~' + distanceMeters + 'm)'), distanceMeters };
};

// Citizen Reopen Request Handler (72h Grace Window)
export const citizenReopenIssue = (id: string, reason: string): boolean => {
  const current = getStoredIssues();
  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
  const updated = current.map((item) => {
    if (item.id === id || item.trackingId === id) {
      return {
        ...item,
        status: 'in_progress' as const,
        verificationStatus: 'pending' as const,
        adminNotes: ('Reopened by Resident: ' + reason),
        updatedAt: now,
      };
    }
    return item;
  });
  saveStoredIssues(updated);
  return true;
};

// Worker Defect Reclassification Handler  
export const workerReclassifyIssue = (id: string, category: CivicCategory): CivicIssue[] => {
  const current = getStoredIssues();
  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
  const rank = getPriorityScore(category);
  const updated = current.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        category,
        severityRank: rank,
        loadWeight: rank,
        priority: (rank >= 5 ? 'critical' : rank === 4 ? 'high' : rank === 3 ? 'medium' : 'low') as IssuePriority,
        clearingCost: SEVERITY_LEVELS[rank]?.defaultCost || 2500,
        adminNotes: ((item.adminNotes || '') + ' [Field Reclassified to ' + category + ']').trim(),
        updatedAt: now,
      };
    }
    return item;
  });
  saveStoredIssues(updated);
  return updated;
};

// Worker Task Deferral / Next Shift Rollover Handler
export const workerDeferIssue = (id: string, reason: string): CivicIssue[] => {
  const current = getStoredIssues();
  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
  const updated = current.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        status: 'assigned' as const,
        adminNotes: ((item.adminNotes || '') + ' [Shift Deferred: ' + reason + ']').trim(),
        updatedAt: now,
      };
    }
    return item;
  });
  saveStoredIssues(updated);
  return updated;
};
