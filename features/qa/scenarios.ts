import type { FeatureId, Fixture, Scenario, Selection } from './types';
import { selectionSchema } from './types';

export const features: { id: FeatureId; label: string; subtitle: string }[] = [
  { id: 'dashboard', label: '관리자 대시보드', subtitle: '입장 · 투표 · 심사 현황' },
  { id: 'check-in', label: 'QR 체크인', subtitle: '입장 확인과 중복 방지' },
  { id: 'voting', label: '청중평가', subtitle: '투표 자격과 마감 확인' },
  { id: 'judging', label: '심사위원 평가', subtitle: '심사 저장과 제출 확인' },
  { id: 'scoring', label: '점수 집계', subtitle: '집계 준비 상태 확인' },
  { id: 'prize', label: '경품 추첨', subtitle: '대상자와 추첨 상태 확인' },
  { id: 'export', label: '결과 내보내기', subtitle: '결과 파일 생성 상태' },
  { id: 'event', label: '행사 · 팀 관리', subtitle: '등록 정보와 저장 상태' },
  { id: 'auth', label: '인증 · 권한', subtitle: '로그인과 접근 상태' },
];

export const scenarios: Scenario[] = [
  { id: 'dashboard-timeout', feature: 'dashboard', label: '현황 조회 지연', description: '요청 시간이 초과되어 최신 현황을 표시하지 못합니다.', code: 'REQUEST_TIMEOUT', recovery: '잠시 후 다시 시도하세요. 이전 수치를 최신 수치로 오인하지 않도록 확인합니다.', retryable: true, recoversOnRetry: true },
  { id: 'duplicate-check-in', feature: 'check-in', label: '중복 입장', description: '이미 입장 처리된 테스트 참가자입니다.', code: 'ALREADY_CHECKED_IN', recovery: '기존 입장 기록을 확인하고 재입장 여부를 운영자에게 문의하세요.', retryable: false },
  { id: 'invalid-qr', feature: 'check-in', label: '유효하지 않은 QR', description: '행사에 등록되지 않은 테스트 QR입니다.', code: 'INVALID_QR', recovery: '올바른 행사 QR인지 확인한 뒤 다시 스캔하세요.', retryable: false },
  { id: 'vote-closed', feature: 'voting', label: '투표 마감', description: '청중평가 시간이 종료되었습니다.', code: 'VOTING_CLOSED', recovery: '운영자에게 투표 진행 상태를 확인하세요.', retryable: false },
  { id: 'duplicate-vote', feature: 'voting', label: '중복 투표', description: '이 발표팀의 청중평가를 이미 제출했습니다.', code: 'ALREADY_VOTED', recovery: '제출 기록을 확인하세요. 반복 제출하지 않습니다.', retryable: false },
  { id: 'judge-save-failed', feature: 'judging', label: '심사 저장 실패', description: '테스트 심사 점수 저장이 실패했습니다. 저장 완료로 표시하지 않습니다.', code: 'SAVE_FAILED', recovery: '입력 내용을 확인한 후 다시 시도하세요. 실제 입력 보존은 심사 화면 연결 시 확인해야 합니다.', retryable: true, recoversOnRetry: true },
  { id: 'incomplete-scores', feature: 'scoring', label: '심사 미제출', description: '미제출 심사가 있어 최종 결과를 확정할 수 없습니다.', code: 'SCORES_INCOMPLETE', recovery: '미제출 심사위원의 제출 상태를 확인하세요.', retryable: false },
  { id: 'no-eligible-participants', feature: 'prize', label: '추첨 대상 없음', description: '입장이 확인된 추첨 가능 테스트 참가자가 없습니다.', code: 'NO_ELIGIBLE_PARTICIPANTS', recovery: '입장 여부와 추첨 조건을 확인하세요.', retryable: false },
  { id: 'export-failed', feature: 'export', label: '파일 생성 실패', description: '테스트 결과 파일을 생성하지 못했습니다.', code: 'EXPORT_FAILED', recovery: '결과 조회 권한과 네트워크를 확인한 후 다시 시도하세요.', retryable: true, recoversOnRetry: true },
  { id: 'event-save-failed', feature: 'event', label: '행사 저장 실패', description: '행사 변경 내용을 저장하지 못했습니다.', code: 'EVENT_SAVE_FAILED', recovery: '입력 내용을 확인하고 다시 시도하세요.', retryable: true, recoversOnRetry: true },
  { id: 'session-expired', feature: 'auth', label: '세션 만료', description: '로그인 세션이 만료되었습니다.', code: 'SESSION_EXPIRED', recovery: '실제 서비스에서는 다시 로그인한 후 작업을 계속하세요.', retryable: false },
  { id: 'permission-denied', feature: 'auth', label: '접근 권한 없음', description: '이 화면을 볼 수 있는 권한이 없습니다.', code: 'FORBIDDEN', recovery: '필요한 권한이 있는 계정인지 운영자에게 확인하세요.', retryable: false },
];

const fixtureDetails: Record<FeatureId, [string, string, string][]> = {
  dashboard: [['입장 현황', '테스트 참가자 24명 / 30명', '입장 진행'], ['청중평가 현황', '테스트 응답 18건', '집계 중'], ['심사 현황', '테스트 심사 2건 / 3건', '1건 대기']],
  'check-in': [['테스트 참가자 A', '가상 QR: QA-001 · 실제 참가자 아님', '입장 완료'], ['테스트 참가자 B', '가상 QR: QA-002 · 실제 참가자 아님', '입장 대기']],
  voting: [['테스트 발표팀 A', '가상 참가자 A · 투표 가능', '평가 진행'], ['테스트 발표팀 B', '가상 참가자 A · 제출된 예시', '제출 완료']],
  judging: [['테스트 심사 A', '가상 심사위원 · 발표팀 A', '임시 저장'], ['테스트 심사 B', '가상 심사위원 · 발표팀 B', '제출 완료']],
  scoring: [['테스트 발표팀 A', '집계 UI 확인용 · 점수 계산 없음', '수신 완료'], ['테스트 발표팀 B', '가상 평가 데이터 · 순위 확정 없음', '수신 완료']],
  prize: [['테스트 참가자 A', 'QA-001 · 입장 확인 예시', '추첨 가능'], ['테스트 참가자 C', 'QA-003 · 당첨 이력 예시', '기당첨 제외']],
  export: [['테스트 결과 목록', '가상 데이터 3건 · 실제 파일 생성 없음', '조회 완료']],
  event: [['테스트 행사', '리허설 전용 · 실제 행사와 무관', '준비 중'], ['테스트 발표팀 A', '가상 팀 정보', '등록 완료']],
  auth: [['테스트 관리자', '권한 표시 예시 · 실제 인증 아님', '관리자'], ['테스트 참가자', '권한 표시 예시 · 서버 접근 없음', '참가자']],
};
export function createFixtures(feature: FeatureId): Fixture[] {
  return fixtureDetails[feature].map(([title, detail, status], index) => ({ id: `rehearsal:${feature}:${index + 1}`, title, detail, status }));
}
export const defaultSelection: Selection = { feature: 'dashboard', state: 'success', scenario: '', mode: 'mock' };
export function parseSelection(search: string): Selection {
  const params = new URLSearchParams(search);
  const parsed = selectionSchema.safeParse({ feature: params.get('feature') ?? 'dashboard', state: params.get('state') ?? 'success', scenario: params.get('scenario') ?? '', mode: params.get('mode') ?? 'mock' });
  if (!parsed.success) return { ...defaultSelection };
  const result = parsed.data;
  const scenario = scenarios.find(item => item.id === result.scenario && item.feature === result.feature);
  return { ...result, scenario: scenario?.id ?? '', state: scenario ? 'error' : result.state };
}
export function selectionSearch(selection: Selection): string {
  return new URLSearchParams(selection).toString();
}
