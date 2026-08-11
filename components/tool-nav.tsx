import {Link} from '@/i18n/navigation';
import type {ToolItem, ToolLocale} from '@/config/tools';
import styles from './tool-nav.module.scss';

type ToolNavProps = {
  items: ToolItem[];
  locale: string;
};

export function ToolNav({items, locale}: ToolNavProps) {
  const language: ToolLocale = locale === 'en' ? 'en' : 'zh';

  return (
    <ul className={styles.grid}>
      {items.map((item) => {
        const title = item.title[language];

        return (
          <li key={item.id} className={styles.item}>
            <Link
              className={styles.card}
              href={item.linkUrl}
              target={item.openInNewTab ? '_blank' : undefined}
              rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
              aria-label={item.openInNewTab ? `${title} (${language === 'zh' ? '在新标签页打开' : 'opens in a new tab'})` : title}
            >
              <span className={styles.logoWrap} aria-hidden="true">
                <span className={styles.logoFallback}>{title.slice(0, 1).toUpperCase()}</span>
                <img
                  className={styles.logo}
                  src={item.logoUrl}
                  alt=""
                  width={40}
                  height={40}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </span>
              <span className={styles.content}>
                <span className={styles.title}>{title}</span>
                <span className={styles.description}>{item.description[language]}</span>
              </span>
              <span className={styles.externalIcon} aria-hidden="true">↗</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
