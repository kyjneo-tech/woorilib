'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFamilyStore } from '@/features/family/model/use-family-store';
import { calculateAge } from '@/features/family/model/types';
import { peerComparisonService } from '../lib/peer-comparison.service';
import { PeerComparisonData } from '../lib/types';
import { PercentileIndicator } from './PercentileIndicator';
import { ComparisonCard, StatCard } from './ComparisonCard';

/**
 * 또래 비교 대시보드 메인 컴포넌트
 */
export function PeerDashboard() {
  const router = useRouter();
  const { getSelectedChild, children } = useFamilyStore();
  const selectedChild = getSelectedChild();

  const [comparisonData, setComparisonData] = useState<PeerComparisonData | null>(null);
  const [childStats, setChildStats] = useState<{
    totalBooks: number;
    thisMonthBooks: number;
    thisWeekBooks: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedChild) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const age = calculateAge(selectedChild.birthDate);

        const [comparison, stats] = await Promise.all([
          peerComparisonService.getComparison(selectedChild.id, age),
          peerComparisonService.getChildStats(selectedChild.id),
        ]);

        setComparisonData(comparison);
        setChildStats(stats);
      } catch (error) {
        console.error('Failed to fetch peer comparison:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedChild]);

  // 자녀가 없으면 등록 안내
  if (!selectedChild && children.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="text-5xl mb-4">👶</div>
        <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text)' }}>
          자녀 정보를 등록해주세요
        </h3>
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
          자녀를 등록하면 또래 아이들과 독서량을 비교할 수 있어요
        </p>
        <button
          onClick={() => router.push('/family')}
          className="px-6 py-3 rounded-xl font-medium text-white"
          style={{ background: 'var(--color-primary)' }}
        >
          자녀 등록하기
        </button>
      </div>
    );
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin text-4xl">📊</div>
      </div>
    );
  }

  const childAge = selectedChild ? calculateAge(selectedChild.birthDate) : 0;

  return (
    <div className="space-y-6">
      {/* 자녀 선택 헤더 */}
      {selectedChild && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{selectedChild.avatar}</span>
            <div>
              <h2 className="font-bold" style={{ color: 'var(--color-text)' }}>
                {selectedChild.name}
              </h2>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {childAge}세 또래와 비교
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 백분위 표시 */}
      {comparisonData && (
        <div className="card p-6">
          <PercentileIndicator
            percentile={comparisonData.percentile}
            peerCount={comparisonData.peerCount}
          />
        </div>
      )}

      {/* 내 독서 통계 */}
      {childStats && (
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="이번 주"
            value={childStats.thisWeekBooks}
            icon="📅"
            highlight
          />
          <StatCard
            label="이번 달"
            value={childStats.thisMonthBooks}
            icon="📆"
          />
          <StatCard
            label="총 독서"
            value={childStats.totalBooks}
            icon="📚"
          />
        </div>
      )}

      {/* 또래 비교 카드 */}
      {comparisonData && comparisonData.peerCount > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold" style={{ color: 'var(--color-text)' }}>
            또래와 비교
          </h3>
          <ComparisonCard
            label="이번 달 독서량"
            myValue={comparisonData.myThisMonthBooks}
            peerAvg={comparisonData.peerAvgMonth}
            icon="📖"
          />
          <ComparisonCard
            label="총 독서량"
            myValue={comparisonData.myTotalBooks}
            peerAvg={comparisonData.peerAvgTotal}
            icon="📚"
          />
        </div>
      )}

      {/* 데이터 부족 안내 */}
      {(!comparisonData || comparisonData.peerCount === 0) && childStats && (
        <div className="card p-6 text-center">
          <div className="text-4xl mb-3">📊</div>
          <h3 className="font-bold mb-2" style={{ color: 'var(--color-text)' }}>
            또래 비교 데이터가 아직 부족해요
          </h3>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            같은 나이대 아이들의 독서 기록이 쌓이면<br />
            비교 분석을 보여드릴게요
          </p>
        </div>
      )}

      {/* 독서 기록이 없을 때 */}
      {childStats && childStats.totalBooks === 0 && (
        <div className="card p-6 text-center" style={{ background: 'var(--color-primary-light)' }}>
          <div className="text-4xl mb-3">🌱</div>
          <h3 className="font-bold mb-2" style={{ color: 'var(--color-text)' }}>
            첫 독서 기록을 남겨보세요!
          </h3>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
            책을 읽고 기록하면 또래와 비교해볼 수 있어요
          </p>
          <button
            onClick={() => router.push('/search')}
            className="px-6 py-3 rounded-xl font-medium text-white"
            style={{ background: 'var(--color-primary)' }}
          >
            책 검색하기
          </button>
        </div>
      )}
    </div>
  );
}
