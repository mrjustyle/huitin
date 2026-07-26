-- Fix các kỳ hụi bị kẹt trạng thái 'payment_open' (Đang thu tiền) 
-- do xóa tay (hoặc gộp member) khiến hệ thống không tự nhảy sang 'completed' (Đã thu đủ)
UPDATE public.hui_periods
SET status = 'completed', completed_at = NOW()
WHERE status = 'payment_open' 
  AND NOT EXISTS (
    SELECT 1 FROM public.contributions 
    WHERE period_id = public.hui_periods.id 
      AND status != 'confirmed'
  )
  AND EXISTS (
    SELECT 1 FROM public.contributions
    WHERE period_id = public.hui_periods.id
  );
