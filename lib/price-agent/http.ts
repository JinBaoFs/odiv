import {AgentError} from '@/lib/price-agent/types';

// Bound upstream bodies as well as request time; do not log provider error bodies.
export async function readJson(response: Response, maxBytes = 100_000, signal?: AbortSignal): Promise<unknown> {
  signal?.throwIfAborted();
  if (!response.body) throw new AgentError('INVALID_INPUT');
  const reader = response.body.getReader();
  const onAbort = () => { void reader.cancel().catch(() => undefined); };
  signal?.addEventListener('abort', onAbort, {once: true});
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const {value, done} = await reader.read();
      signal?.throwIfAborted();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new AgentError('INVALID_INPUT');
      }
      chunks.push(value);
    }
  } finally {
    signal?.removeEventListener('abort', onAbort);
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { return JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(bytes)); }
  catch { throw new AgentError('INVALID_INPUT'); }
}
