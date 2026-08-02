import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import styles from './layout.module.css';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/dang-nhap');

  // Double-check admin role (middleware is first line of defense)
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'admin' || profile?.role === 'support';
  if (!isAdmin) redirect('/trang-chu?error=no_admin');

  return (
    <div className={styles.adminShell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>🛡️</span>
          <span>Admin Portal</span>
        </div>
        <nav className={styles.nav}>
          <Link href="/admin" className={styles.navLink}>
            📊 Dashboard
          </Link>
          <Link href="/admin/users" className={styles.navLink}>
            👤 Người dùng
          </Link>
          <Link href="/admin/groups" className={styles.navLink}>
            🔗 Dây hụi
          </Link>
          <Link href="/admin/kyc" className={styles.navLink}>
            ✅ Duyệt KYC
          </Link>
          <Link href="/admin/otps" className={styles.navLink}>
            🔐 Logs OTP
          </Link>
          <Link href="/admin/disputes" className={styles.navLink}>
            ⚠️ Khiếu nại
          </Link>
          <Link href="/admin/audit" className={styles.navLink}>
            📋 Audit Log
          </Link>
          <Link href="/admin/risks" className={styles.navLink}>
            ⚠️ Rủi ro
          </Link>
          <div className={styles.navDivider} />
          <Link href="/trang-chu" className={styles.navLink}>
            ← Về trang chủ
          </Link>
        </nav>
      </aside>
      <main className={styles.content}>
        {children}
      </main>
    </div>
  );
}
