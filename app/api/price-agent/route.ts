import {NextResponse} from 'next/server';
import {acquireSlot} from '@/lib/price-agent/access';
import {getConfig, limits} from '@/lib/price-agent/config';
import {callDeepSeek} from '@/lib/price-agent/deepseek';
import {readJson} from '@/lib/price-agent/http';
import {runAgent} from '@/lib/price-agent/runner';
import {executeTool} from '@/lib/price-agent/tools';
import {AgentError, errorCode, isRecord, type AgentResponse, type ErrorCode} from '@/lib/price-agent/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

const headers = {'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'};
function statusFor(code: ErrorCode): number {
  if (code === 'ACCESS_DENIED') return 403;
  if (code === 'INVALID_INPUT') return 400;
  if (code === 'BUSY' || code === 'MODEL_LIMIT') return 429;
  if (code === 'DISABLED' || code === 'NOT_CONFIGURED') return 503;
  if (code === 'TIMEOUT') return 504;
  if (code === 'CANCELLED') return 408;
  return 502;
}

export async function POST(request: Request) {
  let release: (() => void) | undefined;
  try {
    const config = getConfig();
    const origin = request.headers.get('origin');
    if (origin && origin !== new URL(request.url).origin) throw new AgentError('ACCESS_DENIED');
    if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new AgentError('INVALID_INPUT');
    const bodySignal = AbortSignal.any([request.signal, AbortSignal.timeout(5000)]);
    const body = await readJson(new Response(request.body), limits.requestBytes, bodySignal);
    if (!isRecord(body) || typeof body.message !== 'string' || !body.message.trim()
      || body.message.length > limits.inputCharacters || (body.locale !== 'zh' && body.locale !== 'en')
      || Object.keys(body).some((key) => key !== 'message' && key !== 'locale')) throw new AgentError('INVALID_INPUT');
    release = acquireSlot();
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(limits.taskTimeoutMs)]);
    const result = await runAgent(body.message.trim(), body.locale, signal, {
      model: (messages, callSignal) => callDeepSeek(config, messages, callSignal),
      execute: (tool, now, toolSignal) => executeTool(tool, config.marketBaseUrl, now, toolSignal),
    });
    return NextResponse.json(result, {status: result.status === 'failed' ? statusFor(result.error || 'UNKNOWN') : 200, headers});
  } catch (error) {
    const code = errorCode(error, request.signal);
    const result: AgentResponse = {status: 'failed', answer: '', data: {}, trace: [], error: code,
      usage: {inputTokens: 0, outputTokens: 0, modelCalls: 0}};
    return NextResponse.json(result, {status: statusFor(code), headers});
  } finally { release?.(); }
}
