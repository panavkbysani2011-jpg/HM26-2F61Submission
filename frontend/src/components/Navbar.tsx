import React from 'react';
import { ViewType, UserSession } from '../types';
import { Home, Shield, User, Wrench, Sun, Moon, RotateCcw, Languages } from 'lucide-react';
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
    <header className="border-b border-stone-200/90 dark:border-stone-800/90 bg-white/95 dark:bg-stone-950/95 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Portal Name */}
        <button
          id="nav-brand-button"
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-3 group text-left cursor-pointer focus:outline-hidden"
        >
          <CivicMeshLogo size="md" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-stone-900 dark:text-white tracking-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                Civic Mesh
              </span>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
                {lang === 'kn' ? 'ಮೈಸೂರು ನಗರ' : 'Mysuru City'}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium hidden sm:block">
              {lang === 'kn' ? 'ನಗರಸಭೆ ಸಮಸ್ಯೆ ಪರಿಹಾರ ವ್ಯವಸ್ಥೆ' : 'Inter-Agency Grievance Platform'}
            </p>
          </div>
        </button>

        {/* Navigation Actions, Language Toggle, Dark Mode Toggle & Session */}
        <div className="flex items-center gap-2">
          {currentView !== 'landing' && (
            <button
              id="nav-home-button"
              onClick={() => onNavigate('landing')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white bg-stone-100 dark:bg-stone-800/80 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg transition-all active:scale-95 cursor-pointer border border-stone-200/60 dark:border-stone-700/60"
            >
              <Home className="w-3.5 h-3.5 text-stone-600 dark:text-stone-400" />
              <span>{lang === 'kn' ? 'ಪೋರ್ಟಲ್ ಹಬ್' : 'Portal Hub'}</span>
            </button>
          )}

          {/* Language Toggle Button (English <-> ಕನ್ನಡ) */}
          <button
            id="nav-language-toggle"
            type="button"
            onClick={toggleLang}
            aria-label={lang === 'en' ? 'Switch to Kannada (ಕನ್ನಡ)' : 'Switch to English'}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800/80 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 border border-stone-200/60 dark:border-stone-700/60 transition-all active:scale-95 cursor-pointer"
            title={lang === 'en' ? 'Switch to ಕನ್ನಡ' : 'Switch to English'}
          >
            <Languages className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold">{lang === 'en' ? 'ಕನ್ನಡ' : 'English'}</span>
          </button>

          {/* Global Dark / Light Mode Toggle */}
          <button
            id="nav-theme-toggle"
            type="button"
            onClick={onToggleDark}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white bg-stone-100 hover:bg-stone-200 dark:bg-stone-800/80 dark:hover:bg-stone-700 rounded-lg transition-all active:scale-95 cursor-pointer border border-stone-200/60 dark:border-stone-700/60"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-stone-600" />
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
              <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 flex items-center justify-center text-stone-700 dark:text-stone-300">
                {session.role === 'admin' && <Shield className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
                {session.role === 'worker' && <Wrench className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                {session.role === 'citizen' && <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
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
            title="Demo Reset: Seed Bogadi (110% Overload, 22 Load) & MCC Zone 3 (45% Load, 13 Load)"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white bg-stone-100 hover:bg-stone-200 dark:bg-stone-800/80 dark:hover:bg-stone-700 rounded-lg transition-all active:scale-95 cursor-pointer border border-stone-200/60 dark:border-stone-700/60"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="hidden sm:inline">{lang === 'kn' ? 'ಡೆಮೊ ಮರುಹೊಂದಿಸಿ' : 'Demo Reset'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
