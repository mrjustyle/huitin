import Link from 'next/link';
import styles from './page.module.css';

export const metadata = {
  title: 'Hướng dẫn sử dụng — Hụi Tín',
  description: 'Video hướng dẫn chi tiết cách sử dụng Hụi Tín: tạo dây hụi, mời thành viên, ký thỏa thuận, đóng tiền và quản lý sổ hụi.',
};

const GUIDE_SECTIONS = [
  {
    id: 'bat-dau',
    icon: '🚀',
    title: 'Bắt đầu với Hụi Tín',
    desc: 'Đăng ký tài khoản, xác minh KYC và thiết lập ngân hàng.',
    steps: [
      'Truy cập sohuitin.com → nhấn "Đăng ký miễn phí"',
      'Điền email + mật khẩu, xác nhận email',
      'Vào trang "Xác minh" → upload CCCD 2 mặt + ảnh selfie',
      'Vào "Tài khoản" → thêm tài khoản ngân hàng nhận tiền',
    ],
  },
  {
    id: 'tao-day-hui',
    icon: '📋',
    title: 'Tạo dây hụi mới',
    desc: 'Wizard 5 bước để tạo dây hụi: loại → cấu hình → lịch trình → quy tắc → xem trước.',
    steps: [
      'Nhấn "+ Tạo dây hụi mới" trên trang chủ',
      'Chọn loại hụi: không lãi, bốc thăm, đấu giá, hoặc cố định',
      'Cấu hình: số tiền phần hụi, số thành viên, lịch đóng',
      'Thiết lập quy tắc: hoa hồng chủ hụi, phạt trễ hạn',
      'Xem trước và nhấn "Tạo dây hụi"',
    ],
  },
  {
    id: 'moi-thanh-vien',
    icon: '👥',
    title: 'Mời thành viên & Ký thỏa thuận',
    desc: 'Gửi link mời, thành viên tham gia và ký thỏa thuận điện tử.',
    steps: [
      'Sao chép mã mời hoặc link chia sẻ',
      'Gửi link cho người quen qua Zalo/Messenger',
      'Thành viên nhấn link → tham gia dây hụi',
      'Vào tab "Thỏa thuận" → Tạo thỏa thuận tự động',
      'Tất cả thành viên ký xác nhận (OTP)',
      'Chủ hụi kích hoạt dây hụi → bắt đầu chơi!',
    ],
  },
  {
    id: 'dong-hui',
    icon: '💰',
    title: 'Đóng hụi & Lĩnh hụi',
    desc: 'Quét VietQR thanh toán, xác nhận 2 bên, lĩnh hụi khi đến lượt.',
    steps: [
      'Mở kỳ hụi hiện tại → nhấn "Đóng hụi"',
      'Quét mã VietQR để chuyển khoản tự động',
      'Upload ảnh chứng từ chuyển khoản',
      'Chủ hụi xác nhận đã nhận tiền',
      'Khi đến lượt: bỏ thảo (hụi sống) hoặc bốc thăm',
      'Chủ hụi ghi nhận lĩnh hụi → xác nhận cả 2 bên',
    ],
  },
  {
    id: 'so-hui',
    icon: '📊',
    title: 'Sổ hụi & Biên nhận',
    desc: 'Xem sổ hụi điện tử, tải biên nhận PDF, xuất CSV.',
    steps: [
      'Vào chi tiết dây hụi → tab "Sổ hụi"',
      'Xem ma trận: thành viên × kỳ hụi (đóng/nhận)',
      'Nhấn "Xuất PDF" để tải sổ hụi chuyên nghiệp',
      'Tab "Biên nhận" → tải biên nhận có mã hash SHA-256',
      'Mỗi giao dịch đều được ghi audit log bất biến',
    ],
  },
];

const FAQ = [
  {
    q: 'Hụi Tín có miễn phí không?',
    a: 'Có! Dây hụi đầu tiên hoàn toàn miễn phí. Nâng cấp VIP chỉ 99.000 ₫/tháng để mở khóa không giới hạn dây hụi và tính năng cao cấp.',
  },
  {
    q: 'Hụi Tín có giữ tiền không?',
    a: 'KHÔNG. Hụi Tín chỉ là công cụ quản lý, không phải trung gian tài chính. Tiền được chuyển trực tiếp giữa chủ hụi và hụi viên qua ngân hàng.',
  },
  {
    q: 'Thỏa thuận điện tử có giá trị pháp lý không?',
    a: 'Thỏa thuận trên Hụi Tín tuân thủ NĐ 19/2019/NĐ-CP, có ký số OTP và mã hash SHA-256. Đây là bằng chứng điện tử hợp pháp.',
  },
  {
    q: 'Có cần xác minh KYC không?',
    a: 'Bạn cần xác minh CCCD để tạo dây hụi hoặc tham gia với tư cách chủ hụi. Hụi viên có thể tham gia mà chưa cần KYC ngay.',
  },
  {
    q: 'Hỗ trợ loại hụi nào?',
    a: 'Hụi Tín hỗ trợ 4 loại: Hụi không lãi (chết), Hụi bốc thăm, Hụi đấu giá (sống), và Hụi cố định. Đóng theo tuần, tháng hoặc tùy chỉnh.',
  },
];

export default function GuidePage() {
  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={styles.hero}>
        <Link href="/" className={styles.backLink}>← Trang chủ</Link>
        <h1 className={styles.heroTitle}>📖 Hướng dẫn sử dụng</h1>
        <p className={styles.heroDesc}>
          Từ A đến Z — tất cả những gì bạn cần biết để bắt đầu chơi hụi minh bạch với Hụi Tín.
        </p>
      </div>

      {/* Quick nav */}
      <nav className={styles.quickNav}>
        {GUIDE_SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`} className={styles.quickNavItem}>
            <span className={styles.quickNavIcon}>{s.icon}</span>
            <span>{s.title}</span>
          </a>
        ))}
      </nav>

      {/* Sections */}
      <div className={styles.sections}>
        {GUIDE_SECTIONS.map((section, idx) => (
          <section key={section.id} id={section.id} className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionNumber}>{idx + 1}</div>
              <div>
                <h2 className={styles.sectionTitle}>
                  {section.icon} {section.title}
                </h2>
                <p className={styles.sectionDesc}>{section.desc}</p>
              </div>
            </div>

            <div className={styles.stepsList}>
              {section.steps.map((step, i) => (
                <div key={i} className={styles.stepItem}>
                  <div className={styles.stepBullet}>{i + 1}</div>
                  <p className={styles.stepText}>{step}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* FAQ */}
      <div className={styles.faqSection}>
        <h2 className={styles.faqTitle}>❓ Câu hỏi thường gặp</h2>
        <div className={styles.faqList}>
          {FAQ.map((item, i) => (
            <details key={i} className={styles.faqItem}>
              <summary className={styles.faqQuestion}>{item.q}</summary>
              <p className={styles.faqAnswer}>{item.a}</p>
            </details>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className={styles.ctaSection}>
        <h2>Sẵn sàng bắt đầu?</h2>
        <p>Tạo dây hụi đầu tiên miễn phí — chỉ mất 2 phút.</p>
        <div className={styles.ctaButtons}>
          <Link href="/dang-ky" className={styles.ctaPrimary}>Đăng ký miễn phí →</Link>
          <Link href="/blog" className={styles.ctaSecondary}>Đọc thêm blog →</Link>
        </div>
      </div>
    </div>
  );
}
