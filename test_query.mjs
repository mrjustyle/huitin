import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://smcmawmfrftbpmpvmitm.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtY21hd21mcmZ0YnBtcHZtaXRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwNzc5NDcsImV4cCI6MjA5OTY1Mzk0N30.SeV7YzjiM991FBtmakCND9V-3MJYym_1s2-v74eJavA');

async function check() {
  const { data: groups } = await supabase.from('hui_groups').select('id, name').ilike('name', '%Elfie%');
  if (!groups || groups.length === 0) {
    console.log('No Elfie group found');
    return;
  }
  console.log('Group:', groups[0]);

  const { data: periods } = await supabase.from('hui_periods').select('*').eq('group_id', groups[0].id).order('period_number');
  console.log('Periods:', periods.map(p => ({
    num: p.period_number,
    status: p.status,
    winning_bid: p.winning_bid_amount,
    payout: p.payout_amount,
    commission: p.commission_amount
  })));
  
  const { data: members } = await supabase.from('hui_members').select('*').eq('group_id', groups[0].id);
  console.log('Members count:', members.length, 'Total shares sum:', members.reduce((sum, m) => sum + m.shares, 0));
}
check();
