-- Sửa lỗi dữ liệu dây hụi Elfie (Có người đang giữ số phần lớn hơn tổng số phần của dây)
-- Bạn hãy dán đoạn mã này vào Supabase Studio (SQL Editor) và ấn RUN nhé!

-- 1. Đưa số phần hụi của những ai lớn hơn tổng số phần hụi về lại 1 phần
UPDATE public.hui_members hm
SET shares = 1
FROM public.hui_groups hg
WHERE hm.group_id = hg.id 
  AND hg.name ILIKE '%Elfie%'
  AND hm.shares > hg.total_shares;

-- 2. Xóa các hóa đơn thu tiền (contributions) đã bị tính sai trước đó
DELETE FROM public.contributions
WHERE period_id IN (
  SELECT id FROM public.hui_periods WHERE group_id IN (
    SELECT id FROM public.hui_groups WHERE name ILIKE '%Elfie%'
  )
);

-- 3. Xóa các chứng từ giải ngân (payouts) đã bị tính sai
DELETE FROM public.payouts
WHERE period_id IN (
  SELECT id FROM public.hui_periods WHERE group_id IN (
    SELECT id FROM public.hui_groups WHERE name ILIKE '%Elfie%'
  )
);

-- 4. Reset trạng thái kỳ hụi về lúc đang đấu giá (draw_pending) để hệ thống tự tính lại từ đầu
UPDATE public.hui_periods
SET 
  status = 'draw_pending',
  payout_amount = 0,
  commission_amount = 0,
  winning_bid_amount = NULL,
  winning_bid_id = NULL,
  payout_member_id = NULL,
  draw_result = NULL
WHERE group_id IN (
  SELECT id FROM public.hui_groups WHERE name ILIKE '%Elfie%'
);
