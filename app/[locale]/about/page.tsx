import type {Metadata} from 'next';
import {getLocale, getTranslations} from 'next-intl/server';
import {Iconfont} from '@/components/icon-font';
import {OwlCanvas} from '@/components/owl-canvas';
import {ScrollAnchor} from '@/components/scroll-anchor';
import {ToolNav} from '@/components/tool-nav';
import {tools} from '@/config/tools';
import {SkillTreemap} from './skill-treemap';
import {createMetadata, normalizeLocale} from '@/lib/metadata';

type Props = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const locale = normalizeLocale((await params).locale);
  const t = await getTranslations({locale, namespace: 'Seo.about'});

  return createMetadata({
    title: t('title'),
    description: t('description'),
    locale,
    path: '/about',
  });
}

export default async function AboutPage() {
  const t = await getTranslations('About');
  const locale = await getLocale();

  return (
    <main className="container-wrap">
      <div className="o-title">
        <Iconfont name="icon-me" size={42} tx={-8}/>
        <h1 className="o-title-text">{t('title')}</h1>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-3 lg:items-start">
        <div className="lg:col-span-2">
          <p className="text-base leading-7 text-[var(--text-muted)]">{t('description')}</p>
          <p className="mt-4 text-base leading-7 text-[var(--text-muted)]">{t('description2')}</p>
        </div>
        <div className="flex w-full min-h-50 items-center justify-center overflow-hidden rounded-2xl">
          <OwlCanvas width={220} height={200} ariaLabel={t('owlAnimationLabel')} />
        </div>
      </div>
      <div className="o-title mt-8">
        <h2 className="o-title-text-h2">{t('skillsTitle')}</h2>
      </div>
      <SkillTreemap ariaLabel={t('skillsTitle')} ariaDescription={t('skillsChartDescription')} />
      <ScrollAnchor className="o-title mt-8" id="tool-nav" offset={32}>
        <h2 className="o-title-text-h2">{t('toolNav')}</h2>
      </ScrollAnchor>
      <ToolNav items={tools} locale={locale} />
    </main>
  );
}
