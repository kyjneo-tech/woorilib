import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/shared/lib/supabase/server";
import { prisma } from "@/shared/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');
    const period = searchParams.get('period') || 'month'; // month, year

    // Base query condition
    const whereCondition: any = {
        user_id: user.id
    };

    if (childId && childId !== 'all') {
        whereCondition.child_id = childId;
    }

    // 1. Total Count (Lifetime)
    const totalCount = await prisma.reading_records.count({
        where: whereCondition
    });

    // 2. This Month Count
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthCount = await prisma.reading_records.count({
        where: {
            ...whereCondition,
            read_date: { gte: startOfMonth }
        }
    });

    // 3. Monthly Trend (Last 6 months)
    // Prisma grouping/aggregation limitations -> simplified approach:
    // We will simple fetch counts for last 6 months ranges.
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const start = new Date(d.getFullYear(), d.getMonth(), 1);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        
        const count = await prisma.reading_records.count({
            where: {
                ...whereCondition,
                read_date: { gte: start, lte: end }
            }
        });
        
        monthlyTrend.push({
            month: `${d.getMonth() + 1}월`,
            count
        });
    }

    // 4. Streak (Consecutive days) - Advanced, skipping for now or simple "Last 7 days"
    // Let's return last 7 days activity (heatmap data)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0,0,0,0);
        
        const nextD = new Date(d);
        nextD.setDate(d.getDate() + 1);

        const count = await prisma.reading_records.count({
            where: {
                ...whereCondition,
                read_date: { gte: d, lt: nextD }
            }
        });

        const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
        last7Days.push({
            day: dayNames[d.getDay()],
            date: d.getDate(),
            count
        });
    }

    return NextResponse.json({
        totalCount,
        thisMonthCount,
        monthlyTrend,
        last7Days
    });

  } catch (error) {
    console.error('Stats API Error:', error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
