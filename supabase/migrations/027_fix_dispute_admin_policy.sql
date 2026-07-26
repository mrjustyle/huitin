-- 027_fix_dispute_admin_policy.sql
-- Sau khi file 025 DROP TABLE disputes rồi tạo lại, 
-- policy admin_manage_disputes trong file 002 bị mất.
-- File này khôi phục lại policy admin cho disputes.

-- Đảm bảo hàm is_admin() tồn tại
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'support')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Khôi phục policy admin cho disputes
DROP POLICY IF EXISTS "admin_manage_disputes" ON public.disputes;
CREATE POLICY "admin_manage_disputes" ON public.disputes
  FOR ALL USING (public.is_admin());

-- Khôi phục policy admin cho audit_events (đề phòng bị mất tương tự)
DROP POLICY IF EXISTS "admin_view_audit" ON public.audit_events;
CREATE POLICY "admin_view_audit" ON public.audit_events
  FOR SELECT USING (public.is_admin());

-- Khôi phục policy admin cho chat_messages (nếu cần)
DROP POLICY IF EXISTS "admin_read_chat" ON public.chat_messages;
CREATE POLICY "admin_read_chat" ON public.chat_messages
  FOR SELECT USING (public.is_admin());
