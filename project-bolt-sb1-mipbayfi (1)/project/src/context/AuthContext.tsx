import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types';
import { logAudit } from '@/lib/services';

type AuthState = 'loading' | 'unauthenticated' | 'authenticated';

interface AuthCtx {
  session: Session | null;
  profile: Profile | null;
  state: AuthState;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  sendOtp: (email: string) => Promise<void>;
  verifyOtpAndSignUp: (email: string, token: string, password: string, fullName: string) => Promise<void>;
  verifyOtpAndSignIn: (email: string, token: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [state, setState] = useState<AuthState>('loading');

  async function loadProfile(uid: string) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
    if (error) return null;
    setProfile(data as Profile | null);
    return data as Profile | null;
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      (async () => {
        if (data.session) {
          setSession(data.session);
          await loadProfile(data.session.user.id);
          setState('authenticated');
        } else {
          setState('unauthenticated');
        }
      })();
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      (async () => {
        if (event === 'SIGNED_OUT' || !sess) {
          setSession(null); setProfile(null); setState('unauthenticated');
          return;
        }
        setSession(sess);
        const p = await loadProfile(sess.user.id);
        if (p && event === 'SIGNED_IN') {
          await logAudit('login', 'auth', sess.user.id);
        }
        setState('authenticated');
      })();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };
  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { data: { full_name: fullName } },
    });
    if (error) throw error;
    if (data.user) await logAudit('register', 'auth', data.user.id, { email });
  };
  const sendOtp = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email, options: { shouldCreateUser: true },
    });
    if (error) throw error;
  };
  const verifyOtpAndSignUp = async (email: string, token: string, password: string, fullName: string) => {
    const { data: authData, error: verifyError } = await supabase.auth.verifyOtp({
      email, token, type: 'email',
    });
    if (verifyError) throw verifyError;
    const uid = authData.user?.id;
    if (uid) {
      const { error: pwError } = await supabase.auth.updateUser({ password, data: { full_name: fullName } });
      if (pwError) throw pwError;
      await logAudit('register', 'auth', uid, { email });
    }
  };
  const verifyOtpAndSignIn = async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    if (error) throw error;
  };
  const signOut = async () => {
    if (session) await logAudit('logout', 'auth', session.user.id);
    await supabase.auth.signOut();
  };
  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  };
  const refreshProfile = async () => {
    if (session) await loadProfile(session.user.id);
  };
  const updateProfile = async (patch: Partial<Profile>) => {
    if (!session) return;
    const { error } = await supabase.from('profiles').update(patch).eq('id', session.user.id);
    if (error) throw error;
    await refreshProfile();
  };

  return (
    <Ctx.Provider value={{ session, profile, state, signIn, signUp, sendOtp, verifyOtpAndSignUp, verifyOtpAndSignIn, signOut, resetPassword, refreshProfile, updateProfile }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth outside provider');
  return ctx;
}
