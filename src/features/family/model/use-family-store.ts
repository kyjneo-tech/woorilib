'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { familyService } from '../api/family.service';
import { Child, CreateChildDto, UpdateChildDto, calculateAge } from './types';

interface FamilyState {
  // 상태
  children: Child[];
  selectedChildId: string | null;
  isLoading: boolean;
  error: string | null;

  // 선택된 자녀 가져오기
  getSelectedChild: () => Child | null;

  // 액션
  fetchChildren: () => Promise<void>;
  addChild: (dto: CreateChildDto) => Promise<Child>;
  updateChild: (id: string, dto: UpdateChildDto) => Promise<void>;
  removeChild: (id: string) => Promise<void>;
  selectChild: (id: string | null) => void;
  clearError: () => void;
}

export const useFamilyStore = create<FamilyState>()(
  persist(
    (set, get) => ({
      children: [],
      selectedChildId: null,
      isLoading: false,
      error: null,

      getSelectedChild: () => {
        const { children, selectedChildId } = get();
        if (!selectedChildId) return children[0] || null;
        return children.find((c) => c.id === selectedChildId) || children[0] || null;
      },

      fetchChildren: async () => {
        set({ isLoading: true, error: null });
        try {
          const children = await familyService.getChildren();
          set({ children, isLoading: false });

          // 선택된 자녀가 없으면 첫 번째 자녀 선택
          const { selectedChildId } = get();
          if (!selectedChildId && children.length > 0) {
            set({ selectedChildId: children[0].id });
          }
        } catch (error) {
          console.error('Failed to fetch children:', error);
          set({
            error: '자녀 목록을 불러오는데 실패했습니다.',
            isLoading: false,
          });
        }
      },

      addChild: async (dto) => {
        set({ isLoading: true, error: null });
        try {
          const newChild = await familyService.addChild(dto);
          set((state) => ({
            children: [...state.children, newChild],
            isLoading: false,
            // 첫 자녀면 자동 선택
            selectedChildId: state.children.length === 0 ? newChild.id : state.selectedChildId,
          }));
          return newChild;
        } catch (error) {
          console.error('Failed to add child:', error);
          set({
            error: '자녀 추가에 실패했습니다.',
            isLoading: false,
          });
          throw error;
        }
      },

      updateChild: async (id, dto) => {
        set({ isLoading: true, error: null });
        try {
          const updated = await familyService.updateChild(id, dto);
          set((state) => ({
            children: state.children.map((c) => (c.id === id ? updated : c)),
            isLoading: false,
          }));
        } catch (error) {
          console.error('Failed to update child:', error);
          set({
            error: '자녀 정보 수정에 실패했습니다.',
            isLoading: false,
          });
          throw error;
        }
      },

      removeChild: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await familyService.removeChild(id);
          set((state) => {
            const newChildren = state.children.filter((c) => c.id !== id);
            return {
              children: newChildren,
              isLoading: false,
              // 삭제된 자녀가 선택되어 있었으면 다른 자녀 선택
              selectedChildId:
                state.selectedChildId === id
                  ? newChildren[0]?.id || null
                  : state.selectedChildId,
            };
          });
        } catch (error) {
          console.error('Failed to remove child:', error);
          set({
            error: '자녀 삭제에 실패했습니다.',
            isLoading: false,
          });
        }
      },

      selectChild: (id) => set({ selectedChildId: id }),

      clearError: () => set({ error: null }),
    }),
    {
      name: 'woorilib-family',
      partialize: (state) => ({
        selectedChildId: state.selectedChildId,
      }),
    }
  )
);

/**
 * 현재 선택된 자녀의 나이 기반 추천 카테고리 반환
 */
export function getRecommendedCategories(child: Child | null): string[] {
  if (!child) return ['유아', '그림책'];

  const age = calculateAge(child.birthDate);

  if (age < 3) {
    return ['영아', '보드북', '그림책'];
  } else if (age < 5) {
    return ['유아', '그림책', '동화'];
  } else if (age < 7) {
    return ['유아', '그림책', '창작동화', '과학'];
  } else if (age < 10) {
    return ['아동', '창작동화', '과학', '역사'];
  } else {
    return ['아동', '청소년', '과학', '역사', '소설'];
  }
}
