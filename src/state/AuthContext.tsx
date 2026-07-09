import { Session } from '@supabase/supabase-js';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  fetchActiveAppointment,
  fetchBarber,
  fetchProfile,
} from '../api';
import { supabase } from '../lib/supabase';
import { Appointment, AuthProvider as Provider, Barber, Profile } from '../lib/types';

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  barber: Barber | null; // set when profile.role === 'barber'
  activeAppointment: Appointment | null;
  authProvider: Provider | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  refreshAppointment: () => Promise<void>;
  setActiveAppointment: (a: Appointment | null) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  profile: null,
  barber: null,
  activeAppointment: null,
  authProvider: null,
  loading: true,
  refreshProfile: async () => {},
  refreshAppointment: async () => {},
  setActiveAppointment: () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [barber, setBarber] = useState<Barber | null>(null);
  const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = useCallback(async (s: Session | null) => {
    if (!s?.user) {
      setProfile(null);
      setBarber(null);
      setActiveAppointment(null);
      return;
    }
    try {
      const p = await fetchProfile(s.user.id);
      setProfile(p);
      if (p?.role === 'barber') {
        setBarber(await fetchBarber(p.id));
        setActiveAppointment(null);
      } else {
        setBarber(null);
        setActiveAppointment(p ? await fetchActiveAppointment(p.id) : null);
      }
    } catch {
      // keep whatever we have; screens surface their own errors
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadUserData(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      await loadUserData(s);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadUserData]);

  const refreshProfile = useCallback(async () => {
    await loadUserData(session);
  }, [loadUserData, session]);

  const refreshAppointment = useCallback(async () => {
    if (profile && profile.role === 'customer') {
      setActiveAppointment(await fetchActiveAppointment(profile.id));
    }
  }, [profile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const authProvider: Provider | null = session?.user
    ? ((session.user.app_metadata?.provider as Provider) ?? 'email')
    : null;

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        barber,
        activeAppointment,
        authProvider,
        loading,
        refreshProfile,
        refreshAppointment,
        setActiveAppointment,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
