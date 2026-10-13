import { describe, expect, it } from 'vitest';
import { createFixtures, defaultSelection, features, parseSelection, scenarios, selectionSearch } from './scenarios';
import { loadQaData } from './service';
import type { QaRequest } from './types';
const request = (patch: Partial<QaRequest> = {}): QaRequest => ({ ...defaultSelection, attempt: 0, delayMs: 0, signal: new AbortController().signal, ...patch });

describe('isolated mock data', () => {
  it.each(features)('$id has deterministic fixtures and at least one failure case', ({ id }) => {
    const rows = createFixtures(id);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every(row => row.id.startsWith('rehearsal:'))).toBe(true);
    expect(scenarios.some(item => item.feature === id)).toBe(true);
    rows[0].title = 'changed';
    expect(createFixtures(id)[0].title).not.toBe('changed');
  });
  it('returns no rows for an empty state', async () => { expect(await loadQaData(request({ state: 'empty' }))).toEqual([]); });
  it.each(scenarios)('$id fails with its expected code and retry behavior', async scenario => {
    const req = request({ feature: scenario.feature, state: 'error', scenario: scenario.id });
    await expect(loadQaData(req)).rejects.toMatchObject({ code: scenario.code, retryable: scenario.retryable });
    if (scenario.recoversOnRetry) expect((await loadQaData({ ...req, attempt: 1 })).length).toBeGreaterThan(0);
    else await expect(loadQaData({ ...req, attempt: 1 })).rejects.toMatchObject({ code: scenario.code });
  });
  it('never falls back to mock in unconfigured live mode', async () => {
    await expect(loadQaData(request({ mode: 'live' }))).rejects.toMatchObject({ code: 'LIVE_NOT_CONFIGURED' });
  });
  it('uses an explicitly injected live adapter', async () => {
    const rows = [{ id: 'adapter-test', title: 'test', detail: 'test', status: 'test' }];
    expect(await loadQaData(request({ mode: 'live' }), { load: async () => rows })).toBe(rows);
  });
  it('cancels stale requests without returning data', async () => {
    const controller = new AbortController();
    const pending = loadQaData(request({ delayMs: 1000, signal: controller.signal }));
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  });
  it('rejects an already aborted request', async () => {
    await expect(loadQaData(request({ signal: AbortSignal.abort() }))).rejects.toMatchObject({ name: 'AbortError' });
  });
});
describe('shareable scenario selection', () => {
  it('roundtrips a failure scenario', () => {
    const selection = { ...defaultSelection, feature: 'voting' as const, state: 'error' as const, scenario: 'vote-closed' };
    expect(parseSelection(selectionSearch(selection))).toEqual(selection);
  });
  it('rejects malformed feature and mode inputs', () => {
    expect(parseSelection('?feature=unknown&mode=production')).toEqual(defaultSelection);
  });
  it('ignores a scenario belonging to another feature', () => {
    expect(parseSelection('?feature=auth&scenario=vote-closed').scenario).toBe('');
  });
  it('normalizes scenario state to error', () => {
    expect(parseSelection('?feature=auth&scenario=session-expired&state=success').state).toBe('error');
  });
});
