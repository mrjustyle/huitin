import Link from 'next/link';
import { getMyGroups } from '@/features/hui/actions';
import JoinByCode from './JoinByCode';
import GroupListClient from './GroupListClient';
import styles from './page.module.css';
import { IconCycle } from '@/components/ui/Icons';
import EmptyState from '@/components/ui/EmptyState';

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
        <EmptyState 
          icon={<IconCycle size={48} />}
          title="Chưa có dây hụi"
          description="Tạo dây hụi đầu tiên hoặc tham gia bằng mã mời."
          actionLabel="Tạo dây hụi"
          actionHref="/day-hui/tao-moi"
        />
      ) : (
        <GroupListClient groups={groups} />
      )}
    </div>
  );
}
