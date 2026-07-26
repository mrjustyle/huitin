-- ============================================
-- FIX 003: Members not showing + profile join fix
-- Run this in Supabase SQL Editor AFTER 002
-- ============================================

-- 1. Allow users to insert themselves as members (for joining via invite)
DROP POLICY IF EXISTS "user_join_group" ON public.hui_members;
CREATE POLICY "user_join_group" ON public.hui_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 2. Members can view their own membership
DROP POLICY IF EXISTS "user_view_own_membership" ON public.hui_members;
CREATE POLICY "user_view_own_membership" ON public.hui_members
  FOR SELECT USING (user_id = auth.uid());

-- 3. Members can update own membership (e.g., sign agreement)
DROP POLICY IF EXISTS "user_update_own_membership" ON public.hui_members;
CREATE POLICY "user_update_own_membership" ON public.hui_members
  FOR UPDATE USING (user_id = auth.uid());

-- 4. Recreate members_read_group_profiles on user_profiles
-- (was dropped by 002 but not recreated!)
DROP POLICY IF EXISTS "members_read_group_profiles" ON public.user_profiles;
CREATE POLICY "members_read_group_profiles" ON public.user_profiles
  FOR SELECT USING (
    id IN (
      SELECT hm.user_id FROM public.hui_members hm
      WHERE hm.group_id IN (
        SELECT hm2.group_id FROM public.hui_members hm2
        WHERE hm2.user_id = auth.uid()
      )
    )
  );

-- 5. Ensure agreements table has proper policies
DROP POLICY IF EXISTS "group_member_view_agreement" ON public.hui_agreements;
CREATE POLICY "group_member_view_agreement" ON public.hui_agreements
  FOR SELECT USING (public.is_group_member(group_id));

DROP POLICY IF EXISTS "owner_manage_agreement" ON public.hui_agreements;
CREATE POLICY "owner_manage_agreement" ON public.hui_agreements
  FOR ALL USING (public.is_group_owner(group_id))
  WITH CHECK (public.is_group_owner(group_id));

-- 6. Agreement signatures policies
DROP POLICY IF EXISTS "member_view_signatures" ON public.agreement_signatures;
CREATE POLICY "member_view_signatures" ON public.agreement_signatures
  FOR SELECT USING (
    agreement_id IN (
      SELECT id FROM public.hui_agreements WHERE public.is_group_member(group_id)
    )
  );

DROP POLICY IF EXISTS "user_sign_agreement" ON public.agreement_signatures;
CREATE POLICY "user_sign_agreement" ON public.agreement_signatures
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================
-- DONE! Fixed:
-- 1. Users can insert themselves as members
-- 2. Users can see their own membership
-- 3. Members can see other members' profiles
-- 4. Agreement viewing + signing policies
-- ============================================
