-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'payment_due', 'payment_confirmed', 'auction_won', 'payout_received', 'info'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT, -- optional URL to redirect to when clicked
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications (e.g., mark as read)" ON public.notifications;
CREATE POLICY "Users can update their own notifications (e.g., mark as read)"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (true); -- Allow insertion via service role or triggers

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(user_id, is_read);

-- Set up realtime (idempotent)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ==========================================
-- AUTOMATIC NOTIFICATION TRIGGERS
-- ==========================================

-- 1. Notify when payment is due (when hui_periods status changes to payment_open)
CREATE OR REPLACE FUNCTION notify_payment_open() RETURNS TRIGGER AS $$
DECLARE
    m RECORD;
    g RECORD;
BEGIN
    IF NEW.status = 'payment_open' AND OLD.status IS DISTINCT FROM 'payment_open' THEN
        -- Get group info
        SELECT * INTO g FROM hui_groups WHERE id = NEW.group_id;
        
        -- Get all active members (including owner if they participate)
        FOR m IN SELECT * FROM hui_members WHERE group_id = NEW.group_id AND status = 'active'
        LOOP
            -- Check if this member is the winner of the period
            IF NEW.payout_member_id IS NOT NULL AND m.id = NEW.payout_member_id THEN
                INSERT INTO notifications (user_id, type, title, message, link)
                VALUES (
                    m.user_id, 
                    'auction_won', 
                    'Chúc mừng trúng hụi', 
                    'Chúc mừng! Bạn đã trúng hụi kỳ ' || NEW.period_number || ' của dây hụi "' || g.name || '".', 
                    '/day-hui/' || NEW.group_id || '/ky/' || NEW.id
                );
            ELSE
                INSERT INTO notifications (user_id, type, title, message, link)
                VALUES (
                    m.user_id, 
                    'payment_due', 
                    'Kỳ hụi mới bắt đầu', 
                    'Kỳ ' || NEW.period_number || ' của dây hụi "' || g.name || '" đã mở thu tiền. Vui lòng đóng hụi trước hạn.', 
                    '/day-hui/' || NEW.group_id || '/ky/' || NEW.id
                );
            END IF;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_payment_open ON hui_periods;
CREATE TRIGGER trigger_notify_payment_open AFTER UPDATE ON hui_periods FOR EACH ROW EXECUTE FUNCTION notify_payment_open();

-- 2. Notify member when payout is confirmed by owner
CREATE OR REPLACE FUNCTION notify_payout_pending() RETURNS TRIGGER AS $$
DECLARE
    m RECORD;
    g RECORD;
BEGIN
    IF NEW.status = 'payout_pending' AND OLD.status IS DISTINCT FROM 'payout_pending' THEN
        SELECT * INTO g FROM hui_groups WHERE id = NEW.group_id;
        SELECT * INTO m FROM hui_members WHERE id = NEW.payout_member_id;
        
        IF m IS NOT NULL THEN
            INSERT INTO notifications (user_id, type, title, message, link)
            VALUES (
                m.user_id, 
                'payout_received', 
                'Chủ hụi đã chuyển tiền', 
                'Chủ hụi đã chuyển khoản tiền lĩnh kỳ ' || NEW.period_number || ' dây "' || g.name || '". Vui lòng kiểm tra và xác nhận.', 
                '/day-hui/' || NEW.group_id || '/ky/' || NEW.id
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_payout_pending ON hui_periods;
CREATE TRIGGER trigger_notify_payout_pending AFTER UPDATE ON hui_periods FOR EACH ROW EXECUTE FUNCTION notify_payout_pending();

-- 3. Notify owner when a member submits payment proof
CREATE OR REPLACE FUNCTION notify_proof_submitted() RETURNS TRIGGER AS $$
DECLARE
    g RECORD;
    p RECORD;
    m_name TEXT;
BEGIN
    IF NEW.status = 'proof_submitted' AND OLD.status IS DISTINCT FROM 'proof_submitted' THEN
        SELECT * INTO p FROM hui_periods WHERE id = NEW.period_id;
        SELECT * INTO g FROM hui_groups WHERE id = p.group_id;
        
        -- Get member name
        SELECT up.full_name INTO m_name
        FROM hui_members m
        JOIN user_profiles up ON m.user_id = up.id
        WHERE m.id = NEW.member_id;

        IF m_name IS NULL OR m_name = '' THEN
            m_name := 'Một thành viên';
        END IF;
        
        -- Get owner user_id directly from group
        IF g.owner_id IS NOT NULL THEN
            INSERT INTO notifications (user_id, type, title, message, link)
            VALUES (
                g.owner_id, 
                'info', 
                m_name || ' đã nộp tiền', 
                m_name || ' đã báo nộp tiền cho kỳ ' || p.period_number || ' dây "' || g.name || '".', 
                '/day-hui/' || p.group_id || '/ky/' || p.id
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_proof_submitted ON contributions;
CREATE TRIGGER trigger_notify_proof_submitted AFTER UPDATE ON contributions FOR EACH ROW EXECUTE FUNCTION notify_proof_submitted();

-- 4. Notify member when owner confirms their payment
CREATE OR REPLACE FUNCTION notify_payment_confirmed() RETURNS TRIGGER AS $$
DECLARE
    g RECORD;
    p RECORD;
    m RECORD;
BEGIN
    IF NEW.status = 'confirmed' AND OLD.status IS DISTINCT FROM 'confirmed' THEN
        SELECT * INTO p FROM hui_periods WHERE id = NEW.period_id;
        SELECT * INTO g FROM hui_groups WHERE id = p.group_id;
        SELECT * INTO m FROM hui_members WHERE id = NEW.member_id;
        
        IF m.user_id IS NOT NULL THEN
            INSERT INTO notifications (user_id, type, title, message, link)
            VALUES (
                m.user_id, 
                'payment_confirmed', 
                'Đã xác nhận tiền hụi', 
                'Chủ hụi đã xác nhận bạn đã đóng tiền cho kỳ ' || p.period_number || ' dây "' || g.name || '".', 
                '/day-hui/' || p.group_id || '/ky/' || p.id
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_payment_confirmed ON contributions;
CREATE TRIGGER trigger_notify_payment_confirmed AFTER UPDATE ON contributions FOR EACH ROW EXECUTE FUNCTION notify_payment_confirmed();

-- 5. Notify owner when recipient confirms payout received
CREATE OR REPLACE FUNCTION notify_payout_confirmed() RETURNS TRIGGER AS $$
DECLARE
    g RECORD;
    m_name TEXT;
BEGIN
    IF (NEW.status = 'payout_confirmed' OR NEW.status = 'completed') AND OLD.status = 'payout_pending' THEN
        SELECT * INTO g FROM hui_groups WHERE id = NEW.group_id;
        
        -- Get recipient name
        SELECT up.full_name INTO m_name
        FROM hui_members m
        JOIN user_profiles up ON m.user_id = up.id
        WHERE m.id = NEW.payout_member_id;

        IF m_name IS NULL OR m_name = '' THEN
            m_name := 'Người lĩnh';
        END IF;
        
        IF g.owner_id IS NOT NULL THEN
            INSERT INTO notifications (user_id, type, title, message, link)
            VALUES (
                g.owner_id, 
                'info', 
                m_name || ' đã nhận tiền', 
                m_name || ' đã xác nhận nhận đủ tiền lĩnh kỳ ' || NEW.period_number || ' dây "' || g.name || '".', 
                '/day-hui/' || NEW.group_id || '/ky/' || NEW.id
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_payout_confirmed ON hui_periods;
CREATE TRIGGER trigger_notify_payout_confirmed AFTER UPDATE ON hui_periods FOR EACH ROW EXECUTE FUNCTION notify_payout_confirmed();

-- 6. Notify when auction / draw is pending
CREATE OR REPLACE FUNCTION notify_draw_pending() RETURNS TRIGGER AS $$
DECLARE
    m RECORD;
    g RECORD;
BEGIN
    IF NEW.status = 'draw_pending' AND OLD.status IS DISTINCT FROM 'draw_pending' THEN
        SELECT * INTO g FROM hui_groups WHERE id = NEW.group_id;
        
        FOR m IN SELECT * FROM hui_members WHERE group_id = NEW.group_id AND status = 'active'
        LOOP
            INSERT INTO notifications (user_id, type, title, message, link)
            VALUES (
                m.user_id, 
                'info', 
                'Đã mở bốc thăm / đấu giá', 
                'Kỳ ' || NEW.period_number || ' của dây hụi "' || g.name || '" đã mở bốc thăm / đấu giá. Vui lòng vào tham gia trước hạn.', 
                '/day-hui/' || NEW.group_id || '/ky/' || NEW.id
            );
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_draw_pending ON hui_periods;
CREATE TRIGGER trigger_notify_draw_pending AFTER UPDATE ON hui_periods FOR EACH ROW EXECUTE FUNCTION notify_draw_pending();
