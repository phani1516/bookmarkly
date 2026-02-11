import { useState, useRef } from 'react';
import type { ThemeMode } from '@/lib/types';
import type { User } from '@supabase/supabase-js';
import { fullSync, exportToCSV, importFromCSV, deleteAllUserData } from '@/lib/store';
import type { SyncStatus } from '@/lib/store';
import {
  CloseIcon, SunIcon, MoonIcon, SyncIcon, UserIcon,
  InfoIcon, LogOutIcon, BookmarkIcon, DownloadIcon, UploadIcon,
  AlertIcon, UsersIcon,
} from './Icons';

interface Props {
  open: boolean;
  onClose: () => void;
  theme: ThemeMode;
  toggleTheme: () => void;
  user: User | null;
  displayName: string;
  syncStatus: SyncStatus;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onSignOut: () => void;
  onOpenCommunity: () => void;
}

export function Sidebar({ open, onClose, theme, toggleTheme, user, displayName, syncStatus, onOpenAuth, onOpenProfile, onSignOut, onOpenCommunity }: Props) {
  const [showAbout, setShowAbout] = useState(false);
  const [localSyncMsg, setLocalSyncMsg] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const importRef = useRef<HTMLInputElement>(null);

  const handleSync = async () => {
    if (!user) { setLocalSyncMsg('Sign in first to sync'); setTimeout(() => setLocalSyncMsg(''), 3000); return; }
    setSyncing(true); setLocalSyncMsg('');
    try {
      const result = await fullSync();
      setLocalSyncMsg(result.message);
    } catch { setLocalSyncMsg('Sync failed. Try again.'); }
    finally { setSyncing(false); setTimeout(() => setLocalSyncMsg(''), 8000); }
  };

  const handleExport = () => {
    const data = exportToCSV();
    downloadCSV('bookmarkly_categories.csv', data.categories);
    setTimeout(() => downloadCSV('bookmarkly_links.csv', data.links), 500);
  };

  const downloadCSV = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      setImportMsg('Error: Only .csv files are accepted');
      setTimeout(() => setImportMsg(''), 5000);
      return;
    }
    const text = await file.text();
    const fileName = file.name.toLowerCase();
    const fileType = fileName.includes('categor') ? 'categories' as const : 'links' as const;
    const result = await importFromCSV(text, fileType);
    setImportMsg(result.success ? `✓ ${result.message}` : `✗ ${result.message}`);
    setTimeout(() => setImportMsg(''), 5000);
    if (importRef.current) importRef.current.value = '';
  };

  const handleDeleteAccount = async () => {
    if (deleteText !== 'DELETE') return;
    setDeleting(true);
    const result = await deleteAllUserData();
    if (result.success) {
      onClose();
      window.location.reload();
    } else {
      setImportMsg(`✗ ${result.message}`);
      setDeleting(false);
    }
  };

  const formatLastSync = (iso: string | null) => {
    if (!iso) return 'Never synced';
    const d = new Date(iso);
    const diffMs = new Date().getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const statusMsg = localSyncMsg || syncStatus.message;
  const isError = statusMsg.toLowerCase().includes('error') || statusMsg.toLowerCase().includes('fail');

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm animate-fade-in" onClick={onClose} />}

      <div className={`fixed top-0 left-0 h-full w-[300px] z-50 transform transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: theme === 'dark' ? 'rgba(10,10,15,0.97)' : 'rgba(248,249,252,0.97)', backdropFilter: 'blur(24px) saturate(180%)' }}>
        <div className="flex flex-col h-full border-r border-[var(--surface-border)]">
          {/* Header */}
          <div className="px-6 pt-6 pb-5 border-b border-[var(--surface-border)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[12px] gradient-accent flex items-center justify-center shadow-lg shadow-[var(--accent-glow)]">
                  <BookmarkIcon size={18} className="text-white" />
                </div>
                <span className="logo-text text-xl text-[var(--text-primary)]">Bookmarkly</span>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--surface)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition">
                <CloseIcon size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
            {/* Account */}
            <div>
              <p className="section-title mb-3 px-1">Account</p>
              {user ? (
                <div className="space-y-2.5">
                  <button onClick={() => { onOpenProfile(); onClose(); }}
                    className="w-full text-left px-4 py-3.5 card-sm hover:bg-[var(--surface-hover)] transition">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full gradient-accent flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {(displayName || 'U')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{displayName || 'User'}</p>
                        <p className="text-[10px] font-medium text-[var(--accent)] uppercase tracking-wider mt-0.5">View Profile →</p>
                      </div>
                    </div>
                  </button>

                  {/* Sync */}
                  <div className="card-sm overflow-hidden">
                    <button onClick={handleSync} disabled={syncing}
                      className="w-full flex items-center justify-between px-4 py-3.5 text-sm font-medium text-[var(--accent)] hover:bg-[var(--surface-hover)] disabled:opacity-50 transition">
                      <span className="flex items-center gap-2">
                        <SyncIcon size={15} className={syncing ? 'animate-spin' : ''} />
                        {syncing ? 'Syncing…' : 'Sync Now'}
                      </span>
                      <span className="text-[10px] font-medium text-[var(--text-tertiary)]">{formatLastSync(syncStatus.lastSync)}</span>
                    </button>
                    {statusMsg && (
                      <div className={`px-4 py-2.5 text-[11px] font-medium border-t border-[var(--surface-border)] ${
                        isError ? 'text-red-500 bg-red-500/5' : 'text-green-600 bg-green-500/5'
                      }`}>{statusMsg}</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <button onClick={() => { onOpenAuth(); onClose(); }}
                    className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 card-sm text-sm font-semibold text-[var(--accent)] hover:bg-[var(--surface-hover)] transition">
                    <UserIcon size={16} /> Sign in / Create account
                  </button>
                  <p className="text-[10px] text-[var(--text-tertiary)] px-1 leading-relaxed">
                    Sign in to save your bookmarks to the cloud and access them from any device.
                  </p>
                </div>
              )}
            </div>

            {/* Community */}
            <div>
              <button onClick={() => { onOpenCommunity(); onClose(); }}
                className="w-full flex items-center gap-3 px-4 py-3.5 card-sm text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition">
                <UsersIcon size={16} className="text-[var(--accent)]" /> Community
              </button>
            </div>

            {/* Import / Export */}
            <div>
              <p className="section-title mb-3 px-1">Data</p>
              <div className="space-y-2">
                <button onClick={handleExport}
                  className="w-full flex items-center gap-3 px-4 py-3 card-sm text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition">
                  <DownloadIcon size={15} className="text-[var(--accent)]" /> Export Data (CSV)
                </button>

                <button onClick={() => importRef.current?.click()}
                  className="w-full flex items-center gap-3 px-4 py-3 card-sm text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition">
                  <UploadIcon size={15} className="text-[var(--accent)]" /> Import Data (CSV)
                </button>
                <input ref={importRef} type="file" accept=".csv" onChange={handleImport} className="hidden" />

                {importMsg && (
                  <p className={`text-[11px] font-medium px-3 py-2 rounded-lg ${
                    importMsg.startsWith('✓') ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'
                  }`}>{importMsg}</p>
                )}
              </div>
            </div>

            {/* Theme */}
            <div>
              <p className="section-title mb-3 px-1">Appearance</p>
              <button onClick={toggleTheme} className="w-full flex items-center justify-between px-4 py-3.5 card-sm">
                <span className="flex items-center gap-3 text-sm font-medium text-[var(--text-primary)]">
                  {theme === 'light' ? <SunIcon size={18} /> : <MoonIcon size={18} />}
                  {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
                </span>
                <div className={`w-11 h-[26px] rounded-full flex items-center transition-all duration-300 ${theme === 'dark' ? 'bg-[var(--accent)] justify-end' : 'bg-gray-300 dark:bg-gray-600 justify-start'}`}>
                  <div className="w-[20px] h-[20px] bg-white rounded-full m-[3px] shadow-md transition-all" />
                </div>
              </button>
            </div>

            {/* About */}
            <div>
              <button onClick={() => setShowAbout(true)}
                className="w-full flex items-center gap-3 px-4 py-3.5 card-sm text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition">
                <InfoIcon size={16} /> About Bookmarkly
              </button>
            </div>

            {/* Logout + Delete Account */}
            {user && (
              <div className="space-y-2 pt-2 border-t border-[var(--surface-border)]">
                <button onClick={() => { onSignOut(); onClose(); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3.5 card-sm text-sm font-medium text-red-500 hover:bg-red-500/5 transition">
                  <LogOutIcon size={15} /> Log Out
                </button>
                <button onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-[11px] font-medium text-red-400 hover:text-red-500 transition">
                  <AlertIcon size={12} /> Delete Account
                </button>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-[var(--surface-border)]">
            <p className="text-[10px] text-[var(--text-tertiary)] text-center">Bookmarkly v2.0 · Your data, your control</p>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-5">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-md" onClick={() => { setShowDeleteConfirm(false); setDeleteText(''); }} />
          <div className="relative w-full max-w-sm animate-scale-in"
            style={{ background: 'var(--bg-primary)', borderRadius: '24px', border: '1px solid var(--surface-border)', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
            <div className="p-7 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-[14px] bg-red-500/10 flex items-center justify-center">
                  <AlertIcon size={22} className="text-red-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">Delete Account</h3>
                  <p className="text-[10px] text-red-500 font-medium uppercase tracking-wider">This action is irreversible</p>
                </div>
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                This will permanently delete all your data (links, categories, notes) from the cloud and sign you out.
              </p>
              <div>
                <label className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5 block">
                  Type DELETE to confirm
                </label>
                <input type="text" value={deleteText} onChange={e => setDeleteText(e.target.value)}
                  placeholder="DELETE" className="input-field text-sm" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleDeleteAccount} disabled={deleteText !== 'DELETE' || deleting}
                  className="flex-1 py-3 rounded-[14px] bg-red-500 text-white text-sm font-semibold disabled:opacity-30 transition hover:bg-red-600">
                  {deleting ? 'Deleting…' : 'Delete Everything'}
                </button>
                <button onClick={() => { setShowDeleteConfirm(false); setDeleteText(''); }}
                  className="btn-secondary text-sm py-3 px-5">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* About modal */}
      {showAbout && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-5">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-md" onClick={() => setShowAbout(false)} />
          <div className="relative w-full max-w-sm animate-scale-in"
            style={{ background: 'var(--bg-primary)', borderRadius: '24px', border: '1px solid var(--surface-border)', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
            <div className="p-7 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-[14px] gradient-accent flex items-center justify-center shadow-lg shadow-[var(--accent-glow)]">
                  <BookmarkIcon size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="logo-text text-lg text-[var(--text-primary)]">Bookmarkly</h3>
                  <p className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Capture · Organize · Recall</p>
                </div>
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Bookmarkly is a personal capture-first memory app designed to save, organize, and recall links, notes, and ideas effortlessly.
              </p>
              <div className="space-y-2.5">
                <p className="section-title">Key Principles</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: '⚡', text: 'Fast Capture' },
                    { icon: '📱', text: 'Local-First' },
                    { icon: '✨', text: 'Clean Design' },
                    { icon: '🔒', text: 'User-Owned Data' },
                  ].map(p => (
                    <div key={p.text} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[var(--surface)] text-xs font-medium text-[var(--text-secondary)]">
                      <span>{p.icon}</span>{p.text}
                    </div>
                  ))}
                </div>
              </div>
              {/* Prototype notice */}
              <div className="flex items-start gap-2.5 px-3 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <AlertIcon size={14} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed font-medium">
                  This app is currently in <strong>prototype stage</strong> and is not designed for a large user base. Features and stability may evolve over time.
                </p>
              </div>
              <button onClick={() => setShowAbout(false)} className="btn-secondary w-full text-sm py-3 mt-2">Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
