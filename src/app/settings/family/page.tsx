'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFamily } from '@/shared/lib/hooks/use-family'; // We reused this hook!

export default function FamilySettingsPage() {
    const router = useRouter();
    const { children, loading: fetchLoading } = useFamily(); // This hook fetches from Supabase directly in prev implementation, but now we have API.
    // Actually useFamily hook implemented earlier uses direct Supabase client call 'child_profiles'.
    // That works fine. We don't necessarily need to change it to use the new API unless needed.
    // But for Adding/Deleting, we should use the API we just made (or Supabase client).
    // Let's use fetch API for consistency with the Route Handler logic (Prisma).
    
    // Override local state to manage updates
    const [localChildren, setLocalChildren] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    
    // Form Input
    const [newName, setNewName] = useState('');
    const [newYear, setNewYear] = useState('2020');
    const [newEmoji, setNewEmoji] = useState('👶');

    const fetchList = async () => {
        setIsLoading(true);
        const res = await fetch('/api/family/children');
        if (res.ok) {
            const data = await res.json();
            setLocalChildren(data.children);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchList();
    }, []);

    const handleAdd = async () => {
        if (!newName) return alert('이름을 입력해주세요');
        
        await fetch('/api/family/children', {
            method: 'POST',
            body: JSON.stringify({ name: newName, birthYear: newYear, emoji: newEmoji })
        });
        
        setIsAdding(false);
        setNewName('');
        fetchList();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('정말 삭제하시겠습니까? 관련 독서 기록은 유지되지만 프로필은 사라집니다.')) return;
        await fetch(`/api/family/children?id=${id}`, { method: 'DELETE' });
        fetchList();
    };

    const EMOJIS = ['👶', '👧', '👦', '🐯', '🐰', '🐲', '🦄', '🦖', '⭐'];

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <header className="bg-white p-4 shadow-sm sticky top-0 flex items-center gap-3">
                <button onClick={() => router.back()} className="text-xl">←</button>
                <h1 className="font-bold text-lg">가족 구성원 관리</h1>
            </header>

            <main className="max-w-xl mx-auto p-4">
                <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                    <h2 className="font-bold mb-4 text-gray-800">등록된 자녀 ({localChildren.length}명)</h2>
                    
                    {isLoading ? (
                        <div className="text-center py-8">로딩중...</div>
                    ) : localChildren.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl mb-4">
                            아직 등록된 자녀가 없습니다.<br/>
                            아이를 등록하고 독서 기록을 시작해보세요!
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {localChildren.map(child => (
                                <div key={child.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-gray-50">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl bg-white p-2 rounded-full shadow-sm">{child.emoji}</span>
                                        <div>
                                            <div className="font-bold text-gray-800">{child.name}</div>
                                            <div className="text-xs text-gray-500">{child.birthYear}년생 ({new Date().getFullYear() - child.birthYear + 1}세)</div>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDelete(child.id)} className="text-gray-400 hover:text-red-500 px-2">
                                        삭제
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {isAdding ? (
                    <div className="bg-white rounded-2xl shadow-lg p-6 animate-in slide-in-from-bottom-2">
                        <h3 className="font-bold mb-4">새 자녀 등록</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">이모지 선택</label>
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {EMOJIS.map(e => (
                                        <button 
                                            key={e} 
                                            onClick={() => setNewEmoji(e)}
                                            className={`text-2xl p-2 rounded-xl transition-all ${newEmoji === e ? 'bg-yellow-100 scale-110' : 'bg-gray-50'}`}
                                        >
                                            {e}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">이름/별명</label>
                                <input 
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    placeholder="예: 지민이"
                                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-green-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">태어난 연도</label>
                                <select 
                                    value={newYear}
                                    onChange={e => setNewYear(e.target.value)}
                                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none"
                                >
                                    {Array.from({length: 15}, (_, i) => new Date().getFullYear() - i).map(year => (
                                        <option key={year} value={year}>{year}년생 ({new Date().getFullYear() - year + 1}세)</option>
                                    ))}
                                </select>
                            </div>

                            <button 
                                onClick={handleAdd}
                                className="w-full py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors"
                            >
                                등록하기
                            </button>
                            <button 
                                onClick={() => setIsAdding(false)}
                                className="w-full py-3 text-gray-400 font-bold"
                            >
                                취소
                            </button>
                        </div>
                    </div>
                ) : (
                    <button 
                        onClick={() => setIsAdding(true)}
                        className="w-full py-4 bg-white border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 font-bold hover:border-green-500 hover:text-green-500 transition-colors flex items-center justify-center gap-2"
                    >
                        <span>+</span> 자녀 추가하기
                    </button>
                )}
            </main>
        </div>
    );
}
