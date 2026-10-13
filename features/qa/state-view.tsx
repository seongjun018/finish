'use client';
import type { ReactNode } from 'react';
import type { LoadResult } from './types';

export function StateView({ result, onRetry, onReset, children }: { result: LoadResult; onRetry?: () => void; onReset?: () => void; children?: ReactNode }) {
  if (result.status === 'success') return <>{children}</>;
  const content = {
    loading: ['◌', '데이터를 불러오고 있어요', '잠시만 기다려 주세요. 로딩 고정 시나리오는 정상 상태를 선택하면 해제됩니다.'],
    empty: ['∅', '아직 표시할 데이터가 없어요', '등록된 데이터가 없는 상태입니다. 데이터가 준비되면 이곳에 표시됩니다.'],
    error: ['!', result.message ?? '문제가 발생했어요', result.recovery ?? '연결 상태를 확인하고 다시 시도하세요.'],
    offline: ['↯', '네트워크 연결을 확인해 주세요', '연결이 끊겨 요청을 보낼 수 없습니다. 연결이 복구되면 다시 조회합니다.'],
  }[result.status];
  return <section className={`qa-state qa-state-${result.status}`} role={result.status === 'error' || result.status === 'offline' ? 'alert' : 'status'} aria-busy={result.status === 'loading'} data-testid="state-view">
    <span className="qa-state-symbol" aria-hidden="true">{content[0]}</span>
    <h3>{content[1]}</h3><p>{content[2]}</p>
    {result.code && <code>{result.code}</code>}
    {result.status === 'loading' && <div className="qa-skeleton" aria-hidden="true"><i /><i /><i /></div>}
    <div className="qa-state-actions">
      {(result.retryable || result.status === 'offline') && onRetry && <button className="qa-primary" onClick={onRetry}>다시 시도</button>}
      {onReset && <button className="qa-secondary" onClick={onReset}>정상 상태로 복원</button>}
    </div>
  </section>;
}
