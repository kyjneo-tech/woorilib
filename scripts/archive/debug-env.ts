
import dotenv from 'dotenv';
import path from 'path';

console.log('--- ENV DEBUG ---');
console.log('CWD:', process.cwd());
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

console.log('URL EXISTS:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('ROLE_KEY EXISTS:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('ROLE_KEY PREFIX:', process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 10) + '...');
}
console.log('-----------------');
