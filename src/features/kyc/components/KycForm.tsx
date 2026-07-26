'use client';

import { useActionState, useRef, useState } from 'react';
import { submitKyc } from '@/features/kyc/actions';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import styles from './KycForm.module.css';

export default function KycForm() {
  const [state, action, pending] = useActionState(submitKyc, undefined);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const fileInputRefs = {
    cccdFront: useRef<HTMLInputElement>(null),
    cccdBack: useRef<HTMLInputElement>(null),
    selfie: useRef<HTMLInputElement>(null),
  };

  function handleFileChange(name: string, file: File | null) {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setPreviews((prev) => ({ ...prev, [name]: e.target?.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  }

  if (state?.success) {
    return (
      <div className={styles.success}>
        <div className={styles.successIcon}>✅</div>
        <h3 className={styles.successTitle}>Đã gửi yêu cầu xác minh!</h3>
        <p className={styles.successDesc}>
          Thông tin của bạn đang được xem xét. Quá trình này thường mất 1-2 ngày làm việc.
          Chúng tôi sẽ thông báo khi hoàn tất.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className={styles.form}>


      {state?.error && (
        <div className={styles.alert} role="alert">
          <span>⚠</span> {state.error}
        </div>
      )}

      {/* Step 1: CCCD Number */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.stepNum}>1</span>
          Số CCCD
        </h3>
        <Input
          name="cccdNumber"
          label="Số Căn cước công dân"
          placeholder="Nhập 12 chữ số"
          required
          maxLength={12}
          pattern="[0-9]{12}"
          hint="12 chữ số trên mặt trước CCCD"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <circle cx="9" cy="10" r="2" />
              <path d="M15 8h2M15 12h2" />
            </svg>
          }
        />
      </div>

      {/* Step 2: CCCD Photos */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.stepNum}>2</span>
          Ảnh CCCD
        </h3>
        <div className={styles.uploadGrid}>
          <FileUpload
            name="cccdFront"
            label="Mặt trước CCCD"
            preview={previews.cccdFront}
            inputRef={fileInputRefs.cccdFront}
            onChange={(f) => handleFileChange('cccdFront', f)}
            icon="📋"
            capture="environment"
            hint="Chụp hoặc chọn ảnh"
          />
          <FileUpload
            name="cccdBack"
            label="Mặt sau CCCD"
            preview={previews.cccdBack}
            inputRef={fileInputRefs.cccdBack}
            onChange={(f) => handleFileChange('cccdBack', f)}
            icon="📋"
            capture="environment"
            hint="Chụp hoặc chọn ảnh"
          />
        </div>
      </div>

      {/* Step 3: Selfie */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.stepNum}>3</span>
          Ảnh chân dung
        </h3>
        <p className={styles.sectionHint}>
          Chụp ảnh khuôn mặt rõ ràng, không đeo kính đen, đủ ánh sáng.
        </p>
        <FileUpload
          name="selfie"
          label="Ảnh chân dung"
          preview={previews.selfie}
          inputRef={fileInputRefs.selfie}
          onChange={(f) => handleFileChange('selfie', f)}
          icon="🤳"
          wide
          capture="user"
          hint="Mở camera trước chụp ảnh"
        />
      </div>

      <Button type="submit" fullWidth loading={pending} size="lg">
        Gửi xác minh
      </Button>

      <p className={styles.note}>
        🔒 Thông tin CCCD được mã hóa và chỉ dùng cho mục đích xác minh.
        Không chia sẻ với bên thứ ba.
      </p>
    </form>
  );
}

function FileUpload({
  name,
  label,
  preview,
  inputRef,
  onChange,
  icon,
  wide,
  capture,
  hint = 'Nhấn để chọn ảnh',
}: {
  name: string;
  label: string;
  preview?: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (file: File | null) => void;
  icon: string;
  wide?: boolean;
  capture?: 'user' | 'environment';
  hint?: string;
}) {
  return (
    <div className={`${styles.uploadBox} ${wide ? styles.uploadWide : ''}`}>
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept="image/*"
        capture={capture}
        required
        className={styles.fileInput}
        onChange={(e) => {
          const files = e.target.files;
          if (!files || files.length === 0) {
            alert('File picker đóng mà không có file nào được chọn');
            onChange(null);
          } else {
            onChange(files[0]);
          }
        }}
      />
      {preview ? (
        <img src={preview} alt={label} className={styles.preview} />
      ) : (
        <div className={styles.uploadPlaceholder}>
          <span className={styles.uploadIcon}>{icon}</span>
          <span className={styles.uploadLabel}>{label}</span>
          <span className={styles.uploadHint}>{hint}</span>
        </div>
      )}
    </div>
  );
}
