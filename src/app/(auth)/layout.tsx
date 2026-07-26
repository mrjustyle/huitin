import { IconBrand, IconAgreement, IconLedger, IconNotification, IconConfirmed } from '@/components/ui/Icons';
import styles from './layout.module.css';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.authLayout}>
      <div className={styles.brandSide}>
        <div className={styles.brandContent}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <IconBrand size={48} />
            </div>
            <h1 className={styles.brandName}>Hụi Tín</h1>
          </div>
          <p className={styles.tagline}>
            Góp rõ ràng.<br />Giữ trọn chữ tín.
          </p>
          <div className={styles.features}>
            <div className={styles.feature}>
              <span className={styles.featureIcon}><IconAgreement size={20} /></span>
              <span>Thỏa thuận điện tử có pháp lý</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}><IconLedger size={20} /></span>
              <span>Sổ hụi số hóa, minh bạch</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}><IconNotification size={20} /></span>
              <span>Nhắc đóng hụi tự động</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}><IconConfirmed size={20} /></span>
              <span>Xác nhận giao dịch hai bên</span>
            </div>
          </div>
        </div>
        <div className={styles.decorCircle1} />
        <div className={styles.decorCircle2} />
        <div className={styles.decorCircle3} />
      </div>
      <div className={styles.formSide}>
        <div className={styles.formContainer}>
          {children}
        </div>
      </div>
    </div>
  );
}
