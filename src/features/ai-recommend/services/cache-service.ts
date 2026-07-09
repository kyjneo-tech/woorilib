import { createClient } from '@/shared/lib/supabase/server';
import { Book } from '@/entities/book/model/types';

// L1 캐시 (인메모리 LRU 대용 캐시)
const L1_RECOMMENDATION_CACHE = new Map<string, Book[]>();
const L1_ALADIN_SEARCH_CACHE = new Map<string, Book[]>();
const MAX_L1_SIZE = 100;

export class CacheService {
  /**
   * L1, L2 캐시에서 AI 추천 결과가 있는지 조회합니다.
   */
  async getRecommendation(cacheKey: string): Promise<Book[] | null> {
    // 1. L1 (인메모리) 적중 확인
    if (L1_RECOMMENDATION_CACHE.has(cacheKey)) {
      console.log(`[L1 Memory Cache Hit] cacheKey: ${cacheKey}`);
      return L1_RECOMMENDATION_CACHE.get(cacheKey)!;
    }

    // 2. L2 (Supabase DB) 적중 확인
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('ai_recommendation_cache')
        .select('recommendations, created_at')
        .eq('cache_key', cacheKey)
        .maybeSingle();

      if (error) {
        console.error('[L2 DB Cache Lookup Error]:', error);
        return null;
      }

      if (data && data.recommendations) {
        const books = data.recommendations as Book[];
        
        // 데이터가 존재하면 L1 캐시 동기화 (LRU 용량 확보)
        if (L1_RECOMMENDATION_CACHE.size >= MAX_L1_SIZE) {
          const firstKey = L1_RECOMMENDATION_CACHE.keys().next().value;
          if (firstKey !== undefined) L1_RECOMMENDATION_CACHE.delete(firstKey);
        }
        L1_RECOMMENDATION_CACHE.set(cacheKey, books);

        console.log(`[L2 DB Cache Hit] cacheKey: ${cacheKey}`);
        return books;
      }
    } catch (dbError) {
      console.error('[L2 DB Cache Exception]:', dbError);
    }

    return null;
  }

  /**
   * AI 추천 결과를 L1 및 L2 캐시에 동시에 저장합니다.
   */
  async saveRecommendation(cacheKey: string, query: string, recommendations: Book[]): Promise<void> {
    // 1. L1 (인메모리) 저장
    if (L1_RECOMMENDATION_CACHE.size >= MAX_L1_SIZE) {
      const firstKey = L1_RECOMMENDATION_CACHE.keys().next().value;
      if (firstKey !== undefined) L1_RECOMMENDATION_CACHE.delete(firstKey);
    }
    L1_RECOMMENDATION_CACHE.set(cacheKey, recommendations);

    // 2. L2 (Supabase DB) 저장
    try {
      const supabase = await createClient();
      const { error } = await supabase
        .from('ai_recommendation_cache')
        .upsert({
          cache_key: cacheKey,
          original_query: query,
          recommendations: recommendations,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'cache_key'
        });

      if (error) {
        console.error('[L2 DB Cache Save Error]:', error);
      } else {
        console.log(`[L2 DB Cache Saved Successfully] cacheKey: ${cacheKey}`);
      }
    } catch (dbError) {
      console.error('[L2 DB Cache Save Exception]:', dbError);
    }
  }

  /**
   * 알라딘 검색 결과를 이중 캐시에서 검색합니다.
   */
  async getAladinSearch(keywordHash: string): Promise<Book[] | null> {
    // 1. L1 적중 확인
    if (L1_ALADIN_SEARCH_CACHE.has(keywordHash)) {
      console.log(`[L1 Aladin Search Cache Hit] hash: ${keywordHash}`);
      return L1_ALADIN_SEARCH_CACHE.get(keywordHash)!;
    }

    // 2. L2 적중 확인
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('aladin_search_cache')
        .select('search_result, expires_at')
        .eq('keyword_hash', keywordHash)
        .maybeSingle();

      if (error) {
        console.error('[L2 Aladin Search Cache Lookup Error]:', error);
        return null;
      }

      if (data && data.search_result) {
        // 만료 시간 검증
        const isExpired = data.expires_at ? new Date(data.expires_at).getTime() < Date.now() : false;
        if (isExpired) {
          console.log(`[L2 Aladin Search Cache Expired] hash: ${keywordHash}`);
          return null;
        }

        const books = data.search_result as Book[];

        // L1 캐시 동기화
        if (L1_ALADIN_SEARCH_CACHE.size >= MAX_L1_SIZE) {
          const firstKey = L1_ALADIN_SEARCH_CACHE.keys().next().value;
          if (firstKey !== undefined) L1_ALADIN_SEARCH_CACHE.delete(firstKey);
        }
        L1_ALADIN_SEARCH_CACHE.set(keywordHash, books);

        console.log(`[L2 Aladin Search Cache Hit] hash: ${keywordHash}`);
        return books;
      }
    } catch (dbError) {
      console.error('[L2 Aladin Cache Exception]:', dbError);
    }

    return null;
  }

  /**
   * 알라딘 검색 결과를 이중 캐시에 저장합니다. (24시간 TTL 적용)
   */
  async saveAladinSearch(keywordHash: string, searchResult: Book[]): Promise<void> {
    // 1. L1 저장
    if (L1_ALADIN_SEARCH_CACHE.size >= MAX_L1_SIZE) {
      const firstKey = L1_ALADIN_SEARCH_CACHE.keys().next().value;
      if (firstKey !== undefined) L1_ALADIN_SEARCH_CACHE.delete(firstKey);
    }
    L1_ALADIN_SEARCH_CACHE.set(keywordHash, searchResult);

    // 2. L2 저장
    try {
      const supabase = await createClient();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24시간 후 만료

      const { error } = await supabase
        .from('aladin_search_cache')
        .upsert({
          keyword_hash: keywordHash,
          search_result: searchResult,
          created_at: now.toISOString(),
          expires_at: expiresAt.toISOString()
        }, {
          onConflict: 'keyword_hash'
        });

      if (error) {
        console.error('[L2 Aladin Cache Save Error]:', error);
      } else {
        console.log(`[L2 Aladin Cache Saved Successfully] hash: ${keywordHash}`);
      }
    } catch (dbError) {
      console.error('[L2 Aladin Cache Save Exception]:', dbError);
    }
  }
}

export const cacheService = new CacheService();
