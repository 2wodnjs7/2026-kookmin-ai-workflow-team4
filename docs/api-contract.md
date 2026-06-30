# API 계약 (api-contract.md)

> 회의 지식 허브(Meeting Intelligence Hub)의 회의 관련 API 계약 초안입니다.
> 이 문서는 `backend/prisma/schema.prisma`(데이터 계약)와 **정확히 일치**해야 합니다.
> 변경은 임의로 하지 말고 PR로 합의합니다(AGENTS.md 규칙).

## 0. 공통 규칙

- Base URL: 백엔드 API 서버 (포트는 팀 확정 필요). 프론트엔드 `.env`(`VITE_SERVER_URL`)가
  백엔드를 `http://localhost:8080`으로 가정한다. (Vite dev 서버 `:5173`과 혼동 주의 — 이 값은 FE가 호출하는 BE 주소)
  프론트엔드(Vite)는 별도 오리진이므로 백엔드에 **CORS 허용**이 필요하다.
- 모든 요청/응답 본문은 `application/json` (UTF-8).
- 날짜·시각은 **ISO 8601 문자열**(예: `"2026-06-30T09:00:00.000Z"`)로 주고받는다.
- ID는 문자열(`cuid`).
- **mock 응답과 실제 LLM 응답의 스키마는 동일하다.** 키 없음(mock 모드)일 때도
  아래와 똑같은 필드 구조로 응답한다. 클라이언트는 두 모드를 구분할 필요가 없다.
  (구분이 필요하면 응답이 아니라 헤더 `X-LLM-Mode: mock|live`로만 노출한다 — 본문 스키마는 불변.)

### 엔티티 스키마 (schema.prisma와 1:1 대응)

```jsonc
// Meeting
{
  "id": "clxxxxxxxxxxxxxx",
  "title": "2026 Q3 제품 로드맵 회의",
  "date": "2026-06-30T09:00:00.000Z",
  "attendees": ["김하나", "이두리", "박세찬"],   // Json 배열(string[])
  "rawText": "원본 전사본 전체 텍스트...",
  "minutes": {                                    // Json 객체
    "agenda": ["Q3 목표 정렬", "리소스 분배"],     // 안건[]
    "discussion": "논의 요약 문단...",             // 논의요약
    "decisions": ["검색 기능 우선 개발", "데모는 로컬"] // 결정사항[]
  },
  "createdAt": "2026-06-30T09:23:50.000Z",
  "actionItems": [ /* ActionItem[] (관계 포함 시) */ ]
}

// ActionItem
{
  "id": "clyyyyyyyyyyyyyy",
  "meetingId": "clxxxxxxxxxxxxxx",
  "content": "검색 API 엔드포인트 설계",
  "assignee": "이두리",        // 불명확하면 "[담당자 확인 필요]"
  "dueDate": "2026-07-07T00:00:00.000Z", // 불명확하면 null (UI 표기 "미정")
  "status": "todo",            // 'todo' | 'done'
  "createdAt": "2026-06-30T09:23:50.000Z"
}
```

### 공통 에러 형식

```jsonc
// 4xx / 5xx
{
  "error": {
    "code": "VALIDATION_ERROR",   // 예: VALIDATION_ERROR | NOT_FOUND | LLM_ERROR | INTERNAL
    "message": "rawText는 필수입니다."
  }
}
```

---

## 1. POST /api/meetings

전사본(rawText)을 받아 **회의록(minutes)·액션아이템(actionItems)을 AI로 생성**하고
DB에 저장한 뒤, 생성된 회의 1건을 반환한다.

### 요청

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `rawText` | string | ✅ | 원본 전사본 텍스트. |
| `title` | string | ❌ | 미제공 시 AI가 전사본에서 제목을 추론한다. |
| `date` | string(ISO8601) | ❌ | 미제공 시 서버 수신 시각(now)으로 저장. |
| `attendees` | string[] | ❌ | 미제공 시 AI가 전사본에서 참석자를 추출한다. |

```json
{
  "rawText": "오늘 회의에서는 Q3 로드맵을 정했습니다. 김하나가 검색 기능을 맡고...",
  "title": "2026 Q3 제품 로드맵 회의",
  "date": "2026-06-30T09:00:00.000Z",
  "attendees": ["김하나", "이두리", "박세찬"]
}
```

> 최소 요청은 `{ "rawText": "..." }` 하나만으로도 동작한다.

### 응답 `201 Created`

생성·저장된 Meeting 1건을 `actionItems` 관계까지 포함해 반환한다.

```json
{
  "id": "clxxxxxxxxxxxxxx",
  "title": "2026 Q3 제품 로드맵 회의",
  "date": "2026-06-30T09:00:00.000Z",
  "attendees": ["김하나", "이두리", "박세찬"],
  "rawText": "오늘 회의에서는 Q3 로드맵을 정했습니다. 김하나가 검색 기능을 맡고...",
  "minutes": {
    "agenda": ["Q3 로드맵 확정", "기능별 담당 분배"],
    "discussion": "Q3에는 검색 기능을 최우선으로 개발하기로 했다. 데모는 로컬에서 진행한다.",
    "decisions": ["검색 기능 우선 개발", "배포 없이 로컬 데모"]
  },
  "createdAt": "2026-06-30T09:23:50.000Z",
  "actionItems": [
    {
      "id": "clyyyyyyyyyyyyyy",
      "meetingId": "clxxxxxxxxxxxxxx",
      "content": "검색 기능 구현",
      "assignee": "김하나",
      "dueDate": null,
      "status": "todo",
      "createdAt": "2026-06-30T09:23:50.000Z"
    },
    {
      "id": "clzzzzzzzzzzzzzz",
      "meetingId": "clxxxxxxxxxxxxxx",
      "content": "데모 환경 점검",
      "assignee": "[담당자 확인 필요]",
      "dueDate": "2026-07-07T00:00:00.000Z",
      "status": "todo",
      "createdAt": "2026-06-30T09:23:50.000Z"
    }
  ]
}
```

### 에러

| 상태 | code | 상황 |
|---|---|---|
| `400` | `VALIDATION_ERROR` | `rawText` 누락/빈 문자열 |
| `502` | `LLM_ERROR` | LLM 호출 실패(live 모드) |
| `500` | `INTERNAL` | 기타 서버 오류 |

> **mock 모드:** API 키가 없으면 LLM 어댑터(`llm.ts`)가 mock 회의록을 생성한다.
> 응답 본문 구조는 위와 **완전히 동일**하며, 값만 고정/플레이스홀더 데이터다.

---

## 2. GET /api/meetings

저장된 회의 목록을 최신순(`createdAt` 내림차순)으로 반환한다.

### 쿼리 파라미터(선택)

| 파라미터 | 타입 | 기본 | 설명 |
|---|---|---|---|
| `limit` | number | 20 | 페이지 크기 |
| `offset` | number | 0 | 시작 위치 |

### 응답 `200 OK`

목록 응답은 가벼움을 위해 `rawText`를 생략하고 액션아이템 개수만 요약한다.
(상세는 `GET /api/meetings/:id`에서 제공)

```json
{
  "meetings": [
    {
      "id": "clxxxxxxxxxxxxxx",
      "title": "2026 Q3 제품 로드맵 회의",
      "date": "2026-06-30T09:00:00.000Z",
      "attendees": ["김하나", "이두리", "박세찬"],
      "minutes": {
        "agenda": ["Q3 로드맵 확정", "기능별 담당 분배"],
        "discussion": "Q3에는 검색 기능을 최우선으로 개발하기로 했다...",
        "decisions": ["검색 기능 우선 개발", "배포 없이 로컬 데모"]
      },
      "createdAt": "2026-06-30T09:23:50.000Z",
      "actionItemCount": 2
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

---

## 3. GET /api/meetings/:id

회의 1건을 `actionItems` 관계까지 포함해 전체 반환한다.

### 응답 `200 OK`

본문 구조는 **POST /api/meetings의 `201` 응답과 동일**하다(`rawText`, `minutes`, `actionItems[]` 모두 포함).

```json
{
  "id": "clxxxxxxxxxxxxxx",
  "title": "2026 Q3 제품 로드맵 회의",
  "date": "2026-06-30T09:00:00.000Z",
  "attendees": ["김하나", "이두리", "박세찬"],
  "rawText": "오늘 회의에서는 Q3 로드맵을 정했습니다...",
  "minutes": {
    "agenda": ["Q3 로드맵 확정", "기능별 담당 분배"],
    "discussion": "Q3에는 검색 기능을 최우선으로 개발하기로 했다. 데모는 로컬에서 진행한다.",
    "decisions": ["검색 기능 우선 개발", "배포 없이 로컬 데모"]
  },
  "createdAt": "2026-06-30T09:23:50.000Z",
  "actionItems": [
    {
      "id": "clyyyyyyyyyyyyyy",
      "meetingId": "clxxxxxxxxxxxxxx",
      "content": "검색 기능 구현",
      "assignee": "김하나",
      "dueDate": null,
      "status": "todo",
      "createdAt": "2026-06-30T09:23:50.000Z"
    }
  ]
}
```

### 에러

| 상태 | code | 상황 |
|---|---|---|
| `404` | `NOT_FOUND` | 해당 id의 회의 없음 |

---

## 4. 소유 경계 메모

- 이 문서의 `/api/meetings*`(생성·조회)는 **BE-1** 소유다.
- 액션아이템 상태 변경(`/api/actions*`)과 검색(`/api/search*`)은 **BE-2** 소유이며
  별도 계약으로 추가한다(엔티티 스키마는 본 문서의 정의를 그대로 따른다).
- FE(`frontend/`)는 `frontend/src/api/*`에서 위 계약을 타입으로 옮겨 백엔드를 호출한다.
