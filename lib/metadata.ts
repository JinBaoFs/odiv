import type {Metadata} from 'next';
import {siteConfig, type AppLocale} from '@/config/site';

type SeoInput = {
  title: string;
  description: string;
  locale: AppLocale;
  path?: string;
  image?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  tags?: string[];
};

export function normalizeLocale(locale: string): AppLocale {
  return locale === 'en' ? 'en' : 'zh';
}

export function absoluteUrl(path = '/'): string {
  return new URL(path, `${siteConfig.url}/`).toString();
}

export function localizedPath(locale: AppLocale, path = ''): string {
  const normalizedPath = path === '/' ? '' : `/${path.replace(/^\/+|\/+$/g, '')}`;
  return `/${locale}${normalizedPath}`;
}

export function localizedAlternates(path = '') {
  return {
    zh: absoluteUrl(localizedPath('zh', path)),
    en: absoluteUrl(localizedPath('en', path)),
    'x-default': absoluteUrl(localizedPath(siteConfig.defaultLocale, path)),
  };
}

export function createMetadata({
  title,
  description,
  locale,
  path,
  image = '/images/logo.png',
  type = 'website',
  publishedTime,
  modifiedTime,
  tags,
}: SeoInput): Metadata {
  const url = absoluteUrl(localizedPath(locale, path));
  const imageUrl = absoluteUrl(image);
  const openGraphLocale = locale === 'zh' ? 'zh_CN' : 'en_US';
  const alternateLocale = locale === 'zh' ? 'en_US' : 'zh_CN';

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: localizedAlternates(path),
    },
    openGraph:
      type === 'article'
        ? {
            title,
            description,
            url,
            type: 'article',
            siteName: siteConfig.name,
            locale: openGraphLocale,
            alternateLocale,
            publishedTime,
            modifiedTime,
            tags,
            images: [{url: imageUrl, alt: title}],
          }
        : {
            title,
            description,
            url,
            type: 'website',
            siteName: siteConfig.name,
            locale: openGraphLocale,
            alternateLocale,
            images: [{url: imageUrl, alt: title}],
          },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}
