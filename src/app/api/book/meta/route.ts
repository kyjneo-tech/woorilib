import { NextRequest, NextResponse } from 'next/server';
import { AladinCollector } from '@/features/curation/collectors/aladin-collector';
import { NaverCollector } from '@/features/curation/collectors/naver-collector';

export const dynamic = 'force-dynamic';

// Simple in-memory cache to prevent 429 errors from Naver/Aladin
const metaCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    
    if (!query) {
       return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Check Cache
    const cached = metaCache.get(query);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return NextResponse.json(cached.data);
    }

    let result: any = null;

    // Strat 1: Aladin Search (High Resolution Covers)
    const aladinResults = await AladinCollector.search(query);
    if (aladinResults && aladinResults.length > 0) {
        const bestMatch = aladinResults[0];
        result = {
            cover: bestMatch.cover,
            link: bestMatch.link,
            isbn: bestMatch.isbn13,
            price: bestMatch.priceStandard,
            source: 'aladin'
        };
    }

    // Strat 2: Naver Search (Better for "Sets" or obscure books)
    if (!result) {
        const naverResults = await NaverCollector.search(query);
        if (naverResults && naverResults.length > 0) {
            const bestMatch = NaverCollector.normalize(naverResults[0]);
            result = {
                cover: bestMatch.cover,
                link: bestMatch.link,
                isbn: bestMatch.isbn13,
                price: bestMatch.priceStandard,
                source: 'naver'
            };
        }
    }
    
    // Strat 3: Relaxed Query
    if (!result) {
        const simpleQuery = query.split(' ')[0];
        if (simpleQuery && simpleQuery !== query && simpleQuery.length > 2) {
             const relaxedResults = await NaverCollector.search(simpleQuery);
             if (relaxedResults && relaxedResults.length > 0) {
                const bestMatch = NaverCollector.normalize(relaxedResults[0]);
                result = {
                    cover: bestMatch.cover,
                    link: bestMatch.link,
                    isbn: bestMatch.isbn13,
                    price: bestMatch.priceStandard,
                    source: 'naver_relaxed'
                };
             }
        }
    }

    if (result) {
        metaCache.set(query, { data: result, timestamp: Date.now() });
        return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  } catch (error) {
    console.error('Meta Fetch Error:', error);
    return NextResponse.json(
      { error: 'Failed' },
      { status: 500 }
    );
  }
}
