import { prisma } from '@/shared/lib/prisma';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface CocoStatus {
  total: number;
  pending: number;
  verified: number;
  healthScore: number;
  message: string;
  mood: 'happy' | 'hungry' | 'busy' | 'alert';
}

/**
 * 🤖 Data Agent 'Coco' Persona & Action Engine
 */
export class CocoAgent {
  static async getStatus(): Promise<CocoStatus> {
    const total = await prisma.verified_books.count();
    const pending = await prisma.verified_books.count({ where: { verification_status: 'pending' } });
    const verified = await prisma.verified_books.count({ where: { verification_status: 'verified' } });

    const healthScore = total > 0 ? Math.round((verified / total) * 100) : 0;

    let message = "";
    let mood: CocoStatus['mood'] = 'happy';

    if (total === 0) {
      message = "주인님! 창고가 텅 비어있어요. 제가 나가서 책을 좀 물어올까요? 🐾";
      mood = 'hungry';
    } else if (pending > 1000) {
      message = `킁킁... 분석해야 할 책이 ${pending.toLocaleString()}권이나 쌓여있어요! 저 공부 좀 시켜주세요! 멍! 🐾`;
      mood = 'busy';
    } else if (healthScore > 90) {
      message = "모든 데이터가 완벽하게 정제되었어요! 전 세상에서 제일 행복한 강아지예요! ✨🐾";
      mood = 'happy';
    } else {
      message = `현재 우리 도서관은 ${total.toLocaleString()}권의 지식을 보유 중입니다. 오늘도 열심히 관리할게요! 멍! 🐾`;
      mood = 'happy';
    }

    return { total, pending, verified, healthScore, message, mood };
  }

  /**
   * 🐾 Coco Action: Harvest (Syncing Data)
   */
  static async harvest() {
    const projectRoot = process.cwd();
    console.log(`[COCO] 🚀 Launching HARVEST via Master Worker from ${projectRoot}...`);

    // Use the unified master worker for stability
    const cmd = `npx tsx scripts/coco-master-worker.ts harvest`;

    exec(cmd, {
      cwd: projectRoot,
      env: { ...process.env, NODE_ENV: process.env.NODE_ENV || 'development' }
    }, (err, stdout, stderr) => {
      console.log(`[COCO_EXEC_HARVEST] STDOUT: ${stdout}`);
      if (err) {
        console.error('[COCO_EXEC_HARVEST] ❌ CRASHED:', err.message);
        console.error(`[COCO_EXEC_HARVEST] ERROR DETAILS: ${JSON.stringify(err)}`);
        return;
      }
      if (stderr) console.warn('[COCO_EXEC_HARVEST] ⚠️ WARNING:', stderr);
      console.log('[COCO_EXEC_HARVEST] ✅ FINISHED SUCCESSFULLY!');
    });

    return { success: true, message: "수집 프로젝트를 가동했습니다! 멍!" };
  }

  /**
   * 🐾 Coco Action: Analyze (Enriching Data)
   */
  static async analyze() {
    const projectRoot = process.cwd();
    console.log(`[COCO] 🚀 Launching ANALYSIS via Master Worker from ${projectRoot}...`);

    // Use 'enrich' mission in master worker
    const cmd = `npx tsx scripts/coco-master-worker.ts enrich`;

    exec(cmd, {
      cwd: projectRoot,
      env: { ...process.env }
    }, (err, stdout, stderr) => {
      console.log(`[COCO_EXEC_ANALYZE] STDOUT: ${stdout}`);
      if (err) {
        console.error('[COCO_EXEC_ANALYZE] ❌ CRASHED:', err.message);
        console.error(`[COCO_EXEC_ANALYZE] ERROR DETAILS: ${JSON.stringify(err)}`);
        return;
      }
      if (stderr) console.warn('[COCO_EXEC_ANALYZE] ⚠️ WARNING:', stderr);
      console.log('[COCO_EXEC_ANALYZE] ✅ FINISHED SUCCESSFULLY!');
    });

    return { success: true, message: "지능형 분석을 시작했습니다! 멍!" };
  }
}
