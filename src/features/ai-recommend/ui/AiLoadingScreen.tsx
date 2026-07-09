'use client';

import { useState, useEffect } from 'react';

const LOADING_STEPS = [
  { id: 1, text: '📖 알라딘에서 조건에 어울리는 대표 도서들을 수집하고 있어요...' },
  { id: 2, text: '🔍 학부모님들이 남겨주신 찐후기와 평점을 꼼꼼히 대조하는 중...' },
  { id: 3, text: '🤖 Kimi AI 비서가 아이의 연령과 기질을 기반으로 찰떡 도서를 엄선하는 중...' },
  { id: 4, text: '✨ 완성되었습니다! 정교한 맞춤 큐레이션 결과를 로드합니다...' }
];

export function AiLoadingScreen() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < LOADING_STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1500); // 1.5초 간격으로 스텝 갱신

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-6 max-w-md mx-auto">
      {/* Dynamic book flipping animation */}
      <div className="relative w-20 h-20 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-4 border-orange-100 animate-pulse" />
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center text-3xl animate-bounce"
          style={{ animationDuration: '1.2s' }}
        >
          📚
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-bold text-lg animate-pulse" style={{ color: 'var(--color-text)' }}>
          우리아이 맞춤 추천 분석 중
        </h3>
        <p className="text-sm min-h-[40px] transition-all duration-300 font-medium" style={{ color: 'var(--color-primary)' }}>
          {LOADING_STEPS[currentStep].text}
        </p>
      </div>

      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-secondary)' }}>
        <div 
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ 
            width: `${((currentStep + 1) / LOADING_STEPS.length) * 100}%`,
            background: 'linear-gradient(90deg, #FF6B00 0%, #FF8F3D 100%)'
          }}
        />
      </div>
    </div>
  );
}
