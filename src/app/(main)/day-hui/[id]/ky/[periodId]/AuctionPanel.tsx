'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { submitBid, finalizeAuction } from '@/features/auction/actions';
import { formatVND } from '@/lib/constants';
import styles from './AuctionPanel.module.css';

interface Bid {
  id: string;
  member_id: string;
  bid_amount: number;
}

interface AuctionPanelProps {
  periodId: string;
  shareValue: number;
  totalShares: number;
  isOwner: boolean;
  ownerParticipates: boolean;
  myMemberId?: string;
  myBid?: Bid | null;
  totalBidCount: number;
  eligibleCount: number;
  participants: { memberId: string; name: string; hasBid: boolean }[];
  deadline?: string;
  minBid?: number | null;
  maxBid?: number | null;
}

function useCountdown(deadline?: string) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!deadline) return;

    const update = () => {
      const now = new Date().getTime();
      const end = new Date(deadline).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('Hết giờ');
        setIsExpired(true);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`);
      } else {
        setTimeLeft(`${minutes}m ${seconds.toString().padStart(2, '0')}s`);
      }
      setIsExpired(false);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  return { timeLeft, isExpired };
}

export default function AuctionPanel({ 
  periodId, shareValue, totalShares, isOwner, ownerParticipates,
  myMemberId, myBid, totalBidCount, eligibleCount, participants = [], deadline, minBid, maxBid: maxBidProp
}: AuctionPanelProps) {
  const [bidAmount, setBidAmount] = useState(myBid ? String(myBid.bid_amount) : '');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ winner: string; winningBid: number; memberPays: number } | null>(null);
  const router = useRouter();
  const { timeLeft, isExpired } = useCountdown(deadline);

  const maxBid = maxBidProp ?? (shareValue * (totalShares - 1));
  const allBidsIn = totalBidCount >= eligibleCount;
  const canFinalize = isOwner && totalBidCount > 0 && (allBidsIn || isExpired);
  const canBid = (!isOwner || (isOwner && ownerParticipates)) && !isExpired;
  const minRequired = minBid || 0;

  useEffect(() => {
    if (isExpired && totalBidCount > 0) {
      router.refresh();
    }
  }, [isExpired, totalBidCount, router]);

  const handleBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isExpired) return;
    
    setErrorMsg('');
    const amount = parseInt(bidAmount.replace(/\D/g, ''));
    if (!amount && amount !== 0) {
      setErrorMsg('Vui lòng nhập số tiền');
      return;
    }
    if (amount < minRequired) {
      setErrorMsg(`Số tiền bỏ phải từ ${formatVND(minRequired)} trở lên`);
      return;
    }
    if (maxBid !== undefined && maxBid !== null && amount > maxBid) {
      setErrorMsg(`Số tiền bỏ không được vượt quá ${formatVND(maxBid)}`);
      return;
    }

    setLoading(true);
    const result = await submitBid(periodId, amount);
    if (result?.error) {
      setErrorMsg(result.error);
    } else {
      setBidAmount('');
      router.refresh();
    }
    setLoading(false);
  };

  const handleFinalize = async () => {
    if (!confirm('Bạn có chắc chắn muốn chốt kết quả đấu giá ngay bây giờ?')) return;
    startTransition(async () => {
      const res = await finalizeAuction(periodId);
      if (res.error) {
        alert(res.error);
      } else {
        setResult({
          winner: res.winner || '',
          winningBid: res.winningBid || 0,
          memberPays: res.memberPays || 0,
        });
        setTimeout(() => router.refresh(), 3000);
      }
    });
  };

  if (result) {
    return (
      <div className={styles.resultCard}>
        <div className={styles.resultIcon}>🎉</div>
        <h3 className={styles.resultTitle}>Kết quả đấu giá</h3>
        <div className={styles.resultWinner}>{result.winner}</div>
        <div className={styles.resultDetails}>
          <span>Giá thắng: <strong>{formatVND(result.winningBid)}</strong></span>
          <span>Mỗi phần đóng: <strong>{formatVND(result.memberPays)}</strong></span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>💰 Đấu giá kín</h3>
      </div>

      {/* Countdown */}
      {deadline && (
        <div className={`${styles.countdown} ${isExpired ? styles.countdownExpired : ''}`}>
          <div className={styles.countdownIcon}>{isExpired ? '🔔' : '⏱️'}</div>
          <div className={styles.countdownText}>
            <span className={styles.countdownTime}>{timeLeft}</span>
            <span className={styles.countdownLabel}>
              {isExpired ? 'Đã hết giờ — đang chốt...' : 'Thời gian còn lại'}
            </span>
          </div>
        </div>
      )}

      <p className={styles.desc}>
        Đấu giá kín — mỗi người chỉ thấy giá của mình. 
        {allBidsIn ? ' ✅ Đã đủ bids!' : ` Còn ${eligibleCount - totalBidCount}/${eligibleCount} người chưa bỏ giá.`}
      </p>

      {/* Danh sách thành viên */}
      <div className={styles.participantList}>
        <h4 className={styles.participantTitle}>
          🔒 Trạng thái bỏ giá ({totalBidCount}/{eligibleCount})
        </h4>
        {participants.map((p) => (
          <div key={p.memberId} className={`${styles.participantRow} ${p.hasBid ? styles.participantDone : ''}`}>
            <span className={styles.participantCheck}>
              {p.hasBid ? '✅' : '⏳'}
            </span>
            <span className={styles.participantName}>{p.name}</span>
            <span className={styles.participantStatus}>
              {p.hasBid ? 'Đã bỏ giá' : 'Chưa bỏ'}
            </span>
          </div>
        ))}
      </div>

      {/* Bỏ giá Form */}
      {canBid && !myBid && (
        <form onSubmit={handleBid} className={styles.bidForm}>
          <div className={styles.formGroup}>
            <label>Số tiền bỏ (lãi sẵn sàng trả):</label>
            <div className={styles.bidInputWrap}>
              <input 
                type="text"
                className={styles.bidInput}
                value={bidAmount}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setBidAmount(val ? parseInt(val).toLocaleString('vi-VN') : '');
                }}
                placeholder="Nhập số tiền..."
                disabled={loading}
              />
              <span className={styles.bidUnit}>₫</span>
            </div>
            <p className={styles.helpText}>
              Giới hạn: {minBid ? `Từ ${formatVND(minBid)}` : 'Từ 0đ'} 
              {maxBid !== undefined && maxBid !== null ? ` đến ${formatVND(maxBid)}` : ' trở lên'}.
              <br/>Người bỏ cao nhất sẽ được lĩnh.
            </p>
          </div>

          {errorMsg && <div className={styles.errorMsg}>{errorMsg}</div>}

          <button type="submit" className={styles.submitBtn} disabled={loading || !bidAmount}>
            {loading ? 'Đang gửi...' : 'Gửi phiếu bỏ hụi'}
          </button>
        </form>
      )}

      {/* Finalize button for owner */}
      {isOwner && (
        <button 
          className={styles.finalizeBtn} 
          onClick={handleFinalize} 
          disabled={isPending || !canFinalize}
          title={!canFinalize ? `Cần ${eligibleCount} bids hoặc hết deadline` : undefined}
        >
          {isPending ? '⏳ Đang chốt...' : 
           !canFinalize ? `🔒 Chờ đủ ${eligibleCount} bids hoặc hết giờ` :
           `🔒 Chốt đấu giá (${totalBidCount}/${eligibleCount})`}
        </button>
      )}

      {/* Non-owner waiting message */}
      {!canBid && !isOwner && (
        <div className={styles.waitingMsg}>
          <p>⏳ Bạn không tham gia đấu giá kỳ này.</p>
        </div>
      )}
    </div>
  );
}
