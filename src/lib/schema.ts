import type { WithContext, SoftwareApplication, Organization, FAQPage } from 'schema-dts';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://sohuitin.com';

export const organizationSchema: WithContext<Organization> = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Hụi Tín',
  url: APP_URL,
  logo: `${APP_URL}/icons/icon-512.png`,
  description: 'Sổ hụi điện tử giúp quản lý dây hụi rõ ràng và minh bạch',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    availableLanguage: 'Vietnamese',
  },
};

export const softwareAppSchema: WithContext<SoftwareApplication> = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Hụi Tín',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web',
  description:
    'Sổ hụi điện tử giúp quản lý dây hụi rõ ràng và minh bạch. Thỏa thuận điện tử, sổ hụi số hóa, biên nhận tự động, nhắc đóng hụi.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'VND',
  },
  author: {
    '@type': 'Organization',
    name: 'Hụi Tín',
  },
  inLanguage: 'vi',
};

export const faqSchema: WithContext<FAQPage> = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Hụi Tín là gì?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Hụi Tín là sổ hụi điện tử giúp quản lý dây hụi rõ ràng và minh bạch. Ứng dụng giúp số hóa toàn bộ dây hụi với thỏa thuận điện tử, sổ hụi số, biên nhận tự động và nhắc đóng hụi.',
      },
    },
    {
      '@type': 'Question',
      name: 'Hụi Tín có miễn phí không?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Có! Hụi Tín hoàn toàn miễn phí cho dây hụi đầu tiên. Gói VIP dành cho chủ hụi chuyên nghiệp với các tính năng nâng cao như báo cáo PDF Pro, chế độ riêng tư và quản lý không giới hạn.',
      },
    },
    {
      '@type': 'Question',
      name: 'Hụi Tín có an toàn không?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Rất an toàn. Mọi thay đổi đều được ghi vào audit log bất biến (không thể xóa hay sửa). Dữ liệu được mã hóa, xác nhận 2 bên cho mọi giao dịch, và tuân thủ Nghị định 19/2019/NĐ-CP.',
      },
    },
    {
      '@type': 'Question',
      name: 'Có cần cài ứng dụng không?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Không cần! Hụi Tín là web app (PWA) — mở trên trình duyệt điện thoại hoặc máy tính. Bạn có thể "Add to homescreen" để dùng như ứng dụng native.',
      },
    },
  ],
};
