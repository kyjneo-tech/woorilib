
import { NextRequest, NextResponse } from 'next/server';
import { ShelfComposer } from '@/features/curation/engine/display/shelf-composer';

// Force dynamic since we might use random seed or fresh data
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const monthsStr = searchParams.get('months');
    
    // Default to 12 months if not provided
    const months = monthsStr ? parseInt(monthsStr, 10) : 12; // Default to 1 year old (Infant)

    if (isNaN(months)) {
       return NextResponse.json({ error: 'Invalid months parameter' }, { status: 400 });
    }

    const dashboardData = await ShelfComposer.compose(months);

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Display Engine Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate curation' },
      { status: 500 }
    );
  }
}
