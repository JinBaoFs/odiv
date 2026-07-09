'use client';

import { usePathname, Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { siteConfig } from '@/config/site';
import { Iconfont } from './icon-font';

export function NavList() {
  const pathname = usePathname();
  const t = useTranslations('Sidebar');

  return (
    <nav className="navList" aria-label="Primary navigation">
      {siteConfig.nav.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
        return (
          <Link
            key={item.key}
            href={item.href}
            className={`navItem${isActive ? ' active' : ''}`}
          >
            <Iconfont name={item.iconName} size={20} />
            <span>{t(`nav.${item.key}`)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
