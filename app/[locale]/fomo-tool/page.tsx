import type {Metadata} from 'next';
import {getTranslations} from 'next-intl/server';
import {FomoToolClient} from './fomo-tool-client';
import { Iconfont } from '@/components/icon-font';
import {createMetadata, normalizeLocale} from '@/lib/metadata';
import "./page.scss"

type Props = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const locale = normalizeLocale((await params).locale);
  const t = await getTranslations({locale, namespace: 'Seo.fomoTool'});

  return createMetadata({
    title: t('title'),
    description: t('description'),
    locale,
    path: '/fomo-tool',
  });
}

export default async function FomoToolPage() {
  const t = await getTranslations('fomoTool');

  return (
    <div className="container-wrap">
      <div className="o-title">
        <Iconfont name="icon-project" size={42} tx={-8}/>
        <h1 className="o-title-text">{t('title')}</h1>
      </div>
      <div
        className="o-desc mt-2"
        dangerouslySetInnerHTML={{__html: t('description')}}
      />
      <FomoToolClient />
    </div>
  );
}
