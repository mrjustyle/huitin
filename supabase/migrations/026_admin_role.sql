-- 026_admin_role.sql
-- Thêm cột role vào user_profiles nếu chưa có
-- (Trong nhiều migrations trước có thể đã có, đây là upsert an toàn)

ALTER TABLE public.user_profiles 
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user' 
  CHECK (role IN ('user', 'admin', 'support'));

CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- Hướng dẫn: Để set một user làm admin, chạy lệnh sau trong Supabase SQL Editor:
-- UPDATE public.user_profiles SET role = 'admin' WHERE id = '<user_id>';
-- Hoặc tìm theo email:
-- UPDATE public.user_profiles SET role = 'admin' 
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'your@email.com');
