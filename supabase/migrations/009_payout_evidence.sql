-- 009_payout_evidence.sql
-- Thêm cột bằng chứng chuyển khoản giải ngân (chủ hụi -> người lĩnh)

ALTER TABLE public.hui_periods 
ADD COLUMN payout_evidence_url TEXT;
