import { Book } from '@/entities/book/model/types';

interface FilterResult {
  passed: boolean;
  reason?: string;
  isSafeGuess?: boolean;
}

export class LibraryFilterService {
  // 0-2세 (영아기): 그림 위주, 사운드북, 보드북
  private static BABY_KEYWORDS = {
    positive: [
      '보드북', '사운드북', '헝겊책', '토이북', '목욕책', '팝업북', '플랩북',
      '아기', '까꿍', '잠잘 때', '목욕', '동물', '과일', '자동차', '탈것',
      '돌잡이', '베베', '핀덴', '프뢰벨'
    ],
    negative: [
      '만화', '코믹', '학습만화', '흔한남매', '쿠키런', '마법천자문', 
      '설민석', '좀비', '귀신', '공포', '연애', '게임', '마인크래프트',
      '초등', '학교', '교과서', '문제집', '한자', '역사', '과학', // 너무 어려운 주제 제외
      '글밥', '소설', '문고', '지식', '원리', '삼국지' // 글자 많은 책 제외
    ],
    publishers: [
      '블루래빗', '애플비', '어스본', '두두스토리'
      // Removed: '비룡소', '보림', '웅진', '그레이트북스' etc. -> These must now pass keyword check (e.g., have "보드북" in title)
    ]
  };

  // 3-4세 (유아기): 생활습관, 창작동화 / *학습(수학,과학) 제외*
  private static TODDLER_KEYWORDS = {
    positive: [
      '그림책', '생활동화', '창작동화', '친구', '어린이집', '유치원',
      '배변', '양치', '식습관', '감정', '마음', '약속', '엄마', '아빠'
    ],
    negative: [
      '만화', '코믹', '학습만화', '흔한남매', '쿠키런', '마법천자문', 
      '설민석', '좀비', '귀신', '공포', '연애', '게임', 
      '초등', '교과서', '문제집', '한자', '역사', '과학', '수학', '원리' // 3-4세에겐 너무 이름
    ],
    publishers: [
      '비룡소', '보림', '한림출판사', '사계절', '창비', '웅진주니어',
      '시공주니어', '김영사', '길벗어린이'
    ]
  };

  // 5-6세 (유치기): 지식탐구, 전래동화 / *그림책 같은 모호한 단어 제거*
  private static PRESCHOOL_KEYWORDS = {
    positive: [
      '전래동화', '명작동화', '과학동화', '수학동화', '한글', '공룡',
      '우주', '곤충', '식물', '원리', '지식', '탐구', '사회', '문화'
    ],
    negative: [
      '19세', '성인', '로맨스', '스릴러', '살인', '범죄', 
      '청소년', '중학', '고등', '사춘기', '보드북', '사운드북', '평론'
    ],
    publishers: [] 
  };

  // 7-8세 (초등저학년): 학교생활, 읽기독립 / *동화 같은 모호한 단어 제거*
  private static SCHOOL_KEYWORDS = {
    positive: [
      '문고', '학교', '1학년', '2학년', '교과서', '받아쓰기', '일기', '저학년', '사회', '역사', '인물'
    ],
    negative: [
      '19세', '성인', '로맨스', '스릴러', '살인', '범죄', '연애',
      '고학년', '3학년', '4학년', '5학년', '6학년', '청소년', '중학', '고등',
      '사춘기', '1318', '소설', '에세이', '웹툰', '만화'
    ],
    publishers: []
  };

  static filterByAge(book: any, ageGroup: number): FilterResult {
    const title = book.bookname || book.title || '';
    const publisher = book.publisher || '';
    const description = book.description || '';
    
    // Combine text for searching
    const fullText = `${title} ${description}`.toLowerCase();

    // 0. Default: Pass (unless filtered)
    let result: FilterResult = { passed: true, isSafeGuess: false };

    // 1. Get Rules
    let rules;
    if (ageGroup === 0) rules = this.BABY_KEYWORDS; // 0-2
    else if (ageGroup === 3) rules = this.TODDLER_KEYWORDS; // 3-4
    else if (ageGroup === 5) rules = this.PRESCHOOL_KEYWORDS; // 5-6
    else rules = this.SCHOOL_KEYWORDS; // 7-8

    // 2. Negative Filter (Critical)
    for (const bad of rules.negative) {
      if (fullText.includes(bad)) {
        return { passed: false, reason: `Negative keyword: ${bad}` };
      }
    }

    // 3. Positive Filter (Strict for ALL ages now)
    // We want to force differentiation. Non-keyword matches are dropped.
    const hitsPositive = rules.positive.some(good => fullText.includes(good));
    const hitsPublisher = rules.publishers.some(pub => publisher.includes(pub));

    if (hitsPositive || hitsPublisher) {
      result.isSafeGuess = true;
    } else {
      // If it doesn't match our strict theme, drop it.
      // e.g. Random picture book in 5-6 will be dropped if it's not Science/Tale.
      // This is necessary to stop "Identical Lists" issue.
      return { passed: false, reason: 'Strict Mode: No positive keyword match' };
    }

    return result;
  }
}
