import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProfileForm from './ProfileForm';
import ReputationCard from '@/features/profile/components/ReputationCard';
import BankAccountList from '@/features/profile/components/BankAccountList';
import LinkedAccounts from '@/features/profile/components/LinkedAccounts';
import ThemeSwitcher from '@/components/ui/ThemeSwitcher';
import Link from 'next/link';
import { signOut } from '@/features/auth/actions';
import { IconConfirmed, IconPending, IconError, IconSettings, IconLogout } from '@/components/ui/Icons';
import styles from './page.module.css';

export const metadata = {
  title: 'Tài khoản',
};

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/dang-nhap');

  const hasGoogle = user.identities?.some((id) => id.provider === 'google') || false;
  const googleIdentityId = user.identities?.find((id) => id.provider === 'google')?.identity_id;
  const hasZalo = !!user.user_metadata?.zalo_id;
  
  // Can only unlink if they have at least 1 other method (e.g. phone, or both google and zalo)
  let linkCount = 0;
  if (user.phone) linkCount++;
  if (hasGoogle) linkCount++;
  if (hasZalo) linkCount++;
  const canUnlink = linkCount > 1;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: bankAccounts } = await supabase
    .from('bank_accounts')
    .select('*')
    .eq('user_id', user.id)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: false });

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Tài khoản</h1>

      <div className={styles.grid}>
        {/* Left column: Profile + Banks */}
        <div className={styles.leftCol}>
          <ProfileForm
            profile={{
              nickname: profile?.nickname || profile?.full_name || '',
              fullName: profile?.full_name || '',
              phone: profile?.phone || '',
              email: user.email || '',
              dateOfBirth: profile?.date_of_birth || '',
              address: profile?.address || '',
            }}
          />

          <BankAccountList accounts={bankAccounts || []} />

          <LinkedAccounts 
            hasGoogle={hasGoogle} 
            googleIdentityId={googleIdentityId}
            hasZalo={hasZalo}
            canUnlink={canUnlink}
          />

          {/* Link to KYC Page */}
          <div className={styles.infoCard}>
            <h3 className={styles.infoTitle}>Xác minh danh tính (KYC)</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Trạng thái: <strong>
                {profile?.kyc_status === 'approved' ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><IconConfirmed size={16} style={{ color: 'var(--success-color)' }} /> Đã xác minh</span> :
                 profile?.kyc_status === 'pending' ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><IconPending size={16} style={{ color: 'var(--warning-600)' }} /> Đang chờ duyệt</span> :
                 profile?.kyc_status === 'rejected' ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><IconError size={16} style={{ color: 'var(--error-600)' }} /> Bị từ chối</span> : 'Chưa xác minh'}
              </strong>
            </p>
            <Link href="/kyc" className={styles.buttonOutline} style={{ display: 'inline-block', padding: '0.5rem 1rem', border: '1px solid var(--border-color)', borderRadius: '6px', textDecoration: 'none', color: 'var(--text-primary)', fontWeight: '500' }}>
              Chuyển đến trang Xác minh
            </Link>
          </div>
        </div>

        {/* Right column: Reputation */}
        <div className={styles.rightCol}>
          <ReputationCard
            kycStatus={profile?.kyc_status || 'none'}
            totalGroupsCompleted={profile?.total_groups_completed || 0}
            onTimeRate={profile?.on_time_rate || 0}
            totalLateCount={profile?.total_late_count || 0}
            openDisputes={profile?.open_disputes || 0}
            activeGroupsAsOwner={profile?.active_groups_as_owner || 0}
          />

          {/* Account Info */}
          <div className={styles.infoCard}>
            <h3 className={styles.infoTitle}>Thông tin tài khoản</h3>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Email</span>
              <span className={styles.infoValue}>
                {user.email?.endsWith('@sms.huitin.com') ? `${profile?.phone || 'user'}@sohuitin.com` : user.email}
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>ID</span>
              <span className={styles.infoValue} title={user.id}>
                {user.id.slice(0, 8)}...
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Đăng ký</span>
              <span className={styles.infoValue}>
                {user.created_at
                  ? new Intl.DateTimeFormat('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    }).format(new Date(user.created_at))
                  : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Theme Switcher */}
      <div className={styles.themeSection}>
        <span className={styles.themeLabel} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><IconSettings size={20} /> Giao diện</span>
        <ThemeSwitcher />
      </div>

      {/* Mobile logout button */}
      <div className={styles.logoutSection}>
        <form action={signOut}>
          <button type="submit" className={styles.logoutBtn} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <IconLogout size={20} /> Đăng xuất
          </button>
        </form>
      </div>
    </div>
  );
}
