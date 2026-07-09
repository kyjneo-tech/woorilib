import { NextRequest, NextResponse } from 'next/server';
import { ShelfComposer } from '@/features/curation/engine/display/shelf-composer';
import { prisma } from '@/shared/lib/prisma';

// Force dynamic since we might use random seed or fresh data
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const childId = searchParams.get('childId');
    const monthsStr = searchParams.get('months');

    // Base Context
    let context = {
      months: monthsStr ? parseInt(monthsStr, 10) : 12, // Default 12m
      interests: [] as string[],
      propensity: undefined as string | undefined
    };

    // 1. If Child ID provided, fetch Profile from DB
    if (childId) {
      const profile = await prisma.childProfile.findUnique({
        where: { id: childId },
        select: {
          birthYear: true,
          interests: true,
          propensity: true
        }
      });

      if (profile) {
        // Calculate months from birthYear
        if (profile.birthYear) {
          const now = new Date();
          const currentYear = now.getFullYear();
          let months = (currentYear - profile.birthYear) * 12;
          if (months < 0) months = 0;
          context.months = months;
        }
        context.interests = profile.interests || [];
        context.propensity = profile.propensity || undefined;
      }
    }

    // 2. Query Params Override (For Testing or Anonymous Personalization)
    if (searchParams.has('interests')) {
      context.interests = searchParams.get('interests')?.split(',') || [];
    }
    if (searchParams.has('propensity')) {
      context.propensity = searchParams.get('propensity') || undefined;
    }

    if (isNaN(context.months)) {
      return NextResponse.json({ error: 'Invalid months parameter' }, { status: 400 });
    }

    console.log(`[API] Generating Dashboard`, { context });
    const dashboardData = await ShelfComposer.compose(context);

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Display Engine Error:', error);
    // DB가 삭제/비활성 상태일 때 빈 대시보드 반환 (무한 루프 방지)
    return NextResponse.json({
      stage: {
        label: '준비 중',
        description: '큐레이션을 준비하고 있어요',
        roadmapStage: 'seed',
        coreCategories: [],
      },
      hero: null,
      spotlight: [],
      shelves: [],
      _error: 'DB 연결 실패 - 큐레이션 데이터를 불러올 수 없습니다.',
    });
  }
}
