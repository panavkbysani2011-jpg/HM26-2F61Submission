import React from 'react';
import { ViewType, UserSession } from '../types';
import { 
  HomeIcon, 
  SunIcon, 
  MoonIcon, 
  ArrowPathIcon, 
  LanguageIcon,
  ShieldCheckIcon,
  WrenchScrewdriverIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { useLanguage } from '../context/LanguageContext';
import { CivicMeshLogo } from './CivicMeshLogo';

interface NavbarProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  session: UserSession | null;
  onLogout: () => void;
  onResetDb: () => void;
  isDark: boolean;
  onToggleDark: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  session,
  onLogout,
  onResetDb,
  isDark,
  onToggleDark,
}) => {
  const { lang, toggleLang } = useLanguage();

  return (
    <header className="border-b border-stone-200/80 dark:border-stone-800/80 bg-[#f8f9fa]/90 dark:bg-[#09090b]/90 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Typographic Identity */}
        <button
          id="nav-brand-button"
          onClick={() => onNavigate('landing')}
          className="flex items-center text-left cursor-pointer focus:outline-hidden group"
        >
          <CivicMeshLogo size="md" showSubtitle={true} subtext={lang === 'kn' ? 'ಮೈಸೂರು' : 'MYSURU'} />
        </button>

        {/* Navigation Actions, Language Toggle, Dark Mode Toggle & Session */}
        <div className="flex items-center gap-2">
          {currentView !== 'landing' && (
            <button
              id="nav-home-button"
              onClick={() => onNavigate('landing')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-all active:scale-95 cursor-pointer border border-stone-200/80 dark:border-stone-800 shadow-2xs"
            >
              <HomeIcon className="w-4 h-4 text-stone-600 dark:text-stone-400" />
              <span>{lang === 'kn' ? 'ಪೋರ್ಟಲ್ ಹಬ್' : 'Portal Hub'}</span>
            </button>
          )}

          {/* Language Toggle Button (English <-> ಕನ್ನಡ) */}
          <button
            id="nav-language-toggle"
            type="button"
            onClick={toggleLang}
            aria-label={lang === 'en' ? 'Switch to Kannada (ಕನ್ನಡ)' : 'Switch to English'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-white hover:bg-stone-100 dark:bg-stone-900 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200/80 dark:border-stone-800 transition-all active:scale-95 cursor-pointer shadow-2xs"
            title={lang === 'en' ? 'Switch to ಕನ್ನಡ' : 'Switch to English'}
          >
            <LanguageIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{lang === 'en' ? 'ಕನ್ನಡ' : 'English'}</span>
          </button>

          {/* Global Dark / Light Mode Toggle */}
          <button
            id="nav-theme-toggle"
            type="button"
            onClick={onToggleDark}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white bg-white hover:bg-stone-100 dark:bg-stone-900 dark:hover:bg-stone-800 rounded-xl transition-all active:scale-95 cursor-pointer border border-stone-200/80 dark:border-stone-800 shadow-2xs"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? (
              <SunIcon className="w-4 h-4 text-amber-400" />
            ) : (
              <MoonIcon className="w-4 h-4 text-stone-600" />
            )}
          </button>

          {/* Session Profile */}
          {session && currentView !== 'landing' && currentView !== 'admin' && currentView !== 'admin-login' && currentView !== 'worker-login' && (
            <div className="flex items-center gap-2 pl-2 border-l border-stone-200 dark:border-stone-800">
              <div className="text-right hidden md:block">
                <div className="text-xs font-bold text-stone-900 dark:text-white">{session.name}</div>
                <div className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                  {session.role === 'worker' ? (session.jurisdictionName || 'Field Operations') : session.role === 'admin' ? 'Administrator' : 'Citizen'} • {
                    session.role === 'citizen'
                      ? (session.authProvider === 'google' ? 'Google Verified' : 'Verified Resident')
                      : (session.role === 'worker' ? (session.workerRole || 'Field Operator') : 'Municipal Administration')
                  }
                </div>
              </div>
              <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-700 dark:text-stone-300">
                {session.role === 'admin' && <ShieldCheckIcon className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
                {session.role === 'worker' && <WrenchScrewdriverIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                {session.role === 'citizen' && <UserIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
              </div>
              <button
                id="nav-logout-button"
                onClick={onLogout}
                className="text-xs text-stone-500 hover:text-rose-600 dark:hover:text-rose-400 font-semibold underline ml-1 cursor-pointer transition-colors"
                title="End Active Session"
              >
                {lang === 'kn' ? 'ನಿರ್ಗಮಿಸಿ' : 'Exit'}
              </button>
            </div>
          )}

          {/* Demo Reset Button */}
          <button
            id="nav-reset-db-button"
            onClick={onResetDb}
            title="Demo Reset: Seed Bogadi (110% Overload, 22 Load) and MCC Zone 3 (45% Load, 13 Load)"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white bg-white hover:bg-stone-100 dark:bg-stone-900 dark:hover:bg-stone-800 rounded-xl transition-all active:scale-95 cursor-pointer border border-stone-200/80 dark:border-stone-800 shadow-2xs"
          >
            <ArrowPathIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="hidden sm:inline">{lang === 'kn' ? 'ಡೆಮೊ ಮರುಹೊಂದಿಸಿ' : 'Demo Reset'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
