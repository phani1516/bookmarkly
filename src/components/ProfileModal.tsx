import { useState } from 'react';
import { CloseIcon, UserIcon, CheckCircleIcon } from './Icons';
import type { User } from '@supabase/supabase-js';

interface Props {
  open: boolean;
  onClose: () => void;
  user: User | null;
  displayName: string;
  onUpdateName: (name: string) => Promise<void>;
}

export function ProfileModal({ open, onClose, user, displayName, onUpdateName }: Props) {
  const [name, setName] = useState(displayName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!open || !user) return null;

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onUpdateName(name.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-[400px] animate-scale-in"
        style={{
          background: 'var(--bg-primary)',
          borderRadius: '24px',
          border: '1px solid var(--surface-border)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
        }}>

        <div className="relative px-6 pt-6 pb-4">
          <button onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl hover:bg-[var(--surface)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition">
            <CloseIcon size={18} />
          </button>

          <div className="flex flex-col items-center text-center pt-2 pb-4">
            <div className="w-16 h-16 rounded-full gradient-accent flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-[var(--accent-glow)] mb-4">
              {(displayName || 'U')[0].toUpperCase()}
            </div>
            <h2 className="logo-text text-xl text-[var(--text-primary)]">{displayName || 'User'}</h2>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">{user.email}</p>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <UserIcon size={12} />
              Display Name
            </label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Your name" className="input-field text-sm"
              onKeyDown={e => e.key === 'Enter' && handleSave()} />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5 block">
              Email
            </label>
            <div className="input-field text-sm opacity-60 cursor-not-allowed select-all">
              {user.email}
            </div>
          </div>

          <button onClick={handleSave} disabled={saving || name.trim() === displayName}
            className="btn-primary w-full text-sm py-3.5 disabled:opacity-50 flex items-center justify-center gap-2">
            {saved && <CheckCircleIcon size={14} />}
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Update Name'}
          </button>
        </div>
      </div>
    </div>
  );
}