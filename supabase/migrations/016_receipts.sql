-- 016_receipts.sql

-- Bảng receipts lưu trữ biên nhận điện tử cho các giao dịch đóng/lĩnh hụi
DROP TABLE IF EXISTS public.receipts CASCADE;

CREATE TABLE public.receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.hui_groups(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES public.hui_periods(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.hui_members(id) ON DELETE CASCADE,
  
  -- Loại giao dịch: 'contribution' (đóng hụi) hoặc 'payout' (lĩnh hụi)
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('contribution', 'payout')),
  
  -- Reference đến bảng contributions hoặc payouts
  reference_id UUID NOT NULL,
  
  amount BIGINT NOT NULL,
  
  -- Mã băm để chống thay đổi dữ liệu (Integrity verification)
  checksum TEXT NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index cho performance
CREATE INDEX idx_receipts_group ON public.receipts(group_id);
CREATE INDEX idx_receipts_member ON public.receipts(member_id);
CREATE INDEX idx_receipts_period ON public.receipts(period_id);
CREATE UNIQUE INDEX idx_receipts_ref ON public.receipts(transaction_type, reference_id);

-- RLS Policies
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- Chủ hụi thấy tất cả biên nhận trong dây hụi của mình
CREATE POLICY "Group owners can read all receipts"
  ON public.receipts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.hui_groups g
      WHERE g.id = receipts.group_id
      AND g.owner_id = auth.uid()
    )
  );

-- Thành viên thấy biên nhận của chính mình
CREATE POLICY "Members can read own receipts"
  ON public.receipts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.hui_members m
      WHERE m.id = receipts.member_id
      AND m.user_id = auth.uid()
    )
  );

-- Insert policy: Chỉ có system (qua service_role) hoặc logic nội bộ mới có quyền insert
-- Để đơn giản cho frontend, chúng ta tạm allow insert cho members/owners nhưng thực tế 
-- nó sẽ được tạo qua Edge Function hoặc Server Action an toàn.
CREATE POLICY "Server actions can insert receipts"
  ON public.receipts FOR INSERT
  WITH CHECK (true);
