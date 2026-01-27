
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables for local script execution
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
}

// Naver API Configuration
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;
const NAVER_API_BASE = 'https://openapi.naver.com/v1/search/book.json';

export interface NaverBook {
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

export class NaverCollector {
  /**
   * Search for books using Naver API
   */
  static async search(query: string, maxResults = 5): Promise<NaverBook[]> {
    if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
      console.warn('⚠️ Naver API Keys are missing.');
      return [];
    }

    const url = `${NAVER_API_BASE}?query=${encodeURIComponent(query)}&display=${maxResults}&sort=sim`;
    let attempts = 0;
    const MAX_RETRIES = 3;

    while (attempts < MAX_RETRIES) {
      try {
        const response = await fetch(url, {
          headers: {
            'X-Naver-Client-Id': NAVER_CLIENT_ID,
            'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
          }
        });

        if (response.status === 429) {
          const delay = Math.pow(2, attempts) * 1000 + Math.random() * 500;
          console.warn(`[NaverCollector] 429 Rate Limited. Retrying in ${Math.round(delay)}ms...`);
          await new Promise(r => setTimeout(r, delay));
          attempts++;
          continue;
        }

        if (!response.ok) {
          throw new Error(`Naver API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.items || [];

      } catch (error) {
        if (attempts < MAX_RETRIES - 1) {
            attempts++;
            await new Promise(r => setTimeout(r, 1000));
            continue;
        }
        console.error('[NaverCollector] Search failed:', error);
        return [];
      }
    }
    return [];
  }

  /**
   * Get Blog Review Count (Buzz Metric)
   */
  static async getBlogReviewCount(query: string): Promise<number> {
    if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) return 0;

    try {
      const url = `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(query)}&display=1&sort=sim`;
      const response = await fetch(url, {
        headers: {
            'X-Naver-Client-Id': NAVER_CLIENT_ID,
            'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
        }
      });
      
      if (!response.ok) return 0;
      const data = await response.json();
      return data.total || 0;
    } catch (e) {
      console.error('[NaverCollector] Blog search failed:', e);
      return 0;
    }
  }

  /**
   * Helper to convert Naver format to the generic structure expected by the API route
   */
  static normalize(item: NaverBook) {
    return {
        title: item.title.replace(/<[^>]*>?/gm, ''), // Remove HTML tags
        author: item.author.replace(/<[^>]*>?/gm, ''),
        publisher: item.publisher.replace(/<[^>]*>?/gm, ''),
        pubDate: item.pubdate,
        cover: item.image,
        isbn13: item.isbn.split(' ')[1] || item.isbn, // Naver returns "isbn10 isbn13" usually
        priceStandard: parseInt(item.discount || '0', 10),
        link: item.link
    };
  }
}
