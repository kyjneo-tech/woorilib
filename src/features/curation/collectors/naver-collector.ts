
import dotenv from 'dotenv';
import path from 'path';
import { SimpleFileCache } from '../../../shared/lib/simple-cache';

// Load environment variables
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
}

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;
const NAVER_API_BASE = 'https://openapi.naver.com/v1/search';

if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
  console.warn('⚠️ NAVER API Keys are missing. Naver calls will fail.');
}

export interface NaverBookSpec {
  title: string;
  link: string;
  image: string;
  author: string;
  discount: string;
  publisher: string;
  pubdate: string;
  isbn: string;
  description: string;
}

export interface NaverBlogSpec {
  title: string;
  link: string;
  description: string;
  bloggername: string;
  bloggerlink: string;
  postdate: string;
}

export class NaverCollector {
  private static async fetch<T>(endpoint: string, params: Record<string, string | number>): Promise<T | null> {
    const url = new URL(`${NAVER_API_BASE}/${endpoint}`);
    
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });

    // --- Cache Check ---
    const cacheKey = `naver_${endpoint}_${JSON.stringify(params)}`;
    const cached = SimpleFileCache.get<T>(cacheKey);
    if (cached) {
      return cached;
    }
    // -------------------

    try {
      const response = await fetch(url.toString(), {
        headers: {
          'X-Naver-Client-Id': NAVER_CLIENT_ID || '',
          'X-Naver-Client-Secret': NAVER_CLIENT_SECRET || '',
        },
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.error('[NaverCollector] Rate Limit Exceeded');
        }
        throw new Error(`Naver API Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // --- Cache Set ---
      SimpleFileCache.set(cacheKey, data);
      
      return data as T;
    } catch (error) {
      console.error(`[NaverCollector] Failed to fetch ${endpoint}:`, error);
      return null;
    }
  }

  /**
   * Search for books (Review/Cross-Check)
   */
  static async searchBook(query: string, display = 5): Promise<NaverBookSpec[]> {
    const response = await this.fetch<{ items: any[] }>('book.json', {
      query: query,
      display: display,
      sort: 'sim' 
    });
    return (response?.items || []) as NaverBookSpec[];
  }

  /**
   * Get Total Count of Blog Reviews
   */
  static async getBlogReviewCount(query: string): Promise<number> {
    const response = await this.fetch<{ total: number }>('blog.json', {
      query: query,
      display: 1
    });
    return response?.total || 0;
  }

  /**
   * Search Blogs for sentiment analysis
   */
  static async searchBlog(query: string, display = 5): Promise<NaverBlogSpec[]> {
    const response = await this.fetch<{ items: any[] }>('blog.json', {
      query: query,
      display: display,
      sort: 'sim'
    });
    return (response?.items || []) as NaverBlogSpec[];
  }
}
