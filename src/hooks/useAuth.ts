'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import type { UserProfile } from '@/types/qr';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
  });

  const supabase = createClient();

  const fetchProfile = useCallback(
    async (userId: string, email?: string) => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (data) return data as UserProfile;
      // Auto-create profile for existing auth users
      const fallbackName = email?.split('@')[0] || 'User';
      const { data: created } = await supabase
        .from('profiles')
        .upsert({ id: userId, display_name: fallbackName }, { onConflict: 'id' })
        .select('*')
        .single();
      return created as UserProfile | null;
    },
    [supabase]
  );

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const profile = session?.user
        ? await fetchProfile(session.user.id, session.user.email ?? undefined)
        : null;
      setState({
        user: session?.user ?? null,
        session,
        profile,
        loading: false,
      });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const profile = session?.user
        ? await fetchProfile(session.user.id, session.user.email ?? undefined)
        : null;
      setState({
        user: session?.user ?? null,
        session,
        profile,
        loading: false,
      });
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!state.user) return { error: new Error('Non connecté') };
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', state.user.id);
    if (!error) {
      setState((prev) => ({
        ...prev,
        profile: prev.profile ? { ...prev.profile, ...updates } : null,
      }));
    }
    return { error };
  };

  return {
    ...state,
    signOut,
    updateProfile,
  };
}
