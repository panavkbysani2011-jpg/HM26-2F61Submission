import React from 'react';
import { ViewType, UserSession } from '../types';
import { Network, Home, Shield, User, Wrench, Sun, Moon, RotateCcw } from 'lucide-react';

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
  return (
    <header className="border-b border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Portal Name */}
        <button
          id="nav-brand-button"
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-3 group text-left transition-opacity hover:opacity-90"
        >
          <div className="w-10 h-10 rounded-xl bg-stone-900 dark:bg-amber-400 text-amber-400 dark:text-stone-950 flex items-center justify-center shadow-sm">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-stone-900 dark:text-white tracking-tight">Civic Mesh</span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Mysuru City
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 hidden sm:block">Municipal Issue Resolution System</p>
          </div>
        </button>

        {/* Navigation Actions, Dark Mode Toggle & Session */}
        <div className="flex items-center gap-2.5">
          {currentView !== 'landing' && (
            <button
              id="nav-home-button"
              onClick={() => onNavigate('landing')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Portal Hub</span>
            </button>
          )}

          {/* Global Dark / Light Mode Toggle */}
          <button
            id="nav-theme-toggle"
            type="button"
            onClick={onToggleDark}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 rounded-xl transition-colors"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-stone-600" />
            )}
          </button>

          {/* Session Profile (only visible inside active portal views, hidden on Landing and Admin views) */}
          {session && currentView !== 'landing' && currentView !== 'admin' && currentView !== 'admin-login' && (
            <div className="flex items-center gap-2 pl-2 border-l border-stone-200 dark:border-stone-800">
              <div className="text-right hidden md:block">
                <div className="text-xs font-semibold text-stone-900 dark:text-white">{session.name}</div>
                <div className="text-[11px] text-stone-500 dark:text-stone-400">
                  {session.role === 'worker' ? 'Field Worker' : session.role === 'admin' ? 'Administrator' : 'Citizen'} • {
                    session.role === 'citizen'
                      ? (session.authProvider === 'google' ? 'Google Verified' : 'Verified Resident')
                      : (session.role === 'worker' ? 'Field Operations' : 'Municipal Administration')
                  }
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 flex items-center justify-center text-stone-700 dark:text-stone-300">
                {session.role === 'admin' && <Shield className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
                {session.role === 'worker' && <Wrench className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                {session.role === 'citizen' && <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
              </div>
              <button
                id="nav-logout-button"
                onClick={onLogout}
                className="text-xs text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 underline ml-1 cursor-pointer"
                title="End Active Session"
              >
                Exit
              </button>
            </div>
          )}

          {/* Demo Reset Button: Resets all jurisdictions to 0%, Bogadi to 110% (22 load), MCC Zone 3 to 45% (13 load) */}
          <button
            id="nav-reset-db-button"
            onClick={onResetDb}
            title="Demo Reset: Seed Bogadi (110% Overload, 22 Load) & MCC Zone 3 (45% Load, 13 Load), Clear All Other Jurisdictions"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 rounded-xl transition-colors cursor-pointer border border-stone-200 dark:border-stone-700"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="hidden sm:inline">Demo Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};
