# Agent Guide

이 파일은 **AI 에이전트(Cursor 등)**가 저장소에서 작업할 때 먼저 읽는 가이드입니다.  
**페이지·라우트·API·Zustand** 구조(CRiT Frontend 스타일)를 따르는 React 프론트엔드용입니다.

## 프론트엔드 — 반드시 지킬 규칙

1. **경로 별칭**: `@/*` → `src/*` (또는 프로젝트에 맞게 설정된 경로)
2. **API 호출**: 페이지/스토어에서 `fetch` 직접 사용 금지 → `@/api/command` 함수 사용
3. **HTTP 클라이언트**: `@/api/axios` (Axios 인스턴스 + 인터셉터)
4. **인증 토큰**: `@/utils/auth` (`getToken`, `setToken`, `hasAuth`)
5. **전역 인증 상태**: `@/stores/authStore` (Zustand)
6. **라우트 보호**: `@/routes/privateRoute` (`PrivateRoute`)
7. **페이지 파일명**: `pages/<도메인>/index.tsx` (default export)
8. **환경 변수**: `VITE_SERVER_URL` (`.env`는 프론트엔드 루트)
9. **테마**: `useThemeStore` (`@/stores/themeStore`)로 라이트/다크 전환. 색상은 CSS 변수 토큰 사용 (`bg-bg-page`, `text-text-primary` 등). 하드코딩 hex·`dark:` 남발 대신 토큰 우선.
10. **마크업 (`pages/`, `components/`)**: 레이아웃·텍스트 래퍼는 **`div`만 사용**. `p`, `span`, `h1`~`h6` 등은 쓰지 않음. 배치는 Tailwind `flex` / `grid`로 처리하고, 제목·본문·캡션도 `div` + 클래스로 스타일링. (폼 컨트롤 `input`, `button`, `select`, `label`, 라우트 `Link` 등 기능 요소는 예외)

## 환경 변수 (예시)

```env
VITE_SERVER_URL=http://127.0.0.1:8080
```

- 기본: 백엔드 API 서버에 연결 (`VITE_SERVER_URL`)

## 라우팅

- 라우트 정의: `src/routes/routes.tsx`
- 공개/보호 라우트는 `PrivateRoute`로 구분
- 페이지 경로·접근 권한은 프로젝트 `README.md` 또는 `.cursor/rules/` 참고

## 프로젝트 구조 (`src`)

```
src/
├── index.tsx              # 엔트리: auth refresh → AppRouter
├── index.css
├── vite-env.d.ts
│
├── api/
│   ├── axios.ts           # Axios 인스턴스, JWT 헤더, 에러 변환
│   ├── command.ts         # REST API 함수
│   ├── config.ts          # VITE_SERVER_URL, apiUrl
│   ├── errors.ts          # ApiRequestError
│   └── types.ts           # 요청/응답 타입
│
├── assets/                # 이미지, 폰트, 아이콘
│
├── components/            # 재사용 UI (페이지 조립 블록)
│   ├── header/            # GNB, 테마 토글
│   ├── layout/
│   └── ui/                # Card, Button, Input, Alert 등
│
├── constants/             # (필요 시) 상수
│
├── styles/
│   ├── light-theme.css    # :root CSS 변수 (라이트)
│   ├── dark-theme.css     # .dark CSS 변수 (다크)
│   └── theme-utilities.css
│
├── pages/                 # 라우트 단위 (default export)
│   └── <feature>/index.tsx
│
├── routes/
│   ├── routes.tsx         # BrowserRouter, Route 정의
│   └── privateRoute.tsx   # 로그인 필요 라우트 래퍼
│
├── stores/
│   ├── authStore.ts       # Zustand 인증
│   └── themeStore.ts      # Zustand 라이트/다크
│
└── utils/
    └── auth.ts            # localStorage 토큰
```

## API 추가 시 체크리스트

1. `api/types.ts`에 타입 추가
2. `api/command.ts`에 함수 추가 (`api.get` / `api.post`)
3. 페이지에서는 `command`만 import

## 라이트/다크 모드

Tailwind + CSS 변수 + Zustand로 테마를 관리한다.

### `index.css`와 테마 파일 역할

`index.css`가 스타일 **진입점**이다. 여기서 Tailwind를 불러오고, 라이트/다크 색상 정의 파일을 import한 뒤, 공통 스타일·Tailwind 매핑을 정의한다.

```
index.css
  1. @import 'tailwindcss'
  2. @import './styles/light-theme.css'   ← 라이트 색상 값 (:root)
  3. @import './styles/dark-theme.css'    ← 다크 색상 값 (.dark)
  4. @import './styles/theme-utilities.css'
  5. @custom-variant dark                 ← Tailwind dark: 변형
  6. @theme { … }                         ← CSS 변수 → Tailwind 유틸 (bg-bg-page 등)
  7. @layer base { … }                    ← body, 전역 스타일, 서드파티 오버라이드
```

- **`styles/light-theme.css`**: `:root`에 라이트 모드 **색상 값**(hex)만 정의 (`--color-bg-page`, `--color-text-primary` …)
- **`styles/dark-theme.css`**: `.dark`에 **같은 토큰명**으로 다크 모드 색상 값만 정의
- **`index.css` `@theme`**: 위 CSS 변수를 Tailwind 클래스로 연결 (`--color-bg-page` → `bg-bg-page`)
- **색상 값은 테마 CSS 파일에만** 추가·수정. `index.css`에는 import·매핑·전역 스타일만 둔다.

테마 전환 시 `themeStore`가 `<html>`에 `dark` 클래스를 토글하면, `.dark` 블록의 변수가 적용되고 `@theme`으로 연결된 Tailwind 유틸·`var(--color-*)` 참조가 함께 바뀐다.

### 런타임 (Zustand)

1. **`stores/themeStore.ts`**: `'light' | 'dark'`, `setTheme`, `toggleTheme`. `persist`로 localStorage 저장.
2. **DOM 클래스**: 다크 모드 시 `document.documentElement`에 `dark` 클래스 추가/제거.
3. **`onRehydrateStorage`**: 새로고침 후에도 `dark` 클래스 복원.

### 스타일 규칙

- 배경·텍스트·보더는 **시맨틱 토큰** 사용 (`bg-bg-page`, `text-text-primary`, `border-border-default` 등).
- 컴포넌트마다 `dark:bg-…`를 반복하지 말고, 토큰이 테마에 따라 바뀌게 한다.
- `dark:` 변형은 토큰으로 표현하기 어려운 **예외 케이스**에만 사용.
- 새 색상 추가 시 `light-theme.css`와 `dark-theme.css` **둘 다** 같은 토큰명으로 값을 넣고, 필요하면 `index.css` `@theme`에 매핑 추가.
- 새 UI 추가 시 라이트·다크 둘 다 확인.

### 토글 UI

- 헤더 등 공통 영역에 테마 전환 버튼 배치 (`toggleTheme`).

## 목 모드 (MSW)

**사용자가 목 모드를 만들자고 요청할 때만** 도입한다. 기본 스캐폴딩·API 작업에 MSW를 선제적으로 추가하지 않는다.

요청 시 구성 예:

- `src/mocks/` (`handlers.ts`, `data/`, `enableMocking.ts`)
- `VITE_USE_MOCK` 환경 변수
- `public/mockServiceWorker.js` (**수동 수정 금지**, `pnpm msw:init`으로 생성)

## 작업 시 하지 말 것

- 페이지에서 `api/axios` 직접 import (command 경유)
- UI에 `p`, `span`, `h1`~`h6` 사용 (`div` + flex/grid로 통일)
- 사용자 요청 없이 MSW·목 핸들러·`VITE_USE_MOCK` 추가
- 테마 색상을 컴포넌트에 hex로 하드코딩 (CSS 변수 토큰 사용)

## 관련 문서

- 사용자용: 루트 `README.md`
- 프로젝트별 규칙: `.cursor/rules/`
