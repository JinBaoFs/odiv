import {ArticleCard} from '@/components/article-card';
import {getTranslations} from 'next-intl/server';

export default async function HomePage() {
  const t = await getTranslations('Home');

  const posts = [0, 1, 2].map((index) => ({
    title: t(`posts.${index}.title`),
    excerpt: t(`posts.${index}.excerpt`),
    tag: t(`posts.${index}.tag`),
    date: t(`posts.${index}.date`),
    readingTime: t(`posts.${index}.readingTime`)
  }));

  return (
    <>
    </>
  );
}
