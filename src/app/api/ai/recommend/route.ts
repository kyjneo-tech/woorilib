import { NextRequest, NextResponse } from 'next/server';
import { extractKeywords, generateCacheKey } from '@/features/ai-recommend/lib/keyword-extractor';
import { aladinApiClient, ALADIN_CHILD_CATEGORIES } from '@/entities/book/api/aladin-api.client';
import { buildSystemPrompt, buildUserPrompt, PromptContext } from '@/features/ai-recommend/lib/prompt-builder';
import { aiProvider, Message } from '@/features/ai-recommend/lib/ai-client';
import { parseRawAiResponse, validateAndEnrichRecommendations } from '@/features/ai-recommend/lib/response-parser';
import { cacheService } from '@/features/ai-recommend/services/cache-service';
import { Book } from '@/entities/book/model/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, childAgeGroup, gender, propensity, interests } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: '질문(query)이 필요합니다.' }, { status: 400 });
    }

    // 1. 키워드 분석 및 정규화
    const extracted = extractKeywords(query);
    
    // 만약 Zustand 유저 프로필 상태가 있으면 추출 결과보다 프로필 값을 우선 시너지 연동
    const finalContext: PromptContext = {
      originalQuery: query,
      ageGroup: childAgeGroup ? childAgeGroup.replace('a', '') : extracted.ageGroup,
      gender: gender || extracted.gender,
      propensity: propensity || extracted.propensity,
      topics: interests && interests.length > 0 ? interests : extracted.topics,
    };

    // 2. 캐시 키 도출
    const cacheKey = generateCacheKey({
      ageGroup: finalContext.ageGroup,
      gender: finalContext.gender as any,
      propensity: finalContext.propensity,
      topics: finalContext.topics,
    });

    // 3. L1 / L2 이중 추천 캐시 확인 (토큰 비용 0원 돌입용)
    const cachedRecommendation = await cacheService.getRecommendation(cacheKey);
    if (cachedRecommendation) {
      console.log(`[Cache Success] AI 추천 캐시를 전송합니다. cacheKey: ${cacheKey}`);
      return NextResponse.json({ recommendations: cachedRecommendation, cached: true });
    }

    // 4. 알라딘 검색 진행 (알라딘 캐시 검사 우선)
    const aladinSearchKeyword = finalContext.topics.join(' ');
    const aladinCacheKey = `aladin_search:${finalContext.ageGroup}:${aladinSearchKeyword}`;
    
    let candidateBooks: Book[] = [];
    const cachedAladinSearch = await cacheService.getAladinSearch(aladinCacheKey);

    if (cachedAladinSearch) {
      candidateBooks = cachedAladinSearch;
    } else {
      // 알라딘 API 검색
      console.log(`[Aladin Search Miss] 알라딘 API를 호출합니다: ${aladinSearchKeyword}`);
      const searchResults = await aladinApiClient.searchBooks(aladinSearchKeyword, 15);
      
      if (searchResults && searchResults.length > 0) {
        candidateBooks = searchResults;
      } else {
        // 알라딘 검색 실패/결과 없음 시 카테고리 베스트셀러를 후보군으로 Fallback
        console.warn(`[Aladin No Result] 알라딘 검색 결과가 없어 그림책 베스트셀러를 로드합니다.`);
        const bestsellers = await aladinApiClient.getBestseller({
          categoryId: ALADIN_CHILD_CATEGORIES.PICTURE_BOOK,
          maxResults: 10,
        });

        candidateBooks = bestsellers.map(item => ({
          isbn: item.isbn13 || item.isbn,
          title: item.title,
          author: item.author,
          publisher: item.publisher,
          publishYear: item.pubDate,
          bookImageURL: item.cover,
          description: item.description,
          ranking: item.customerReviewRank,
        }));
      }

      // 검색 결과를 이중 캐시에 보존 (24시간 TTL)
      if (candidateBooks.length > 0) {
        await cacheService.saveAladinSearch(aladinCacheKey, candidateBooks);
      }
    }

    // 5. AI 프롬프트 생성
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(finalContext, candidateBooks.slice(0, 8)); // 8권까지 요약 전송하여 토큰 최소화

    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    // 6. Kimi-K2.6 AI 호출
    console.log(`[AI Call] Canopy Wave API Kimi-K2.6 호출 시작. cacheKey: ${cacheKey}`);
    const rawAiResponse = await aiProvider.chat(messages);

    // 7. AI 응답 파싱 및 실존 도서 크로스체킹 (환각 배제)
    const parsedAiResult = parseRawAiResponse(rawAiResponse);
    const validatedRecommendations = validateAndEnrichRecommendations(
      parsedAiResult,
      candidateBooks
    );

    // 8. 결과를 이중 추천 캐시에 저장 (7일 TTL)
    if (validatedRecommendations.length > 0) {
      await cacheService.saveRecommendation(cacheKey, query, validatedRecommendations);
    }

    return NextResponse.json({ recommendations: validatedRecommendations, cached: false });
  } catch (error: any) {
    console.error('AI Recommend API Route Error:', error);
    return NextResponse.json({
      error: 'AI 추천 처리 중 서버 오류가 발생했습니다.',
      details: error.message
    }, { status: 500 });
  }
}
