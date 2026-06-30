# 팀 워크플로우 — AI Agent와 함께하는 협업 규칙

2026 국민대 AI Workflow 팀 4의 협업 워크플로우 문서입니다.
여러 팀원이 각자 AI Agent를 쓰면서 한 레포에서 충돌 없이 일하기 위한 규칙을 정리합니다.

> 이 문서는 팀 공유 규칙입니다. 바꾸고 싶으면 직접 수정하지 말고 PR로 제안해 팀 리뷰 후 머지합니다.

## 1. 저장소 3계층 (upstream / origin / local)

| 계층 | 위치 | 역할 |
|---|---|---|
| upstream | `nxtcloud-edu/2026-kookmin-ai-workflow-team4` | 팀 공용 원본. 최종 결과가 모이는 곳. 직접 push 금지(PR로만). |
| origin | `{각자}/2026-kookmin-ai-workflow-team4` (fork) | 내 fork. 내 브랜치를 push하는 곳. |
| local | 내 PC의 클론 | 실제 작업 공간. |

### 처음 세팅 (각자 1회)

```bash
# 1. 내 fork(origin)를 클론
git clone https://github.com/{내-github-id}/2026-kookmin-ai-workflow-team4.git
cd 2026-kookmin-ai-workflow-team4

# 2. 공용 원본을 upstream으로 등록
git remote add upstream https://github.com/nxtcloud-edu/2026-kookmin-ai-workflow-team4.git

# 3. 확인 (origin=내 fork, upstream=공용)
git remote -v
```

## 2. 브랜치 컨벤션

```
{cohort}/{github-id}/{agent}/{task}
예: 2026-06-ai-workflow/2wodnjs7/kiro/meeting-api-skeleton
```

- `cohort`: `2026-06-ai-workflow`
- `agent`: 사용한 AI 에이전트 (kiro / codex / claude 등)
- `task`: 작업 내용을 짧게

작업 시작 전 항상 최신 upstream에서 분기:

```bash
git fetch upstream
git switch -c 2026-06-ai-workflow/{id}/{agent}/{task} upstream/main
```

## 3. Commit / Push / PR / Fetch 사이클

```
작업 → commit → origin push → upstream에 PR → 리뷰 → 머지 → fetch로 동기화
```

### 커밋 주기

- **논리적 단위마다 커밋한다.** 기능/수정 하나가 동작하는 최소 단위에서 끊는다.
- 한 커밋 = 한 가지 일. 여러 변경을 한 커밋에 몰지 않는다(리뷰·되돌리기가 쉬워진다).
- 작업을 중단하기 전에는 동작하는 상태에서 커밋해 이어달리기 가능하게 한다.

### 커밋 메시지 (타입 프리픽스 필수)

```
<type>: <짧은 요약>
예: feat: 회의록 생성 API 골격 추가
    docs: 팀 워크플로우 문서 추가
```

허용 타입: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`

> AI가 만든 변경도 사람이 `git diff`로 확인하고 커밋합니다.

### Push & PR

```bash
git push -u origin {브랜치명}
gh pr create --repo nxtcloud-edu/2026-kookmin-ai-workflow-team4 --base main --fill \
  --assignee @me \
  --reviewer {소유영역 담당자}
# 예: 백엔드 meetings·계약 변경 → BE-2 리뷰
#   --reviewer Chyopriushy
# 계약·FE까지 닿으면 콤마로 여러 명
#   --reviewer Chyopriushy,xxrthscrclz
```

- **assignee는 항상 작성자 본인(`@me`)** — PR 책임자를 명확히 해 추적·필터를 쉽게 한다.
  (assignee는 "책임자"일 뿐 리뷰어가 아니다. reviewer는 아래처럼 따로 지정한다.)
- **reviewer는 변경이 닿는 소유 영역의 담당자**를 지정한다(§6 테이블의 github-id 사용):
  - 백엔드 공통·계약 변경 → BE-2
  - 계약·FE 영향 → FE
  - **`schema.prisma`·마이그레이션·시드(`backend/prisma/*`) 변경 → BE-2 필수**(공통 셋업 소유).
  - 단, **스키마 변경은 BE-1·FE도 소비**하므로 이 경우 reviewer에 BE-1·FE도 함께 넣는다(전원 합의).
  - 둘 이상 영역에 닿으면 해당 담당자를 모두 넣는다.
- reviewer는 upstream(`nxtcloud-edu`) 협업자여야 지정된다.

### 최신화 (fetch)

```bash
git fetch upstream
git merge upstream/main   # 또는 rebase
```

### 충돌 방지

- 같은 파일을 여러 명이 동시에 수정하면 충돌이 난다. 초반엔 각자 맡은 파일/폴더만 수정한다.
- 공유 기록은 지우지 말고 새 커밋으로 되돌린다(`git revert <hash>`).

## 4. PR 템플릿

```md
## 변경 요약
-

## 사용한 에이전트
-

## AI에게 맡긴 일
-

## 사람이 검토한 것
-

## 개인 LLM-Wiki에 남긴 기록
-

## 확인한 것
- [ ] 내 파일 또는 팀에서 합의한 파일만 수정했다
- [ ] 커밋 메시지에 타입 프리픽스가 있다
- [ ] 민감정보(키·실명 등)가 없다
```

## 5. git 기록 + 개인 LLM-Wiki로 AI에 Context 전달

이 프로젝트는 두 층의 기록을 분리한다.

| 공간 | 무엇 | 공유 |
|---|---|---|
| 팀 GitHub 레포 | 코드, 스키마, PR, 합의된 기록 | 팀 전체 |
| 개인 LLM-Wiki | 내가 이해한 배경·결정·진행 맥락, 에이전트에게 다시 읽힐 장기기억 | 개인 (로컬) |

- 개인 LLM-Wiki는 **팀 레포에 올리지 않는다**(개인 로컬 또는 개인 백업 레포).
- 두 기록의 연결은 **PR 본문의 `## 개인 LLM-Wiki에 남긴 기록` 칸**으로 한다.
- 새 작업/새 에이전트를 시작할 때는 ① git log·PR(팀 합의 맥락) ② 개인 LLM-Wiki의 progress·decision-log(내 작업 맥락)를 먼저 읽혀 context를 복원한다.

## 6. 팀원별 AI 워크플로우 (각자 채우기)

| github-id | 역할 | 주 사용 에이전트 | 개인 LLM-Wiki 운영 방식 |
|---|---|---|---|
| 2wodnjs7 | BE-1 (회의록 생성 엔진 / LLM·AWS) | Kiro | 10-projects에 프로젝트별 폴더, 작업마다 progress/decision/knowledge 갱신 |
| Chyopriushy | BE-2 (트래커·검색 / 공통 셋업) | | |
| xxrthscrclz | FE (화면 3페이지) | Cursor | |

> github-id는 PR #6/리뷰에서 본인들이 밝힌 역할 기준으로 채웠습니다. 틀리면 본인이 PR로 수정하세요.
