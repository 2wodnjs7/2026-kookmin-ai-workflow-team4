export type ActionBoardStatus = 'todo' | 'in_progress' | 'done' | 'on_hold';

export interface ActionBoardItem {
  id: string;
  content: string;
  assignee: string;
  dueDate: string | null;
  status: ActionBoardStatus;
  meeting: string;
}

export const ACTION_STATUS_COLUMNS: {
  id: ActionBoardStatus;
  label: string;
}[] = [
  { id: 'todo', label: '할일' },
  { id: 'in_progress', label: '진행중' },
  { id: 'done', label: '완료' },
  { id: 'on_hold', label: '보류' },
];

export const MOCK_ACTION_ITEMS: ActionBoardItem[] = [
  {
    id: '1',
    content: 'API 명세 문서 작성',
    assignee: 'BE-1',
    dueDate: '2026-07-05',
    status: 'todo',
    meeting: '킥오프 미팅',
  },
  {
    id: '2',
    content: '프론트엔드 레이아웃 구현',
    assignee: 'FE',
    dueDate: '2026-07-03',
    status: 'done',
    meeting: '킥오프 미팅',
  },
  {
    id: '3',
    content: 'LLM 프롬프트 튜닝',
    assignee: 'BE-1',
    dueDate: null,
    status: 'todo',
    meeting: '기술 검토',
  },
  {
    id: '4',
    content: '액션 트래커 Kanban UI',
    assignee: 'FE',
    dueDate: '2026-07-08',
    status: 'in_progress',
    meeting: '스프린트 계획',
  },
  {
    id: '5',
    content: '배포 파이프라인 검토',
    assignee: 'BE-2',
    dueDate: '2026-07-12',
    status: 'on_hold',
    meeting: '인프라 논의',
  },
  {
    id: '6',
    content: '회의 검색 UX 개선',
    assignee: 'FE',
    dueDate: '2026-07-15',
    status: 'in_progress',
    meeting: '디자인 리뷰',
  },
];
