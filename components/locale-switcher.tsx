'use client';

import {useLocale, useTranslations} from 'next-intl';
import {usePathname, useRouter} from '@/i18n/navigation';
import {Dropdown} from './dropdown';
import {Globe} from 'lucide-react';

export function LocaleSwitcher() {
  const t = useTranslations('Common');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const localeOptions = [
    {value: 'zh', label: 'CN'},
    {value: 'en', label: 'EN'}
  ];

  return (
    <Dropdown
      value={locale}
      onChange={(newLocale) => router.replace(pathname, {locale: newLocale})}
      options={localeOptions}
      label={t('language')}
      variant="compact"
      icon={<Globe size={20} />}
      showChevron={false}
    />
  );
}
