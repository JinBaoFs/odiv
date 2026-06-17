import './globals.css';
import type {Metadata} from 'next';
import {Providers} from '@/components/providers';
import {siteConfig} from '@/config/site';
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
          src="//at.alicdn.com/t/c/font_5197184_5d01flzy6if.js"
          strategy="beforeInteractive"
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
