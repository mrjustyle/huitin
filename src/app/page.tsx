import Link from 'next/link';
import styles from './page.module.css';
import { 
  IconBrand,
  IconAgreement,
  IconLedger,
  IconQR,
  IconNotification,
  IconSecurity,
  IconRules
} from '@/components/ui/Icons';

export default function LandingPage() {
  return (
    <div className={styles.landing}>
      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={`container ${styles.navInner}`}>
          <Link href="/" className={styles.navLogo}>
            <IconBrand size={32} />
            <span>Hụi Tín</span>
          </Link>
          <div className={styles.navLinks}>
            <Link href="/blog" className={styles.navLink}>
              Blog
            </Link>
            <Link href="/huong-dan" className={styles.navLink}>
              Hướng dẫn
            </Link>
            <Link href="/dang-nhap" className={styles.navLink}>
              Đăng nhập
            </Link>
            <Link href="/dang-ky" className={styles.navCta}>
              Đăng ký miễn phí
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <span className={styles.heroBadgeDot} />
              Miễn phí cho dây hụi đầu tiên
            </div>
            <h1 className={styles.heroTitle}>
              Góp rõ ràng.
              <br />Giữ trọn
              <span className={styles.heroHighlight}> chữ tín.</span>
            </h1>
            <p className={styles.heroDesc}>
              Sổ hụi điện tử giúp quản lý dây hụi rõ ràng và minh bạch. 
              Thỏa thuận điện tử, sổ hụi số, biên nhận tự động và nhắc đóng hụi.
            </p>
            <div className={styles.heroActions}>
              <Link href="/dang-ky" className={styles.heroBtn}>
                Bắt đầu miễn phí
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <a href="#features" className={styles.heroBtnSecondary}>
                Tìm hiểu thêm
              </a>
            </div>
          </div>
          <div className={styles.heroVisual}>
            <div className={styles.phoneFrame}>
              <div className={styles.phoneScreen}>
                <div className={styles.mockHeader}>
                  <div className={styles.mockAvatar} />
                  <div>
                    <div className={styles.mockTitle}>Dây hụi gia đình</div>
                    <div className={styles.mockSub}>12 thành viên · Hàng tháng</div>
                  </div>
                </div>
                <div className={styles.mockCard}>
                  <div className={styles.mockLabel}>Kỳ tiếp theo</div>
                  <div className={styles.mockAmount}>2.000.000 ₫</div>
                  <div className={styles.mockDate}>Đến hạn: 20/07/2026</div>
                </div>
                <div className={styles.mockTimeline}>
                  <div className={`${styles.mockDot} ${styles.mockDotDone}`} />
                  <div className={`${styles.mockDot} ${styles.mockDotDone}`} />
                  <div className={`${styles.mockDot} ${styles.mockDotActive}`} />
                  <div className={styles.mockDot} />
                  <div className={styles.mockDot} />
                  <div className={styles.mockDot} />
                </div>
                <div className={styles.mockQR}>
                  <div className={styles.mockQRBox}>QR</div>
                  <div className={styles.mockQRLabel}>Quét để đóng hụi</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.heroGlow1} />
        <div className={styles.heroGlow2} />
      </section>

      {/* Features */}
      <section className={styles.features} id="features">
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Tại sao chọn Hụi Tín?</h2>
            <p className={styles.sectionDesc}>
              Giải pháp toàn diện giúp bạn quản lý dây hụi dễ dàng, 
              minh bạch và an toàn hơn bao giờ hết.
            </p>
          </div>
          <div className={styles.featureGrid}>
            {features.map((f, i) => (
              <div
                key={i}
                className={styles.featureCard}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className={styles.featureIcon}>{f.icon}</div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className={styles.howItWorks}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Dễ dàng 4 bước</h2>
          </div>
          <div className={styles.stepsGrid}>
            {steps.map((s, i) => (
              <div key={i} className={styles.step}>
                <div className={styles.stepNumber}>{i + 1}</div>
                <h3 className={styles.stepTitle}>{s.title}</h3>
                <p className={styles.stepDesc}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <div className="container">
          <div className={styles.ctaCard}>
            <h2 className={styles.ctaTitle}>Sẵn sàng quản lý hụi minh bạch?</h2>
            <p className={styles.ctaDesc}>
              Đăng ký miễn phí và tạo dây hụi đầu tiên ngay hôm nay.
            </p>
            <Link href="/dang-ky" className={styles.ctaBtn}>
              Đăng ký miễn phí
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={`container ${styles.footerInner}`}>
          <div className={styles.footerBrand}>
            <IconBrand size={28} />
            <span>Hụi Tín</span>
          </div>
          <p className={styles.footerNote}>
            © 2026 Hụi Tín. Nền tảng quản lý hụi — không phải tổ chức tín dụng hoặc ngân hàng.
          </p>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: <IconAgreement size={32} />,
    title: 'Thỏa thuận điện tử',
    desc: 'Tạo thỏa thuận tự động từ cấu hình dây hụi, ký xác nhận bằng OTP. Lưu lịch sử phiên bản.',
  },
  {
    icon: <IconLedger size={32} />,
    title: 'Sổ hụi số hóa',
    desc: 'Theo dõi đóng/lĩnh realtime. Xuất PDF, Excel. Mọi thay đổi đều có audit log.',
  },
  {
    icon: <IconQR size={32} />,
    title: 'VietQR & chứng từ',
    desc: 'Quét mã QR để chuyển khoản nhanh. Tải chứng từ. Xác nhận hai bên.',
  },
  {
    icon: <IconNotification size={32} />,
    title: 'Nhắc lịch tự động',
    desc: 'Nhắc trước hạn, đến hạn và quá hạn. Không sợ quên đóng hụi.',
  },
  {
    icon: <IconSecurity size={32} />,
    title: 'An toàn & minh bạch',
    desc: 'Dữ liệu mã hóa. Không thể sửa đổi âm thầm. Mọi thay đổi đều để lại dấu vết.',
  },
  {
    icon: <IconRules size={32} />,
    title: 'Hỗ trợ pháp lý',
    desc: 'Cảnh báo khi cần thông báo UBND. Sinh mẫu thông báo tự động theo NĐ 19/2019.',
  },
];

const steps = [
  {
    title: 'Tạo dây hụi',
    desc: 'Cấu hình loại hụi, số tiền, lịch, quy tắc và hoa hồng.',
  },
  {
    title: 'Mời thành viên',
    desc: 'Gửi link, mã QR hoặc mã mời cho người quen.',
  },
  {
    title: 'Ký thỏa thuận',
    desc: 'Tất cả thành viên đọc và ký xác nhận thỏa thuận trước khi bắt đầu.',
  },
  {
    title: 'Bắt đầu chơi hụi',
    desc: 'Đóng tiền qua QR, upload chứng từ, xác nhận — tất cả online.',
  },
];
