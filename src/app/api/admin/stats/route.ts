import { NextResponse } from 'next/server';
import { AdminStatsService } from '../../../../features/admin/services/admin-stats.service';

export async function GET() {
  try {
    const stats = await AdminStatsService.getDashboardStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Stats API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}