import {AgentError} from '@/lib/price-agent/types';

// Per-process backpressure only; this does not enforce a shared quota across instances.
let active = false;
let nextStart = 0;
export function acquireSlot(): () => void {
  if (active || Date.now() < nextStart) throw new AgentError('BUSY');
  active = true;
  nextStart = Date.now() + 2000;
  return () => { active = false; };
}
