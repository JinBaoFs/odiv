import type {MetadataRoute} from 'next';
import {siteConfig} from '@/config/site';
import {listMdxPosts} from '@/lib/mdx-posts';
import {absoluteUrl, localizedAlternates, localizedPath} from '@/lib/metadata';

const staticPages = [
  {path: '', changeFrequency: 'weekly' as const, priority: 1},
  {path: '/blog', changeFrequency: 'weekly' as const, priority: 0.9},
  {path: '/projects', changeFrequency: 'monthly' as const, priority: 0.7},
  {path: '/about', changeFrequency: 'monthly' as const, priority: 0.7},
  {path: '/image-compressor', changeFrequency: 'monthly' as const, priority: 0.6},
  {path: '/fomo-tool', changeFrequency: 'monthly' as const, priority: 0.6},
  {path: '/price-agent', changeFrequency: 'monthly' as const, priority: 0.6},
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locales = [...siteConfig.locales];
  const staticEntries = locales.flatMap((locale) =>
    staticPages.map(({path, changeFrequency, priority}) => ({
      url: absoluteUrl(localizedPath(locale, path)),
      changeFrequency,
      priority,
      alternates: {languages: localizedAlternates(path)},
    })),
  );
  const postsByLocale = await Promise.all(
    locales.map(async (locale) => ({locale, posts: await listMdxPosts(locale)})),
  );
  const postEntries = postsByLocale.flatMap(({locale, posts}) =>
    posts.map((post) => {
      const path = `/blog/${post.slug}`;

      return {
        url: absoluteUrl(localizedPath(locale, path)),
        lastModified: new Date(post.updatedAt ?? post.date),
        changeFrequency: 'monthly' as const,
        priority: 0.8,
        alternates: {languages: localizedAlternates(path)},
      };
    }),
  );

  return [...staticEntries, ...postEntries];
}
