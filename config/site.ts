export const siteConfig = {
  name: 'oDiv',
  title: 'oDiv Blog Framework',
  description: 'A Next.js 15 multilingual blog starter with configurable theme tokens.',
  locales: ['zh', 'en'] as const,
  defaultLocale: 'zh' as const,
  nav: [
    {key: 'articles', href: '/articles'},
    {key: 'notes', href: '/notes'},
    {key: 'projects', href: '/projects'},
    {key: 'about', href: '/about'}
  ],
  social: {
    github: 'https://github.com/',
    x: 'https://x.com/',
    email: 'mailto:you@example.com',
    bluesky: 'https://bsky.app/',
    rss: '/rss.xml'
  }
};

export type AppLocale = (typeof siteConfig.locales)[number];
