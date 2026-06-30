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
    "summary": "회의 전체를 2~4문장으로 요약",       // FE 요약 카드 (전사 원문 복붙 아님)
    "keyPoints": ["핵심 논의·결정 bullet"],         // FE 핵심 내용 카드
    "agenda": ["Q3 목표 정렬", "리소스 분배"],     // 안건[] (자동생성 메타 제외)
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
  "startDate": "2026-07-01T00:00:00.000Z", // 시작일(선택). 없으면 null
  "status": "todo",            // 'todo' | 'in_progress' | 'done' | 'on_hold'
  "memo": "OpenAPI 초안부터 작성", // 자유 메모(선택). 없으면 null
  "createdAt": "2026-06-30T09:23:50.000Z"
}
```

> **minutes 필드 메모(#26):** `summary`·`keyPoints`는 `Meeting.minutes`(Json 컬럼) **안의 필드**라 `schema.prisma` 컬럼 추가가 아니다(마이그레이션 불필요). LLM 출력은 전사 원문을 복붙하지 않고 요약/업무 문장으로 구조화한다(mock·live 동일). 액션의 `startDate`/`memo`는 본 계약에 **없음**(FE 전용, 영속 논의는 #23).

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

전사본(rawText)을 받아 **회의록(minutes)을 AI로 생성**하고
DB에 저장한 뒤, 생성된 회의 1건을 반환한다.

> **액션아이템 분리(#28):** 이 엔드포인트는 회의록(minutes)만 생성·저장하며, 액션아이템은 **자동 생성하지 않는다.**
> 응답의 `actionItems`는 **항상 빈 배열 `[]`**이다(스키마 필드는 유지). 액션 생성은 클라이언트가 원할 때 별도로
> `POST /api/actions/generate`(BE-2 소유)를 호출해 수행한다.

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

생성·저장된 Meeting 1건을 반환한다. 액션아이템은 자동 생성하지 않으므로 `actionItems`는 **항상 빈 배열**이다(#28).

```json
{
  "id": "clxxxxxxxxxxxxxx",
  "title": "2026 Q3 제품 로드맵 회의",
  "date": "2026-06-30T09:00:00.000Z",
  "attendees": ["김하나", "이두리", "박세찬"],
  "rawText": "오늘 회의에서는 Q3 로드맵을 정했습니다. 김하나가 검색 기능을 맡고...",
  "minutes": {
    "summary": "Q3 로드맵 회의 요약: 검색 기능을 우선 개발하고 로컬 데모로 진행하기로 했다.",
    "keyPoints": ["검색 기능 최우선 개발", "배포 없이 로컬 데모"],
    "agenda": ["Q3 로드맵 확정", "기능별 담당 분배"],
    "discussion": "Q3에는 검색 기능을 최우선으로 개발하기로 했다. 데모는 로컬에서 진행한다.",
    "decisions": ["검색 기능 우선 개발", "배포 없이 로컬 데모"]
  },
  "createdAt": "2026-06-30T09:23:50.000Z",
  "actionItems": []
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
        "summary": "검색 기능 우선 개발·로컬 데모 진행 등을 정한 Q3 로드맵 회의.",
        "keyPoints": ["검색 기능 최우선 개발", "배포 없이 로컬 데모"],
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
    "summary": "Q3 로드맵 회의 요약: 검색 기능을 우선 개발하고 로컬 데모로 진행하기로 했다.",
    "keyPoints": ["검색 기능 최우선 개발", "배포 없이 로컬 데모"],
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
- 액션아이템 트래커(`/api/actions*`, 아래 §5·§6·§6.1·§6.2)와 검색(`/api/search*`, 아래 §7)은 **BE-2** 소유다.
  엔티티 스키마는 본 문서 상단의 정의를 그대로 따른다.
- FE(`frontend/`)는 `frontend/src/api/*`에서 위 계약을 타입으로 옮겨 백엔드를 호출한다.

---

## 5. GET /api/actions

저장된 액션아이템을 최신순(`createdAt` 내림차순)으로 반환한다. 트래커 화면용이며,
회의를 가로질러 보여주기 위해 각 액션아이템에 소속 회의의 가벼운 컨텍스트(`meeting`)를 함께 담는다.

### 쿼리 파라미터(선택)

| 파라미터 | 타입 | 기본 | 설명 |
|---|---|---|---|
| `status` | `'todo' \| 'in_progress' \| 'done' \| 'on_hold'` | — | 상태 필터 |
| `assignee` | string | — | 담당자 정확 일치 필터 |
| `meetingId` | string | — | 특정 회의의 액션아이템만 |
| `limit` | number | 50 | 페이지 크기(1~200) |
| `offset` | number | 0 | 시작 위치 |

### 응답 `200 OK`

```json
{
  "actions": [
    {
      "id": "clyyyyyyyyyyyyyy",
      "meetingId": "clxxxxxxxxxxxxxx",
      "content": "검색 API 엔드포인트 설계",
      "assignee": "이두리",
      "dueDate": "2026-07-07T00:00:00.000Z",
      "startDate": "2026-07-01T00:00:00.000Z",
      "status": "todo",
      "memo": "OpenAPI 초안부터 작성",
      "createdAt": "2026-06-30T09:23:50.000Z",
      "meeting": {
        "id": "clxxxxxxxxxxxxxx",
        "title": "2026 Q3 제품 로드맵 회의",
        "date": "2026-06-30T09:00:00.000Z"
      }
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

> `assignee`가 불명확하면 값은 `"[담당자 확인 필요]"`, `dueDate`가 불명확하면 `null`(UI 표기 "미정").
> 이는 본 문서 상단 ActionItem 스키마 규칙과 동일하다.

---

## 6. PATCH /api/actions/:id

액션아이템 1건을 부분 수정한다. **핵심 용도는 상태 토글(`todo` ↔ `done`)**이며, 그 외 필드도 수정 가능하다.
요청 본문에는 수정할 필드를 **최소 1개** 포함해야 한다.

### 요청 본문(모든 필드 선택, 최소 1개 필수)

| 필드 | 타입 | 설명 |
|---|---|---|
| `status` | `'todo' \| 'in_progress' \| 'done' \| 'on_hold'` | 상태 |
| `content` | string | 내용(빈 문자열 불가) |
| `assignee` | string \| null | 담당자. `null`이면 미지정으로 비운다 |
| `dueDate` | string(ISO8601) \| null | 기한. `null`이면 "미정"으로 비운다 |
| `startDate` | string(ISO8601) \| null | 시작일. `null`이면 비운다 |
| `memo` | string \| null | 자유 메모. `null`이면 비운다 |

```json
// PATCH /api/actions/clyyyyyyyyyyyyyy
{ "status": "done" }
```

### 응답 `200 OK`

갱신된 ActionItem 1건을 반환한다(본 문서 상단 ActionItem 스키마와 동일, `meeting` 미포함).

```json
{
  "id": "clyyyyyyyyyyyyyy",
  "meetingId": "clxxxxxxxxxxxxxx",
  "content": "검색 API 엔드포인트 설계",
  "assignee": "이두리",
  "dueDate": "2026-07-07T00:00:00.000Z",
  "status": "done",
  "createdAt": "2026-06-30T09:23:50.000Z"
}
```

### 에러

| 상태 | code | 상황 |
|---|---|---|
| `400` | `VALIDATION_ERROR` | 수정할 필드 없음 / `status` 허용값 위반 / 형식 오류 |
| `404` | `NOT_FOUND` | 해당 id의 액션아이템 없음 |

---

## 6.1 POST /api/actions

액션아이템 1건을 수동 생성한다(트래커 「액션 추가」). **회의에 속해야 하므로 `meetingId`가 필수**다.

### 요청 본문

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `content` | string | ✅ | 내용(빈 문자열 불가) |
| `meetingId` | string | ✅ | 소속 회의 id(존재해야 함) |
| `status` | `'todo' \| 'in_progress' \| 'done' \| 'on_hold'` | ❌(기본 `todo`) | 상태 |
| `assignee` | string \| null | ❌ | 담당자 |
| `dueDate` | string(ISO8601) \| null | ❌ | 기한 |
| `startDate` | string(ISO8601) \| null | ❌ | 시작일 |
| `memo` | string \| null | ❌ | 자유 메모 |

```json
// POST /api/actions
{ "content": "검색 결과 하이라이트", "meetingId": "clxxxxxxxxxxxxxx", "assignee": "FE", "dueDate": "2026-07-15T00:00:00.000Z", "status": "in_progress" }
```

### 응답 `201 Created`

생성된 ActionItem 1건을 `meeting{id,title,date}` 컨텍스트와 함께 반환한다(`GET /api/actions` 항목과 동일 형태).

### 에러

| 상태 | code | 상황 |
|---|---|---|
| `400` | `VALIDATION_ERROR` | `content`/`meetingId` 누락 / `status` 허용값 위반 / 형식 오류 |
| `404` | `NOT_FOUND` | `meetingId`가 가리키는 회의 없음 |

---

## 6.2 DELETE /api/actions/:id

액션아이템 1건을 삭제한다(하드 삭제).

### 응답 `204 No Content`

본문 없음.

### 에러

| 상태 | code | 상황 |
|---|---|---|
| `404` | `NOT_FOUND` | 해당 id의 액션아이템 없음 |

---

## 7. GET /api/search

키워드로 회의를 검색한다. 회의 `title`·`rawText`와 소속 액션아이템 `content`에서
부분 일치(대소문자 무시, 한글 그대로)로 매칭한다. 응답은 **`GET /api/meetings` 목록과 동일한 형태**
(가벼움을 위해 `rawText` 제외, `actionItemCount` 요약)이며 `query`를 함께 에코한다.

> 참석자(`attendees`)·회의록(`minutes`)은 SQLite의 Json(TEXT) 컬럼이라 직접 필터하지 않지만,
> 전체 전사본 `rawText`에 참석자·논의 내용이 포함되므로 사실상 함께 검색된다.

### 쿼리 파라미터

| 파라미터 | 타입 | 필수 | 기본 | 설명 |
|---|---|---|---|---|
| `q` | string | ✅ | — | 검색어(빈 문자열 불가) |
| `limit` | number | ❌ | 20 | 페이지 크기(1~100) |
| `offset` | number | ❌ | 0 | 시작 위치 |

### 응답 `200 OK`

```json
{
  "query": "검색",
  "meetings": [
    {
      "id": "clxxxxxxxxxxxxxx",
      "title": "2026 Q3 제품 로드맵 회의",
      "date": "2026-06-30T09:00:00.000Z",
      "attendees": ["김하나", "이두리", "박세찬"],
      "minutes": {
        "summary": "검색 기능 우선 개발·로컬 데모 진행 등을 정한 Q3 로드맵 회의.",
        "keyPoints": ["검색 기능 최우선 개발", "배포 없이 로컬 데모"],
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

### 에러

| 상태 | code | 상황 |
|---|---|---|
| `400` | `VALIDATION_ERROR` | `q` 누락/빈 문자열 |
