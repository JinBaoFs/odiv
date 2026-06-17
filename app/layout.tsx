import './globals.css';
import type {Metadata} from 'next';
import {Providers} from '@/components/providers';
import {siteConfig} from '@/config/site';

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description
};

export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return (
    <html suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
