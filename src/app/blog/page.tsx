import Link from 'next/link';
import { getAllPosts } from '@/lib/blog';
import styles from './blog.module.css';

export const metadata = {
  title: 'Blog — Kiến thức chơi hụi',
  description: 'Chia sẻ kiến thức về hụi, họ, luật chơi hụi NĐ 19/2019, cách tính tiền thảo và mẹo quản lý dây hụi an toàn.',
  openGraph: {
    title: 'Blog — Kiến thức chơi hụi | Hụi Tín',
    description: 'Chia sẻ kiến thức về hụi, họ, luật chơi hụi NĐ 19/2019, cách tính tiền thảo.',
  },
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className={styles.blogPage}>
      <div className={styles.blogHeader}>
        <Link href="/" className={styles.backLink}>← Trang chủ</Link>
        <h1 className={styles.blogTitle}>📚 Blog Hụi Tín</h1>
        <p className={styles.blogDesc}>
          Kiến thức về hụi, luật pháp, cách tính tiền thảo và mẹo quản lý dây hụi an toàn.
        </p>
      </div>

      {posts.length === 0 ? (
        <div className={styles.empty}>
          <p>Chưa có bài viết nào. Quay lại sau nhé!</p>
        </div>
      ) : (
        <div className={styles.postGrid}>
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className={styles.postCard}>
              <div className={styles.postMeta}>
                <time dateTime={post.date}>
                  {new Date(post.date).toLocaleDateString('vi-VN', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </time>
                <span>·</span>
                <span>{post.author}</span>
              </div>
              <h2 className={styles.postTitle}>{post.title}</h2>
              <p className={styles.postDesc}>{post.description}</p>
              <div className={styles.postTags}>
                {post.tags.map((tag) => (
                  <span key={tag} className={styles.tag}>{tag}</span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
