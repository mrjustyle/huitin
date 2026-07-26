'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function JoinByCode() {
  const [code, setCode] = useState('');
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = code.trim().toUpperCase();
    if (cleaned.length >= 4) {
      router.push(`/moi/${cleaned}`);
    }
  }

  if (!open) {
    return (
      <button 
        onClick={() => setOpen(true)}
        style={{
          padding: 'var(--space-3) var(--space-5)',
          background: 'var(--color-gray-800)',
          border: '1px dashed var(--color-gray-600)',
          borderRadius: 'var(--radius-lg)',
          color: 'var(--color-gray-300)',
          fontSize: 'var(--font-size-sm)',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        🔑 Nhập mã mời
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="Nhập mã 6 ký tự"
        maxLength={8}
        autoFocus
        style={{
          padding: 'var(--space-2) var(--space-3)',
          background: 'var(--color-gray-800)',
          border: '1px solid var(--color-gray-600)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-gray-100)',
          fontSize: 'var(--font-size-sm)',
          fontWeight: 700,
          letterSpacing: '0.15em',
          width: '140px',
          textAlign: 'center',
          textTransform: 'uppercase',
        }}
      />
      <button
        type="submit"
        disabled={code.trim().length < 4}
        style={{
          padding: 'var(--space-2) var(--space-4)',
          background: code.trim().length >= 4 ? 'var(--color-primary)' : 'var(--color-gray-700)',
          color: code.trim().length >= 4 ? 'var(--color-gray-900)' : 'var(--color-gray-500)',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--font-size-sm)',
          fontWeight: 600,
          cursor: code.trim().length >= 4 ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s',
        }}
      >
        Tham gia
      </button>
      <button
        type="button"
        onClick={() => { setOpen(false); setCode(''); }}
        style={{
          padding: 'var(--space-2)',
          color: 'var(--color-gray-400)',
          fontSize: 'var(--font-size-sm)',
        }}
      >
        ✕
      </button>
    </form>
  );
}
