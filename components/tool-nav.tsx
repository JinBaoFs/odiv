import styles from "./tool-nav.module.scss";

export type ToolNavLocale = "zh" | "en";

export type ToolNavItem = {
  title: Record<ToolNavLocale, string>;
  description: Record<ToolNavLocale, string>;
  logoUrl: string;
  linkUrl: string;
};

type ToolNavProps = {
  items: ToolNavItem[];
  locale: string;
};

export function ToolNav({items, locale}: ToolNavProps) {
  const language: ToolNavLocale = locale === "en" ? "en" : "zh";

  return (
    <ul className={styles.grid}>
      {items.map((item) => {
        const title = item.title[language];

        return (
          <li key={item.linkUrl} className={styles.item}>
            <a
              className={styles.card}
              href={item.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${title} (${language === "zh" ? "在新标签页打开" : "opens in a new tab"})`}
            >
              <span className={styles.logoWrap} aria-hidden="true">
                <span className={styles.logoFallback}>
                  {title.slice(0, 1).toUpperCase()}
                </span>
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
                <span className={styles.description}>
                  {item.description[language]}
                </span>
              </span>
              <span className={styles.externalIcon} aria-hidden="true">
                ↗
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

