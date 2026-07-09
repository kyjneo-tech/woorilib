import { Book } from "../model/types";

export interface AladinBook {
  title: string;
  link: string;
  author: string;
  pubDate: string;
  description: string;
  isbn: string;
  isbn13: string;
  itemId: number;
  priceSales: number;
  priceStandard: number;
  mallType: string;
  stockStatus: string;
  mileage: number;
  cover: string;
  categoryId: number;
  categoryName: string;
  publisher: string;
  salesPoint: number;
  adult: boolean;
  fixedPrice: boolean;
  customerReviewRank: number;
}

interface AladinResponse {
  version: string;
  title: string;
  link: string;
  pubDate: string;
  totalResults: number;
  startIndex: number;
  itemsPerPage: number;
  query: string;
  searchCategoryId: number;
  searchCategoryName: string;
  item: AladinBook[];
}

export const ALADIN_CHILD_CATEGORIES = {
  PICTURE_BOOK: 13789,
  FAIRY_TALE: 1108,
  CREATIVE: 1108, // Using General Children as fallback
};

export class AladinApiClient {
  private baseUrl = 'https://www.aladin.co.kr/ttb/api/ItemSearch.aspx';
  private listUrl = 'https://www.aladin.co.kr/ttb/api/ItemList.aspx';
  private ttbKey = process.env.ALADIN_TTB_KEY;

  constructor() {
    if (!this.ttbKey) {
      console.warn('ALADIN_TTB_KEY is not set');
    }
  }

  private async fetchAladin(endpoint: string, params: Record<string, string>): Promise<AladinBook[]> {
    const isServer = typeof window === 'undefined';

    // Server-side: Direct Call (With Resilience Retry & Backoff)
    if (isServer) {
      if (!this.ttbKey) return [];
      
      const maxRetries = 3;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const searchParams = new URLSearchParams({
            ttbkey: this.ttbKey,
            Output: 'js',
            Version: '20131101',
            ...params
          });
          const response = await fetch(`${endpoint}?${searchParams.toString()}`);
          if (!response.ok) throw new Error(`Aladin API Error: ${response.statusText}`);
          const data: AladinResponse = await response.json();
          return data.item || [];
        } catch (error) {
          console.warn(`[AladinApiClient] Fetch attempt ${attempt} failed:`, error);
          if (attempt === maxRetries) {
            console.error('Aladin API Fetch Error (Max Retries Reached):', error);
            return [];
          }
          // Exponential backoff delay (1s, 2s)
          const delay = Math.pow(2, attempt - 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      return [];
    }

    // Client-side: Use Proxy
    else {
      try {
        // Extract endpoint name (e.g., "ItemSearch.aspx")
        const apiName = endpoint.split('/').pop() || 'ItemSearch.aspx';
        const searchParams = new URLSearchParams(params);

        const response = await fetch(`/api/aladin/${apiName}?${searchParams.toString()}`);
        if (!response.ok) throw new Error(`Aladin Proxy Error: ${response.statusText}`);

        const data: AladinResponse = await response.json();
        return data.item || [];
      } catch (error) {
        console.error('Aladin Proxy Fetch Error:', error);
        return [];
      }
    }
  }

  async searchBooks(query: string, maxResults = 50): Promise<Book[]> {
    const items = await this.fetchAladin(this.baseUrl, {
      Query: query,
      QueryType: 'Keyword',
      MaxResults: maxResults.toString(),
      SearchTarget: 'Book',
    });

    return items.map(item => ({
      isbn: item.isbn13 || item.isbn,
      title: item.title,
      author: item.author,
      publisher: item.publisher,
      publishYear: item.pubDate,
      bookImageURL: item.cover,
      description: item.description,
      ranking: item.customerReviewRank
    }));
  }

  async getBestseller(params: { categoryId: number; maxResults: number }): Promise<AladinBook[]> {
    return this.fetchAladin(this.listUrl, {
      QueryType: 'Bestseller',
      MaxResults: params.maxResults.toString(),
      CategoryId: params.categoryId.toString(),
      SearchTarget: 'Book',
    });
  }

  async lookupBook(isbn: string): Promise<AladinBook | null> {
    const items = await this.fetchAladin('https://www.aladin.co.kr/ttb/api/ItemLookUp.aspx', {
      ItemIdType: 'ISBN13',
      ItemId: isbn,
      OptResult: 'packing,ratingInfo,authors,reviewList,fileFormatList,mallType',
    });

    return items.length > 0 ? items[0] : null;
  }
}

export const aladinApiClient = new AladinApiClient();
