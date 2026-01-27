'use client';

import { create } from 'zustand';
import { readingRecordService } from './reading-record.service';
import {
  ReadingRecord,
  CreateReadingRecordDto,
  ReadingStats,
  ReactionType,
} from './types';

interface ReadingRecordState {
  // 상태
  records: ReadingRecord[];
  stats: ReadingStats | null;
  isLoading: boolean;
  error: string | null;

  // 액션
  fetchRecords: (childId?: string, limit?: number) => Promise<void>;
  fetchStats: (childId?: string) => Promise<void>;
  addRecord: (dto: CreateReadingRecordDto) => Promise<ReadingRecord>;
  updateReaction: (id: string, reaction: ReactionType) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  checkIfRead: (isbn: string, childId?: string) => Promise<ReadingRecord | null>;
  clearError: () => void;
}

export const useReadingRecordStore = create<ReadingRecordState>((set, get) => ({
  records: [],
  stats: null,
  isLoading: false,
  error: null,

  fetchRecords: async (childId, limit) => {
    set({ isLoading: true, error: null });
    try {
      const records = await readingRecordService.getRecords(childId, limit);
      set({ records, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch records:', error);
      set({
        error: '독서 기록을 불러오는데 실패했습니다.',
        isLoading: false,
      });
    }
  },

  fetchStats: async (childId) => {
    try {
      const stats = await readingRecordService.getStats(childId);
      set({ stats });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  },

  addRecord: async (dto) => {
    set({ isLoading: true, error: null });
    try {
      const newRecord = await readingRecordService.addRecord(dto);
      set((state) => ({
        records: [newRecord, ...state.records],
        isLoading: false,
      }));
      // 통계 갱신
      get().fetchStats(dto.childId);
      return newRecord;
    } catch (error) {
      console.error('Failed to add record:', error);
      set({
        error: '독서 기록 추가에 실패했습니다.',
        isLoading: false,
      });
      throw error;
    }
  },

  updateReaction: async (id, reaction) => {
    try {
      const updated = await readingRecordService.updateRecord(id, { reaction });
      set((state) => ({
        records: state.records.map((r) => (r.id === id ? updated : r)),
      }));
    } catch (error) {
      console.error('Failed to update reaction:', error);
      throw error;
    }
  },

  deleteRecord: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await readingRecordService.deleteRecord(id);
      set((state) => ({
        records: state.records.filter((r) => r.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to delete record:', error);
      set({
        error: '독서 기록 삭제에 실패했습니다.',
        isLoading: false,
      });
    }
  },

  checkIfRead: async (isbn, childId) => {
    return readingRecordService.checkIfRead(isbn, childId);
  },

  clearError: () => set({ error: null }),
}));
