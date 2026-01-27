import { createBrowserClient } from '@/shared/lib/supabase/client';
import { libraryApiClient } from '@/entities/book/api/library-api.client';
import { aladinApiClient } from '@/entities/book/api/aladin-api.client';

export interface PopularBook {
  isbn: string;
  title: string;
  author: string;
  cover?: string;
  publisher?: string;
  readCount?: number; // 또래 읽은 수 (우리 서비스 데이터)
  rank?: number; // 베스트셀러 순위
  source: 'peer' | 'library' | 'aladin';
  badges?: string[]; // 뱃지 (예: '🔥 또래 3명 읽음')
}

/**
 * 인기 도서 서비스
 * - 또래 인기 도서 (우리 서비스 데이터 기반)
 * - 알라딘 베스트셀러
 * - 도서관 인기대출 도서
 */
class PopularBooksService {
  private getSupabase() {
    return createBrowserClient();
  }

  /**
   * 하이브리드 인기 도서 조회 (베스트셀러 + 또래 픽)
   * 알라딘 베스트셀러를 기본으로 하고, 우리 서비스 데이터가 있으면 뱃지를 붙임
   */
  async getHybridBestsellers(age: number, limit = 20): Promise<PopularBook[]> {
    try {
      // 1. 알라딘 베스트셀러 조회 (화면에 보여줄 기본 데이터)
      const bestsellers = await this.getAladinBestsellers(getAladinCategoryByAge(age), limit);

      // 2. 또래 인기 도서 조회 (매칭용, 충분히 많이 조회)
      // 상위 50개 정도 가져와서 베스트셀러 목록에 있는지 확인
      const peerBooks = await this.getPeerPopularBooks(age, 50);

      // 3. 데이터 병합 (베스트셀러에 또래 데이터 주입)
      return bestsellers.map(book => {
        // ISBN으로 매칭 (ISBN13 우선 사용)
        const match = peerBooks.find(pb => pb.isbn === book.isbn);
        
        if (match && match.readCount && match.readCount > 0) {
          const badges = [`🔥 또래 ${match.readCount}명 읽음`];
          
          return {
            ...book,
            readCount: match.readCount,
            badges,
            // source는 'aladin'을 유지하되, UI에서 뱃지로 표시
          };
        }
        
        return book;
      });
    } catch (error) {
      console.error('Failed to get hybrid bestsellers:', error);
      return [];
    }
  }

  /**
   * 또래 인기 도서 조회 (우리 서비스 데이터 기반)
   * @param age - 자녀 나이
   * @param limit - 조회 개수
   */
  async getPeerPopularBooks(age: number, limit = 10): Promise<PopularBook[]> {
    const supabase = this.getSupabase();

    // 또래 범위: age ± 1세
    const minAge = Math.max(0, age - 1);
    const maxAge = age + 1;

    // 독서 기록에서 또래 아이들이 많이 읽은 책 집계
    const { data, error } = await supabase.rpc('get_peer_popular_books', {
      min_age: minAge,
      max_age: maxAge,
      result_limit: limit,
    });

    if (error) {
      console.error('Failed to get peer popular books:', error);
      // RPC 함수가 없으면 빈 배열 반환 (나중에 설정)
      return [];
    }

    return (data || []).map((item: any) => ({
      isbn: item.isbn,
      title: item.book_title,
      author: item.book_author || '',
      cover: item.book_cover,
      readCount: item.read_count,
      source: 'peer' as const,
    }));
  }

  /**
   * 도서관나루 인기대출 도서
   * @param age - 자녀 나이 (연령대별 분류 코드 결정)
   */
  async getLibraryPopularBooks(age: number, limit = 10): Promise<PopularBook[]> {
    try {
      // 도서관나루 API는 age 파라미터를 지원
      // 0: 영유아, 6: 유아, 8: 초등저, 14: 초등고
      const ageParam = this.getAgeParamByAge(age);

      const response = await libraryApiClient.getPopularBooks({
        age: ageParam,
        pageSize: limit,
      });

      const docs = response?.response?.docs || [];

      return docs.map((item: any, index: number) => ({
        isbn: item.doc?.isbn13 || item.doc?.isbn || '',
        title: item.doc?.bookname || '',
        author: item.doc?.authors || '',
        cover: item.doc?.bookImageURL,
        publisher: item.doc?.publisher,
        rank: index + 1,
        source: 'library' as const,
      }));
    } catch (error) {
      console.error('Failed to get library popular books:', error);
      return [];
    }
  }

  /**
   * 나이에 따른 도서관나루 age 파라미터 반환
   */
  private getAgeParamByAge(age: number): string {
    if (age < 4) return '0'; // 영유아 (0~3세)
    if (age < 8) return '6'; // 유아 (4~7세)
    if (age < 14) return '8'; // 초등 (8~13세)
    return '14'; // 청소년
  }

  /**
   * 알라딘 베스트셀러
   * @param categoryId - 알라딘 카테고리 ID (기본: 유아 1108)
   */
  async getAladinBestsellers(categoryId = 1108, limit = 10): Promise<PopularBook[]> {
    try {
      const items = await aladinApiClient.getBestseller({
        categoryId,
        maxResults: limit,
      });

      return items.map((item: any, index: number) => ({
        isbn: item.isbn13 || item.isbn || '',
        title: item.title || '',
        author: item.author || '',
        cover: item.cover,
        publisher: item.publisher,
        rank: index + 1,
        source: 'aladin' as const,
      }));
    } catch (error) {
      console.error('Failed to get Aladin bestsellers:', error);
      return [];
    }
  }

  /**
   * 알라딘 전집/시리즈 검색 (API 기반)
   * @param keyword - 검색 키워드 (전집, 시리즈 등)
   */
  async getSeriesBooks(keyword: string, limit = 10): Promise<PopularBook[]> {
    try {
      const items = await aladinApiClient.searchBooks(keyword, limit);

      return items.map((item: any) => ({
        isbn: item.isbn13 || item.isbn || '',
        title: item.title || '',
        author: item.author || '',
        cover: item.cover,
        publisher: item.publisher,
        source: 'aladin' as const,
      }));
    } catch (error) {
      console.error('Failed to search series books:', error);
      return [];
    }
  }

  /**
   * 나이에 따른 KDC 분류 코드 반환
   */
  private getKdcCodeByAge(age: number): string {
    // 아동문학: 813.8 (한국 아동문학)
    // 유아: 더 세분화 필요하면 추가
    if (age < 3) return ''; // 영아는 특정 분류 없음
    if (age < 7) return '813'; // 유아/취학전
    return '813'; // 초등
  }
}

export const popularBooksService = new PopularBooksService();

/**
 * 알라딘 카테고리 ID 상수
 */
export const ALADIN_CATEGORIES = {
  INFANT: 1108, // 유아 (0~7세로 확장)
  CHILDREN: 1137, // 어린이 (8세 이상)
  CHILDREN_UPPER: 1138, // 어린이 고학년 (9~12세)
  PICTURE_BOOK: 1167, // 그림책
  FAIRY_TALE: 1168, // 동화
  SCIENCE_KIDS: 1196, // 어린이 과학
} as const;

/**
 * 나이에 따른 알라딘 카테고리 반환
 */
export function getAladinCategoryByAge(age: number): number {
  if (age < 8) return ALADIN_CATEGORIES.INFANT; // 7세까지 유아 (알라딘 기준 1108이 0~7세 포함)
  if (age < 13) return ALADIN_CATEGORIES.CHILDREN; // 초등
  return ALADIN_CATEGORIES.CHILDREN_UPPER;
}
