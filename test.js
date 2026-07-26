require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    realtime: {
      params: {
        eventsPerSecond: 2
      }
    },
    auth: {
      persistSession: false
    },
    global: {
      fetch: fetch
    }
  }
);

// We need to disable websocket in supabase js? Just use fetch.
async function run() {
  const { data: p, error: pErr } = await supabase.from('hui_periods').select('id').order('created_at', { ascending: false }).limit(1);
  if (pErr) console.error(pErr);
  if (p && p.length > 0) {
    const { data: c, error: cErr } = await supabase.from('contributions').select('*').eq('period_id', p[0].id);
    if (cErr) console.error(cErr);
    console.log("Contributions:", JSON.stringify(c, null, 2));
    
    const { data: m } = await supabase.from('hui_members').select('*').limit(2);
    console.log("Members:", JSON.stringify(m, null, 2));
  }
}
run();
