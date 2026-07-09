import { NextRequest, NextResponse } from 'next/server';
import { ShelfComposer } from '@/features/curation/engine/display/shelf-composer';

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const months = parseInt(searchParams.get('months') || '0');
        const propensity = searchParams.get('propensity') || undefined;
        const interests = (searchParams.get('interests') || '').split(',').filter(Boolean);

        if (months === 0) {
            return NextResponse.json({ error: 'Months parameter is required' }, { status: 400 });
        }

        const dashboardData = await ShelfComposer.compose({
            months,
            propensity,
            interests
        });

        return NextResponse.json(dashboardData);
    } catch (error) {
        console.error('[API] Shelf Composition Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
