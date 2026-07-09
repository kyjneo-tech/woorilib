/**
 * 사용자 입력 자연어에서 연령, 성별, 기질, 주제 키워드를 분석하여 캐싱용 해시 키를 도출하는 모듈
 */

export interface ExtractedKeywords {
  ageGroup: string; // '0', '1', '2', '3', '4', '5', '6', '7' or 'all'
  gender: 'boy' | 'girl' | 'all';
  propensity: string | null;
  topics: string[];
}

// 1. 개월수 및 나이 정규화 사전
const AGE_PATTERNS = [
  { regex: /(\d+)\s*개월/, handler: (m: number) => {
    if (m <= 12) return '1';
    if (m <= 24) return '2';
    if (m <= 36) return '3';
    if (m <= 48) return '4';
    if (m <= 60) return '5';
    return '6';
  }},
  { regex: /(\d+)\s*살/, handler: (n: number) => Math.min(n, 7).toString() },
  { regex: /(\d+)\s*세/, handler: (n: number) => Math.min(n, 7).toString() },
  { regex: /첫돌|돌아기|돌잡이/, handler: () => '1' },
  { regex: /두돌/, handler: () => '2' },
  { regex: /세돌/, handler: () => '3' },
  { regex: /네돌/, handler: () => '4' },
  { regex: /영세|0세/, handler: () => '0' },
  { regex: /일세|1세/, handler: () => '1' },
  { regex: /이세|2세/, handler: () => '2' },
  { regex: /삼세|3세/, handler: () => '3' },
  { regex: /사세|4세/, handler: () => '4' },
  { regex: /오세|5세/, handler: () => '5' },
  { regex: /육세|6세/, handler: () => '6' },
  { regex: /칠세|7세/, handler: () => '7' },
];

// 2. 성별 정규화 패턴
const BOY_PATTERNS = /남아|남자|아들|남자아이|사내아이|남동생/;
const GIRL_PATTERNS = /여아|여자|딸|여자아이|여동생/;

// 3. 기질 정규화 패턴
const PROPENSITY_PATTERNS = [
  { key: 'active', regex: /활발|에너지|뛰는|움직이는|외향|장난꾸러기/ },
  { key: 'calm', regex: /차분|얌전|정적인|조용한|내향/ },
  { key: 'sensitive', regex: /예민|까칠|겁이|울보|소심|섬세/ },
  { key: 'curious', regex: /호기심|질문|탐색|과학|왜|독창/ },
];

// 4. 주요 유아고민 및 도서 주제 사전 (정제용)
const TOPIC_DICTIONARY = [
  // 생활습관 / 고민
  { keywords: ['배변', '기저귀', '똥', '응가', '쉬', '소변'], normalized: '배변습관' },
  { keywords: ['편식', '음식', '밥', '반찬', '야채', '식사'], normalized: '식습관' },
  { keywords: ['수면', '잠', '불면', '악몽', '밤', '잠투정'], normalized: '수면습관' },
  { keywords: ['양치', '이빨', '치과', '칫솔'], normalized: '양치습관' },
  { keywords: ['어린이집', '유치원', '적응', '친구', '사회성', '공유'], normalized: '사회성' },
  { keywords: ['동생', '질투', '싸움', '양보'], normalized: '형제갈등' },
  { keywords: ['떼', '고집', '화', '분노', '짜증', '감정', '마음'], normalized: '감정조절' },
  
  // 흥미 / 주제
  { keywords: ['공룡', '티라노', '트리케라'], normalized: '공룡' },
  { keywords: ['기차', '전철', '열차', ' KTX'], normalized: '기차' },
  { keywords: ['자동차', '경찰차', '소방차', '중장비', '타요', '바퀴'], normalized: '자동차' },
  { keywords: ['우주', '별', '행성', '달', '지구'], normalized: '우주' },
  { keywords: ['동물', '사자', '호랑이', '강아지', '고양이', '자연'], normalized: '동물' },
  { keywords: ['곤충', '나비', '무당벌레', '벌레'], normalized: '곤충' },
  { keywords: ['모험', '탐험', '용기', '괴물'], normalized: '모험' },
  { keywords: ['수학', '숫자', '도형', '계산'], normalized: '수학' },
  { keywords: ['한글', '글자', '언어', '말'], normalized: '한글' },
  { keywords: ['영어', '알파벳'], normalized: '영어' },
  { keywords: ['그리기', '미술', '색깔', '색칠'], normalized: '미술' },
];

export function extractKeywords(query: string): ExtractedKeywords {
  const queryClean = query.trim().toLowerCase();

  // 1. 연령 분석
  let ageGroup = 'all';
  for (const pattern of AGE_PATTERNS) {
    const match = queryClean.match(pattern.regex);
    if (match) {
      if (match[1]) {
        ageGroup = pattern.handler(parseInt(match[1], 10));
      } else {
        ageGroup = pattern.handler(0);
      }
      break;
    }
  }

  // 2. 성별 분석
  let gender: 'boy' | 'girl' | 'all' = 'all';
  if (BOY_PATTERNS.test(queryClean)) {
    gender = 'boy';
  } else if (GIRL_PATTERNS.test(queryClean)) {
    gender = 'girl';
  }

  // 3. 기질 분석
  let propensity: string | null = null;
  for (const p of PROPENSITY_PATTERNS) {
    if (p.regex.test(queryClean)) {
      propensity = p.key;
      break;
    }
  }

  // 4. 주제 키워드 매핑 및 추출
  const detectedTopics: Set<string> = new Set();
  for (const topic of TOPIC_DICTIONARY) {
    for (const kw of topic.keywords) {
      if (queryClean.includes(kw)) {
        detectedTopics.add(topic.normalized);
        break;
      }
    }
  }

  // 매핑 사전에 없는 명사가 직접 유입되었을 경우 대비하여 단어 매칭
  if (detectedTopics.size === 0) {
    // 2자 이상의 단어들 중 조사나 기본 불용어를 제외한 단어 임시 추가
    const words = queryClean.split(/\s+/);
    for (const word of words) {
      const cleanWord = word.replace(/[은는이가을를의도과와에서]/g, '').trim();
      if (cleanWord.length >= 2 && !['추천', '그림책', '도서', '아이', '아기', '남자', '여자', '살인', '우리', '진짜'].includes(cleanWord)) {
        detectedTopics.add(cleanWord);
      }
    }
  }

  // 주제 키워드 정렬하여 캐시 일관성 보장
  const topics = Array.from(detectedTopics).sort();

  return {
    ageGroup,
    gender,
    propensity,
    topics: topics.length > 0 ? topics : ['일반'],
  };
}

/**
 * 정규화된 키워드 정보로 유니크한 캐시 키를 생성합니다.
 */
export function generateCacheKey(keywords: ExtractedKeywords): string {
  const age = `a${keywords.ageGroup}`;
  const gen = `g_${keywords.gender}`;
  const prop = keywords.propensity ? `p_${keywords.propensity}` : 'p_none';
  const tops = `t_${keywords.topics.join('_')}`;
  
  return `${age}:${gen}:${prop}:${tops}`;
}
