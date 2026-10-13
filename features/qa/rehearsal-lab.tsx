'use client';
import { useEffect, useState } from 'react';
import { createFixtures, defaultSelection, features, parseSelection, scenarios, selectionSearch } from './scenarios';
import { StateView } from './state-view';
import { useQaData } from './use-qa-data';
import type { ScreenState, Selection } from './types';
import './qa.css';

const states: { id: ScreenState; label: string; english: string }[] = [
  { id: 'success', label: '정상', english: 'Success' }, { id: 'loading', label: '로딩', english: 'Loading' },
  { id: 'empty', label: '빈 데이터', english: 'Empty' }, { id: 'error', label: '오류', english: 'Error' }, { id: 'offline', label: '오프라인', english: 'Offline' },
];
export function RehearsalLab() {
  const [selection, setSelection] = useState<Selection>(defaultSelection);
  const [attempt, setAttempt] = useState(0);
  const [notice, setNotice] = useState('');
  const [showData, setShowData] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const read = () => { setSelection(parseSelection(window.location.search)); setAttempt(0); };
    read(); setReady(true); window.addEventListener('popstate', read);
    return () => window.removeEventListener('popstate', read);
  }, []);
  useEffect(() => {
    if (ready) window.history.replaceState(null, '', `${window.location.pathname}?${selectionSearch(selection)}`);
  }, [ready, selection]);
  const { result, online } = useQaData(selection, attempt);
  const feature = features.find(item => item.id === selection.feature)!;
  const choices = scenarios.filter(item => item.feature === selection.feature);
  const currentScenario = scenarios.find(item => item.id === selection.scenario);
  function change(patch: Partial<Selection>) { setSelection(current => ({ ...current, ...patch })); setAttempt(0); setNotice(''); }
  function reset() { change({ state: 'success', scenario: '', mode: 'mock' }); }
  async function copyLink() {
    try { await navigator.clipboard.writeText(window.location.href); setNotice('시나리오 링크를 복사했어요.'); }
    catch { setNotice('복사할 수 없어요. 브라우저 주소창의 URL을 직접 복사해 주세요.'); }
  }
  return <div className="qa-shell">
    <aside className="qa-sidebar">
      <a className="qa-brand" href="/">N<span>✳</span>XUS <small>EVENT PLATFORM</small></a>
      <div className="qa-workspace"><span className="qa-avatar">N</span><div>경영대학 학술제<small>개발 · 리허설 워크스페이스</small></div></div>
      <p className="qa-nav-label">TEST WORKSPACE</p>
      <nav aria-label="테스트할 기능">{features.map((item, index) => <button key={item.id} aria-current={selection.feature === item.id ? 'page' : undefined} onClick={() => change({ feature: item.id, state: 'success', scenario: '' })}><span className="qa-nav-number">0{index + 1}</span>{item.label}<span className="qa-nav-arrow">↗</span></button>)}</nav>
      <div className="qa-sidebar-foot"><span className="qa-dot" /> QA & REHEARSAL <p>박성준 · QA / Error State</p><small>모든 참가자 정보는 가상 데이터입니다.</small></div>
    </aside>
    <div className="qa-main">
      <header className="qa-topbar"><span>개발 도구 <span className="qa-slash">/</span> <strong>QA 리허설</strong></span><span className="qa-connection"><i className={online ? 'qa-dot' : 'qa-dot qa-dot-off'} />{online ? '브라우저 온라인' : '브라우저 오프라인'}</span></header>
      <main>
        <div className="qa-page-heading"><div><p className="qa-eyebrow">READY FOR THE UNEXPECTED</p><h1>예외 상황도, 준비된 화면으로.</h1><p className="qa-subtitle">행사 전에 실패 상황을 재현하고, 복구 흐름을 확인하세요.</p></div><button className="qa-secondary qa-copy" onClick={copyLink}>↗ 시나리오 링크 복사</button></div>
        <div className={`qa-banner ${selection.mode === 'live' ? 'qa-banner-live' : ''}`} role="status"><span className="qa-banner-icon">{selection.mode === 'mock' ? '◎' : '!'}</span><div><strong>{selection.mode === 'mock' ? '리허설 모드 · MOCK DATA' : '실제 API 모드 · 연결 필요'}</strong><p>{selection.mode === 'mock' ? '가상 데이터로만 실행됩니다. 실제 행사 기록에 영향을 주지 않습니다.' : '현재 실제 API가 없습니다. 운영 데이터 조회 및 저장은 수행되지 않습니다.'}</p></div><span className="qa-banner-tag">{selection.mode === 'mock' ? 'SANDBOX' : 'NOT CONNECTED'}</span></div>
        <p className="qa-notice" role="status">{notice}</p>
        <div className="qa-grid">
          <section className="qa-controls qa-card" aria-labelledby="control-title">
            <div className="qa-section-title"><h2 id="control-title">시나리오 설정</h2><span>01</span></div>
            <div className="qa-current-feature"><span className="qa-eyebrow">SELECTED FEATURE</span><h3>{feature.label}</h3><p>{feature.subtitle}</p></div>
            <div className="qa-control-heading"><h3>화면 상태</h3><span>5 STATES</span></div>
            <div className="qa-states" role="group" aria-label="화면 상태">{states.map(item => <button key={item.id} disabled={selection.mode === 'live'} aria-pressed={selection.state === item.id && !selection.scenario} onClick={() => change({ state: item.id, scenario: '' })}><i className={`qa-status-dot qa-status-${item.id}`} /><span>{item.label}<small>{item.english}</small></span><span className="qa-radio" /></button>)}</div>
            <label className="qa-select-label" htmlFor="scenario">기능별 예외 시나리오</label>
            <select id="scenario" disabled={selection.mode === 'live'} value={selection.scenario} onChange={event => change({ scenario: event.target.value, state: event.target.value ? 'error' : 'success' })}><option value="">공통 상태 테스트</option>{choices.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select>
            <div className="qa-toggle-row"><div><strong>Mock Data</strong><small>테스트 데이터 사용</small></div><button className="qa-toggle" role="switch" aria-label="Mock Data" aria-checked={selection.mode === 'mock'} onClick={() => change({ mode: selection.mode === 'mock' ? 'live' : 'mock', scenario: '', state: 'success' })}><span /></button></div>
            <button className="qa-reset" onClick={() => { reset(); setNotice('리허설 데이터를 초기 상태로 되돌렸어요.'); }}>↻ 리허설 초기화</button>
          </section>
          <section className="qa-preview-column">
            <div className="qa-card qa-preview"><div className="qa-preview-header"><div className="qa-section-title"><h2>화면 미리보기</h2><span>02</span></div><span className={`qa-result-pill qa-pill-${result.status}`} data-testid="result-status">{states.find(item => item.id === result.status)?.english}</span></div>
              <div className="qa-preview-context"><span className="qa-preview-logo">N</span><div><h3>{feature.label}</h3><p>{currentScenario?.label ?? '공통 상태 시나리오'}</p></div><span className="qa-preview-tag">{selection.mode === 'mock' ? 'REHEARSAL' : 'API 미연결'}</span></div>
              <StateView result={result} onRetry={() => setAttempt(value => value + 1)} onReset={reset}><div className="qa-success" role="status"><div className="qa-success-heading"><span>✓</span><div><h3>테스트 데이터 조회 완료</h3><p>아래는 상태 확인용 예시입니다.</p></div></div><div className="qa-fixture-list">{result.rows.map(row => <article key={row.id}><div><strong>{row.title}</strong><p>{row.detail}</p></div><span>{row.status}</span></article>)}</div></div></StateView>
              <div className="qa-preview-footer"><span>● {selection.mode === 'mock' ? '격리된 Mock 데이터' : 'API 연결 대기'}</span><span>재시도 {attempt}회</span></div>
            </div>
            <div className="qa-card qa-guide"><div className="qa-section-title"><h2>확인할 포인트</h2><span>CHECKPOINT</span></div><ul><li>상태와 원인을 사용자가 이해할 수 있나요?</li><li>재시도하거나 정상 화면으로 돌아갈 수 있나요?</li><li>실패한 요청을 성공으로 표시하지 않나요?</li></ul>{currentScenario && <p className="qa-recovery-note">{currentScenario.recoversOnRetry ? '이 시나리오는 첫 요청만 실패합니다. 다시 시도하면 정상 데이터로 복구됩니다.' : currentScenario.recovery}</p>}<p className="qa-help">오프라인 상태 선택은 화면 재현입니다. 실제 연결 해제도 감지하지만 서버 도달 가능 여부까지 보장하지는 않습니다.</p></div>
            <div className="qa-card qa-data"><button className="qa-data-trigger" aria-expanded={showData} onClick={() => setShowData(value => !value)}><span>시나리오 데이터 살펴보기 <small>JSON</small></span><span>{showData ? '−' : '+'}</span></button>{showData && <pre>{JSON.stringify({ selection, result, fixturePreview: selection.mode === 'mock' ? createFixtures(selection.feature) : [] }, null, 2)}</pre>}</div>
          </section>
        </div>
        <footer className="qa-footer"><span>NEXUS EVENT PLATFORM</span><span>QA prototype · Supabase 미연결 · 실제 인증/저장 없음</span></footer>
      </main>
    </div>
  </div>;
}
