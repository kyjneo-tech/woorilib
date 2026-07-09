'use client';

import { useState } from 'react';

interface AiChatInputProps {
  onSubmit: (text: string) => void;
  disabled?: boolean;
}

const PRESET_SUGGESTIONS = [
  { emoji: '💩', label: '배변 훈련', query: '기저귀 떼는 배변 훈련용 추천책' },
  { emoji: '🥦', label: '편식하는 아이', query: '밥 안 먹고 편식하는 아이를 위한 동화책' },
  { emoji: '🦖', label: '공룡 매니아', query: '공룡에 푹 빠진 아이가 읽기 좋은 그림책' },
  { emoji: '🌙', label: '잠투정 심할 때', query: '잠 안 자고 투정 부릴 때 읽어주는 수면 동화' },
];

export function AiChatInput({ onSubmit, disabled }: AiChatInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || disabled) return;
    onSubmit(inputValue.trim());
  };

  const handlePresetClick = (query: string) => {
    if (disabled) return;
    setInputValue(query);
    onSubmit(query);
  };

  return (
    <div className="space-y-4">
      {/* preset suggestions */}
      <div className="flex flex-wrap gap-2 justify-center">
        {PRESET_SUGGESTIONS.map((preset, idx) => (
          <button
            key={idx}
            onClick={() => handlePresetClick(preset.query)}
            disabled={disabled}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
            style={{
              borderColor: 'var(--color-surface-secondary)',
              color: 'var(--color-text)',
            }}
          >
            <span>{preset.emoji}</span>
            <span>{preset.label}</span>
          </button>
        ))}
      </div>

      {/* input form */}
      <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={disabled}
            placeholder="아이가 좋아하는 흥미나 현재 겪고 계신 육아 고민을 물어보세요! (예: 34개월 기차 좋아하는 남자아이 책)"
            className="w-full pl-5 pr-14 py-4 rounded-2xl border text-sm outline-none transition-all shadow-inner focus:ring-2 disabled:bg-gray-50"
            style={{
              background: 'var(--color-surface)',
              borderColor: 'var(--color-surface-secondary)',
              color: 'var(--color-text)',
              boxShadow: '0 8px 30px rgb(0,0,0,0.04)',
            }}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || disabled}
            className="absolute right-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm transition-all active:scale-95 disabled:opacity-40"
            style={{
              background: 'linear-gradient(135deg, #FF6B00 0%, #FF8F3D 100%)',
            }}
          >
            🤖 톡
          </button>
        </div>
        <p className="text-center text-[11px] mt-2.5" style={{ color: 'var(--color-text-muted)' }}>
          * 아이북봇 AI 비서는 부모들의 찐후기와 실제 도서 정보를 정독한 후 큐레이션을 작성합니다.
        </p>
      </form>
    </div>
  );
}
