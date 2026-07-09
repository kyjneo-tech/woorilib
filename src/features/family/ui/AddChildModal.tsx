'use client';

import { useState } from 'react';
import { useFamily } from '@/shared/lib/hooks/use-family';
import { Modal, Input, Button, Typography } from '@/shared/ui';

interface AddChildModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (child: any) => void;
}

export function AddChildModal({ isOpen, onClose, onSuccess }: AddChildModalProps) {
    const { addChild } = useFamily();
    const [name, setName] = useState('');
    const [year, setYear] = useState('2020');
    const [emoji, setEmoji] = useState('👶');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const EMOJIS = ['👶', '👧', '👦', '🐯', '🐰', '🐲', '🦄', '🦖', '⭐'];

    const handleSubmit = async () => {
        if (!name.trim()) return alert('이름을 입력해주세요');

        setIsSubmitting(true);
        const newChild = await addChild(name, year, emoji);
        setIsSubmitting(false);

        if (newChild) {
            setName('');
            setYear('2020');
            setEmoji('👶');
            onSuccess?.(newChild);
            onClose();
        } else {
            alert('자녀 등록에 실패했습니다.');
        }
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="새 자녀 등록"
            footer={
                <Button
                    onClick={handleSubmit}
                    isLoading={isSubmitting}
                    fullWidth
                    size="lg"
                    variant="primary"
                >
                    등록하기
                </Button>
            }
        >
            <div className="space-y-6">
                {/* Emoji Selector */}
                <div>
                    <Typography variant="caption" weight="bold" color="muted" className="mb-2 block">어울리는 캐릭터</Typography>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
                        {EMOJIS.map(e => (
                            <button
                                key={e}
                                onClick={() => setEmoji(e)}
                                className={`text-3xl p-3 rounded-2xl transition-all flex-shrink-0 ${
                                    emoji === e 
                                        ? 'bg-secondary-light scale-110 ring-2 ring-secondary' 
                                        : 'bg-surface-secondary hover:bg-border/30'
                                }`}
                            >
                                {e}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Name Input */}
                <Input
                    label="이름 (또는 별명)"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="예: 지민이"
                    autoFocus
                />

                {/* Year Input */}
                <div>
                    <Typography variant="caption" weight="bold" color="muted" className="mb-2 block">태어난 연도</Typography>
                    <div className="relative">
                        <select
                            value={year}
                            onChange={e => setYear(e.target.value)}
                            className="w-full p-4 bg-surface border-2 border-border rounded-xl focus:border-primary focus:ring-4 focus:ring-primary-light/10 outline-none appearance-none font-bold text-text transition-all"
                        >
                            {Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                <option key={y} value={y}>{y}년생 ({new Date().getFullYear() - y + 1}세)</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                            ▼
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
