'use client';

import React, { useEffect, useState } from 'react';
import { CocoAgentStatus } from '@/features/admin/ui/coco-agent-status';

interface Stats {
  totalBooks: number;
  statusDistribution: { status: string; count: number }[];
  domainDistribution: { domain: string; count: number }[];
  recentLogs: any[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  if (loading) return <div className="text-center p-10">데이터 로딩 중...</div>;
  if (!stats) return <div className="text-center p-10 text-red-500">데이터를 불러오지 못했습니다.</div>;

  const pendingCount = stats.statusDistribution.find(s => s.status === 'pending' || s.status === 'needs_review')?.count || 0;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">대시보드 개요</h2>

      {/* 🤖 Coco Agent Status Section */}
      <CocoAgentStatus />

      {/* Operator Checklist Widget */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-lg border border-indigo-100 shadow-sm">
        <h3 className="text-lg font-bold text-indigo-800 mb-3">✅ 오늘의 운영 체크리스트</h3>
        <ul className="space-y-2">
            {stats.totalBooks < 100 && (
                <li className="flex items-center text-red-700">
                    <span className="mr-2">🚨</span>
                    <span><strong>초기 데이터 부족:</strong> 터미널에서 `npx tsx scripts/curation/seed-keywords.ts`를 실행하여 기초 데이터를 쌓으세요.</span>
                </li>
            )}
            {pendingCount > 0 ? (
                <li className="flex items-center text-yellow-700">
                    <span className="mr-2">⚠️</span>
                    <span><strong>검수 대기중:</strong> <b>{pendingCount}권</b>의 책이 검수를 기다리고 있습니다. <a href="/admin/books?status=pending" className="underline hover:text-yellow-900">도서 관리 페이지</a>로 이동하세요.</span>
                </li>
            ) : (
                <li className="flex items-center text-green-700">
                    <span className="mr-2">✅</span>
                    <span>모든 도서 검수 완료! 훌륭합니다.</span>
                </li>
            )}
            <li className="flex items-center text-gray-700">
                <span className="mr-2">📅</span>
                <span><strong>전집 업데이트:</strong> 이번 달 신상 전집이 있나요? 맘카페를 확인하고 `fetch-collections.ts`를 업데이트하세요.</span>
            </li>
            <li className="flex items-center text-gray-700">
                <span className="mr-2">🧪</span>
                <span><strong>큐레이션 점검:</strong> <a href="/admin/simulation" className="underline hover:text-indigo-900">시뮬레이터</a>를 돌려 추천 로직이 정상적인지 확인해보세요.</span>
            </li>
        </ul>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard title="총 보유 도서" value={stats.totalBooks} icon="📚" color="blue" />
        <KPICard 
          title="검수 필요" 
          value={stats.statusDistribution.find(s => s.status === 'pending' || s.status === 'needs_review')?.count || 0} 
          icon="⚠️" 
          color="yellow" 
        />
        <KPICard 
          title="검증 완료" 
          value={stats.statusDistribution.find(s => s.status === 'verified')?.count || 0} 
          icon="✅" 
          color="green" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Domain Distribution */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">발달 영역 분포</h3>
          <div className="space-y-2">
            {stats.domainDistribution.map((d) => (
              <div key={d.domain} className="flex items-center justify-between">
                <span className="text-gray-600">{d.domain}</span>
                <div className="flex items-center w-2/3">
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${(d.count / stats.totalBooks) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{d.count}권</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Logs */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">최근 활동 로그</h3>
          <ul className="divide-y divide-gray-200">
            {stats.recentLogs.map((log: any) => (
              <li key={log.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-800 truncate w-64">{log.title}</p>
                  <p className="text-xs text-gray-500">{new Date(log.updated_at).toLocaleString()}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  log.verification_status === 'verified' ? 'bg-green-100 text-green-800' : 
                  log.verification_status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {log.verification_status === 'verified' ? '완료' : 
                   log.verification_status === 'rejected' ? '반려' : '대기'} 
                  ({log.confidence_score}점)
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, icon, color }: any) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    green: 'bg-green-50 text-green-600',
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow flex items-center">
      <div className={`p-4 rounded-full mr-4 ${colorClasses[color as keyof typeof colorClasses]}`}>
        <span className="text-2xl">{icon}</span>
      </div>
      <div>
        <p className="text-sm text-gray-500 uppercase">{title}</p>
        <p className="text-3xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}