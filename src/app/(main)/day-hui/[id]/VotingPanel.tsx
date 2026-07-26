'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createVote, submitVoteResponse } from '@/features/voting/actions';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import styles from './VotingPanel.module.css';

interface Vote {
  id: string;
  proposal_type: string;
  proposal_description: string;
  status: string;
  deadline: string;
  required_threshold: number;
  agreeCount: number;
  disagreeCount: number;
  myVote: 'agree' | 'disagree' | null;
  created_at: string;
}

const PROPOSAL_TYPES: Record<string, string> = {
  rule_change: '📋 Thay đổi quy tắc',
  schedule_change: '📅 Đổi lịch đóng',
  member_remove: '🚫 Loại thành viên',
  early_close: '🏁 Đóng sớm dây hụi',
  other: '💬 Khác',
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  open: { label: 'Đang bỏ phiếu', color: 'var(--color-info)' },
  passed: { label: '✅ Đã thông qua', color: 'var(--color-success)' },
  rejected: { label: '❌ Không thông qua', color: 'var(--color-error)' },
  expired: { label: '⏰ Hết hạn', color: 'var(--text-tertiary)' },
};

export default function VotingPanel({
  groupId,
  votes,
  isOwner,
  totalMembers,
}: {
  groupId: string;
  votes: Vote[];
  isOwner: boolean;
  totalMembers: number;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [type, setType] = useState('other');
  const [desc, setDesc] = useState('');
  const [deadline, setDeadline] = useState('');
  const [creating, setCreating] = useState(false);
  const [votingId, setVotingId] = useState<string | null>(null);
  const router = useRouter();
  const { addToast } = useToast();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim() || !deadline) return;
    setCreating(true);
    const result = await createVote(groupId, type, desc, new Date(deadline).toISOString());
    if (result.error) {
      addToast({ type: 'error', title: 'Lỗi tạo biểu quyết', message: result.error });
    } else {
      addToast({ type: 'success', title: 'Đã tạo biểu quyết', message: 'Thành viên sẽ nhận được thông báo.' });
      setShowCreate(false);
      setDesc('');
      router.refresh();
    }
    setCreating(false);
  };

  const handleVote = async (voteId: string, response: 'agree' | 'disagree') => {
    setVotingId(voteId);
    const result = await submitVoteResponse(voteId, response);
    if (result.error) {
      addToast({ type: 'error', title: 'Lỗi bỏ phiếu', message: result.error });
    } else {
      addToast({ type: 'success', title: 'Đã ghi nhận phiếu', message: response === 'agree' ? 'Bạn đã đồng ý.' : 'Bạn đã phản đối.' });
      router.refresh();
    }
    setVotingId(null);
  };

  // Default deadline: 3 days from now
  const defaultDeadline = () => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 16);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>🗳️ Biểu quyết</h3>
        {isOwner && (
          <Button size="sm" variant="outline" onClick={() => { setShowCreate(!showCreate); setDeadline(defaultDeadline()); }}>
            {showCreate ? 'Hủy' : '+ Tạo biểu quyết'}
          </Button>
        )}
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className={styles.createForm}>
          <select value={type} onChange={e => setType(e.target.value)} className={styles.select}>
            {Object.entries(PROPOSAL_TYPES).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <textarea
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="Mô tả nội dung biểu quyết..."
            className={styles.textarea}
            rows={3}
            required
          />
          <div className={styles.deadlineRow}>
            <label>Hạn chót:</label>
            <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} className={styles.dateInput} required />
          </div>
          <Button variant="primary" type="submit" loading={creating} size="sm">
            Tạo biểu quyết
          </Button>
        </form>
      )}

      {votes.length === 0 ? (
        <p className={styles.empty}>Chưa có biểu quyết nào.</p>
      ) : (
        <div className={styles.voteList}>
          {votes.map(v => {
            const info = STATUS_MAP[v.status] || STATUS_MAP.open;
            const totalVotes = v.agreeCount + v.disagreeCount;
            const agreePercent = totalMembers > 0 ? Math.round((v.agreeCount / totalMembers) * 100) : 0;
            const isExpired = new Date(v.deadline) < new Date() && v.status === 'open';

            return (
              <div key={v.id} className={styles.voteItem}>
                <div className={styles.voteHeader}>
                  <span className={styles.voteType}>{PROPOSAL_TYPES[v.proposal_type] || v.proposal_type}</span>
                  <span className={styles.voteStatus} style={{ color: isExpired ? 'var(--text-tertiary)' : info.color }}>
                    {isExpired ? '⏰ Hết hạn' : info.label}
                  </span>
                </div>
                <p className={styles.voteDesc}>{v.proposal_description}</p>

                {/* Progress bar */}
                <div className={styles.progressWrap}>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${agreePercent}%` }} />
                  </div>
                  <span className={styles.progressLabel}>
                    {v.agreeCount}/{totalMembers} đồng ý ({agreePercent}%)
                    {v.required_threshold < 1 && ` · Cần ${Math.round(v.required_threshold * 100)}%`}
                  </span>
                </div>

                <div className={styles.voteMeta}>
                  <span>📅 Hạn: {new Date(v.deadline).toLocaleDateString('vi-VN')}</span>
                  <span>🗳️ {totalVotes}/{totalMembers} đã bỏ phiếu</span>
                </div>

                {/* Vote buttons */}
                {v.status === 'open' && !isExpired && (
                  <div className={styles.voteActions}>
                    {v.myVote ? (
                      <span className={styles.myVoteLabel}>
                        Bạn đã {v.myVote === 'agree' ? '✅ đồng ý' : '❌ phản đối'}
                      </span>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleVote(v.id, 'agree')}
                          loading={votingId === v.id}
                          style={{ borderColor: 'var(--color-success)', color: 'var(--color-success)' }}
                        >
                          👍 Đồng ý
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleVote(v.id, 'disagree')}
                          loading={votingId === v.id}
                          style={{ color: 'var(--color-error)' }}
                        >
                          👎 Phản đối
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
