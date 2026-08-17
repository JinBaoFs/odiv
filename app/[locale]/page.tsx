import type {Metadata} from 'next';
import {getLocale, getTranslations} from 'next-intl/server';
import {Iconfont} from '@/components/icon-font';
import {OwlCanvas} from '@/components/owl-canvas';
import {ProjectList} from '@/components/project-list';
import {ToolNav} from '@/components/tool-nav';
import {projects} from '@/config/projects';
import {siteConfig} from '@/config/site';
import {tools} from '@/config/tools';
import {Link} from '@/i18n/navigation';
import {formatPostDate} from '@/lib/date';
import {listMdxPosts, type Locale} from '@/lib/mdx-posts';
import {createMetadata, normalizeLocale} from '@/lib/metadata';
import styles from './home.module.scss';

type Props = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const locale = normalizeLocale((await params).locale);
  const t = await getTranslations({locale, namespace: 'Seo.home'});

  return createMetadata({
    title: t('title'),
    description: t('description'),
    locale,
  });
}

function byHomeOrder<T extends {homeOrder?: number}>(a: T, b: T) {
  return (a.homeOrder ?? Number.MAX_SAFE_INTEGER) - (b.homeOrder ?? Number.MAX_SAFE_INTEGER);
}

export default async function HomePage() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('Home');
  const projectT = await getTranslations('Projects');
  const posts = (await listMdxPosts(locale)).filter((post) => post.featuredOnHome).sort(byHomeOrder).slice(0, 6);
  const featuredProjects = projects.filter((project) => project.featuredOnHome).sort(byHomeOrder).slice(0, 6);
  const featuredTools = tools.filter((tool) => tool.featuredOnHome).sort(byHomeOrder).slice(0, 6);

  return (
    <main className={styles.home}>
      <section className={styles.hero} aria-labelledby="home-title">
        <div className={styles.heroContent}>
          <h1 id="home-title">{t('hero.title')}</h1>
          <p>{t('hero.description')}</p>
          <p>{t('hero.secondaryDescription')}</p>
          <div className={styles.heroLinks}>
            <Link href="/about">{t('hero.about')}</Link>
            <a href={siteConfig.social.email}>{t('hero.email')}</a>
          </div>
        </div>
        <div className={styles.owlWrap}>
          <OwlCanvas width={280} height={240} ariaLabel={t('hero.owlAnimationLabel')} />
        </div>
      </section>

      <section className={styles.section} aria-labelledby="home-posts-title">
        <div className={styles.sectionHeading}>
          <div>
            <div className={styles.titleLine}><Iconfont name="icon-blog" size={42} /><h2 id="home-posts-title">{t('posts.title')}</h2></div>
            <p>{t('posts.description')}</p>
          </div>
          <Link className={styles.moreLink} href="/blog">{t('common.viewAll')}</Link>
        </div>
        <ul className={styles.postList}>
          {posts.map((post) => (
            <li key={post.slug}>
              <time dateTime={post.date}>{formatPostDate(post.date, locale)}</time>
              <Link href={`/blog/${post.slug}`}>{post.title}</Link>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="home-projects-title">
        <div className={styles.sectionHeading}>
          <div>
            <div className={styles.titleLine}><Iconfont name="icon-project" size={42} /><h2 id="home-projects-title">{t('projects.title')}</h2></div>
            <p>{t('projects.description')}</p>
          </div>
          <Link className={styles.moreLink} href="/projects">{t('common.viewAll')}</Link>
        </div>
        <ProjectList
          projects={featuredProjects}
          getDescription={(id) => projectT(`items.${id}.description`)}
          getActionLabel={(label) => projectT(label)}
        />
      </section>

      <section className={styles.section} aria-labelledby="home-tools-title">
        <div className={styles.sectionHeading}>
          <div>
            <div className={styles.titleLine}><span className={styles.spark} aria-hidden="true">✦</span><h2 id="home-tools-title">{t('explore.title')}</h2></div>
            <p>{t('explore.description')}</p>
          </div>
          <Link className={styles.moreLink} href="/about#tool-nav" scroll={false}>{t('common.viewAll')}</Link>
        </div>
        <ToolNav items={featuredTools} locale={locale} />
      </section>
    </main>
  );
}
