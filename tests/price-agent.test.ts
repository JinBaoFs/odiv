import test, {after, before} from 'node:test';
import assert from 'node:assert/strict';
import {getMarket, priceUnit, supportedMarkets} from '@/config/price-agent';
import {formatMarketPrice} from '@/lib/price-agent/format';
import {POST} from '@/app/api/price-agent/route';
import {getConfig, type AgentConfig} from '@/lib/price-agent/config';
import {callDeepSeek, parseModelResult} from '@/lib/price-agent/deepseek';
import {readJson} from '@/lib/price-agent/http';
import {getCurrentPrice, getPriceHistory, parseHistory, previousSevenDays} from '@/lib/price-agent/market';
import {decodeAgentResponse} from '@/lib/price-agent/response';
import {runAgent} from '@/lib/price-agent/runner';
import {executeTool, validateTool} from '@/lib/price-agent/tools';
import {AgentError, type ModelMessage, type ModelResult, type Quote, type ToolCall} from '@/lib/price-agent/types';

const now = new Date('2026-09-10T08:00:00Z');
const signal = () => new AbortController().signal;
const quote: Quote = {symbol: 'BTCUSDT', price: '60000.00', priceType: 'bestAsk', source: 'Binance', fetchedAt: now.toISOString()};
const config: AgentConfig = {apiKey: 'test-only-key', model: 'test-model', deepseekBaseUrl: 'https://model.invalid', marketBaseUrl: 'https://market.invalid'};
const call = (name = 'getCurrentPrice', args: Record<string, unknown> = {symbol: 'BTCUSDT'}, id = 'call_1'): ToolCall =>
  ({id, type: 'function', function: {name, arguments: JSON.stringify(args)}});
const toolResponse = (...calls: ToolCall[]): ModelResult => ({message: {role: 'assistant', content: null, tool_calls: calls}, usage: {inputTokens: 10, outputTokens: 5}});
const answer: ModelResult = {message: {role: 'assistant', content: 'A reference quote, not an executed trade.'}, usage: {inputTokens: 12, outputTokens: 8}};
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {status, headers: {'Content-Type': 'application/json'}});
const candle = (day: string, close = '60000') => {
  const start = Date.parse(`${day}T00:00:00Z`);
  return [start, '59000', '61000', '58000', close, '100', start + 86_400_000 - 1];
};
const throwsCode = (fn: () => unknown, code: string) => assert.throws(fn, (error) => error instanceof AgentError && error.code === code);

const originalFetch = globalThis.fetch;
before(() => { globalThis.fetch = async () => { throw new Error('Unexpected network request in offline test'); }; });
after(() => { globalThis.fetch = originalFetch; });

async function withFetch(mock: typeof fetch, action: () => Promise<void>) {
  const previous = globalThis.fetch;
  globalThis.fetch = mock;
  try { await action(); } finally { globalThis.fetch = previous; }
}

async function withEnv(values: Record<string, string | undefined>, action: () => Promise<void>) {
  const saved = Object.fromEntries(Object.keys(values).map((key) => [key, process.env[key]]));
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
  try { await action(); } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
}

test('seven complete UTC days exclude today and cross leap/year boundaries', () => {
  assert.deepEqual(previousSevenDays(now).dates, ['2026-09-03', '2026-09-04', '2026-09-05', '2026-09-06', '2026-09-07', '2026-09-08', '2026-09-09']);
  assert.equal(previousSevenDays(new Date('2024-03-01T00:01:00Z')).dates.at(-1), '2024-02-29');
  assert.equal(previousSevenDays(new Date('2026-01-01T12:00:00Z')).dates[0], '2025-12-25');
});

test('history sorts actual candles and preserves missing dates without inventing prices', () => {
  const data = parseHistory('BTCUSDT', [candle('2026-09-09'), candle('2026-09-03')], now);
  assert.deepEqual(data.points.map((point) => point.date), ['2026-09-03', '2026-09-09']);
  assert.equal(data.missingDates.length, 5);
  assert.equal(parseHistory('BTCUSDT', [], now).missingDates.length, 7);
  throwsCode(() => parseHistory('BTCUSDT', [candle('2026-09-10')], now), 'MARKET_DATA');
  throwsCode(() => parseHistory('BTCUSDT', [candle('2026-09-03'), candle('2026-09-03')], now), 'MARKET_DATA');
  throwsCode(() => parseHistory('BTCUSDT', [candle('2026-09-03', 'NaN')], now), 'MARKET_DATA');
});

test('market adapters request the fixed pair, use end-1, and reject malformed prices', async () => {
  await withFetch(async (url, init) => {
    assert.equal(init?.cache, 'no-store');
    assert.equal(init?.redirect, 'error');
    const parsed = new URL(String(url));
    if (parsed.pathname.endsWith('bookTicker')) return json({symbol: 'BTCUSDT', askPrice: '60000.10'});
    assert.equal(parsed.searchParams.get('endTime'), String(previousSevenDays(now).end - 1));
    assert.equal(parsed.searchParams.get('timeZone'), '0');
    return json([candle('2026-09-09')]);
  }, async () => {
    assert.equal((await getCurrentPrice('BTCUSDT', config.marketBaseUrl, signal())).price, '60000.10');
    assert.equal((await getPriceHistory('BTCUSDT', config.marketBaseUrl, now, signal())).points.length, 1);
  });
  await withFetch(async () => json({symbol: 'BTCUSDT', askPrice: '-1'}), async () => {
    await assert.rejects(getCurrentPrice('BTCUSDT', config.marketBaseUrl, signal()), {code: 'MARKET_DATA'});
  });
});

test('tool boundary rejects extra identity/URL arguments, unsupported symbols, and invalid JSON', () => {
  assert.deepEqual(validateTool(call()), {name: 'getCurrentPrice', arguments: {symbol: 'BTCUSDT'}});
  throwsCode(() => validateTool(call('submitOrder')), 'INVALID_TOOL');
  throwsCode(() => validateTool(call('getCurrentPrice', {symbol: 'XRPUSDT'})), 'INVALID_ARGUMENTS');
  throwsCode(() => validateTool({...call(), function: {name: 'getCurrentPrice', arguments: '{"symbol":"BTCUSDT","userId":"other"}'}}), 'INVALID_ARGUMENTS');
  throwsCode(() => validateTool({...call(), function: {name: 'getPriceHistory', arguments: '{"symbol":"BTCUSDT","days":8}'}}), 'INVALID_ARGUMENTS');
  throwsCode(() => validateTool({...call(), function: {name: 'getCurrentPrice', arguments: '{'}}), 'INVALID_ARGUMENTS');
});

test('model parser rejects truncation, duplicate IDs, and mismatched finish reasons', () => {
  const response = {choices: [{finish_reason: 'tool_calls', message: toolResponse(call()).message}]};
  assert.equal(parseModelResult(response).message.tool_calls?.[0].id, 'call_1');
  throwsCode(() => parseModelResult({choices: [{finish_reason: 'length', message: answer.message}]}), 'MODEL_RESPONSE');
  throwsCode(() => parseModelResult({choices: [{finish_reason: 'tool_calls', message: toolResponse(call(), call()).message}]}), 'MODEL_RESPONSE');
  throwsCode(() => parseModelResult({choices: [{finish_reason: 'stop', message: toolResponse(call()).message}]}), 'MODEL_RESPONSE');
});

test('end-to-end runner pairs tool calls, executes real adapter code, and returns structured data', async () => {
  let modelCalls = 0;
  await withFetch(async (url, init) => {
    if (String(url).startsWith(config.marketBaseUrl)) return json({symbol: 'BTCUSDT', askPrice: quote.price});
    assert.equal(String(url), `${config.deepseekBaseUrl}/chat/completions`);
    assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer test-only-key');
    assert.equal(typeof init?.body, 'string');
    const payload = JSON.parse(String(init?.body));
    assert.deepEqual(payload.thinking, {type: 'disabled'});
    assert.equal(payload.stream, false);
    assert.equal(payload.max_tokens, 800);
    modelCalls++;
    if (modelCalls === 1) return json({choices: [{finish_reason: 'tool_calls', message: toolResponse(call()).message}], usage: {prompt_tokens: 10, completion_tokens: 5}});
    const messages = payload.messages;
    assert.equal(messages.at(-2).role, 'assistant');
    assert.equal(messages.at(-2).tool_calls[0].id, 'call_1');
    assert.equal(messages.at(-1).role, 'tool');
    assert.equal(messages.at(-1).tool_call_id, 'call_1');
    assert.equal(JSON.parse(messages.at(-1).content).quote.price, quote.price);
    return json({choices: [{finish_reason: 'stop', message: answer.message}], usage: {prompt_tokens: 12, completion_tokens: 8}});
  }, async () => {
    const result = await runAgent('当前 BTC 价格', 'zh', signal(), {
      model: (messages, abort) => callDeepSeek(config, messages, abort),
      execute: (name, date, abort) => executeTool(name, config.marketBaseUrl, date, abort),
    });
    assert.equal(result.status, 'completed');
    assert.equal(result.data.quote?.price, quote.price);
    assert.deepEqual(result.usage, {inputTokens: 22, outputTokens: 13, modelCalls: 2});
    assert.equal(decodeAgentResponse(JSON.parse(JSON.stringify(result))).data.quote?.price, quote.price);
  });
});

test('unauthorized model tools never execute and return a paired error', async () => {
  let rounds = 0;
  let executed = false;
  const result = await runAgent('Read another balance', 'en', signal(), {
    model: async (messages) => {
      if (rounds++ === 0) return toolResponse(call('getOtherBalance'));
      assert.deepEqual(messages.at(-1), {role: 'tool', tool_call_id: 'call_1', content: '{"error":"INVALID_TOOL"}'});
      return answer;
    },
    execute: async () => { executed = true; return {}; },
  });
  assert.equal(executed, false);
  assert.equal(result.status, 'failed');
  assert.equal(result.error, 'INVALID_TOOL');
});

test('multiple tool calls retain IDs, and valid data survives a later model error', async () => {
  let rounds = 0;
  const history = parseHistory('BTCUSDT', [candle('2026-09-09')], now);
  const result = await runAgent('current and historical', 'en', signal(), {
    model: async (messages: ModelMessage[]) => {
      if (rounds++ === 0) return toolResponse(call(), {...call('getPriceHistory', {symbol: 'BTCUSDT'}, 'call_2'), function: {name: 'getPriceHistory', arguments: '{"symbol":"BTCUSDT","days":7}'}});
      assert.deepEqual(messages.slice(-2).map((item) => item.role === 'tool' ? item.tool_call_id : ''), ['call_1', 'call_2']);
      throw new AgentError('MODEL_FAILED');
    },
    execute: async (tool) => tool.name === 'getCurrentPrice' ? {quote} : {history},
  });
  assert.equal(result.status, 'partial');
  assert.equal(result.error, 'MODEL_FAILED');
  assert.equal(result.data.quote?.price, quote.price);
  assert.equal(result.data.history?.missingDates.length, 6);
});

test('empty history is partial and retains missing-date information', async () => {
  let rounds = 0;
  const result = await runAgent('history', 'en', signal(), {
    model: async () => rounds++ === 0 ? toolResponse({...call(), function: {name: 'getPriceHistory', arguments: '{"symbol":"BTCUSDT","days":7}'}}) : answer,
    execute: async () => ({history: parseHistory('BTCUSDT', [], now)}),
  });
  assert.equal(result.status, 'partial');
  assert.equal(result.data.history?.missingDates.length, 7);
});

test('loop stops at model budget without executing unexplainable extra calls', async () => {
  let rounds = 0;
  let executed = 0;
  const result = await runAgent('price', 'en', signal(), {
    model: async () => toolResponse(call('getCurrentPrice', {symbol: 'BTCUSDT'}, `call_${++rounds}`)),
    execute: async () => { executed++; return {quote}; },
  });
  assert.equal(rounds, 3);
  assert.equal(executed, 2);
  assert.equal(result.error, 'LIMIT_REACHED');
  assert.equal(result.status, 'partial');
});

test('cancellation prevents the tool from starting after a model response', async () => {
  const abort = new AbortController();
  let executed = false;
  const result = await runAgent('price', 'en', abort.signal, {
    model: async () => { abort.abort(); return toolResponse(call()); },
    execute: async () => { executed = true; return {quote}; },
  });
  assert.equal(executed, false);
  assert.equal(result.error, 'CANCELLED');
});

test('model authentication and credit errors are sanitized', async () => {
  for (const [status, code] of [[401, 'MODEL_AUTH'], [402, 'MODEL_BALANCE'], [429, 'MODEL_LIMIT']] as const) {
    await withFetch(async () => json({error: 'provider details that must not leak'}, status), async () => {
      await assert.rejects(callDeepSeek(config, [], signal()), {message: code, code});
    });
  }
});

test('body reader rejects oversized JSON and responds to cancellation during a slow body', async () => {
  await assert.rejects(readJson(json({message: 'x'.repeat(5000)}), 4096), {code: 'INVALID_INPUT'});
  const abort = new AbortController();
  const pending = readJson(new Response(new ReadableStream()), 4096, abort.signal);
  abort.abort();
  await assert.rejects(pending, {name: 'AbortError'});
});

test('production accepts anonymous requests with absent, empty or legacy access tokens without exposing the model key', async (t) => {
  let clock = Date.now();
  t.mock.method(Date, 'now', () => clock);
  for (const token of [undefined, '', 'legacy-test-access']) {
    clock += 3000;
    await withEnv({NODE_ENV: 'production', PRICE_AGENT_ENABLED: 'true', DEEPSEEK_API_KEY: config.apiKey,
      PRICE_AGENT_ACCESS_TOKEN: token, DEEPSEEK_BASE_URL: config.deepseekBaseUrl,
      MARKET_DATA_BASE_URL: config.marketBaseUrl}, async () => {
      let modelCalls = 0;
      await withFetch(async (url, init) => {
        assert.equal(String(url), `${config.deepseekBaseUrl}/chat/completions`);
        assert.equal(new Headers(init?.headers).get('Authorization'), `Bearer ${config.apiKey}`);
        modelCalls++;
        return json({choices: [{finish_reason: 'stop', message: answer.message}]});
      }, async () => {
        const response = await POST(new Request('https://site.invalid/api/price-agent', {
          method: 'POST', headers: {'Content-Type': 'application/json', Origin: 'https://site.invalid'},
          body: JSON.stringify({message: 'BTC price', locale: 'en'}),
        }));
        assert.equal(response.status, 200);
        const body = await response.text();
        assert.equal(decodeAgentResponse(JSON.parse(body)).status, 'completed');
        assert.equal(body.includes(config.apiKey), false);
        assert.equal(modelCalls, 1);
      });
    });
  }
});

test('configuration is opt-in, disallows credential-bearing URLs, and does not require a build-time key', async () => {
  await withEnv({PRICE_AGENT_ENABLED: 'false'}, async () => throwsCode(getConfig, 'DISABLED'));
  await withEnv({NODE_ENV: 'production', PRICE_AGENT_ENABLED: 'true', DEEPSEEK_API_KEY: ''}, async () => throwsCode(getConfig, 'NOT_CONFIGURED'));
  await withEnv({PRICE_AGENT_ENABLED: 'true', DEEPSEEK_API_KEY: 'test', DEEPSEEK_BASE_URL: 'https://user:password@model.invalid'}, async () => throwsCode(getConfig, 'NOT_CONFIGURED'));
});

test('route rejects cross-origin requests and injected configuration before any model call', async () => {
  await withEnv({NODE_ENV: 'production', PRICE_AGENT_ENABLED: 'true', DEEPSEEK_API_KEY: 'test',
    DEEPSEEK_BASE_URL: 'https://model.invalid', MARKET_DATA_BASE_URL: 'https://market.invalid'}, async () => {
    const request = (body: unknown, origin = 'https://site.invalid') =>
      new Request('https://site.invalid/api/price-agent', {method: 'POST', headers: {'Content-Type': 'application/json', Origin: origin}, body: JSON.stringify(body)});
    assert.equal((await POST(request({message: 'price', locale: 'en'}, 'https://other.invalid'))).status, 403);
    assert.equal((await POST(request({message: 'price', locale: 'en', tools: []}))).status, 400);
    assert.equal((await POST(request({message: 'x'.repeat(501), locale: 'en'}))).status, 400);
    assert.equal((await POST(request({message: 'price', locale: 'fr'}))).status, 400);
  });
});

test('all configured coins keep their symbol through model requests, APIs, history and browser decoding', async () => {
  for (const market of supportedMarkets) {
    let rounds = 0;
    const requestedSymbols: string[] = [];
    await withFetch(async (url) => {
      const parsed = new URL(String(url));
      const symbol = parsed.searchParams.get('symbol');
      assert.equal(symbol, market.symbol);
      requestedSymbols.push(String(symbol));
      return parsed.pathname.endsWith('bookTicker')
        ? json({symbol, askPrice: '0.0000123456'})
        : json([candle('2026-09-09', '0.0000111111')]);
    }, async () => {
      // Fixed date lets this test verify the complete historical adapter as well as the runner.
      const result = await runAgent(`${market.aliases[1]} current price and history`, 'en', signal(), {
        model: async (messages) => {
          if (rounds++ === 0) return toolResponse(call('getCurrentPrice', {symbol: market.symbol}),
            call('getPriceHistory', {symbol: market.symbol, days: 7}, 'history_1'));
          const results = messages.filter((item) => item.role === 'tool');
          assert.equal(results.length, 2);
          assert.equal(JSON.parse(results[0].content).quote.symbol, market.symbol);
          assert.equal(JSON.parse(results[1].content).history.symbol, market.symbol);
          return answer;
        },
        execute: (tool, _date, abort) => executeTool(tool, config.marketBaseUrl, now, abort),
      });
      assert.deepEqual(requestedSymbols, [market.symbol, market.symbol]);
      const decoded = decodeAgentResponse(JSON.parse(JSON.stringify(result)));
      assert.equal(decoded.data.quote?.symbol, market.symbol);
      assert.equal(decoded.data.history?.symbol, market.symbol);
      assert.equal(decoded.data.quote?.price, '0.0000123456');
      assert.ok(decoded.trace.filter((entry) => entry.step === 'tool').every((entry) => entry.symbol === market.symbol));
      assert.equal(priceUnit(market.symbol), `USDT / ${getMarket(market.symbol).baseAsset}`);
    });
  }
});

test('a mismatched exchange symbol is rejected instead of displaying BTC as ETH', async () => {
  await withFetch(async () => json({symbol: 'BTCUSDT', askPrice: '60000'}), async () => {
    await assert.rejects(getCurrentPrice('ETHUSDT', config.marketBaseUrl, signal()), {code: 'MARKET_DATA'});
  });
});

test('mixed-market calls in one batch are blocked before either API executes', async () => {
  let executions = 0;
  const result = await runAgent('BTC and ETH', 'en', signal(), {
    model: async () => toolResponse(call(), call('getCurrentPrice', {symbol: 'ETHUSDT'}, 'eth_1')),
    execute: async () => { executions++; return {quote}; },
  });
  assert.equal(executions, 0);
  assert.equal(result.error, 'MULTIPLE_MARKETS');
  assert.deepEqual(result.data, {});
});

test('a later market switch cannot overwrite previously retrieved data', async () => {
  let rounds = 0;
  let executions = 0;
  const result = await runAgent('price', 'en', signal(), {
    model: async () => toolResponse(rounds++ === 0 ? call() : call('getCurrentPrice', {symbol: 'SOLUSDT'}, 'sol_1')),
    execute: async () => { executions++; return {quote}; },
  });
  assert.equal(executions, 1);
  assert.equal(result.status, 'partial');
  assert.equal(result.error, 'MULTIPLE_MARKETS');
  assert.equal(result.data.quote?.symbol, 'BTCUSDT');
});

test('browser decoder rejects unknown or mixed quote/history markets', () => {
  const response = {status: 'completed', answer: '', data: {quote}, trace: [], usage: {inputTokens: 0, outputTokens: 0, modelCalls: 0}};
  throwsCode(() => decodeAgentResponse({...response, data: {quote: {...quote, symbol: 'UNKNOWNUSDT'}}}), 'MODEL_RESPONSE');
  throwsCode(() => decodeAgentResponse({...response, data: {quote, history: parseHistory('ETHUSDT', [], now)}}), 'MODEL_RESPONSE');
});

test('small prices retain meaningful digits in both display languages', () => {
  for (const locale of ['zh', 'en'] as const) {
    assert.equal(formatMarketPrice('0.0000123456', locale), '0.0000123456');
    assert.equal(formatMarketPrice('0.005', locale), '0.005');
    assert.equal(formatMarketPrice('60000.12', locale), '60,000.12');
  }
});
