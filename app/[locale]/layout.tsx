import '../globals.css';
import 'highlight.js/styles/atom-one-dark.css';
import type {Metadata} from 'next';
import Script from 'next/script';
import {NextIntlClientProvider, hasLocale} from 'next-intl';
import {getMessages, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {Providers} from '@/components/providers';
import {RouteLoadingProvider} from '@/components/route-loading-provider';
import {Sidebar} from '@/components/sidebar';
import {Footer} from '@/components/footer';
import {siteConfig} from '@/config/site';
import {routing} from '@/i18n/routing';
import {
  absoluteUrl,
  localizedAlternates,
  localizedPath,
  normalizeLocale,
} from '@/lib/metadata';
import zhMessages from '@/messages/zh.json';
import enMessages from '@/messages/en.json';

type Props = {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export async function generateMetadata({params}: Pick<Props, 'params'>): Promise<Metadata> {
  const locale = normalizeLocale((await params).locale);
  const isZh = locale === 'zh';
  const title = isZh
    ? 'oDiv｜前端、Next.js 与 Web3 技术博客'
    : 'oDiv | Frontend, Next.js and Web3 Blog';
  const description = isZh
    ? siteConfig.description
    : 'The personal technology blog of oDiv, covering frontend engineering, Next.js, Web3 development, and real-world projects.';
  const googleVerification = process.env.GOOGLE_SITE_VERIFICATION;

  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: title,
      template: `%s | ${siteConfig.name}`,
    },
    description,
    applicationName: siteConfig.name,
    authors: [{name: siteConfig.author, url: absoluteUrl(localizedPath(locale, '/about'))}],
    creator: siteConfig.author,
    publisher: siteConfig.author,
    alternates: {
      canonical: absoluteUrl(localizedPath(locale)),
      languages: localizedAlternates(),
    },
    icons: {
      icon: '/favicon.ico',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(localizedPath(locale)),
      siteName: siteConfig.name,
      type: 'website',
      locale: isZh ? 'zh_CN' : 'en_US',
      alternateLocale: isZh ? 'en_US' : 'zh_CN',
      images: [{url: absoluteUrl('/images/logo.png'), alt: siteConfig.name}],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [absoluteUrl('/images/logo.png')],
    },
    verification: googleVerification ? {google: googleVerification} : undefined,
  };
}

export default async function LocaleLayout({children, params}: Props) {
  const {locale} = await params;

  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);
  const messages = await getMessages();
  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteConfig.url}/#website`,
        url: siteConfig.url,
        name: siteConfig.name,
        description: siteConfig.description,
        inLanguage: ['zh-CN', 'en-US'],
      },
      {
        '@type': 'Person',
        '@id': `${siteConfig.url}/#person`,
        name: siteConfig.author,
        url: absoluteUrl(localizedPath(normalizeLocale(locale), '/about')),
      },
    ],
  };

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <Script
          src="//at.alicdn.com/t/c/font_5197184_kdha6a21c5o.js"
          strategy="beforeInteractive"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{__html: JSON.stringify(websiteJsonLd).replace(/</g, '\\u003c')}}
        />
        <Providers>
          <RouteLoadingProvider
            labels={{
              zh: zhMessages.Common.routeLoading,
              en: enMessages.Common.routeLoading,
            }}
          >
            <NextIntlClientProvider messages={messages}>
              <div className="layout">
                <Sidebar />
                <main className="content">
                  <div className="contentInner">{children}</div>
                  <Footer />
                </main>
              </div>
            </NextIntlClientProvider>
          </RouteLoadingProvider>
        </Providers>
      </body>
    </html>
  );
}
