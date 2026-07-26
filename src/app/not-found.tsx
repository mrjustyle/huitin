import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
      <h1 style={{
        fontSize: '2rem',
        fontWeight: 700,
        color: 'var(--text-primary)',
        marginBottom: '0.5rem',
      }}>
        404 — Không tìm thấy trang
      </h1>
      <p style={{
        fontSize: '1rem',
        color: 'var(--text-secondary)',
        marginBottom: '2rem',
        maxWidth: 420,
        lineHeight: 1.6,
      }}>
        Trang bạn đang tìm không tồn tại hoặc đã bị xóa.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          href="/"
          style={{
            padding: '0.7rem 1.5rem',
            background: 'linear-gradient(135deg, var(--color-primary-500, #16A085), var(--color-primary-600, #138D75))',
            color: 'white',
            border: 'none',
            borderRadius: 10,
            fontSize: '0.9rem',
            fontWeight: 600,
            boxShadow: '0 2px 8px rgba(22, 160, 133, 0.3)',
          }}
        >
          ← Về trang chủ
        </Link>
        <Link
          href="/blog"
          style={{
            padding: '0.7rem 1.5rem',
            background: 'var(--bg-secondary, #f8fafc)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: 10,
            fontSize: '0.9rem',
            fontWeight: 500,
          }}
        >
          Đọc blog
        </Link>
      </div>
    </div>
  );
}
