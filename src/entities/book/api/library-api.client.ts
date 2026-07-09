/**
 * Library API Client
 * Migrated from library-finder with improvements for FSD structure
 */

export interface Library {
  libCode: string;
  libName: string;
  address: string;
  tel: string;
  homepage: string;
  latitude: string;
  longitude: string;
  closed: string;
  operatingTime: string;
}

export interface LibraryApiResponse<T> {
  response: {
    request: any;
    numFound?: number;
    resultNum?: number;
    docs?: { doc: T }[];
    libs?: { lib: Library }[];
    error?: string;
  };
}

export interface LibraryBook {
  bookname: string;
  authors: string;
  publisher: string;
  bookImageURL: string;
  isbn13: string;
  addition_code?: string;
  vol?: string;
  publication_year?: string;
  class_no?: string;
  loan_count?: string;
}

export class LibraryApiClient {
  private baseUrl: string;
  private cache = new Map<string, { data: unknown; timestamp: number }>();
  private pendingRequests = new Map<string, Promise<any>>();
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.baseUrl = typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  }

  private async fetch<T>(endpoint: string, params: Record<string, string | number | undefined | null> = {}): Promise<T> {
    const isServer = typeof window === 'undefined';
    const serverKey = process.env.LIBRARY_API_KEY;

    // Build URL based on environment
    let url: URL;

    if (isServer && serverKey) {
      // Server-side: Call external API directly
      // This avoids "self-request" loop and port mismatch issues on localhost
      url = new URL(`${process.env.NEXT_PUBLIC_LIBRARY_API_BASE || 'http://data4library.kr/api'}/${endpoint}`);
      url.searchParams.set('authKey', serverKey);
      url.searchParams.set('format', 'json');
    } else {
      // Client-side: Call internal Next.js Proxy
      url = new URL(`/api/library/${endpoint}`, this.baseUrl);
    }

    const sortedParams = Object.entries(params)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    const cacheKey = `${endpoint}?${sortedParams}`;

    // Check pending requests (Deduplication)
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey) as Promise<T>;
    }

    // Check cache
    const cached = this.cache.get(cacheKey);
    const LONG_LIVED_ENDPOINTS = ['hotTrend', 'monthlyKeywords']; // Removed 'loanItemSrch' for real-time curation updates
    const currentTTL = LONG_LIVED_ENDPOINTS.some(ep => endpoint.includes(ep))
      ? 60 * 60 * 1000
      : 0; // Disable cache for regular searches to ensure filter Logic updates apply immediately

    if (cached && Date.now() - cached.timestamp < currentTTL) {
      return cached.data as T;
    }

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });

    const requestPromise = (async () => {
      try {
        let attempts = 0;
        const MAX_RETRIES = 3;
        const BASE_DELAY = 1000;

        while (attempts < MAX_RETRIES) {
          try {
            const response = await fetch(url.toString());

            if (response.status === 429) {
              console.warn(`[LibraryApiClient] 429 Rate Limited. Retry ${attempts + 1}/${MAX_RETRIES}`);
              await new Promise(r => setTimeout(r, BASE_DELAY * Math.pow(2, attempts)));
              attempts++;
              continue;
            }

            if (!response.ok) {
              if (response.status >= 500 && attempts < MAX_RETRIES) {
                await new Promise(r => setTimeout(r, BASE_DELAY * Math.pow(2, attempts)));
                attempts++;
                continue;
              }
              const errorText = await response.text().catch(() => 'No error text');
              throw new Error(`API Error [${response.status}]: ${response.statusText} - ${url.toString()} - ${errorText}`);
            }

            const data = await response.json();
            this.cache.set(cacheKey, { data, timestamp: Date.now() });
            return data;
          } catch (error) {
            console.error(`[LibraryApiClient] Attempt ${attempts + 1} failed:`, error);
            const err = error as Error;
            if (attempts < MAX_RETRIES && (err.name === 'TypeError' || err.message.includes('fetch'))) {
              await new Promise(r => setTimeout(r, BASE_DELAY * Math.pow(2, attempts)));
              attempts++;
              continue;
            }
            throw error;
          }
        }
        throw new Error(`API Error: Max retries exceeded for ${endpoint}`);
      } finally {
        this.pendingRequests.delete(cacheKey);
      }
    })();

    this.pendingRequests.set(cacheKey, requestPromise);
    return requestPromise;
  }

  // Book Search
  async searchBooks(params: {
    keyword: string;
    pageNo?: number;
    pageSize?: number;
    sort?: string;
    region?: string;
  }): Promise<LibraryApiResponse<LibraryBook>> {
    return this.fetch<LibraryApiResponse<LibraryBook>>('srchBooks', {
      keyword: params.keyword,
      pageNo: params.pageNo || 1,
      pageSize: params.pageSize || 20,
      sort: params.sort,
      region: params.region,
    });
  }

  // Book Detail
  async getBookDetail(isbn13: string): Promise<LibraryApiResponse<LibraryBook>> {
    return this.fetch<LibraryApiResponse<LibraryBook>>('srchDtlList', { isbn13, loaninfoYN: 'Y' });
  }

  // Libraries that have a book
  async searchLibrariesByBook(params: {
    isbn: string;
    region?: string;
    dtl_region?: string;
    pageSize?: number;
  }): Promise<{ libraries: Library[]; totalCount: number }> {
    const response = await this.fetch<LibraryApiResponse<any>>('libSrchByBook', params);

    const libs = response.response?.libs?.map((item) => ({
      libCode: item.lib.libCode,
      libName: item.lib.libName,
      address: item.lib.address,
      tel: item.lib.tel,
      homepage: item.lib.homepage,
      latitude: item.lib.latitude,
      longitude: item.lib.longitude,
      closed: item.lib.closed,
      operatingTime: item.lib.operatingTime,
    })) || [];

    return {
      libraries: libs,
      totalCount: Number(response.response?.numFound || 0),
    };
  }

  // Popular books by age/region
  async getPopularBooks(params: {
    age?: string;
    from_age?: number;
    to_age?: number;
    region?: string;
    dtl_region?: string;
    pageSize?: number;
    startDt?: string;
    endDt?: string;
  }): Promise<LibraryApiResponse<LibraryBook>> {
    // loanItemSrch requires startDt and endDt
    // Default to last 30 days if not provided
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const formatDate = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    return this.fetch<LibraryApiResponse<LibraryBook>>('loanItemSrch', {
      ...params,
      startDt: params.startDt || formatDate(thirtyDaysAgo),
      endDt: params.endDt || formatDate(today),
      pageSize: params.pageSize || 30,
    });
  }


  // Check book availability at a library
  async checkBookExistence(isbn13: string, libCode: string): Promise<LibraryApiResponse<any>> {
    return this.fetch<LibraryApiResponse<any>>('bookExist', { isbn13, libCode });
  }

  // Hot trending books
  async getHotTrend(searchDt: string): Promise<LibraryApiResponse<LibraryBook>> {
    return this.fetch<LibraryApiResponse<LibraryBook>>('hotTrend', { searchDt });
  }

  // Recommended books
  async getRecommendList(isbn13: string): Promise<LibraryApiResponse<LibraryBook>> {
    return this.fetch<LibraryApiResponse<LibraryBook>>('recommandList', { isbn13, type: 'reader' });
  }
}

export const libraryApiClient = new LibraryApiClient();
