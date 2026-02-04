
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Initial Seed Tasks (If empty)
const DEFAULT_TASKS = [
  { 
    category: 'daily', 
    task_name: '오늘의 신입 도서 검수 (AI가 헷갈려 하는 책들을 직접 승인해주세요!)', 
    reset_cycle: 'daily', 
    command: '' 
  },
  { 
    category: 'weekly', 
    task_name: '야간 배송 가동 (우리 도서관의 책장을 더 풍성하게 채워요! 키워드별 대량 수집)', 
    reset_cycle: 'weekly', 
    command: 'npx tsx scripts/curation/seed-keywords.ts' 
  },
  { 
    category: 'weekly', 
    task_name: 'AI 시스템 종합 검수 (저(Agent)에게 시스템을 낱낱이 파헤쳐달라고 시키세요! 90점 미만이면 로직 보완 필수)', 
    reset_cycle: 'weekly', 
    command: 'npx tsx scripts/qa/run-ai-audit.ts 실행하고 결과 분석해줘' 
  },
  { 
    category: 'special', 
    task_name: '전체 도서 로직 최신화 (분류 규칙 코드를 수정했다면, 이 명령어로 모든 책을 한 번에 똑똑하게 만드세요!)', 
    reset_cycle: '', 
    command: 'npx tsx scripts/curation/re-audit-all.ts' 
  },
  { 
    category: 'monthly', 
    task_name: '전집 사냥 모드 (부모님들이 열광하는 인기 전집의 낱권들을 체계적으로 수집합니다)', 
    reset_cycle: 'monthly', 
    command: 'npx tsx scripts/curation/fetch-collections.ts' 
  },
];

export async function GET() {
  try {
    // 1. Get Tasks
    let tasks = await prisma.admin_tasks.findMany({ orderBy: { created_at: 'asc' } });
    
    // Seed if empty
    if (tasks.length === 0) {
      console.log('Seeding default tasks...');
      for (const task of DEFAULT_TASKS) {
          await prisma.admin_tasks.create({ data: task });
      }
      tasks = await prisma.admin_tasks.findMany({ orderBy: { created_at: 'asc' } });
    }

    // Reset Logic (Simple Check)
    // In real app, Cron job does this. Here, we check on GET.
    const today = new Date().setHours(0,0,0,0);
    for (const task of tasks) {
        if (task.is_completed && task.completed_at) {
            const completedDate = new Date(task.completed_at).setHours(0,0,0,0);
            if (task.reset_cycle === 'daily' && completedDate < today) {
                await prisma.admin_tasks.update({ where: { id: task.id }, data: { is_completed: false } });
            }
            // Weekly logic omitted for brevity
        }
    }
    
    // Refresh tasks after reset check
    tasks = await prisma.admin_tasks.findMany({ orderBy: { created_at: 'asc' } });

    // 2. Get Backlog
    const backlog = await prisma.system_backlog.findMany({ orderBy: { created_at: 'desc' } });

    return NextResponse.json({ tasks, backlog });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (body.type === 'backlog') {
        const item = await prisma.system_backlog.create({
            data: {
                type: body.category, // bug, improvement
                content: body.content,
                priority: body.priority
            }
        });
        return NextResponse.json(item);
    }
    
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (body.type === 'task') {
        const task = await prisma.admin_tasks.update({
            where: { id: body.id },
            data: { 
                is_completed: body.is_completed,
                completed_at: body.is_completed ? new Date() : null
            }
        });
        return NextResponse.json(task);
    }
    
    if (body.type === 'backlog') {
        const item = await prisma.system_backlog.update({
            where: { id: body.id },
            data: { status: body.status }
        });
        return NextResponse.json(item);
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
