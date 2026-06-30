export type ActionBoardStatus = "todo" | "in_progress" | "done" | "on_hold";

/** API 계약 ActionItem.status는 'todo' | 'done'만 허용. 연동 시 매핑 의도(②): */
export const BOARD_STATUS_TO_API: Record<ActionBoardStatus, "todo" | "done"> = {
  todo: "todo",
  in_progress: "todo",
  done: "done",
  on_hold: "todo",
};

export interface ActionBoardItem {
  id: string;
  content: string;
  assignee: string | null;
  /** FE UI 전용(비영속). API ActionItem에 없음 — #19 연동 시 전송·저장하지 않음. 영속 필요 시 BE 계약 확장 합의. */
  startDate: string | null;
  dueDate: string | null;
  /** FE UI 전용(비영속). API ActionItem에 없음 — #19 연동 시 전송·저장하지 않음. */
  memo: string;
  status: ActionBoardStatus;
  /** FE 표시용 회의 제목. API는 meetingId + meeting{id,title,date} — #19 연동 시 매핑 필요. */
  meeting: string;
}

export const ACTION_STATUS_COLUMNS: {
  id: ActionBoardStatus;
  label: string;
}[] = [
  {id: "todo", label: "해야하는 일"},
  {id: "in_progress", label: "진행 중"},
  {id: "done", label: "진행 완료"},
  {id: "on_hold", label: "보류"},
];

export function getStatusLabel(status: ActionBoardStatus): string {
  return ACTION_STATUS_COLUMNS.find((column) => column.id === status)?.label ?? status;
}

export const MOCK_ACTION_ITEMS: ActionBoardItem[] = [
  {
    id: "1",
    content: "API 명세 문서 작성",
    assignee: "BE-1",
    startDate: "2026-07-01",
    dueDate: "2026-07-05",
    memo: "OpenAPI 초안부터 작성",
    status: "todo",
    meeting: "킥오프 미팅",
  },
  {
    id: "2",
    content: "프론트엔드 레이아웃 구현",
    assignee: "FE",
    startDate: "2026-06-28",
    dueDate: "2026-07-03",
    memo: "",
    status: "done",
    meeting: "킥오프 미팅",
  },
  {
    id: "3",
    content: "LLM 프롬프트 튜닝",
    assignee: "BE-1",
    startDate: null,
    dueDate: null,
    memo: "mock 응답 품질 먼저 확인",
    status: "todo",
    meeting: "기술 검토",
  },
  {
    id: "4",
    content: "액션 트래커 Kanban UI",
    assignee: "FE",
    startDate: "2026-07-05",
    dueDate: "2026-07-08",
    memo: "4단계 보드 + 캘린더 연동",
    status: "in_progress",
    meeting: "스프린트 계획",
  },
  {
    id: "5",
    content: "배포 파이프라인 검토",
    assignee: "BE-2",
    startDate: "2026-07-10",
    dueDate: "2026-07-12",
    memo: "",
    status: "on_hold",
    meeting: "인프라 논의",
  },
  {
    id: "6",
    content: "회의 검색 UX 개선",
    assignee: "FE",
    startDate: "2026-07-12",
    dueDate: "2026-07-15",
    memo: "검색 결과 하이라이트 검토",
    status: "in_progress",
    meeting: "디자인 리뷰",
  },
];
