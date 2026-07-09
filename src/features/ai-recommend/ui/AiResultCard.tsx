'use client';

import { useState } from 'react';
import { Book } from '@/entities/book/model/types';
import { AcquisitionPanel } from '@/features/acquisition/ui/AcquisitionPanel';
import { useRouter } from 'next/navigation';

interface AiResultCardProps {
  book: Book;
}

export function AiResultCard({ book }: AiResultCardProps) {
  const router = useRouter();
  const [showAcquisition, setShowAcquisition] = useState(false);

  // AI 매칭률 가시화용 스타일 산정
  const matchScore = book.ranking || 90;
  let scoreColor = '#2E7D32'; // 녹색
  if (matchScore >= 95) scoreColor = '#FF3D00'; // 프리미엄 다홍
  else if (matchScore >= 90) scoreColor = '#FF6D00'; // 주황

  return (
    <div 
      className="rounded-2xl overflow-hidden border transition-all duration-300 hover:shadow-lg flex flex-col"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-surface-secondary)',
      }}
    >
      {/* Upper Area: Book Overview */}
      <div className="p-5 flex gap-4 border-b border-gray-100" style={{ borderColor: 'var(--color-surface-secondary)' }}>
        {/* Cover Image */}
        <div 
          onClick={() => router.push(`/book/${book.isbn}`)}
          className="w-24 h-36 flex-shrink-0 rounded-lg overflow-hidden cursor-pointer shadow-md hover:scale-105 transition-all relative group"
        >
          {book.bookImageURL ? (
            <img 
              src={book.bookImageURL} 
              alt={book.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">
              이미지 없음
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
            <span className="text-white text-xs font-bold">상세 보기 🔎</span>
          </div>
        </div>

        {/* Text Meta */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span 
                className="px-2.5 py-0.5 rounded-full text-xs font-extrabold flex items-center gap-1 shadow-sm"
                style={{ 
                  backgroundColor: `${scoreColor}15`, 
                  color: scoreColor 
                }}
              >
                🔥 매칭률 {matchScore}%
              </span>
              <span className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                {book.publisher}
              </span>
            </div>
            
            <h4 
              onClick={() => router.push(`/book/${book.isbn}`)}
              className="font-bold text-base truncate cursor-pointer hover:underline mb-1"
              style={{ color: 'var(--color-text)' }}
            >
              {book.title}
            </h4>
            <p className="text-xs truncate mb-2" style={{ color: 'var(--color-text-muted)' }}>
              {book.author}
            </p>
          </div>

          <div 
            className="p-3 rounded-xl text-xs space-y-1"
            style={{ background: 'var(--color-surface-secondary)' }}
          >
            <div className="font-semibold flex items-center gap-1" style={{ color: 'var(--color-primary)' }}>
              <span>💡</span> 연령 가이드
            </div>
            <p style={{ color: 'var(--color-text)' }}>
              {book.publishYear || '자녀 연령에 고르게 적합한 도서입니다.'}
            </p>
          </div>
        </div>
      </div>

      {/* Middle Area: AI Expert Summary Reason */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="font-bold text-sm flex items-center gap-1.5" style={{ color: 'var(--color-text)' }}>
            <span>🤖</span> 아이북봇 매칭 리포트
          </div>
          <p 
            className="text-sm leading-relaxed whitespace-pre-line"
            style={{ color: 'var(--color-text)' }}
          >
            {book.description}
          </p>
        </div>

        {/* Actions Button Bar */}
        <div className="flex gap-2.5 pt-2">
          <button
            onClick={() => router.push(`/book/${book.isbn}`)}
            className="flex-1 py-3 px-4 rounded-xl text-xs font-bold border transition-all hover:bg-gray-50 active:scale-95"
            style={{
              borderColor: 'var(--color-surface-secondary)',
              color: 'var(--color-text)',
            }}
          >
            📄 도서 상세 정보
          </button>
          
          <button
            onClick={() => setShowAcquisition(!showAcquisition)}
            className="flex-1 py-3 px-4 rounded-xl text-xs font-extrabold transition-all active:scale-95 text-white flex items-center justify-center gap-1.5 shadow-sm"
            style={{
              background: showAcquisition 
                ? 'var(--color-text-muted)' 
                : 'linear-gradient(135deg, var(--color-primary) 0%, #FF8F3D 100%)',
            }}
          >
            <span>🧭</span> {showAcquisition ? '구하는 법 접기' : '이 책 구하는 법'}
          </button>
        </div>
      </div>

      {/* Accordion Area: Acquisition panel (Library, Used Store, Shopping) */}
      {showAcquisition && (
        <div className="p-5 bg-gray-50 border-t border-gray-100 animate-fadeIn" style={{ background: 'var(--color-surface-secondary)', borderColor: 'var(--color-surface-secondary)' }}>
          <AcquisitionPanel isbn={book.isbn} title={book.title} />
        </div>
      )}
    </div>
  );
}
