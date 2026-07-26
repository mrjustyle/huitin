-- Migration: Add actor_id to notifications for avatars

-- 1. Add actor_id column
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS actor_id UUID REFERENCES public.user_profiles(id);

-- 2. Update notify_proof_submitted (member submits proof, actor is member)
CREATE OR REPLACE FUNCTION notify_proof_submitted() RETURNS TRIGGER AS $$
DECLARE
    g RECORD;
    p RECORD;
    m_name TEXT;
    m_user_id UUID;
BEGIN
    IF NEW.status = 'proof_submitted' AND OLD.status IS DISTINCT FROM 'proof_submitted' THEN
        SELECT * INTO p FROM hui_periods WHERE id = NEW.period_id;
        SELECT * INTO g FROM hui_groups WHERE id = p.group_id;
        
        -- Get member name and user_id
        SELECT up.full_name, m.user_id INTO m_name, m_user_id
        FROM hui_members m
        JOIN user_profiles up ON m.user_id = up.id
        WHERE m.id = NEW.member_id;

        IF m_name IS NULL OR m_name = '' THEN
            m_name := 'Một thành viên';
        END IF;
        
        IF g.owner_id IS NOT NULL THEN
            INSERT INTO notifications (user_id, type, title, message, link, actor_id)
            VALUES (
                g.owner_id, 
                'info', 
                m_name || ' đã nộp tiền', 
                m_name || ' đã báo nộp tiền cho kỳ ' || p.period_number || ' dây "' || g.name || '".', 
                '/day-hui/' || p.group_id || '/ky/' || p.id,
                m_user_id
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Update notify_payment_confirmed (owner confirms payment, actor is owner)
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
            INSERT INTO notifications (user_id, type, title, message, link, actor_id)
            VALUES (
                m.user_id, 
                'payment_confirmed', 
                'Đã xác nhận tiền hụi', 
                'Chủ hụi đã xác nhận bạn đã đóng tiền cho kỳ ' || p.period_number || ' dây "' || g.name || '".', 
                '/day-hui/' || p.group_id || '/ky/' || p.id,
                g.owner_id
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Update notify_payout_pending (owner transfers payout, actor is owner)
CREATE OR REPLACE FUNCTION notify_payout_pending() RETURNS TRIGGER AS $$
DECLARE
    m RECORD;
    g RECORD;
BEGIN
    IF NEW.status = 'payout_pending' AND OLD.status IS DISTINCT FROM 'payout_pending' THEN
        SELECT * INTO g FROM hui_groups WHERE id = NEW.group_id;
        SELECT * INTO m FROM hui_members WHERE id = NEW.payout_member_id;
        
        IF m IS NOT NULL THEN
            INSERT INTO notifications (user_id, type, title, message, link, actor_id)
            VALUES (
                m.user_id, 
                'payout_received', 
                'Chủ hụi đã chuyển tiền', 
                'Chủ hụi đã chuyển khoản tiền lĩnh kỳ ' || NEW.period_number || ' dây "' || g.name || '". Vui lòng kiểm tra và xác nhận.', 
                '/day-hui/' || NEW.group_id || '/ky/' || NEW.id,
                g.owner_id
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Update notify_payout_confirmed (member confirms payout, actor is member)
CREATE OR REPLACE FUNCTION notify_payout_confirmed() RETURNS TRIGGER AS $$
DECLARE
    g RECORD;
    m_name TEXT;
    m_user_id UUID;
BEGIN
    IF (NEW.status = 'payout_confirmed' OR NEW.status = 'completed') AND OLD.status = 'payout_pending' THEN
        SELECT * INTO g FROM hui_groups WHERE id = NEW.group_id;
        
        -- Get recipient name and user_id
        SELECT up.full_name, m.user_id INTO m_name, m_user_id
        FROM hui_members m
        JOIN user_profiles up ON m.user_id = up.id
        WHERE m.id = NEW.payout_member_id;

        IF m_name IS NULL OR m_name = '' THEN
            m_name := 'Người lĩnh';
        END IF;
        
        IF g.owner_id IS NOT NULL THEN
            INSERT INTO notifications (user_id, type, title, message, link, actor_id)
            VALUES (
                g.owner_id, 
                'info', 
                m_name || ' đã nhận tiền', 
                m_name || ' đã xác nhận nhận đủ tiền lĩnh kỳ ' || NEW.period_number || ' dây "' || g.name || '".', 
                '/day-hui/' || NEW.group_id || '/ky/' || NEW.id,
                m_user_id
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
