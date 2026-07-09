
import dotenv from 'dotenv';
import path from 'path';
import { BaseApiClient } from '@/shared/api/base-api-client';

// Load environment variables for local script execution
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
}

// Aladin API Configuration
const ALADIN_API_KEY = process.env.ALADIN_TTB_KEY;
const ALADIN_API_BASE = 'https://www.aladin.co.kr/ttb/api/';

if (!ALADIN_API_KEY) {
  console.warn('⚠️ ALADIN_TTB_KEY is missing. API calls will fail.');
}

export interface BookSpec {
  isbn13: string;
  title: string;
  author: string;
  publisher: string;
  pubDate: string;
  cover: string;
  categoryName: string;
  description: string;
  priceStandard: number;
  link: string;
  salesPoint: number;
  customerReviewRank: number;
}

interface AladinResponse {
  item: any[];
}

/**
 * Server-side Aladin Collector for Curation Engine
 * - Directly calls Aladin TTB API
 * - Used for Seed Scripts & Backend Workers
 */
export class AladinCollector extends BaseApiClient {
  protected baseUrl = ALADIN_API_BASE;
  private static instance: AladinCollector;

  constructor() {
    super();
  }

  static getInstance(): AladinCollector {
    if (!this.instance) {
      this.instance = new AladinCollector();
    }
    return this.instance;
  }

  private async aladinRequest<T>(endpoint: string, params: Record<string, string | number>): Promise<T | null> {
    try {
      return await this.request<T>(endpoint, {
        params: {
          ttbkey: ALADIN_API_KEY || '',
          Output: 'JS',
          Version: '20131101',
          ...params
        }
      });
    } catch (error) {
      console.error(`[AladinCollector] Failed to fetch ${endpoint}:`, error);
      return null;
    }
  }

  /**
   * Search for a book or collection to validate existence
   */
  async search(query: string, maxResults = 5, categoryId?: number): Promise<BookSpec[]> {
    const params: Record<string, string | number> = {
      Query: query,
      QueryType: 'Keyword',
      MaxResults: maxResults,
      SearchTarget: 'Book',
      OptResult: 'description,files',
      Cover: 'Big'
    };

    if (categoryId) {
      params['CategoryId'] = categoryId;
    }

    const response = await this.aladinRequest<AladinResponse>('ItemSearch.aspx', params);
    return (response?.item || []).map(this.mapItem);
  }

  /**
   * Static wrapper for backward compatibility
   */
  static async search(query: string, maxResults = 5, categoryId?: number): Promise<BookSpec[]> {
    return this.getInstance().search(query, maxResults, categoryId);
  }

  /**
   * Get detailed info by ISBN
   */
  async getByIsbn(isbn: string): Promise<BookSpec | null> {
    const response = await this.aladinRequest<AladinResponse>('ItemLookUp.aspx', {
      ItemId: isbn,
      ItemIdType: 'ISBN13',
      Cover: 'Big'
    });

    const item = response?.item?.[0];
    return item ? this.mapItem(item) : null;
  }

  static async getByIsbn(isbn: string): Promise<BookSpec | null> {
    return this.getInstance().getByIsbn(isbn);
  }

  /**
   * Get New Arrivals (Special Selection for Kids)
   */
  async getNewArrivals(maxResults = 10, categoryId = 1108): Promise<BookSpec[]> {
    const response = await this.aladinRequest<AladinResponse>('ItemList.aspx', {
      QueryType: 'ItemNewSpecial',
      MaxResults: maxResults,
      CategoryId: categoryId,
      SearchTarget: 'Book',
      Cover: 'Big'
    });

    return (response?.item || []).map(this.mapItem);
  }

  static async getNewArrivals(maxResults = 10, categoryId = 1108): Promise<BookSpec[]> {
    return this.getInstance().getNewArrivals(maxResults, categoryId);
  }

  /**
   * Get Bestseller List
   */
  async getBestseller(params: {
    categoryId?: number;
    maxResults?: number;
  }): Promise<BookSpec[]> {
    const response = await this.aladinRequest<AladinResponse>('ItemList.aspx', {
      QueryType: 'Bestseller',
      MaxResults: params.maxResults || 20,
      CategoryId: params.categoryId || 1108,
      SearchTarget: 'Book',
      Cover: 'Big'
    });

    return (response?.item || []).map(this.mapItem);
  }

  static async getBestseller(params: {
    categoryId?: number;
    maxResults?: number;
  }): Promise<BookSpec[]> {
    return this.getInstance().getBestseller(params);
  }

  /**
   * Get Used Price (Min) for a book
   */
  async getUsedPrice(isbn: string): Promise<number | null> {
    const response = await this.aladinRequest<AladinResponse>('ItemLookUp.aspx', {
      ItemId: isbn,
      ItemIdType: 'ISBN13',
      OptResult: 'usedList',
      Cover: 'Big'
    });

    const item = response?.item?.[0];
    if (item && item.subInfo && item.subInfo.usedList && item.subInfo.usedList.aladinUsed) {
        return item.subInfo.usedList.aladinUsed.minPrice || null;
    }
    return null;
  }

  static async getUsedPrice(isbn: string): Promise<number | null> {
    return this.getInstance().getUsedPrice(isbn);
  }

  private mapItem(item: any): BookSpec {
    return {
      isbn13: item.isbn13 || item.isbn,
      title: item.title,
      author: item.author,
      publisher: item.publisher,
      pubDate: item.pubDate,
      cover: item.cover,
      categoryName: item.categoryName,
      description: item.description || '',
      priceStandard: item.priceStandard,
      link: item.link,
      salesPoint: item.salesPoint || 0,
      customerReviewRank: item.customerReviewRank || 0
    };
  }
}
