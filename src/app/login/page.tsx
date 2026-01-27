'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/shared/lib/supabase/client';

export default function LoginPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleSocialLogin = async (provider: 'kakao' | 'google') => {
    setLoading(provider);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      setError(err.message || '로그인에 실패했습니다.');
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--color-background)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <Link href="/" className="flex flex-col items-center justify-center gap-2 mb-8">
          <span className="text-5xl">🌱</span>
          <span className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>우리아이도서관</span>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            우리 아이 책, 현명하게 골라 합리적으로 구해요
          </p>
        </Link>

        {/* Login Card */}
        <div className="card p-6">
          <h1 className="text-xl font-bold text-center mb-6" style={{ color: 'var(--color-text)' }}>
            로그인
          </h1>

          <div className="space-y-3">
            {/* Kakao Login */}
            <button
              onClick={() => handleSocialLogin('kakao')}
              disabled={loading !== null}
              className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
              style={{ background: '#FEE500', color: '#191919' }}
            >
              {loading === 'kakao' ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3C6.48 3 2 6.58 2 11c0 2.8 1.87 5.25 4.67 6.67-.15.54-.97 3.46-.99 3.66 0 0-.02.16.08.22.1.06.23.01.23.01.31-.04 3.6-2.36 4.17-2.77.6.09 1.22.13 1.84.13 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/>
                  </svg>
                  카카오로 시작하기
                </>
              )}
            </button>

            {/* Google Login */}
            <button
              onClick={() => handleSocialLogin('google')}
              disabled={loading !== null}
              className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-opacity disabled:opacity-50 border"
              style={{ background: 'white', color: '#333', borderColor: '#ddd' }}
            >
              {loading === 'google' ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google로 시작하기
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-lg text-sm text-center" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
              {error}
            </div>
          )}

          <p className="text-xs text-center mt-6" style={{ color: 'var(--color-text-muted)' }}>
            로그인 시 <span className="underline">이용약관</span>과 <span className="underline">개인정보처리방침</span>에 동의합니다.
          </p>
        </div>

        {/* Skip Link */}
        <div className="text-center mt-6">
          <Link href="/home" className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            로그인 없이 둘러보기 →
          </Link>
        </div>
      </div>
    </div>
  );
}
