import React from 'react';
import styles from './Skeleton.module.css';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  circle?: boolean;
}

export default function Skeleton({
  className = '',
  width,
  height,
  borderRadius,
  circle = false,
}: SkeletonProps) {
  return (
    <div
      className={`${styles.skeleton} ${circle ? styles.circle : ''} ${className}`}
      style={{
        width,
        height,
        borderRadius: circle ? '50%' : borderRadius,
      }}
    />
  );
}
