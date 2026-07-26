-- Migration: Allow group owner to read member's bank accounts for payout

-- Allow group owners to select bank accounts of members in their groups
CREATE POLICY "owner_read_member_banks" ON public.bank_accounts
FOR SELECT
USING (
    user_id IN (
        SELECT hm.user_id
        FROM public.hui_members hm
        JOIN public.hui_groups hg ON hm.group_id = hg.id
        WHERE hg.owner_id = auth.uid()
    )
);
