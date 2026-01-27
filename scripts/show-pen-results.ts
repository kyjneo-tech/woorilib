
import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
}

const prisma = new PrismaClient();

async function showResults() {
  console.log('📊 Final Verified Database Entries (Pen Compatibility):\n');

  const targets = [
    '놀라운 자연',
    '아람 자연이랑',
    '라라랜드', 
    '내 친구 수학공룡', 
    '추피의 생활이야기', 
    '뽀로로 생활 동화'
  ];

  for (const title of targets) {
     const cols = await prisma.collection.findMany({
        where: { title: { contains: title } }
     });

     for (const col of cols) {
        console.log(`📘 [${col.title}]`);
        console.log(`   Publisher: ${col.publisher}`);
        console.log(`   Features JSON:`, JSON.stringify(col.features, null, 2));
        console.log('--------------------------------------------------');
     }
  }
  
  await prisma.$disconnect();
}

showResults();
