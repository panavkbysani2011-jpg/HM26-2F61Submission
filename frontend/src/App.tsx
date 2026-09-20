import { useState, useEffect, useCallback } from 'react';
import { ViewType, UserSession, CivicIssue, DepartmentCapacity } from './types';
import { 
  getStoredIssues, 
  updateIssueStatus, 
  getStoredDepartments, 
  getStoredSession, 
  setStoredSession, 
  resetToSeedData 
} from './mockDatabase';
import { auth, onAuthStateChanged, signOutAll, testFirestoreConnection, FirebaseUser } from './firebase';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { AdminLogin } from './components/AdminLogin';
import { CitizenPortal } from './components/CitizenPortal';
import { WorkerDesk } from './components/WorkerDesk';
import { AdminDashboard } from './components/AdminDashboard';

export default function App() {
  // Navigation State Manager
  const [currentView, setCurrentView] = useState<ViewType>('landing');

  // Global Dark / Light Mode State
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('civic_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('civic_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('civic_theme', 'light');
    }
  }, [isDark]);

  const handleToggleDark = () => {
    setIsDark((prev) => !prev);
  };

  // Shared Persistent Database
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [departments, setDepartments] = useState<DepartmentCapacity[]>([]);

  // Authenticated Session State
  const [session, setSession] = useState<UserSession | null>(null);

  // Initialize data and session
  useEffect(() => {
    testFirestoreConnection();

    const loadedIssues = getStoredIssues();
    const loadedDepts = getStoredDepartments();
    const loadedSession = getStoredSession();

    setIssues(loadedIssues);
    setDepartments(loadedDepts);
    setSession(loadedSession);

    // Listen for Firebase Auth state changes
    const unsubscribeAuth = onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        setSession((prev) => {
          // If already set with this user, preserve role/details if existing
          if (prev && (prev.id === fbUser.uid || prev.firebaseUid === fbUser.uid)) {
            return prev;
          }
          const isGoogle = fbUser.providerData?.[0]?.providerId === 'google.com';
          const updated: UserSession = {
            id: fbUser.uid,
            firebaseUid: fbUser.uid,
            name: (prev?.role === 'citizen' && prev?.name) ? prev.name : (fbUser.displayName || fbUser.email?.split('@')[0] || 'Mysuru Resident'),
            email: fbUser.email || prev?.email || '',
            role: prev?.role || 'citizen',
            badge: isGoogle ? 'Google Verified Citizen' : 'Verified Resident',
            photoURL: fbUser.photoURL || undefined,
            authProvider: isGoogle ? 'google' : 'municipal_desk',
            authenticatedAt: prev?.authenticatedAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setStoredSession(updated);
          return updated;
        });
      }
    });

    // Listen for storage events across tabs or local changes
    const handleSync = () => {
      setIssues(getStoredIssues());
      setDepartments(getStoredDepartments());
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('civic_issues_updated', handleSync);

    // BroadcastChannel sync support across tabs
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('civic_mesh_sync');
        bc.onmessage = () => {
          handleSync();
        };
      }
    } catch {
      // ignore
    }

    return () => {
      unsubscribeAuth();
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('civic_issues_updated', handleSync);
      if (bc) bc.close();
    };
  }, []);

  // Update session helper
  const updateSessionState = (newSession: UserSession | null) => {
    setSession(newSession);
    setStoredSession(newSession);
  };

  // 1. Citizen Portal: Route directly to citizen portal (prompts for Name & Email if not authenticated)
  const handleEnterCitizenPortal = () => {
    // If user was in a different role (worker/admin), clear so the citizen is prompted cleanly
    if (session && session.role !== 'citizen') {
      updateSessionState(null);
    }
    setCurrentView('citizen');
  };

  // 2. Worker Desk: Route to worker view with localized field technician identity
  const handleEnterWorkerDesk = () => {
    const workerSession: UserSession = {
      id: 'wrk-042',
      name: 'Manjunatha S. (MCC Depot 3)',
      role: 'worker',
      badge: 'Field Operations',
      vehicle: 'Canter KA-09-G-4412',
      authenticatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    updateSessionState(workerSession);
    setCurrentView('worker');
  };

  // 3. Admin Dashboard: Strict login screen
  const handleEnterAdminDashboard = () => {
    if (session && session.role !== 'admin') {
      updateSessionState(null);
    }
    if (session && session.role === 'admin') {
      setCurrentView('admin');
    } else {
      setCurrentView('admin-login');
    }
  };

  // Admin Login Successful Callback
  const handleAdminLoginSuccess = () => {
    const adminSession: UserSession = {
      id: 'adm-001',
      name: 'Mysuru Civic Administration',
      role: 'admin',
      badge: 'District Oversight',
      authenticatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    updateSessionState(adminSession);
    setCurrentView('admin');
  };

  // Centralized Navigation Handler: clears worker/role state when returning to Portal Hub
  const handleNavigate = (view: ViewType) => {
    if (view === 'landing') {
      // Clear worker session so landing page and other portals are clean
      if (session && session.role === 'worker') {
        updateSessionState(null);
      }
      setCurrentView('landing');
      return;
    }
    if (view === 'citizen') {
      handleEnterCitizenPortal();
      return;
    }
    if (view === 'worker') {
      handleEnterWorkerDesk();
      return;
    }
    if (view === 'admin') {
      handleEnterAdminDashboard();
      return;
    }
    setCurrentView(view);
  };

  // Logout / Return to Portal Hub
  const handleLogout = async () => {
    try {
      await signOutAll();
    } catch {
      // ignore
    }
    updateSessionState(null);
    setCurrentView('landing');
  };

  const handleRefreshIssues = useCallback(() => {
    setIssues(getStoredIssues());
  }, []);

  const handleUpdateStatus = useCallback((id: string, status: CivicIssue['status'], crew?: string) => {
    const updated = updateIssueStatus(id, status, crew);
    setIssues(updated);
  }, []);

  const handleResetDb = useCallback(() => {
    const { issues: newIssues, departments: newDepts } = resetToSeedData();
    setIssues(newIssues);
    setDepartments(newDepts);
  }, []);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans antialiased selection:bg-amber-100 selection:text-amber-900 dark:selection:bg-amber-950 dark:selection:text-amber-100 transition-colors">
      {/* Top Navigation Bar with Dark Mode Toggle */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        session={session}
        onLogout={handleLogout}
        onResetDb={handleResetDb}
        isDark={isDark}
        onToggleDark={handleToggleDark}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'landing' && (
          <LandingPage
            onEnterCitizenPortal={handleEnterCitizenPortal}
            onEnterWorkerDesk={handleEnterWorkerDesk}
            onEnterAdminDashboard={handleEnterAdminDashboard}
            issues={issues}
            departments={departments}
          />
        )}

        {currentView === 'admin-login' && (
          <AdminLogin
            onSuccess={handleAdminLoginSuccess}
            onCancel={() => handleNavigate('landing')}
          />
        )}

        {currentView === 'citizen' && (
          <CitizenPortal
            session={session}
            onSetSession={updateSessionState}
            issues={issues}
            onRefreshIssues={handleRefreshIssues}
            onNavigateHome={() => handleNavigate('landing')}
            isDark={isDark}
          />
        )}

        {currentView === 'worker' && (
          <WorkerDesk
            session={session}
            issues={issues}
            departments={departments}
            onUpdateStatus={handleUpdateStatus}
            onNavigateHome={() => handleNavigate('landing')}
          />
        )}

        {currentView === 'admin' && (
          <AdminDashboard
            session={session}
            issues={issues}
            departments={departments}
            onUpdateStatus={handleUpdateStatus}
            onNavigateHome={() => handleNavigate('landing')}
            onResetDb={handleResetDb}
          />
        )}
      </main>

      {/* Clean Production-Grade Civic Footer */}
      <footer className="border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 py-4 px-4 sm:px-6 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 dark:text-stone-400 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-700 dark:text-stone-300">Civic Mesh</span>
            <span>•</span>
            <span>Dynamic Capacity Balancing & Municipal Dispatch</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Mysuru Urban Municipal Administration</span>
            <span>•</span>
            <span>Live Geospatial Intake</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
