'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ReactNode } from 'react';
import styles from './layout.module.css';

export function NavItem({
  href,
  icon,
  label,
  mobile,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  mobile?: boolean;
}) {
  const pathname = usePathname();
  const isActive = pathname.startsWith(href);
  
  return (
    <Link
      href={href}
      className={`${mobile ? styles.bottomNavItem : styles.navItem} ${isActive ? styles.active : ''}`}
    >
      <span className={styles.navIcon}>{icon}</span>
      <span className={mobile ? styles.bottomNavLabel : styles.navLabel}>{label}</span>
    </Link>
  );
}

