# AGENTS.md — 팀 공용 에이전트 컨텍스트

> 이 레포에서 작업하는 모든 AI 에이전트(Kiro / Codex / Claude Code)가 먼저 읽는 공용 맥락입니다.
> 짧게 유지합니다. 상세 내용은 아래 링크 문서로 위임합니다.
> 사람용 협업 규칙은 [docs/team-workflow.md](docs/team-workflow.md), 제품 소개는 [README.md](README.md).

## 프로젝트

회의 지식 허브(Meeting Intelligence Hub). 회의 전사본을 붙여넣으면 AI가 ①구조화 회의록 생성 ②액션아이템 추적 ③과거 회의 검색을 제공하는 팀용 서비스.

- 2026 국민대 AI Workflow 해커톤. 로컬 시연(배포 없음).
- 아키텍처: **프론트엔드와 백엔드를 분리**한 2개 앱(별도 프로세스·포트, CORS).
  - 프론트엔드: Vite + React + TypeScript (SPA). API는 백엔드 서버를 호출.
  - 백엔드: **Express + TypeScript + Prisma(SQLite)** + LLM 어댑터, 포트 **`:8080`** (FE 가정과 일치, Vite `:5173` CORS 허용).
- LLM은 `llm.ts` 어댑터 뒤로 격리. 키 없으면 mock 모드로 동작.
- 프론트·백 사이의 유일한 접점은 **데이터 계약(`backend/prisma/schema.prisma`) + API 계약(`docs/api-contract.md`)**. 양쪽 응답/타입은 이 계약과 정확히 일치해야 한다.

## 프로젝트 구조 (프론트/백 분리 — 팀 합의)

```
/
├── backend/                 # API 서버 (BE-1, BE-2)
│   ├── prisma/schema.prisma # 데이터 계약 (단일 소스)
│   ├── src/server/
│   │   ├── ai/              # llm.ts 어댑터·프롬프트 — BE-1
│   │   ├── meetings/        # BE-1
│   │   ├── actions/         # BE-2
│   │   └── search/          # BE-2
│   └── (api 라우트)/        # /api/meetings(BE-1), /api/actions·/api/search(BE-2)
├── frontend/                # Vite + React SPA — FE
│   └── src/
│       ├── pages/           # 화면 3페이지(생성/트래커/검색)
│       ├── components/      # 공통 컴포넌트
│       └── api/             # API 클라이언트(백엔드 호출)
└── docs/                    # 팀 문서 (api-contract.md 등)
```

> 아래 "분담"의 소유 경로는 위 `backend/`·`frontend/` 기준이다.
> FE 세부 규칙(라우팅·테마·API 호출 컨벤션)은 [frontend/AGENTS.md](frontend/AGENTS.md) 참고.

## 데이터 계약 (팀이 합의한 단일 공유 스키마)

`backend/prisma/schema.prisma`가 유일한 공유 합의 파일이다. 이 모양을 임의로 바꾸지 말 것(변경은 PR로 합의).

```
Meeting    { id, title, date, attendees[], rawText,
             minutes(JSON: 안건[], 논의요약, 결정사항[]), createdAt }
ActionItem { id, meetingId, content, assignee, dueDate,
             status('todo'|'done'), createdAt }
```

API 응답은 위 스키마와 정확히 일치해야 한다. mock 응답과 실제 LLM 응답의 스키마도 동일해야 한다.

## 분담 (소유 경계 — 남의 폴더를 임의 수정하지 말 것)

| 역할 | 담당 | 소유 |
|---|---|---|
| BE-1 | 회의록 생성 엔진 (LLM·AWS 격리) | `backend/src/server/ai/*`, `backend/src/server/meetings/*`, 백엔드 `/api/meetings` 라우트 |
| BE-2 | 트래커·검색 + 공통 셋업(스키마·마이그레이션·시드) | `backend/src/server/actions/*`, `backend/src/server/search/*`, 백엔드 `/api/actions`·`/api/search` 라우트 |
| FE | 화면 3페이지(생성/트래커/검색) | `frontend/src/pages/*`, `frontend/src/components/*`, `frontend/src/api/*` |

## 작업 규칙

- 협업 사이클(브랜치·커밋·PR·fetch)은 [docs/team-workflow.md](docs/team-workflow.md)를 따른다.
- 커밋 메시지는 타입 프리픽스 필수: `feat/fix/docs/style/refactor/test/chore`. 논리적 단위마다 커밋.
- 작업은 자기 소유 폴더 위주로. 공유 파일(schema 등) 변경은 PR로 합의.
- AI가 만든 변경도 사람이 `git diff`로 확인 후 커밋한다.

## 금지 / 주의

- 비밀정보(API 키, 자격증명, `.env`)를 커밋하지 않는다.
- 회의 데이터의 PII(참석자 실명 등)를 로그·문서·커밋에 노출하지 않는다.
- 노트에 없는 사실을 지어내지 않는다. 회의록의 모호한 담당자/기한은 `[담당자 확인 필요]` / `미정` 플레이스홀더로 남긴다.
- 개인 LLM-Wiki는 개인 로컬 기억이며 이 레포에 올리지 않는다. 작업 맥락 연결은 PR 본문의 "개인 LLM-Wiki에 남긴 기록"으로 한다.

## 먼저 읽을 파일

1. [README.md](README.md) — 제품 개요·실행법
2. [docs/team-workflow.md](docs/team-workflow.md) — git 협업 규칙
3. `backend/prisma/schema.prisma` — 데이터 계약 (단일 공유 스키마)
