require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  const { data: users } = await supabase.auth.admin.listUsers();
  // We can't auth easily, but we can query directly
  
  const memberIds = ['some-id']; // We'll just fetch all for test
  
  const { data: c, error: e1 } = await supabase
    .from('contributions')
    .select('id, amount_due, period_id, hui_periods!inner(id, period_number, payment_due_date, group_id, hui_groups!inner(name))')
    .eq('status', 'pending');
    
  console.log("contributions:", JSON.stringify(c, null, 2), e1);
  
  const { data: p, error: e2 } = await supabase
    .from('hui_periods')
    .select('id, period_number, payout_amount, commission_amount, group_id, hui_groups!inner(name)')
    .in('status', ['payment_open', 'payout_pending']);
    
  console.log("payouts:", JSON.stringify(p, null, 2), e2);
}

main().catch(console.error);
