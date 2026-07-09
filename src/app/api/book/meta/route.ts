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
        let query = searchParams.get('query');

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        // Normalize query: remove extra spaces, trim
        query = query.replace(/\s+/g, ' ').trim();

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
                title: bestMatch.title,
                source: 'aladin'
            };
        }

        // Strat 2: Naver Search
        if (!result) {
            const naverResults = await NaverCollector.searchBook(query);
            if (naverResults && naverResults.length > 0) {
                const bestMatch = naverResults[0];
                result = {
                    cover: bestMatch.image,
                    link: bestMatch.link,
                    isbn: bestMatch.isbn,
                    price: parseInt(bestMatch.discount || '0'),
                    title: bestMatch.title,
                    source: 'naver'
                };
            }
        }

        // Strat 3: Relaxed Query - Split by space and take first word
        if (!result) {
            const simpleQuery = query.split(' ')[0];
            if (simpleQuery && simpleQuery !== query && simpleQuery.length > 2) {
                const relaxedResults = await NaverCollector.searchBook(simpleQuery);
                if (relaxedResults && relaxedResults.length > 0) {
                    const bestMatch = relaxedResults[0];
                    result = {
                        cover: bestMatch.image,
                        link: bestMatch.link,
                        isbn: bestMatch.isbn,
                        price: parseInt(bestMatch.discount || '0'),
                        title: bestMatch.title,
                        source: 'naver_relaxed_split'
                    };
                }
            }
        }

        // Strat 4: Aggressive Fallback - Remove all spaces
        if (!result && query.includes(' ')) {
            const noSpaceQuery = query.replace(/\s/g, '');
            const noSpaceResults = await NaverCollector.searchBook(noSpaceQuery);
            if (noSpaceResults && noSpaceResults.length > 0) {
                const bestMatch = noSpaceResults[0];
                result = {
                    cover: bestMatch.image,
                    link: bestMatch.link,
                    isbn: bestMatch.isbn,
                    price: parseInt(bestMatch.discount || '0'),
                    title: bestMatch.title,
                    source: 'naver_no_space'
                };
            }
        }

        if (result) {
            metaCache.set(query, { data: result, timestamp: Date.now() });
            return NextResponse.json(result);
        }

        return NextResponse.json({ error: 'Not found', normalizedQuery: query }, { status: 404 });

    } catch (error) {
        console.error('Meta Fetch Error:', error);
        return NextResponse.json(
            { error: 'Failed' },
            { status: 500 }
        );
    }
}