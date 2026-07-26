import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8').split('\n');
let SUPABASE_URL = '', SUPABASE_KEY = '';
for (const line of env) {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) SUPABASE_URL = line.split('=')[1];
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) SUPABASE_KEY = line.split('=')[1];
}

async function fetchDb(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });
  return res.json();
}

async function run() {
  const groups = await fetchDb('hui_groups?name=ilike.*Elfie*&select=*');
  if (!groups || groups.length === 0) { console.log('No group'); return; }
  const group = groups[0];
  const members = await fetchDb(`hui_members?group_id=eq.${group.id}&select=*`);
  const periods = await fetchDb(`hui_periods?group_id=eq.${group.id}&select=*`);
  const contributions = await fetchDb(`contributions?period_id=eq.${periods[0].id}&select=*`);
  console.log(JSON.stringify({ group, members, periods, contributions }, null, 2));
}
run();
