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
  signOut: () => Promise<void>;
  signInAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  subscriptionTier: 'free',
  isPro: false,
  signOut: async () => {},
  signInAsGuest: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionTier, setSubscriptionTier] = useState<string>('free');

  const fetchSubscription = async (userId: string, userObj: User) => {
    // Magic Mock for specific phone number
    const phone = userObj.phone || userObj.user_metadata?.phone;
    if (phone === '7012793080' || phone === '+917012793080') {
      console.log("Mocking Pro status for account:", phone);
      setSubscriptionTier('pro');
      return;
    }

    const sub = await getUserSubscription(userId);
    if (sub) {
      setSubscriptionTier(sub.tier);
    }
  };

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchSubscription(session.user.id, session.user);
      }
      setLoading(false);
    });

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchSubscription(session.user.id, session.user);
      } else {
        setSubscriptionTier('free');
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
    window.location.reload(); // Hard reset to clear all React states & memory
  };

  const signInAsGuest = () => {
    // Creating a mock user for demo purposes
    const mockUser = {
      id: 'demo-user-' + Math.random().toString(36).substr(2, 9),
      email: 'guest@example.com',
      app_metadata: {},
      user_metadata: { full_name: 'Guest User (Demo)' },
      aud: 'authenticated',
      created_at: new Date().toISOString()
    } as User;
    setUser(mockUser);
    setSubscriptionTier('free');
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      subscriptionTier, 
      isPro: subscriptionTier === 'pro',
      signOut, 
      signInAsGuest 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
