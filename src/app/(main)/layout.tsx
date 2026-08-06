import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import styles from './layout.module.css';
import { signOut } from '@/features/auth/actions';
import Link from 'next/link';
import React from 'react';
import NotificationBell from '@/components/ui/NotificationBell';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { NavItem } from './NavItem';
import { IconBrand, IconHome, IconCycle, IconVerified, IconAccount, IconSecurity } from '@/components/ui/Icons';
import ClientProviders from './ClientProviders';
import InstallPWA from '@/components/ui/InstallPWA';
import LinkPhoneOverlay from '@/components/auth/LinkPhoneOverlay';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/dang-nhap');
  }

  const needsPhone = !user.phone;

  const displayName =
    user.user_metadata?.full_name || user.email?.split('@')[0] || 'Người dùng';

  // Check admin role
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'support';

  return (
    <div className={styles.mainLayout}>
      {/* Sidebar — desktop */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Link href="/trang-chu" className={styles.logo}>
            <IconBrand size={28} />
            <span>Hụi Tín</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <ThemeToggle />
            <NotificationBell />
          </div>
        </div>

        <nav className={styles.nav}>
          <NavItem href="/trang-chu" icon={<IconHome />} label="Trang chủ" />
          <NavItem href="/day-hui" icon={<IconCycle />} label="Dây hụi" />
          <NavItem href="/vip" icon={<span style={{ fontSize: '1.1rem' }}>💎</span>} label="VIP" />
          <NavItem href="/kyc" icon={<IconVerified />} label="Xác minh" />
          <NavItem href="/tai-khoan" icon={<IconAccount />} label="Tài khoản" />
          {isAdmin && <NavItem href="/admin" icon={<IconSecurity />} label="Admin" />}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className={styles.userMeta}>
              <p className={styles.userName}>{displayName}</p>
              <p className={styles.userEmail}>{user.email}</p>
            </div>
            <form action={signOut}>
              <button type="submit" className={styles.logoutBtn} title="Đăng xuất">
                ⏻
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <div className={styles.mobileTopHeader}>
        <Link href="/trang-chu" className={styles.logo}>
          <IconBrand size={24} />
          <span>Hụi Tín</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ThemeToggle />
        </div>
      </div>

      {/* Main content */}
      <main className={styles.main}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </main>

      {/* Bottom nav — mobile */}
      <nav className={styles.bottomNav}>
        <NavItem href="/trang-chu" icon={<IconHome />} label="Trang chủ" mobile />
        <NavItem href="/day-hui" icon={<IconCycle />} label="Dây hụi" mobile />
        <NavItem href="/kyc" icon={<IconVerified />} label="Xác minh" mobile />
        <NavItem href="/tai-khoan" icon={<IconAccount />} label="Tài khoản" mobile />
        {isAdmin && <NavItem href="/admin" icon={<IconSecurity />} label="Admin" mobile />}
      </nav>

      <InstallPWA />
      
      {needsPhone && <LinkPhoneOverlay />}
    </div>
  );
}
