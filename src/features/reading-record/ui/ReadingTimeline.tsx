'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFamilyStore } from '@/features/family/model/use-family-store';
import { readingRecordService } from '../lib/reading-record.service';
import { ReadingRecord, REACTIONS } from '../lib/types';

interface ReadingTimelineProps {
  limit?: number;
  showHeader?: boolean;
}

/**
 * 독서 타임라인 컴포넌트
 * 읽은 책들을 날짜별로 타임라인 형태로 표시
 */
export function ReadingTimeline({ limit = 20, showHeader = true }: ReadingTimelineProps) {
  const router = useRouter();
  const { getSelectedChild } = useFamilyStore();
  const selectedChild = getSelectedChild();

  const [records, setRecords] = useState<ReadingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      setIsLoading(true);
      try {
        const data = await readingRecordService.getRecords(selectedChild?.id, limit);
        setRecords(data);
      } catch (error) {
        // 로그인하지 않은 경우 빈 배열로 처리
        console.error('Failed to fetch reading records:', error);
        setRecords([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecords();
  }, [selectedChild?.id, limit]);

  // 날짜별 그룹핑
  const groupedRecords = records.reduce((acc, record) => {
    const date = record.readDate;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(record);
    return acc;
  }, {} as Record<string, ReadingRecord[]>);

  const sortedDates = Object.keys(groupedRecords).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  );

  // 날짜 포맷팅
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateOnly = (d: Date) => d.toISOString().split('T')[0];

    if (dateOnly(date) === dateOnly(today)) {
      return '오늘';
    } else if (dateOnly(date) === dateOnly(yesterday)) {
      return '어제';
    } else {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
      return `${month}월 ${day}일 (${dayOfWeek})`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin text-4xl">📖</div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="text-5xl mb-4 block">📚</span>
        <h3 className="font-bold mb-2" style={{ color: 'var(--color-text)' }}>
          아직 독서 기록이 없어요
        </h3>
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
          책을 읽고 기록을 남겨보세요!
        </p>
        <button
          onClick={() => router.push('/search')}
          className="px-6 py-3 rounded-xl font-medium text-white"
          style={{ background: 'var(--color-primary)' }}
        >
          책 검색하기
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg" style={{ color: 'var(--color-text)' }}>
            📅 독서 타임라인
          </h2>
          {selectedChild && (
            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {selectedChild.avatar} {selectedChild.name}
            </span>
          )}
        </div>
      )}

      {/* 타임라인 */}
      <div className="relative">
        {/* 세로선 */}
        <div
          className="absolute left-4 top-0 bottom-0 w-0.5"
          style={{ background: 'var(--color-surface-secondary)' }}
        />

        {sortedDates.map((date, dateIndex) => (
          <div key={date} className="relative mb-6 last:mb-0">
            {/* 날짜 헤더 */}
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold z-10"
                style={{
                  background: dateIndex === 0 ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: dateIndex === 0 ? 'white' : 'var(--color-text-secondary)',
                  border: dateIndex === 0 ? 'none' : '2px solid var(--color-surface-secondary)',
                }}
              >
                {new Date(date).getDate()}
              </div>
              <span
                className="text-sm font-medium"
                style={{ color: dateIndex === 0 ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}
              >
                {formatDate(date)}
              </span>
            </div>

            {/* 해당 날짜의 책들 */}
            <div className="ml-11 space-y-3">
              {groupedRecords[date].map((record) => (
                <TimelineItem
                  key={record.id}
                  record={record}
                  onClick={() => router.push(`/book/${record.isbn}`)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface TimelineItemProps {
  record: ReadingRecord;
  onClick?: () => void;
}

function TimelineItem({ record, onClick }: TimelineItemProps) {
  const reaction = record.reaction ? REACTIONS[record.reaction] : null;

  return (
    <div
      className="flex gap-3 p-3 rounded-xl cursor-pointer transition-all hover:shadow-md"
      style={{ background: 'var(--color-surface)' }}
      onClick={onClick}
    >
      {/* 책 커버 */}
      <div
        className="w-14 h-20 rounded-lg overflow-hidden flex-shrink-0"
        style={{ background: 'var(--color-surface-secondary)' }}
      >
        {record.bookCover ? (
          <img
            src={record.bookCover}
            alt={record.bookTitle}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-2xl opacity-30">📚</span>
          </div>
        )}
      </div>

      {/* 책 정보 */}
      <div className="flex-1 min-w-0">
        <h4
          className="font-medium text-sm line-clamp-2 mb-1"
          style={{ color: 'var(--color-text)' }}
        >
          {record.bookTitle}
        </h4>
        {record.bookAuthor && (
          <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>
            {record.bookAuthor}
          </p>
        )}

        {/* 반응 */}
        {reaction && (
          <span
            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full"
            style={{ background: 'var(--color-surface-secondary)' }}
          >
            <span>{reaction.emoji}</span>
            <span style={{ color: 'var(--color-text-secondary)' }}>{reaction.label}</span>
          </span>
        )}

        {/* 메모 */}
        {record.note && (
          <p
            className="text-xs mt-2 line-clamp-2"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            "{record.note}"
          </p>
        )}
      </div>
    </div>
  );
}
