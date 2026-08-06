import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getSubscriptionStatus, getActiveGroupCount } from '@/features/subscription/actions';
import Badge from '@/components/ui/Badge';
import { formatVND } from '@/lib/constants';
import VipPayment from './VipPayment';
import styles from './page.module.css';

export const metadata = {
  title: 'Nâng cấp VIP',
};

export default async function VipPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/dang-nhap');

  const sub = await getSubscriptionStatus(user.id);
  const activeCount = await getActiveGroupCount(user.id);
  const userCode = user.email?.split('@')[0] || user.id.slice(0, 8);

  const features = [
    { name: 'Tạo dây hụi', free: 'Tối đa 1 dây', vip: 'Không giới hạn', icon: '📋' },
    { name: 'Biên nhận điện tử', free: '✅', vip: '✅', icon: '🧾' },
    { name: 'Bốc thăm kiểm chứng', free: '✅', vip: '✅', icon: '🎲' },
    { name: 'Báo cáo PDF Pro & Ký số', free: '❌', vip: '✅', icon: '📊' },
    { name: 'Chế độ riêng tư Sổ Hụi', free: '❌', vip: '✅', icon: '🔒' },
    { name: 'Đối soát ngân hàng tự động', free: '❌', vip: '🔜 Sắp ra mắt', icon: '🏦' },
    { name: 'Nhắc nợ qua Zalo/SMS', free: '❌', vip: '🔜 Sắp ra mắt', icon: '📱' },
    { name: 'Phân quyền Trợ lý', free: '❌', vip: '🔜 Sắp ra mắt', icon: '👥' },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroGlow} />
        <h1 className={styles.heroTitle}>
          <span className={styles.heroIcon}>💎</span> Nâng cấp VIP
        </h1>
        <p className={styles.heroDesc}>
          Mở khóa toàn bộ tính năng cao cấp, quản lý dây hụi chuyên nghiệp và tiết kiệm thời gian.
        </p>
      </div>

      {sub.isVip && (
        <div className={styles.currentPlan}>
          <Badge variant="primary">💎 VIP đang hoạt động</Badge>
          <p>Gói VIP của bạn có hiệu lực đến: <strong>{sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString('vi-VN') : 'Vĩnh viễn'}</strong></p>
        </div>
      )}

      {!sub.isVip && (
        <div className={styles.statusBar}>
          <span>Gói hiện tại: <Badge variant="default">Free</Badge></span>
          <span>Dây hụi đang hoạt động: <strong>{activeCount}/1</strong></span>
        </div>
      )}

      {/* Pricing cards */}
      <div className={styles.pricingGrid}>
        <div className={styles.pricingCard}>
          <div className={styles.pricingHeader}>
            <h2>Free</h2>
            <div className={styles.pricingPrice}>
              <span className={styles.priceAmount}>{formatVND(0)}</span>
              <span className={styles.priceUnit}>/mãi mãi</span>
            </div>
          </div>
          <ul className={styles.pricingFeatures}>
            <li>✅ Tối đa 1 dây hụi</li>
            <li>✅ Biên nhận điện tử</li>
            <li>✅ Bốc thăm kiểm chứng</li>
            <li>✅ Chat nhóm</li>
            <li>✅ Thỏa thuận ký số</li>
            <li className={styles.featureDisabled}>❌ Chế độ riêng tư</li>
            <li className={styles.featureDisabled}>❌ Báo cáo PDF Pro</li>
            <li className={styles.featureDisabled}>❌ Đối soát ngân hàng</li>
          </ul>
          {!sub.isVip && (
            <div className={styles.pricingCta}>
              <button className={styles.btnFree} disabled>Gói hiện tại</button>
            </div>
          )}
        </div>

        <div className={`${styles.pricingCard} ${styles.pricingCardVip}`}>
          <div className={styles.pricingBadge}>Phổ biến nhất</div>
          <div className={styles.pricingHeader}>
            <h2>💎 VIP</h2>
            <div className={styles.pricingPrice}>
              <span className={styles.priceAmount}>{formatVND(49000)}</span>
              <span className={styles.priceUnit}>/tháng</span>
            </div>
            <div className={styles.pricingSave}>
              Hoặc {formatVND(490000)}/năm (tiết kiệm 17%)
            </div>
          </div>
          <ul className={styles.pricingFeatures}>
            <li>✅ <strong>Không giới hạn</strong> dây hụi</li>
            <li>✅ Biên nhận điện tử</li>
            <li>✅ Bốc thăm kiểm chứng</li>
            <li>✅ Chat nhóm</li>
            <li>✅ Thỏa thuận ký số</li>
            <li>✅ <strong>Báo cáo PDF Pro & Ký số</strong></li>
            <li>✅ <strong>Chế độ riêng tư Sổ Hụi</strong></li>
            <li>🔜 Đối soát ngân hàng tự động</li>
          </ul>
          {!sub.isVip ? (
            <div className={styles.pricingCta}>
              <a href="#upgrade" className={styles.btnVip}>Nâng cấp ngay 🚀</a>
            </div>
          ) : (
            <div className={styles.pricingCta}>
              <button className={styles.btnVip} disabled>Đang sử dụng</button>
            </div>
          )}
        </div>
      </div>

      {/* Feature comparison table */}
      <div className={styles.comparisonSection}>
        <h2 className={styles.comparisonTitle}>So sánh chi tiết</h2>
        <div className={styles.tableWrap}>
          <table className={styles.comparisonTable}>
            <thead>
              <tr>
                <th>Tính năng</th>
                <th>Free</th>
                <th className={styles.vipCol}>💎 VIP</th>
              </tr>
            </thead>
            <tbody>
              {features.map((f) => (
                <tr key={f.name}>
                  <td><span className={styles.featureIcon}>{f.icon}</span> {f.name}</td>
                  <td>{f.free}</td>
                  <td className={styles.vipCol}>{f.vip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* VietQR Payment Section */}
      {!sub.isVip && (
        <VipPayment userId={user.id} userCode={userCode} />
      )}
    </div>
  );
}

