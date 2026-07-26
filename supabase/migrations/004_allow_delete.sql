-- ============================================
-- FIX 004: Allow owner to delete groups
-- Run this in Supabase SQL Editor
-- ============================================

-- Owner can delete their own groups
DROP POLICY IF EXISTS "owner_delete_group" ON public.hui_groups;
CREATE POLICY "owner_delete_group" ON public.hui_groups
  FOR DELETE USING (auth.uid() = owner_id);

-- Owner can delete members from their groups
DROP POLICY IF EXISTS "owner_delete_members" ON public.hui_members;
CREATE POLICY "owner_delete_members" ON public.hui_members
  FOR DELETE USING (public.is_group_owner(group_id));

-- Users can delete their own membership (withdraw)
DROP POLICY IF EXISTS "user_delete_own_membership" ON public.hui_members;
CREATE POLICY "user_delete_own_membership" ON public.hui_members
  FOR DELETE USING (user_id = auth.uid());
