import React from 'react';
import { 
  IconBrand, 
  IconHome, 
  IconCycle, 
  IconPayment, 
  IconMembers, 
  IconConfirmed,
  IconTransaction,
  IconNotification,
  IconAccount,
  IconCreateGroup,
  IconPeriod,
  IconLedger,
  IconAgreement,
  IconPayout,
  IconReceipt,
  IconOverdue,
  IconSettings,
  IconSearch,
  IconFilter,
  IconSort,
  IconSecurity,
  IconWarning,
  IconInfo,
  IconSuccess,
  IconError,
  IconLogout,
  IconUpload,
  IconCopy,
  IconBank,
  IconQR,
  IconPaid,
  IconUnpaid,
  IconNewMember,
  IconOwner,
  IconVerified,
  IconSuspended,
  IconDisputed,
  IconRecipient,
  IconInvite,
  IconRules,
  IconCompleted,
  IconPaused,
  IconPaymentCalendar,
  IconProgress,
  IconReconciliation,
  IconPending,
  IconFailed,
  IconRefund,
  IconMoon,
  IconSun,
  IconHelp,
  IconOTP,
  IconDevice
} from '@/components/ui/Icons';

export default function DesignSystemPage() {
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Hụi Tín - Icon System Design</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Preview 6 icon mẫu theo phong cách: Modern flat fintech icons with subtle futuristic details.
      </p>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1.5rem' 
      }}>
        {/* Core & Home */}
        <IconCard title="1. Biểu tượng thương hiệu" Icon={IconBrand} />
        <IconCard title="2. Trang chủ" Icon={IconHome} />
        <IconCard title="3. Dây hụi" Icon={IconCycle} />
        <IconCard title="4. Giao dịch" Icon={IconTransaction} />
        <IconCard title="5. Thông báo" Icon={IconNotification} />
        <IconCard title="6. Tài khoản" Icon={IconAccount} />
        <IconCard title="7. Tạo dây hụi" Icon={IconCreateGroup} />

        {/* Group Management */}
        <IconCard title="8. Kỳ hụi" Icon={IconPeriod} />
        <IconCard title="9. Lịch đóng" Icon={IconPaymentCalendar} />
        <IconCard title="10. Tiến độ" Icon={IconProgress} />
        <IconCard title="11. Sổ hụi" Icon={IconLedger} />
        <IconCard title="12. Thỏa thuận" Icon={IconAgreement} />
        <IconCard title="13. Quy định" Icon={IconRules} />
        <IconCard title="14. Hoàn thành" Icon={IconCompleted} />
        <IconCard title="15. Tạm dừng" Icon={IconPaused} />
        
        {/* Members */}
        <IconCard title="16. Thành viên" Icon={IconMembers} />
        <IconCard title="17. Mời thành viên" Icon={IconInvite} />
        <IconCard title="18. Người lĩnh hụi" Icon={IconRecipient} />
        <IconCard title="19. Thành viên mới" Icon={IconNewMember} />
        <IconCard title="20. Chủ hụi" Icon={IconOwner} />
        <IconCard title="21. Đã xác minh" Icon={IconVerified} />
        <IconCard title="22. Tạm khóa" Icon={IconSuspended} />
        <IconCard title="23. Có tranh chấp" Icon={IconDisputed} />
        
        {/* Payments */}
        <IconCard title="24. Đóng hụi" Icon={IconPayment} />
        <IconCard title="25. Đã đóng" Icon={IconPaid} />
        <IconCard title="26. Chưa đóng" Icon={IconUnpaid} />
        <IconCard title="27. Nhận hụi" Icon={IconPayout} />
        <IconCard title="29. VietQR" Icon={IconQR} />
        <IconCard title="30. Tài khoản NH" Icon={IconBank} />
        <IconCard title="31. Đối soát" Icon={IconReconciliation} />
        <IconCard title="32. Biên nhận" Icon={IconReceipt} />
        <IconCard title="33. Tải chứng từ" Icon={IconUpload} />
        <IconCard title="34. Hoàn tiền" Icon={IconRefund} />

        {/* Status & System */}
        <IconCard title="35. Đã xác nhận" Icon={IconConfirmed} />
        <IconCard title="36. Chờ xác nhận" Icon={IconPending} />
        <IconCard title="37. Quá hạn" Icon={IconOverdue} />
        <IconCard title="38. Thất bại" Icon={IconFailed} />
        <IconCard title="39. Cài đặt" Icon={IconSettings} />
        <IconCard title="40. Tìm kiếm" Icon={IconSearch} />
        <IconCard title="41. Lọc" Icon={IconFilter} />
        <IconCard title="42. Sắp xếp" Icon={IconSort} />
        <IconCard title="43. Bảo mật" Icon={IconSecurity} />
        <IconCard title="44. OTP" Icon={IconOTP} />
        <IconCard title="45. Thiết bị" Icon={IconDevice} />
        <IconCard title="46. Cảnh báo" Icon={IconWarning} />
        <IconCard title="47. Thông tin" Icon={IconInfo} />
        <IconCard title="48. Thành công" Icon={IconSuccess} />
        <IconCard title="49. Lỗi" Icon={IconError} />
        <IconCard title="50. Sao chép" Icon={IconCopy} />
        <IconCard title="51. Dark Mode" Icon={IconMoon} />
        <IconCard title="52. Light Mode" Icon={IconSun} />
        <IconCard title="53. Trợ giúp" Icon={IconHelp} />
        <IconCard title="54. Đăng xuất" Icon={IconLogout} />
      </div>
    </div>
  );
}

function IconCard({ title, Icon }: { title: string; Icon: React.ComponentType<any> }) {
  return (
    <div style={{
      background: 'var(--bg-secondary, #ffffff)',
      border: '1px solid var(--border-color, #e2e8f0)',
      borderRadius: '12px',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
    }}>
      <div style={{ color: 'var(--primary, #16A085)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={48} />
      </div>
      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary, #334155)', textAlign: 'center' }}>
        {title}
      </div>
    </div>
  );
}
