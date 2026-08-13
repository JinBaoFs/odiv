import './globals.css';
import "highlight.js/styles/atom-one-dark.css"
import type {Metadata} from 'next';
import {Providers} from '@/components/providers';
import {siteConfig} from '@/config/site';
import {RouteLoadingProvider} from '@/components/route-loading-provider';
import zhMessages from '@/messages/zh.json';
import enMessages from '@/messages/en.json';
import Script from 'next/script'; // 新增

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description
};

export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return (
    <html suppressHydrationWarning>
      <body>
        <Script
          src="//at.alicdn.com/t/c/font_5197184_kdha6a21c5o.js"
          strategy="beforeInteractive"
        />
        <Providers>
          <RouteLoadingProvider
            labels={{
              zh: zhMessages.Common.routeLoading,
              en: enMessages.Common.routeLoading
            }}
          >
            {children}
          </RouteLoadingProvider>
        </Providers>
      </body>
    </html>
  );
}
