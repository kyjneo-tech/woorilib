'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AgeGroupId } from '@/shared/config/constants';


export interface UserState {
  // Child info
  childAgeGroup: AgeGroupId | null;
  childName: string | null;
  birthYear: number | null;
  gender: 'boy' | 'girl' | null;
  propensity: 'active' | 'calm' | 'sensitive' | 'curious' | null;
  interests: string[];

  // Location
  regionCode: string;
  regionName: string;
  subRegionCode?: string;
  subRegionName?: string;
  districtCode?: string;
  districtName?: string;

  // Actions
  setChildProfile: (profile: Partial<Pick<UserState, 'childAgeGroup' | 'childName' | 'birthYear' | 'gender' | 'propensity' | 'interests'>>) => void;
  setChildAgeGroup: (ageGroup: AgeGroupId) => void;
  setRegion: (data: Partial<Pick<UserState, 'regionCode' | 'regionName' | 'subRegionCode' | 'subRegionName' | 'districtCode' | 'districtName'>>) => void;
  resetOnboarding: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      childAgeGroup: null,
      childName: null,
      birthYear: null,
      gender: null,
      propensity: null,
      interests: [],

      regionCode: '11', // Default: 서울
      regionName: '서울특별시',
      subRegionCode: undefined,
      subRegionName: undefined,
      districtCode: undefined,
      districtName: undefined,

      setChildProfile: (profile) => set((state) => ({ ...state, ...profile })),
      setChildAgeGroup: (ageGroup) => set((state) => ({ ...state, childAgeGroup: ageGroup })),
      setRegion: (data) => set({ ...data }),
      resetOnboarding: () => set({
        childAgeGroup: null,
        childName: null,
        birthYear: null,
        gender: null,
        propensity: null,
        interests: []
      }),
    }),
    {
      name: 'woorilib-user',
    }
  )
);
