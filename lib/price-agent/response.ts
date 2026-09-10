import {isSupportedSymbol} from '@/config/price-agent';
import {AgentError, isRecord, type AgentResponse, type ErrorCode, type ToolName, type TraceEntry} from '@/lib/price-agent/types';

const codes: readonly ErrorCode[] = ['DISABLED', 'NOT_CONFIGURED', 'ACCESS_DENIED', 'INVALID_INPUT', 'BUSY',
  'MODEL_AUTH', 'MODEL_BALANCE', 'MODEL_LIMIT', 'MODEL_FAILED', 'MODEL_RESPONSE', 'MARKET_FAILED', 'MARKET_DATA',
  'INVALID_TOOL', 'INVALID_ARGUMENTS', 'MULTIPLE_MARKETS', 'LIMIT_REACHED', 'TIMEOUT', 'CANCELLED', 'NETWORK', 'UNKNOWN'];
function isCode(value: unknown): value is ErrorCode { return codes.some((code) => code === value); }
function isTool(value: unknown): value is ToolName { return value === 'getCurrentPrice' || value === 'getPriceHistory'; }
function isDate(value: unknown): value is string { return typeof value === 'string' && Number.isFinite(Date.parse(value)); }
function isPrice(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 40 && /^\d+(\.\d+)?$/.test(value)
    && Number.isFinite(Number(value)) && Number(value) > 0;
}
function isCount(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value) && value >= 0; }
function invalid(): never { throw new AgentError('MODEL_RESPONSE'); }

// The browser treats HTTP bodies as unknown, including HTML/proxy/error responses.
export function decodeAgentResponse(value: unknown): AgentResponse {
  if (!isRecord(value) || !['completed', 'partial', 'failed'].some((status) => status === value.status)
    || typeof value.answer !== 'string' || !isRecord(value.data) || !Array.isArray(value.trace)
    || !isRecord(value.usage) || !isCount(value.usage.inputTokens) || !isCount(value.usage.outputTokens)
    || !isCount(value.usage.modelCalls) || (value.error !== undefined && !isCode(value.error))) return invalid();
  const status = value.status === 'completed' ? 'completed' : value.status === 'partial' ? 'partial' : 'failed';
  const result: AgentResponse = {status, answer: value.answer, data: {}, trace: [], error: value.error,
    usage: {inputTokens: value.usage.inputTokens, outputTokens: value.usage.outputTokens, modelCalls: value.usage.modelCalls}};
  const quote = value.data.quote;
  if (quote !== undefined) {
    if (!isRecord(quote) || !isSupportedSymbol(quote.symbol) || quote.source !== 'Binance' || quote.priceType !== 'bestAsk'
      || !isPrice(quote.price) || !isDate(quote.fetchedAt)) return invalid();
    result.data.quote = {symbol: quote.symbol, source: quote.source, priceType: quote.priceType, price: quote.price, fetchedAt: quote.fetchedAt};
  }
  const history = value.data.history;
  if (history !== undefined) {
    if (!isRecord(history) || !isSupportedSymbol(history.symbol) || history.source !== 'Binance' || history.timezone !== 'UTC'
      || !isDate(history.start) || !isDate(history.end) || !isDate(history.fetchedAt)
      || Date.parse(history.end) - Date.parse(history.start) !== 7 * 86_400_000
      || !Array.isArray(history.points) || history.points.length > 7
      || !Array.isArray(history.missingDates) || history.missingDates.length > 7) return invalid();
    const points = history.points.map((point) => {
      if (!isRecord(point) || typeof point.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(point.date) || !isPrice(point.close)) return invalid();
      return {date: point.date, close: point.close};
    });
    const missingDates = history.missingDates.map((date) => {
      if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return invalid();
      return date;
    });
    result.data.history = {symbol: history.symbol, source: history.source, timezone: history.timezone,
      start: history.start, end: history.end, fetchedAt: history.fetchedAt, points, missingDates};
  }
  if (result.data.quote && result.data.history && result.data.quote.symbol !== result.data.history.symbol) return invalid();
  for (const entry of value.trace) {
    if (!isRecord(entry) || !isCount(entry.durationMs) || (entry.status !== 'success' && entry.status !== 'failed')
      || (entry.symbol !== undefined && !isSupportedSymbol(entry.symbol))
      || (entry.tool !== undefined && !isTool(entry.tool)) || (entry.error !== undefined && !isCode(entry.error))) return invalid();
    let step: TraceEntry['step'];
    switch (entry.step) {
      case 'model': case 'validate': case 'tool': case 'answer': step = entry.step; break;
      default: return invalid();
    }
    result.trace.push({step, status: entry.status, durationMs: entry.durationMs, tool: entry.tool, symbol: entry.symbol, error: entry.error});
  }
  return result;
}
