import Link from 'next/link';

export const metadata = {
  title: 'Chính sách bảo mật | Hụi Tín',
  description: 'Chính sách bảo mật và quyền riêng tư của ứng dụng Hụi Tín',
};

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <header style={{ 
        padding: 'var(--space-4) var(--space-6)', 
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-4)',
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <Link href="/" style={{ color: 'var(--text-tertiary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>← Quay lại</span>
        </Link>
        <h1 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', margin: 0, color: 'var(--color-primary-600)' }}>Hụi Tín</h1>
      </header>

      <main style={{ maxWidth: '800px', margin: '0 auto', padding: 'var(--space-8) var(--space-6)' }}>
        <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--space-8)' }}>
          Chính sách bảo mật
        </h1>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <section>
            <h2 style={{ fontSize: 'var(--font-size-xl)', color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>1. Thu thập thông tin</h2>
            <p>Khi bạn sử dụng Hụi Tín, chúng tôi thu thập một số thông tin cần thiết để cung cấp dịch vụ tốt nhất:</p>
            <ul style={{ paddingLeft: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <li>Thông tin tài khoản: Số điện thoại, Email, Hình đại diện (từ Google/Zalo).</li>
              <li>Thông tin danh tính (eKYC): Họ tên, Số CCCD, hình chụp giấy tờ tùy thân và chân dung (chỉ dùng để xác minh danh tính nhằm tăng độ uy tín, được mã hóa an toàn).</li>
              <li>Dữ liệu sử dụng: Các dây hụi bạn tạo, lịch sử thanh toán, ghi chú sổ hụi.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 'var(--font-size-xl)', color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>2. Sử dụng thông tin</h2>
            <p>Chúng tôi sử dụng thông tin của bạn vào các mục đích:</p>
            <ul style={{ paddingLeft: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <li>Khởi tạo và duy trì tài khoản của bạn.</li>
              <li>Cung cấp tính năng quản lý sổ hụi, tạo thỏa thuận điện tử có chữ ký số.</li>
              <li>Gửi thông báo nhắc hụi, thông báo đóng tiền, xác nhận giao dịch.</li>
              <li>Ngăn chặn gian lận và duy trì môi trường minh bạch cho tất cả người dùng.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 'var(--font-size-xl)', color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>3. Bảo mật dữ liệu</h2>
            <p>Dữ liệu của bạn được lưu trữ an toàn trên hạ tầng đám mây đạt chuẩn quốc tế (Supabase/Google Cloud). Mọi thông tin nhạy cảm (như mã PIN, dữ liệu eKYC) đều được mã hóa một chiều hoặc mã hóa bảo vệ (encryption at rest). Chỉ những người dùng có quyền trong cùng một dây hụi mới có thể xem thông tin của dây hụi đó.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 'var(--font-size-xl)', color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>4. Chia sẻ thông tin</h2>
            <p>Hụi Tín cam kết tuyệt đối <strong>không bán, cho thuê hoặc chia sẻ dữ liệu cá nhân của bạn</strong> cho bên thứ ba vì mục đích tiếp thị hoặc thương mại. Chúng tôi chỉ chia sẻ thông tin cho cơ quan chức năng khi có yêu cầu hợp pháp theo quy định của pháp luật Việt Nam.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 'var(--font-size-xl)', color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>5. Quyền của người dùng</h2>
            <p>Bạn có quyền truy cập, chỉnh sửa hoặc yêu cầu xóa toàn bộ dữ liệu cá nhân (kể cả tài khoản) bất kỳ lúc nào bằng cách sử dụng chức năng trong ứng dụng hoặc liên hệ với bộ phận hỗ trợ của chúng tôi.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
