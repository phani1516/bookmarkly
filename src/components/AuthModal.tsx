import { useState } from 'react';
import { CloseIcon, GoogleIcon, MailIcon, EyeIcon, EyeOffIcon, KeyIcon, CheckCircleIcon, BookmarkIcon } from './Icons';

type AuthView = 'main' | 'signin' | 'signup' | 'forgot' | 'forgot-sent';

interface Props {
  open: boolean;
  onClose: () => void;
  onSignInGoogle: () => void;
  onSignInEmail: (email: string, password: string) => Promise<void>;
  onSignUpEmail: (email: string, password: string, name: string) => Promise<void>;
  onForgotPassword: (email: string) => Promise<void>;
  validatePassword: (password: string) => string | null;
}

export function AuthModal({ open, onClose, onSignInGoogle, onSignInEmail, onSignUpEmail, onForgotPassword, validatePassword }: Props) {
  const [view, setView] = useState<AuthView>('main');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setError('');
    setShowPassword(false);
    setShowConfirm(false);
    setLoading(false);
  };

  const handleClose = () => {
    resetForm();
    setView('main');
    onClose();
  };

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onSignInEmail(email, password);
      handleClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    const pwErr = validatePassword(password);
    if (pwErr) {
      setError(pwErr);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onSignUpEmail(email, password, name);
      handleClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) {
      setError('Please enter your email');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onForgotPassword(forgotEmail);
      setView('forgot-sent');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (pw: string): { label: string; color: string; width: string } => {
    if (!pw) return { label: '', color: '', width: '0%' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw)) score++;
    if (score <= 1) return { label: 'Weak', color: '#ef4444', width: '25%' };
    if (score === 2) return { label: 'Fair', color: '#f59e0b', width: '50%' };
    if (score === 3) return { label: 'Good', color: '#3b82f6', width: '75%' };
    return { label: 'Strong', color: '#22c55e', width: '100%' };
  };

  if (!open) return null;

  const strength = getPasswordStrength(password);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-md" onClick={handleClose} />
      <div className="relative w-full max-w-[400px] animate-scale-in overflow-hidden"
        style={{
          background: 'var(--bg-primary)',
          borderRadius: '24px',
          border: '1px solid var(--surface-border)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
        }}>

        {/* Header */}
        <div className="relative px-6 pt-6 pb-4">
          <button onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-xl hover:bg-[var(--surface)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition z-10">
            <CloseIcon size={18} />
          </button>

          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-[14px] gradient-accent flex items-center justify-center shadow-lg shadow-[var(--accent-glow)]">
              <BookmarkIcon size={20} className="text-white" />
            </div>
            <div>
              <h2 className="logo-text text-lg text-[var(--text-primary)]">Bookmarkly</h2>
              <p className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                {view === 'main' && 'Welcome'}
                {view === 'signin' && 'Sign In'}
                {view === 'signup' && 'Create Account'}
                {view === 'forgot' && 'Reset Password'}
                {view === 'forgot-sent' && 'Email Sent'}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          {/* Main view */}
          {view === 'main' && (
            <div className="space-y-3">
              <p className="text-sm text-[var(--text-secondary)] mb-4">Sign in to sync your bookmarks across devices.</p>
              
              <button onClick={() => { onSignInGoogle(); handleClose(); }}
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-[14px] bg-[var(--surface)] border border-[var(--surface-border)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition active:scale-[0.98]">
                <GoogleIcon size={18} />
                Continue with Google
              </button>

              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-[var(--surface-border)]" />
                <span className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-[var(--surface-border)]" />
              </div>

              <button onClick={() => { resetForm(); setView('signin'); }}
                className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-[14px] bg-[var(--surface)] border border-[var(--surface-border)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition active:scale-[0.98]">
                <MailIcon size={15} />
                Sign in with Email
              </button>

              <button onClick={() => { resetForm(); setView('signup'); }}
                className="w-full text-center text-xs font-medium text-[var(--accent)] hover:opacity-80 transition pt-2">
                Don&apos;t have an account? Create one
              </button>
            </div>
          )}

          {/* Sign In view */}
          {view === 'signin' && (
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5 block">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com" className="input-field text-sm" autoFocus />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5 block">Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter password" className="input-field text-sm pr-12"
                    onKeyDown={e => e.key === 'Enter' && handleSignIn()} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition">
                    {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                  </button>
                </div>
              </div>

              <button onClick={() => { setForgotEmail(email); setError(''); setView('forgot'); }}
                className="text-[11px] font-medium text-[var(--accent)] hover:opacity-80 transition">
                Forgot password?
              </button>

              {error && <p className="text-[12px] text-red-500 font-medium bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}

              <button onClick={handleSignIn} disabled={loading}
                className="btn-primary w-full text-sm py-3.5 mt-2 disabled:opacity-50">
                {loading ? 'Signing in…' : 'Sign In'}
              </button>

              <div className="flex items-center justify-between pt-1">
                <button onClick={() => { resetForm(); setView('main'); }}
                  className="text-[11px] font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition">
                  ← Back
                </button>
                <button onClick={() => { resetForm(); setView('signup'); }}
                  className="text-[11px] font-medium text-[var(--accent)] hover:opacity-80 transition">
                  Create account
                </button>
              </div>
            </div>
          )}

          {/* Sign Up view */}
          {view === 'signup' && (
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5 block">Full Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="John Doe" className="input-field text-sm" autoFocus />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5 block">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com" className="input-field text-sm" />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5 block">Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min 8 chars, letter, number & symbol" className="input-field text-sm pr-12" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition">
                    {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                  </button>
                </div>
                {/* Password strength bar */}
                {password && (
                  <div className="mt-2 space-y-1">
                    <div className="h-1.5 rounded-full bg-[var(--surface-border)] overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-300" style={{ width: strength.width, backgroundColor: strength.color }} />
                    </div>
                    <p className="text-[10px] font-semibold" style={{ color: strength.color }}>{strength.label}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5 block">Confirm Password</label>
                <div className="relative">
                  <input type={showConfirm ? 'text' : 'password'} value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password" className="input-field text-sm pr-12"
                    onKeyDown={e => e.key === 'Enter' && handleSignUp()} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition">
                    {showConfirm ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-[10px] text-red-500 font-medium mt-1">Passwords do not match</p>
                )}
                {confirmPassword && password === confirmPassword && confirmPassword.length > 0 && (
                  <p className="text-[10px] text-green-500 font-medium mt-1 flex items-center gap-1">
                    <CheckCircleIcon size={10} /> Passwords match
                  </p>
                )}
              </div>

              {error && <p className="text-[12px] text-red-500 font-medium bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}

              <button onClick={handleSignUp} disabled={loading}
                className="btn-primary w-full text-sm py-3.5 mt-2 disabled:opacity-50">
                {loading ? 'Creating account…' : 'Create Account'}
              </button>

              <div className="flex items-center justify-between pt-1">
                <button onClick={() => { resetForm(); setView('main'); }}
                  className="text-[11px] font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition">
                  ← Back
                </button>
                <button onClick={() => { resetForm(); setView('signin'); }}
                  className="text-[11px] font-medium text-[var(--accent)] hover:opacity-80 transition">
                  Already have an account?
                </button>
              </div>
            </div>
          )}

          {/* Forgot Password view */}
          {view === 'forgot' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-[14px] bg-amber-500/10 flex items-center justify-center">
                  <KeyIcon size={18} className="text-amber-500" />
                </div>
                <p className="text-sm text-[var(--text-secondary)]">Enter your email and we&apos;ll send you a link to reset your password.</p>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5 block">Email Address</label>
                <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                  placeholder="your@email.com" className="input-field text-sm" autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleForgotPassword()} />
              </div>

              {error && <p className="text-[12px] text-red-500 font-medium bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}

              <button onClick={handleForgotPassword} disabled={loading}
                className="btn-primary w-full text-sm py-3.5 mt-2 disabled:opacity-50">
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>

              <button onClick={() => { resetForm(); setView('signin'); }}
                className="text-[11px] font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition pt-1">
                ← Back to Sign In
              </button>
            </div>
          )}

          {/* Forgot Password Sent view */}
          {view === 'forgot-sent' && (
            <div className="text-center space-y-4 py-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-green-500/10 flex items-center justify-center">
                <CheckCircleIcon size={28} className="text-green-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">Check your email</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1.5">
                  We sent a password reset link to <strong>{forgotEmail}</strong>
                </p>
              </div>
              <button onClick={handleClose} className="btn-secondary w-full text-sm py-3">Done</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
