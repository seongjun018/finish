'use client';
import { useEffect, useState, useSyncExternalStore } from 'react';
import type { LoadResult, QaAdapter, Selection } from './types';
import { loadQaData, QaError } from './service';

const loading: LoadResult = { status: 'loading', rows: [] };
function subscribeOnline(callback: () => void) {
  window.addEventListener('online', callback); window.addEventListener('offline', callback);
  return () => { window.removeEventListener('online', callback); window.removeEventListener('offline', callback); };
}
export function useOnline() { return useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true); }
export function useQaData(selection: Selection, attempt: number, liveAdapter?: QaAdapter) {
  const online = useOnline();
  const key = JSON.stringify([selection, attempt, online]);
  const [snapshot, setSnapshot] = useState<{ key: string; value: LoadResult }>({ key: '', value: loading });
  useEffect(() => {
    const controller = new AbortController();
    const commit = (value: LoadResult) => { if (!controller.signal.aborted) setSnapshot({ key, value }); };
    if (!online || (selection.mode === 'mock' && selection.state === 'offline')) {
      commit({ status: 'offline', rows: [] });
    } else if (selection.mode === 'mock' && selection.state === 'loading') {
      commit(loading);
    } else {
      commit(loading);
      loadQaData({ ...selection, attempt, signal: controller.signal }, liveAdapter).then(rows => {
        commit({ status: rows.length ? 'success' : 'empty', rows });
      }).catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const known = error instanceof QaError;
        commit({ status: 'error', rows: [], code: known ? error.code : 'UNEXPECTED_ERROR', message: known ? error.message : '요청 중 문제가 발생했습니다.', recovery: known ? error.recovery : '잠시 후 다시 시도하세요.', retryable: known ? error.retryable : true });
      });
    }
    return () => controller.abort();
  }, [key, selection, attempt, online, liveAdapter]);
  return { result: snapshot.key === key ? snapshot.value : loading, online };
}
