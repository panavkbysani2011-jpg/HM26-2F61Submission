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

  // Categories
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
