// Shared by tool schemas, server validation, prompts, and result presentation.
export const supportedMarkets = [
  {symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT', aliases: ['BTC', 'Bitcoin', '比特币']},
  {symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT', aliases: ['ETH', 'Ethereum', '以太坊', '以太币']},
  {symbol: 'SOLUSDT', baseAsset: 'SOL', quoteAsset: 'USDT', aliases: ['SOL', 'Solana', '索拉纳']},
] as const;

export type SupportedSymbol = (typeof supportedMarkets)[number]['symbol'];
export const supportedSymbols = supportedMarkets.map((market) => market.symbol);

export function isSupportedSymbol(value: unknown): value is SupportedSymbol {
  return supportedMarkets.some((market) => market.symbol === value);
}

export function getMarket(symbol: SupportedSymbol) {
  const market = supportedMarkets.find((item) => item.symbol === symbol);
  if (!market) throw new Error('Unsupported market');
  return market;
}

export function marketLabel(symbol: SupportedSymbol): string {
  const market = getMarket(symbol);
  return `${market.baseAsset} / ${market.quoteAsset}`;
}

export function priceUnit(symbol: SupportedSymbol): string {
  const market = getMarket(symbol);
  return `${market.quoteAsset} / ${market.baseAsset}`;
}
