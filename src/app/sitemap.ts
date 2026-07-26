import type { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/blog';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://sohuitin.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();

  const blogEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/vip`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/huong-dan`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/dang-nhap`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/dang-ky`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    ...blogEntries,
  ];
}
