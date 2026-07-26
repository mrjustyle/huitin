/**
 * Xuất Mẫu Thông Báo Tổ Chức Dây Hụi gửi UBND cấp xã
 * Theo Nghị định 19/2019/NĐ-CP
 *
 * Hàm này chỉ chạy trên Client (dynamic import jsPDF).
 */

export type UBNDNoticeInfo = {
  // Thông tin chủ hụi
  ownerName: string;
  ownerIdNumber?: string;     // Số CCCD
  ownerAddress?: string;
  ownerPhone?: string;

  // Thông tin dây hụi
  groupName: string;
  shareValue: number;         // Giá trị mỗi phần hụi (VND)
  totalShares: number;        // Tổng số phần
  cycleType: string;          // Chu kỳ: 'daily' | 'weekly' | 'monthly'
  startDate: string;          // Ngày bắt đầu
  memberCount: number;        // Số thành viên hiện tại
  huiType: string;            // Loại hụi
  payoutMethod: string;       // Phương thức lĩnh
};

const CYCLE_MAP: Record<string, string> = {
  daily: 'Hang ngay',
  weekly: 'Hang tuan',
  monthly: 'Hang thang',
  bimonthly: 'Hai thang mot lan',
};

const HUI_TYPE_MAP: Record<string, string> = {
  hui_thuan: 'Hui thuan (khong lai)',
  hui_boc_tham: 'Hui boc tham',
  hui_dau_gia: 'Hui dau gia',
  hui_co_lai: 'Hui co lai (co dinh)',
};

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

export async function exportUBNDNoticeToPDF(info: UBNDNoticeInfo) {
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF('p', 'pt', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 60;
  const contentWidth = pageWidth - margin * 2;
  let y = 50;

  // ==========================================
  // HEADER: CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
  // ==========================================
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  doc.text('CONG HOA XA HOI CHU NGHIA VIET NAM', pageWidth / 2, y, { align: 'center' });
  y += 18;

  doc.setFontSize(12);
  doc.text('Doc lap - Tu do - Hanh phuc', pageWidth / 2, y, { align: 'center' });
  y += 5;

  // Gạch ngang dưới dòng tiêu đề
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.8);
  const lineLen = 180;
  doc.line(pageWidth / 2 - lineLen / 2, y, pageWidth / 2 + lineLen / 2, y);
  y += 30;

  // Ngày tháng năm
  const today = new Date();
  const dateStr = `........, ngay ${today.getDate()} thang ${today.getMonth() + 1} nam ${today.getFullYear()}`;
  doc.setFontSize(11);
  doc.text(dateStr, pageWidth - margin, y, { align: 'right' });
  y += 40;

  // ==========================================
  // TIÊU ĐỀ
  // ==========================================
  doc.setFontSize(16);
  doc.setTextColor(15, 118, 110); // Teal
  doc.text('THONG BAO', pageWidth / 2, y, { align: 'center' });
  y += 22;

  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  doc.text('Ve viec to chuc day hui', pageWidth / 2, y, { align: 'center' });
  y += 15;

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('(Theo Nghi dinh 19/2019/ND-CP, Dieu 17)', pageWidth / 2, y, { align: 'center' });
  y += 35;

  // ==========================================
  // KÍNH GỬI
  // ==========================================
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('Kinh gui: UBND xa (phuong) ........................................', margin, y);
  y += 35;

  // ==========================================
  // I. THÔNG TIN CHỦ HỤI
  // ==========================================
  doc.setFontSize(12);
  doc.setTextColor(15, 118, 110);
  doc.text('I. THONG TIN CHU HUI', margin, y);
  y += 22;

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);

  const ownerRows = [
    ['Ho va ten:', info.ownerName || '..................................................'],
    ['So CCCD/CMND:', info.ownerIdNumber || '..................................................'],
    ['Dia chi cu tru:', info.ownerAddress || '..................................................'],
    ['So dien thoai:', info.ownerPhone || '..................................................'],
  ];

  for (const [label, value] of ownerRows) {
    doc.text(`${label}  ${value}`, margin + 10, y);
    y += 20;
  }

  y += 15;

  // ==========================================
  // II. THÔNG TIN DÂY HỤI
  // ==========================================
  doc.setFontSize(12);
  doc.setTextColor(15, 118, 110);
  doc.text('II. THONG TIN DAY HUI', margin, y);
  y += 22;

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);

  const totalValue = info.shareValue * info.totalShares;

  const groupRows = [
    ['Ten day hui:', info.groupName],
    ['Loai hui:', HUI_TYPE_MAP[info.huiType] || info.huiType],
    ['Gia tri moi phan hui:', formatVND(info.shareValue)],
    ['Tong so phan:', String(info.totalShares)],
    ['Tong gia tri day hui:', formatVND(totalValue)],
    ['So thanh vien:', String(info.memberCount)],
    ['Chu ky gop:', CYCLE_MAP[info.cycleType] || info.cycleType],
    ['Ngay bat dau:', info.startDate ? new Date(info.startDate).toLocaleDateString('vi-VN') : '..............'],
    ['Phuong thuc linh:', info.payoutMethod || '..............'],
  ];

  for (const [label, value] of groupRows) {
    doc.text(`${label}  ${value}`, margin + 10, y);
    y += 20;
  }

  y += 15;

  // ==========================================
  // III. CAM KẾT
  // ==========================================
  doc.setFontSize(12);
  doc.setTextColor(15, 118, 110);
  doc.text('III. CAM KET', margin, y);
  y += 22;

  doc.setFontSize(10.5);
  doc.setTextColor(0, 0, 0);

  const commitments = [
    'Toi cam ket thuc hien dung cac quy dinh tai Nghi dinh 19/2019/ND-CP ve to chuc va',
    'hoat dong cua to hui.',
    '',
    'Toi dam bao cac thong tin trong thong bao nay la chinh xac va chiu trach nhiem',
    'truoc phap luat ve noi dung thong bao.',
    '',
    'Toi se thong bao bang van ban cho UBND xa (phuong) khi co bat ky thay doi nao lien',
    'quan den day hui (thanh vien, gia tri, thoi han,...).',
  ];

  for (const line of commitments) {
    if (line) {
      doc.text(line, margin + 10, y);
    }
    y += 16;
  }

  y += 30;

  // ==========================================
  // PHẦN KÝ TÊN
  // ==========================================
  doc.setFontSize(11);
  doc.text('Nguoi thong bao', pageWidth - margin - 120, y);
  y += 16;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('(Ky, ghi ro ho ten)', pageWidth - margin - 120, y);
  y += 60;

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(info.ownerName || '..........................', pageWidth - margin - 120, y);

  // ==========================================
  // FOOTER
  // ==========================================
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Tao tu dong boi Hui Tin - So hui dien tu minh bach (sohuitin.com)', margin, doc.internal.pageSize.getHeight() - 30);
  doc.text(`Ngay xuat: ${new Date().toLocaleString('vi-VN')}`, margin, doc.internal.pageSize.getHeight() - 18);

  // Tải file
  doc.save(`Thong_Bao_UBND_${info.groupName.replace(/\s+/g, '_')}.pdf`);
}
