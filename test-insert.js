require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false }, global: { fetch: fetch } }
);

async function run() {
  const { data: p } = await supabase.from('hui_periods').select('*').order('created_at', { ascending: false }).limit(1);
  if (p && p.length > 0) {
    const periodId = p[0].id;
    console.log('Testing insert for period:', periodId);
    
    // Attempt dummy insert
    const { data: member } = await supabase.from('hui_members').select('id').limit(1);
    if (member && member.length > 0) {
      const contrib = {
        period_id: periodId,
        member_id: member[0].id,
        share_number: 1,
        amount_due: 100000,
        status: 'pending'
      };
      const { error } = await supabase.from('contributions').insert(contrib);
      console.log('Insert contribution error:', error);
      
      const payout = {
        period_id: periodId,
        recipient_member_id: member[0].id,
        amount: 1000000,
        commission_deducted: 0,
        net_amount: 1000000,
        status: 'pending'
      };
      const { error: payoutErr } = await supabase.from('payouts').insert(payout);
      console.log('Insert payout error:', payoutErr);
    }
  }
}
run();
