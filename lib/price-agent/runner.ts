import type {SupportedSymbol} from '@/config/price-agent';
import {limits} from '@/lib/price-agent/config';
import {systemPrompt} from '@/lib/price-agent/prompt';
import {validateTool} from '@/lib/price-agent/tools';
import {AgentError, errorCode, type AgentData, type AgentLocale, type AgentResponse, type ErrorCode,
  type ModelMessage, type ModelResult, type ValidatedTool} from '@/lib/price-agent/types';

type Dependencies = {
  model: (messages: ModelMessage[], signal: AbortSignal) => Promise<ModelResult>;
  execute: (tool: ValidatedTool, now: Date, signal: AbortSignal) => Promise<AgentData>;
};

export async function runAgent(input: string, locale: AgentLocale, signal: AbortSignal, dependencies: Dependencies): Promise<AgentResponse> {
  const now = new Date();
  const messages: ModelMessage[] = [{role: 'system', content: systemPrompt(locale, now)}, {role: 'user', content: input}];
  const result: AgentResponse = {status: 'failed', answer: '', data: {}, trace: [], usage: {inputTokens: 0, outputTokens: 0, modelCalls: 0}};
  let toolCount = 0;
  let latestToolError: ErrorCode | undefined;
  let selectedSymbol: SupportedSymbol | undefined;
  const seenCalls = new Set<string>();
  const hasData = () => Boolean(result.data.quote || result.data.history);
  try {
    for (let round = 0; round < limits.modelCalls; round++) {
      signal.throwIfAborted();
      const started = Date.now();
      let response: ModelResult;
      result.usage.modelCalls++;
      try { response = await dependencies.model(messages, signal); }
      catch (error) {
        result.trace.push({step: 'model', status: 'failed', durationMs: Date.now() - started, error: errorCode(error, signal)});
        throw error;
      }
      signal.throwIfAborted();
      result.usage.inputTokens += response.usage.inputTokens;
      result.usage.outputTokens += response.usage.outputTokens;
      result.trace.push({step: 'model', status: 'success', durationMs: Date.now() - started});
      const message = response.message;
      messages.push(message);
      if (!message.tool_calls?.length) {
        result.answer = message.content?.trim() || '';
        const incomplete = Boolean(result.data.history?.missingDates.length);
        result.status = latestToolError ? (hasData() ? 'partial' : 'failed') : incomplete ? 'partial' : 'completed';
        result.error = latestToolError;
        result.trace.push({step: 'answer', status: 'success', durationMs: 0});
        return result;
      }
      // Reserve another model round to read tool results instead of executing work we cannot explain.
      if (round === limits.modelCalls - 1 || toolCount + message.tool_calls.length > limits.toolCalls) {
        throw new AgentError('LIMIT_REACHED');
      }
      // Check the entire batch before executing it: a response can hold only one market.
      const batchSymbols = new Set<SupportedSymbol>(selectedSymbol ? [selectedSymbol] : []);
      for (const call of message.tool_calls) {
        try { batchSymbols.add(validateTool(call).arguments.symbol); }
        catch { /* Invalid calls receive their own paired error below. */ }
      }
      if (batchSymbols.size > 1) throw new AgentError('MULTIPLE_MARKETS');
      for (const call of message.tool_calls) {
        signal.throwIfAborted();
        if (seenCalls.has(call.id)) throw new AgentError('MODEL_RESPONSE');
        seenCalls.add(call.id);
        toolCount++;
        const toolStarted = Date.now();
        let tool: ValidatedTool;
        try {
          tool = validateTool(call);
          selectedSymbol = tool.arguments.symbol;
          result.trace.push({step: 'validate', status: 'success', tool: tool.name, symbol: selectedSymbol, durationMs: 0});
        } catch (error) {
          const code = errorCode(error, signal);
          latestToolError = code;
          result.trace.push({step: 'validate', status: 'failed', durationMs: 0, error: code});
          messages.push({role: 'tool', tool_call_id: call.id, content: JSON.stringify({error: code})});
          continue;
        }
        try {
          const data = await dependencies.execute(tool, now, signal);
          signal.throwIfAborted();
          if ((data.quote && data.quote.symbol !== tool.arguments.symbol)
            || (data.history && data.history.symbol !== tool.arguments.symbol)) throw new AgentError('MARKET_DATA');
          Object.assign(result.data, data);
          result.trace.push({step: 'tool', status: 'success', tool: tool.name, symbol: tool.arguments.symbol, durationMs: Date.now() - toolStarted});
          messages.push({role: 'tool', tool_call_id: call.id, content: JSON.stringify(data)});
        } catch (error) {
          if (signal.aborted) throw error;
          const code = errorCode(error);
          latestToolError = code;
          result.trace.push({step: 'tool', status: 'failed', tool: tool.name, symbol: tool.arguments.symbol, durationMs: Date.now() - toolStarted, error: code});
          messages.push({role: 'tool', tool_call_id: call.id, content: JSON.stringify({error: code})});
        }
      }
    }
    throw new AgentError('LIMIT_REACHED');
  } catch (error) {
    result.status = hasData() ? 'partial' : 'failed';
    result.error = errorCode(error, signal);
    return result;
  }
}
