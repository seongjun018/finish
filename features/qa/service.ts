import { createFixtures, scenarios } from './scenarios';
import type { QaAdapter, QaRequest } from './types';

export class QaError extends Error {
  constructor(public code: string, message: string, public recovery: string, public retryable = false) { super(message); this.name = 'QaError'; }
}
function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const abort = () => { clearTimeout(timer); signal.removeEventListener('abort', abort); reject(new DOMException('Request aborted', 'AbortError')); };
    const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, ms);
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
  });
}
export const mockAdapter: QaAdapter = {
  async load(request) {
    await delay(request.delayMs ?? 650, request.signal);
    const scenario = scenarios.find(item => item.id === request.scenario && item.feature === request.feature);
    if (scenario && !(scenario.recoversOnRetry && request.attempt > 0)) throw new QaError(scenario.code, scenario.description, scenario.recovery, scenario.retryable);
    if (request.state === 'error' && !scenario) throw new QaError('MOCK_SERVER_ERROR', '요청을 처리하지 못했습니다.', '정상 시나리오로 바꾸거나 연결 상태를 확인한 뒤 다시 시도하세요.', true);
    return request.state === 'empty' ? [] : createFixtures(request.feature);
  },
};
// 실제 API adapter를 전달하기 전에는 mock으로 조용히 대체하지 않습니다.
export async function loadQaData(request: QaRequest, liveAdapter?: QaAdapter) {
  if (request.signal.aborted) throw new DOMException('Request aborted', 'AbortError');
  if (request.mode === 'live') {
    if (!liveAdapter) throw new QaError('LIVE_NOT_CONFIGURED', '실제 API가 연결되지 않았습니다.', 'Mock Data를 켜서 리허설을 진행하세요. 실제 연결은 팀 API adapter가 필요합니다.');
    return liveAdapter.load(request);
  }
  return mockAdapter.load(request);
}
