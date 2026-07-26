import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getAdminClient();
    const now = new Date().toISOString();

    // 1. Expire overdue subscriptions
    const { data: expired, error: expireError } = await supabase
      .from('user_subscriptions')
      .update({ status: 'expired' })
      .eq('status', 'active')
      .lt('expires_at', now)
      .select('user_id, expires_at');

    if (expireError) {
      console.error('[Cron/Subscriptions] Expire error:', expireError);
    }

    const expiredCount = expired?.length || 0;

    // 2. Find subscriptions expiring in 7 days (for reminder notifications)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const { data: expiringSoon } = await supabase
      .from('user_subscriptions')
      .select('user_id, expires_at')
      .eq('status', 'active')
      .gt('expires_at', now)
      .lt('expires_at', sevenDaysFromNow.toISOString());

    // 3. Send expiry reminder notifications
    for (const sub of expiringSoon || []) {
      const daysLeft = Math.ceil(
        (new Date(sub.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      // Check if we already sent a reminder today
      const today = new Date().toISOString().split('T')[0];
      const { data: existingNotif } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', sub.user_id)
        .eq('type', 'vip_expiry')
        .gte('created_at', `${today}T00:00:00Z`)
        .limit(1);

      if (!existingNotif || existingNotif.length === 0) {
        await supabase.from('notifications').insert({
          user_id: sub.user_id,
          type: 'vip_expiry',
          title: '💎 Gói VIP sắp hết hạn',
          body: `Gói VIP của bạn sẽ hết hạn trong ${daysLeft} ngày. Gia hạn ngay để không bị gián đoạn.`,
          link: '/vip',
        });
      }
    }

    return NextResponse.json({
      success: true,
      expired: expiredCount,
      expiringSoon: expiringSoon?.length || 0,
      timestamp: now,
    });
  } catch (err: any) {
    console.error('[Cron/Subscriptions] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
