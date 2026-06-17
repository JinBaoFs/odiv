import {NotebookText, StickyNote, Wrench, SquareUserRound} from 'lucide-react';
import {getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import {siteConfig} from '@/config/site';
import {LocaleSwitcher} from './locale-switcher';
import {ThemeToggle} from './theme-toggle';
import Image from 'next/image';

const icons = {
  articles: NotebookText,
  notes: StickyNote,
  projects: Wrench,
  about: SquareUserRound
};

export async function Sidebar() {
  const t = await getTranslations('Sidebar');

  return (
    <aside className="sidebar">
      <div className="sidebarHeader">
        <div className="sidebarBrand">
          <Image
            src="/images/logo.png"  // 注意这里是以 / 开头
            alt="Hero illustration"
            width={48}
            height={48}
            priority
          />
          <span className="siteNameText">{siteConfig.name}</span>
        </div>
        <div className="toolbar">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </div>

      <div className="sidebarSection">
        <p className="sectionLabel">{t('aboutLabel')}</p>
        <p className="sectionBody">{t('bio')}</p>
      </div>

      <nav className="navList" aria-label="Primary navigation">
        {siteConfig.nav.map((item) => {
          const Icon = icons[item.key as keyof typeof icons];
          return (
            <Link key={item.key} href={item.href} className="navItem">
              <Icon size={16} />
              <span>{t(`nav.${item.key}`)}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebarSection">
        <p className="sectionLabel">{t('connectLabel')}</p>
        <div className="connectList">
          <a href={siteConfig.social.email} className="connectLink">{t('connect.email')}</a>
          <a href={siteConfig.social.bluesky} target="_blank" rel="noreferrer" className="connectLink">{t('connect.bluesky')}</a>
          <a href={siteConfig.social.rss} className="connectLink">{t('connect.rss')}</a>
        </div>
      </div>
    </aside>
  );
}
