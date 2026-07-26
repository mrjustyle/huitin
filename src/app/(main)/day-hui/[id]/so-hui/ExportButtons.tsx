'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { exportLedgerToCSV, exportLedgerToPDF, exportLedgerToPDFPro } from '@/lib/export';
import { LedgerTransaction } from '@/features/receipt/actions';

export default function ExportButtons({ 
  data, 
  groupName,
  isVip
}: { 
  data: LedgerTransaction[], 
  groupName: string,
  isVip?: boolean
}) {
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handleExportCSV = () => {
    exportLedgerToCSV(data, groupName);
  };

  const handleExportPDF = async () => {
    try {
      setIsExportingPDF(true);
      if (isVip) {
        await exportLedgerToPDFPro(data, groupName);
      } else {
        await exportLedgerToPDF(data, groupName);
      }
    } catch (err) {
      console.error('Lỗi khi xuất PDF:', err);
      alert('Không thể tải PDF. Vui lòng thử lại.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <Button variant="ghost" size="sm" onClick={handleExportCSV}>
        📄 Xuất CSV
      </Button>
      <Button variant="ghost" size="sm" onClick={handleExportPDF} loading={isExportingPDF}>
        📕 {isVip ? 'Xuất PDF Pro' : 'Xuất PDF'}
      </Button>
    </div>
  );
}
