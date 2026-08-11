import {getTranslations} from 'next-intl/server';
import {Iconfont} from '@/components/icon-font';
import {OwlCanvas} from '@/components/owl-canvas';
import {ProjectList} from '@/components/project-list';
import {projects} from '@/config/projects';
import './page.scss';

export default async function ProjectsPage() {
  const t = await getTranslations('Projects');

  return (
    <main className="container-wrap">
      <div className="o-title">
        <Iconfont name="icon-project" size={42} tx={-8} />
        <h1 className="o-title-text">{t('title')}</h1>
      </div>
      <div className="o-desc mt-2" dangerouslySetInnerHTML={{__html: t('description')}} />
      <div className="projects-owl">
        <OwlCanvas width={220} height={190} ariaLabel={t('owlAnimationLabel')} />
      </div>
      <section className="mt-5" aria-label={t('title')}>
        <ProjectList
          projects={projects}
          getDescription={(id) => t(`items.${id}.description`)}
          getActionLabel={(label) => t(label)}
        />
      </section>
    </main>
  );
}
