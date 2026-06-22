import {getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import {siteConfig} from '@/config/site';
import {LocaleSwitcher} from './locale-switcher';
import {ThemeToggle} from './theme-toggle';
import { Iconfont } from './icon-font';
import Image from 'next/image';
import { MobileNavProvider, MobileNavToggle, MobileNavContent } from './mobile-nav';

export async function Sidebar() {
  const t = await getTranslations('Sidebar');

  return (
    <MobileNavProvider>
      <aside className="sidebar">
        <div className="sidebarHeader">
          <Link href="/" className="sidebarBrand">
            <Image
              src="/images/logo.png"  // 注意这里是以 / 开头
              alt="Hero illustration"
              width={48}
              height={48}
              priority
            />
            <span className="siteNameText">{siteConfig.name}</span>
          </Link>
          <div className="toolbar">
            <LocaleSwitcher />
            <ThemeToggle />
            <MobileNavToggle />
          </div>
        </div>

        <MobileNavContent>
          <div className="sidebarSection">
            <p className="sectionLabel">{t('aboutLabel')}</p>
            <p className="sectionBody">{t('bio')}</p>
          </div>

          <nav className="navList" aria-label="Primary navigation">
            {siteConfig.nav.map((item) => {
              return (
                <Link key={item.key} href={item.href} className="navItem">
                  <Iconfont name={item.iconName} size={20} />
                  <span>{t(`nav.${item.key}`)}</span>
                </Link>
              );
            })}
          </nav>
        </MobileNavContent>
      </aside>
    </MobileNavProvider>
  );
}
