'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/entities/user/model/user-store';
import { OnboardingFunnel } from '@/features/onboarding/ui/OnboardingFunnel';

export default function LandingPage() {
  const router = useRouter();
  const { childAgeGroup } = useUserStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && childAgeGroup) {
      router.replace('/home');
    }
  }, [isHydrated, childAgeGroup, router]);

  if (!isHydrated || childAgeGroup) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-background)' }}>
        <div className="animate-spin text-4xl">🌱</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
      {/* Hero Section */}
      <div className="text-center max-w-lg mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 bg-green-100">
          <span className="text-2xl">🌱</span>
          <span className="font-semibold text-green-800">우리아이도서관</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight text-slate-900">
          우리 아이 책,<br />
          <span className="text-green-600">성향에 딱 맞게</span><br />
          골라드릴게요.
        </h1>

        <p className="text-lg text-slate-600">
          나이, 기질, 관심사까지 고려한<br />
          프리미엄 AI 큐레이션
        </p>
      </div>

      {/* Onboarding Funnel */}
      <OnboardingFunnel />

      {/* Trust Badges */}
      <div className="flex items-center gap-4 mt-12 text-sm text-slate-400">
        <span>✓ 전문가 검증</span>
        <span>✓ 6대 영역 분석</span>
        <span>✓ 무료</span>
      </div>
    </div>
  );
}

