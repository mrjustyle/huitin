-- Migration 007: Allow members to read owner's receiving bank account
-- Problem: bank_accounts RLS only allows owner to read their own accounts.
-- Members need to see the group's receiving bank account for VietQR.

-- Members can read the bank account that is set as the group's receiving account
CREATE POLICY "members_read_group_bank" ON public.bank_accounts
  FOR SELECT USING (
    id IN (
      SELECT hg.receiving_bank_account_id
      FROM public.hui_groups hg
      JOIN public.hui_members hm ON hm.group_id = hg.id
      WHERE hm.user_id = auth.uid()
        AND hg.receiving_bank_account_id IS NOT NULL
    )
  );
