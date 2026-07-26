-- Migration: Create RPC function to get member IDs who have bid without exposing bid amounts
CREATE OR REPLACE FUNCTION get_auction_bid_member_ids(p_period_id UUID)
RETURNS TABLE(member_id UUID) 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  RETURN QUERY SELECT ab.member_id FROM auction_bids ab WHERE ab.period_id = p_period_id;
END;
$$ LANGUAGE plpgsql;
