import type {SupportedSymbol} from '@/config/price-agent';

export type AgentLocale = 'zh' | 'en';
export type ToolName = 'getCurrentPrice' | 'getPriceHistory';
export type ErrorCode =
  | 'DISABLED' | 'NOT_CONFIGURED' | 'ACCESS_DENIED' | 'INVALID_INPUT'
  | 'BUSY' | 'MODEL_AUTH' | 'MODEL_BALANCE' | 'MODEL_LIMIT'
  | 'MODEL_FAILED' | 'MODEL_RESPONSE' | 'MARKET_FAILED' | 'MARKET_DATA'
  | 'INVALID_TOOL' | 'INVALID_ARGUMENTS' | 'MULTIPLE_MARKETS' | 'LIMIT_REACHED'
  | 'TIMEOUT' | 'CANCELLED' | 'NETWORK' | 'UNKNOWN';

export type Quote = {
  symbol: SupportedSymbol;
  price: string;
  priceType: 'bestAsk';
  source: 'Binance';
  fetchedAt: string;
};

export type PriceHistory = {
  symbol: SupportedSymbol;
  source: 'Binance';
  timezone: 'UTC';
  start: string;
  end: string;
  fetchedAt: string;
  points: {date: string; close: string}[];
  missingDates: string[];
};

export type AgentData = {quote?: Quote; history?: PriceHistory};
export type TraceEntry = {
  step: 'model' | 'validate' | 'tool' | 'answer';
  status: 'success' | 'failed';
  tool?: ToolName;
  symbol?: SupportedSymbol;
  durationMs: number;
  error?: ErrorCode;
};

export type AgentResponse = {
  status: 'completed' | 'partial' | 'failed';
  answer: string;
  data: AgentData;
  trace: TraceEntry[];
  error?: ErrorCode;
  usage: {inputTokens: number; outputTokens: number; modelCalls: number};
};

export type ToolCall = {
  id: string;
  type: 'function';
  function: {name: string; arguments: string};
};
export type ValidatedTool =
  | {name: 'getCurrentPrice'; arguments: {symbol: SupportedSymbol}}
  | {name: 'getPriceHistory'; arguments: {symbol: SupportedSymbol; days: 7}};
export type AssistantMessage = {
  role: 'assistant';
  content: string | null;
  tool_calls?: ToolCall[];
};
export type ModelMessage =
  | {role: 'system' | 'user'; content: string}
  | AssistantMessage
  | {role: 'tool'; tool_call_id: string; content: string};
export type ModelResult = {
  message: AssistantMessage;
  usage: {inputTokens: number; outputTokens: number};
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export class AgentError extends Error {
  readonly code: ErrorCode;
  constructor(code: ErrorCode) {
    super(code);
    this.name = 'AgentError';
    this.code = code;
  }
}

export function errorCode(error: unknown, signal?: AbortSignal): ErrorCode {
  if (signal?.aborted) {
    return signal.reason instanceof DOMException && signal.reason.name === 'TimeoutError'
      ? 'TIMEOUT' : 'CANCELLED';
  }
  if (error instanceof AgentError) return error.code;
  if (error instanceof DOMException && error.name === 'TimeoutError') return 'TIMEOUT';
  if (error instanceof DOMException && error.name === 'AbortError') return 'CANCELLED';
  return 'UNKNOWN';
}
