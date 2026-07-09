import { execSync } from 'child_process';

/**
 * Total Data Pipeline Dispatcher
 * This script runs the entire sequence from sync to enrichment.
 */
async function runPipeline() {
  console.log('[COCO] Starting Total Data Pipeline...');
  
  try {
    // 1. Sync Raw Data (Library Naru)
    console.log('\n[COCO] Step 1/3: Syncing raw data from Library Naru...');
    execSync('npm run data:sync', { stdio: 'inherit' });

    // 2. Sync Bestseller Data (Aladin)
    console.log('\n[COCO] Step 2/3: Reinforcing with Aladin Bestsellers...');
    execSync('npx tsx scripts/sync-aladin-data.ts', { stdio: 'inherit' });
    
    // 3. AI Enrichment (High-Precision Analysis)
    console.log('\n[COCO] Step 3/3: Running AI Enrichment for professional data...');
    execSync('npm run data:enrich', { stdio: 'inherit' });

    console.log('\n[COCO] All systems green! Data pipeline completed successfully.');
  } catch (error) {
    console.error('\n[COCO] Pipeline failed during execution. Please check the logs.');
    process.exit(1);
  }
}

runPipeline();