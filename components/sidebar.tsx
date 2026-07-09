import {getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import {siteConfig} from '@/config/site';
import {LocaleSwitcher} from './locale-switcher';
import {ThemeToggle} from './theme-toggle';
import Image from 'next/image';
import { MobileNavProvider, MobileNavToggle, MobileNavContent } from './mobile-nav';
import { NavList } from './nav-list';

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

          <NavList />
        </MobileNavContent>
      </aside>
    </MobileNavProvider>
  );
}
