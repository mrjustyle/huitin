# Kiến trúc Xác thực Người dùng (Authentication)

Dự án Hụi Tín sử dụng cơ chế xác thực đa kênh (Multi-provider) với trọng tâm là **Phone + PIN** và **Zalo OAuth**, được thiết kế để tối ưu chi phí SMS và mang lại trải nghiệm mượt mà trên di động.

## 1. Cơ chế Phone + PIN 6 số (Passwordless UX)

Thay vì yêu cầu người dùng ghi nhớ Mật khẩu dài dòng, Hụi Tín sử dụng Mã PIN 6 số tương tự như các ví điện tử.
Tuy nhiên, Supabase mặc định yêu cầu mật khẩu phải có ít nhất 8 ký tự và độ phức tạp cao. Để lách qua lớp bảo mật này một cách an toàn mà không cần thay đổi cấu hình gốc của Supabase, chúng ta sử dụng **Salt ẩn**.

- **Đăng ký (Sign Up):**
  - Người dùng nhập SĐT ➔ Hệ thống gọi API `sendPhoneOTP` để bắn SMS (Sử dụng `supabase.auth.signInWithOtp`).
  - Sau khi xác thực OTP thành công, người dùng tạo Mã PIN 6 số.
  - Backend tự động **nối chuỗi salt** `Huitin@2026` vào sau Mã PIN (Ví dụ: `123456` thành `123456Huitin@2026`) rồi mới gọi API cập nhật mật khẩu.
- **Đăng nhập (Sign In):**
  - Người dùng nhập SĐT và Mã PIN.
  - Backend nối chuỗi salt vào PIN và gọi `supabase.auth.signInWithPassword`.

> **Lưu ý cho Developer/Agent:** Không bao giờ để lộ chuỗi salt `Huitin@2026` ra ngoài Frontend. Mọi thao tác xử lý nối chuỗi phải được thực hiện trong Next.js Server Actions (ví dụ: `src/features/auth/actions.ts`).

## 2. Zalo OAuth và Tự động gộp tài khoản (Account Linking)

Do Supabase không hỗ trợ native Zalo Provider, chúng ta phải triển khai luồng Custom OAuth.

### Luồng xử lý:
1. **Frontend:** Nút Đăng nhập Zalo trỏ link trực tiếp đến `https://oauth.zaloapp.com/...` kèm theo callback URI hướng về API Route nội bộ của Hụi Tín.
2. **Backend Callback (`/api/auth/zalo/callback/route.ts`):**
   - Nhận `code` từ Zalo và đổi lấy `access_token`.
   - Dùng `access_token` để lấy Profile người dùng (đặc biệt là Số điện thoại).
   - Nếu Zalo không trả về SĐT (do người dùng từ chối cấp quyền), redirect về trang Đăng ký và yêu cầu bổ sung SĐT.
   - Nếu có SĐT, hệ thống sử dụng **Supabase Admin API (Service Role Key)** để quét xem có user nào chung SĐT không.
3. **Account Linking:**
   - Nếu **đã có User** với SĐT đó: Backend cập nhật `zalo_id` vào `user_metadata` của User cũ (Gộp tài khoản).
   - Nếu **chưa có User**: Backend tự động dùng Admin API tạo tài khoản mới toanh.
4. **Tạo Session (Magic Link Bypass):**
   - Không thể dùng `signInWithOAuth` hay tạo Custom JWT (do rắc rối với middleware của `@supabase/ssr`).
   - Thay vào đó, Backend gọi `supabase.auth.admin.generateLink({ type: 'magiclink', email: userEmail })`.
   - Lệnh này trả về một URL (`action_link`), Backend sẽ redirect trình duyệt của người dùng đến URL này.
   - Trình duyệt sẽ tự động trao đổi mã với Supabase, sinh ra Cookie Session hợp lệ và người dùng được đăng nhập mà không cần nhập OTP/PIN!

### Biến môi trường yêu cầu:
Để tính năng này hoạt động, file `.env.local` bắt buộc phải có:
- `NEXT_PUBLIC_ZALO_APP_ID`: App ID từ Zalo Developer.
- `ZALO_SECRET_KEY`: Secret Key từ Zalo Developer.
- `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key của Supabase để Bypass RLS và sinh Magic Link.
