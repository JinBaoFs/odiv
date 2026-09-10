import {isSupportedSymbol, supportedSymbols} from '@/config/price-agent';
import {getCurrentPrice, getPriceHistory} from '@/lib/price-agent/market';
import {AgentError, isRecord, type AgentData, type ToolCall, type ValidatedTool} from '@/lib/price-agent/types';

export const toolDefinitions = [
  {
    type: 'function',
    function: {
      name: 'getCurrentPrice',
      description: 'Read the current Binance spot best ask for the requested supported symbol (reference buying price). Returns the exact symbol, source, and retrieval time.',
      parameters: {type: 'object', properties: {symbol: {type: 'string', enum: supportedSymbols}},
        required: ['symbol'], additionalProperties: false},
    },
  },
  {
    type: 'function',
    function: {
      name: 'getPriceHistory',
      description: 'Read daily closing prices for the requested supported symbol over the last seven complete UTC days, excluding today. Missing dates are explicitly reported.',
      parameters: {type: 'object', properties: {symbol: {type: 'string', enum: supportedSymbols}, days: {type: 'integer', enum: [7]}},
        required: ['symbol', 'days'], additionalProperties: false},
    },
  },
];

export function validateTool(call: ToolCall): ValidatedTool {
  const name = call.function.name;
  if (name !== 'getCurrentPrice' && name !== 'getPriceHistory') throw new AgentError('INVALID_TOOL');
  let args: unknown;
  try { args = JSON.parse(call.function.arguments); }
  catch { throw new AgentError('INVALID_ARGUMENTS'); }
  if (!isRecord(args) || !isSupportedSymbol(args.symbol)) throw new AgentError('INVALID_ARGUMENTS');
  const allowed = name === 'getPriceHistory' ? ['symbol', 'days'] : ['symbol'];
  if (Object.keys(args).some((key) => !allowed.includes(key))
    || (name === 'getPriceHistory' && args.days !== 7)) throw new AgentError('INVALID_ARGUMENTS');
  return name === 'getCurrentPrice'
    ? {name, arguments: {symbol: args.symbol}}
    : {name, arguments: {symbol: args.symbol, days: 7}};
}

export async function executeTool(tool: ValidatedTool, baseUrl: string, now: Date, signal: AbortSignal): Promise<AgentData> {
  return tool.name === 'getCurrentPrice'
    ? {quote: await getCurrentPrice(tool.arguments.symbol, baseUrl, signal)}
    : {history: await getPriceHistory(tool.arguments.symbol, baseUrl, now, signal)};
}
