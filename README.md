# Hụi Tín — Sổ hụi điện tử minh bạch

> Sổ hụi điện tử giúp quản lý dây hụi rõ ràng và minh bạch. Góp rõ ràng. Giữ trọn chữ tín.

---

## ✅ Tính năng đã hoàn thành (MVP v1.0)

### 🔐 Xác thực & Định danh
- Đăng ký / đăng nhập bằng Email + Password
- Xác minh KYC: Upload CCCD (mặt trước + sau) + ảnh selfie
- Hệ thống uy tín thành viên (Reputation Score)
- Quản lý tài khoản ngân hàng (42 ngân hàng + 3 ví điện tử)

### 💰 Dây Hụi
- Tạo và quản lý dây hụi (không lãi, bốc thăm, đấu giá, cố định)
- Mời thành viên qua mã mời 6 ký tự / link công khai
- Thỏa thuận điện tử tự động (7 điều khoản, ký xác nhận, checksum SHA-256)
- Kích hoạt dây hụi → tự động sinh tất cả kỳ hụi
- Bảng dòng tiền (Cashflow) tương tác

### 📅 Kỳ hụi & Giao dịch
- Đóng hụi + VietQR (tạo QR thanh toán tự động)
- Xác nhận đóng tiền 2 bên (Thành viên gửi → Chủ hụi xác nhận)
- Lĩnh hụi (Payout) kèm xác nhận ảnh chuyển khoản
- Upload bằng chứng thanh toán
- Hệ thống bỏ phiếu (Vote) cho kỳ đấu giá

### 📋 Sổ Hụi & Biên Nhận
- Sổ hụi điện tử dạng ma trận (thành viên × kỳ)
- Xuất Sổ hụi ra CSV hoặc PDF
- Biên nhận điện tử tự động cho mỗi giao dịch
- Biên nhận kèm checksum toàn vẹn (SHA-256)
- Tải biên nhận PDF

### 🔔 Thông Báo & Chat
- Chuông thông báo In-app (Supabase Realtime)
- Chat nội bộ theo từng dây hụi (Realtime)
- API Cron nhắc nhở đóng hụi tự động (`/api/cron/reminders`)

### ⚠️ Khiếu Nại & Tranh Chấp
- Báo cáo sự cố / tạo khiếu nại kèm bằng chứng
- Trang quản lý khiếu nại cho chủ hụi
- Chủ hụi giải quyết khiếu nại + ghi chú

### ⚖️ Pháp Lý
- Cảnh báo tự động khi dây hụi ≥ 100 triệu VND (NĐ 19/2019/NĐ-CP)
- Xuất PDF Mẫu Thông báo UBND cấp xã (điền sẵn thông tin)

### 🛡️ Admin Portal (`/admin`)
- Dashboard metrics: tổng user, chờ KYC, dây hụi, khiếu nại, tổng giá trị
- Duyệt hồ sơ KYC (xem CCCD, duyệt/từ chối)
- Tìm kiếm người dùng theo tên / SĐT
- Tìm kiếm dây hụi theo tên
- Quản lý khiếu nại cấp admin
- Audit Log bất biến (append-only, trigger chặn UPDATE/DELETE)
- Bảo vệ 2 lớp: Middleware + Layout check (role = admin/support)

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router, RSC, Turbopack) |
| Styling | Vanilla CSS (custom design system + dark mode) |
| Database | Supabase (PostgreSQL + Auth + Storage + RLS + Realtime) |
| Auth | Supabase Auth (Email + Password) |
| Charts | Recharts (client-side, KPI + Cashflow + Donut) |
| PDF | jsPDF (Sổ hụi, Biên nhận, Mẫu UBND) |
| QR | VietQR API (img.vietqr.io) |
| Blog | Markdown + gray-matter (static content) |
| Analytics | Google Analytics 4 |
| Mobile | Capacitor (iOS + Android wrapper) |
| Language | TypeScript |
| Deploy | Node.js ≥ 20.9.0 |

---

## 🚀 Cài đặt

### Yêu cầu

- **Node.js** >= 20.9.0 (khuyến nghị dùng `nvm`)
- **Supabase project** (free tier OK)

### 1. Clone & cài dependencies

```bash
cd huitin
npm install
```

### 2. Cấu hình Supabase

Copy file env mẫu:

```bash
cp .env.local.example .env.local
```

Mở `.env.local` và điền thông tin:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Server-side (cần cho webhook, cron)
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...your-service-key

# Payment Webhook (SePay/Casso callback)
PAYMENT_WEBHOOK_SECRET=your-webhook-secret-here

# Cron Job
CRON_SECRET=your-random-secret

# Google Analytics 4
# NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### 3. Chạy SQL migrations

Vào **Supabase Dashboard → SQL Editor** và chạy **tuần tự** các file trong `supabase/migrations/`:

```
001_initial_setup.sql          ← Schema chính (tables, RLS, triggers)
002_fix_rls_recursion.sql      ← Fix RLS + is_admin()
003_... đến 026_...            ← Các bản vá và bổ sung
```

> 💡 Tip: Chạy từng file một, theo thứ tự số. Nếu gặp lỗi "already exists" → bỏ qua, tiếp tục file tiếp theo.

### 4. Chạy dev server

```bash
npm run dev
```

Mở trình duyệt: **http://localhost:3000**

---

## 👤 Hướng dẫn sử dụng

### Luồng chính (Happy Path)

```
Đăng ký → KYC → Thêm ngân hàng → Tạo dây hụi → Mời thành viên
→ Ký thỏa thuận → Kích hoạt → Đóng hụi / Lĩnh hụi → Xem Sổ hụi
```

### Bước 1: Đăng ký & KYC

1. Vào `/dang-ky` → điền email + mật khẩu
2. Xác nhận email
3. Vào `/kyc` → upload CCCD + selfie → gửi xác minh
4. Admin duyệt tại `/admin/kyc`

### Bước 2: Tạo dây hụi

1. Vào `/day-hui` → nhấn **"+ Tạo dây hụi"**
2. Wizard 5 bước: Loại → Cấu hình → Lịch trình → Quy tắc → Xem trước
3. Nhấn **"Tạo dây hụi"** → nhận mã mời

### Bước 3: Mời thành viên & Ký thỏa thuận

1. Gửi link `https://your-domain.com/moi/MXXX` cho thành viên
2. Vào `/day-hui/[id]/thoa-thuan` → **Tạo thỏa thuận**
3. Tất cả thành viên ký → Chủ hụi **Kích hoạt**

### Bước 4: Quản lý kỳ hụi

1. Vào chi tiết kỳ hụi → thành viên bấm **"Đóng hụi"**
2. Quét VietQR → chuyển khoản → chủ hụi xác nhận
3. Cuối kỳ: Chủ hụi ghi nhận Lĩnh hụi → thành viên xác nhận nhận tiền

---

## 🛡️ Admin Portal

Truy cập: **http://localhost:3000/admin**

### Điều kiện truy cập

Tài khoản phải có `role = 'admin'` hoặc `'support'` trong bảng `user_profiles`.

Để set quyền admin, chạy trong Supabase SQL Editor:

```sql
UPDATE public.user_profiles
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'your@email.com');
```

### Các trang Admin

| URL | Chức năng |
|-----|-----------|
| `/admin` | Dashboard (metrics tổng quan) |
| `/admin/kyc` | Duyệt hồ sơ KYC (xem CCCD, Duyệt/Từ chối) |
| `/admin/users` | Tìm kiếm người dùng |
| `/admin/groups` | Tìm kiếm dây hụi |
| `/admin/disputes` | Giải quyết khiếu nại |
| `/admin/audit` | Xem Audit Log bất biến |

### Cron Jobs

Gọi API sau mỗi ngày để tự động nhắc nhở và xử lý subscription:

```bash
# Nhắc nhở đóng hụi (chạy mỗi sáng)
curl -H "Authorization: Bearer $CRON_SECRET" \
     https://your-domain.com/api/cron/reminders

# Kiểm tra hết hạn VIP + gửi nhắc gia hạn 7 ngày (chạy mỗi ngày)
curl -H "Authorization: Bearer $CRON_SECRET" \
     https://your-domain.com/api/cron/subscriptions
```

**Vercel Cron** (`vercel.json`):
```json
{
  "crons": [
    { "path": "/api/cron/reminders", "schedule": "0 8 * * *" },
    { "path": "/api/cron/subscriptions", "schedule": "0 2 * * *" }
  ]
}
```

### Payment Webhook (SePay/Casso)

Cấu hình webhook trên SePay/Casso trỏ đến:

```
POST https://your-domain.com/api/webhooks/payment
Header: x-api-key: your-webhook-secret
```

Webhook tự động:
- Parse nội dung chuyển khoản chứa `VIP username`
- Match user → kích hoạt gói VIP (1 tháng = 99k, 1 năm = 990k)
- Idempotent (không xử lý trùng transaction)

---

## 📁 Cấu trúc thư mục

```
huitin/
├── middleware.ts                  # Auth middleware (bảo vệ /admin/*)
├── capacitor.config.ts            # Capacitor config (iOS/Android)
├── scripts/mobile-build.sh        # Mobile build script (dev/prod)
├── content/blog/                  # Blog markdown files (SEO)
├── supabase/migrations/           # 026 SQL migration files
├── android/                       # Native Android project (auto-generated)
└── src/
    ├── app/
    │   ├── (auth)/                # Đăng nhập, Đăng ký, Quên MK
    │   ├── (main)/                # Các trang người dùng (có sidebar)
    │   │   ├── trang-chu/         # Dashboard + KPI Charts
    │   │   ├── kyc/               # Form KYC
    │   │   ├── tai-khoan/         # Profile + Tài khoản ngân hàng
    │   │   ├── vip/               # VIP Pricing + VietQR Payment
    │   │   └── day-hui/           # Dây hụi
    │   │       ├── tao-moi/       # Wizard tạo dây hụi
    │   │       └── [id]/          # Chi tiết dây hụi
    │   │           ├── ky/[id]/   # Chi tiết kỳ hụi
    │   │           ├── so-hui/    # Sổ hụi điện tử
    │   │           ├── bien-nhan/ # Biên nhận
    │   │           ├── disputes/  # Khiếu nại
    │   │           └── thoa-thuan/# Thỏa thuận
    │   ├── admin/                 # Admin Portal (protected)
    │   ├── blog/                  # Blog SEO pages
    │   │   ├── page.tsx           # Danh sách bài viết
    │   │   └── [slug]/page.tsx    # Chi tiết bài viết
    │   ├── api/
    │   │   ├── auth/callback/     # Supabase OAuth callback
    │   │   ├── cron/reminders/    # Nhắc nhở đóng hụi
    │   │   ├── cron/subscriptions/# Kiểm tra hết hạn VIP
    │   │   └── webhooks/payment/  # SePay/Casso webhook
    │   ├── sitemap.ts             # Auto-generated sitemap.xml
    │   ├── robots.ts              # robots.txt config
    │   └── moi/[code]/            # Trang mời (public)
    ├── components/
    │   ├── ui/                    # Design system components
    │   └── onboarding/            # Interactive tour system
    ├── features/                  # Feature modules (Server Actions)
    │   ├── admin/                 # Admin actions
    │   ├── auth/                  # Auth actions
    │   ├── hui/                   # Hui groups + cashflow
    │   ├── period/                # Kỳ hụi, đóng tiền, lĩnh hụi
    │   ├── dashboard/             # Dashboard stats aggregation
    │   ├── subscription/          # VIP subscription logic
    │   ├── receipt/               # Biên nhận
    │   ├── kyc/                   # KYC form + admin actions
    │   ├── profile/               # Profile, Banks, Reputation
    │   └── agreement/             # Thỏa thuận + signing
    └── lib/
        ├── supabase/              # Supabase clients
        ├── blog.ts                # Blog utilities (gray-matter)
        ├── native.tsx             # Capacitor platform detection
        ├── receipt_export.ts      # Xuất PDF biên nhận
        ├── ubnd_export.ts         # Xuất PDF Mẫu TB UBND
        ├── export.ts              # Xuất CSV/PDF sổ hụi
        ├── crypto.ts              # Checksum SHA-256
        └── constants.ts           # Labels, formatters
```

---

## ⚙️ Nguyên tắc kỹ thuật

| # | Nguyên tắc | Chi tiết |
|---|-----------|------------|
| 1 | **Không giữ tiền** | Hệ thống là công cụ quản lý, KHÔNG phải trung gian tài chính |
| 2 | **Tiền tệ = integer** | VND lưu dạng BIGINT, không dùng float |
| 3 | **Xác nhận 2 bên** | Đóng tiền & giao tiền đều cần cả 2 xác nhận |
| 4 | **Audit bất biến** | `audit_events` có trigger chặn UPDATE/DELETE |
| 5 | **Thỏa thuận có checksum** | SHA-256, không thể sửa nội dung sau khi ký |
| 6 | **Private by default** | Dây hụi chỉ thấy bằng invite code, RLS trên mọi bảng |
| 7 | **Cảnh báo pháp lý** | Tự động cảnh báo + xuất mẫu UBND khi dây hụi ≥ 100 triệu VND |
| 8 | **Admin 2 lớp** | Middleware + Layout check (`role = admin/support`) |

---

## 📜 Scripts

### Web Development

```bash
npm run dev              # Dev server (Turbopack, hot reload)
npm run build            # Build production
npm run start            # Chạy production server
npm run lint             # Kiểm tra code style
```

### Mobile (Capacitor)

> **Yêu cầu:** Node.js ≥ 20, nvm đã cài.
> Android: cần Android Studio. iOS: cần Xcode (macOS only).

```bash
# Dev mode (load từ local dev server)
nvm use 20              # QUAN TRỌNG: phải dùng Node 20+
npm run dev             # Bật dev server trước
npm run mobile:android  # Sync + build Android
npm run mobile:ios      # Sync + build iOS

# Mở IDE native
npx cap open android    # Mở Android Studio
npx cap open ios        # Mở Xcode

# Production mode (load từ sohuitin.com)
npm run mobile:android:prod
npm run mobile:ios:prod
```

**Lưu ý quan trọng:**
- Luôn chạy `nvm use 20` trước khi dùng Capacitor CLI (yêu cầu Node ≥ 20)
- Dev mode: app mobile sẽ load từ `http://<local-ip>:3000`, đảm bảo `npm run dev` đang chạy
- Prod mode: app sẽ load từ `https://sohuitin.com`
- Sau khi thay đổi code web, chạy lại `npx cap sync` để cập nhật

### Deploy (Vercel)

```bash
# Cài Vercel CLI
npm i -g vercel

# Deploy preview
vercel

# Deploy production
vercel --prod
```

Sau khi deploy, cấu hình trên Vercel Dashboard:
1. **Environment Variables**: thêm tất cả biến từ `.env.local`
2. **Cron Jobs**: thêm vào `vercel.json` (xem mục Cron Jobs ở trên)
3. **Domain**: trỏ `sohuitin.com` về Vercel

### Ngrok (Test webhook trên local)

```bash
# Mở tunnel cho dev server
ngrok http 3000

# Copy URL ngrok (ví dụ: https://xxxx.ngrok-free.app)
# Cấu hình SePay/Casso webhook → https://xxxx.ngrok-free.app/api/webhooks/payment
# Cập nhật NEXT_PUBLIC_APP_URL trong .env.local
```

---

## License

Private — Chưa public.
