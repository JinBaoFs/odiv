'use client';

import {useEffect, useRef, useState, type FormEvent} from 'react';
import {useTranslations} from 'next-intl';
import {ArrowUpRight, Check, CircleAlert, LoaderCircle, Search, Square, TrendingUp} from 'lucide-react';
import {getMarket, marketLabel, priceUnit, supportedMarkets, type SupportedSymbol} from '@/config/price-agent';
import {formatMarketPrice} from '@/lib/price-agent/format';
import type {AgentLocale, AgentResponse, ErrorCode} from '@/lib/price-agent/types';
import {decodeAgentResponse} from '@/lib/price-agent/response';
import {PriceChart} from './price-chart';

type Props = {locale: AgentLocale; unavailable?: ErrorCode};

export function PriceAgentClient({locale, unavailable}: Props) {
  const t = useTranslations('priceAgent');
  const [message, setMessage] = useState('');
  const [exampleMarket, setExampleMarket] = useState<SupportedSymbol>(supportedMarkets[0].symbol);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<AgentResponse | null>(null);
  const [error, setError] = useState<ErrorCode | null>(null);
  const controller = useRef<AbortController | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const resultElement = useRef<HTMLDivElement>(null);
  useEffect(() => () => { controller.current?.abort(); }, []);

  const number = (value: string) => formatMarketPrice(value, locale);
  const quoteMarket = result?.data.quote ? getMarket(result.data.quote.symbol) : undefined;
  const historyMarket = result?.data.history ? getMarket(result.data.history.symbol) : undefined;
  const time = (value: string) => new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    dateStyle: 'medium', timeStyle: 'medium', timeZone: 'UTC',
  }).format(new Date(value));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (controller.current || !message.trim() || unavailable) return;
    const active = new AbortController();
    controller.current = active;
    setRunning(true); setError(null); setResult(null);
    const timeout = window.setTimeout(() => active.abort('timeout'), 55_000);
    try {
      const response = await fetch('/api/price-agent', {
        method: 'POST', headers: {'Content-Type': 'application/json'}, signal: active.signal,
        body: JSON.stringify({message: message.trim(), locale}),
      });
      const data: unknown = await response.json();
      const decoded = decodeAgentResponse(data);
      if (controller.current !== active) return;
      setResult(decoded);
      if (decoded.error) setError(decoded.error);
      requestAnimationFrame(() => resultElement.current?.focus());
    } catch {
      if (controller.current !== active) return;
      setError(active.signal.aborted ? active.signal.reason === 'timeout' ? 'TIMEOUT' : 'CANCELLED' : 'NETWORK');
    } finally {
      window.clearTimeout(timeout);
      if (controller.current === active) { controller.current = null; setRunning(false); }
    }
  }

  return (
    <>
      <div className="pa-layout">
        <section className="pa-panel pa-composer" aria-labelledby="pa-input-title">
          <div className="pa-section-title"><Search size={18} aria-hidden="true" /><h2 id="pa-input-title">{t('askTitle')}</h2></div>
          <div className="pa-market-options" role="group" aria-labelledby="pa-example-label">
            {supportedMarkets.map((market) => <button key={market.symbol} type="button" disabled={running}
              aria-pressed={exampleMarket === market.symbol} onClick={() => setExampleMarket(market.symbol)}>
              {market.baseAsset}
            </button>)}
          </div>
          <div className="pa-suggestions">
            {(['currentPrompt', 'historyPrompt'] as const).map((key) => (
              <button key={key} type="button" disabled={running} onClick={() => { setMessage(t(key, {coin: getMarket(exampleMarket).baseAsset})); input.current?.focus(); }}>
                {t(key, {coin: getMarket(exampleMarket).baseAsset})}<ArrowUpRight size={14} aria-hidden="true" />
              </button>
            ))}
          </div>
          <form onSubmit={submit}>
            <textarea ref={input} id="pa-question" value={message} onChange={(event) => setMessage(event.target.value)}
              placeholder={t('placeholder')} maxLength={500} rows={4} disabled={running} required aria-describedby="pa-input-help" />
            <div className="pa-input-meta"><span id="pa-input-help">{t('singleTurn')}</span><span>{message.length} / 500</span></div>
            {unavailable && <p className="pa-notice" role="status"><CircleAlert size={17} aria-hidden="true" />{t(`errors.${unavailable}`)}</p>}
            <div className="pa-actions">
              <button type="submit" className="pa-primary" disabled={running || !message.trim() || Boolean(unavailable)}>
                {running ? <LoaderCircle className="pa-spin" size={17} aria-hidden="true" /> : <Search size={17} aria-hidden="true" />}
                {running ? t('running') : t('send')}
              </button>
              {running && <button type="button" onClick={() => controller.current?.abort()}><Square size={14} aria-hidden="true" />{t('cancel')}</button>}
            </div>
          </form>
          <p className="pa-footnote">{t('costNote')}</p>
        </section>

        <aside className="pa-panel pa-scope">
          <div className="pa-section-title"><TrendingUp size={18} aria-hidden="true" /><h2>{t('scopeTitle')}</h2></div>
          <p>{t('scopeDescription', {coins: supportedMarkets.map((market) => market.baseAsset).join(locale === 'zh' ? '、' : ', ')})}</p>
          <dl><div><dt>{t('marketLabel')}</dt><dd>{supportedMarkets.map((market) => marketLabel(market.symbol)).join(' · ')}</dd></div>
            <div><dt>{t('sourceLabel')}</dt><dd>Binance</dd></div>
            <div><dt>{t('historyConvention')}</dt><dd>{t('historyDays')}</dd></div></dl>
          <p className="pa-footnote">{t('scopeNote')}</p>
        </aside>
      </div>

      <div ref={resultElement} tabIndex={-1} className="pa-results" aria-busy={running}>
        <div aria-live="polite" role="status">
          {running && <p className="pa-notice"><LoaderCircle className="pa-spin" size={17} aria-hidden="true" />{t('waiting')}</p>}
          {error && <p className="pa-notice"><CircleAlert size={17} aria-hidden="true" />{t(`errors.${error}`)}</p>}
        </div>
        {result && <>
          <div className="pa-result-title"><h2>{t('resultTitle')}</h2><span className="pa-badge">{t(`statuses.${result.status}`)}</span></div>
          {result.data.quote && quoteMarket && <section className="pa-panel pa-quote">
            <span className="pa-label">{t('quoteTitle', {market: marketLabel(quoteMarket.symbol)})}</span>
            <div className="pa-price">{number(result.data.quote.price)}<span>{priceUnit(quoteMarket.symbol)}</span></div>
            <p>{t('quoteNote')}</p><p className="pa-footnote">Binance · {t('fetchedAt')}: {time(result.data.quote.fetchedAt)} UTC</p>
          </section>}
          {result.data.history && historyMarket && <section className="pa-panel pa-history">
            <h3>{t('historyTitle', {coin: historyMarket.baseAsset})}</h3><p className="pa-footnote">{t('range', {
              start: result.data.history.start.slice(0, 10),
              end: new Date(Date.parse(result.data.history.end) - 86_400_000).toISOString().slice(0, 10),
              unit: priceUnit(historyMarket.symbol),
            })}</p>
            {result.data.history.missingDates.length > 0 && <p className="pa-notice">{t('missingDates', {dates: result.data.history.missingDates.join(', ')})}</p>}
            {result.data.history.points.length > 0 && <PriceChart history={result.data.history} locale={locale} />}
            <details><summary>{t('viewData')}</summary><div className="pa-table-wrap"><table>
              <caption className="pa-label">{t('historyTitle', {coin: historyMarket.baseAsset})}</caption>
              <thead><tr><th scope="col">{t('dateLabel')}</th><th scope="col">{t('closeLabel', {unit: priceUnit(historyMarket.symbol)})}</th></tr></thead>
              <tbody>{result.data.history.points.map((point) => <tr key={point.date}><td>{point.date}</td><td>{number(point.close)}</td></tr>)}</tbody>
            </table></div></details>
            <p className="pa-footnote">Binance · {t('fetchedAt')}: {time(result.data.history.fetchedAt)} UTC</p>
          </section>}
          {result.answer && <section className="pa-panel pa-answer"><h3>{t('answerTitle')}</h3><p className="mt-2">{result.answer}</p></section>}
          {result.trace.length > 0 && <details className="pa-panel pa-trace" open>
            <summary>{t('traceTitle')}</summary><p className="pa-footnote">{t('traceNote')}</p>
            <ol>{result.trace.map((entry, index) => <li key={index}>
              {entry.status === 'success' ? <Check size={16} aria-hidden="true" /> : <CircleAlert size={16} aria-hidden="true" />}
              <span>{t(`steps.${entry.step}`)}{entry.tool && <> · <code>{entry.tool}</code></>}
                {entry.symbol && <> · {marketLabel(entry.symbol)}</>}
                {entry.error && <small>{t(`errors.${entry.error}`)}</small>}</span>
              <span className="pa-duration">{entry.durationMs} ms</span>
            </li>)}</ol>
            <p className="pa-footnote">{t('usage', {calls: result.usage.modelCalls, input: result.usage.inputTokens, output: result.usage.outputTokens})}</p>
          </details>}
        </>}
      </div>
    </>
  );
}
