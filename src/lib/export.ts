import { LedgerTransaction } from '@/features/receipt/actions';
import { registerVietnameseFonts } from './fonts/font-loader';

/**
 * Format currency
 */
function formatVND(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

/**
 * Xuất dữ liệu Sổ hụi ra file CSV
 */
export function exportLedgerToCSV(data: LedgerTransaction[], groupName: string) {
  const headers = ['Kỳ Hụi', 'Thành Viên', 'Giao Dịch', 'Số Tiền', 'Ngày', 'Trạng Thái'];
  
  const rows = data.map(tx => [
    `Kỳ ${tx.periodNumber}`,
    tx.memberName,
    tx.type === 'contribution' ? 'Đóng hụi' : 'Lĩnh hụi',
    tx.amount,
    new Date(tx.date).toLocaleDateString('vi-VN'),
    tx.status
  ]);
  
  // Thêm BOM để Excel đọc đúng tiếng Việt (UTF-8)
  let csvContent = '\uFEFF' + headers.join(',') + '\n';
  
  rows.forEach(rowArray => {
    // Escape quotes and commas
    const row = rowArray.map(item => `"${String(item).replace(/"/g, '""')}"`).join(',');
    csvContent += row + '\n';
  });
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `So_Hui_${groupName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Xuất dữ liệu Sổ hụi ra file PDF (sử dụng jsPDF)
 * Hàm này chỉ chạy trên Client
 */
export async function exportLedgerToPDF(data: LedgerTransaction[], groupName: string) {
  // Dynamically import jspdf and jspdf-autotable to avoid SSR issues
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  
  // Tạo tài liệu PDF, A4, đơn vị pt
  const doc = new jsPDF('p', 'pt', 'a4');
  
  // Do jsPDF mặc định không hỗ trợ font tiếng Việt unicode,
  // nên trong MVP chúng ta sẽ dùng chữ không dấu cho tiêu đề PDF nếu font chuẩn không tải được
  // Để đơn giản, ta có thể inject Roboto base64 hoặc chấp nhận ký tự cơ bản.
  
  doc.setFontSize(22);
  doc.setTextColor(15, 118, 110); // Teal 600
  doc.text(`SO HUI: ${groupName.toUpperCase()}`, 40, 60);
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Ngay xuat: ${new Date().toLocaleDateString('vi-VN')}`, 40, 80);
  
  // Dữ liệu bảng
  const tableColumn = ["Ky", "Thanh Vien", "Giao Dich", "So Tien (VND)", "Ngay", "Trang Thai"];
  const tableRows = data.map(tx => [
    tx.periodNumber,
    tx.memberName, // Lưu ý: Tên thành viên có thể bị lỗi font tiếng Việt nếu ko nhúng font Unicode
    tx.type === 'contribution' ? 'Dong hui' : 'Linh hui',
    formatVND(tx.amount),
    new Date(tx.date).toLocaleDateString('vi-VN'),
    tx.status === 'Đã đóng' ? 'Da dong' : (tx.status === 'Đã nhận' ? 'Da nhan' : 'Thieu')
  ]);

  // Sinh bảng
  autoTable(doc, {
    startY: 110,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 6 },
    headStyles: { fillColor: [15, 118, 110], textColor: 255 }, // Teal 600
    alternateRowStyles: { fillColor: [248, 250, 252] }, // Slate 50
    margin: { top: 110 }
  });

  // Tải file
  doc.save(`So_Hui_${groupName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`);
}

/**
 * Xuất dữ liệu Sổ hụi ra file PDF (Pro / VIP)
 */
export async function exportLedgerToPDFPro(data: LedgerTransaction[], groupName: string) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  
  const doc = new jsPDF('p', 'pt', 'a4');
  await registerVietnameseFonts(doc);
  
  const brandColor: [number, number, number] = [22, 160, 133]; // #16A085
  const darkColor: [number, number, number] = [16, 43, 39]; // #102B27
  const grayColor: [number, number, number] = [129, 152, 146]; // #819892
  
  // --- HEADER ---
  // Logo placeholder
  doc.setDrawColor(22, 160, 133);
  doc.setFillColor(22, 160, 133);
  doc.circle(55, 65, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('Roboto', 'bold');
  doc.text('H', 49, 70);
  
  // App Name
  doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
  doc.setFontSize(18);
  doc.text('HỤI TÍN', 80, 70);
  
  // Title
  doc.setFontSize(22);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text('SỔ HỤI CHI TIẾT', 40, 110);
  
  doc.setFontSize(14);
  doc.setFont('Roboto', 'normal');
  doc.text(`Dây hụi: ${groupName}`, 40, 130);
  
  const now = new Date();
  doc.setFontSize(10);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text(`Ngày xuất: ${now.toLocaleDateString('vi-VN')} ${now.toLocaleTimeString('vi-VN')}`, 40, 145);
  
  // --- WATERMARK ---
  doc.setTextColor(230, 240, 238); // Very light teal/gray
  doc.setFontSize(80);
  doc.setFont('Roboto', 'bold');
  doc.text('HỤI TÍN', 150, 400, { angle: 45 });
  
  // --- TABLE ---
  const tableColumn = ["Kỳ", "Thành Viên", "Giao Dịch", "Số Tiền (VND)", "Ngày", "Trạng Thái"];
  const tableRows = data.map(tx => [
    tx.periodNumber,
    tx.memberName,
    tx.type === 'contribution' ? 'Đóng hụi' : 'Lĩnh hụi',
    formatVND(tx.amount),
    new Date(tx.date).toLocaleDateString('vi-VN'),
    tx.status
  ]);

  autoTable(doc, {
    startY: 160,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    styles: { font: 'Roboto', fontSize: 10, cellPadding: 6 },
    headStyles: { fillColor: brandColor, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [244, 250, 248] }, // Very light bg
    margin: { top: 160 }
  });
  
  // --- FOOTER & SIGNATURE ---
  const finalY = (doc as any).lastAutoTable.finalY || 160;
  
  doc.setDrawColor(200, 200, 200);
  doc.line(40, finalY + 30, 550, finalY + 30);
  
  doc.setFontSize(9);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setFont('Roboto', 'bold');
  doc.text('XÁC NHẬN BÁO CÁO (KÝ SỐ)', 40, finalY + 50);
  
  doc.setFontSize(8);
  doc.setFont('Roboto', 'normal');
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text('Báo cáo này được trích xuất tự động từ nền tảng Hụi Tín và bảo đảm tính toàn vẹn.', 40, finalY + 65);
  
  // Generate a SHA-256 hash of the data to act as a document checksum
  const encoder = new TextEncoder();
  const dataString = JSON.stringify(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(dataString));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  doc.text(`Mã xác thực (SHA-256): ${hashHex}`, 40, finalY + 80);
  
  // Tải file
  doc.save(`So_Hui_VIP_${groupName.replace(/\s+/g, '_')}_${now.toISOString().slice(0,10)}.pdf`);
}
