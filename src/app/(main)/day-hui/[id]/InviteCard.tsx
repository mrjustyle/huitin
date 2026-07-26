'use client';

import { useState } from 'react';
import { IconConfirmed } from '@/components/ui/Icons';
import styles from './page.module.css';

export default function InviteCard({ inviteCode, inviteUrl }: { inviteCode: string; inviteUrl: string }) {
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  async function copyToClipboard(text: string, type: 'code' | 'link') {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    }
  }

  return (
    <div className={styles.inviteCard}>
      <h3>Mời thành viên</h3>
      
      <div 
        className={styles.inviteCodeBig} 
        onClick={() => copyToClipboard(inviteCode, 'code')}
        title="Nhấn để copy mã"
        style={{ cursor: 'pointer' }}
      >
        {inviteCode}
      </div>
      {copied === 'code' && (
        <div className={styles.copiedToast}>
          <IconConfirmed size={14} style={{ color: 'var(--success-color)' }} /> Đã copy mã mời!
        </div>
      )}
      
      <p className={styles.inviteDesc}>
        Chia sẻ mã mời hoặc link cho người quen
      </p>
      
      <div 
        className={styles.inviteLink}
        onClick={() => copyToClipboard(inviteUrl, 'link')}
        title="Nhấn để copy link"
        style={{ cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}
      >
        {copied === 'link' ? <><IconConfirmed size={14} style={{ color: 'var(--success-color)' }} /> Đã copy link!</> : inviteUrl}
      </div>
    </div>
  );
}
