/**
 * Aladin API Client
 * For bestseller lists and used book prices
 * 
 * API Docs: https://docs.aladin.co.kr/
 */

const ALADIN_API_BASE = 'https://www.aladin.co.kr/ttb/api';

// Children's book category IDs
export const ALADIN_CHILD_CATEGORIES = {
  ALL: 1108, // 유아
  PICTURE_BOOK: 2551, // 그림책
  FAIRY_TALE: 2553, // 동화
  LEARNING: 2555, // 학습
  CREATIVE: 2557, // 창작
} as const;

export interface AladinBook {
  isbn13: string;
  title: string;
  author: string;
  publisher: string;
  pubDate: string;
  cover: string;
  categoryName: string;
  priceStandard: number;
  priceSales: number;
  link: string;
  bestRank?: number;
}

export interface AladinApiResponse {
  version: string;
  totalResults: number;
  startIndex: number;
  itemsPerPage: number;
  item: AladinBook[];
}

class AladinApiClient {
  private baseUrl: string;

  constructor() {
    // Use Route Handler proxy instead of direct API call
    this.baseUrl = typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  }

  private async fetch<T>(endpoint: string, params: Record<string, any> = {}): Promise<T | null> {
    const url = new URL(`/api/aladin/${endpoint}`, this.baseUrl);

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });

    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Aladin API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('[AladinApi] Fetch error:', error);
      return null;
    }
  }

  /**
   * Get bestseller list
   * QueryType: Bestseller, ItemNewAll, ItemNewSpecial, BlogBest
   */
  async getBestseller(params: {
    categoryId?: number;
    maxResults?: number;
    start?: number;
  } = {}): Promise<AladinBook[]> {
    const response = await this.fetch<AladinApiResponse>('ItemList.aspx', {
      QueryType: 'Bestseller',
      SearchTarget: 'Book',
      CategoryId: params.categoryId || ALADIN_CHILD_CATEGORIES.ALL,
      MaxResults: params.maxResults || 20,
      Start: params.start || 1,
      Cover: 'Big',
    });

    return response?.item || [];
  }

  /**
   * Get new arrivals
   */
  async getNewArrivals(params: {
    categoryId?: number;
    maxResults?: number;
  } = {}): Promise<AladinBook[]> {
    const response = await this.fetch<AladinApiResponse>('ItemList.aspx', {
      QueryType: 'ItemNewAll',
      SearchTarget: 'Book',
      CategoryId: params.categoryId || ALADIN_CHILD_CATEGORIES.ALL,
      MaxResults: params.maxResults || 20,
      Cover: 'Big',
    });

    return response?.item || [];
  }

  /**
   * Search books
   */
  async searchBooks(query: string, maxResults = 20): Promise<AladinBook[]> {
    const response = await this.fetch<AladinApiResponse>('ItemSearch.aspx', {
      Query: query,
      QueryType: 'Keyword',
      SearchTarget: 'Book',
      MaxResults: maxResults,
      Cover: 'Big',
    });

    return response?.item || [];
  }

  /**
   * Get book detail by ISBN
   */
  async getBookByIsbn(isbn: string): Promise<AladinBook | null> {
    const response = await this.fetch<AladinApiResponse>('ItemLookUp.aspx', {
      ItemId: isbn,
      ItemIdType: 'ISBN13',
      Cover: 'Big',
    });

    return response?.item?.[0] || null;
  }
}

export const aladinApiClient = new AladinApiClient();
