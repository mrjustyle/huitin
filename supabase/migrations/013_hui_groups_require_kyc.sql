-- 013_hui_groups_require_kyc.sql
-- Thêm cấu hình yêu cầu KYC cho Hụi viên

ALTER TABLE public.hui_groups 
ADD COLUMN require_kyc BOOLEAN DEFAULT false;
