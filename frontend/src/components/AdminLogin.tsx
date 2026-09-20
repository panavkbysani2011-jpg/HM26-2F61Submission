import React, { useState } from 'react';
import { Shield, Lock, User, AlertCircle, ArrowLeft, KeyRound, Check } from 'lucide-react';

interface AdminLoginProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onCancel }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // Strict validation as requested: username: "admin", password: "devpass2026"
    setTimeout(() => {
      if (username.trim() === 'admin' && password === 'devpass2026') {
        onSuccess();
      } else {
        setError('Authentication failed. Invalid municipal clearance credentials.');
        setIsSubmitting(false);
      }
    }, 250);
  };

  const handleFillStandardCredentials = () => {
    setUsername('admin');
    setPassword('devpass2026');
    setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-stone-50 dark:bg-stone-950 flex items-center justify-center p-4 text-stone-900 dark:text-stone-100 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-sm p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-400 mx-auto flex items-center justify-center border border-rose-100 dark:border-rose-800">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-white">Municipal Clearance</h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Restricted administrative oversight and dynamic capacity dispatch
          </p>
        </div>

        {/* Clearance Access Note */}
        <div className="bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl p-3.5 text-xs text-stone-800 dark:text-stone-300 flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <KeyRound className="w-4 h-4 text-stone-600 dark:text-stone-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-stone-900 dark:text-white">Authorized Credentials:</span>
              <div className="mt-0.5 font-mono text-[11px] text-stone-700 dark:text-stone-300">
                User: <span className="font-bold">admin</span> • Pass: <span className="font-bold">devpass2026</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleFillStandardCredentials}
            className="text-[11px] text-stone-700 dark:text-stone-200 bg-stone-200 hover:bg-stone-300 dark:bg-stone-700 dark:hover:bg-stone-600 px-2 py-1 rounded font-medium transition-colors shrink-0"
          >
            Fill
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div 
            id="admin-login-error"
            className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-xs text-rose-800 dark:text-rose-300"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="admin-username" className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
              Clearance Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400 dark:text-stone-500">
                <User className="w-4 h-4" />
              </div>
              <input
                id="admin-username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full pl-9 pr-3 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="admin-password" className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
              Security Access Key
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400 dark:text-stone-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="devpass2026"
                className="w-full pl-9 pr-3 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-colors"
              />
            </div>
          </div>

          <button
            id="admin-submit-button"
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-stone-900 dark:bg-rose-700 hover:bg-rose-700 dark:hover:bg-rose-600 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Verifying authorization...</span>
            ) : (
              <>
                <span>Access Command Dashboard</span>
                <Check className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Back Link */}
        <div className="pt-2 text-center border-t border-stone-100 dark:border-stone-800">
          <button
            id="admin-cancel-button"
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Portal Hub</span>
          </button>
        </div>
      </div>
    </div>
  );
};
