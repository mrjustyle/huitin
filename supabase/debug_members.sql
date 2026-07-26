-- Quick debug: Check hui_members data
-- Run in Supabase SQL Editor

-- 1. See all members
SELECT hm.*, up.full_name 
FROM hui_members hm
LEFT JOIN user_profiles up ON up.id = hm.user_id
ORDER BY hm.created_at DESC;

-- 2. See all groups
SELECT id, name, owner_id, status, invite_code 
FROM hui_groups 
ORDER BY created_at DESC;

-- 3. Check RLS policies on hui_members
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'hui_members';

-- 4. Check if is_group_member function works
-- Replace the UUID with an actual group_id from query 2
-- SELECT public.is_group_member('YOUR-GROUP-ID-HERE');
