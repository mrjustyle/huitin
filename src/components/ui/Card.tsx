import { ReactNode, HTMLAttributes } from 'react';
import styles from './Card.module.css';

type CardVariant = 'default' | 'glass' | 'outlined' | 'elevated';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export default function Card({
  variant = 'default',
  hover = false,
  padding = 'md',
  children,
  className = '',
  ...props
}: CardProps) {
  const classNames = [
    styles.card,
    styles[variant],
    styles[`padding-${padding}`],
    hover ? styles.hover : '',
    props.onClick ? styles.clickable : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} {...props}>
      {children}
    </div>
  );
}

/* Sub-components */
export function CardHeader({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div className={`${styles.header} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardBody({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div className={`${styles.body} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div className={`${styles.footer} ${className}`} {...props}>
      {children}
    </div>
  );
}
