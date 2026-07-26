import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8').split('\n');
let SUPABASE_URL = '', SUPABASE_KEY = '';
for (const line of env) {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) SUPABASE_URL = line.split('=')[1];
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) SUPABASE_KEY = line.split('=')[1];
}

async function run() {
  // Use service role key if available, else this will fail due to RLS
  // Wait, I can't use service role key if it's not in .env.local
  // Let me just create a Next.js API route that dumps the info, since I have local next dev server
}
run();
