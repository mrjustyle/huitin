import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env.local', 'utf-8').split('\n');
for (const line of env) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) process.env[match[1]] = match[2].replace(/["']/g, '');
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('hui_members').select('*');
  console.log('Members:', data?.length);
  console.log('Sample:', data ? data[0] : error);
}
run();
