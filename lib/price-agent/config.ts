import {AgentError} from '@/lib/price-agent/types';

export const limits = {
  inputCharacters: 500,
  requestBytes: 4096,
  modelCalls: 3,
  toolCalls: 4,
  outputTokens: 800,
  taskTimeoutMs: 45_000,
  modelTimeoutMs: 20_000,
  marketTimeoutMs: 8_000,
} as const;

export type AgentConfig = {
  apiKey: string;
  model: string;
  deepseekBaseUrl: string;
  marketBaseUrl: string;
};

// Only operator-controlled HTTPS URLs; never accept provider URLs from a request/model.
function baseUrl(value: string): string {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
      throw new Error('Invalid provider URL');
    }
    return url.href.replace(/\/$/, '');
  } catch {
    throw new AgentError('NOT_CONFIGURED');
  }
}

export function getConfig(): AgentConfig {
  if (process.env.PRICE_AGENT_ENABLED !== 'true') throw new AgentError('DISABLED');
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) {
    throw new AgentError('NOT_CONFIGURED');
  }
  return {
    apiKey,
    model: process.env.DEEPSEEK_MODEL?.trim() || 'deepseek-flash',
    deepseekBaseUrl: baseUrl(process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'),
    marketBaseUrl: baseUrl(process.env.MARKET_DATA_BASE_URL || 'https://data-api.binance.vision'),
  };
}
