# backend

회의 지식 허브의 백엔드 API 서버.

- 회의록 생성 엔진(전사본 → LLM → 회의록·액션아이템), 액션아이템 트래커, 회의 검색 API.
- 스택: **Express + TypeScript + Prisma(SQLite)**. LLM은 `src/server/ai/llm.ts` 어댑터로 격리(키 없으면 mock).
- 포트: `:8080` (FE의 `VITE_SERVER_URL` 가정과 일치). Vite(`:5173`) CORS 허용.
- 데이터 계약: `prisma/schema.prisma`. API 명세: [`../docs/api-contract.md`](../docs/api-contract.md).

## 실행

```bash
cp .env.example .env        # 필요시 값 수정 (LLM_API_KEY 없으면 mock 모드)
npm install
npm run db:generate         # prisma generate
npm run db:push             # SQLite 스키마 동기화 (dev.db 생성)
npm run dev                 # http://localhost:8080
```

## 검증

```bash
npm run typecheck           # tsc --noEmit
npm run smoke               # mock 모드 HTTP 스모크 테스트(POST/GET/404/400)
```

## 구조 (소유: BE-1 / BE-2)

```
src/
├── index.ts                # 서버 부트스트랩 (공통)
├── app.ts                  # Express 앱 빌더 (공통)
└── server/
    ├── db.ts               # Prisma client 싱글톤 (공통)
    ├── http/errors.ts      # ApiError + 중앙 에러 핸들러 (공통)
    ├── ai/                 # llm.ts 어댑터·프롬프트·mock/live — BE-1
    ├── meetings/           # 회의 생성/조회 서비스·라우터 — BE-1
    ├── actions/            # 트래커 — BE-2 (예정)
    └── search/             # 검색 — BE-2 (예정)
```

> 공통 셋업(부트스트랩·Prisma·에러)은 BE-2의 "공통 셋업" 영역과 겹친다. PR로 합의 후 진행.
