'use client';

import styles from './PageLoader.module.css';

interface PageLoaderProps {
  /** Số dòng skeleton hiển thị */
  lines?: number;
  /** Hiện header skeleton (tiêu đề trang) */
  showHeader?: boolean;
  /** Hiện card skeleton */
  showCards?: number;
}

export default function PageLoader({ lines = 3, showHeader = true, showCards = 0 }: PageLoaderProps) {
  return (
    <div className={styles.loader} aria-busy="true" aria-label="Đang tải...">
      {showHeader && (
        <div className={styles.header}>
          <div className={`${styles.skeleton} ${styles.skTitle}`} />
          <div className={`${styles.skeleton} ${styles.skSubtitle}`} />
        </div>
      )}

      {showCards > 0 && (
        <div className={styles.cardGrid}>
          {Array.from({ length: showCards }).map((_, i) => (
            <div key={i} className={styles.card}>
              <div className={`${styles.skeleton} ${styles.skLabel}`} />
              <div className={`${styles.skeleton} ${styles.skValue}`} />
            </div>
          ))}
        </div>
      )}

      <div className={styles.lines}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${styles.skeleton} ${styles.skLine}`}
            style={{ width: `${85 - i * 12}%`, animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
    </div>
  );
}
