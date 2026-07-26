-- 012_fixed_interest_hui.sql
-- Thêm cột lãi cố định cho Hụi bốc thăm có lãi

ALTER TABLE public.hui_groups 
ADD COLUMN fixed_interest_amount INTEGER;

ALTER TABLE public.hui_groups
DROP CONSTRAINT IF EXISTS hui_groups_hui_type_check;

ALTER TABLE public.hui_groups
ADD CONSTRAINT hui_groups_hui_type_check 
CHECK (hui_type IN ('khong_lai', 'boc_tham', 'bo_hui', 'boc_tham_lai_co_dinh'));
