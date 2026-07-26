import { registerVietnameseFonts } from './fonts/font-loader';

export async function exportReceiptToPDF(receipt: any, groupName: string) {
  const { jsPDF } = await import('jspdf');
  
  const doc = new jsPDF('p', 'pt', 'a5'); // A5 size for receipts
  
  doc.setFontSize(18);
  doc.setTextColor(15, 118, 110);
  doc.text('BIEN NHAN ĐIEN TU', 40, 50);
  
  doc.setFontSize(12);
  doc.setTextColor(50, 50, 50);
  doc.text(`Day hui: ${groupName}`, 40, 80);
  
  doc.setFontSize(10);
  doc.text(`Ma so: ${receipt.id.split('-')[0].toUpperCase()}`, 40, 100);
  doc.text(`Ngay phat hanh: ${new Date(receipt.createdAt).toLocaleString('vi-VN')}`, 40, 115);
  
  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(40, 130, 380, 130);
  
  // Details
  doc.setFontSize(12);
  doc.text('THONG TIN GIAO DICH', 40, 160);
  
  doc.setFontSize(11);
  doc.text(`Nguoi giao dich: ${receipt.memberName}`, 40, 185);
  doc.text(`Ky hui: Ky ${receipt.periodNumber}`, 40, 205);
  doc.text(`Loai giao dich: ${receipt.type === 'contribution' ? 'Dong hui' : 'Linh hui'}`, 40, 225);
  
  const formattedAmount = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(receipt.amount);
  doc.setFontSize(14);
  doc.setTextColor(receipt.type === 'contribution' ? 16 : 180, receipt.type === 'contribution' ? 185 : 83, receipt.type === 'contribution' ? 129 : 38); // green or amber
  doc.text(`So tien: ${formattedAmount}`, 40, 255);
  
  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(40, 280, 380, 280);
  
  // Footer Integrity
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Hui Tin - Sổ hụi điện tử minh bạch (sohuitin.com)', 40, 310);
  doc.text('Biên nhận này được ký điện tử và bảo vệ toàn vẹn dữ liệu.', 40, 325);
  
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Checksum: ${receipt.checksum}`, 40, 345);
  
  doc.save(`Bien_Nhan_${receipt.id.split('-')[0]}.pdf`);
}

export async function exportReceiptToPDFPro(receipt: any, groupName: string) {
  const { jsPDF } = await import('jspdf');
  
  const doc = new jsPDF('p', 'pt', 'a5'); // A5 size for receipts
  await registerVietnameseFonts(doc);
  
  const brandColor: [number, number, number] = [22, 160, 133]; // #16A085
  const darkColor: [number, number, number] = [16, 43, 39]; // #102B27
  const grayColor: [number, number, number] = [129, 152, 146]; // #819892
  
  // --- HEADER & LOGO ---
  doc.setDrawColor(22, 160, 133);
  doc.setFillColor(22, 160, 133);
  doc.circle(50, 50, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('Roboto', 'bold');
  doc.text('H', 45, 54);
  
  doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
  doc.setFontSize(14);
  doc.text('HỤI TÍN', 70, 54);
  
  // Title
  doc.setFontSize(18);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text('BIÊN NHẬN ĐIỆN TỬ', 40, 90);
  
  doc.setFontSize(12);
  doc.setFont('Roboto', 'normal');
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text(`Dây hụi: ${groupName}`, 40, 110);
  
  doc.setFontSize(10);
  doc.text(`Mã số: ${receipt.id.split('-')[0].toUpperCase()}`, 40, 125);
  doc.text(`Ngày phát hành: ${new Date(receipt.createdAt).toLocaleString('vi-VN')}`, 40, 140);
  
  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(40, 155, 380, 155);
  
  // Details
  doc.setFontSize(12);
  doc.setFont('Roboto', 'bold');
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text('THÔNG TIN GIAO DỊCH', 40, 185);
  
  doc.setFontSize(11);
  doc.setFont('Roboto', 'normal');
  doc.text(`Người giao dịch: ${receipt.memberName}`, 40, 210);
  doc.text(`Kỳ hụi: Kỳ ${receipt.periodNumber}`, 40, 230);
  doc.text(`Loại giao dịch: ${receipt.type === 'contribution' ? 'Đóng hụi' : 'Lĩnh hụi'}`, 40, 250);
  
  const formattedAmount = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(receipt.amount);
  doc.setFontSize(14);
  doc.setFont('Roboto', 'bold');
  if (receipt.type === 'contribution') {
    doc.setTextColor(22, 163, 74); // Green
  } else {
    doc.setTextColor(217, 119, 6); // Amber
  }
  doc.text(`Số tiền: ${formattedAmount}`, 40, 280);
  
  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(40, 310, 380, 310);
  
  // Signature Block
  doc.setFillColor(244, 250, 248); // Very light teal
  doc.rect(40, 325, 340, 70, 'F');
  
  doc.setFontSize(9);
  doc.setFont('Roboto', 'bold');
  doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
  doc.text('CHỨNG THỰC BỞI HỤI TÍN', 50, 345);
  
  doc.setFontSize(8);
  doc.setFont('Roboto', 'normal');
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text('Biên nhận này được ký điện tử và bảo vệ toàn vẹn dữ liệu.', 50, 360);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text(`Mã toàn vẹn (Checksum): ${receipt.checksum}`, 50, 375);
  doc.text(`Ký xác nhận lúc: ${new Date().toLocaleString('vi-VN')}`, 50, 385);
  
  doc.save(`Bien_Nhan_VIP_${receipt.id.split('-')[0]}.pdf`);
}
