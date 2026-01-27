'use client';

import { MapLocation, calculateDistance, formatDistance } from '../lib/use-map-store';

interface LocationInfoCardProps {
  location: MapLocation;
  userLocation?: { lat: number; lng: number } | null;
  onClose: () => void;
}

/**
 * 위치 정보 카드 컴포넌트 (Premium Redesign)
 * - Apple Maps 스타일의 깔끔하고 계층화된 UI
 */
export function LocationInfoCard({
  location,
  userLocation,
  onClose,
}: LocationInfoCardProps) {
  const distance = userLocation
    ? calculateDistance(userLocation.lat, userLocation.lng, location.lat, location.lng)
    : null;

  const handleNavigation = () => {
    const url = `https://map.kakao.com/link/to/${encodeURIComponent(location.name)},${location.lat},${location.lng}`;
    window.open(url, '_blank');
  };

  const handleCall = () => {
    if (location.tel) {
      window.location.href = `tel:${location.tel}`;
    }
  };

  const handleHomepage = () => {
    if (location.homepage) {
        window.open(location.homepage, '_blank');
    }
  };

  const isAladin = location.type === 'aladin';
  const hasStock = isAladin ? location.hasStock : true; // Libraries always shown (availability varies but we assume open)

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2 border border-white/20 ring-1 ring-black/5">
      {/* 1. Header Area with Close Button */}
      <div className="relative p-5 pb-2">

        <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl filter drop-shadow-sm">
                {isAladin ? '📖' : '🏛️'}
            </span>
            {distance !== null && (
                <span className="text-[11px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                    {formatDistance(distance)}
                </span>
            )}
        </div>

        <h3 className="text-xl font-black text-gray-900 leading-tight pr-8">
            {location.name}
        </h3>
        
        {/* Status Badge */}
        <div className="flex flex-wrap gap-2 mt-2">
            {!isAladin ? (
               <span className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-md ${location.closed ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                    {location.closed ? '🔒 휴관일' : '🟢 운영중'}
               </span>
            ) : (
                <span className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-md ${location.hasStock ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-400'}`}>
                    {location.hasStock ? '✨ 재고 있음' : '❌ 재고 없음'}
                </span>
            )}
        </div>
      </div>

      {/* 2. Content Area */}
      <div className="px-5 py-2">
        <div className="space-y-2.5">
            {/* Possession Badge & Address */}
            <div>
                {!isAladin && (
                    <div className="inline-flex items-center gap-1.5 mb-1.5 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-xs font-bold">
                        <span>📚</span>
                        <span>소장 도서관</span>
                    </div>
                )}
                <div className="flex items-start gap-3">
                    <span className="text-gray-400 mt-0.5 text-sm">📍</span>
                    <span className="text-sm text-gray-600 font-medium leading-snug">{location.address}</span>
                </div>
            </div>
            
            {(location.operatingTime && location.operatingTime !== '-') && (
                <div className="flex items-start gap-3">
                    <span className="text-gray-400 mt-0.5 text-sm">🕒</span>
                    <span className="text-sm text-gray-600">{location.operatingTime}</span>
                </div>
            )}

            {/* Disclaimer for Libraries */}
            {!isAladin && (
                <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2.5 rounded-lg border border-gray-100 leading-relaxed">
                    📢 방문 전 <strong>홈페이지</strong>에서 실시간 재고나 예약 가능 여부를 꼭 확인해주세요!
                </div>
            )}

            {isAladin && location.shelfLocation && (
                <div className="flex items-start gap-3 bg-gray-50 p-2 rounded-lg">
                    <span className="text-purple-500 mt-0.5 text-xs">📚</span>
                    <span className="text-xs text-gray-700 font-bold">서가: {location.shelfLocation}</span>
                </div>
            )}
        </div>
      </div>

      {/* 3. Action Area */}
      <div className="p-4 pt-2 flex flex-col gap-2">
        <div className="flex gap-2">
            {location.homepage && (
                <button 
                    onClick={handleHomepage}
                    className="flex-1 py-3 flex items-center justify-center gap-1 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
                >
                    <span>🌐</span>
                    <span className="text-xs">홈페이지</span>
                </button>
            )}
            <button
                onClick={handleNavigation}
                className={`flex-[2] flex items-center justify-center gap-2 rounded-xl text-white font-bold shadow-lg shadow-green-200 transition-all active:scale-95 ${isAladin ? 'bg-gradient-to-r from-purple-500 to-indigo-600 shadow-indigo-200' : 'bg-gradient-to-r from-green-500 to-emerald-600'}`}
            >
                <span className="text-lg">🧭</span>
                <span>길찾기</span>
            </button>
        </div>
        
        {/* Full width Close Button */}
        <button 
            onClick={onClose}
            className="w-full py-3 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
        >
            닫기
        </button>
      </div>
    </div>
  );
}
