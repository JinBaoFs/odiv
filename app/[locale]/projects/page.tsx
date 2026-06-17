import {getTranslations} from 'next-intl/server';

export default async function ProjectsPage() {
  const t = await getTranslations('Projects');

  return (
    <section className="panel">
      <span className="eyebrow">{t('eyebrow')}</span>
      <h2>{t('title')}</h2>
      <p>{t('description')}</p>
    </section>
  );
}
