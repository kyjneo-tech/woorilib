'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AgeGroupId } from '@/shared/config/constants';

interface UserState {
  // Child info
  childAgeGroup: AgeGroupId | null;
  childName: string | null;
  
  // Location
  regionCode: string;
  regionName: string;
  subRegionCode?: string;
  subRegionName?: string;
  districtCode?: string;
  districtName?: string;

  // Actions
  setChildAgeGroup: (ageGroup: AgeGroupId) => void;
  setChildName: (name: string) => void;
  setRegion: (data: Partial<Pick<UserState, 'regionCode' | 'regionName' | 'subRegionCode' | 'subRegionName' | 'districtCode' | 'districtName'>>) => void;
  resetOnboarding: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      childAgeGroup: null,
      childName: null,
      regionCode: '11', // Default: 서울
      regionName: '서울특별시',
      subRegionCode: undefined,
      subRegionName: undefined,
      districtCode: undefined,
      districtName: undefined,

      setChildAgeGroup: (ageGroup) => set({ childAgeGroup: ageGroup }),
      setChildName: (name) => set({ childName: name }),
      setRegion: (data) => set({ ...data }),
      resetOnboarding: () => set({ childAgeGroup: null, childName: null }),
    }),
    {
      name: 'woorilib-user',
    }
  )
);
