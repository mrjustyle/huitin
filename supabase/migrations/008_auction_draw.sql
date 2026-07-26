-- Migration: Add auction_bids table and draw fields to hui_periods

-- Add draw-related columns to hui_periods (for bốc thăm)
ALTER TABLE public.hui_periods
  ADD COLUMN IF NOT EXISTS draw_result JSONB,
  ADD COLUMN IF NOT EXISTS draw_locked_at TIMESTAMPTZ;

-- Create auction_bids table (for bỏ hụi / đấu giá)
CREATE TABLE IF NOT EXISTS public.auction_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID NOT NULL REFERENCES public.hui_periods(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.hui_members(id) ON DELETE CASCADE,
  bid_amount BIGINT NOT NULL CHECK (bid_amount > 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(period_id, member_id)
);

-- Add auction-related columns to hui_periods
ALTER TABLE public.hui_periods
  ADD COLUMN IF NOT EXISTS auction_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS winning_bid_id UUID REFERENCES public.auction_bids(id),
  ADD COLUMN IF NOT EXISTS winning_bid_amount BIGINT;

-- RLS for auction_bids
ALTER TABLE public.auction_bids ENABLE ROW LEVEL SECURITY;

-- Members can insert/update their own bids
CREATE POLICY "Members can manage own bids" ON public.auction_bids
  FOR ALL USING (
    member_id IN (
      SELECT id FROM public.hui_members WHERE user_id = auth.uid()
    )
  );

-- Group owners can view all bids in their groups
CREATE POLICY "Owners can view bids" ON public.auction_bids
  FOR SELECT USING (
    period_id IN (
      SELECT hp.id FROM public.hui_periods hp
      JOIN public.hui_groups hg ON hp.group_id = hg.id
      WHERE hg.owner_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_auction_bids_period ON public.auction_bids(period_id);
CREATE INDEX IF NOT EXISTS idx_auction_bids_member ON public.auction_bids(member_id);
