-- 010_member_confirm_payout.sql
-- Cho phép thành viên lĩnh hụi cập nhật trạng thái kỳ hụi thành payout_confirmed

CREATE POLICY "payout_member_confirm_period" ON public.hui_periods
  FOR UPDATE USING (
    payout_member_id IN (SELECT id FROM public.hui_members WHERE user_id = auth.uid())
  ) WITH CHECK (
    payout_member_id IN (SELECT id FROM public.hui_members WHERE user_id = auth.uid())
  );
