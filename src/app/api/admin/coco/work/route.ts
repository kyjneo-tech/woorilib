
import { NextResponse } from 'next/server';
import { CocoAgent } from '@/features/admin/services/coco-agent.service';

/**
 * 🐾 Coco's Secret Work API
 * Handles Harvest and Analysis commands from the UI.
 */
export async function POST(request: Request) {
  console.log('[COCO_WORK] 🚀 Received WORK request!');
  try {
    const { action } = await request.json();
    console.log(`[COCO_WORK] 🐾 Action requested: ${action}`);

    let result;
    if (action === 'harvest') {
      result = await CocoAgent.harvest();
    } else if (action === 'analyze') {
      result = await CocoAgent.analyze();
    } else {
      console.error('[COCO_WORK] ❌ Unknown action:', action);
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    console.log('[COCO_WORK] ✅ Action triggered successfully:', result.message);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[COCO_WORK] 💥 API ERROR:', error.message);
    return NextResponse.json({ error: 'Coco is taking a nap...', details: error.message }, { status: 500 });
  }
}
