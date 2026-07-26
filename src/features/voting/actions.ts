'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/** Tạo biểu quyết mới */
export async function createVote(
  groupId: string,
  proposalType: string,
  proposalDescription: string,
  deadline: string,
  oldValue?: any,
  newValue?: any,
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Chưa đăng nhập' };

  // Check if user is group owner
  const { data: group } = await supabase
    .from('hui_groups')
    .select('owner_id, vote_threshold')
    .eq('id', groupId)
    .single();
  if (!group) return { error: 'Không tìm thấy dây hụi' };
  if (group.owner_id !== user.id) return { error: 'Chỉ chủ hụi mới được tạo biểu quyết' };

  const { error } = await supabase.from('votes').insert({
    group_id: groupId,
    proposal_type: proposalType,
    proposal_description: proposalDescription,
    proposed_by: user.id,
    required_threshold: group.vote_threshold || 1.0,
    deadline,
    old_value: oldValue ? JSON.stringify(oldValue) : null,
    new_value: newValue ? JSON.stringify(newValue) : null,
    status: 'open',
  });

  if (error) return { error: error.message };
  revalidatePath(`/day-hui/${groupId}`);
  return { success: true };
}

/** Bỏ phiếu */
export async function submitVoteResponse(voteId: string, response: 'agree' | 'disagree') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Chưa đăng nhập' };

  // Get vote info
  const { data: vote } = await supabase
    .from('votes')
    .select('group_id, status')
    .eq('id', voteId)
    .single();
  if (!vote) return { error: 'Không tìm thấy biểu quyết' };
  if (vote.status !== 'open') return { error: 'Biểu quyết đã đóng' };

  // Check deadline
  // Get member id
  const { data: member } = await supabase
    .from('hui_members')
    .select('id')
    .eq('group_id', vote.group_id)
    .eq('user_id', user.id)
    .single();
  if (!member) return { error: 'Bạn không phải thành viên nhóm này' };

  const { error } = await supabase.from('vote_responses').upsert({
    vote_id: voteId,
    member_id: member.id,
    user_id: user.id,
    response,
  }, { onConflict: 'vote_id,member_id' });

  if (error) return { error: error.message };

  // Check if threshold reached
  await checkAndFinalizeVote(supabase, voteId);

  revalidatePath(`/day-hui/${vote.group_id}`);
  return { success: true };
}

/** Kiểm tra ngưỡng biểu quyết */
async function checkAndFinalizeVote(supabase: any, voteId: string) {
  const { data: vote } = await supabase
    .from('votes')
    .select('group_id, required_threshold')
    .eq('id', voteId)
    .single();
  if (!vote) return;

  // Count total members
  const { count: totalMembers } = await supabase
    .from('hui_members')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', vote.group_id)
    .eq('status', 'active');

  // Count agree votes
  const { count: agreeCount } = await supabase
    .from('vote_responses')
    .select('*', { count: 'exact', head: true })
    .eq('vote_id', voteId)
    .eq('response', 'agree');

  const { count: totalVotes } = await supabase
    .from('vote_responses')
    .select('*', { count: 'exact', head: true })
    .eq('vote_id', voteId);

  if (!totalMembers || totalMembers === 0) return;

  const agreeRatio = (agreeCount || 0) / totalMembers;
  const allVoted = (totalVotes || 0) >= totalMembers;

  if (agreeRatio >= vote.required_threshold) {
    await supabase.from('votes').update({ status: 'passed' }).eq('id', voteId);
  } else if (allVoted) {
    await supabase.from('votes').update({ status: 'rejected' }).eq('id', voteId);
  }
}

/** Lấy danh sách biểu quyết của group */
export async function getGroupVotes(groupId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('votes')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });

  if (!data || data.length === 0) return [];

  // Enrich with vote counts and user's own vote
  const enriched = await Promise.all(data.map(async (v: any) => {
    const { count: agreeCount } = await supabase
      .from('vote_responses')
      .select('*', { count: 'exact', head: true })
      .eq('vote_id', v.id)
      .eq('response', 'agree');

    const { count: disagreeCount } = await supabase
      .from('vote_responses')
      .select('*', { count: 'exact', head: true })
      .eq('vote_id', v.id)
      .eq('response', 'disagree');

    // Get user's member id for this group
    const { data: member } = await supabase
      .from('hui_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();

    let myVote = null;
    if (member) {
      const { data: resp } = await supabase
        .from('vote_responses')
        .select('response')
        .eq('vote_id', v.id)
        .eq('member_id', member.id)
        .single();
      myVote = resp?.response || null;
    }

    return {
      ...v,
      agreeCount: agreeCount || 0,
      disagreeCount: disagreeCount || 0,
      myVote,
    };
  }));

  return enriched;
}
