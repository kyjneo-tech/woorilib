'use client';

import React, { useState } from 'react';

export default function SimulationPage() {
  const [age, setAge] = useState(36);
  const [keyword, setKeyword] = useState('자동차');
  const [propensity, setPropensity] = useState('active');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSimulate = async () => {
    setLoading(true);
    setResult(null);
    try {
        const res = await fetch('/api/curation/roadmap', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keyword, ageMonths: Number(age), propensity })
        });
        const data = await res.json();
        setResult(data);
    } catch (e) {
        alert('시뮬레이션 실패');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold">큐레이션 시뮬레이터</h2>
        
        <div className="bg-white p-6 rounded shadow flex gap-4 items-end flex-wrap">
            <div>
                <label className="block text-sm font-medium mb-1">아이 월령 (개월)</label>
                <input type="number" value={age} onChange={e => setAge(Number(e.target.value))} className="border p-2 rounded w-24" />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">관심 키워드</label>
                <input type="text" value={keyword} onChange={e => setKeyword(e.target.value)} className="border p-2 rounded w-48" placeholder="예: 공룡" />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">성향</label>
                <select value={propensity} onChange={e => setPropensity(e.target.value)} className="border p-2 rounded w-32">
                    <option value="active">활발함 (Active)</option>
                    <option value="calm">차분함 (Calm)</option>
                </select>
            </div>
            <button onClick={handleSimulate} disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded">
                {loading ? '시뮬레이션 중...' : '결과 확인'}
            </button>
        </div>

        {result && (
            <div className="space-y-8">
                {result.roadmap.map((week: any) => (
                    <div key={week.week} className="bg-white p-6 rounded shadow border-l-4 border-blue-500">
                        <h3 className="text-lg font-bold text-blue-700">{week.week}주차: {week.theme}</h3>
                        <p className="text-gray-600 mb-4">{week.description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {week.books.map((book: any) => (
                                <div key={book.isbn} className="border rounded p-3 flex space-x-3">
                                    <img src={book.cover} className="w-16 h-20 object-cover rounded" />
                                    <div>
                                        <p className="font-bold text-sm line-clamp-1">{book.title}</p>
                                        <p className="text-xs text-gray-500 mt-1">{book.reason}</p>
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {book.tags.slice(0, 2).map((t: string) => (
                                                <span key={t} className="text-[10px] bg-gray-100 px-1 rounded">{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
  );
}