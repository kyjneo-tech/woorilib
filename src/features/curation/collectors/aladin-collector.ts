
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables for local script execution
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
}

// Aladin API Configuration
const ALADIN_API_KEY = process.env.ALADIN_TTB_KEY;
const ALADIN_API_BASE = 'https://www.aladin.co.kr/ttb/api';

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

/**
 * Server-side Aladin Collector for Curation Engine
 * - Directly calls Aladin TTB API
 * - Used for Seed Scripts & Backend Workers
 */
export class AladinCollector {
  private static async fetch<T>(endpoint: string, params: Record<string, string | number>): Promise<T | null> {
    const url = new URL(`${ALADIN_API_BASE}/${endpoint}`);
    url.searchParams.set('ttbkey', ALADIN_API_KEY || '');
    url.searchParams.set('Output', 'JS'); // JSON format
    url.searchParams.set('Version', '20131101');

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });

    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Aladin API Error: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`[AladinCollector] Failed to fetch ${endpoint}:`, error);
      return null;
    }
  }

  /**
   * Search for a book or collection to validate existence
   */
  static async search(query: string, maxResults = 5, categoryId?: number): Promise<BookSpec[]> {
    const params: Record<string, string | number> = {
      Query: query,
      QueryType: 'Keyword',
      MaxResults: maxResults,
      SearchTarget: 'Book',
      OptResult: 'description,files', // Request advanced metadata
      Cover: 'Big'
    };

    if (categoryId) {
      params['CategoryId'] = categoryId;
    }

    const response = await this.fetch<{ item: any[] }>('ItemSearch.aspx', params);

    return (response?.item || []).map(this.mapItem);
  }

  /**
   * Get detailed info by ISBN
   */
  static async getByIsbn(isbn: string): Promise<BookSpec | null> {
    const response = await this.fetch<{ item: any[] }>('ItemLookUp.aspx', {
      ItemId: isbn,
      ItemIdType: 'ISBN13',
      Cover: 'Big'
    });

    const item = response?.item?.[0];
    return item ? this.mapItem(item) : null;
  }

  /**
   * Get New Arrivals (Special Selection for Kids)
   */
  static async getNewArrivals(maxResults = 10, categoryId = 1108): Promise<BookSpec[]> {
    // 1108 = Children (Infant)
    const response = await this.fetch<{ item: any[] }>('ItemList.aspx', {
      QueryType: 'ItemNewSpecial',
      MaxResults: maxResults,
      CategoryId: categoryId,
      SearchTarget: 'Book',
      Cover: 'Big'
    });

    return (response?.item || []).map(this.mapItem);
  }

  /**
   * Get Bestseller List
   */
  static async getBestseller(params: {
    categoryId?: number;
    maxResults?: number;
  }): Promise<BookSpec[]> {
    const response = await this.fetch<{ item: any[] }>('ItemList.aspx', {
      QueryType: 'Bestseller',
      MaxResults: params.maxResults || 20,
      CategoryId: params.categoryId || 1108,
      SearchTarget: 'Book',
      Cover: 'Big'
    });

    return (response?.item || []).map(this.mapItem);
  }

  /**
   * Get Used Price (Min) for a book
   */
  static async getUsedPrice(isbn: string): Promise<number | null> {
    // Aladin Used Store Search
    const response = await this.fetch<{ item: any[] }>('ItemLookUp.aspx', {
      ItemId: isbn,
      ItemIdType: 'ISBN13',
      OptResult: 'usedList', // Request used book list info
      Cover: 'Big'
    });

    const item = response?.item?.[0];
    if (item && item.subInfo && item.subInfo.usedList && item.subInfo.usedList.aladinUsed) {
        return item.subInfo.usedList.aladinUsed.minPrice || null;
    }
    return null;
  }

  private static mapItem(item: any): BookSpec {
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
