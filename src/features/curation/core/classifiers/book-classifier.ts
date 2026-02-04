import { DEVELOPMENTAL_AREAS, DevelopmentalArea } from '@/shared/config/constants';

/**
 * 30+ Granular Sub-competencies (Soft Skills)
 * These are used for ultra-precise filtering in Frontend.
 */
const SUB_COMPETENCIES: Record<string, string[]> = {
  // 의사소통 (Communication)
  '어휘력': ['단어', '낱말', '이름', '어휘', '말문', 'Vocabulary'],
  '언어표현': ['말하기', '표현', '대화', '문장', 'Speak', 'Talk'],
  '듣기태도': ['경청', '듣기', '집중', 'Listen'],
  '읽기흥미': ['책읽기', '독서', '이야기', 'Story', 'Read'],
  '외국어노출': ['영어', '알파벳', '원서', 'English', 'ABC', 'Letter'],
  
  // 자연탐구 (Nature/Science)
  '관찰력': ['관찰', '찾기', '숨은그림', 'Observe', 'Find'],
  '수리논리': ['수학', '숫자', '도형', '계산', 'Math', 'Number', 'Shape'],
  '과학원리': ['과학', '원리', '실험', '작동', 'Science', 'How'],
  '동물생태': ['동물', '생물', '숲', '바다', '곤충', 'Animal', 'Nature'],
  '우주공학': ['우주', '별', '행성', '로켓', '자동차', '기차', 'Space', 'Car'],
  
  // 사회관계 (Social)
  '자아존중': ['나', '자신감', '자존감', '용기', 'Self', 'Brave'],
  '감정조절': ['감정', '마음', '화', '슬픔', '기쁨', 'Emotion', 'Feel'],
  '공감능력': ['배려', '위로', '나눔', '공감', 'Empathy', 'Share'],
  '사회성': ['친구', '이웃', '집단', '유치원', '학교', 'Friend', 'Social'],
  '다양성인식': ['세계', '문화', '전통', '다른', 'Different', 'World'],
  
  // 예술경험 (Art)
  '심미감': ['아름다움', '예술', '색깔', '풍경', 'Art', 'Color'],
  '예술적표현': ['그리기', '만들기', '꾸미기', '창의', 'Creative', 'Paint'],
  '리듬감': ['음악', '노래', '악기', '춤', '박자', 'Music', 'Rhythm'],
  
  // 신체운동·건강 (Physical/Safety)
  '대근육발달': ['운동', '신체', '달리기', '뛰기', 'Body', 'Jump'],
  '소근육발달': ['조작', '플랩', '스티커', '뜯기', 'Motor', 'Stick'],
  '안전의식': ['안전', '조심', '위험', '사고', 'Safety', 'Danger'],
  
  // 생활습관 (Habits)
  '배변습관': ['배변', '변기', '응가', '기저귀', 'Potty'],
  '청결습관': ['양치', '목욕', '손씻기', '치카', 'Wash', 'Brush'],
  '수면습관': ['잠자기', '자장가', '꿈', '밤', 'Sleep', 'Dream'],
  '식습관': ['골고루', '편식', '식사', '냠냠', 'Eat', 'Meal'],
  '정리정돈': ['정리', '청소', 'Clean'],
};

export interface ClassificationResult {
  areas: DevelopmentalArea[];
  subCompetencies: string[]; // New: 30+ granular tags
  tags: string[];
  formFactor: string;
  isWorkbook: boolean;
  age: { min: number; max: number };
  energyLevel: number;
  volume: number | null;
  aiComment: string;
}

export class BookClassifier {
  static analyze(text: string, categoryName: string = ''): ClassificationResult {
    const combinedText = `${text} ${categoryName}`;
    const formFactor = this.detectFormFactor(combinedText, categoryName);
    const isWorkbook = this.detectWorkbook(combinedText, categoryName);
    const areas = this.classifyAreas(text, categoryName);
    const subComps = this.extractSubCompetencies(combinedText);
    const tags = this.extractTags(combinedText);
    const age = this.estimateAgeRange(formFactor, isWorkbook, text.length, combinedText);
    const energy = this.calculateEnergyLevel(combinedText, formFactor);
    
    return {
      areas,
      subCompetencies: subComps,
      tags,
      formFactor,
      isWorkbook,
      age,
      energyLevel: energy,
      volume: this.extractVolume(text),
      aiComment: this.generateComment(areas, age, formFactor, isWorkbook, subComps)
    };
  }

  private static extractSubCompetencies(text: string): string[] {
    const matched: Set<string> = new Set();
    const lowerText = text.toLowerCase();
    
    for (const [comp, keywords] of Object.entries(SUB_COMPETENCIES)) {
      if (keywords.some(k => lowerText.includes(k.toLowerCase()))) {
        matched.add(comp);
      }
    }
    return Array.from(matched);
  }

  private static classifyAreas(text: string, categoryName: string): DevelopmentalArea[] {
    const scores: Record<string, number> = {};
    const lowerText = text.toLowerCase();
    const lowerCategory = categoryName.toLowerCase();

    // Mapping sub-comps to parent areas for logical consistency
    const COMP_TO_AREA: Record<string, DevelopmentalArea> = {
      '어휘력': '의사소통', '언어표현': '의사소통', '듣기태도': '의사소통', '읽기흥미': '의사소통', '외국어노출': '의사소통',
      '관찰력': '자연탐구', '수리논리': '자연탐구', '과학원리': '자연탐구', '동물생태': '자연탐구', '우주공학': '자연탐구',
      '자아존중': '사회관계', '감정조절': '사회관계', '공감능력': '사회관계', '사회성': '사회관계', '다양성인식': '사회관계',
      '심미감': '예술경험', '예술적표현': '예술경험', '리듬감': '예술경험',
      '대근육발달': '신체운동·건강', '소근육발달': '신체운동·건강', '안전의식': '신체운동·건강',
      '배변습관': '생활습관', '청결습관': '생활습관', '수면습관': '생활습관', '식습관': '생활습관', '정리정돈': '생활습관'
    };

    for (const [comp, area] of Object.entries(COMP_TO_AREA)) {
      const keywords = SUB_COMPETENCIES[comp];
      if (keywords.some(k => lowerText.includes(k.toLowerCase()) || lowerCategory.includes(k.toLowerCase()))) {
        scores[area] = (scores[area] || 0) + 2;
      }
    }

    return Object.entries(scores)
      .filter(([_, score]) => score >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([area]) => area as DevelopmentalArea);
  }

  // ... (Other helper methods: extractVolume, generateComment, calculateEnergyLevel, estimateAgeRange, detectFormFactor, detectWorkbook, extractTags)
  // Re-pasting those to ensure file is complete.
  
  private static extractVolume(text: string): number | null {
    const match = text.match(/(?:제|Vol\.|No\.|권)?\s*(\d+)\s*(?:권|호)/);
    if (match) return parseInt(match[1]);
    const endMatch = text.match(/\s(\d+)$/);
    if (endMatch) return parseInt(endMatch[1]);
    return null;
  }

  private static generateComment(areas: DevelopmentalArea[], age: { min: number, max: number }, form: string, isWorkbook: boolean, subComps: string[]): string {
    const mainComp = subComps[0] || areas[0] || '종합 발달';
    const ageStr = `${Math.floor(age.min/12)}~${Math.floor(age.max/12)}세`;
    if (isWorkbook) return `${mainComp} 역량을 키워주는 ${ageStr} 아이용 워크북이에요.`;
    return `${mainComp}에 도움을 주는 ${ageStr} 시기 필수 그림책이에요.`;
  }

  private static calculateEnergyLevel(text: string, formFactor: string): number {
    let score = 5;
    const activeKeywords = ['운동', '신체', '놀이', '춤', '노래', '사운드', '자동차', '공룡', 'Active', 'Play'];
    score += activeKeywords.filter(k => text.includes(k)).length * 2;
    if (formFactor === 'soundbook' || formFactor === 'flapbook') score += 2;
    return Math.max(0, Math.min(10, score));
  }

  private static estimateAgeRange(formFactor: string, isWorkbook: boolean, textLength: number, text: string): { min: number; max: number } {
    const elementaryKeywords = ['초등', '학교', '글쓰기', '교과서', '학년', 'Grade', 'Elementary'];
    if (elementaryKeywords.some(k => text.includes(k))) return { min: 84, max: 120 };
    if (isWorkbook) return { min: 48, max: 84 };
    switch (formFactor) {
        case 'boardbook': return { min: 0, max: 24 };
        case 'flapbook': return { min: 12, max: 36 };
        default: return textLength < 150 ? { min: 24, max: 48 } : { min: 48, max: 84 };
    }
  }

  private static extractTags(text: string): string[] {
    const tags: Set<string> = new Set();
    const tagMap: Record<string, string[]> = {
      '자존감': ['자존감', '용기'], '상상력': ['상상', '꿈'], '애착': ['사랑', '포옹']
    };
    for (const [tag, keywords] of Object.entries(tagMap)) {
       if (keywords.some(k => text.includes(k))) tags.add(tag);
    }
    return Array.from(tags);
  }

  private static detectFormFactor(text: string, category: string): string {
    if (category.includes('보드북') || text.includes('보드북')) return 'boardbook';
    if (text.includes('플랩') || text.includes('팝업')) return 'flapbook';
    if (text.includes('사운드') || text.includes('소리')) return 'soundbook';
    return 'hardcover';
  }

  private static detectWorkbook(text: string, category: string): boolean {
    const kw = ['워크북', '학습지', '문제집', 'Activity', 'Sticker'];
    return kw.some(k => text.includes(k) || category.includes(k));
  }
}