import React from 'react';
import styles from './EmptyState.module.css';
import Button from './Button';
import Link from 'next/link';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  actionOnClick?: () => void;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  actionOnClick,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`${styles.emptyState} ${className}`}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      
      {actionLabel && (
        <div className={styles.action}>
          {actionHref ? (
            <Link href={actionHref}>
              <Button variant="outline">{actionLabel}</Button>
            </Link>
          ) : (
            <Button variant="outline" onClick={actionOnClick}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
