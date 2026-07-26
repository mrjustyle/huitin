import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import CreateHuiForm from './CreateForm';

export const metadata = {
  title: 'Tạo dây hụi mới',
};

export default async function CreateHuiPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/dang-nhap');
  }

  // Check KYC status
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('kyc_status')
    .eq('id', user.id)
    .single();

  if (profile?.kyc_status !== 'approved') {
    return (
      <div style={{
        maxWidth: '440px',
        margin: '4rem auto',
        padding: '2.5rem',
        textAlign: 'center',
        background: 'var(--bg-secondary)',
        borderRadius: '20px',
        border: '1px solid var(--color-gray-200)',
      }}>
        <div style={{
          fontSize: '4rem',
          marginBottom: '1.25rem',
          animation: 'float 3s ease-in-out infinite',
        }}>🔒</div>
        <h2 style={{
          marginBottom: '0.75rem',
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
        }}>Cần xác minh danh tính</h2>
        <p style={{
          color: 'var(--text-secondary)',
          marginBottom: '2rem',
          lineHeight: 1.7,
          fontSize: '0.95rem',
        }}>
          Bạn cần hoàn tất xác minh danh tính (KYC) trước khi có thể tạo dây hụi.
          Điều này giúp bảo vệ tất cả thành viên tham gia.
        </p>
        <Link
          href="/kyc"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.875rem 2.5rem',
            background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700))',
            color: 'white',
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '1rem',
            boxShadow: '0 4px 14px rgba(14, 116, 110, 0.3)',
            transition: 'all 0.2s ease',
          }}
        >
          🪪 Xác minh ngay
        </Link>
      </div>
    );
  }

  return <CreateHuiForm />;
}
