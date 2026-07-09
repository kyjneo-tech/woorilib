
import { BookCategory } from '../taxonomy';

export interface DeepAnalysisResult {
  developmental_areas: string[];
  sub_competencies: string[];
  emotional_keywords: string[];
  curation_points: string[];
  energy_level: number;
  target_months_min?: number;
  target_months_max?: number;
  ai_comment: string;
}

/**
 * DeepAnalyzer
 * Uses LLM to extract high-precision metadata for professional consultation.
 * Used primarily during data enrichment phase (development time).
 */
export class DeepAnalyzer {
  private static API_KEY = process.env.OPENAI_API_KEY;

  static async analyze(bookInfo: { title: string; author?: string; description: string }): Promise<DeepAnalysisResult | null> {
    // 🐾 COCO: If no API key, return null silently. Caller will handle fallback.
    if (!this.API_KEY) {
      return null;
    }

    const prompt = `
아이책 전문가로서 다음 도서 정보를 분석하여 JSON 형식으로 응답해줘.

도서명: ${bookInfo.title}
저자: ${bookInfo.author || '미상'}
설명: ${bookInfo.description}

[분석 기준]
1. developmental_areas: [언어, 정서, 사회성, 인지, 신체, 자아, 자연탐구, 예술경험] 중 선택
2. sub_competencies: 도출된 세부 역량 (예: 어휘력, 공감 능력, 문제 해결력 등)
3. emotional_keywords: 책의 분위기 (예: 따뜻한, 용기있는, 호기심 넘치는)
4. energy_level: 1 (매우 차분/취침전) ~ 10 (매우 활발/놀이중) 사이의 숫자
5. curation_points: 이 책을 추천하는 핵심 이유 3가지
6. ai_comment: 부모님께 전달할 한 줄 추천 멘트

응답은 반드시 JSON 형식이어야 해.
`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
        }),
      });

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);
      
      return {
        developmental_areas: result.developmental_areas || [],
        sub_competencies: result.sub_competencies || [],
        emotional_keywords: result.emotional_keywords || [],
        curation_points: result.curation_points || [],
        energy_level: result.energy_level || 5,
        ai_comment: result.ai_comment || '',
      };
    } catch (error) {
      console.error('❌ Deep Analysis failed:', error);
      return null;
    }
  }
}
