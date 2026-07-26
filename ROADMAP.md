# Hụi Tín — Roadmap

> Nền tảng quản lý hụi minh bạch cho nhóm người quen
> Cập nhật: 2026-07-24

---

## ✅ Tổng quan MVP v1.0 — HOÀN THÀNH

MVP chia thành **8 milestones**, mỗi milestone ~1 tuần. Chia 2 đợt:
- **MVP-A (M1–M5):** Core flow — Auth → KYC → Tạo dây hụi → Thỏa thuận → Đóng tiền ✅
- **MVP-B (M6–M8):** Sổ hụi, Biên nhận, Thông báo, Chat, Khiếu nại, Admin Portal ✅

**Tất cả 8 Milestones đã hoàn thành. Hệ thống sẵn sàng cho giai đoạn MVP-C (Post-MVP).**

---

## Milestone 1: Foundation & Auth ✅ `HOÀN THÀNH 2026-07-15`

| # | Task | Trạng thái |
|---|------|-----------|
| 1.1 | Init Next.js 16 project (App Router, TypeScript) | ✅ |
| 1.2 | Design system: CSS variables, typography (Inter), colors (teal/amber), dark mode | ✅ |
| 1.3 | UI components: Button, Input, Card, Modal, Badge, Toast | ✅ |
| 1.4 | Layout: Sidebar (desktop), BottomNav (mobile), Auth split-screen | ✅ |
| 1.5 | Supabase setup: browser client, server client, proxy (auth guard) | ✅ |
| 1.6 | Auth pages: Đăng nhập, Đăng ký, Quên mật khẩu | ✅ |
| 1.7 | Auth server actions: signUp, signIn, signOut, forgotPassword, Google OAuth | ✅ |
| 1.8 | Protected route layout with redirect | ✅ |
| 1.9 | Landing page: hero, features, how-it-works, CTA, footer | ✅ |
| 1.10 | Build verification: `next build` passes 0 errors | ✅ |

**Tech stack:** Next.js 16 · Supabase · Vanilla CSS · React Server Components
**Note:** Dùng `proxy.ts` thay cho `middleware.ts` (Next.js 16 breaking change)

---

## Milestone 2: KYC & Profile ✅ `HOÀN THÀNH 2026-07-15`

| # | Task | Trạng thái |
|---|------|-----------|
| 2.1 | Supabase DB migration: user_profiles, kyc_documents, bank_accounts | ✅ |
| 2.2 | KYC form: upload CCCD (trước/sau), selfie | ✅ |
| 2.3 | Profile page (xem & sửa thông tin cá nhân) | ✅ |
| 2.4 | Bank account management (thêm, sửa, xóa, đặt mặc định) | ✅ |
| 2.5 | Supabase Storage bucket (private, cho CCCD & selfie) | ✅ |
| 2.6 | RLS policies (user chỉ xem KYC của mình) | ✅ |
| 2.7 | Reputation display component | ✅ |

**Quyết định:** KYC thủ công (admin duyệt) cho MVP. Tích hợp eKYC provider sau.

---

## Milestone 3: Tạo Dây Hụi & Mời Thành Viên ✅ `HOÀN THÀNH`

| # | Task | Trạng thái |
|---|------|-----------|
| 3.1 | DB migration: hui_groups, hui_members | ✅ |
| 3.2 | Create Wizard (11-step stepper) | ✅ |
| 3.3 | Cashflow preview calculator (pure functions) | ✅ |
| 3.4 | Group list page (dây hụi của tôi) | ✅ |
| 3.5 | Group detail page | ✅ |
| 3.6 | Invite system: code, link, QR | ✅ |
| 3.7 | Invitation landing page (/moi/[code]) | ✅ |
| 3.8 | Member management UI | ✅ |
| 3.9 | RLS: only members see their groups | ✅ |
| 3.10 | Legal threshold warnings (NĐ 19/2019) | ✅ |

---

## Milestone 4: Thỏa Thuận & Kích Hoạt ✅ `HOÀN THÀNH`

| # | Task | Trạng thái |
|---|------|-----------|
| 4.1 | DB migration: agreements, signatures | ✅ |
| 4.2 | Agreement generator (from group config) | ✅ |
| 4.3 | Cashflow table display | ✅ |
| 4.4 | OTP confirmation for signing | ✅ |
| 4.5 | Agreement versioning (immutable) | ✅ |
| 4.6 | PDF generation for agreement | ✅ (VIP — `agreement_export.ts`) |
| 4.7 | Activation checks (all KYC'd, all signed, shares match) | ✅ |
| 4.8 | Auto-generate all periods on activation | ✅ |
| 4.9 | Period timeline UI | ✅ |

---

## Milestone 5: Đóng Tiền & VietQR ✅ `HOÀN THÀNH`

| # | Task | Trạng thái |
|---|------|-----------|
| 5.1 | DB migration: contributions, payouts | ✅ |
| 5.2 | VietQR generation (img.vietqr.io — free) | ✅ |
| 5.3 | Payment page per period | ✅ |
| 5.4 | Evidence upload (ảnh/PDF chứng từ) | ✅ |
| 5.5 | Contribution confirmation flow (chủ hụi xác nhận) | ✅ |
| 5.6 | Payout double-confirmation (cả 2 bên) | ✅ |
| 5.7 | Idempotency key implementation | ✅ |
| 5.8 | Contribution table with status badges | ✅ |
| 5.9 | Period completion logic | ✅ |

**Deliverable MVP-A:** Sau milestone 5, flow chính hoạt động end-to-end. (Đã hoàn thành)

---

## Milestone 6: Sổ Hụi & Biên Nhận ✅ `HOÀN THÀNH`

| # | Task | Trạng thái |
|---|------|-----------|
| 6.1 | DB migration: receipts | ✅ |
| 6.2 | Electronic ledger view (sổ hụi điện tử) | ✅ |
| 6.3 | Filter by period, member | ✅ |
| 6.4 | PDF export (sổ hụi) | ✅ |
| 6.5 | Excel/CSV export | ✅ |
| 6.6 | Receipt generation per transaction | ✅ |
| 6.7 | Receipt PDF with checksum | ✅ |
| 6.8 | Receipt list & download | ✅ |
| 6.9 | Integrity verification (checksum check) | ✅ |

---

## Milestone 7: Thông Báo, Chat & Khiếu Nại ✅ `HOÀN THÀNH`

| # | Task | Trạng thái |
|---|------|-----------|
| 7.1 | DB migration: notifications, chat_messages, disputes | ✅ |
| 7.2 | In-app notification system | ✅ |
| 7.3 | Notification bell + dropdown | ✅ |
| 7.4 | Scheduled reminders (payment due — API route `/api/cron/reminders`) | ✅ |
| 7.5 | Chat room per group (Supabase Realtime) | ✅ |
| 7.6 | Dispute creation flow | ✅ |
| 7.7 | Dispute timeline & evidence | ✅ |
| 7.8 | Government notice template (UBND cấp xã — NĐ 19/2019) | ✅ |

---


---

## Milestone 8: Admin Portal & Audit ✅ `HOÀN THÀNH`

| # | Task | Trạng thái |
|---|------|-----------|
| 8.1 | DB migration: risk_signals, audit_events | ✅ |
| 8.2 | Admin layout & navigation (`/admin`) | ✅ |
| 8.3 | Dashboard with key metrics | ✅ |
| 8.4 | User search & detail | ✅ |
| 8.5 | Group search & detail | ✅ |
| 8.6 | KYC review queue | ✅ |
| 8.7 | Audit log viewer (immutable, append-only) | ✅ |
| 8.8 | Dispute management | ✅ |
| 8.9 | Risk detection rules | ✅ |
| 8.10 | Export with access control | ✅ |

---

## Post-MVP: Giai đoạn 2+

### ✅ Đã hoàn thành (trong MVP)

| Feature | Chi tiết |
|---------|----------|
| Bỏ hụi (hụi có lãi) + công thức tính tiền | `bo_hui`, AuctionPanel, submitBid, finalizeAuction, cashflow.ts |
| Hoa hồng chủ hụi | `commission_type/amount` trong DB, tính trong auction, hiển thị trong thỏa thuận + biên nhận |
| Bốc thăm có thể kiểm chứng (verifiable randomness) | Cơ chế Provably Fair: tạo `server_hash` → kết hợp `client_seed` |
| Biểu quyết điện tử (consensus mechanism) | VotingPanel: thay đổi quy tắc, loại thành viên, đóng sớm |
| Xếp hạng rủi ro nội bộ | `/admin/risks` |

### 💎 Gói VIP (Premium cho Chủ Hụi)

| Feature | Mô tả | Ưu tiên |
|---------|-------|---------|
| ~~Chế độ riêng tư Sổ Hụi~~ | ✅ Ẩn danh thành viên trên sổ hụi, biên nhận, chat, đấu giá | ✅ Xong |
| ~~Quản lý không giới hạn~~ | ✅ Gói Free giới hạn tối đa **1** dây hụi. VIP không giới hạn. | ✅ Xong |
| ~~Báo cáo chuyên nghiệp & Ký số~~ | ✅ PDF Pro (font VN, logo, watermark, SHA-256, timestamp) | ✅ Xong |
| Đối soát ngân hàng (SePay/Casso) | Tự động nhận webhook ngân hàng, tự động "gạch nợ" | ⭐ Cao |
| Nhắc nợ qua Zalo ZNS / SMS | Tự động gửi nhắc nhở đóng tiền qua Zalo/SMS | 🟡 Trung bình |
| Phân quyền Quản trị (Trợ lý) | Thêm "Phó hụi" hoặc "Kế toán" để phụ giúp duyệt tiền | 🔴 Thấp |

---

## MVP-C: Chiến lược cạnh tranh (Sprint-based)

> **Mục tiêu:** Thu hẹp khoảng cách với đối thủ (Hụi Việt) ở UX/Growth, đồng thời tận dụng lợi thế pháp lý + minh bạch unique.
> Dựa trên phân tích cạnh tranh ngày 2026-07-24.

### Sprint C1: Quick Wins & Foundation (1-2 ngày) ✅

| # | Task | Mô tả | Trạng thái |
|---|------|-------|-----------|
| C1.1 | PWA manifest.json | `manifest.json` + meta tags → "Add to homescreen" trên mobile | ✅ (đã có sẵn) |
| C1.2 | Service Worker (offline shell) | Cache app shell → load nhanh, offline fallback page | ✅ (đã có sẵn) |
| C1.3 | Google Analytics 4 | Tích hợp GA4 tracking script + consent banner | ✅ |
| C1.4 | Schema.org Structured Data | SoftwareApplication, Organization, FAQ trên landing page | ✅ |
| C1.5 | Open Graph & Twitter Cards | OG image, description đầy đủ cho share social | ✅ |

### Sprint C2: Dashboard & Biểu đồ (2-3 ngày) ✅

| # | Task | Mô tả | Trạng thái |
|---|------|-------|-----------|
| C2.1 | Thư viện chart (Recharts) | Install + setup Recharts cho client components | ✅ |
| C2.2 | Dashboard Trang chủ | Tổng quan: tổng tiền đóng/nhận, số dây hoạt động, kỳ sắp tới | ✅ |
| C2.3 | Biểu đồ thu/chi theo thời gian | Area chart: dòng tiền đóng hụi vs lĩnh hụi 6 tháng | ✅ |
| C2.4 | Biểu đồ phân bổ dây hụi | Donut chart: tổng giá trị mỗi dây hụi | ✅ |
| C2.5 | Cards KPI trên trang chủ | Tổng đã đóng, tổng đã nhận, lãi/lỗ ròng, tiến độ % | ✅ |

### Sprint C3: Trang Pricing VIP & Thanh toán (2-3 ngày) ✅

| # | Task | Mô tả | Trạng thái |
|---|------|-------|-----------|
| C3.1 | Redesign trang `/vip` | Pricing table: Free vs VIP, feature comparison, CTA rõ ràng | ✅ |
| C3.2 | VietQR thanh toán VIP | Sinh VietQR cho gói VIP (tháng/năm), user scan để thanh toán | ✅ |
| C3.3 | Webhook xác nhận thanh toán | API `/api/webhooks/payment` nhận callback SePay/Casso → auto-activate | ✅ |
| C3.4 | Subscription expiry logic | Cron `/api/cron/subscriptions` kiểm tra hết hạn + gửi nhắc gia hạn 7 ngày | ✅ |

### Sprint C4: SEO & Content Marketing (3-5 ngày) ✅

| # | Task | Mô tả | Trạng thái |
|---|------|-------|-----------|
| C4.1 | Blog infrastructure | Route `/blog`, `/blog/[slug]`, gray-matter + markdown rendering, sitemap, robots | ✅ |
| C4.2 | Bài: "Cách tính tiền thảo hụi chuẩn xác" | SEO target: "tính tiền thảo", "tiền thảo hụi" | ✅ |
| C4.3 | Bài: "Luật chơi hụi NĐ 19/2019 – Điều cần biết" | SEO target: "luật chơi hụi", "nghị định 19" | ✅ |
| C4.4 | Bài: "Hụi sống vs Hụi chết – Phân biệt A-Z" | SEO target: "hụi sống hụi chết" | ✅ |
| C4.5 | Bài: "5 sai lầm phổ biến khi chơi hụi" | SEO target: "sai lầm chơi hụi", "rủi ro hụi" | ✅ |
| C4.6 | Bài: "Quản lý hụi bằng app" | SEO target: "app quản lý hụi" | ✅ |
| C4.7 | Sitemap.xml + robots.txt | Auto-generate sitemap (tất cả blog posts), robots.txt | ✅ |

### Sprint C5: Đối soát ngân hàng (VIP) (3-5 ngày) 🔲

| # | Task | Mô tả | Trạng thái |
|---|------|-------|-----------|
| C5.1 | Tích hợp SePay/Casso webhook | API route nhận transaction webhook | 🔲 |
| C5.2 | Auto-match transaction → contribution | Parse nội dung CK, match với member + period + amount | 🔲 |
| C5.3 | UI cấu hình tài khoản ngân hàng nhận | Chủ hụi setup bank account cho auto-reconciliation | 🔲 |
| C5.4 | Dashboard đối soát | Danh sách giao dịch ngân hàng, trạng thái match/unmatched | 🔲 |
| C5.5 | Auto-confirm contribution | Tự động đánh dấu "đã đóng" khi match thành công | 🔲 |

### 🚀 Giai đoạn 3: Growth & Mobile

#### Sprint P3.1: Onboarding Tutorial ✅

| # | Task | Mô tả | Trạng thái |
|---|------|-------|-----------|
| P3.1.1 | OnboardingProvider | Context + TourOverlay: spotlight SVG mask, animated tooltip, step indicators | ✅ |
| P3.1.2 | Tour: first-visit | 4-step tour trên dashboard: welcome → tạo hụi → dây hụi → VIP | ✅ |
| P3.1.3 | Tour: create-group | 3-step tour trên form tạo hụi: tên → loại → số tiền | ✅ |
| P3.1.4 | localStorage persistence | Không hiện lại tour đã hoàn thành | ✅ |
| P3.1.5 | Integration | data-tour attributes + ClientProviders wrapper | ✅ |

#### Sprint P3.2: Mobile App (Capacitor) ✅

| # | Task | Mô tả | Trạng thái |
|---|------|-------|-----------|
| P3.2.1 | Capacitor setup | Install @capacitor/core, cli, ios, android + plugins | ✅ |
| P3.2.2 | Config | capacitor.config.ts: SplashScreen, StatusBar, PushNotifications | ✅ |
| P3.2.3 | Build scripts | `scripts/mobile-build.sh` (dev/prod) + npm scripts | ✅ |
| P3.2.4 | Native utils | Platform detection hook + NativeSafeArea component | ✅ |

#### Sprint P3.3: Trang Hướng dẫn ✅

| # | Task | Mô tả | Trạng thái |
|---|------|-------|-----------|
| P3.3.1 | Trang `/huong-dan` | 5 section step-by-step: đăng ký → tạo hụi → mời → đóng → sổ hụi | ✅ |
| P3.3.2 | Quick nav + FAQ accordion | Anchor nav + 5 câu hỏi thường gặp (details/summary) | ✅ |
| P3.3.3 | CTA banner | Đăng ký + Blog links | ✅ |
| P3.3.4 | SEO + Sitemap | Meta tags + thêm vào sitemap.xml | ✅ |
| P3.3.5 | Landing nav link | Thêm "Hướng dẫn" vào navigation bar trang chủ | ✅ |

#### Sprint P3.4: Polish & Bug fixes ✅

| # | Task | Mô tả | Trạng thái |
|---|------|-------|-----------|
| P3.4.1 | Error boundary | `error.tsx` cho main layout — friendly error message + retry | ✅ |
| P3.4.2 | 404 page | `not-found.tsx` — custom 404 tiếng Việt + nav links | ✅ |
| P3.4.3 | Loading states | Thêm loading skeleton cho `/vip` | ✅ |
| P3.4.4 | Accessibility audit | Kiểm tra tất cả `<img>` có alt tag | ✅ |
| P3.4.5 | Console.log cleanup | Xác nhận không có console.log leak trong app code | ✅ |
| P3.4.6 | Onboarding fix | Fix tooltip positioning (fixed vs absolute) + VIP step placement | ✅ |

#### Tính năng dự kiến (chưa làm)

| Phase | Feature | Ưu tiên |
|-------|---------|---------|
| 3 | Thu hộ/chi hộ qua cổng thanh toán PSP (cần pháp lý) | 🔴 |
| 3 | Escrow / tài khoản bảo chứng | 🔴 |
| 4 | Marketplace (kết nối chủ hụi — người chơi lạ có uy tín) | 🔴 |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router, RSC) |
| Styling | Vanilla CSS (custom design system) |
| Database | Supabase (PostgreSQL + Auth + Storage) |
| Auth | Supabase Auth (email, Google, OTP) |
| Realtime | Supabase Realtime (chat, notifications) |
| Payments | VietQR API (img.vietqr.io — free) |
| Charts | Recharts (client-side) |
| PDF | jsPDF + jspdf-autotable (client-side, Vietnamese font: Roboto TTF) |
| Analytics | Google Analytics 4 |
| Deploy | TBD (Vercel or Netlify) |

---

## Nguyên tắc quan trọng

1. **Không giữ tiền** — MVP chỉ là công cụ quản lý
2. **Audit log bất biến** — append-only, trigger chặn UPDATE/DELETE
3. **Tiền tệ = integer VND** — không dùng float
4. **Idempotency** — mọi API tài chính có idempotency key
5. **Xác nhận 2 bên** — đóng tiền & giao tiền đều cần cả 2 xác nhận
6. **Không sửa âm thầm** — mọi thay đổi tài chính ghi audit log
7. **Private by default** — dây hụi chỉ thấy bằng invite
8. **Pháp lý** — cảnh báo khi đạt ngưỡng NĐ 19/2019, luật sư duyệt trước khi thương mại
