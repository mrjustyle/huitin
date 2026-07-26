-- 025_chat_and_disputes.sql

-- 1. Bảng Chat (Trò chuyện nội bộ dây hụi)
DROP TABLE IF EXISTS public.chat_messages CASCADE;

CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.hui_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_messages_group ON public.chat_messages(group_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);

-- Bật RLS cho chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Ai nằm trong dây hụi (chủ hoặc hụi viên) mới được đọc tin nhắn
CREATE POLICY "Group members and owner can read chat"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.hui_groups g
      WHERE g.id = chat_messages.group_id
      AND (
        g.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.hui_members m
          WHERE m.group_id = g.id AND m.user_id = auth.uid()
        )
      )
    )
  );

-- Policy: Ai nằm trong dây hụi (chủ hoặc hụi viên) mới được gửi tin nhắn
CREATE POLICY "Group members and owner can insert chat"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.hui_groups g
      WHERE g.id = chat_messages.group_id
      AND (
        g.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.hui_members m
          WHERE m.group_id = g.id AND m.user_id = auth.uid()
        )
      )
    )
  );

-- Bật Supabase Realtime cho bảng chat_messages
alter publication supabase_realtime add table public.chat_messages;


-- 2. Bảng Khiếu nại (Disputes)
DROP TABLE IF EXISTS public.disputes CASCADE;

CREATE TABLE public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.hui_groups(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES public.hui_periods(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  evidence_url TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'closed')),
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_disputes_group ON public.disputes(group_id);
CREATE INDEX idx_disputes_period ON public.disputes(period_id);

-- Bật RLS cho disputes
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- Chủ hụi có thể thấy tất cả khiếu nại trong dây của mình
CREATE POLICY "Group owner can read all disputes"
  ON public.disputes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.hui_groups g
      WHERE g.id = disputes.group_id
      AND g.owner_id = auth.uid()
    )
  );

-- Thành viên chỉ thấy khiếu nại do chính mình tạo
CREATE POLICY "Members can read own disputes"
  ON public.disputes FOR SELECT
  USING (
    reporter_id = auth.uid()
  );

-- Hụi viên hoặc chủ hụi có quyền tạo khiếu nại
CREATE POLICY "Members can insert disputes"
  ON public.disputes FOR INSERT
  WITH CHECK (
    reporter_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.hui_groups g
      WHERE g.id = disputes.group_id
      AND (
        g.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.hui_members m
          WHERE m.group_id = g.id AND m.user_id = auth.uid()
        )
      )
    )
  );
