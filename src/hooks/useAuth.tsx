import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import { getUserSubscription, clearAllLocalData } from '@/lib/meal-data';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  subscriptionTier: string;
  isPro: boolean;
  expiresAt: string | null;
  sessionKey: number;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  subscriptionTier: 'free',
  isPro: false,
  expiresAt: null,
  sessionKey: 0,
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionTier, setSubscriptionTier] = useState<string>('free');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [sessionKey, setSessionKey] = useState(0);

  const fetchSubscription = async (userId: string) => {
    const sub = await getUserSubscription(userId);
    if (sub) {
      setSubscriptionTier(sub.tier);
      setExpiresAt(sub.expires_at || null);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchSubscription(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchSubscription(session.user.id);
      } else {
        setSubscriptionTier('free');
        setExpiresAt(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    clearAllLocalData();
    setUser(null);
    setSession(null);
    setSubscriptionTier('free');
    setExpiresAt(null);
    // Increment sessionKey to force full remount of Index — no page reload needed
    setSessionKey(prev => prev + 1);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      subscriptionTier,
      isPro: subscriptionTier === 'pro',
      expiresAt,
      sessionKey,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
