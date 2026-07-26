import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://sohuitin.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/trang-chu/', '/day-hui/', '/tai-khoan/', '/kyc/', '/admin/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
