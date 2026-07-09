
interface Props {
    selectedPropensity: 'active' | 'calm' | 'sensitive' | 'curious' | null;
    onSelect: (propensity: 'active' | 'calm' | 'sensitive' | 'curious') => void;
    onNext: () => void;
    onBack: () => void;
}

const PROPENSITIES = [
    { id: 'active', label: '활발해요', emoji: '🏃', desc: '에너지가 넘치고 활동적인 놀이를 좋아해요' },
    { id: 'calm', label: '차분해요', emoji: '🧘', desc: '한 자리에 앉아 집중하는 것을 잘해요' },
    { id: 'sensitive', label: '섬세해요', emoji: '🎨', desc: '감수성이 풍부하고 타인의 감정을 잘 읽어요' },
    { id: 'curious', label: '호기심왕', emoji: '🔍', desc: '질문이 많고 새로운 것에 대한 흥미가 높아요' },
] as const;

export function PropensityStep({ selectedPropensity, onSelect, onNext, onBack }: Props) {
    return (
        <div className="w-full max-w-md animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2 text-gray-900">아이의 성향은 어떤가요?</h2>
                <p className="text-gray-500">성향에 맞는 책을 추천해 드릴게요</p>
            </div>

            <div className="grid grid-cols-1 gap-3 mb-8">
                {PROPENSITIES.map((p) => (
                    <button
                        key={p.id}
                        onClick={() => onSelect(p.id)}
                        className={`
              flex items-center p-4 rounded-2xl border-2 text-left transition-all duration-200 group
              ${selectedPropensity === p.id
                                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200 ring-offset-2'
                                : 'border-gray-100 bg-white hover:border-blue-200 hover:bg-gray-50'
                            }
            `}
                    >
                        <span className="text-3xl mr-4 group-hover:scale-110 transition-transform">{p.emoji}</span>
                        <div>
                            <div className={`text-lg font-bold ${selectedPropensity === p.id ? 'text-blue-700' : 'text-gray-900'}`}>
                                {p.label}
                            </div>
                            <div className={`text-sm ${selectedPropensity === p.id ? 'text-blue-600' : 'text-gray-500'}`}>
                                {p.desc}
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            <div className="flex gap-3">
                <button
                    onClick={onBack}
                    className="px-6 py-4 rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                    이전
                </button>
                <button
                    onClick={onNext}
                    disabled={!selectedPropensity}
                    className="flex-1 py-4 rounded-xl font-bold text-white transition-all transform active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    style={{
                        background: 'linear-gradient(to right, #2196F3, #1976D2)',
                    }}
                >
                    다음으로
                </button>
            </div>
        </div>
    );
}
