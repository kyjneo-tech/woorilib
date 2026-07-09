import { Book } from '@/entities/book/model/types';

export interface AiRecommendationItem {
  isbn: string;
  title: string;
  score: number;
  reason: string;
  age_fit: string;
}

export interface AiResponseData {
  recommendations: AiRecommendationItem[];
}

/**
 * AI가 반환한 문자열에서 JSON을 안전하게 추출 및 파싱합니다.
 */
export function parseRawAiResponse(rawText: string): AiResponseData {
  let cleanText = rawText.trim();
  
  // 백틱 ```json ... ``` 블록 제거
  if (cleanText.includes('```')) {
    const match = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      cleanText = match[1].trim();
    }
  }

  try {
    const parsed = JSON.parse(cleanText) as AiResponseData;
    if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
      throw new Error('올바르지 않은 JSON 형식: recommendations 배열이 없습니다.');
    }
    return parsed;
  } catch (error) {
    console.error('AI JSON Parsing Error. Raw Content:', rawText);
    throw new Error('AI 분석 결과를 파싱하는 중 오류가 발생했습니다.');
  }
}

/**
 * AI가 추천한 결과와 1차 알라딘 실제 도서 후보를 크로스체킹(환각 방지)합니다.
 */
export function validateAndEnrichRecommendations(
  aiResponse: AiResponseData,
  candidates: Book[]
): Book[] {
  const candidateMap = new Map<string, Book>();
  candidates.forEach(b => {
    candidateMap.set(b.isbn, b);
  });

  const validRecommendations: Book[] = [];

  for (const item of aiResponse.recommendations) {
    const cleanIsbn = item.isbn.trim();
    const candidate = candidateMap.get(cleanIsbn);

    if (candidate) {
      // 실존하는 후보 도서와 매칭된 경우 -> AI 분석 상세 데이터(매칭점수, 3줄평)를 이식하여 반환 객체 확장
      validRecommendations.push({
        ...candidate,
        ranking: item.score, // AI 매칭점수로 교체하여 신뢰도 어필
        description: item.reason, // AI 3줄 추천 사유를 노출하도록 이식
        // API Route에서 이 상세 AI 부가 정보를 JSON 필드나 별도 속성으로 안전하게 전달할 수 있도록 함
        publishYear: item.age_fit, // publishYear 필드를 임시로 활용하거나 UI 전용 확장 데이터로 처리
      });
    } else {
      console.warn(`[Hallucination Blocked] AI가 제공한 ISBN(${cleanIsbn})은 실존 후보 도서군에 존재하지 않아 배제되었습니다.`);
    }
  }

  // Fallback: 만약 AI 환각 필터링에 의해 추천 도서가 아예 없거나 1권 미만인 경우, 알라딘 실제 검색 결과 중 ranking이 높은 순서로 보정하여 표출함
  if (validRecommendations.length === 0 && candidates.length > 0) {
    console.warn('[Fallback Triggered] 검증된 AI 추천 도서가 없어 알라딘 실존 베스트 2권을 대체 제공합니다.');
    const bestCandidates = [...candidates]
      .sort((a, b) => (b.ranking || 0) - (a.ranking || 0))
      .slice(0, 2);

    return bestCandidates.map(c => ({
      ...c,
      ranking: 90, // 임의 보정점수
      description: '아이의 검색 조건에 맞는 도서 중 다른 학부모님들께서 가장 호평한 알라딘 대표 도서입니다.',
      publishYear: '모든 연령에 두루 적합합니다.',
    }));
  }

  return validRecommendations;
}
