
export type GrowthDomain = 
  | 'language' // 의사소통
  | 'social'   // 사회정서
  | 'math_sci' // 수과학
  | 'cognitive' // 인지
  | 'art_music' // 예술
  | 'english'   // 영어
  | 'unclassified';

interface ClassificationResult {
  domain: GrowthDomain;
  confidence: 'high' | 'medium' | 'low' | 'none';
  source: 'master' | 'consensus' | 'keyword' | 'user';
  candidates?: GrowthDomain[];
}

// Master Data: Known Sets (Example)
const MASTER_DB: Record<string, GrowthDomain> = {
  '자연이랑': 'math_sci',
  '도레미곰': 'art_music',
  '안녕마음아': 'social',
  '버니의세계책방': 'social', 
  '돌잡이수학': 'math_sci',
  '돌잡이한글': 'language',
  '돌잡이영어': 'english',
  '추피': 'social',
  '베베코알라': 'social',
  '과학공룡': 'math_sci',
  '수학공룡': 'math_sci',
  '사회공룡': 'social',
};

// Keyword Mapping Rules (Weighted)
const KEYWORD_RULES: Record<string, GrowthDomain> = {
  '과학': 'math_sci',
  '수학': 'math_sci',
  '자연': 'math_sci',
  '공룡': 'math_sci',
  '식물': 'math_sci',
  '동물': 'math_sci',
  '우주': 'math_sci',
  
  '한글': 'language',
  '말하기': 'language',
  '동화': 'language', // Weak
  
  '영어': 'english',
  'English': 'english',
  
  '미술': 'art_music',
  '음악': 'art_music',
  '노래': 'art_music',
  '피아노': 'art_music',
  
  '친구': 'social',
  '마음': 'social',
  '생활': 'social',
  '예절': 'social',
  '감정': 'social',
};

export const ClassificationService = {
  
  /**
   * Main Classification Logic
   * 1. Master DB Check (High Confidence)
   * 2. Aladin Category Mapping (Medium-High)
   * 3. Keyword Scoring (Medium-Low)
   * 4. Hallucination Guard (Return 'unclassified' if unsure)
   */
  classify: (title: string, aladinCategoryName?: string): ClassificationResult => {
    const cleanTitle = title.replace(/\s+/g, '');
    
    // 1. Master DB Check (Partial Match)
    // Check if title contains any master key
    for (const [key, domain] of Object.entries(MASTER_DB)) {
      if (cleanTitle.includes(key)) {
        return { domain, confidence: 'high', source: 'master' };
      }
    }

    // 2. Aladin Category Mapping (Consensus Logic)
    // Example Aladin Category: "유아 > 4-7세 > 과학/수학"
    if (aladinCategoryName) {
      if (aladinCategoryName.includes('과학') || aladinCategoryName.includes('수학') || aladinCategoryName.includes('자연')) 
        return { domain: 'math_sci', confidence: 'medium', source: 'consensus' };
      if (aladinCategoryName.includes('영어') || aladinCategoryName.includes('ELT')) 
        return { domain: 'english', confidence: 'medium', source: 'consensus' };
      if (aladinCategoryName.includes('음악') || aladinCategoryName.includes('미술')) 
        return { domain: 'art_music', confidence: 'medium', source: 'consensus' };
      if (aladinCategoryName.includes('인성') || aladinCategoryName.includes('사회')) 
        return { domain: 'social', confidence: 'medium', source: 'consensus' };
      if (aladinCategoryName.includes('한글') || aladinCategoryName.includes('언어')) 
        return { domain: 'language', confidence: 'medium', source: 'consensus' };
    }

    // 3. Keyword Voting System
    const scores: Record<string, number> = {};
    
    for (const [keyword, domain] of Object.entries(KEYWORD_RULES)) {
      if (title.includes(keyword)) {
        scores[domain] = (scores[domain] || 0) + 1;
      }
    }

    // 4. Hallucination Guard (Threshold Check)
    // We need at least one strong signal or multiple weak signals.
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    
    if (sorted.length > 0) {
      const best = sorted[0];
      // If score >= 1 (Since our keywords are quite specific, 1 match is usually decent, but let's be strict if needed)
      // For now, return Medium confidence
      return { domain: best[0] as GrowthDomain, confidence: 'medium', source: 'keyword' };
    }

    // 5. User Fallback
    return { domain: 'unclassified', confidence: 'none', source: 'user' };
  }
};
