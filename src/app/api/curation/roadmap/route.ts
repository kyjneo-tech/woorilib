import { NextResponse } from 'next/server';
import { CurriculumService } from '../../../../features/curation/core/services/curriculum.service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { keyword, ageMonths, propensity } = body;

    if (!keyword || !ageMonths) {
      return NextResponse.json(
        { error: 'Missing required fields: keyword, ageMonths' },
        { status: 400 }
      );
    }

    console.log(`[API] Generating roadmap for: ${keyword} (${ageMonths}m, ${propensity})`);

    // Call the Core Service
    const roadmap = await CurriculumService.generateRoadmap(keyword, ageMonths, propensity || 'active');

    return NextResponse.json(roadmap);
    
  } catch (error) {
    console.error('[API] Curation Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}