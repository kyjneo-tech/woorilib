'use client';

import { useEffect, useState, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/shared/lib/supabase/client';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);

  useEffect(() => {
    // 중복 실행 방지
    if (initializedRef.current) return;
    initializedRef.current = true;

    let subscription: { unsubscribe: () => void } | null = null;

    const init = async () => {
      try {
        const supabase = createClient();

        // Get initial session
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.warn('[useAuth] Supabase auth error (DB가 비활성 상태일 수 있음):', error.message);
          setUser(null);
          setLoading(false);
          return;
        }
        setUser(data?.user ?? null);
        setLoading(false);

        // Listen for auth changes
        const { data: { subscription: sub } } = supabase.auth.onAuthStateChange(
          (_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
          }
        );
        subscription = sub;
      } catch (err) {
        console.warn('[useAuth] Supabase 연결 실패:', err);
        setUser(null);
        setLoading(false);
      }
    };

    init();

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (err) {
      return { error: { message: 'Supabase 연결 실패' } };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({ email, password });
      return { error };
    } catch (err) {
      return { error: { message: 'Supabase 연결 실패' } };
    }
  };

  const signOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // 무시
    }
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
  };
}
