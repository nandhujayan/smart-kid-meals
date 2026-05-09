import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  subscriptionTier: string;
  isPro: boolean;
  expiresAt: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  subscriptionTier: 'free',
  isPro: false,
  expiresAt: null,
  signOut: async () => {},
});

// Fetch subscription tier from Supabase (same logic as web)
async function getUserSubscription(userId: string) {
  const { data } = await supabase
    .from('user_subscriptions')
    .select('tier, expires_at')
    .eq('user_id', userId)
    .maybeSingle();
  return data;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionTier, setSubscriptionTier] = useState<string>('free');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  const fetchSubscription = async (userId: string) => {
    const sub = await getUserSubscription(userId);
    if (sub) {
      setSubscriptionTier(sub.tier);
      setExpiresAt(sub.expires_at || null);
    }
  };

  useEffect(() => {
    // Get initial session from AsyncStorage
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchSubscription(session.user.id);
      setLoading(false);
    });

    // Listen for auth state changes
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
    setUser(null);
    setSession(null);
    setSubscriptionTier('free');
    setExpiresAt(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      subscriptionTier,
      isPro: subscriptionTier === 'pro',
      expiresAt,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
