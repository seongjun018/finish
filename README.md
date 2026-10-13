# NEXUS QA · Error State · Rehearsal

박성준 담당 기능의 개인 개발 저장소입니다. 행사 전에 **Loading / Empty / Error / Offline** 화면과 복구 흐름을 재현하는 Next.js 프로토타입입니다.

공식 프로젝트: https://github.com/paichai-nexus/nexus-event-platform

## 시작하기

Node.js 22 LTS와 Git을 설치한 후 터미널에서 실행합니다.

```bash
git clone --branch feature/1-qa-rehearsal https://github.com/seongjun018/finish.git
cd finish
npm ci
npm run dev
```

브라우저에서 http://localhost:3000/admin/qa 를 엽니다. 루트 주소 `/`에서도 같은 도구를 볼 수 있습니다. 기능 코드는 `feature/1-qa-rehearsal` 브랜치에 있으며, 리뷰 후 병합하기 전까지 `main`에는 없습니다.

## 사용 방법

1. 왼쪽 메뉴에서 테스트할 기능을 선택합니다.
2. 정상 / 로딩 / 빈 데이터 / 오류 / 오프라인 버튼으로 화면을 바꿉니다.
3. 기능별 예외 시나리오에서 중복 입장, 투표 마감, 심사 저장 실패 등을 선택합니다.
4. 일시적 오류는 **다시 시도**하면 복구됩니다. 중복 처리·권한 오류에는 재시도 대신 해결 안내가 표시됩니다.
5. **Mock Data**를 끄면 실제 API 미연결 오류가 표시됩니다. 실제 DB 요청은 없습니다.
6. **리허설 초기화**로 현재 기능의 정상 Mock 상태로 돌아갑니다.
7. **시나리오 링크 복사**로 선택한 설정을 공유합니다. 재시도 횟수는 URL에 저장하지 않아 새로 열면 최초 실패부터 재현됩니다.

로딩 상태는 의도적으로 고정됩니다. 정상 상태 또는 초기화 버튼으로 해제하세요. 공통 오류는 재시도해도 유지됩니다. 자동 복구를 확인하려면 `현황 조회 지연`, `심사 저장 실패`, `파일 생성 실패`, `행사 저장 실패`를 선택하세요.

## 구현 범위

- 재사용 가능한 `StateView`: 로딩 스켈레톤, 빈 데이터 안내, 오류와 재시도, 오프라인 안내
- 9개 기능, 5개 공통 화면 상태, 12개 기능별 장애 시나리오
- Mock / 실제 API adapter 경계, 리허설 배너, 가상 데이터 초기화
- 브라우저 online/offline 감지와 연결 복구 시 재조회
- AbortController를 통한 이전 요청 취소, 전환 중 이전 데이터 표시 방지
- Zod 기반 URL 검증, 모바일 대응, 키보드 포커스, 상태 알림
- Vitest 단위 테스트, Playwright 데스크톱/모바일 테스트, GitHub Actions

## 구현하지 않은 범위

- 다른 팀원의 실제 정상 화면, QR 스캔, 투표·심사 저장, 집계 계산, 추첨, 파일 생성
- Supabase, 실제 로그인, 서버 권한 검증 및 RLS
- 운영 DB와 리허설 DB의 물리적 분리: 현재는 브라우저 메모리에 생성한 가상 데이터만 존재합니다.
- 오프라인 변경사항 저장·자동 재전송

정상 미리보기는 fixture 목록이며 실제 업무 기능을 실행하지 않습니다. 심사 저장 실패도 상태 재현이며 실제 심사 폼의 입력 보존은 아직 검증하지 않았습니다. 인증 시나리오는 권한 UI 예시이며 접근 제어가 아닙니다. `/admin/qa`는 이 개인 프로토타입에서 공개입니다. 팀 서비스에 연결할 때는 서버에서 관리자 권한을 확인하고 리허설 전용 환경에서만 노출하세요.

## 파일 구조

```text
app/
  page.tsx                  # 개인 프로토타입 진입점
  admin/qa/page.tsx          # 팀 이식용 진입점
features/qa/
  rehearsal-lab.tsx         # 테스트 도구 화면
  state-view.tsx            # 공용 상태 화면
  use-qa-data.ts            # 로딩·취소·오프라인 처리
  service.ts               # Mock / 실제 adapter 경계
  scenarios.ts             # 기능 목록, 장애 시나리오, 가상 데이터
  types.ts                 # 타입 및 URL 검증
  qa.css                   # qa 접두어를 사용한 스타일
  service.test.ts          # 단위 테스트
tests/rehearsal.spec.ts    # 브라우저 시나리오
docs/INTEGRATION.md        # 팀 이식 안내
docs/QA-CHECKLIST.md       # 재현 절차와 실제 검증 결과
```

## 검증 명령

```bash
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

`test:e2e`는 빌드된 앱을 자동 실행합니다. Linux에서 브라우저 의존성이 없다면 `npx playwright install --with-deps chromium`을 사용하세요.

## 팀 제출

공식 저장소의 기여 절차를 따릅니다. 개인 저장소의 기능 브랜치와 PR에서 먼저 검토하고, 팀 저장소의 Issue 번호로 별도 브랜치를 만들어 담당 파일만 이식하세요. 팀 `main`에 직접 push하거나 이 개인 프로젝트의 설정 파일을 덮어쓰지 않습니다. 자세한 파일 목록과 adapter 예시는 [이식 안내](docs/INTEGRATION.md)에 있습니다.
