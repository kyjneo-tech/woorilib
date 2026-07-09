'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useMapStore, MapLocation, calculateDistance, formatDistance } from '../lib/use-map-store';
import { LocationInfoCard } from './LocationInfoCard';

declare global {
  interface Window {
    kakao: any;
  }
}

interface BookLocationMapProps {
  locations?: MapLocation[];
  userLocation?: { lat: number; lng: number } | null;
  onLocationSelect?: (location: MapLocation) => void;
  height?: string;
  showFilter?: boolean;
}

// 필터 버튼 컴포넌트 (외부로 이동)
const FilterButton = ({ 
  value, 
  label, 
  current, 
  onClick 
}: { 
  value: 'all' | 'library' | 'aladin'; 
  label: string; 
  current: string; 
  onClick: (val: 'all' | 'library' | 'aladin') => void 
}) => (
  <button
    onClick={() => onClick(value)}
    className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
      current === value
        ? 'bg-green-600 text-white'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`}
  >
    {label}
  </button>
);

/**
 * 책 구하기 지도 컴포넌트
 * - 도서관 (녹색 마커)
 * - 알라딘 중고매장 (보라색 마커, 재고 없으면 회색)
 */
export function BookLocationMap({
  locations: propsLocations,
  userLocation: propsUserLocation,
  onLocationSelect,
  height = '300px',
  showFilter = true,
}: BookLocationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const overlaysRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);

  const {
    locations: storeLocations,
    userLocation: storeUserLocation,
    selectedLocation,
    setSelectedLocation,
    filter,
    setFilter,
    getFilteredLocations,
  } = useMapStore();

  const [isMapReady, setIsMapReady] = useState(false);

  // props 우선, 없으면 store 사용
  const locations = propsLocations || storeLocations;
  const userLocation = propsUserLocation ?? storeUserLocation;
  const displayLocations = propsLocations || getFilteredLocations();

  // 지도 초기화
  useEffect(() => {
    if (!mapContainer.current) return;
    if (mapRef.current) return; // 이미 초기화됨

    const initMap = () => {
      if (!window.kakao?.maps) return;

      const initialCenter = userLocation
        ? new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng)
        : new window.kakao.maps.LatLng(37.566826, 126.9786567); // 서울시청

      const options = {
        center: initialCenter,
        level: userLocation ? 5 : 8,
      };

      const map = new window.kakao.maps.Map(mapContainer.current, options);
      mapRef.current = map;
      setIsMapReady(true);

      // 지도 클릭 시 선택 해제
      window.kakao.maps.event.addListener(map, 'click', () => {
        setSelectedLocation(null);
      });
    };

    if (window.kakao?.maps) {
      window.kakao.maps.load(initMap);
    }
  }, []);

  // 사용자 위치 마커
  useEffect(() => {
    if (!isMapReady || !mapRef.current || !window.kakao?.maps) return;

    // 기존 마커 제거
    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
    }

    if (!userLocation) return;

    const position = new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng);

    // 파란 점 마커
    const content = `
      <div style="position: relative; width: 24px; height: 24px;">
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                    width: 14px; height: 14px; background-color: #3b82f6; border-radius: 50%;
                    border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2); z-index: 2;"></div>
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                    width: 24px; height: 24px; background-color: rgba(59, 130, 246, 0.4);
                    border-radius: 50%; animation: pulse 1.5s infinite; z-index: 1;"></div>
      </div>
      <style>
        @keyframes pulse {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.8; }
          100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
      </style>
    `;

    const overlay = new window.kakao.maps.CustomOverlay({
      position,
      content,
      map: mapRef.current,
      zIndex: 1,
    });

    userMarkerRef.current = overlay;
  }, [userLocation, isMapReady]);

  // 마커 렌더링
  useEffect(() => {
    if (!isMapReady || !mapRef.current || !window.kakao?.maps) return;

    // 기존 마커/오버레이 제거
    markersRef.current.forEach((m) => m.setMap(null));
    overlaysRef.current.forEach((o) => o.setMap(null));
    markersRef.current = [];
    overlaysRef.current = [];

    if (displayLocations.length === 0) return;

    const bounds = new window.kakao.maps.LatLngBounds();

    displayLocations.forEach((loc) => {
      if (!loc.lat || !loc.lng) return;

      const position = new window.kakao.maps.LatLng(loc.lat, loc.lng);
      bounds.extend(position);

      // 마커 색상 결정
      let markerColor = '#22c55e'; // 도서관: 녹색
      if (loc.type === 'aladin') {
        markerColor = loc.hasStock ? '#8b5cf6' : '#9ca3af'; // 재고있음: 보라, 없음: 회색
      }

      // SVG 커스텀 마커로 대체
      const markerContent = `
        <div style="cursor: pointer;">
          <svg width="28" height="40" viewBox="0 0 28 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 0C6.268 0 0 6.268 0 14C0 24.5 14 40 14 40S28 24.5 28 14C28 6.268 21.732 0 14 0Z" fill="${markerColor}"/>
            <circle cx="14" cy="14" r="6" fill="white"/>
            <text x="14" y="17" text-anchor="middle" font-size="10" fill="${markerColor}">
              ${loc.type === 'library' ? '📚' : '📖'}
            </text>
          </svg>
        </div>
      `;

      // DOM Element 생성 (이벤트 핸들러 부착을 위해)
      const contentEl = document.createElement('div');
      contentEl.innerHTML = markerContent;
      contentEl.onclick = () => {
        setSelectedLocation(loc);
        onLocationSelect?.(loc);
        mapRef.current.panTo(position);
      };

      const customOverlay = new window.kakao.maps.CustomOverlay({
        position,
        content: contentEl,
        yAnchor: 1,
        map: mapRef.current,
        clickable: true,
      });

      markersRef.current.push(customOverlay);
    });

    // 지도 범위 조정
    if (displayLocations.length > 0) {
      mapRef.current.setBounds(bounds);
    }
  }, [displayLocations, isMapReady, onLocationSelect]);

  // 선택된 위치로 이동
  useEffect(() => {
    if (!selectedLocation || !mapRef.current || !window.kakao?.maps) return;

    const position = new window.kakao.maps.LatLng(selectedLocation.lat, selectedLocation.lng);
    mapRef.current.panTo(position);

    if (mapRef.current.getLevel() > 5) {
      mapRef.current.setLevel(5, { animate: true });
    }
  }, [selectedLocation]);

  return (
    <div className="relative rounded-xl overflow-hidden" style={{ height }}>
      {/* 지도 컨테이너 */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* 필터 버튼 */}
      {showFilter && (
        <div className="absolute top-3 left-3 z-10 flex gap-2">
          <FilterButton value="all" label="전체" current={filter} onClick={setFilter} />
          <FilterButton value="library" label="🏛️ 도서관" current={filter} onClick={setFilter} />
          <FilterButton value="aladin" label="📖 알라딘" current={filter} onClick={setFilter} />
        </div>
      )}

      {/* 선택된 위치 정보 팝업 */}
      {selectedLocation && (
        <div className="absolute bottom-3 left-3 right-3 z-10">
          <LocationInfoCard
            location={selectedLocation}
            userLocation={userLocation}
            onClose={() => setSelectedLocation(null)}
          />
        </div>
      )}

      {/* 위치 수 표시 */}
      {displayLocations.length > 0 && (
        <div className="absolute top-3 right-3 z-10 px-3 py-1.5 bg-white/90 backdrop-blur rounded-full text-xs text-gray-600 shadow">
          {displayLocations.length}개 위치
        </div>
      )}
    </div>
  );
}