import Link from 'next/link';
import { getMyGroups } from '@/features/hui/actions';
import JoinByCode from './JoinByCode';
import GroupListClient from './GroupListClient';
import styles from './page.module.css';
import { IconCycle } from '@/components/ui/Icons';

export const metadata = {
  title: 'Dây hụi',
};

export default async function HuiListPage() {
  const groups = await getMyGroups();

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dây hụi của tôi</h1>
          <p className={styles.subtitle}>{groups.length} dây hụi</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <JoinByCode />
          <Link href="/day-hui/tao-moi" className={styles.createBtn}>
            + Tạo dây hụi
          </Link>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon} style={{ color: 'var(--primary)' }}>
            <IconCycle size={48} />
          </div>
          <h2>Chưa có dây hụi</h2>
          <p>Tạo dây hụi đầu tiên hoặc tham gia bằng mã mời.</p>
          <div className={styles.emptyActions}>
            <Link href="/day-hui/tao-moi" className={styles.emptyBtn}>
              Tạo dây hụi
            </Link>
          </div>
        </div>
      ) : (
        <GroupListClient groups={groups} />
      )}
    </div>
  );
}
