import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// VIP plan prices
const VIP_PLANS: Record<number, number> = {
  99000: 1,      // 1 tháng
  990000: 12,    // 1 năm
};

// Verify webhook authenticity via API key
function verifyWebhook(req: NextRequest): boolean {
  const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '');
  const expectedKey = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!expectedKey) return true; // Skip verification if no secret configured
  return apiKey === expectedKey;
}

export async function POST(req: NextRequest) {
  // Verify webhook
  if (!verifyWebhook(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getAdminClient();
    const body = await req.json();

    // SePay/Casso webhook format:
    // { transferType: "in", content: "VIP username", transferAmount: 99000, ... }
    const {
      content,
      transferAmount,
      id: transactionId,
      transferType,
    } = body;

    // Only process incoming transfers
    if (transferType && transferType !== 'in') {
      return NextResponse.json({ success: true, message: 'Skipped outgoing transfer' });
    }

    // Parse VIP code from transfer content
    const match = (content || '').toUpperCase().match(/VIP\s+(\S+)/);
    if (!match) {
      console.log('[VIP Webhook] No VIP code found in:', content);
      return NextResponse.json({ success: true, message: 'Not a VIP payment' });
    }

    const userCode = match[1].toLowerCase();
    const amount = Number(transferAmount);

    // Determine plan duration
    const months = VIP_PLANS[amount];
    if (!months) {
      console.log('[VIP Webhook] Unknown amount:', amount);
      return NextResponse.json({ success: true, message: 'Amount does not match any plan' });
    }

    // Find user by email prefix or user ID prefix
    const { data: users } = await supabase
      .from('user_profiles')
      .select('id, email')
      .or(`email.ilike.${userCode}@%,id.ilike.${userCode}%`)
      .limit(1);

    if (!users || users.length === 0) {
      console.error('[VIP Webhook] User not found:', userCode);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = users[0].id;

    // Check for duplicate transaction (idempotency)
    if (transactionId) {
      const { data: existing } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('payment_ref', String(transactionId))
        .limit(1);

      if (existing && existing.length > 0) {
        return NextResponse.json({ success: true, message: 'Already processed' });
      }
    }

    // Deactivate old subscriptions
    await supabase
      .from('user_subscriptions')
      .update({ status: 'expired' })
      .eq('user_id', userId)
      .eq('status', 'active');

    // Create new VIP subscription
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);

    const { error } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        plan: 'vip',
        status: 'active',
        expires_at: expiresAt.toISOString(),
        payment_amount: amount,
        payment_ref: transactionId ? String(transactionId) : null,
        payment_method: 'bank_transfer',
      });

    if (error) {
      console.error('[VIP Webhook] DB error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    console.log(`[VIP Webhook] Activated VIP for ${userCode} (${months} months, expires ${expiresAt.toISOString()})`);

    return NextResponse.json({
      success: true,
      message: `VIP activated for ${months} months`,
      userId,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err: any) {
    console.error('[VIP Webhook] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Health check
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'vip-webhook' });
}
