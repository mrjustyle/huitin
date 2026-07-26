-- 011_auction_bid_limits.sql
-- Thêm cấu hình giá thầu tối thiểu và tối đa cho Hụi đấu giá (auction)

ALTER TABLE public.hui_groups 
ADD COLUMN min_bid INTEGER,
ADD COLUMN max_bid INTEGER;
