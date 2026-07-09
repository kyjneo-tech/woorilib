
import { useState } from 'react';

interface Props {
    initialInterests: string[];
    onSelect: (interests: string[]) => void;
    onComplete: () => void;
    onBack: () => void;
}

const INTEREST_TAGS = [
    '공룡', '자동차', '공주', '동물', '우주',
    '요리', '로봇', '역사', '자연', '운동',
    '음악', '미술', '영어', '수학', '친구',
    '모험', '탐정', '옛이야기', '바다', '곤충'
];

export function InterestStep({ initialInterests, onSelect, onComplete, onBack }: Props) {
    const [selected, setSelected] = useState<string[]>(initialInterests);

    const toggleInterest = (tag: string) => {
        const newSelection = selected.includes(tag)
            ? selected.filter(t => t !== tag)
            : [...selected, tag];

        setSelected(newSelection);
        onSelect(newSelection);
    };

    return (
        <div className="w-full max-w-md animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2 text-gray-900">요즘 무엇을 좋아하나요?</h2>
                <p className="text-gray-500">3개 이상 선택하면 더 정확해져요</p>
            </div>

            <div className="flex flex-wrap gap-2 justify-center mb-10">
                {INTEREST_TAGS.map((tag) => {
                    const isSelected = selected.includes(tag);
                    return (
                        <button
                            key={tag}
                            onClick={() => toggleInterest(tag)}
                            className={`
                px-4 py-2 rounded-full text-base font-medium transition-all duration-200 transform hover:scale-105
                ${isSelected
                                    ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-200 ring-offset-1'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                                }
              `}
                        >
                            {isSelected ? '❤️ ' : ''}{tag}
                        </button>
                    );
                })}
            </div>

            <div className="flex gap-3">
                <button
                    onClick={onBack}
                    className="px-6 py-4 rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                    이전
                </button>
                <button
                    onClick={onComplete}
                    disabled={selected.length === 0}
                    className="flex-1 py-4 rounded-xl font-bold text-white transition-all transform active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    style={{
                        background: 'linear-gradient(to right, #6200EA, #3700B3)',
                    }}
                >
                    보러 가기 ({selected.length}개 선택)
                </button>
            </div>
        </div>
    );
}
