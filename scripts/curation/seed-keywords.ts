import { spawn } from 'child_process';
import path from 'path';

// The "Must-Have" Keyword List
const ESSENTIAL_KEYWORDS = [
  '공룡', '동물', '곤충', '우주', '식물', '바다생물', '자동차', '기차', '비행기', '수학동화', '과학동화',
  '말하기', '한글', '영어', '알파벳', '의성어', '의태어', '전래동화', '명작동화', '첫그림책',
  '친구', '가족', '배려', '약속', '어린이집', '유치원', '감정', '인성동화', '생활동화',
  '색깔', '모양', '피아노', '악기', '미술', '음악', '노래', '사운드북',
  '배변훈련', '양치', '목욕', '잠자기', '골고루 먹기', '안전', '신체놀이', '촉감책'
];

const BATCH_SIZE = 10; 
const AGE_GROUPS = [1, 3, 5]; 

function runScript(command: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Simply spawn the shell command. The shell will handle env vars if they are in the string.
    const process = spawn(command, {
      stdio: 'inherit',
      shell: true
    });

    process.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Script exited with code ${code}`));
    });
  });
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log(`🚀 Starting Auto-Seeder...`);
  
  // Hardcode the key for safety in this script context if process.env fails
  // In real app, use dotenv flow.
  const API_KEY = process.env.ALADIN_TTB_KEY || 'ttbkyjneo0057001';

  for (const age of AGE_GROUPS) {
    console.log(`
📅 Processing Age Group: ${age} years...`);
    
    for (const keyword of ESSENTIAL_KEYWORDS) {
      console.log(`   🔎 Keyword: "${keyword}"`);
      
      try {
        // Inline the env var into the command string for max compatibility
        const cmd = `ALADIN_TTB_KEY=${API_KEY} npx tsx scripts/curation/fetch-candidates.ts --keyword="${keyword}" --age=${age} --count=${BATCH_SIZE} | npx tsx scripts/curation/save-verified.ts`;
        
        await runScript(cmd);
        
        await sleep(3000); // 3s delay
        
      } catch (e) {
        console.error(`   ❌ Failed processing "${keyword}":`, e);
      }
    }
  }
  
  console.log('\n🎉 Auto-Seeder Completed!');
}

main();