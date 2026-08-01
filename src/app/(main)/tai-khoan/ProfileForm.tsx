'use client';

import { useActionState } from 'react';
import { updateProfile } from '@/features/profile/actions';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import styles from './ProfileForm.module.css';

interface ProfileFormProps {
  profile: {
    nickname: string;
    fullName: string;
    phone: string;
    email: string;
    dateOfBirth: string;
    address: string;
  };
}

export default function ProfileForm({ profile }: ProfileFormProps) {
  const [state, action, pending] = useActionState(updateProfile, undefined);

  return (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>Thông tin cá nhân</h3>

      {state?.success && (
        <div className={styles.successAlert}>
          ✅ Đã cập nhật thành công
        </div>
      )}
      {state?.error && (
        <div className={styles.errorAlert}>
          ⚠ {state.error}
        </div>
      )}

      <form action={action} className={styles.form}>
        <Input
          name="nickname"
          label="Bí danh (Tên hiển thị)"
          defaultValue={profile.nickname}
          placeholder="Tên gọi vui, dễ nhớ..."
          icon={
            <span style={{ display: 'inline-block', width: '18px', textAlign: 'center' }}>@</span>
          }
        />

        <Input
          name="fullName"
          label="Họ và tên (Pháp lý)"
          defaultValue={profile.fullName}
          readOnly
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          }
        />

        <Input
          name="phone"
          label="Số điện thoại"
          type="tel"
          defaultValue={profile.phone}
          readOnly
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="5" y="2" width="14" height="20" rx="2" />
              <line x1="12" y1="18" x2="12" y2="18" />
            </svg>
          }
        />

        <Input
          name="dateOfBirth"
          label="Ngày sinh"
          type="date"
          defaultValue={profile.dateOfBirth}
          icon={<span>📅</span>}
        />

        <Input
          name="address"
          label="Địa chỉ"
          defaultValue={profile.address}
          placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/TP"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          }
        />

        <div className={styles.formFooter}>
          <Button type="submit" loading={pending}>
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </div>
  );
}
