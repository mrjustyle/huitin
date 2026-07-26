-- =============================================
-- 024: VIP Subscription + Privacy Mode
-- =============================================

-- 1. Bảng quản lý subscription
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'vip')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  started_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Unique active subscription per user
  UNIQUE(user_id, status)
);

-- RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- User chỉ xem được subscription của mình
CREATE POLICY "users_read_own_subscription" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Admin có full quyền
CREATE POLICY "admin_all_subscriptions" ON public.user_subscriptions
  FOR ALL USING (public.is_admin());

-- 2. Thêm privacy_mode vào hui_groups
ALTER TABLE public.hui_groups ADD COLUMN IF NOT EXISTS privacy_mode BOOLEAN DEFAULT false;

-- 3. Index cho query nhanh
CREATE INDEX idx_subscriptions_user_status ON public.user_subscriptions(user_id, status);
