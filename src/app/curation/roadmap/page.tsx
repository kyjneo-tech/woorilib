'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/shared/lib/hooks/use-auth';
import { useFamily } from '@/shared/lib/hooks/use-family';
import { bookshelfService, BookshelfItem } from '@/features/bookshelf/lib/bookshelf-service';
import { RoadmapStage, DOMAIN_LABELS, RoadmapItem, STAGE_CONFIG } from '@/features/curation/config/standard-roadmaps';
import { useRoadmapEngine } from '@/features/curation/lib/useRoadmapEngine';
import { GrowthDomain } from '@/features/classification/lib/classification.service';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { BottomNav } from '@/shared/ui/BottomNav';
import { Check, Lock, Star, Plus, ScanBarcode, BookOpen, AlertCircle } from 'lucide-react';
import { AddChildModal } from '@/features/family/ui/AddChildModal';
import { useShelfComposer } from '@/features/curation/lib/use-shelf-composer';
import { HeroBookCard } from '@/features/curation/ui/HeroBookCard';
import { SpotlightSection } from '@/features/curation/ui/SpotlightSection';
import { libraryAnalysisService, LibraryAnalysisResult } from '@/features/curation/services/library-analysis.service';
import { BarcodeScanner } from '@/features/book-search/ui/BarcodeScanner';

export default function RoadmapPage() {
    const { user, isAuthenticated } = useAuth();
    const { children } = useFamily();
    const [selectedChildId, setSelectedChildId] = useState<string>('');
    const [myBooks, setMyBooks] = useState<BookshelfItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false); // Scanner State
    const [analysis, setAnalysis] = useState<LibraryAnalysisResult | null>(null); // Analysis State

    const handleChildAdded = (newChild: any) => {
        setSelectedChildId(newChild.id);
    };

    // Initialize selected child
    useEffect(() => {
        if (children.length > 0 && !selectedChildId) {
            setSelectedChildId(children[0].id);
        }
    }, [children]);

    // Fetch My Books
    useEffect(() => {
        async function fetchBooks() {
            if (!user?.id) {
                setLoading(false);
                return;
            }
            try {
                // Fetch books from shelf (user ID is handled by session)
                const books = await bookshelfService.getMyBooks();
                setMyBooks(books);
            } catch (error) {
                console.error('Failed to fetch books:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchBooks();
    }, [user?.id]);

    const selectedChild = children.find(c => c.id === selectedChildId);

    // Calculate Months
    const childMonths = useMemo(() => {
        if (!selectedChild) return 0;
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        const age = (currentYear - selectedChild.birthYear) * 12 + currentMonth;
        return Math.max(age, 0);
    }, [selectedChild]);

    // Use Engine (Static Curriculum)
    const { currentStage, setStage, stageItems, ownershipMap, defaultStage, progress } = useRoadmapEngine(childMonths, myBooks);

    // Use Shelf Composer (Dynamic Premium Curation)
    const { data: shelfData, loading: shelfLoading } = useShelfComposer(
        childMonths,
        selectedChild?.propensity || undefined,
        selectedChild?.interests
    );

    // Group items by Domain for Matrix View
    const matrixData = useMemo(() => {
        const domains: Record<GrowthDomain, RoadmapItem[]> = {
            language: [], social: [], math_sci: [], cognitive: [],
            art_music: [], english: [], unclassified: []
        };
        stageItems.forEach(item => {
            if (domains[item.domain]) {
                domains[item.domain].push(item);
            }
        });
        return domains;
    }, [stageItems]);

    // Run Gap Analysis
    useEffect(() => {
        if (!loading && myBooks.length >= 0) {
            const result = libraryAnalysisService.analyze(myBooks, currentStage);
            setAnalysis(result);
        }
    }, [myBooks, currentStage, loading]);

    // Combined Loading State
    const isPageLoading = loading || (shelfLoading && !!selectedChild);

    if (isPageLoading) return <div className="min-h-screen flex items-center justify-center"><div className="text-4xl animate-bounce">🌱</div></div>;

    return (
        <div className="min-h-screen pb-24" style={{ background: '#F9FAFB' }}>
            {/* Header */}
            <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black text-gray-900">독서 로드맵</h1>
                        <p className="text-[10px] text-gray-400 font-bold">우리 아이 독서 성장 매트릭스</p>
                    </div>

                    {/* Child Selector */}
                    <div className="flex bg-gray-100 p-1 rounded-full">
                        {children.map(child => (
                            <button
                                key={child.id}
                                onClick={() => setSelectedChildId(child.id)}
                                className={`px-3 py-1.5 rounded-full text-xs font-black transition-all flex items-center gap-1 ${selectedChildId === child.id ? 'bg-white shadow-sm text-gray-900 border border-gray-200' : 'text-gray-400'}`}
                            >
                                <span>{child.emoji}</span>
                                <span className="hidden md:inline">{child.name}</span>
                            </button>
                        ))}
                        <button
                            onClick={() => setIsAddChildModalOpen(true)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${children.length === 0 ? 'bg-purple-100 text-purple-700 animate-pulse' : 'text-gray-400 hover:bg-white hover:text-gray-600'}`}
                        >
                            <Plus size={14} />
                            {children.length === 0 && <span>자녀 등록</span>}
                        </button>
                    </div>
                </div>
            </header>



            <AddChildModal
                isOpen={isAddChildModalOpen}
                onClose={() => setIsAddChildModalOpen(false)}
                onSuccess={handleChildAdded}
            />

            {
                isScannerOpen && (
                    <BarcodeScanner
                        onClose={() => setIsScannerOpen(false)}
                        onScanSuccess={(book) => {
                            setMyBooks(prev => [...prev, book]);
                            alert(`'${book.title}' 도서가 추가되었습니다!`);
                            setIsScannerOpen(false);
                        }}
                    />
                )
            }

            <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">

                {/* Premium Curation Section (Dynamic) */}
                {shelfData && !shelfLoading && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8 mb-10"
                    >
                        {shelfData.hero && (
                            <HeroBookCard
                                book={shelfData.hero}
                                childName={selectedChild?.name || '우리아이'}
                            />
                        )}
                        {shelfData.spotlight && shelfData.spotlight.length > 0 && (
                            <SpotlightSection books={shelfData.spotlight} />
                        )}
                    </motion.div>
                )}

                {/* Stage Tabs (Curriculum) */}
                <div className="mb-6 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                    <div className="flex gap-2 min-w-max">
                        {Object.values(RoadmapStage).map((stage) => {
                            const isActive = currentStage === stage;
                            const config = STAGE_CONFIG[stage];
                            const isRecommended = defaultStage === stage;

                            return (
                                <button
                                    key={stage}
                                    onClick={() => setStage(stage)}
                                    className={`
                                relative flex flex-col items-start p-3 pr-8 rounded-2xl border-2 transition-all
                                ${isActive
                                            ? 'bg-white border-gray-900 shadow-md ring-1 ring-gray-900'
                                            : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}
                            `}
                                >
                                    {isRecommended && (
                                        <span className="absolute top-2 right-2 text-[10px] font-bold bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full animate-pulse">
                                            추천
                                        </span>
                                    )}
                                    <div className={`text-sm font-black ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                                        {config.label}
                                    </div>
                                    <div className="text-[10px] mt-0.5 opacity-80 font-medium">
                                        {config.sub}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Gap Analysis Dashboard */}
                {analysis && (
                    <div className="mb-8 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                                <ScanBarcode size={20} className="text-purple-600" />
                                내 서재 분석
                            </h2>
                            <button
                                onClick={() => setIsScannerOpen(true)}
                                className="text-xs font-bold bg-gray-900 text-white px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-lg active:scale-95 transition-transform"
                            >
                                <ScanBarcode size={14} />
                                도서 등록하기
                            </button>
                        </div>

                        {/* Missing Core Books Recommendation */}
                        {analysis.recommendedBooks.length > 0 ? (
                            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-2 mb-3 text-amber-600 font-bold text-sm">
                                    <AlertCircle size={16} />
                                    <span>이 시기 필수 도서가 빠져있어요!</span>
                                </div>
                                <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
                                    {analysis.recommendedBooks.map(item => (
                                        <div key={item.id} className="min-w-[140px] p-3 rounded-2xl bg-amber-50 border border-amber-100 flex flex-col gap-2">
                                            <div className="flex justify-between items-start">
                                                <span className="text-[10px] bg-white px-1.5 py-0.5 rounded-md border border-amber-100 text-amber-600 font-bold">
                                                    {DOMAIN_LABELS[item.domain].label.split('/')[0]}
                                                </span>
                                            </div>
                                            <div className="text-xs font-black text-gray-900 line-clamp-2">
                                                {item.title}
                                            </div>
                                            <div className="text-[10px] text-gray-500">
                                                {item.publisher}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-blue-50 p-5 rounded-3xl border border-blue-100 flex items-center gap-3">
                                <div className="text-2xl">🎉</div>
                                <div>
                                    <div className="font-bold text-blue-900 text-sm">완벽해요!</div>
                                    <div className="text-xs text-blue-700">이 시기 필수 도서를 모두 보유하고 계시네요.</div>
                                </div>
                            </div>
                        )}

                        {/* Domain Balance (Simple) */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {Object.values(analysis.domainAnalysis).map(d => {
                                if (d.domain === 'unclassified') return null;
                                const config = DOMAIN_LABELS[d.domain];
                                return (
                                    <div key={d.domain} className="bg-white p-3 rounded-2xl border border-gray-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-sm">{config.emoji}</span>
                                            <span className="text-xs font-bold text-gray-600">{config.label.split('/')[0]}</span>
                                            <span className="ml-auto text-xs font-black text-gray-900">{d.percentage}%</span>
                                        </div>
                                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${d.percentage < 30 ? 'bg-red-400' : d.percentage < 70 ? 'bg-yellow-400' : 'bg-green-500'}`}
                                                style={{ width: `${d.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Progress Bar */}
                <div className="mb-8 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-xl">
                        🚀
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between text-xs font-bold mb-1.5">
                            <span className="text-gray-600">{STAGE_CONFIG[currentStage].label} 달성도</span>
                            <span className="text-blue-600">{Math.round((progress.owned / (progress.total || 1)) * 100)}%</span>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${(progress.owned / (progress.total || 1)) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* The Matrix */}
                <div className="overflow-x-auto pb-12 -mx-4 px-4 scrollbar-hide">
                    <div className="min-w-[800px] grid grid-cols-6 gap-3">

                        {/* Headers */}
                        {(Object.entries(DOMAIN_LABELS) as [GrowthDomain, any][]).map(([key, config]) => {
                            if (key === 'unclassified') return null;
                            return (
                                <div key={key} className={`p-2 rounded-xl text-center border flex flex-col items-center justify-center gap-1 ${config.color}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${config.iconBg}`}>
                                        {config.emoji}
                                    </div>
                                    <div className="text-[10px] font-bold truncate">{config.label}</div>
                                </div>
                            );
                        })}

                        {/* Columns */}
                        {(Object.keys(DOMAIN_LABELS) as GrowthDomain[]).map((domain) => {
                            if (domain === 'unclassified') return null;
                            const items = matrixData[domain] || [];

                            return (
                                <div key={domain} className="flex flex-col gap-2">
                                    {items.map(item => {
                                        const isOwned = ownershipMap.get(item.id);

                                        return (
                                            <div
                                                key={item.id}
                                                className={`
                                            group relative p-3 rounded-xl border transition-all cursor-pointer h-24 flex flex-col justify-between
                                            ${isOwned
                                                        ? 'bg-white border-green-200 shadow-sm'
                                                        : 'bg-gray-50 border-gray-100 border-dashed opacity-70 hover:opacity-100 hover:bg-white hover:border-gray-200'}
                                         `}
                                            >
                                                {isOwned && (
                                                    <div className="absolute -top-1.5 -right-1.5 bg-green-500 text-white p-0.5 rounded-full shadow-sm">
                                                        <Check size={10} strokeWidth={4} />
                                                    </div>
                                                )}

                                                <div>
                                                    {item.priority === 'core' && !isOwned && (
                                                        <div className="text-[9px] text-amber-600 font-bold mb-1">⭐ 필독</div>
                                                    )}
                                                    <div className={`text-[11px] font-bold leading-tight ${isOwned ? 'text-gray-900' : 'text-gray-500'}`}>
                                                        {item.title}
                                                    </div>
                                                </div>

                                                <div className="text-[9px] text-gray-400 font-medium truncate">
                                                    {item.publisher}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Empty State for Column */}
                                    {items.length === 0 && (
                                        <div className="h-24 rounded-xl border border-gray-100 border-dashed flex items-center justify-center text-gray-200 text-xs">
                                            -
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                    </div>
                </div>

            </main>

            <BottomNav />
        </div >
    );
}
