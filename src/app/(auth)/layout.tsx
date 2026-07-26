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
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="22" stroke="white" strokeWidth="2.5" />
                <circle cx="24" cy="16" r="6" fill="white" opacity="0.9" />
                <circle cx="16" cy="30" r="5" fill="white" opacity="0.7" />
                <circle cx="32" cy="30" r="5" fill="white" opacity="0.7" />
                <path d="M18 16 L24 30 L30 16" stroke="white" strokeWidth="1.5" opacity="0.4" />
                <path d="M16 30 L32 30" stroke="white" strokeWidth="1.5" opacity="0.4" />
              </svg>
            </div>
            <h1 className={styles.brandName}>Hụi Tín</h1>
          </div>
          <p className={styles.tagline}>
            Quản lý hụi minh bạch<br />cho nhóm người quen
          </p>
          <div className={styles.features}>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>🔒</span>
              <span>Thỏa thuận điện tử có pháp lý</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>📊</span>
              <span>Sổ hụi số hóa, minh bạch</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>🔔</span>
              <span>Nhắc đóng hụi tự động</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>✅</span>
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
