require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function cleanDb() {
  console.log('Cleaning Supabase Cloud Database...');
  
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  // Delete all disputes
  let { error: err1 } = await supabaseAdmin.from('disputes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('Disputes cleaned:', !err1);

  // Delete all hui periods
  let { error: err2 } = await supabaseAdmin.from('hui_periods').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('Hui periods cleaned:', !err2);

  // Delete all hui groups
  let { error: err3 } = await supabaseAdmin.from('hui_groups').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('Hui groups cleaned:', !err3);

  console.log('Done!');
}

cleanDb();
