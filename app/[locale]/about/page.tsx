import {getTranslations} from 'next-intl/server';
import { Iconfont } from '@/components/icon-font';
export default async function AboutPage() {
  const t = await getTranslations('About');

  return (
    <main className="container">
      <div className="o-title">
        <Iconfont name="icon-me" size={42} tx={-8}/>
        <h1 className="o-title-text">{t('title')}</h1>
      </div>
      <div className="flex gap-3 items-center">
        <div className=""></div>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-3 lg:items-start">
        <div className="lg:col-span-2">
          <p className="text-base leading-7 text-[var(--text-muted)]">
            {t('description')}
          </p>
          <p className="mt-4 text-base leading-7 text-[var(--text-muted)]">
            {t('description2')}
          </p>
        </div>
        <div className="w-full min-h-50 bg-[var(--background-02)] rounded-2xl">
        </div>
      </div>
      <div className="o-title mt-8">
        <h2 className="o-title-text-h2">{t("toolNav")}</h2>
      </div>
    </main>
  );
}
