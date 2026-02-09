import { useState } from 'react';
import type { ThemeMode } from '@/lib/types';
import type { User } from '@supabase/supabase-js';
import { pullFromSupabase } from '@/lib/store';

interface Props {
  open: boolean;
  onClose: () => void;
  theme: ThemeMode;
  toggleTheme: () => void;
  user: User | null;
  onSignInGoogle: () => void;
  onSignInEmail: (email: string, password: string, isSignUp: boolean) => Promise<void>;
  onSignOut: () => void;
}

export function Sidebar({ open, onClose, theme, toggleTheme, user, onSignInGoogle, onSignInEmail, onSignOut }: Props) {
  const [showAbout, setShowAbout] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState('');
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [syncing, setSyncing] = useState(false);

  const handleEmailAuth = async () => {
    setAuthError('');
    try {
      await onSignInEmail(email, password, isSignUp);
      setShowAuth(false);
      setEmail('');
      setPassword('');
    } catch (e: unknown) {
      setAuthError(e instanceof Error ? e.message : 'Auth failed');
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncStatus('Syncing...');
    const result = await pullFromSupabase();
    setSyncing(false);
    setSyncStatus(result.success ? 'Synced ✓' : `Error: ${result.error}`);
    setTimeout(() => setSyncStatus(''), 5000);
  };

  return (
    <>
      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" onClick={onClose} />
      )}

      {/* Sidebar panel */}
      <div className={`fixed top-0 left-0 h-full w-72 z-50 transform transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'} bg-white/90 dark:bg-gray-900/95 backdrop-blur-xl border-r border-gray-200 dark:border-white/10 shadow-2xl`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-white/10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">MindCache</h2>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Theme toggle */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Appearance</h3>
              <button
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/15 transition"
              >
                <span className="text-sm">{theme === 'light' ? '☀️ Light Mode' : '🌙 Dark Mode'}</span>
                <div className={`w-10 h-6 rounded-full flex items-center transition-colors ${theme === 'dark' ? 'bg-blue-500 justify-end' : 'bg-gray-300 justify-start'}`}>
                  <div className="w-4 h-4 bg-white rounded-full m-1 shadow" />
                </div>
              </button>
            </div>

            {/* Auth section */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Account</h3>
              {user ? (
                <div className="space-y-3">
                  <div className="px-4 py-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30">
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium">Connected</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 truncate">{user.email}</p>
                  </div>
                  <button onClick={handleSync} disabled={syncing} className="w-full px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 text-blue-600 dark:text-blue-400 text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition disabled:opacity-50">
                    {syncing ? 'Syncing...' : '🔄 Sync Now'}
                  </button>
                  {syncStatus && (
                    <p className={`text-xs px-2 ${syncStatus.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>{syncStatus}</p>
                  )}
                  <button onClick={onSignOut} className="w-full px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition">
                    Log out
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <button onClick={onSignInGoogle} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/15 transition shadow-sm">
                    <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Connect Google
                  </button>
                  <button onClick={() => setShowAuth(!showAuth)} className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/15 transition">
                    ✉️ Email Sign In
                  </button>
                  {showAuth && (
                    <div className="space-y-2 p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full px-3 py-2 rounded-lg bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full px-3 py-2 rounded-lg bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                      {authError && <p className="text-xs text-red-500">{authError}</p>}
                      <div className="flex gap-2">
                        <button onClick={handleEmailAuth} className="flex-1 px-3 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition">
                          {isSignUp ? 'Sign Up' : 'Sign In'}
                        </button>
                      </div>
                      <button onClick={() => setIsSignUp(!isSignUp)} className="text-xs text-blue-500 dark:text-blue-400 hover:underline">
                        {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* About */}
            <div>
              <button onClick={() => setShowAbout(true)} className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/15 transition text-left">
                ℹ️ About MindCache
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* About modal */}
      {showAbout && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4" style={{ zIndex: 60 }}>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAbout(false)} />
          <div className="relative w-full max-w-sm bg-white/90 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">🧠 MindCache</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              MindCache is a personal capture-first memory app designed to save, organize, and recall links, notes, and ideas effortlessly. It prioritizes speed, clarity, and ownership of your data.
            </p>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Key Principles</p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>⚡ Fast capture</li>
                <li>📱 Local-first with optional cloud sync</li>
                <li>✨ Clean, distraction-free design</li>
                <li>🔒 User-owned data</li>
              </ul>
            </div>
            <button onClick={() => setShowAbout(false)} className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/15 transition">
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
