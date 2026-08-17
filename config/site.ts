export const siteConfig = {
  name: 'oDiv',
  url: 'https://odiv-three.vercel.app',
  title: 'oDiv',
  description: 'oDiv 的个人技术博客，记录前端工程、Next.js、Web3 开发与真实项目实践。',
  author: 'oDiv',
  locales: ['zh', 'en'] as const,
  defaultLocale: 'zh' as const,
  nav: [
    {key: 'blog', href: '/blog', iconName: 'icon-blog'},
    // {key: 'notes', href: '/notes', iconName: 'icon-book'},
    {key: 'projects', href: '/projects', iconName: 'icon-project'},
    {key: 'about', href: '/about', iconName: 'icon-me'}
  ],
  social: {
    github: 'https://github.com/',
    x: 'https://x.com/',
    email: 'mailto:13631531284@163.com',
    bluesky: 'https://bsky.app/',
    rss: '/rss.xml'
  }
};

export type AppLocale = (typeof siteConfig.locales)[number];
