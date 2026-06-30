# backend

회의 지식 허브의 백엔드.

- 회의록 생성 엔진(전사본 → LLM → 회의록·액션아이템), 액션아이템 트래커, 회의 검색 API.
- 스택: (정할 것) Next.js API / Node 등 + SQLite(Prisma) + LLM 어댑터(`llm.ts`).
- 데이터 계약: `prisma/schema.prisma` (팀 합의 단일 소스). API 명세는 `docs/api-contract.md` 참고.

자세한 분담·규칙은 루트 [AGENTS.md](../AGENTS.md), [docs/team-workflow.md](../docs/team-workflow.md) 참고.
