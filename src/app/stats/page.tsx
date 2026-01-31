'use client';

import { useState, useEffect } from 'react';
import { useFamily } from '@/shared/lib/hooks/use-family';
import { motion } from 'framer-motion';

interface StatsData {
  totalCount: number;
  thisMonthCount: number;
  monthlyTrend: { month: string, count: number }[];
  last7Days: { day: string, date: number, count: number }[];
}

export default function StatsPage() {
  const { children } = useFamily();
  const [selectedChildId, setSelectedChildId] = useState<string>('all');
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/stats?childId=${selectedChildId}`);
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedChildId]);

  const currentChild = children.find(c => c.id === selectedChildId);
  const displayName = currentChild ? currentChild.name : '모든 가족';

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--color-background)' }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold">📊 독서 분석</h1>
          
          {/* Child Switcher (Mini) */}
          <div className="flex bg-gray-100 rounded-full p-1">
            <button
                onClick={() => setSelectedChildId('all')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${selectedChildId === 'all' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}
            >
                전체
            </button>
            {children.map(child => (
                <button
                    key={child.id}
                    onClick={() => setSelectedChildId(child.id)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${selectedChildId === child.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}
                >
                    <span>{child.emoji}</span>
                    <span>{child.name}</span>
                </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-20 space-y-6">
        
        {/* Hero: Monthly Summary */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="relative z-10">
                <div className="text-gray-400 text-sm font-bold mb-1">{displayName}의 이번 달 독서량</div>
                <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-5xl font-black text-gray-900">
                        {loading ? '-' : data?.thisMonthCount}
                    </span>
                    <span className="text-lg text-gray-500 font-bold">권</span>
                </div>
                
                {/* Progress Bar (Visual Only for now, assume goal 50) */}
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: data ? `${Math.min((data.thisMonthCount / 10) * 100, 100)}%` : 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-purple-400 to-indigo-500"
                    />
                </div>
                <div className="mt-2 text-xs text-gray-400 font-medium flex justify-between">
                    <span>🔥 목표까지 10권 남았어요! (예시)</span>
                    <span>{data?.thisMonthCount}/10</span>
                </div>
            </div>
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 p-8 opacity-5">
                <span className="text-9xl">📚</span>
            </div>
        </div>

        {/* Weekly Activity (Heatmap-ish Bar) */}
        <section>
            <h2 className="text-sm font-bold text-gray-500 mb-3 px-1">최근 7일 활동</h2>
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                <div className="flex justify-between items-end h-32 px-2">
                    {data?.last7Days.map((day, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 flex-1">
                            <div className="w-full flex-1 flex items-end justify-center">
                                <motion.div 
                                    initial={{ height: 0 }}
                                    animate={{ height: `${Math.min(day.count * 15, 100)}%` }}
                                    transition={{ delay: i * 0.1 }}
                                    className={`w-3 rounded-full ${day.count > 0 ? 'bg-purple-500' : 'bg-gray-100'}`}
                                    style={{ minHeight: day.count > 0 ? '20%' : '4px' }}
                                >
                                    {day.count > 0 && (
                                        <div className="text-[10px] text-purple-600 font-bold -mt-5 text-center">{day.count}</div>
                                    )}
                                </motion.div>
                            </div>
                            <div className={`text-xs font-bold ${day.count > 0 ? 'text-gray-800' : 'text-gray-300'}`}>
                                {day.day}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* Monthly Trend (Line/Bar) */}
        <section>
            <h2 className="text-sm font-bold text-gray-500 mb-3 px-1">월별 독서 추이</h2>
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-end gap-3 h-40">
                    {data?.monthlyTrend.map((item, i) => (
                        <div key={i} className="flex-1 flex flex-col justify-end gap-2 group">
                             <div className="relative w-full bg-gray-50 rounded-t-xl overflow-hidden flex items-end group-hover:bg-purple-50 transition-colors" style={{ height: '100%' }}>
                                <motion.div 
                                    initial={{ height: 0 }}
                                    animate={{ height: `${Math.min(item.count * 5, 100)}%` }}
                                    className="w-full bg-indigo-100 group-hover:bg-indigo-200 transition-colors relative"
                                >
                                    <div className="absolute top-2 w-full text-center text-[10px] font-bold text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {item.count}권
                                    </div>
                                </motion.div>
                             </div>
                             <div className="text-center text-xs font-bold text-gray-400">{item.month}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* Total Badge */}
        <div className="bg-gradient-to-br from-yellow-100 to-amber-50 rounded-3xl p-6 flex items-center justify-between">
            <div>
                <div className="text-amber-800/60 font-bold text-xs mb-1">지금까지 모은 지식</div>
                <div className="text-3xl font-black text-amber-900">
                    총 {loading ? '-' : data?.totalCount}권 읽음
                </div>
            </div>
            <div className="text-4xl">🏆</div>
        </div>

      </main>
      
      {/* Tab Bar (Placeholder - should match existing Layout) */}
      {/* Assuming Layout handles nav, but if this page is standalone, it needs nav. 
          Usually we use the layout.tsx nav.
      */}
    </div>
  );
}