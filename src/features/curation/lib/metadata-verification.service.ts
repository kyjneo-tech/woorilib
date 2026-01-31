import { aladinApiClient, AladinBook } from "@/entities/book/api/aladin-api.client";

export interface VerificationResult {
  isSafe: boolean;
  reason?: string;
  ageGrade?: 'BABY' | 'TODDLER' | 'PRESCHOOL' | 'SCHOOL' | 'TEEN' | 'ADULT';
  categoryPath?: string;
}

export class MetadataVerificationService {
  private static BLACKLIST_KEYWORDS = [
    '청소년', '성인', '19세', '로맨스', '스릴러', '호러', '폭력', 'BL', 'GL', '정치', '사회과학'
  ];

  /*
   * 어린이가 읽기에 적합한지 검증합니다.
   * "Blacklist" 방식을 사용하여 명확히 부적절한 것만 걸러내고 나머지는 허용합니다.
   */
  static async verify(isbn: string): Promise<VerificationResult> {
    try {
      const aladinBook = await aladinApiClient.lookupBook(isbn);
      
      if (!aladinBook) {
        // [Open Policy] 데이터가 없어도 우선 노출 (사용자 피드백 반영)
        // 블랙리스트에 걸리지 않은 미확인 도서는 허용
        return { 
          isSafe: true, 
          reason: '메타데이터 없음 (Open Policy)',
          ageGrade: 'SCHOOL' // 기본값
        }; 
      }

      return this.checkSafety(aladinBook);

    } catch (error) {
      console.error('[MetadataVerification] Error:', error);
      return { isSafe: false, reason: '검증 중 에러 발생' };
    }
  }

  private static checkSafety(book: AladinBook): VerificationResult {
    // 1. 성인물 체크
    if (book.adult) {
      return { isSafe: false, reason: '성인물 (Aladin flag)', ageGrade: 'ADULT' };
    }

    const category = book.categoryName || '';
    
    // 2. 카테고리 블랙리스트 체크
    for (const keyword of this.BLACKLIST_KEYWORDS) {
      if (category.includes(keyword)) {
         // 예외: '청소년'이 포함되어도 '청소년 문학' vs '청소년 유해' 구분 필요.
         // 하지만 0~8세 대상이라면 '청소년' 키워드 자체가 부적절할 확률 높음 (난이도 등).
         return { 
           isSafe: false, 
           reason: `부적절한 카테고리: ${keyword}`, 
           categoryPath: category,
           ageGrade: 'TEEN' // or ADULT
         };
      }
    }

    // 3. 긍정적 카테고리 확인 (등급 산정)
    let ageGrade: VerificationResult['ageGrade'] = 'SCHOOL'; // 기본값 (ADULT -> SCHOOL 완화)

    if (category.includes('유아')) {
        // 유아 내에서도 세분화 가능하면 좋겠지만, 일단 Safe로 간주
        ageGrade = 'TODDLER'; 
    } else if (category.includes('어린이') || category.includes('초등')) {
        ageGrade = 'SCHOOL';
    }
    
    // 4. 국내도서 필터 (한국어 책 우선)
    // 0-8세 큐레이션에서는 '영어 원서'가 섞이면 소음으로 인식될 수 있음 (사용자 피드백 반영)
    if (!category.startsWith('국내도서')) {
         return { 
           isSafe: false, 
           reason: '외국도서 제외 (국내도서만 허용)', 
           categoryPath: category 
         };
    }

    // 5. 최종 안전 판별
    // [Open Policy] 블랙리스트만 통과하면 모두 허용 (Whitelist 제거)
    return { isSafe: true, categoryPath: category, ageGrade };

    return { isSafe: true, categoryPath: category, ageGrade };
  }
}
