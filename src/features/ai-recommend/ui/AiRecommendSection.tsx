'use client';

import { useState, useEffect } from 'react';
import { useUserStore } from '@/entities/user/model/user-store';
import { AiChatInput } from './AiChatInput';
import { AiLoadingScreen } from './AiLoadingScreen';
import { AiResultCard } from './AiResultCard';
import { Book } from '@/entities/book/model/types';

type SearchStatus = 'idle' | 'loading' | 'success' | 'error' | 'rate-limited';

interface UsageState {
  date: string;
  count: number;
}

export function AiRecommendSection() {
  const userStore = useUserStore();
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [activeQuery, setActiveQuery] = useState('');
  const [usageCount, setUsageCount] = useState(0);

  const LIMIT_COUNT = 3; // 1일 무료 AI 검색 제한 수

  // 오늘 날짜 문자열 구하기 (KST 기준)
  const getTodayString = () => {
    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const kst = new Date(utc + (9 * 3600000));
    return kst.toISOString().split('T')[0];
  };

  // 로컬스토리지에서 오늘의 AI 사용량 가져오기
  useEffect(() => {
    const today = getTodayString();
    const stored = localStorage.getItem('woorilib_ai_usage');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as UsageState;
        if (parsed.date === today) {
          setUsageCount(parsed.count);
        } else {
          // 날짜가 다르면 초기화
          localStorage.setItem('woorilib_ai_usage', JSON.stringify({ date: today, count: 0 }));
          setUsageCount(0);
        }
      } catch {
        localStorage.setItem('woorilib_ai_usage', JSON.stringify({ date: today, count: 0 }));
      }
    } else {
      localStorage.setItem('woorilib_ai_usage', JSON.stringify({ date: today, count: 0 }));
    }
  }, []);

  // AI 검색 실행 핸들러
  const handleRecommendSubmit = async (query: string) => {
    const today = getTodayString();
    
    // 1. 선제적 한도 검사 (이미 한도 초과 상태라면)
    if (usageCount >= LIMIT_COUNT) {
      setStatus('rate-limited');
      return;
    }

    setStatus('loading');
    setActiveQuery(query);

    try {
      const response = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          childAgeGroup: userStore.childAgeGroup,
          gender: userStore.gender,
          propensity: userStore.propensity,
          interests: userStore.interests,
        }),
      });

      if (!response.ok) {
        throw new Error('API 응답에 오류가 발생했습니다.');
      }

      const data = await response.json();
      setRecommendations(data.recommendations || []);
      setStatus('success');

      // 2. 캐시 히트 면제 특혜가 적용된 카운팅 로직
      if (data.cached === false) {
        const nextCount = usageCount + 1;
        setUsageCount(nextCount);
        localStorage.setItem('woorilib_ai_usage', JSON.stringify({ date: today, count: nextCount }));
      } else {
        console.log('[Benefit Applied] 캐시가 적용되어 무료 한도 횟수가 차감되지 않고 면제되었습니다. 🎉');
      }

    } catch (error) {
      console.error('AI recommend error:', error);
      setStatus('error');
    }
  };

  return (
    <section 
      className="max-w-4xl mx-auto my-8 p-6 md:p-8 rounded-3xl border transition-all"
      style={{
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(16px)',
        borderColor: 'var(--color-surface-secondary)',
        boxShadow: '0 10px 40px rgb(0,0,0,0.02)',
      }}
    >
      {/* Header Info */}
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center justify-center gap-2" style={{ color: 'var(--color-text)' }}>
          <span>🤖</span> 우리아이 그림책 AI 비서
        </h2>
        <p className="text-sm md:text-base font-medium max-w-lg mx-auto" style={{ color: 'var(--color-text-muted)' }}>
          {userStore.childName ? `${userStore.childName}를 위한 ` : ''}연령, 기질, 육아 고민을 다각도로 분석하여 알라딘의 찐후기 기반으로 책을 추천합니다.
        </p>
        
        {/* Usage Limits Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 border border-orange-100" style={{ color: 'var(--color-primary)' }}>
          <span>📊</span> 오늘 무료 추천 한도: {LIMIT_COUNT - usageCount}회 남음 (총 {LIMIT_COUNT}회)
        </div>
      </div>

      {/* Main Core Router UI */}
      {status === 'idle' && (
        <div className="py-4">
          <AiChatInput onSubmit={handleRecommendSubmit} />
        </div>
      )}

      {status === 'loading' && (
        <AiLoadingScreen />
      )}

      {status === 'success' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-4 rounded-xl flex items-center justify-between text-sm" style={{ background: 'var(--color-surface-secondary)' }}>
            <span style={{ color: 'var(--color-text)' }}>
              🎯 분석 조건: <strong>"{activeQuery}"</strong>
            </span>
            <button 
              onClick={() => {
                setStatus('idle');
                setRecommendations([]);
              }}
              className="text-xs font-bold transition-all hover:opacity-80"
              style={{ color: 'var(--color-primary)' }}
            >
              🔄 새로 질문하기
            </button>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendations.map((book) => (
              <AiResultCard key={book.isbn} book={book} />
            ))}
          </div>
        </div>
      )}

      {status === 'rate-limited' && (
        <div className="py-12 text-center max-w-sm mx-auto space-y-4 animate-fadeIn">
          <div className="text-5xl">🚫</div>
          <h3 className="font-bold text-lg" style={{ color: 'var(--color-text)' }}>
            오늘의 AI 비서 무료 사용량을 초과했습니다.
          </h3>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            현재 1일 제공되는 인공지능 분석 추천 한도({LIMIT_COUNT}회)를 모두 소모하셨습니다. 서버 부하 및 API 과금을 제어하기 위한 한도 정책이오니 학부모님들의 깊은 이해를 부탁드립니다. 자정(KST) 이후 한도가 자동 복구됩니다!
          </p>
          <button
            onClick={() => setStatus('idle')}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all active:scale-95 shadow-sm"
            style={{ background: 'var(--color-text-muted)' }}
          >
            돌아가기
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className="py-12 text-center max-w-sm mx-auto space-y-4 animate-fadeIn">
          <div className="text-5xl">⚠️</div>
          <h3 className="font-bold text-lg" style={{ color: 'var(--color-text)' }}>
            분석 중 일시적인 오류가 발생했습니다.
          </h3>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            AI 서버 또는 알라딘 데이터베이스와의 통신 과정에서 혼선이 일어났습니다. 다시 한번 시도해 주시기 바랍니다.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setStatus('idle')}
              className="flex-1 py-3 rounded-xl font-bold text-xs border transition-all active:scale-95"
              style={{ borderColor: 'var(--color-surface-secondary)', color: 'var(--color-text)' }}
            >
              처음으로
            </button>
            <button
              onClick={() => handleRecommendSubmit(activeQuery)}
              className="flex-1 py-3 rounded-xl font-extrabold text-xs text-white transition-all active:scale-95 shadow-sm"
              style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, #FF8F3D 100%)' }}
            >
              🔄 다시 시도하기
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
