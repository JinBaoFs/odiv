import {limits, type AgentConfig} from '@/lib/price-agent/config';
import {readJson} from '@/lib/price-agent/http';
import {toolDefinitions} from '@/lib/price-agent/tools';
import {AgentError, isRecord, type AssistantMessage, type ModelMessage, type ModelResult, type ToolCall} from '@/lib/price-agent/types';

export function parseModelResult(data: unknown): ModelResult {
  if (!isRecord(data) || !Array.isArray(data.choices) || !isRecord(data.choices[0])) throw new AgentError('MODEL_RESPONSE');
  const choice = data.choices[0];
  if (choice.finish_reason !== 'stop' && choice.finish_reason !== 'tool_calls') throw new AgentError('MODEL_RESPONSE');
  const raw = choice.message;
  if (!isRecord(raw) || raw.role !== 'assistant' || (raw.content !== null && typeof raw.content !== 'string')) {
    throw new AgentError('MODEL_RESPONSE');
  }
  const message: AssistantMessage = {role: 'assistant', content: raw.content};
  if (raw.tool_calls !== undefined && raw.tool_calls !== null) {
    if (!Array.isArray(raw.tool_calls) || raw.tool_calls.length > limits.toolCalls) throw new AgentError('MODEL_RESPONSE');
    const seen = new Set<string>();
    const calls: ToolCall[] = [];
    for (const call of raw.tool_calls) {
      if (!isRecord(call) || typeof call.id !== 'string' || !call.id || call.id.length > 200
        || seen.has(call.id) || call.type !== 'function' || !isRecord(call.function)
        || typeof call.function.name !== 'string' || call.function.name.length > 100
        || typeof call.function.arguments !== 'string' || call.function.arguments.length > 2000) {
        throw new AgentError('MODEL_RESPONSE');
      }
      seen.add(call.id);
      calls.push({id: call.id, type: 'function', function: {name: call.function.name, arguments: call.function.arguments}});
    }
    if (calls.length) message.tool_calls = calls;
  }
  if ((choice.finish_reason === 'tool_calls') !== Boolean(message.tool_calls?.length)) throw new AgentError('MODEL_RESPONSE');
  if (!message.tool_calls && !message.content?.trim()) throw new AgentError('MODEL_RESPONSE');
  const usage = isRecord(data.usage) ? data.usage : {};
  const count = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : 0;
  return {message, usage: {inputTokens: count(usage.prompt_tokens), outputTokens: count(usage.completion_tokens)}};
}

export async function callDeepSeek(config: AgentConfig, messages: ModelMessage[], signal: AbortSignal): Promise<ModelResult> {
  const timedSignal = AbortSignal.any([signal, AbortSignal.timeout(limits.modelTimeoutMs)]);
  try {
    const response = await fetch(`${config.deepseekBaseUrl}/chat/completions`, {
      method: 'POST', signal: timedSignal, cache: 'no-store', redirect: 'error',
      headers: {'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}`},
      body: JSON.stringify({model: config.model, messages, tools: toolDefinitions,
        tool_choice: 'auto', thinking: {type: 'disabled'}, stream: false, max_tokens: limits.outputTokens}),
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw new AgentError(response.status === 401 ? 'MODEL_AUTH' : response.status === 402 ? 'MODEL_BALANCE'
        : response.status === 429 ? 'MODEL_LIMIT' : 'MODEL_FAILED');
    }
    let data: unknown;
    try { data = await readJson(response); }
    catch { if (timedSignal.aborted) throw timedSignal.reason; throw new AgentError('MODEL_RESPONSE'); }
    return parseModelResult(data);
  } catch (error) {
    if (timedSignal.aborted) throw timedSignal.reason;
    if (error instanceof AgentError) throw error;
    throw new AgentError('MODEL_FAILED');
  }
}
