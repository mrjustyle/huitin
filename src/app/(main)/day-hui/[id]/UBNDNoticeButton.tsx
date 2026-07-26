'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { exportUBNDNoticeToPDF, UBNDNoticeInfo } from '@/lib/ubnd_export';

export default function UBNDNoticeButton({ info }: { info: UBNDNoticeInfo }) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);
      await exportUBNDNoticeToPDF(info);
    } catch (err) {
      console.error('Lỗi xuất mẫu UBND:', err);
      alert('Không thể tải file PDF. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleExport} loading={loading}>
      ⚖️ Tải Mẫu TB UBND
    </Button>
  );
}
