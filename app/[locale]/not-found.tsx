import {getTranslations} from 'next-intl/server';
import {OwlCanvas} from '@/components/owl-canvas';
import {Link} from '@/i18n/navigation';
import styles from './not-found.module.scss';

export default async function NotFoundPage() {
  const t = await getTranslations('NotFound');

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="not-found-title">
        <div className={styles.visual}>
          <span className={styles.errorNumber} aria-hidden="true">404</span>
          <div className={styles.owlStage}>
            <OwlCanvas
              width={260}
              height={230}
              ariaLabel={t('owlAnimationLabel')}
            />
          </div>
        </div>

        <div className={styles.copy}>
          <p className={styles.eyebrow}>{t('eyebrow')}</p>
          <h1 id="not-found-title">{t('title')}</h1>
          <p className={styles.description}>{t('description')}</p>
          <p className={styles.errorCode}>{t('errorCode')}</p>

          <div className={styles.actions}>
            <Link className={styles.primaryAction} href="/">
              {t('homeAction')}
            </Link>
            <Link className={styles.secondaryAction} href="/blog">
              {t('blogAction')}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
