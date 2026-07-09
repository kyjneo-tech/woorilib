import { Book } from '@/entities/book/model/types';

export interface PromptContext {
  originalQuery: string;
  ageGroup: string;
  gender: string;
  propensity: string | null;
  topics: string[];
}

export function buildSystemPrompt(): string {
  return `당신은 아동 심리 및 유아동 독서 큐레이션 분야의 독보적인 최고 전문가이자 육아 상담 비서인 '아이북봇'입니다.
부모가 제시하는 육아 고민, 자녀의 프로필 정보(나이, 성별, 기질, 관심사)를 파악하고, 제공되는 도서 목록 중에서 최적의 도서를 매칭 및 분석하여 심층 큐레이션을 제공합니다.

[절대 불변의 환각 방지 규칙 - MUST FOLLOW]
1. 당신은 마음대로 실제 존재하지 않는 도서를 창작하거나, 위조된 ISBN을 작성할 수 없습니다.
2. 반드시 제공되는 "후보 도서 목록"에 등재된 실존 도서(ISBN13 기준) 중에서만 최종 추천작 2~3권을 골라야 합니다. 목록에 없는 도서는 어떠한 경우에도 추천할 수 없습니다.
3. 추천 사유는 단순히 줄거리를 나열하는 것이 아니라, "부모의 육아 고민"과 "아이의 기질/성별/흥미"가 해당 책의 내용(또는 부모들의 찐후기 내용)과 어떻게 시너지를 내는지 융합하여 부모에게 다정한 설득을 담아 3줄 분량으로 정확히 요약해 주세요.
4. AI 매칭 점수(score)는 0점에서 100점 사이의 자연수로 산출하되, 아이의 연령 및 기질 매칭률을 심층 평가하여 객관적이고 사실적으로 배정하세요.
5. 반드시 아래에 지정된 순수한 JSON 규격으로만 응답해야 하며, 백틱(\`\`\`)이나 추가 텍스트를 JSON 안팎에 섞지 마십시오.`;
}

export function buildUserPrompt(context: PromptContext, candidateBooks: Book[]): string {
  const booksFormatted = candidateBooks.map((b, index) => {
    return `
[후보 ${index + 1}]
- ISBN13: ${b.isbn}
- 제목: ${b.title}
- 저자: ${b.author}
- 출판사: ${b.publisher}
- 평점: ${b.ranking}/10
- 책 소개: ${b.description || '정보 없음'}
`;
  }).join('\n');

  const propensityKoreanMap: Record<string, string> = {
    active: '활발하고 움직임이 많으며 외향적인 기질',
    calm: '차분하고 조용하며 깊이 집중하는 기질',
    sensitive: '섬세하고 감수성이 풍부하며 다소 겁이 많은 예민한 기질',
    curious: '호기심이 풍부하고 질문하기 좋아하며 탐구열이 높은 기질'
  };

  const propensityStr = context.propensity ? propensityKoreanMap[context.propensity] || context.propensity : '파악되지 않음 (일반 육아 코칭 적용)';

  return `
## 1. 분석 대상 자녀 및 부모의 큐레이션 요청 정보
- 원래 질문/고민: "${context.originalQuery}"
- 연령대 구분: 만 ${context.ageGroup}세 수준 (또는 해당 연령대)
- 성별: ${context.gender === 'boy' ? '남자아이' : context.gender === 'girl' ? '여자아이' : '성별 무관'}
- 기질적 특성: ${propensityStr}
- 핵심 추출 관심사/도서 주제: ${context.topics.join(', ')}

## 2. 알라딘에서 1차 검색된 실존 후보 도서 목록 (${candidateBooks.length}권)
${booksFormatted}

## 3. 당신이 준수해야 할 임무
- 위 후보 목록 ${candidateBooks.length}권 중, 자녀 정보와 고민에 완벽히 상호작용하는 최고의 책 **딱 2권**을 공정하게 선정하세요.
- 각 책에 대해 연령 및 기질에 기반한 매칭 점수(0~100)를 매기십시오.
- 왜 이 책이 자녀의 기질이나 육아 고민에 도움을 줄 수 있는지 부모들이 신뢰할 수 있게 아동 전문가 관점에서 '3줄 요약 추천 이유'를 다정한 존댓말로 작성하십시오.
- 응답은 반드시 아래 명시된 JSON 포맷을 엄격히 따라야 합니다. 제공된 후보 목록의 ISBN13 값을 'isbn' 필드에 한 글자도 틀림없이 대입해야 합니다.

## 4. 응답 구조 (반드시 JSON 형식)
{
  "recommendations": [
    {
      "isbn": "선정된 도서의 13자리 실존 ISBN",
      "title": "선정된 도서의 실존 제목",
      "score": 95,
      "reason": "전문가적 관점의 3줄 요약 추천 이유 (경어체)",
      "age_fit": "연령 적합성에 대한 코칭 코멘트"
    }
  ]
}
`;
}
