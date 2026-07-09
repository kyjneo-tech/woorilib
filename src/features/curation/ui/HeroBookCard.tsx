'use client';

import type { BookItem } from '@/features/curation/engine/display/shelf-composer';
import { motion } from 'framer-motion';
import { Sparkles, Crown, ArrowRight } from 'lucide-react';

interface HeroBookCardProps {
    book: BookItem;
    childName: string;
}

export function HeroBookCard({ book, childName }: HeroBookCardProps) {
    return (
        <div className="relative w-full overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 text-white shadow-2xl">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500 opacity-10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

            <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-10">
                {/* Book Cover */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="relative shrink-0"
                >
                    <div className="absolute inset-0 bg-white blur-xl opacity-20" />
                    {(book.cover_url || book.bookImageURL || book.cover) ? (
                        <img
                            src={book.cover_url || book.bookImageURL || book.cover}
                            alt={book.title}
                            className="relative w-32 h-44 md:w-40 md:h-56 object-cover rounded-lg shadow-lg rotate-3 hover:rotate-0 transition-transform duration-500"
                        />
                    ) : (
                        <div className="relative w-32 h-44 md:w-40 md:h-56 bg-white/10 rounded-lg flex items-center justify-center text-white/30 backdrop-blur-sm border border-white/20">
                            No Cover
                        </div>
                    )}

                    {/* Floating Badge */}
                    <div className="absolute -top-3 -right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                        <Crown size={12} fill="currentColor" />
                        BEST
                    </div>
                </motion.div>

                {/* Content */}
                <div className="flex-1 text-center md:text-left space-y-4">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/10 text-xs font-bold text-yellow-300">
                        <Sparkles size={12} />
                        {childName}을 위한 최고의 추천
                    </div>

                    <div>
                        <h2 className="text-2xl md:text-3xl font-black leading-tight mb-2">
                            {book.title}
                        </h2>
                        <p className="text-white/70 text-sm md:text-base line-clamp-2 md:line-clamp-3 leading-relaxed">
                            {book.summary || '아이들의 상상력을 자극하는 최고의 도서입니다. 전문가들이 선정한 이 시기 필수 도서를 지금 바로 만나보세요.'}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                        {book.tags?.slice(0, 3).map((tag: any, i: any) => (
                            <span key={i} className="px-2.5 py-1 rounded-md bg-white/10 text-[10px] font-medium border border-white/5">
                                {tag}
                            </span>
                        ))}
                    </div>

                    <button className="hidden md:inline-flex items-center gap-2 px-6 py-2.5 bg-white text-indigo-900 rounded-xl font-bold hover:bg-indigo-50 transition-colors">
                        자세히 보기 <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
