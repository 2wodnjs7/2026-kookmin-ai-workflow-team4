# 백엔드 테스트 가이드

회의 지식 허브 백엔드(`/api/meetings`·`/api/actions`·`/api/search`)의 검증 절차와 최근 통합 테스트 기록.
계약 단일 소스는 [`../docs/api-contract.md`](../docs/api-contract.md), 실행법은 [`README.md`](README.md) 참고.

> 모든 검증은 **mock 모드로 먼저** 수행한다(`.env`에 `GEMINI_API_KEY`가 없으면 자동 mock, smoke 류는 키가 있어도 강제로 mock).
> Windows PowerShell에서 npm 출력이 안 잡히면 `cmd /c "... 2>&1"` 또는 Git Bash로 실행한다.

## 1. 준비

```bash
cd backend
npm install                 # 또는 npm ci
npm run db:generate         # prisma generate
npm run db:push             # SQLite 스키마 동기화 (dev.db)
```

## 2. 자동 검증 (CI와 동일 — 셋 다 통과해야 함)

```bash
npm run typecheck           # tsc --noEmit
npm run smoke               # meetings: POST 생성 / GET 목록·단건 / 404 / 400
npm run smoke:be2           # actions: 목록·필터·상태 토글·400·404 + search
```

- `smoke`(BE-1 영역)·`smoke:be2`(BE-2 영역) 모두 인-프로세스로 앱을 띄워 HTTP 경로·에러 포맷·계약 정합을 검증한다.
- `.github/workflows/backend-ci.yml`가 PR마다 위 3개를 실행한다.

## 3. 시연 데이터 + 수동 E2E

```bash
npm run db:seed             # ⚠️ 파괴적 리셋: 기존 데이터 삭제 후 가상인물 회의 3건/액션 7건 재생성
npm start                   # 또는 npm run dev — http://localhost:8080
```

서버 기동 후 다음을 호출해 응답이 `docs/api-contract.md`와 일치하는지 확인한다(`X`는 실제 id로 치환).

| 호출 | 기대 |
|---|---|
| `GET /health` | `200` `{status:"ok", llmMode:"mock"\|"live"}` |
| `GET /api/meetings` | `200` 봉투 `{meetings,total,limit,offset}`. 목록 항목엔 `rawText` 없음, `actionItemCount` 포함 |
| `GET /api/meetings/X` | `200` 단건 full(`rawText` + `actionItems[]`) |
| `POST /api/meetings {"rawText":"..."}` | `201`, `minutes{summary,keyPoints,agenda,discussion,decisions}`, `actionItems: []`(자동 생성 안 함, #28), 헤더 `X-LLM-Mode` |
| `GET /api/actions?status=todo&limit=50` | `200` 봉투 `{actions,total,...}`, 각 항목에 `meeting{id,title,date}` |
| `PATCH /api/actions/X {"status":"done"}` | `200`, 상태 토글 |
| `GET /api/search?q=검색` | `200` 봉투 `{query,meetings,total,...}` |
| `POST /api/meetings {}` | `400` `VALIDATION_ERROR` (rawText 필수) |
| `GET /api/meetings/none` | `404` `NOT_FOUND` |
| `PATCH /api/actions/X {"status":"in_progress"}` | `400` `VALIDATION_ERROR` (계약은 `todo`\|`done`만 허용) |

> 에러 응답 형식은 모두 `{error:{code,message}}` (계약 §0).
> 400/404 케이스는 **의도된 음성(negative) 테스트** — 해당 코드가 나오는 것이 정상(PASS)이다.

## 4. 최근 검증 기록

### 2026-06-30 — main `ff028ef`(PR #17 머지) 기준, 전체 PASS

| 단계 | 결과 |
|---|---|
| `typecheck` / `smoke` / `smoke:be2` | ✅ 통과 |
| `GET /api/meetings`·`/api/meetings/:id` | ✅ 봉투·단건 계약 일치 |
| `POST /api/meetings` (live) | ✅ `201`, `X-LLM-Mode: live`, `minutes` 구조 일치 |
| `GET /api/actions`(필터)·`PATCH`(토글) | ✅ 봉투·`meeting` 컨텍스트·상태 변경 정상 |
| `GET /api/search?q=` | ✅ 봉투·`query` 에코 |
| 에러 `400`/`404`/`400(in_progress)` | ✅ 코드·형식 일치 |

- **백엔드는 `docs/api-contract.md`와 완전 일치. 런타임/데이터 버그 없음.**
- **FE 연동은 미완**: 화면 3페이지가 아직 목업 데이터를 쓰고 `frontend/src/api/command.ts`가 계약과 어긋난다(검색 `POST`↔`GET`, meetings 배열↔봉투 등). → 이슈 #19(FE 3페이지 실제 API 연동) 후속 필요. (구 #14는 closed)
