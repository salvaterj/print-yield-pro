import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { UserProfile } from '@/types';
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';

export type AuthRole = UserProfile;

export interface UserProfileRow {
  id: string;
  email: string;
  role: AuthRole;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: UserProfileRow | null;
  role: AuthRole | null;
  signInWithPassword: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchProfile(userId: string): Promise<UserProfileRow | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) return null;
  return (data as UserProfileRow | null) ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessionLoading, setSessionLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfileRow | null>(null);

  const refreshProfile = async () => {
    if (!supabase) return;
    const currentUser = (await supabase.auth.getUser()).data.user;
    if (!currentUser) {
      setProfile(null);
      return;
    }
    const nextProfile = await fetchProfile(currentUser.id);
    setProfile(nextProfile);
  };

  useEffect(() => {
    if (!supabase) {
      setSessionLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setSessionLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setSessionLoading(false);
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    setProfileLoading(true);
    fetchProfile(user.id)
      .then((p) => setProfile(p))
      .finally(() => setProfileLoading(false));
  }, [user]);

  const signInWithPassword = async (email: string, password: string) => {
    if (!supabase) return { error: 'Supabase não está configurado' };

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  const value = useMemo<AuthContextType>(() => {
    return {
      configured: isSupabaseConfigured,
      loading: sessionLoading || profileLoading,
      session,
      user,
      profile,
      role: profile?.active ? profile.role : null,
      signInWithPassword,
      signOut,
      refreshProfile,
    };
  }, [sessionLoading, profileLoading, session, user, profile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
