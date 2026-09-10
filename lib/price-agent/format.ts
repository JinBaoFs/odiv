import type {AgentLocale} from '@/lib/price-agent/types';

// Significant digits preserve small prices that would otherwise display as 0.00.
export function formatMarketPrice(value: string | number, locale: AgentLocale): string {
  return new Intl.NumberFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    maximumSignificantDigits: 10,
  }).format(Number(value));
}
