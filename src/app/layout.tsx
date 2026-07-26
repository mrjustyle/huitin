import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';
import TopLoader from '@/components/ui/TopLoader';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import { organizationSchema, softwareAppSchema, faqSchema } from '@/lib/schema';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://sohuitin.com';

export const metadata: Metadata = {
  title: {
    default: 'Hụi Tín — Sổ hụi điện tử minh bạch',
    template: '%s | Hụi Tín',
  },
  description:
    'Sổ hụi điện tử giúp quản lý dây hụi rõ ràng và minh bạch. Thỏa thuận điện tử, sổ hụi số hóa, nhắc đóng tự động.',
  keywords: [
    'hụi', 'họ', 'chơi hụi', 'quản lý hụi', 'hụi online', 'hụi an tâm',
    'app quản lý hụi', 'phần mềm quản lý hụi', 'sổ hụi điện tử', 'sổ hụi',
    'tính tiền thảo', 'hụi tín', 'hụi minh bạch', 'sohuitin',
  ],
  authors: [{ name: 'Hụi Tín' }],
  creator: 'Hụi Tín',
  publisher: 'Hụi Tín',
  manifest: '/manifest.json',
  metadataBase: new URL(APP_URL),
  alternates: {
    canonical: '/',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Hụi Tín',
  },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: APP_URL,
    siteName: 'Hụi Tín',
    title: 'Hụi Tín — Sổ hụi điện tử minh bạch',
    description:
      'Sổ hụi điện tử giúp quản lý dây hụi rõ ràng và minh bạch. Góp rõ ràng. Giữ trọn chữ tín.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Hụi Tín — Sổ hụi điện tử minh bạch',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hụi Tín — Quản lý hụi minh bạch cho nhóm người quen',
    description:
      'Số hóa dây hụi với thỏa thuận điện tử, sổ hụi số, biên nhận tự động và nhắc đóng hụi.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: '#16A085',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-192.png" />
        {/* Schema.org Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      </head>
      <body>
        <ToastProvider>{children}</ToastProvider>
        <TopLoader />
        <ServiceWorkerRegister />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
