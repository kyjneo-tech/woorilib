'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, CheckCircle2, ArrowRightCircle } from 'lucide-react';

interface MatrixItem {
    id: string;
    title: string;
    coverUrl?: string;
    isOwned: boolean;
    subCompetencies?: string[];
}

interface DomainDetailProps {
    area: string;
    score: number;
    currentBooks: MatrixItem[];
    nextBooks: MatrixItem[];
}

const AREA_LABELS: Record<string, string> = {
    SOCIAL: '사회성',
    EMOTION: '정서',
    COGNITIVE: '인지창의',
    PHYSICAL: '신체운동',
    LANGUAGE: '의사소통',
    CREATIVE: '예술경험' // Assuming mapping, strictly speaking CREATIVE might be mapped differently or named differently in constants
};

export function DomainDetailCard({ area, score, currentBooks, nextBooks }: DomainDetailProps) {
    const [isOpen, setIsOpen] = useState(false);
    const label = AREA_LABELS[area] || area;

    return (
        <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-5 bg-white text-left"
            >
                <div className="flex items-center gap-4">
                    <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold
                        ${score >= 80 ? 'bg-green-100 text-green-700' :
                            score >= 40 ? 'bg-blue-100 text-blue-700' :
                                'bg-orange-100 text-orange-700'}
                    `}>
                        {score}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{label}</h3>
                        <p className="text-sm text-gray-500">
                            {currentBooks.length}권 읽음 · 추천 {nextBooks.length}권
                        </p>
                    </div>
                </div>
                {isOpen ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-100"
                    >
                        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50">
                            {/* Current Level */}
                            <div>
                                <h4 className="flex items-center gap-2 font-bold text-gray-700 mb-3">
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                    지금 읽고 있는 책
                                </h4>
                                {currentBooks.length > 0 ? (
                                    <div className="space-y-2">
                                        {currentBooks.map(book => (
                                            <div key={book.id} className="bg-white p-3 rounded-xl border border-gray-200 flex items-center gap-3">
                                                {book.coverUrl ? (
                                                    <img src={book.coverUrl} alt={book.title} className="w-10 h-14 object-cover rounded shadow-sm" />
                                                ) : (
                                                    <div className="w-10 h-14 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">No Img</div>
                                                )}
                                                <div>
                                                    <p className="font-medium text-gray-900 text-sm line-clamp-1">{book.title}</p>
                                                    <p className="text-xs text-gray-500 line-clamp-1">
                                                        {book.subCompetencies?.join(', ')}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 italic py-2">아직 이 영역의 책이 없어요.</p>
                                )}
                            </div>

                            {/* Next Level */}
                            <div>
                                <h4 className="flex items-center gap-2 font-bold text-gray-700 mb-3">
                                    <ArrowRightCircle className="w-5 h-5 text-blue-600" />
                                    다음 도전 추천
                                </h4>
                                {nextBooks.length > 0 ? (
                                    <div className="space-y-2">
                                        {nextBooks.map(book => (
                                            <div key={book.id} className="bg-white p-3 rounded-xl border border-blue-100 flex items-center gap-3 relative overflow-hidden">
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                                                {book.coverUrl ? (
                                                    <img src={book.coverUrl} alt={book.title} className="w-10 h-14 object-cover rounded shadow-sm" />
                                                ) : (
                                                    <div className="w-10 h-14 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">No Img</div>
                                                )}
                                                <div>
                                                    <p className="font-medium text-gray-900 text-sm line-clamp-1">{book.title}</p>
                                                    <p className="text-xs text-blue-600 font-medium">
                                                        추천
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 italic py-2">현재 단계의 추천 도서가 충분합니다.</p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
