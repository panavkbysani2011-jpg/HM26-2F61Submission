import React, { createContext, useContext, useState, useEffect } from 'react';
import { LanguageType } from '../types';

interface LanguageContextType {
  lang: LanguageType;
  setLang: (lang: LanguageType) => void;
  toggleLang: () => void;
  t: (key: string, defaultText?: string) => string;
}

export const KANNADA_TERMS: Record<string, string> = {
  // Navigation & Core Brands
  'Civic Mesh': 'ಸಿವಿಕ್ ಮೆಶ್',
  'Citizen Portal': 'ನಾಗರಿಕ ಪೋರ್ಟಲ್',
  'Worker Portal': 'ಕಾರ್ಮಿಕ ಪೋರ್ಟಲ್',
  'Worker Desk': 'ಕಾರ್ಮಿಕ ಡೆಸ್ಕ್',
  'Admin Dashboard': 'ಆಡಳಿತ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
  'Portal Hub': 'ಪೋರ್ಟಲ್ ಹಬ್',
  'Demo Reset': 'ಡೆಮೊ ಮರುಹೊಂದಿಸಿ',
  'Field Dispatch': 'ಕ್ಷೇತ್ರ ನಿಯೋಜನೆ',
  'Field Operations': 'ಕ್ಷೇತ್ರ ಕಾರ್ಯಾಚರಣೆಗಳು',
  'Field Operator': 'ಕ್ಷೇತ್ರ ನಿರ್ವಾಹಕ',
  'Municipal Issue Resolution System': 'ನಗರಸಭೆ ಸಮಸ್ಯೆ ಪರಿಹಾರ ವ್ಯವಸ್ಥೆ',
  'Exit': 'ನಿರ್ಗಮಿಸಿ',

  // Citizen Portal Actions & Labels
  'File Grievance': 'ದೂರು ದಾಖಲಿಸಿ',
  'Lodge Grievance': 'ದೂರು ದಾಖಲಿಸಿ',
  'My Submissions': 'ನನ್ನ ಸಲ್ಲಿಕೆಗಳು',
  'Lodge Municipal Civic Grievance': 'ನಾಗರಿಕ ಕುಂದುಕೊರತೆ ದೂರು ದಾಖಲಿಸಿ',
  'Submit': 'ಸಲ್ಲಿಸಿ',
  'Submit Civic Report': 'ದೂರು ಸಲ್ಲಿಸಿ',
  'Submit Grievance': 'ದೂರು ಸಲ್ಲಿಸಿ',
  'Issue Category': 'ಸಮಸ್ಯೆಯ ವರ್ಗ',
  'Issue Category *': 'ಸಮಸ್ಯೆಯ ವರ್ಗ *',
  'Incident Description': 'ಘಟನೆಯ ವಿವರಣೆ',
  'Incident Description *': 'ಘಟನೆಯ ವಿವರಣೆ *',
  'Location': 'ಸ್ಥಳ',
  'Upload Visual Evidence': 'ಛಾಯಾಚಿತ್ರ ಸಾಕ್ಷ್ಯ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
  'Take Live Photo': 'ನೇರ ಛಾಯಾಚಿತ್ರ ತೆಗೆಯಿರಿ',
  'Submitting...': 'ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ...',
  'Refresh Status': 'ಸ್ಥಿತಿ ನವೀಕರಿಸಿ',
  'Rate Resolution': 'ಪರಿಹಾರವನ್ನು ರೇಟ್ ಮಾಡಿ',
  'Your Rating:': 'ನಿಮ್ಮ ರೇಟಿಂಗ್:',
  'Your Rating': 'ನಿಮ್ಮ ರೇಟಿಂಗ್',
  'Submit Rating': 'ರೇಟಿಂಗ್ ಸಲ್ಲಿಸಿ',
  'How satisfied are you with this repair?': 'ಈ ಪರಿಹಾರ ಕಾರ್ಯದಿಂದ ನೀವು ತೃಪ್ತರಾಗಿದ್ದೀರಾ?',
  'Add feedback comment (optional)...': 'ಅಭಿಪ್ರಾಯ ಸೇರಿಸಿ (ಐಚ್ಛಿಕ)...',
  'Clear Form': 'ಫಾರ್ಮ್ ಅಳಿಸಿ',
  'Official Tracking ID': 'ಅಧಿಕೃತ ಟ್ರ್ಯಾಕಿಂಗ್ ಸಂಖ್ಯೆ',
  'Track Resolution Stages': 'ಪರಿಹಾರ ಹಂತಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',
  'Lodge Another Grievance': 'ಮತ್ತೊಂದು ದೂರು ದಾಖಲಿಸಿ',
  'View in My Submissions': 'ನನ್ನ ಸಲ್ಲಿಕೆಗಳಲ್ಲಿ ನೋಡಿ',

  // Statuses
  'Active Tasks': 'ಸಕ್ರಿಯ ಕಾರ್ಯಗಳು',
  'Active Work Orders': 'ಸಕ್ರಿಯ ಕಾರ್ಯಗಳು',
  'Resolved': 'ಪರಿಹರಿಸಲಾಗಿದೆ',
  'Resolved Log': 'ಪರಿಹರಿಸಲಾಗಿದೆ',
  'Pending': 'ಬಾಕಿ ಇದೆ',
  'In Progress': 'ಪ್ರಗತಿಯಲ್ಲಿದೆ',
  'Assigned': 'ನಿಯೋಜಿಸಲಾಗಿದೆ',
  'Received': 'ಸ್ವೀಕರಿಸಲಾಗಿದೆ',
  'Quarantined': 'ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ',
  'Buffer Coordination': 'ಗಡಿ ಸಮನ್ವಯ',
  'Resolved & Verified': 'ಪರಿಹರಿಸಲಾಗಿದೆ ಮತ್ತು ಪರಿಶೀಲಿಸಲಾಗಿದೆ',
  'Completed (Audit Pending)': 'ಪೂರ್ಣಗೊಂಡಿದೆ (ಲೆಕ್ಕಪರಿಶೋಧನೆ ಬಾಕಿ)',

  // Categories (Core & Granular Subcategories)
  'Debris': 'ಅವಶೇಷಗಳು / ತ್ಯಾಜ್ಯ',
  'Potholes': 'ಗುಂಡಿಗಳು / ರಸ್ತೆ ಹಾನಿ',
  'Drainage': 'ಚರಂಡಿ / ನೀರು ನಿಲ್ಲುವುದು',
  'Streetlights': 'ಬೀದಿ ದೀಪಗಳು',
  'Garbage Dump': 'ಕಸದ ರಾಶಿ',
  'Roads & Pavement': 'ರಸ್ತೆ ಮತ್ತು ಕಾಲುದಾರಿ',
  'Water & Drainage': 'ನೀರು ಮತ್ತು ಒಳಚರಂಡಿ',
  'Electrical & Lighting': 'ವಿದ್ಯುತ್ ಮತ್ತು ಬೆಳಕು',
  'Waste & Sanitation': 'ತ್ಯಾಜ್ಯ ಮತ್ತು ನೈರ್ಮಲ್ಯ',
  'Parks & Public Spaces': 'ಉದ್ಯಾನವನಗಳು ಮತ್ತು ಸಾರ್ವಜನಿಕ ಸ್ಥಳಗಳು',
  'Crater / Road Subsidence': 'ರಸ್ತೆ ಕುಸಿತ / ಬೃಹತ್ ಕಂದಕ',
  'Missing Manhole Cover': 'ತೆರೆದ ಮ್ಯಾನ್‌ಹೋಲ್ ಮುಚ್ಚಳ',
  'Damaged Footpath / Curb': 'ಹಾನಿಗೊಳಗಾದ ಕಾಲುದಾರಿ / ಫುಟ್‌ಪಾತ್',
  'Storm Drain Silt Overflow': 'ಮಳೆನೀರು ಚರಂಡಿ ಹೂಳು ಉಕ್ಕಿ ಹರಿಯುವುದು',
  'Underground Sewer Burst': 'ಒಳಚರಂಡಿ ಕೊಳವೆ ಒಡೆತ / ಕೊಳಚೆ ನೀರು',
  'Stagnant Vector Hazard': 'ನಿಂತ ನೀರು / ಸೊಳ್ಳೆ ಉತ್ಪತ್ತಿ ಅಪಾಯ',
  'Commercial Waste Blackspot': 'ವಾಣಿಜ್ಯ ತ್ಯಾಜ್ಯ / ಕಪ್ಪುಚುಕ್ಕೆ ತಾಣ',
  'C&D Construction Debris': 'ಕಟ್ಟಡ ನಿರ್ಮಾಣ ಅವಶೇಷಗಳು',
  'Dead Animal Clearance': 'ಸತ್ತ ಪ್ರಾಣಿ ತೆರವು',
  'Dangling / Sparking Live Wire': 'ಜೋತುಬಿದ್ದ ವಿದ್ಯುತ್ ತಂತಿ / ಕಿಡಿ',
  'Street Feeder Blackout': 'ಫೀಡರ್ ಮಾರ್ಗ ಸ್ಥಗಿತ / ಕತ್ತಲೆ',
  'Main Water Pipeline Burst': 'ಮುಖ್ಯ ಕುಡಿಯುವ ನೀರಿನ ಕೊಳವೆ ಒಡೆತ',
  'Contaminated Tap Water': 'ಕಲುಷಿತ ಕುಡಿಯುವ ನೀರು ಸರಬರಾಜು',
  'Fallen Tree / Branch Obstruction': 'ಬಿದ್ದ ಮರ / ರಸ್ತೆ ತಡೆದ ರೆಂಬೆಗಳು',

  // Route & Tour Optimizer
  'Optimize Shift Tour': 'ಪಾಳಿ ಮಾರ್ಗ ಅತ್ಯುತ್ತಮಗೊಳಿಸಿ',
  'Shift Tour Optimizer': 'ಪಾಳಿ ಮಾರ್ಗ ಆಪ್ಟಿಮೈಜರ್',
  'Optimal TSP Tour': 'ಗಣಿತೀಯ ಅತ್ಯುತ್ತಮ ಮಾರ್ಗ (TSP)',
  'Optimized Sequence': 'ಅತ್ಯುತ್ತಮ ಅನುಕ್ರಮ',
  'Optimized Stop': 'ಆಪ್ಟಿಮೈಸ್ಡ್ ನಿಲುಗಡೆ',
  'Stop': 'ನಿಲುಗಡೆ',
  'Saves': 'ಉಳಿತಾಯ',
  'Reset Route': 'ಮಾರ್ಗ ಮರುಹೊಂದಿಸಿ',
  'Balancing Proximity & Urgency': 'ದೂರ ಮತ್ತು ತುರ್ತುಸ್ಥಿತಿಯ ಸಮತೋಲನ',

  // Mobile GPS Geotagging & Visual Deduplication
  'GPS Geotagged': 'ಜಿಪಿಎಸ್ ಜಿಯೋಟ್ಯಾಗ್ ಮಾಡಲಾಗಿದೆ',
  'Acquiring High-Precision GPS...': 'ನಿಖರ ಜಿಪಿಎಸ್ ಪಡೆಯಲಾಗುತ್ತಿದೆ...',
  'High-Accuracy Mobile GPS Active': 'ನಿಖರ ಮೊಬೈಲ್ ಜಿಪಿಎಸ್ ಸಕ್ರಿಯವಾಗಿದೆ',
  'Visual Duplicate Detected': 'ಚಿತ್ರದ ಸಾಮ್ಯತೆ ಪತ್ತೆಯಾಗಿದೆ',
  'Corroborated Incident': 'ದೃಢೀಕರಿಸಿದ ವರದಿ',
  'Contextual Escalation': 'ಸನ್ನಿವೇಶಾಧಾರಿತ ತುರ್ತು ಹೆಚ್ಚಳ',
  'Sensitive Landmark Proximity': 'ಸೂಕ್ಷ್ಮ ಹೆಗ್ಗುರುತು ಸಾಮೀಪ್ಯ',

  // Worker Desk
  'Field Operator:': 'ಕ್ಷೇತ್ರ ನಿರ್ವಾಹಕ:',
  'Switch Worker': 'ಕಾರ್ಮಿಕರನ್ನು ಬದಲಾಯಿಸಿ',
  'View Task Details & Actions': 'ಕಾರ್ಯ ವಿವರಗಳನ್ನು ನೋಡಿ',
  'Start Work Order': 'ಕೆಲಸ ಪ್ರಾರಂಭಿಸಿ',
  'Submit Completion': 'ಪೂರ್ಣಗೊಳಿಸುವಿಕೆಯನ್ನು ಸಲ್ಲಿಸಿ',
  'Open Location in Google Maps': 'ಗೂಗಲ್ ನಕ್ಷೆಯಲ್ಲಿ ನೋಡಿ',
  'Active Queue Cleared': 'ಎಲ್ಲಾ ಸಕ್ರಿಯ ಕಾರ್ಯಗಳು ಪೂರ್ಣಗೊಂಡಿವೆ',
  'Field Execution Desk': 'ಕ್ಷೇತ್ರ ನಿರ್ವಹಣಾ ಡೆಸ್ಕ್',
  'Verified & Completed': 'ಪರಿಶೀಲಿಸಲಾಗಿದೆ ಮತ್ತು ಪೂರ್ಣಗೊಂಡಿದೆ',
  'Shift Productivity & Operations': 'ಪಾಳಿ ಉತ್ಪಾದಕತೆ ಮತ್ತು ಕಾರ್ಯಾಚರಣೆಗಳು',
  'Completed Today': 'ಇಂದು ಪೂರ್ಣಗೊಂಡಿದೆ',
  'Active Remaining': 'ಸಕ್ರಿಯ ಬಾಕಿ',
  'Cleared Volume Index': 'ತೆರವುಗೊಳಿಸಿದ ಪ್ರಮಾಣ',
  'SLA Health Rate': 'SLA ಆರೋಗ್ಯ ದರ',
  'Sort by Proximity': 'ದೂರದ ಪ್ರಕಾರ ಜೋಡಿಸಿ',
  'Sort by Severity': 'ತೀವ್ರತೆಯ ಪ್ರಕಾರ ಜೋಡಿಸಿ',
  'Nearest First': 'ಹತ್ತಿರದ ಮೊದಲು',
  'Saved Locally (Offline)': 'ಸ್ಥಳೀಯವಾಗಿ ಉಳಿಸಲಾಗಿದೆ (ಆಫ್‌ಲೈನ್)',

  // Offline & Queues
  'Offline Queue': 'ಆಫ್‌ಲೈನ್ ಕ್ಯೂ',
  'Queued Offline': 'ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿದೆ',
  'Sync All to Registry': 'ರೆಜಿಸ್ಟ್ರಿಗೆ ಸಿಂಕ್ ಮಾಡಿ',
  'Pending Network Connection': 'ನೆಟ್‌ವರ್ಕ್‌ ಸಂಪರ್ಕಕ್ಕಾಗಿ ಕಾಯಲಾಗುತ್ತಿದೆ',
  'Sync Now': 'ಈಗ ಸಿಂಕ್ ಮಾಡಿ',
  'Offline Submission Mode': 'ಆಫ್‌ಲೈನ್ ಸಲ್ಲಿಕೆ ಮೋಡ್',

  // Transparency & Boundary
  'Pre-Submission Routing Transparency': 'ಸಲ್ಲಿಕೆ-ಪೂರ್ವ ರೂಟಿಂಗ್ ಪಾರದರ್ಶಕತೆ',
  'Operational Authority:': 'ಕಾರ್ಯಾಚರಣಾ ಪ್ರಾಧಿಕಾರ:',
  'Identified Sector:': 'ಗುರುತಿಸಲಾದ ವಲಯ:',
  'Cross-Boundary Accord': 'ಗಡಿ ಸಮನ್ವಯ ಒಪ್ಪಂದ',
  'Buffer Corridor': 'ಗಡಿ ಕಾರಿಡಾರ್',
  'Border Hotspots': 'ಗಡಿ ಪ್ರಮುಖ ಸ್ಥಳಗಳು',
  'Over Capacity': 'ಸಾಮರ್ಥ್ಯ ಮೀರಿದೆ',

  // 72-Hour Reopen & Reviews
  'Issue Recurred? Request Re-Inspection': 'ಸಮಸ್ಯೆ ಮತ್ತೆ ಮರುಕಳಿಸಿದೆಯೇ? ಮರುಪರಿಶೀಲನೆಗೆ ವಿನಂತಿಸಿ',
  '72-Hour Defect Grace Period': '72 ಗಂಟೆಗಳ ದೋಷ ವಿನಂತಿ ಅವಧಿ',
  'Re-Open Defect': 'ದೋಷ ಮರುತೆರೆಯಿರಿ',
  'Reason for Re-Inspection:': 'ಮರುಪರಿಶೀಲನೆಗೆ ಕಾರಣ:',

  // Admin & Audit
  'Audit Timeline': 'ಆಡಿಟ್ ಕಾಲಾನುಕ್ರಮ',
  'Approve & Release to Dispatch': 'ಅನುಮೋದಿಸಿ ಮತ್ತು ನಿಯೋಜಿಸಿ',
  'Dismiss & Archive': 'ವಜಾಗೊಳಿಸಿ ಮತ್ತು ಸಂಗ್ರಹಿಸಿ',
  'Overloaded Only': 'ಸಾಮರ್ಥ್ಯ ಮೀರಿದವು ಮಾತ್ರ',
};

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  toggleLang: () => {},
  t: (key: string, defaultText?: string) => defaultText || key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<LanguageType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('civic_mesh_lang');
      if (saved === 'kn' || saved === 'en') return saved;
    }
    return 'en';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('civic_mesh_lang', lang);
    }
  }, [lang]);

  const toggleLang = () => {
    setLang((prev) => (prev === 'en' ? 'kn' : 'en'));
  };

  const t = (key: string, defaultText?: string): string => {
    if (lang === 'kn') {
      return KANNADA_TERMS[key] || defaultText || key;
    }
    return defaultText || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
