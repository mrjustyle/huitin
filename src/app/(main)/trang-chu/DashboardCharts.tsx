'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import type { DashboardStats } from '@/features/dashboard/actions';
import { IconCashOut, IconCashIn, IconLedger, IconCompleted, IconTrendUp, IconTrendDown, IconChart, IconDonut } from '@/components/ui/Icons';
import EmptyState from '@/components/ui/EmptyState';
import styles from './DashboardCharts.module.css';

const COLORS = ['#16A085', '#2980B9', '#8E44AD', '#E67E22', '#E74C3C', '#1ABC9C'];

function formatCompact(val: number): string {
  if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}tỷ`;
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}tr`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}k`;
  return val.toString();
}

function formatVND(val: number): string {
  return new Intl.NumberFormat('vi-VN').format(val) + ' ₫';
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className={styles.tooltipValue}>
          {p.name}: {formatVND(p.value)}
        </p>
      ))}
    </div>
  );
};

export function CashflowChart({ data }: { data: DashboardStats['cashflowByMonth'] }) {
  if (!data.length || data.every(d => d.contributed === 0 && d.received === 0)) {
    return (
      <div className={styles.chartCard}>
        <h3 className={styles.chartTitle}><IconChart size={18} /> Dòng tiền</h3>
        <EmptyState 
          icon={<IconChart size={48} />} 
          title="Chưa có dữ liệu"
          description="Bạn chưa có hoạt động đóng/nhận hụi nào trong 6 tháng gần đây."
        />
      </div>
    );
  }

  return (
    <div className={styles.chartCard}>
      <h3 className={styles.chartTitle}><IconChart size={18} /> Dòng tiền 6 tháng gần nhất</h3>
      <div className={styles.chartWrap}>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorContributed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E74C3C" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#E74C3C" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#16A085" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#16A085" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-200)" />
            <XAxis dataKey="month" stroke="var(--text-tertiary)" fontSize={12} />
            <YAxis stroke="var(--text-tertiary)" fontSize={11} tickFormatter={formatCompact} width={50} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="contributed"
              name="Đã đóng"
              stroke="#E74C3C"
              strokeWidth={2}
              fill="url(#colorContributed)"
            />
            <Area
              type="monotone"
              dataKey="received"
              name="Đã nhận"
              stroke="#16A085"
              strokeWidth={2}
              fill="url(#colorReceived)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className={styles.chartLegend}>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: '#E74C3C' }} /> Đã đóng
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: '#16A085' }} /> Đã nhận
        </span>
      </div>
    </div>
  );
}

export function GroupBreakdownChart({ data }: { data: DashboardStats['groupBreakdown'] }) {
  if (!data.length) {
    return (
      <div className={styles.chartCard}>
        <h3 className={styles.chartTitle}><IconDonut size={18} /> Phân bổ dây hụi</h3>
        <EmptyState 
          icon={<IconDonut size={48} />} 
          title="Chưa có dữ liệu"
          description="Tham gia hoặc tạo dây hụi để xem phân bổ dòng tiền của bạn."
        />
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className={styles.chartCard}>
      <h3 className={styles.chartTitle}><IconDonut size={18} /> Phân bổ dây hụi</h3>
      <div className={styles.chartWrap}>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={3}
              dataKey="value"
              nameKey="name"
              stroke="none"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any) => formatVND(Number(value))}
              contentStyle={{
                background: 'var(--card-bg)',
                border: '1px solid var(--color-gray-200)',
                borderRadius: '8px',
                fontSize: '13px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className={styles.pieList}>
        {data.map((d, i) => (
          <div key={i} className={styles.pieItem}>
            <span className={styles.pieDot} style={{ background: COLORS[i % COLORS.length] }} />
            <span className={styles.pieName}>{d.name}</span>
            <span className={styles.pieValue}>
              {total > 0 ? Math.round((d.value / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function KPICards({ stats }: { stats: DashboardStats }) {
  const cards = [
    { label: 'Tổng đã đóng', value: stats.totalContributed, color: '#E74C3C', icon: <IconCashOut size={20} /> },
    { label: 'Tổng đã nhận', value: stats.totalReceived, color: '#16A085', icon: <IconCashIn size={20} /> },
    { label: 'Dây hoạt động', value: stats.activeGroups, color: '#2980B9', icon: <IconLedger size={20} />, isCount: true },
    { label: 'Kỳ đã hoàn thành', value: stats.completedPeriods, color: '#8E44AD', icon: <IconCompleted size={20} />, isCount: true },
  ];

  const netFlow = stats.totalReceived - stats.totalContributed;

  return (
    <div className={styles.kpiGrid}>
      {cards.map((c, i) => (
        <div key={i} className={styles.kpiCard}>
          <div className={styles.kpiIcon}>{c.icon}</div>
          <div className={styles.kpiInfo}>
            <p className={styles.kpiValue} style={{ color: c.color }}>
              {(c as any).isCount ? c.value : formatCompact(c.value)}
            </p>
            <p className={styles.kpiLabel}>{c.label}</p>
          </div>
        </div>
      ))}
      <div className={`${styles.kpiCard} ${styles.kpiCardWide}`}>
        <div className={styles.kpiIcon}>{netFlow >= 0 ? <IconTrendUp size={20} /> : <IconTrendDown size={20} />}</div>
        <div className={styles.kpiInfo}>
          <p className={styles.kpiValue} style={{ color: netFlow >= 0 ? '#16A085' : '#E74C3C' }}>
            {netFlow >= 0 ? '+' : ''}{formatCompact(netFlow)}
          </p>
          <p className={styles.kpiLabel}>Lãi/lỗ ròng</p>
        </div>
      </div>
    </div>
  );
}
