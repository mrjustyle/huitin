'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[App Error]', error);
  }, [error]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😵</div>
      <h2 style={{
        fontSize: '1.4rem',
        fontWeight: 600,
        color: 'var(--text-primary)',
        marginBottom: '0.5rem',
      }}>
        Có lỗi xảy ra
      </h2>
      <p style={{
        fontSize: '0.9rem',
        color: 'var(--text-secondary)',
        marginBottom: '1.5rem',
        maxWidth: 400,
        lineHeight: 1.6,
      }}>
        Đã xảy ra lỗi không mong muốn. Vui lòng thử lại hoặc liên hệ hỗ trợ nếu lỗi tiếp tục.
      </p>
      {error.digest && (
        <p style={{
          fontSize: '0.75rem',
          color: 'var(--text-tertiary)',
          marginBottom: '1rem',
          fontFamily: 'monospace',
        }}>
          Mã lỗi: {error.digest}
        </p>
      )}
      <button
        onClick={reset}
        style={{
          padding: '0.7rem 1.5rem',
          background: 'linear-gradient(135deg, var(--color-primary-500, #16A085), var(--color-primary-600, #138D75))',
          color: 'white',
          border: 'none',
          borderRadius: 10,
          fontSize: '0.9rem',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(22, 160, 133, 0.3)',
          transition: 'all 0.2s',
        }}
      >
        Thử lại
      </button>
    </div>
  );
}
