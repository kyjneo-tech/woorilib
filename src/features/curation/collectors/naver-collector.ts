
import dotenv from 'dotenv';
import path from 'path';
import { SimpleFileCache } from '../../../shared/lib/simple-cache';
import { BaseApiClient } from '@/shared/api/base-api-client';

// Load environment variables
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
}

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;
const NAVER_API_BASE = 'https://openapi.naver.com/v1/search/'; // Base URL needs trailing slash for new URL()

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

interface NaverResponse<T> {
  items: T[];
  total?: number;
}

export class NaverCollector extends BaseApiClient {
  protected baseUrl = NAVER_API_BASE;
  private static instance: NaverCollector;

  constructor() {
    super();
  }

  static getInstance(): NaverCollector {
    if (!this.instance) {
      this.instance = new NaverCollector();
    }
    return this.instance;
  }

  private async naverRequest<T>(endpoint: string, params: Record<string, string | number>): Promise<T | null> {
    const cacheKey = `naver_${endpoint}_${JSON.stringify(params)}`;
    const cached = SimpleFileCache.get<T>(cacheKey);
    if (cached) return cached;

    try {
      const data = await this.request<T>(endpoint, {
        params,
        headers: {
          'X-Naver-Client-Id': NAVER_CLIENT_ID || '',
          'X-Naver-Client-Secret': NAVER_CLIENT_SECRET || '',
        }
      });
      
      if (data) SimpleFileCache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`[NaverCollector] Failed to fetch ${endpoint}:`, error);
      return null;
    }
  }

  /**
   * Search for books (Review/Cross-Check)
   */
  async searchBook(query: string, display = 5): Promise<NaverBookSpec[]> {
    const response = await this.naverRequest<NaverResponse<NaverBookSpec>>('book.json', {
      query: query,
      display: display,
      sort: 'sim' 
    });
    return response?.items || [];
  }

  static async searchBook(query: string, display = 5): Promise<NaverBookSpec[]> {
    return this.getInstance().searchBook(query, display);
  }

  /**
   * Get Total Count of Blog Reviews
   */
  async getBlogReviewCount(query: string): Promise<number> {
    const response = await this.naverRequest<NaverResponse<any>>('blog.json', {
      query: query,
      display: 1
    });
    return response?.total || 0;
  }

  static async getBlogReviewCount(query: string): Promise<number> {
    return this.getInstance().getBlogReviewCount(query);
  }

  /**
   * Search Blogs for sentiment analysis
   */
  async searchBlog(query: string, display = 5): Promise<NaverBlogSpec[]> {
    const response = await this.naverRequest<NaverResponse<NaverBlogSpec>>('blog.json', {
      query: query,
      display: display,
      sort: 'sim'
    });
    return response?.items || [];
  }

  static async searchBlog(query: string, display = 5): Promise<NaverBlogSpec[]> {
    return this.getInstance().searchBlog(query, display);
  }
}
