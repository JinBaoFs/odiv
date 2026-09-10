'use client';

import {useEffect, useRef} from 'react';
import {useTranslations} from 'next-intl';
import {getMarket, priceUnit} from '@/config/price-agent';
import {formatMarketPrice} from '@/lib/price-agent/format';
import type {AgentLocale, PriceHistory} from '@/lib/price-agent/types';

export function PriceChart({history, locale}: {history: PriceHistory; locale: AgentLocale}) {
  const container = useRef<HTMLDivElement>(null);
  const t = useTranslations('priceAgent');

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;
    // Only load the chart library when history is actually available.
    void import('echarts').then((echarts) => {
      if (disposed) return;
      const chart = echarts.init(element, undefined, {renderer: 'svg'});
      const dates = Array.from({length: 7}, (_, index) =>
        new Date(Date.parse(history.start) + index * 86_400_000).toISOString().slice(0, 10));
      const values = new Map(history.points.map((point) => [point.date, Number(point.close)]));
      const render = () => {
        const style = getComputedStyle(element);
        chart.setOption({
          animation: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
          color: [style.getPropertyValue('--primary').trim()],
          textStyle: {color: style.getPropertyValue('--text-muted').trim()},
          grid: {left: 12, right: 20, top: 20, bottom: 12, containLabel: true},
          tooltip: {trigger: 'axis', renderMode: 'richText'},
          xAxis: {type: 'category', data: dates, boundaryGap: false,
            axisLabel: {formatter: (value: string) => value.slice(5)},
            axisLine: {lineStyle: {color: style.getPropertyValue('--border').trim()}}},
          yAxis: {type: 'value', scale: true, axisLabel: {formatter: (value: number) => formatMarketPrice(value, locale)},
            splitLine: {lineStyle: {color: style.getPropertyValue('--border').trim()}}},
          series: [{name: priceUnit(history.symbol), type: 'line', connectNulls: false, symbolSize: 7,
            data: dates.map((date) => values.get(date) ?? null), lineStyle: {width: 3}}],
        });
      };
      render();
      const resize = new ResizeObserver(() => chart.resize());
      resize.observe(element);
      const theme = new MutationObserver(render);
      theme.observe(document.documentElement, {attributes: true, attributeFilter: ['class', 'style', 'data-palette', 'data-theme']});
      cleanup = () => { resize.disconnect(); theme.disconnect(); chart.dispose(); };
    }).catch(() => { /* The accessible data table remains available if chart loading fails. */ });
    return () => { disposed = true; cleanup?.(); };
  }, [history, locale]);

  return <div ref={container} className="pa-chart" role="img" aria-label={t('chartLabel', {coin: getMarket(history.symbol).baseAsset})} />;
}
