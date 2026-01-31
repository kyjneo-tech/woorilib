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
import { Check, Lock, Star } from 'lucide-react';



export default function RoadmapPage() {
  const { user, isAuthenticated } = useAuth();
  const { children } = useFamily();
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [myBooks, setMyBooks] = useState<BookshelfItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize selected child
  useEffect(() => {
    if (children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].id);
    }
  }, [children]);

  // Load user's bookshelf
  useEffect(() => {
    if (isAuthenticated) {
      bookshelfService.getMyBooks().then(books => {
        setMyBooks(books);
        setLoading(false);
      });
    } else {
        setLoading(false); 
    }
  }, [isAuthenticated]);

  const selectedChild = children.find(c => c.id === selectedChildId);
  
  // Calculate Months
  const childMonths = useMemo(() => {
    if (!selectedChild) return 0;
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const age = (currentYear - selectedChild.birthYear) * 12 + currentMonth;
    return Math.max(age, 0);
  }, [selectedChild]);

  // Use Engine
  const { currentStage, setStage, stageItems, ownershipMap, defaultStage, progress } = useRoadmapEngine(childMonths, myBooks);

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

  if (loading) return <div className="p-20 text-center animate-pulse text-4xl">🌱</div>;

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
             {children.length === 0 && (
                <div className="px-3 py-1.5 text-xs text-gray-400">자녀를 등록하세요</div>
             )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-6">
        
        {/* Stage Tabs */}
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
                        <div key={key} className={`p-2 rounded-xl text-center border bg-white ${config.color}`}>
                            <div className="text-sm py-1">{config.emoji}</div>
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
    </div>
  );
}
