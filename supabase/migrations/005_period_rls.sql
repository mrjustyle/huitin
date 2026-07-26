-- ============================================
-- 005_period_rls.sql
-- RLS policies for periods, contributions, and payouts
-- ============================================

-- ============================================
-- 8. HUI PERIODS
-- ============================================
ALTER TABLE public.hui_periods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members_view_periods" ON public.hui_periods;
CREATE POLICY "members_view_periods"
  ON public.hui_periods
  FOR SELECT
  USING (is_group_member(group_id));

DROP POLICY IF EXISTS "owner_manage_periods" ON public.hui_periods;
CREATE POLICY "owner_manage_periods"
  ON public.hui_periods
  FOR ALL
  USING (is_group_owner(group_id));

-- ============================================
-- 9. CONTRIBUTIONS
-- ============================================
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;

-- Hàm helper để lấy group_id từ period_id
CREATE OR REPLACE FUNCTION get_group_id_from_period(p_id UUID)
RETURNS UUID AS $$
  SELECT group_id FROM public.hui_periods WHERE id = p_id;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Ai trong dây hụi cũng có thể xem các khoản đóng tiền
DROP POLICY IF EXISTS "members_view_contributions" ON public.contributions;
CREATE POLICY "members_view_contributions"
  ON public.contributions
  FOR SELECT
  USING (is_group_member(get_group_id_from_period(period_id)));

-- Thành viên có thể cập nhật đóng tiền của chính mình (để tải lên chứng từ)
DROP POLICY IF EXISTS "members_update_own_contributions" ON public.contributions;
CREATE POLICY "members_update_own_contributions"
  ON public.contributions
  FOR UPDATE
  USING (
    member_id IN (
      SELECT id FROM public.hui_members WHERE user_id = auth.uid()
    )
  );

-- Chủ hụi có thể quản lý tất cả khoản đóng tiền
DROP POLICY IF EXISTS "owner_manage_contributions" ON public.contributions;
CREATE POLICY "owner_manage_contributions"
  ON public.contributions
  FOR ALL
  USING (is_group_owner(get_group_id_from_period(period_id)));

-- ============================================
-- 10. PAYOUTS
-- ============================================
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- Ai trong dây hụi cũng có thể xem các khoản nhận hụi
DROP POLICY IF EXISTS "members_view_payouts" ON public.payouts;
CREATE POLICY "members_view_payouts"
  ON public.payouts
  FOR SELECT
  USING (is_group_member(get_group_id_from_period(period_id)));

-- Chủ hụi quản lý chi hụi
DROP POLICY IF EXISTS "owner_manage_payouts" ON public.payouts;
CREATE POLICY "owner_manage_payouts"
  ON public.payouts
  FOR ALL
  USING (is_group_owner(get_group_id_from_period(period_id)));
