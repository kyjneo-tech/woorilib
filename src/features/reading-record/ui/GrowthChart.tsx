'use client';

import { useEffect, useState } from 'react';
import { useFamilyStore } from '@/features/family/model/use-family-store';
import { readingRecordService } from '../lib/reading-record.service';
import { ReadingStats, REACTIONS, ReactionType } from '../lib/types';

interface GrowthChartProps {
  showReactions?: boolean;
}

/**
 * 성장 그래프 컴포넌트
 * 월별 독서량 추이와 반응 통계를 시각화
 */
export function GrowthChart({ showReactions = true }: GrowthChartProps) {
  const { getSelectedChild } = useFamilyStore();
  const selectedChild = getSelectedChild();

  const [stats, setStats] = useState<ReadingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const data = await readingRecordService.getStats(selectedChild?.id);
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [selectedChild?.id]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin text-4xl">📈</div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const maxMonthly = Math.max(...stats.monthlyTrend.map((m) => m.count), 1);
  const totalReactions = Object.values(stats.reactionCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* 요약 통계 */}
      <div className="grid grid-cols-3 gap-3">
        <StatBox
          label="이번 달"
          value={stats.thisMonthBooks}
          unit="권"
          icon="📅"
          highlight
        />
        <StatBox
          label="올해"
          value={stats.thisYearBooks}
          unit="권"
          icon="📆"
        />
        <StatBox
          label="전체"
          value={stats.totalBooks}
          unit="권"
          icon="📚"
        />
      </div>

      {/* 월별 그래프 */}
      <div className="card p-4">
        <h3 className="font-bold mb-4" style={{ color: 'var(--color-text)' }}>
          📈 월별 독서량 추이
        </h3>
        <div className="flex items-end justify-between gap-2 h-32">
          {stats.monthlyTrend.map((data, index) => {
            const height = (data.count / maxMonthly) * 100;
            const isCurrentMonth = index === stats.monthlyTrend.length - 1;

            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                {/* 막대 */}
                <div className="w-full flex flex-col items-center justify-end h-24">
                  {data.count > 0 && (
                    <span
                      className="text-xs font-bold mb-1"
                      style={{ color: isCurrentMonth ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}
                    >
                      {data.count}
                    </span>
                  )}
                  <div
                    className="w-full rounded-t-lg transition-all duration-500"
                    style={{
                      height: `${Math.max(height, 8)}%`,
                      background: isCurrentMonth
                        ? 'var(--color-primary)'
                        : data.count > 0
                        ? 'var(--color-secondary)'
                        : 'var(--color-surface-secondary)',
                    }}
                  />
                </div>
                {/* 월 라벨 */}
                <span
                  className="text-xs mt-2"
                  style={{
                    color: isCurrentMonth ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    fontWeight: isCurrentMonth ? 600 : 400,
                  }}
                >
                  {data.month}
                </span>
              </div>
            );
          })}
        </div>

        {/* 성장 메시지 */}
        <GrowthMessage stats={stats} />
      </div>

      {/* 반응 통계 */}
      {showReactions && totalReactions > 0 && (
        <div className="card p-4">
          <h3 className="font-bold mb-4" style={{ color: 'var(--color-text)' }}>
            🎭 독서 반응
          </h3>
          <div className="space-y-3">
            {(Object.entries(REACTIONS) as [ReactionType, { emoji: string; label: string }][]).map(
              ([key, { emoji, label }]) => {
                const count = stats.reactionCounts[key];
                const percent = totalReactions > 0 ? (count / totalReactions) * 100 : 0;

                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {emoji} {label}
                      </span>
                      <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                        {count}권
                      </span>
                    </div>
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ background: 'var(--color-surface-secondary)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percent}%`,
                          background: getReactionColor(key),
                        }}
                      />
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface StatBoxProps {
  label: string;
  value: number;
  unit: string;
  icon: string;
  highlight?: boolean;
}

function StatBox({ label, value, unit, icon, highlight }: StatBoxProps) {
  return (
    <div
      className="p-4 rounded-xl text-center"
      style={{
        background: highlight ? 'var(--color-primary-light)' : 'var(--color-surface)',
      }}
    >
      <div className="text-2xl mb-1">{icon}</div>
      <p
        className="text-2xl font-bold"
        style={{ color: highlight ? 'var(--color-primary)' : 'var(--color-text)' }}
      >
        {value}
        <span className="text-sm font-normal ml-0.5">{unit}</span>
      </p>
      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </p>
    </div>
  );
}

function GrowthMessage({ stats }: { stats: ReadingStats }) {
  const trend = stats.monthlyTrend;
  if (trend.length < 2) return null;

  const lastMonth = trend[trend.length - 2].count;
  const thisMonth = trend[trend.length - 1].count;
  const diff = thisMonth - lastMonth;

  let message = '';
  let emoji = '';

  if (diff > 0) {
    emoji = '🚀';
    message = `지난달보다 ${diff}권 더 읽었어요!`;
  } else if (diff < 0) {
    emoji = '💪';
    message = `조금 더 힘내볼까요?`;
  } else if (thisMonth > 0) {
    emoji = '👍';
    message = '꾸준히 잘하고 있어요!';
  } else {
    emoji = '📚';
    message = '이번 달 첫 책을 읽어볼까요?';
  }

  return (
    <div
      className="mt-4 p-3 rounded-lg text-center text-sm"
      style={{ background: 'var(--color-surface-secondary)' }}
    >
      <span className="mr-1">{emoji}</span>
      <span style={{ color: 'var(--color-text-secondary)' }}>{message}</span>
    </div>
  );
}

function getReactionColor(reaction: ReactionType): string {
  const colors: Record<ReactionType, string> = {
    fun: '#10b981',      // green
    touching: '#ec4899', // pink
    difficult: '#f59e0b', // amber
    boring: '#6b7280',   // gray
  };
  return colors[reaction];
}
