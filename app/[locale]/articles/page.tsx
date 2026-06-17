import {getTranslations} from 'next-intl/server';

export default async function ArticlesPage() {
  const t = await getTranslations('Articles');

  return (
    <section className="panel">
      <span className="eyebrow">{t('eyebrow')}</span>
      <h2>{t('title')}</h2>
      <p>{t('description')}</p>
    </section>
  );
}
