-- ============================================
-- FIX: Google OAuth profile + RLS recursion
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Fix the handle_new_user trigger to support Google OAuth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'email',
      ''
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'phone',
      NULL
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create missing profiles for existing auth users (Google OAuth users)
INSERT INTO public.user_profiles (id, full_name, phone)
SELECT 
  au.id,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    au.email,
    ''
  ),
  au.raw_user_meta_data->>'phone'
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_profiles up WHERE up.id = au.id
);

-- 3. Helper functions (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'support')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_group_owner(p_group_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.hui_groups 
    WHERE id = p_group_id AND owner_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 4. Fix ALL recursive RLS policies

-- ---- USER PROFILES ----
DROP POLICY IF EXISTS "members_read_group_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "admin_read_all_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "admin_update_profiles" ON public.user_profiles;

CREATE POLICY "admin_read_all_profiles" ON public.user_profiles
  FOR SELECT USING (public.is_admin());

CREATE POLICY "admin_update_profiles" ON public.user_profiles
  FOR UPDATE USING (public.is_admin());

-- ---- HUI GROUPS ----
DROP POLICY IF EXISTS "owner_manage_group" ON public.hui_groups;
DROP POLICY IF EXISTS "members_view_group" ON public.hui_groups;
DROP POLICY IF EXISTS "public_view_by_invite" ON public.hui_groups;
DROP POLICY IF EXISTS "admin_manage_groups" ON public.hui_groups;

CREATE POLICY "owner_manage_group" ON public.hui_groups
  FOR ALL USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "members_view_group" ON public.hui_groups
  FOR SELECT USING (
    id IN (SELECT group_id FROM public.hui_members WHERE user_id = auth.uid())
  );

CREATE POLICY "public_view_by_invite" ON public.hui_groups
  FOR SELECT USING (invite_code IS NOT NULL AND status = 'recruiting');

CREATE POLICY "admin_manage_groups" ON public.hui_groups
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---- HUI MEMBERS ----
DROP POLICY IF EXISTS "owner_manage_members" ON public.hui_members;
DROP POLICY IF EXISTS "members_view_group_members" ON public.hui_members;

CREATE POLICY "owner_manage_members" ON public.hui_members
  FOR ALL USING (public.is_group_owner(group_id));

CREATE POLICY "members_view_group_members" ON public.hui_members
  FOR SELECT USING (public.is_group_member(group_id));

-- ---- PERIODS ----
DROP POLICY IF EXISTS "owner_manage_periods" ON public.hui_periods;
CREATE POLICY "owner_manage_periods" ON public.hui_periods
  FOR ALL USING (public.is_group_owner(group_id));

-- ---- CONTRIBUTIONS ----
DROP POLICY IF EXISTS "owner_update_contribution" ON public.contributions;
CREATE POLICY "owner_update_contribution" ON public.contributions
  FOR UPDATE USING (
    period_id IN (SELECT p.id FROM public.hui_periods p WHERE public.is_group_owner(p.group_id))
  );

-- ---- PAYOUTS ----
DROP POLICY IF EXISTS "owner_manage_payouts" ON public.payouts;
CREATE POLICY "owner_manage_payouts" ON public.payouts
  FOR ALL USING (
    period_id IN (SELECT p.id FROM public.hui_periods p WHERE public.is_group_owner(p.group_id))
  );

-- ---- DISPUTES ----
DROP POLICY IF EXISTS "admin_manage_disputes" ON public.disputes;
CREATE POLICY "admin_manage_disputes" ON public.disputes
  FOR ALL USING (public.is_admin());

-- ---- KYC ----
DROP POLICY IF EXISTS "admin_manage_kyc" ON public.kyc_documents;
CREATE POLICY "admin_manage_kyc" ON public.kyc_documents
  FOR ALL USING (public.is_admin());

-- ---- RISK / AUDIT / NOTICES ----
DROP POLICY IF EXISTS "admin_manage_risk" ON public.risk_signals;
CREATE POLICY "admin_manage_risk" ON public.risk_signals FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "admin_view_audit" ON public.audit_events;
CREATE POLICY "admin_view_audit" ON public.audit_events FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "admin_view_notices" ON public.government_notices;
CREATE POLICY "admin_view_notices" ON public.government_notices FOR SELECT USING (public.is_admin());

-- ============================================
-- DONE! Fixed:
-- 1. Google OAuth trigger (supports name, full_name, email)
-- 2. Created missing profiles for existing users
-- 3. All RLS recursion issues
-- ============================================
