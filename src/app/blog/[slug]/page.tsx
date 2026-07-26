import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getPostBySlug, getAllPosts, markdownToHtml } from '@/lib/blog';
import styles from '../blog.module.css';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: `${post.title} | Hụi Tín`,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
    },
  };
}

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const htmlContent = markdownToHtml(post.content);

  return (
    <div className={styles.blogPage}>
      <div className={styles.articleHeader}>
        <Link href="/blog" className={styles.backLink}>← Tất cả bài viết</Link>
        <div className={styles.postMeta}>
          <time dateTime={post.date}>
            {new Date(post.date).toLocaleDateString('vi-VN', {
              year: 'numeric', month: 'long', day: 'numeric',
            })}
          </time>
          <span>·</span>
          <span>{post.author}</span>
        </div>
        <h1 className={styles.articleTitle}>{post.title}</h1>
        <p className={styles.articleDesc}>{post.description}</p>
        <div className={styles.postTags}>
          {post.tags.map((tag) => (
            <span key={tag} className={styles.tag}>{tag}</span>
          ))}
        </div>
      </div>

      <article
        className={styles.articleContent}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />

      <div className={styles.articleFooter}>
        <div className={styles.ctaBanner}>
          <h3>🎯 Quản lý hụi minh bạch với Hụi Tín</h3>
          <p>Thỏa thuận điện tử, sổ hụi số, biên nhận tự động. Miễn phí dây hụi đầu tiên.</p>
          <Link href="/dang-ky" className={styles.ctaBtn}>Đăng ký miễn phí →</Link>
        </div>
        <Link href="/blog" className={styles.backLink}>← Xem thêm bài viết</Link>
      </div>
    </div>
  );
}
