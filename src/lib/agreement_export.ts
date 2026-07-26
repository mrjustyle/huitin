import { registerVietnameseFonts } from './fonts/font-loader';

/**
 * Xuất dữ liệu Thỏa thuận ra file PDF (Pro / VIP)
 */
export async function exportAgreementToPDFPro(
  agreement: any,
  signatures: any[],
  groupName: string
) {
  const { jsPDF } = await import('jspdf');
  
  const doc = new jsPDF('p', 'pt', 'a4');
  await registerVietnameseFonts(doc);
  
  const brandColor: [number, number, number] = [22, 160, 133]; // #16A085
  const darkColor: [number, number, number] = [16, 43, 39]; // #102B27
  const grayColor: [number, number, number] = [129, 152, 146]; // #819892
  
  let y = 50;
  const margin = 40;
  const pageHeight = 842; // A4 height in pt
  const maxWidth = 595 - margin * 2;
  
  const checkPageBreak = (neededSpace: number) => {
    if (y + neededSpace > pageHeight - margin) {
      doc.addPage();
      y = 50;
    }
  };

  const addText = (text: string, size: number, color: number[], isBold = false, spacing = 15) => {
    doc.setFontSize(size);
    doc.setFont('Roboto', isBold ? 'bold' : 'normal');
    doc.setTextColor(color[0], color[1], color[2]);
    
    const lines = doc.splitTextToSize(text, maxWidth);
    const textHeight = lines.length * size * 1.2;
    
    checkPageBreak(textHeight + spacing);
    doc.text(lines, margin, y);
    y += textHeight + spacing;
  };
  
  // --- HEADER & LOGO ---
  doc.setDrawColor(22, 160, 133);
  doc.setFillColor(22, 160, 133);
  doc.circle(55, y + 15, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('Roboto', 'bold');
  doc.text('H', 49, y + 20);
  
  doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
  doc.setFontSize(18);
  doc.text('HỤI TÍN', 80, y + 20);
  
  y += 50;
  
  // --- TITLE ---
  doc.setFontSize(22);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text('THỎA THUẬN THAM GIA DÂY HỤI', margin, y);
  y += 30;
  
  addText(`Dây hụi: ${groupName}`, 14, darkColor, false, 20);
  
  const content = agreement.content;
  addText(`Phiên bản: ${content.version} · Ngày tạo: ${new Date(content.generatedAt).toLocaleDateString('vi-VN')}`, 10, grayColor, false, 30);
  
  // --- PARTIES ---
  addText('Các bên tham gia', 16, brandColor, true, 20);
  
  addText(`Chủ hụi: ${content.owner.name}`, 12, darkColor, true, 5);
  addText(`SĐT: ${content.owner.phone || 'Không có'} | Địa chỉ: ${content.owner.address || 'Không có'}`, 11, grayColor, false, 20);
  
  addText('Thành viên tham gia:', 12, darkColor, true, 10);
  content.members.forEach((m: any, i: number) => {
    addText(`${i + 1}. ${m.name || `Thành viên ${i+1}`} - ${m.shares} phần`, 11, darkColor, false, 5);
  });
  y += 15;
  
  // --- TERMS ---
  addText('Tóm tắt dây hụi', 16, brandColor, true, 20);
  const terms = content.terms;
  addText(`- Loại hụi: ${terms.huiType}`, 11, darkColor, false, 5);
  addText(`- Giá trị 1 phần: ${terms.shareValueText}`, 11, darkColor, false, 5);
  addText(`- Tổng số phần: ${terms.totalShares}`, 11, darkColor, false, 5);
  addText(`- Chu kỳ đóng: ${terms.cycleType}`, 11, darkColor, false, 5);
  addText(`- Phương thức lĩnh: ${terms.payoutMethod}`, 11, darkColor, false, 15);
  
  // --- ARTICLES ---
  addText('Điều khoản chi tiết', 16, brandColor, true, 20);
  content.articles.forEach((art: any) => {
    addText(art.title, 12, darkColor, true, 5);
    addText(art.content, 11, darkColor, false, 15);
  });
  
  if (content.legalNotice) {
    checkPageBreak(50);
    doc.setFillColor(254, 243, 199); // amber-100
    doc.rect(margin, y, maxWidth, 40, 'F');
    y += 15;
    addText(`⚖️ ${content.legalNotice}`, 11, [180, 83, 9], false, 30); // amber-700
  }
  
  // --- SIGNATURES ---
  doc.addPage();
  y = 50;
  
  addText('XÁC NHẬN CỦA CÁC BÊN (KÝ SỐ)', 18, brandColor, true, 30);
  
  addText(`Bằng việc ký tên dưới đây (hoặc xác thực OTP điện tử), các bên cam kết đã đọc, hiểu rõ và đồng ý với mọi điều khoản trong thỏa thuận phiên bản ${content.version}.`, 11, darkColor, false, 30);
  
  signatures.forEach((sig: any) => {
    const memberInfo = content.members.find((m: any) => m.userId === sig.user_id);
    const memberName = memberInfo?.name || 'Thành viên';
    
    checkPageBreak(80);
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, margin + maxWidth, y);
    y += 15;
    
    addText(`${memberName}`, 12, darkColor, true, 5);
    addText(`Thời gian ký: ${new Date(sig.signed_at).toLocaleString('vi-VN')}`, 10, grayColor, false, 5);
    addText(`Phương thức: ${sig.otp_verified ? 'Xác thực OTP/Mật khẩu (Ký điện tử)' : 'Ký tay'}`, 10, grayColor, false, 15);
  });
  
  // --- FOOTER INTEGRITY ---
  checkPageBreak(100);
  y += 20;
  doc.setFillColor(244, 250, 248); // Very light teal
  doc.rect(margin, y, maxWidth, 70, 'F');
  
  doc.setFontSize(9);
  doc.setFont('Roboto', 'bold');
  doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
  doc.text('CHỨNG THỰC BỞI NỀN TẢNG HỤI TÍN', margin + 10, y + 20);
  
  doc.setFontSize(8);
  doc.setFont('Roboto', 'normal');
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text('Tài liệu này được tạo và bảo vệ toàn vẹn dữ liệu bởi thuật toán mã hóa SHA-256.', margin + 10, y + 35);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text(`Mã toàn vẹn (Checksum): ${agreement.checksum}`, margin + 10, y + 50);
  doc.text(`Xuất lúc: ${new Date().toLocaleString('vi-VN')}`, margin + 10, y + 60);
  
  doc.save(`Thoa_Thuan_VIP_${groupName.replace(/\s+/g, '_')}.pdf`);
}
