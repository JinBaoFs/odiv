import {getTranslations} from 'next-intl/server';
import {Iconfont} from '@/components/icon-font';
import {ImageCompressorClient} from './image-compressor-client';
import './page.scss';

export default async function ImageCompressorPage() {
  const t = await getTranslations('imageCompressor');

  return (
    <div className="container-wrap">
      <div className="o-title">
        <Iconfont name="icon-project" size={42} tx={-8} />
        <h1 className="o-title-text">{t('title')}</h1>
      </div>
      <div className="o-desc mt-2">{t('description')}</div>
      <ImageCompressorClient />
    </div>
  );
}
