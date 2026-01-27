'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/entities/user/model/user-store';
import { AGE_GROUPS, AgeGroupId } from '@/shared/config/constants';

export default function LandingPage() {
  const router = useRouter();
  const { childAgeGroup, setChildAgeGroup } = useUserStore();
  const [selectedAge, setSelectedAge] = useState<AgeGroupId | null>(childAgeGroup);
  const [isHydrated, setIsHydrated] = useState(false);

  // 이미 나이를 설정한 사용자는 바로 홈으로 이동
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && childAgeGroup) {
      router.replace('/home');
    }
  }, [isHydrated, childAgeGroup, router]);

  // 하이드레이션 전이거나 리다이렉트 중이면 로딩 표시
  if (!isHydrated || childAgeGroup) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-background)' }}>
        <div className="animate-spin text-4xl">🌱</div>
      </div>
    );
  }

  const handleAgeSelect = (ageId: AgeGroupId) => {
    setSelectedAge(ageId);
  };

  const handleStart = () => {
    if (selectedAge) {
      setChildAgeGroup(selectedAge);
      router.push('/home');
    }
  };

  const handleSkip = () => {
    router.push('/home');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: 'var(--color-background)' }}>
      {/* Hero Section */}
      <div className="text-center max-w-lg mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ background: 'rgba(46, 125, 50, 0.1)' }}>
          <span className="text-2xl">🌱</span>
          <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>우리아이도서관</span>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight" style={{ color: 'var(--color-text)' }}>
          우리 아이 책,<br />
          <span style={{ color: 'var(--color-primary)' }}>현명하게 골라</span><br />
          합리적으로 구해요.
        </h1>
        
        <p className="text-lg mb-8" style={{ color: 'var(--color-text-secondary)' }}>
          나이에 맞는 책 추천부터<br />
          도서관 • 중고 • 새책 가격비교까지
        </p>
      </div>

      {/* Age Selection */}
      <div className="w-full max-w-md">
        <p className="text-center font-medium mb-4" style={{ color: 'var(--color-text-secondary)' }}>
          우리 아이 나이는?
        </p>
        
        <div className="grid grid-cols-2 gap-3 mb-6">
          {AGE_GROUPS.map((age) => (
            <button
              key={age.id}
              onClick={() => handleAgeSelect(age.id)}
              className={`age-button text-center ${selectedAge === age.id ? 'selected' : ''}`}
            >
              <div className="text-lg font-bold" style={{ color: selectedAge === age.id ? 'var(--color-primary)' : 'var(--color-text)' }}>
                {age.label}
              </div>
              <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {age.description}
              </div>
            </button>
          ))}
        </div>

        {/* CTA Buttons */}
        <button
          onClick={handleStart}
          disabled={!selectedAge}
          className="w-full py-4 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ 
            background: selectedAge ? 'var(--color-primary)' : '#ccc',
            boxShadow: selectedAge ? 'var(--shadow-md)' : 'none',
          }}
        >
          시작하기
        </button>
        
        <button
          onClick={handleSkip}
          className="w-full py-3 mt-3 text-sm"
          style={{ color: 'var(--color-text-muted)' }}
        >
          나중에 설정할게요
        </button>
      </div>

      {/* Trust Badges */}
      <div className="flex items-center gap-4 mt-12 text-sm" style={{ color: 'var(--color-text-muted)' }}>
        <span>✓ 연령별 맞춤 추천</span>
        <span>✓ 최저가 비교</span>
        <span>✓ 무료</span>
      </div>
    </div>
  );
}
