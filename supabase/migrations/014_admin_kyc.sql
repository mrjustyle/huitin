-- 014_admin_kyc.sql
-- Thêm hàm SECURITY DEFINER để duyệt KYC (bỏ qua RLS của bảng user_profiles)

CREATE OR REPLACE FUNCTION public.admin_update_kyc_status(target_user_id UUID, new_status TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Kiểm tra trạng thái hợp lệ
  IF new_status NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Trạng thái KYC không hợp lệ';
  END IF;

  -- 2. Cập nhật bảng user_profiles
  UPDATE public.user_profiles
  SET 
    kyc_status = new_status,
    kyc_approved_at = CASE WHEN new_status = 'approved' THEN now() ELSE null END,
    kyc_reviewed_by = auth.uid(), -- Ghi nhận người duyệt là admin hiện tại đang gọi hàm
    updated_at = now()
  WHERE id = target_user_id;

  -- 3. Cập nhật bảng kyc_documents
  UPDATE public.kyc_documents
  SET
    reviewed_at = now(),
    reviewed_by = auth.uid()
  WHERE user_id = target_user_id;
  
END;
$$;
