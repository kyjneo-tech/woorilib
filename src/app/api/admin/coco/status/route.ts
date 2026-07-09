
import { NextResponse } from 'next/server';
import { CocoAgent } from '@/features/admin/services/coco-agent.service';

export async function GET() {
  console.log('[COCO_API] 🐾 Received request for status...');
  try {
    const status = await CocoAgent.getStatus();
    console.log('[COCO_API] ✅ Status fetched successfully:', {
      total: status.total,
      pending: status.pending,
      verified: status.verified,
      health: status.healthScore
    });
    return NextResponse.json(status);
  } catch (error: any) {
    console.error('[COCO_API] ❌ Failed to fetch status:', error.message);
    return NextResponse.json({ error: 'Coco is sleeping', details: error.message }, { status: 500 });
  }
}
