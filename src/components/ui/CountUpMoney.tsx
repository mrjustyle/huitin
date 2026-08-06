'use client';

import CountUp from 'react-countup';
import { formatVND } from '@/lib/constants';

interface CountUpMoneyProps {
  value: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  duration?: number;
}

export default function CountUpMoney({
  value,
  className,
  prefix = '',
  suffix = '',
  duration = 1.5
}: CountUpMoneyProps) {
  return (
    <span className={className}>
      {prefix}
      <CountUp
        end={value}
        duration={duration}
        separator="."
        decimal=","
        formattingFn={(v) => formatVND(v).replace(' ₫', '')}
      />
      {suffix || ' ₫'}
    </span>
  );
}
