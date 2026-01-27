
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'blog'; // blog or book
    const query = searchParams.get('query');

    if (!query) return NextResponse.json({ error: 'Query required' }, { status: 400 });

    if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
      console.warn('Naver API Keys missing');
      return NextResponse.json({ items: [] }); // Graceful degradation
    }

    const apiPath = type === 'book' ? 'book.json' : 'blog.json';
    const url = `https://openapi.naver.com/v1/search/${apiPath}?query=${encodeURIComponent(query)}&display=5`;

    const res = await fetch(url, {
      headers: {
        'X-Naver-Client-Id': NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
      }
    });

    if (!res.ok) throw new Error(`Naver API Error: ${res.status}`);
    const data = await res.json();

    return NextResponse.json(data);

  } catch (error) {
    console.error('Naver API Proxy Error:', error);
    return NextResponse.json({ items: [] });
  }
}
