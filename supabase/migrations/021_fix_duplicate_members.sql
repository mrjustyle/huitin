-- Migration: Fix duplicate members and add UNIQUE constraint
-- 1. Cập nhật member_id của các contributions thuộc về member trùng (giữ lại member tạo đầu tiên)
UPDATE public.contributions
SET member_id = (
  SELECT hm2.id FROM public.hui_members hm2 
  WHERE hm2.group_id = (SELECT group_id FROM public.hui_members hm3 WHERE hm3.id = public.contributions.member_id) 
    AND hm2.user_id = (SELECT user_id FROM public.hui_members hm4 WHERE hm4.id = public.contributions.member_id)
  ORDER BY hm2.joined_at ASC 
  LIMIT 1
)
WHERE member_id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER( PARTITION BY group_id, user_id ORDER BY joined_at ASC ) AS rn
    FROM public.hui_members
  ) t WHERE t.rn > 1
);

-- 2. Cập nhật tương tự cho payouts
UPDATE public.payouts
SET recipient_member_id = (
  SELECT hm2.id FROM public.hui_members hm2 
  WHERE hm2.group_id = (SELECT group_id FROM public.hui_members hm3 WHERE hm3.id = public.payouts.recipient_member_id) 
    AND hm2.user_id = (SELECT user_id FROM public.hui_members hm4 WHERE hm4.id = public.payouts.recipient_member_id)
  ORDER BY hm2.joined_at ASC 
  LIMIT 1
)
WHERE recipient_member_id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER( PARTITION BY group_id, user_id ORDER BY joined_at ASC ) AS rn
    FROM public.hui_members
  ) t WHERE t.rn > 1
);

-- 3. Xóa các thành viên bị trùng lặp
DELETE FROM public.hui_members
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER( PARTITION BY group_id, user_id ORDER BY joined_at ASC ) AS rn
    FROM public.hui_members
  ) t WHERE t.rn > 1
);

-- 4. Thêm ràng buộc vĩnh viễn không bao giờ bị trùng lặp user trong 1 dây hụi
ALTER TABLE public.hui_members ADD CONSTRAINT unique_group_user UNIQUE (group_id, user_id);
