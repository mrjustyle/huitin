import Link from 'next/link';

export const metadata = {
  title: 'Điều khoản dịch vụ | Hụi Tín',
  description: 'Điều khoản dịch vụ và thỏa thuận sử dụng ứng dụng Hụi Tín',
};

export default function TermsPage() {
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
          Điều khoản dịch vụ
        </h1>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <section>
            <h2 style={{ fontSize: 'var(--font-size-xl)', color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>1. Giới thiệu</h2>
            <p>Chào mừng bạn đến với Hụi Tín - Ứng dụng sổ hụi điện tử minh bạch. Bằng việc đăng ký và sử dụng dịch vụ của Hụi Tín, bạn đồng ý tuân thủ các điều khoản và điều kiện dưới đây. Vui lòng đọc kỹ trước khi sử dụng.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 'var(--font-size-xl)', color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>2. Vai trò của Hụi Tín</h2>
            <p>Hụi Tín là một nền tảng công nghệ cung cấp công cụ giúp người dùng tự quản lý dây hụi (họ, biêu, phường). <strong>Hụi Tín không phải là tổ chức tín dụng, ngân hàng hay tổ chức tài chính.</strong> Hụi Tín không huy động vốn, không cho vay, không thu hộ hay giữ tiền của người dùng.</p>
            <p>Mọi giao dịch đóng hụi, nhận hụi đều được thực hiện trực tiếp giữa các thành viên và chủ hụi thông qua phương thức thỏa thuận riêng biệt (như chuyển khoản ngân hàng, tiền mặt).</p>
          </section>

          <section>
            <h2 style={{ fontSize: 'var(--font-size-xl)', color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>3. Trách nhiệm của người dùng</h2>
            <ul style={{ paddingLeft: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <li>Người dùng phải cung cấp thông tin cá nhân chính xác khi đăng ký tài khoản (KYC).</li>
              <li>Chủ hụi chịu trách nhiệm hoàn toàn về tính pháp lý và minh bạch của các dây hụi do mình tạo ra theo quy định của pháp luật Việt Nam (Nghị định 19/2019/NĐ-CP).</li>
              <li>Người chơi hụi có trách nhiệm tìm hiểu kỹ thông tin về chủ hụi và dây hụi trước khi tham gia. Hụi Tín không chịu trách nhiệm giải quyết các tranh chấp tài chính giữa các bên.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 'var(--font-size-xl)', color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>4. Tính năng và Phí dịch vụ</h2>
            <p>Hụi Tín cung cấp cả gói Miễn phí (Free) và gói Trả phí (VIP). Quyền lợi của từng gói được quy định rõ trên ứng dụng. Hụi Tín có quyền thay đổi bảng giá và tính năng bất cứ lúc nào, với thông báo trước tới người dùng thông qua ứng dụng.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 'var(--font-size-xl)', color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>5. Từ chối bảo đảm</h2>
            <p>Hụi Tín không đảm bảo rằng dịch vụ sẽ không bị gián đoạn, không có lỗi hoặc an toàn tuyệt đối. Tuy nhiên, chúng tôi luôn nỗ lực cao nhất để bảo vệ dữ liệu và duy trì hệ thống hoạt động ổn định.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
