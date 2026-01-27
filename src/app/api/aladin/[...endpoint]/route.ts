import { NextRequest, NextResponse } from 'next/server';

const ALADIN_API_BASE = 'https://www.aladin.co.kr/ttb/api';

/**
 * 알라딘 API 프록시 Route Handler
 * 클라이언트에서 직접 접근할 수 없는 환경변수를 서버에서 처리
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ endpoint: string[] }> }
) {
  const { endpoint } = await context.params;
  const ttbKey = process.env.ALADIN_TTB_KEY;

  if (!ttbKey) {
    return NextResponse.json(
      { error: 'Aladin API key not configured' },
      { status: 500 }
    );
  }

  const apiEndpoint = endpoint?.join('/') || 'ItemList.aspx';
  const searchParams = request.nextUrl.searchParams;

  // Build Aladin API URL
  const url = new URL(`${ALADIN_API_BASE}/${apiEndpoint}`);
  url.searchParams.set('ttbkey', ttbKey);
  url.searchParams.set('output', 'js'); // JSON format
  url.searchParams.set('Version', '20131101');

  // Forward all query params
  searchParams.forEach((value, key) => {
    if (key !== 'endpoint') {
      url.searchParams.set(key, value);
    }
  });

  try {
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Aladin API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Aladin API Proxy] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from Aladin API' },
      { status: 500 }
    );
  }
}
