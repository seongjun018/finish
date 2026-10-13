# 공식 저장소로 이식하기

대상: `paichai-nexus/nexus-event-platform` · 담당: 박성준

## 복사 범위

| 파일 | 처리 |
| --- | --- |
| `features/qa/` | QA 모듈 전체 이식 |
| `app/admin/qa/page.tsx` | QA 진입점 추가, 팀 인증 코드로 서버 권한 검사 연결 |
| `tests/rehearsal.spec.ts` | 팀 Playwright 구성에 맞게 경로 조정 |
| `docs/QA-CHECKLIST.md` | 재현 절차 공유 |
| `app/layout.tsx`, `app/page.tsx`, `app/globals.css` | 개인 데모용, 팀 파일을 덮어쓰지 않음 |
| `package.json`, lock, tsconfig, Next/Tailwind/CI 설정 | 개인 프로젝트 파일로 덮어쓰지 않음 |

필요 패키지: `zod`. 팀의 React/Next.js 환경을 사용하며, 모듈 CSS는 `qa` 접두어로 분리되어 있습니다. `StateView`만 사용하는 경우 해당 화면 또는 공통 레이아웃에서 `features/qa/qa.css`를 import하세요. 모듈 CSS는 Tailwind 유틸리티에 의존하지 않습니다.

## 팀원 화면에서 상태 화면 사용

```tsx
'use client';
import { StateView } from '../../features/qa';
import '../../features/qa/qa.css';
import type { LoadResult } from '../../features/qa';

export function Example({ result, retry }: {
  result: LoadResult;
  retry: () => void;
}) {
  return (
    <div className="qa-shell">
      <StateView result={result} onRetry={retry}>
        <div>팀원이 개발한 정상 화면</div>
      </StateView>
    </div>
  );
}
```

`StateView`는 `success`에서 children을 보여줍니다. 실제 API 응답을 `LoadResult`로 변환하여 전달하세요. 운영 화면에서는 `onReset`을 주지 않으면 리허설 초기화 버튼이 나오지 않습니다. 오류에는 내부 예외나 토큰을 그대로 표시하지 말고 사용자용 문구를 전달하세요.

## Mock과 실제 데이터 경계

`loadQaData(request, liveAdapter?)`는 mock이면 매 요청마다 새로운 가상 객체를 생성합니다. `live`인데 adapter가 없으면 `LIVE_NOT_CONFIGURED`를 반환합니다. 실제 모드에서 Mock 데이터로 몰래 대체하지 않습니다.

```ts
import type { QaAdapter } from '../../features/qa';

// fetchMyFeature는 팀이 제공하고 서버에서 권한을 검증하는 API 함수입니다.
export const adapter: QaAdapter = {
  async load({ feature, signal }) {
    const records = await fetchMyFeature(feature, { signal });
    return records.map(record => ({
      id: record.id,
      title: record.displayName,
      detail: record.summary,
      status: record.statusLabel,
    }));
  },
};
```

위 코드는 연결 형태를 설명하는 예시입니다. `fetchMyFeature`와 실제 반환 타입은 아직 존재하지 않습니다. 각 기능 담당자의 API 계약에 맞춰 작성해야 합니다. `useQaData(selection, attempt, adapter)`에 adapter를 주입할 수 있습니다. 현재 `RehearsalLab`은 의도적으로 adapter 없이 실행됩니다.

## 동작 계약

- `useQaData`가 강제 loading/offline, 브라우저 연결 상태, 요청 취소를 처리합니다.
- 실제 브라우저 offline이 강제 상태보다 우선합니다. 재시도해도 offline이면 성공으로 표시하지 않습니다.
- `navigator.onLine`은 네트워크 인터페이스의 상태일 뿐 서버 접속을 보장하지 않습니다. 서버 오류도 별도로 처리해야 합니다.
- 공유 URL에 실제 참가자 데이터는 넣지 않습니다. 선택한 기능·상태·시나리오·모드만 포함합니다.
- 실제 데이터와 리허설 데이터는 팀 서버에서 명확히 분리해야 합니다. URL 또는 Mock 토글은 보안 경계가 아닙니다.
- 저장 요청 재시도는 서버의 idempotency/중복 방지 정책을 따라야 합니다. 이 도구는 저장 요청을 실제로 보내지 않습니다.
- 브라우저에서 단순히 숨기는 것으로 관리자 권한 검사를 대체할 수 없습니다.

## 이식 후 검증

1. 팀 저장소 최신 main에서 `feature/<팀-issue번호>-qa-rehearsal` 브랜치 생성.
2. 위 복사 대상만 이식하고 필요한 dependency만 추가.
3. 관리자 인증과 리허설 환경 노출 조건을 서버에서 연결.
4. 팀 공통 스타일/라우팅에서 충돌 없이 열리는지 확인.
5. 각 팀원의 정상 화면에 공용 상태 화면 연결, 실패 시 입력 데이터 유지 검증.
6. typecheck / 테스트 / production build 실행.
7. 실제 수행한 결과와 스크린샷을 PR에 작성. 운영 DB 미연결 상태를 명시하고 리뷰 후 병합.
