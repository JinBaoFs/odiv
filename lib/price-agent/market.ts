import type {SupportedSymbol} from '@/config/price-agent';
import {limits} from '@/lib/price-agent/config';
import {readJson} from '@/lib/price-agent/http';
import {AgentError, isRecord, type PriceHistory, type Quote} from '@/lib/price-agent/types';

const DAY_MS = 86_400_000;
export function previousSevenDays(now: Date) {
  const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const start = end - 7 * DAY_MS;
  const dates = Array.from({length: 7}, (_, i) => new Date(start + i * DAY_MS).toISOString().slice(0, 10));
  return {start, end, dates};
}

function validPrice(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 40 && /^\d+(\.\d+)?$/.test(value)
    && Number.isFinite(Number(value)) && Number(value) > 0;
}

async function requestMarket(baseUrl: string, path: string, signal: AbortSignal): Promise<unknown> {
  const timedSignal = AbortSignal.any([signal, AbortSignal.timeout(limits.marketTimeoutMs)]);
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      signal: timedSignal, cache: 'no-store', redirect: 'error',
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw new AgentError('MARKET_FAILED');
    }
    try { return await readJson(response); }
    catch (error) {
      if (timedSignal.aborted) throw timedSignal.reason;
      throw new AgentError(error instanceof AgentError ? 'MARKET_DATA' : 'MARKET_FAILED');
    }
  } catch (error) {
    if (timedSignal.aborted) throw timedSignal.reason;
    if (error instanceof AgentError) throw error;
    throw new AgentError('MARKET_FAILED');
  }
}

export async function getCurrentPrice(symbol: SupportedSymbol, baseUrl: string, signal: AbortSignal): Promise<Quote> {
  const params = new URLSearchParams({symbol});
  const data = await requestMarket(baseUrl, `/api/v3/ticker/bookTicker?${params}`, signal);
  if (!isRecord(data) || data.symbol !== symbol || !validPrice(data.askPrice)) {
    throw new AgentError('MARKET_DATA');
  }
  return {symbol, price: data.askPrice, priceType: 'bestAsk', source: 'Binance', fetchedAt: new Date().toISOString()};
}

export function parseHistory(symbol: SupportedSymbol, data: unknown, now: Date): PriceHistory {
  if (!Array.isArray(data) || data.length > 7) throw new AgentError('MARKET_DATA');
  const {start, end, dates} = previousSevenDays(now);
  const prices = new Map<string, string>();
  for (const row of data) {
    if (!Array.isArray(row) || !Number.isSafeInteger(row[0]) || !Number.isSafeInteger(row[6])
      || row[0] < start || row[0] >= end || row[0] % DAY_MS !== 0
      || row[6] !== row[0] + DAY_MS - 1 || !validPrice(row[4])) {
      throw new AgentError('MARKET_DATA');
    }
    const date = new Date(row[0]).toISOString().slice(0, 10);
    if (prices.has(date)) throw new AgentError('MARKET_DATA');
    prices.set(date, row[4]);
  }
  return {
    symbol, source: 'Binance', timezone: 'UTC',
    start: new Date(start).toISOString(), end: new Date(end).toISOString(),
    fetchedAt: new Date().toISOString(),
    points: dates.flatMap((date) => {
      const close = prices.get(date);
      return close === undefined ? [] : [{date, close}];
    }),
    missingDates: dates.filter((date) => !prices.has(date)),
  };
}

export async function getPriceHistory(symbol: SupportedSymbol, baseUrl: string, now: Date, signal: AbortSignal): Promise<PriceHistory> {
  const {start, end} = previousSevenDays(now);
  const params = new URLSearchParams({symbol, interval: '1d', timeZone: '0',
    startTime: String(start), endTime: String(end - 1), limit: '7'});
  const data = await requestMarket(baseUrl, `/api/v3/klines?${params}`, signal);
  return parseHistory(symbol, data, now);
}
