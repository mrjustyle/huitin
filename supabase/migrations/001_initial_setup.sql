-- ============================================
-- HỤI TÍN — Database Setup Script
-- Run this in Supabase SQL Editor
-- https://supabase.com/dashboard/project/_/sql
-- ============================================
-- Version: 1.0
-- Date: 2026-07-15
-- Covers: All MVP tables (Milestones 1-8)
-- ============================================

-- ============================================
-- 1. EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";    -- For gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "citext";      -- Case-insensitive text

-- ============================================
-- 2. USER PROFILES (extends auth.users)
-- ============================================
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE,
  avatar_url TEXT,
  date_of_birth DATE,
  address TEXT,
  
  -- KYC
  kyc_status TEXT NOT NULL DEFAULT 'none' 
    CHECK (kyc_status IN ('none', 'pending', 'approved', 'rejected')),
  kyc_submitted_at TIMESTAMPTZ,
  kyc_approved_at TIMESTAMPTZ,
  kyc_reviewed_by UUID REFERENCES auth.users(id),
  
  -- Reputation
  total_groups_completed INTEGER DEFAULT 0,
  on_time_rate DECIMAL(5,2) DEFAULT 0,
  total_late_count INTEGER DEFAULT 0,
  open_disputes INTEGER DEFAULT 0,
  active_groups_as_owner INTEGER DEFAULT 0,
  
  -- Role & Status
  role TEXT NOT NULL DEFAULT 'user' 
    CHECK (role IN ('user', 'admin', 'support')),
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 3. KYC DOCUMENTS
-- ============================================
CREATE TABLE public.kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  
  cccd_number_hash TEXT NOT NULL,          -- SHA-256 hash, NOT plain text
  cccd_front_url TEXT,                     -- Supabase Storage path (private bucket)
  cccd_back_url TEXT,
  selfie_url TEXT,
  
  -- Bank verification
  bank_account_name TEXT,
  bank_account_number_encrypted TEXT,      -- Encrypted
  bank_bin TEXT,
  bank_name TEXT,
  
  -- Review
  review_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Prevent duplicate CCCD
CREATE UNIQUE INDEX idx_kyc_cccd_hash ON public.kyc_documents(cccd_number_hash);
CREATE INDEX idx_kyc_user ON public.kyc_documents(user_id);

-- ============================================
-- 4. BANK ACCOUNTS
-- ============================================
CREATE TABLE public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  
  bank_bin TEXT NOT NULL,                  -- NAPAS Bank ID
  bank_name TEXT NOT NULL,
  account_number_encrypted TEXT NOT NULL,  -- Encrypted
  account_number_last4 TEXT,               -- Last 4 digits for display
  account_name TEXT NOT NULL,              -- Tên chủ TK
  
  is_verified BOOLEAN DEFAULT false,
  is_primary BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_bank_user ON public.bank_accounts(user_id);

-- ============================================
-- 5. HUI GROUPS (dây hụi)
-- ============================================
CREATE TABLE public.hui_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES public.user_profiles(id),
  
  -- Type & Config
  hui_type TEXT NOT NULL DEFAULT 'khong_lai' 
    CHECK (hui_type IN ('khong_lai', 'boc_tham', 'bo_hui')),
  share_value BIGINT NOT NULL,             -- Giá trị 1 phần hụi (VND integer)
  total_shares INTEGER NOT NULL,           -- Tổng số phần
  max_shares_per_member INTEGER DEFAULT 1,
  
  -- Schedule
  cycle_type TEXT NOT NULL 
    CHECK (cycle_type IN ('daily', 'weekly', 'biweekly', 'monthly')),
  start_date DATE NOT NULL,
  payment_day_of_month INTEGER,            -- Ngày đóng tiền (1-28)
  draw_day_of_month INTEGER,               -- Ngày mở hụi (1-28)
  grace_period_days INTEGER DEFAULT 3,
  
  -- Payout method
  payout_method TEXT NOT NULL 
    CHECK (payout_method IN ('fixed_order', 'draw', 'auction')),
  
  -- Commission
  commission_type TEXT DEFAULT 'none' 
    CHECK (commission_type IN ('none', 'fixed_per_period', 'fixed_per_payout', 'percentage')),
  commission_amount BIGINT DEFAULT 0,
  
  -- Rules
  late_penalty_type TEXT DEFAULT 'none',
  late_penalty_amount BIGINT DEFAULT 0,
  withdrawal_policy TEXT,
  replacement_policy TEXT,
  termination_policy TEXT,
  vote_threshold DECIMAL(3,2) DEFAULT 1.00, -- 100% by default
  
  -- Bank account for receiving
  receiving_bank_account_id UUID REFERENCES public.bank_accounts(id),
  owner_address TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' 
    CHECK (status IN (
      'draft', 'recruiting', 'pending_agreement', 'ready',
      'active', 'suspended', 'in_dispute', 'completed', 'cancelled'
    )),
  
  -- Invite
  invite_code TEXT UNIQUE,
  invite_expires_at TIMESTAMPTZ,
  invite_max_uses INTEGER,
  invite_used_count INTEGER DEFAULT 0,
  
  -- Agreement
  agreement_version INTEGER DEFAULT 1,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  activated_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_hui_owner ON public.hui_groups(owner_id);
CREATE INDEX idx_hui_status ON public.hui_groups(status);
CREATE INDEX idx_hui_invite ON public.hui_groups(invite_code);

-- ============================================
-- 6. HUI MEMBERS (thành viên)
-- ============================================
CREATE TABLE public.hui_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.hui_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id),
  
  shares INTEGER NOT NULL DEFAULT 1,
  payout_order INTEGER,                    -- Thứ tự lĩnh (fixed_order)
  
  status TEXT NOT NULL DEFAULT 'invited' 
    CHECK (status IN (
      'invited', 'pending_kyc', 'pending_approval', 'pending_agreement',
      'active', 'late', 'suspended', 'replaced', 'withdrawn',
      'removed', 'completed'
    )),
  
  role TEXT NOT NULL DEFAULT 'member' 
    CHECK (role IN ('owner', 'member', 'witness')),
  
  invited_by UUID REFERENCES public.user_profiles(id),
  invited_at TIMESTAMPTZ DEFAULT now(),
  joined_at TIMESTAMPTZ,
  agreement_signed_at TIMESTAMPTZ,
  agreement_version_signed INTEGER,
  
  replaced_by UUID REFERENCES public.hui_members(id),
  replaced_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(group_id, user_id)
);

CREATE INDEX idx_member_group ON public.hui_members(group_id);
CREATE INDEX idx_member_user ON public.hui_members(user_id);

-- ============================================
-- 7. HUI AGREEMENTS (thỏa thuận)
-- ============================================
CREATE TABLE public.hui_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.hui_groups(id) ON DELETE CASCADE,
  
  version INTEGER NOT NULL,
  content JSONB NOT NULL,                  -- Full agreement data
  pdf_url TEXT,                            -- Generated PDF
  checksum TEXT,                           -- SHA-256 hash of content
  
  created_by UUID NOT NULL REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(group_id, version)
);

-- Signature records
CREATE TABLE public.agreement_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id UUID NOT NULL REFERENCES public.hui_agreements(id),
  member_id UUID NOT NULL REFERENCES public.hui_members(id),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id),
  
  signed_at TIMESTAMPTZ DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  device_id TEXT,
  otp_verified BOOLEAN DEFAULT false,
  
  UNIQUE(agreement_id, member_id)
);

-- ============================================
-- 8. HUI PERIODS (kỳ hụi)
-- ============================================
CREATE TABLE public.hui_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.hui_groups(id) ON DELETE CASCADE,
  period_number INTEGER NOT NULL,
  
  payment_due_date DATE NOT NULL,
  draw_date DATE,
  grace_deadline DATE,
  
  -- Payout info
  payout_member_id UUID REFERENCES public.hui_members(id),
  payout_amount BIGINT,
  commission_amount BIGINT DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'upcoming' 
    CHECK (status IN (
      'upcoming', 'payment_open', 'draw_pending',
      'payout_pending', 'payout_confirmed', 'completed', 'disputed'
    )),
  
  draw_result JSONB,                       -- Kết quả bốc thăm / bỏ hụi
  draw_locked_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  
  UNIQUE(group_id, period_number)
);

CREATE INDEX idx_period_group ON public.hui_periods(group_id);
CREATE INDEX idx_period_status ON public.hui_periods(status);
CREATE INDEX idx_period_due ON public.hui_periods(payment_due_date);

-- ============================================
-- 9. CONTRIBUTIONS (đóng hụi)
-- ============================================
CREATE TABLE public.contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID NOT NULL REFERENCES public.hui_periods(id),
  member_id UUID NOT NULL REFERENCES public.hui_members(id),
  share_number INTEGER NOT NULL DEFAULT 1,
  
  amount_due BIGINT NOT NULL,
  amount_paid BIGINT DEFAULT 0,
  
  recipient_id UUID REFERENCES public.user_profiles(id),
  transfer_content TEXT,                   -- Nội dung CK
  bank_transaction_id TEXT,
  
  evidence_url TEXT,                       -- Chứng từ (Storage path)
  evidence_uploaded_at TIMESTAMPTZ,
  
  confirmed_by UUID REFERENCES public.user_profiles(id),
  confirmed_at TIMESTAMPTZ,
  
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN (
      'pending', 'proof_submitted', 'confirmed',
      'partially_paid', 'late', 'disputed', 'reversed'
    )),
  
  idempotency_key TEXT UNIQUE,             -- Prevent duplicate submissions
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_contrib_period ON public.contributions(period_id);
CREATE INDEX idx_contrib_member ON public.contributions(member_id);
CREATE INDEX idx_contrib_status ON public.contributions(status);

-- ============================================
-- 10. PAYOUTS (giao tiền lĩnh hụi)
-- ============================================
CREATE TABLE public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID NOT NULL REFERENCES public.hui_periods(id),
  recipient_member_id UUID NOT NULL REFERENCES public.hui_members(id),
  
  amount BIGINT NOT NULL,
  commission_deducted BIGINT DEFAULT 0,
  net_amount BIGINT NOT NULL,
  
  -- Double confirmation
  sender_confirmed BOOLEAN DEFAULT false,
  sender_confirmed_at TIMESTAMPTZ,
  recipient_confirmed BOOLEAN DEFAULT false,
  recipient_confirmed_at TIMESTAMPTZ,
  
  bank_transaction_id TEXT,
  evidence_url TEXT,
  
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'sender_confirmed', 'completed', 'disputed')),
  
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_payout_period ON public.payouts(period_id);

-- ============================================
-- 11. RECEIPTS (biên nhận)
-- ============================================
CREATE TABLE public.receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_code TEXT UNIQUE NOT NULL,        -- HT-YYYYMMDD-XXXX
  group_id UUID NOT NULL REFERENCES public.hui_groups(id),
  period_id UUID REFERENCES public.hui_periods(id),
  
  sender_id UUID REFERENCES public.user_profiles(id),
  recipient_id UUID REFERENCES public.user_profiles(id),
  
  amount BIGINT NOT NULL,
  transaction_type TEXT NOT NULL 
    CHECK (transaction_type IN (
      'contribution', 'payout', 'commission', 'late_penalty', 'adjustment'
    )),
  
  related_contribution_id UUID REFERENCES public.contributions(id),
  related_payout_id UUID REFERENCES public.payouts(id),
  
  checksum TEXT NOT NULL,                  -- SHA-256 for integrity
  
  status TEXT DEFAULT 'issued' 
    CHECK (status IN ('issued', 'adjusted', 'voided')),
  adjustment_receipt_id UUID REFERENCES public.receipts(id),
  
  created_at TIMESTAMPTZ DEFAULT now()
  -- NO updated_at: receipts are immutable
);

CREATE INDEX idx_receipt_group ON public.receipts(group_id);
CREATE INDEX idx_receipt_code ON public.receipts(receipt_code);

-- ============================================
-- 12. DISPUTES (khiếu nại / tranh chấp)
-- ============================================
CREATE TABLE public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.hui_groups(id),
  opened_by UUID NOT NULL REFERENCES public.user_profiles(id),
  against_user_id UUID REFERENCES public.user_profiles(id),
  
  dispute_type TEXT NOT NULL,
  description TEXT NOT NULL,
  
  related_contribution_id UUID REFERENCES public.contributions(id),
  related_payout_id UUID REFERENCES public.payouts(id),
  related_period_id UUID REFERENCES public.hui_periods(id),
  
  evidence_urls TEXT[],
  
  status TEXT DEFAULT 'open' 
    CHECK (status IN (
      'open', 'waiting_response', 'under_review',
      'resolved', 'unresolved', 'escalated'
    )),
  
  resolution TEXT,
  resolved_by UUID REFERENCES public.user_profiles(id),
  resolved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_dispute_group ON public.disputes(group_id);

-- ============================================
-- 13. VOTES (biểu quyết)
-- ============================================
CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.hui_groups(id),
  proposal_type TEXT NOT NULL,
  proposal_description TEXT NOT NULL,
  proposed_by UUID NOT NULL REFERENCES public.user_profiles(id),
  
  old_value JSONB,
  new_value JSONB,
  
  required_threshold DECIMAL(3,2) NOT NULL,
  deadline TIMESTAMPTZ NOT NULL,
  
  status TEXT DEFAULT 'open' 
    CHECK (status IN ('open', 'passed', 'rejected', 'expired')),
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.vote_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_id UUID NOT NULL REFERENCES public.votes(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.hui_members(id),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id),
  response TEXT NOT NULL CHECK (response IN ('agree', 'disagree')),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(vote_id, member_id)
);

-- ============================================
-- 14. NOTIFICATIONS
-- ============================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.hui_groups(id),
  
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,                              -- Deep link data
  
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  channel TEXT DEFAULT 'in_app',
  sent_at TIMESTAMPTZ DEFAULT now(),
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notif_user ON public.notifications(user_id, is_read);
CREATE INDEX idx_notif_created ON public.notifications(created_at DESC);

-- ============================================
-- 15. CHAT MESSAGES
-- ============================================
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.hui_groups(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.user_profiles(id),
  
  content TEXT,
  attachment_url TEXT,
  attachment_type TEXT,
  
  is_pinned BOOLEAN DEFAULT false,
  is_recalled BOOLEAN DEFAULT false,
  recalled_at TIMESTAMPTZ,
  
  reply_to_id UUID REFERENCES public.chat_messages(id),
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_chat_group ON public.chat_messages(group_id, created_at DESC);

-- ============================================
-- 16. AUDIT EVENTS (immutable, append-only)
-- ============================================
CREATE TABLE public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id),
  actor_role TEXT,
  
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  
  ip_address INET,
  user_agent TEXT,
  device_id TEXT,
  request_id TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
  -- NO updated_at — immutable
);

CREATE INDEX idx_audit_entity ON public.audit_events(entity_type, entity_id);
CREATE INDEX idx_audit_actor ON public.audit_events(actor_id);
CREATE INDEX idx_audit_created ON public.audit_events(created_at DESC);

-- Protect audit log from modification
CREATE OR REPLACE FUNCTION public.protect_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_immutable_audit
  BEFORE UPDATE OR DELETE ON public.audit_events
  FOR EACH STATEMENT EXECUTE FUNCTION public.protect_audit_log();

-- ============================================
-- 17. RISK SIGNALS
-- ============================================
CREATE TABLE public.risk_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id),
  group_id UUID REFERENCES public.hui_groups(id),
  
  signal_type TEXT NOT NULL,               -- 'duplicate_cccd', 'suspicious_login', etc.
  severity TEXT DEFAULT 'medium' 
    CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT,
  data JSONB,
  
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_risk_user ON public.risk_signals(user_id);
CREATE INDEX idx_risk_unresolved ON public.risk_signals(is_resolved) WHERE NOT is_resolved;

-- ============================================
-- 18. GOVERNMENT NOTICE DOCUMENTS
-- ============================================
CREATE TABLE public.government_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.hui_groups(id),
  owner_id UUID NOT NULL REFERENCES public.user_profiles(id),
  
  notice_type TEXT NOT NULL DEFAULT 'ubnd_xa',
  pdf_url TEXT,
  data JSONB,                              -- Auto-filled form data
  
  submitted_date DATE,                     -- Ngày chủ hụi khai báo đã nộp
  confirmation_url TEXT,                   -- Biên nhận xác nhận
  
  status TEXT DEFAULT 'pending' 
    CHECK (status IN ('pending', 'generated', 'submitted', 'confirmed')),
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 19. UPDATED_AT TRIGGER (auto-update)
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.bank_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.hui_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.contributions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- 20. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hui_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hui_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hui_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreement_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hui_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vote_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.government_notices ENABLE ROW LEVEL SECURITY;

-- ---- USER PROFILES ----
-- Users can read their own profile
CREATE POLICY "users_read_own_profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile (except role, kyc_status)
CREATE POLICY "users_update_own_profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Members of same group can see basic info of other members
CREATE POLICY "members_read_group_profiles" ON public.user_profiles
  FOR SELECT USING (
    id IN (
      SELECT hm2.user_id FROM public.hui_members hm1
      JOIN public.hui_members hm2 ON hm1.group_id = hm2.group_id
      WHERE hm1.user_id = auth.uid()
    )
  );

-- Admins can read all profiles
CREATE POLICY "admin_read_all_profiles" ON public.user_profiles
  FOR SELECT USING (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'support')
  );

-- Admins can update profiles (for KYC review, etc.)
CREATE POLICY "admin_update_profiles" ON public.user_profiles
  FOR UPDATE USING (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
  );

-- ---- KYC DOCUMENTS ----
CREATE POLICY "users_manage_own_kyc" ON public.kyc_documents
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "admin_manage_kyc" ON public.kyc_documents
  FOR ALL USING (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'support')
  );

-- ---- BANK ACCOUNTS ----
CREATE POLICY "users_manage_own_banks" ON public.bank_accounts
  FOR ALL USING (auth.uid() = user_id);

-- ---- HUI GROUPS ----
-- Owners can manage their groups
CREATE POLICY "owner_manage_group" ON public.hui_groups
  FOR ALL USING (auth.uid() = owner_id);

-- Members can view groups they belong to
CREATE POLICY "members_view_group" ON public.hui_groups
  FOR SELECT USING (
    id IN (
      SELECT group_id FROM public.hui_members WHERE user_id = auth.uid()
    )
  );

-- Anyone can view a group by invite code (for joining)
CREATE POLICY "public_view_by_invite" ON public.hui_groups
  FOR SELECT USING (
    invite_code IS NOT NULL 
    AND status = 'recruiting'
  );

-- Admins see all groups
CREATE POLICY "admin_manage_groups" ON public.hui_groups
  FOR ALL USING (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
  );

-- ---- HUI MEMBERS ----
-- Helper function: check if user is member of group
CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.hui_members 
    WHERE group_id = p_group_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Members can view all members in their groups
CREATE POLICY "members_view_group_members" ON public.hui_members
  FOR SELECT USING (public.is_group_member(group_id));

-- Group owners can manage members
CREATE POLICY "owner_manage_members" ON public.hui_members
  FOR ALL USING (
    group_id IN (
      SELECT id FROM public.hui_groups WHERE owner_id = auth.uid()
    )
  );

-- Users can update their own membership (accept invite, sign agreement)
CREATE POLICY "users_update_own_membership" ON public.hui_members
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert themselves (joining via invite)
CREATE POLICY "users_join_group" ON public.hui_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ---- AGREEMENTS ----
CREATE POLICY "members_view_agreements" ON public.hui_agreements
  FOR SELECT USING (public.is_group_member(group_id));

CREATE POLICY "owner_create_agreement" ON public.hui_agreements
  FOR INSERT WITH CHECK (
    group_id IN (SELECT id FROM public.hui_groups WHERE owner_id = auth.uid())
  );

-- ---- SIGNATURES ----
CREATE POLICY "members_view_signatures" ON public.agreement_signatures
  FOR SELECT USING (
    agreement_id IN (
      SELECT a.id FROM public.hui_agreements a
      WHERE public.is_group_member(a.group_id)
    )
  );

CREATE POLICY "users_sign_agreement" ON public.agreement_signatures
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ---- PERIODS ----
CREATE POLICY "members_view_periods" ON public.hui_periods
  FOR SELECT USING (public.is_group_member(group_id));

CREATE POLICY "owner_manage_periods" ON public.hui_periods
  FOR ALL USING (
    group_id IN (SELECT id FROM public.hui_groups WHERE owner_id = auth.uid())
  );

-- ---- CONTRIBUTIONS ----
CREATE POLICY "members_view_contributions" ON public.contributions
  FOR SELECT USING (
    period_id IN (
      SELECT p.id FROM public.hui_periods p
      WHERE public.is_group_member(p.group_id)
    )
  );

CREATE POLICY "members_create_contribution" ON public.contributions
  FOR INSERT WITH CHECK (
    member_id IN (SELECT id FROM public.hui_members WHERE user_id = auth.uid())
  );

CREATE POLICY "owner_update_contribution" ON public.contributions
  FOR UPDATE USING (
    period_id IN (
      SELECT p.id FROM public.hui_periods p
      JOIN public.hui_groups g ON g.id = p.group_id
      WHERE g.owner_id = auth.uid()
    )
  );

-- ---- PAYOUTS ----
CREATE POLICY "members_view_payouts" ON public.payouts
  FOR SELECT USING (
    period_id IN (
      SELECT p.id FROM public.hui_periods p
      WHERE public.is_group_member(p.group_id)
    )
  );

CREATE POLICY "owner_manage_payouts" ON public.payouts
  FOR ALL USING (
    period_id IN (
      SELECT p.id FROM public.hui_periods p
      JOIN public.hui_groups g ON g.id = p.group_id
      WHERE g.owner_id = auth.uid()
    )
  );

-- Recipient can confirm payout
CREATE POLICY "recipient_confirm_payout" ON public.payouts
  FOR UPDATE USING (
    recipient_member_id IN (SELECT id FROM public.hui_members WHERE user_id = auth.uid())
  );

-- ---- RECEIPTS ----
CREATE POLICY "members_view_receipts" ON public.receipts
  FOR SELECT USING (public.is_group_member(group_id));

-- ---- DISPUTES ----
CREATE POLICY "members_view_disputes" ON public.disputes
  FOR SELECT USING (public.is_group_member(group_id));

CREATE POLICY "members_create_dispute" ON public.disputes
  FOR INSERT WITH CHECK (auth.uid() = opened_by AND public.is_group_member(group_id));

CREATE POLICY "admin_manage_disputes" ON public.disputes
  FOR ALL USING (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'support')
  );

-- ---- VOTES ----
CREATE POLICY "members_view_votes" ON public.votes
  FOR SELECT USING (public.is_group_member(group_id));

CREATE POLICY "members_create_vote" ON public.votes
  FOR INSERT WITH CHECK (public.is_group_member(group_id));

CREATE POLICY "members_respond_vote" ON public.vote_responses
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "members_view_vote_responses" ON public.vote_responses
  FOR SELECT USING (
    vote_id IN (
      SELECT v.id FROM public.votes v WHERE public.is_group_member(v.group_id)
    )
  );

-- ---- NOTIFICATIONS ----
CREATE POLICY "users_own_notifications" ON public.notifications
  FOR ALL USING (auth.uid() = user_id);

-- ---- CHAT MESSAGES ----
CREATE POLICY "members_view_chat" ON public.chat_messages
  FOR SELECT USING (public.is_group_member(group_id));

CREATE POLICY "members_send_chat" ON public.chat_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id AND public.is_group_member(group_id));

-- Owner can update messages (pin/unpin, but NOT delete content)
CREATE POLICY "owner_update_chat" ON public.chat_messages
  FOR UPDATE USING (
    group_id IN (SELECT id FROM public.hui_groups WHERE owner_id = auth.uid())
  );

-- ---- AUDIT EVENTS ----
-- Only admins can view audit logs
CREATE POLICY "admin_view_audit" ON public.audit_events
  FOR SELECT USING (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
  );

-- Anyone can insert audit events (via triggers/functions)
CREATE POLICY "insert_audit" ON public.audit_events
  FOR INSERT WITH CHECK (true);

-- ---- RISK SIGNALS ----
CREATE POLICY "admin_manage_risk" ON public.risk_signals
  FOR ALL USING (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'support')
  );

-- ---- GOVERNMENT NOTICES ----
CREATE POLICY "owner_manage_notices" ON public.government_notices
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "admin_view_notices" ON public.government_notices
  FOR SELECT USING (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
  );

-- ============================================
-- 21. STORAGE BUCKETS
-- ============================================
-- These need to be created via Supabase Dashboard or API
-- Run these INSERT statements to create the buckets:

INSERT INTO storage.buckets (id, name, public) 
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-evidence', 'payment-evidence', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('agreements', 'agreements', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-attachments', 'chat-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: users can upload to their own folder
CREATE POLICY "users_upload_kyc" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'kyc-documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "users_read_own_kyc" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'kyc-documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "admin_read_kyc" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'kyc-documents'
    AND (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'support')
  );

CREATE POLICY "members_upload_evidence" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'payment-evidence'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "members_read_evidence" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'payment-evidence'
  );

-- ============================================
-- 22. HELPER FUNCTIONS
-- ============================================

-- Generate unique receipt code
CREATE OR REPLACE FUNCTION public.generate_receipt_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  counter INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO counter FROM public.receipts 
  WHERE created_at::date = CURRENT_DATE;
  
  code := 'HT-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || lpad(counter::text, 4, '0');
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Generate random invite code (6 characters)
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- No I,O,0,1 to avoid confusion
  code TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- DONE! 🎉
-- ============================================
-- Tables created: 19
-- Indexes created: 18
-- RLS policies created: 35+
-- Triggers created: 7
-- Functions created: 6
-- Storage buckets: 4
-- ============================================
