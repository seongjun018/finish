import { test, expect } from '@playwright/test';
test.beforeEach(async ({ page }) => { await page.goto('/admin/qa'); });

test('all common states and reset are usable', async ({ page }) => {
  await expect(page.getByTestId('result-status')).toHaveText('Success');
  for (const [label, state] of [['로딩', 'Loading'], ['빈 데이터', 'Empty'], ['오류', 'Error'], ['오프라인', 'Offline']]) {
    await page.getByRole('button', { name: new RegExp(label), exact: false }).click();
    await expect(page.getByTestId('result-status')).toHaveText(state);
    await expect(page.getByTestId('state-view')).toBeVisible();
  }
  await page.getByRole('button', { name: '정상 상태로 복원' }).click();
  await expect(page.getByTestId('result-status')).toHaveText('Success');
});
test('failure retry recovers and URL reload reproduces the initial failure', async ({ page }) => {
  await page.getByLabel('기능별 예외 시나리오').selectOption('dashboard-timeout');
  await expect(page.getByText('REQUEST_TIMEOUT', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '다시 시도' }).click();
  await expect(page.getByTestId('result-status')).toHaveText('Success');
  await page.reload();
  await expect(page.getByText('REQUEST_TIMEOUT', { exact: true })).toBeVisible();
});
test('business rejection has no misleading retry action', async ({ page }) => {
  await page.getByRole('button', { name: /청중평가/ }).click();
  await page.getByLabel('기능별 예외 시나리오').selectOption('duplicate-vote');
  await expect(page.getByText('ALREADY_VOTED', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '다시 시도' })).toHaveCount(0);
});
test('live mode is explicitly unconfigured, reset restores rehearsal', async ({ page }) => {
  await page.getByRole('switch', { name: 'Mock Data' }).click();
  await expect(page.getByText('LIVE_NOT_CONFIGURED', { exact: true })).toBeVisible();
  await expect(page.getByText('실제 API 모드 · 연결 필요')).toBeVisible();
  await expect(page.getByRole('button', { name: '로딩 Loading' })).toBeDisabled();
  await page.getByRole('button', { name: /리허설 초기화/ }).click();
  await expect(page.getByTestId('result-status')).toHaveText('Success');
  await expect(page.getByRole('switch', { name: 'Mock Data' })).toBeChecked();
});
test('real browser offline state blocks loading and reconnects', async ({ page, context }) => {
  await expect(page.getByTestId('result-status')).toHaveText('Success');
  await context.setOffline(true);
  await expect(page.getByTestId('result-status')).toHaveText('Offline');
  await page.getByRole('button', { name: '다시 시도' }).click();
  await expect(page.getByTestId('result-status')).toHaveText('Offline');
  await context.setOffline(false);
  await expect(page.getByTestId('result-status')).toHaveText('Success');
});
test('switching features during pending requests never displays old fixtures', async ({ page }) => {
  await page.getByRole('button', { name: /QR 체크인/ }).click();
  await page.getByRole('button', { name: /인증 · 권한/ }).click();
  await expect(page.getByTestId('result-status')).toHaveText('Success');
  await expect(page.getByText('테스트 관리자', { exact: true })).toBeVisible();
  await expect(page.getByText('테스트 참가자 A', { exact: true })).toHaveCount(0);
});
test('every feature can render its own failure, with no horizontal page overflow', async ({ page }) => {
  for (const [label, scenario, code] of [
    ['심사위원 평가', 'judge-save-failed', 'SAVE_FAILED'], ['점수 집계', 'incomplete-scores', 'SCORES_INCOMPLETE'],
    ['경품 추첨', 'no-eligible-participants', 'NO_ELIGIBLE_PARTICIPANTS'], ['결과 내보내기', 'export-failed', 'EXPORT_FAILED'],
    ['행사 · 팀 관리', 'event-save-failed', 'EVENT_SAVE_FAILED'], ['인증 · 권한', 'permission-denied', 'FORBIDDEN'],
    ['QR 체크인', 'invalid-qr', 'INVALID_QR'],
  ]) {
    await page.getByRole('button', { name: new RegExp(label) }).click();
    await page.getByLabel('기능별 예외 시나리오').selectOption(scenario);
    await expect(page.getByText(code, { exact: true })).toBeVisible();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('malformed deep links recover safely, data panel works', async ({ page }) => {
  await page.goto('/?feature=wrong&mode=bad');
  await expect(page.getByTestId('result-status')).toHaveText('Success');
  await page.getByRole('button', { name: /시나리오 데이터 살펴보기/ }).click();
  await expect(page.locator('pre')).toContainText('rehearsal:dashboard:1');
});
test('capture normal and error views for visual review', async ({ page }, testInfo) => {
  await expect(page.getByTestId('result-status')).toHaveText('Success');
  await page.screenshot({ path: testInfo.outputPath('normal.png'), fullPage: true });
  await page.getByLabel('기능별 예외 시나리오').selectOption('dashboard-timeout');
  await expect(page.getByText('REQUEST_TIMEOUT', { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('error.png'), fullPage: true });
});
