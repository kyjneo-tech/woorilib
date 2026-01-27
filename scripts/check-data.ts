
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load env
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
}

// Init Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log('📊 Checking Collected Data...\n');

  // 1. Library Curations Distribution
  const { data: distribution, error: dError } = await supabase
    .from('library_curations')
    .select('age_group, is_purified');
  
  if (dError) {
    console.error('Error fetching library_curations:', dError);
  } else {
    // Group manually
    const summary = distribution?.reduce((acc: any, curr) => {
      const age = curr.age_group || 'Unknown';
      if (!acc[age]) acc[age] = { Total: 0, Verified: 0 };
      acc[age].Total++;
      if (curr.is_purified) acc[age].Verified++;
      return acc;
    }, {});

    console.log(`📊 Library Curations Distribution (Internal DB):`);
    console.table(summary);
  }

  // 2. Sample Data for 0-2 Age Group
  const { data: babyBooks, error: bError } = await supabase
    .from('library_curations')
    .select('title, publisher, loan_count, is_purified')
    .eq('age_group', 0)
    .order('loan_count', { ascending: false })
    .limit(10);

  if (bError) {
    console.error('Error fetching baby books:', bError);
  } else {
    console.log(`\n👶 Top 10 Books for Age 0-2 (Internal DB):`);
    console.table(babyBooks?.map(b => ({
      Title: b.title.substring(0, 30),
      Publisher: b.publisher,
      Loans: b.loan_count,
      Verified: b.is_purified ? '✅' : '❌'
    })));
  }
}

checkData();
