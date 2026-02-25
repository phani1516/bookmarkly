import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

const PROFILE_KEY = 'bookmarkly_profile';

export interface AuthState {
  user: User | null;
  displayName: string;
  loading: boolean;
}

function getStoredName(): string {
  try {
    const stored = localStorage.getItem(PROFILE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.display_name || '';
    }
  } catch { /* ignore */ }
  return '';
}

function storeProfile(name: string, email: string) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify({ display_name: name, email }));
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState<string>(getStoredName());
  const [loading, setLoading] = useState(true);

  const extractDisplayName = useCallback((u: User | null): string => {
    if (!u) return '';
    // Try user_metadata first (Google sign-in stores name here)
    const meta = u.user_metadata;
    if (meta?.full_name) return meta.full_name;
    if (meta?.name) return meta.name;
    if (meta?.display_name) return meta.display_name;
    // Fallback to stored local profile
    const stored = getStoredName();
    if (stored) return stored;
    // Final fallback to email prefix
    return u.email?.split('@')[0] || 'User';
  }, []);

  const syncProfile = useCallback(async (u: User) => {
    const name = extractDisplayName(u);
    setDisplayName(name);
    storeProfile(name, u.email || '');

    // Try to upsert profile to Supabase
    try {
      await supabase.from('profiles').upsert({
        id: u.id,
        email: u.email || '',
        display_name: name,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    } catch {
      // profiles table might not exist yet, that's ok
    }
  }, [extractDisplayName]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        syncProfile(data.user);
      }
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        syncProfile(u);
      } else {
        setDisplayName('');
        localStorage.removeItem(PROFILE_KEY);
      }
    });
    return () => subscription.unsubscribe();
  }, [syncProfile]);

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[a-zA-Z]/.test(password)) return 'Password must contain at least one letter';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) return 'Password must contain at least one special character';
    return null;
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    const pwErr = validatePassword(password);
    if (pwErr) throw new Error(pwErr);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: name,
          full_name: name,
        }
      }
    });
    if (error) throw error;
    
    if (data.user) {
      setDisplayName(name);
      storeProfile(name, email);
    }
    
    return data;
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const sendPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}`,
    });
    if (error) throw error;
  };

  const updateDisplayName = async (name: string) => {
    setDisplayName(name);
    storeProfile(name, user?.email || '');
    
    if (user) {
      await supabase.auth.updateUser({
        data: { display_name: name, full_name: name }
      });
      try {
        await supabase.from('profiles').upsert({
          id: user.id,
          email: user.email || '',
          display_name: name,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      } catch { /* ignore */ }
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setDisplayName('');
    localStorage.removeItem(PROFILE_KEY);
  };

  return {
    user,
    displayName,
    loading,
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    sendPasswordReset,
    updateDisplayName,
    signOut,
    validatePassword,
  };
}