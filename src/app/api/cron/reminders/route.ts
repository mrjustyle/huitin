import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cron này có thể được gọi mỗi ngày 1 lần bởi Vercel Cron hoặc Github Actions
export async function GET(request: Request) {
  try {
    // 1. Xác thực Request bằng SECRET KEY để tránh bị gọi bởi người lạ
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // Nếu có thiết lập CRON_SECRET thì bắt buộc phải đúng
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // 2. Khởi tạo Supabase client bằng Service Role Key để bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Thiếu biến môi trường Supabase.');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 3. Tìm các kỳ hụi sắp tới hạn trong 24 giờ tới (hoặc đã tới hạn hôm nay mà chưa hoàn thành)
    // Giả sử payment_due_date là hạn chót đóng tiền. 
    // Thông báo trước 1 ngày.
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];

    // Truy vấn các kỳ hụi có due_date = ngày mai hoặc ngày hôm nay
    const { data: periods, error: periodsError } = await supabase
      .from('hui_periods')
      .select('id, group_id, period_number, payment_due_date, status, hui_groups(name, owner_id)')
      .in('payment_due_date', [todayStr, tomorrowStr])
      .neq('status', 'completed')
      .neq('status', 'payout_confirmed');

    if (periodsError) throw periodsError;

    if (!periods || periods.length === 0) {
      return NextResponse.json({ success: true, message: 'Không có kỳ hụi nào sắp tới hạn.' });
    }

    // 4. Sinh thông báo cho các thành viên trong các dây hụi đó
    const notificationsToInsert = [];

    for (const period of periods) {
      const groupData = period.hui_groups as any;
      const groupName = groupData?.name || 'Dây hụi';
      const isDueToday = period.payment_due_date === todayStr;

      // Lấy danh sách thành viên trong dây hụi
      const { data: members, error: membersError } = await supabase
        .from('hui_members')
        .select('user_id')
        .eq('group_id', period.group_id);

      if (membersError || !members) continue;

      for (const member of members) {
        if (!member.user_id) continue;

        notificationsToInsert.push({
          user_id: member.user_id,
          type: 'payment_due',
          title: isDueToday ? 'Đến hạn đóng hụi!' : 'Sắp tới hạn đóng hụi',
          message: isDueToday 
            ? `Kỳ hụi số ${period.period_number} của dây "${groupName}" có hạn chót đóng tiền là hôm nay.`
            : `Ngày mai là hạn đóng tiền cho kỳ hụi số ${period.period_number} của dây "${groupName}". Vui lòng chuẩn bị tiền hụi.`,
          link: `/day-hui/${period.group_id}/ky/${period.id}`,
          is_read: false
        });
      }
    }

    // 5. Insert thông báo vào DB
    if (notificationsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notificationsToInsert);
        
      if (insertError) throw insertError;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Đã gửi ${notificationsToInsert.length} thông báo nhắc nhở thành công.` 
    });

  } catch (error: any) {
    console.error('Lỗi khi chạy Cron Reminders:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
