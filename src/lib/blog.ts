import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const BLOG_DIR = path.join(process.cwd(), 'content/blog');

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  image?: string;
  content: string;
}

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));

  const posts = files.map((filename) => {
    const slug = filename.replace('.md', '');
    const filePath = path.join(BLOG_DIR, filename);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(fileContent);

    return {
      slug,
      title: data.title || slug,
      description: data.description || '',
      date: data.date || '',
      author: data.author || 'Hụi Tín',
      tags: data.tags || [],
      image: data.image,
      content,
    };
  });

  // Sort by date descending
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(fileContent);

  return {
    slug,
    title: data.title || slug,
    description: data.description || '',
    date: data.date || '',
    author: data.author || 'Hụi Tín',
    tags: data.tags || [],
    image: data.image,
    content,
  };
}

// Simple markdown to HTML (no external lib needed for basic formatting)
export function markdownToHtml(md: string): string {
  let html = md
    // Headers
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    // Bold & italic
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Lists
    .replace(/^\- (.*$)/gm, '<li>$1</li>')
    .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
    // Blockquote
    .replace(/^\> (.*$)/gm, '<blockquote>$1</blockquote>')
    // Code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Paragraphs (double newline)
    .replace(/\n\n/g, '</p><p>')
    // Line breaks
    .replace(/\n/g, '<br/>');

  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>.*?<\/li>)(\s*<br\/>)*(<li>)/g, '$1$3');
  html = html.replace(/(<li>.*?<\/li>)/g, '<ul>$1</ul>');
  html = html.replace(/<\/ul>\s*<ul>/g, '');

  return `<p>${html}</p>`;
}
