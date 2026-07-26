import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAgreement } from '@/features/agreement/actions';
import { getGroupDetail } from '@/features/hui/actions';
import { getSubscriptionStatus } from '@/features/subscription/actions';
import AgreementView from '@/features/agreement/components/AgreementView';
import GenerateButton from './GenerateButton';
import ActivateButton from './ActivateButton';
import styles from './page.module.css';

export const metadata = {
  title: 'Thỏa thuận dây hụi',
};

export default async function AgreementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const data = await getGroupDetail(id);
  if (!data) notFound();

  const { group, members, isOwner } = data;
  const agreementData = await getAgreement(id);
  const sub = await getSubscriptionStatus(user.id);
  const isVip = sub.isVip;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <a href={`/day-hui/${id}`} className={styles.backLink}>← Chi tiết dây hụi</a>
        <h1 className={styles.title}>Thỏa thuận: {group.name}</h1>
      </div>

      {!agreementData ? (
        <div className={styles.noAgreement}>
          <div className={styles.noIcon}>📋</div>
          <h2>Chưa có thỏa thuận</h2>
          <p>Tạo thỏa thuận để các thành viên xem xét và ký xác nhận.</p>
          {isOwner && <GenerateButton groupId={id} />}
        </div>
      ) : (
        <>
          <AgreementView
            agreement={agreementData.agreement}
            signatures={agreementData.signatures}
            members={members}
            isOwner={isOwner}
            groupId={id}
            currentUserId={user.id}
            isVip={isVip}
          />

          {/* Activate button — only when ALL members signed */}
          {isOwner && group.status === 'pending_agreement' && (() => {
            const signedUserIds = (agreementData.signatures || []).map((s: any) => s.user_id);
            const allSigned = members.length > 0 && members.every((m: any) => signedUserIds.includes(m.user_id));
            return (
              <div className={styles.activateSection}>
                {allSigned ? (
                  <ActivateButton groupId={id} />
                ) : (
                  <p style={{ textAlign: 'center', color: 'var(--color-gray-400)', fontSize: 'var(--font-size-sm)' }}>
                    ⏳ Chờ tất cả thành viên ký ({signedUserIds.length}/{members.length}) để kích hoạt
                  </p>
                )}
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}
