'use client';

import { exportReceiptToPDF, exportReceiptToPDFPro } from '@/lib/receipt_export';
import Button from '@/components/ui/Button';

export default function DownloadReceiptButton({ 
  receipt, 
  groupName,
  isVip
}: { 
  receipt: any, 
  groupName: string,
  isVip?: boolean
}) {
  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={() => {
        if (isVip) {
          exportReceiptToPDFPro(receipt, groupName);
        } else {
          exportReceiptToPDF(receipt, groupName);
        }
      }}
    >
      📄 {isVip ? 'Tải PDF Pro' : 'Tải PDF'}
    </Button>
  );
}
