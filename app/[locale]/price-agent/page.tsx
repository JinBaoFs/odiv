import type {Metadata} from 'next';
import {getTranslations} from 'next-intl/server';
import {createMetadata, normalizeLocale} from '@/lib/metadata';
import {getConfig} from '@/lib/price-agent/config';
import {errorCode, type ErrorCode} from '@/lib/price-agent/types';
import {PriceAgentClient} from './price-agent-client';
import {Iconfont} from '@/components/icon-font';
import './page.scss';

// Read deployment configuration at request time; no secrets are serialized into the page.
export const dynamic = 'force-dynamic';

type Props = {params: Promise<{locale: string}>};
export async function generateMetadata({params}: Props): Promise<Metadata> {
  const locale = normalizeLocale((await params).locale);
  const t = await getTranslations({locale, namespace: 'Seo.priceAgent'});
  return createMetadata({title: t('title'), description: t('description'), locale, path: '/price-agent'});
}

export default async function PriceAgentPage({params}: Props) {
  const locale = normalizeLocale((await params).locale);
  const t = await getTranslations({locale, namespace: 'priceAgent'});
  let unavailable: ErrorCode | undefined;
  try { getConfig(); } catch (error) { unavailable = errorCode(error); }
  return (
    <div className="container-wrap price-agent">
      <header className="pa-heading">
        <div className="o-title">
          <Iconfont name="icon-project" size={48} tx={-8} />
          <h1 className="o-title-text">{t('eyebrow')}</h1>
        </div>
        <div className="o-desc mt-2" dangerouslySetInnerHTML={{__html: t('description')}} />
      </header>
      <PriceAgentClient locale={locale} unavailable={unavailable} />
    </div>
  );
}
