import {permanentRedirect} from 'next/navigation';
import {localizedPath, normalizeLocale} from '@/lib/metadata';

type Props = {params: Promise<{locale: string}>};

export default async function ArticlesPage({params}: Props) {
  const locale = normalizeLocale((await params).locale);

  permanentRedirect(localizedPath(locale, '/blog'));
}
