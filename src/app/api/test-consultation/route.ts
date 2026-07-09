
import { NextRequest, NextResponse } from 'next/server';
import { ConsultationService } from '@/features/curation/services/consultation.service';

export async function GET(request: NextRequest) {
    try {
        console.log('Generating report with mocked data...');
        const report = await ConsultationService.generateReport('dummy-child-id');
        return NextResponse.json(report);
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message || String(error), stack: error.stack }, { status: 500 });
    }
}
