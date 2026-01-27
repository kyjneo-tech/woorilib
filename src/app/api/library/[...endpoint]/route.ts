import { NextRequest, NextResponse } from 'next/server';

const LIBRARY_API_BASE = 'http://data4library.kr/api';
const AUTH_KEY = process.env.LIBRARY_API_KEY;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ endpoint: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const endpoint = resolvedParams.endpoint.join('/');
    const searchParams = request.nextUrl.searchParams;

    if (!AUTH_KEY) {
      console.error('[Library API] Missing LIBRARY_API_KEY');
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      );
    }

    // Build the URL for the external API
    const url = new URL(`${LIBRARY_API_BASE}/${endpoint}`);
    url.searchParams.set('authKey', AUTH_KEY);
    url.searchParams.set('format', 'json');

    // Forward all other params
    searchParams.forEach((value, key) => {
      if (key !== 'authKey' && key !== 'format') {
        url.searchParams.set(key, value);
      }
    });

    console.log(`[Library API] Full URL: ${url.toString()}`);

    // Don't set Accept header - the library API returns 406 if we do
    const response = await fetch(url.toString());

    console.log(`[Library API] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Library API] Error response: ${errorText.substring(0, 500)}`);
      return NextResponse.json(
        { error: `External API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('[Library API] Fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
