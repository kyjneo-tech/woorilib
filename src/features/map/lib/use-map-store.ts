'use client';

import { create } from 'zustand';
import { AladinStore, findStoreByCode } from '@/shared/data/aladin-stores';

/**
 * 지도에 표시할 위치 정보 타입
 */
export interface MapLocation {
  id: string;
  name: string;
  type: 'library' | 'aladin';
  lat: number;
  lng: number;
  address: string;
  tel?: string;
  // 도서관 전용 필드
  homepage?: string;
  operatingTime?: string;
  closed?: string;
  hasBook?: boolean; // 해당 책 소장 여부
  // 알라딘 전용 필드
  offCode?: string;
  hasStock?: boolean; // 재고 여부
  shelfLocation?: string; // 서가 위치
}

interface MapState {
  // 상태
  locations: MapLocation[];
  selectedLocation: MapLocation | null;
  userLocation: { lat: number; lng: number } | null;
  isLoading: boolean;
  filter: 'all' | 'library' | 'aladin';

  // 액션
  setLocations: (locations: MapLocation[]) => void;
  addLocations: (locations: MapLocation[]) => void;
  setSelectedLocation: (location: MapLocation | null) => void;
  setUserLocation: (location: { lat: number; lng: number } | null) => void;
  setLoading: (loading: boolean) => void;
  setFilter: (filter: 'all' | 'library' | 'aladin') => void;
  getFilteredLocations: () => MapLocation[];
  clearLocations: () => void;
}

export const useMapStore = create<MapState>((set, get) => ({
  locations: [],
  selectedLocation: null,
  userLocation: null,
  isLoading: false,
  filter: 'all',

  setLocations: (locations) => set({ locations }),

  addLocations: (newLocations) => set((state) => ({
    locations: [...state.locations, ...newLocations],
  })),

  setSelectedLocation: (location) => set({ selectedLocation: location }),

  setUserLocation: (location) => set({ userLocation: location }),

  setLoading: (loading) => set({ isLoading: loading }),

  setFilter: (filter) => set({ filter }),

  getFilteredLocations: () => {
    const { locations, filter } = get();
    if (filter === 'all') return locations;
    return locations.filter((loc) => loc.type === filter);
  },

  clearLocations: () => set({ locations: [], selectedLocation: null }),
}));

/**
 * 도서관 정보를 MapLocation으로 변환
 */
export function libraryToMapLocation(library: any, hasBook?: boolean): MapLocation {
  return {
    id: `lib-${library.libCode || library.isbn}`,
    name: library.libName || library.name,
    type: 'library',
    lat: parseFloat(library.latitude) || 0,
    lng: parseFloat(library.longitude) || 0,
    address: library.address || '',
    tel: library.tel,
    homepage: library.homepage,
    operatingTime: library.operatingTime,
    closed: library.closed,
    hasBook: hasBook ?? true,
  };
}

/**
 * 알라딘 매장 정보를 MapLocation으로 변환
 * @param offStoreInfo - API에서 받은 매장 재고 정보 (hasStock, location)
 */
export function aladinStoreToMapLocation(
  store: AladinStore,
  stockInfo?: { hasStock: boolean; location?: string }
): MapLocation {
  return {
    id: `aladin-${store.offCode}`,
    name: `알라딘 ${store.name}`,
    type: 'aladin',
    lat: store.lat,
    lng: store.lng,
    address: store.address,
    tel: store.tel,
    offCode: store.offCode,
    hasStock: stockInfo?.hasStock ?? false,
    shelfLocation: stockInfo?.location,
  };
}

/**
 * 사용자와 위치 간 거리 계산 (km)
 * Haversine formula 사용
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // 지구 반지름 (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 거리 포맷팅 (1km 미만은 m, 이상은 km)
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
}
