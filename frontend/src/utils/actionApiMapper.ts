import type { ActionItem, ActionItemWithMeeting, UpdateActionItemRequest } from '@/api/types';
import {
  BOARD_STATUS_TO_API,
  type ActionBoardItem,
  type ActionBoardStatus,
} from '@/constants/actionTracker';
import type { ActionItemDraft } from '@/stores/actionTrackerStore';

export const API_UNASSIGNED_ASSIGNEE = '[담당자 확인 필요]';

export function isoToDateKey(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return iso.slice(0, 10);
}

export function dateKeyToIso(dateKey: string | null | undefined): string | null {
  if (!dateKey) return null;
  return `${dateKey}T00:00:00.000Z`;
}

export function apiStatusToBoard(status: ActionItem['status']): ActionBoardStatus {
  return status === 'done' ? 'done' : 'todo';
}

export function apiAssigneeToBoard(assignee: string | null): string | null {
  if (!assignee || assignee === API_UNASSIGNED_ASSIGNEE) return null;
  return assignee;
}

export function boardAssigneeToApi(assignee: string | null): string | null {
  return assignee?.trim() || null;
}

export function apiActionToBoardItem(action: ActionItemWithMeeting): ActionBoardItem {
  return {
    id: action.id,
    content: action.content,
    assignee: apiAssigneeToBoard(action.assignee),
    startDate: null,
    dueDate: isoToDateKey(action.dueDate),
    memo: '',
    status: apiStatusToBoard(action.status),
    meeting: action.meeting?.title ?? '회의',
  };
}

export function meetingActionToBoardItem(action: ActionItem, meetingTitle: string): ActionBoardItem {
  return {
    id: action.id,
    content: action.content,
    assignee: apiAssigneeToBoard(action.assignee),
    startDate: null,
    dueDate: isoToDateKey(action.dueDate),
    memo: '',
    status: apiStatusToBoard(action.status),
    meeting: meetingTitle,
  };
}

export function boardDraftToPatchBody(
  draft: Partial<ActionItemDraft>,
  previous?: ActionBoardItem,
): UpdateActionItemRequest {
  const body: UpdateActionItemRequest = {};

  if (draft.content !== undefined && draft.content !== previous?.content) {
    body.content = draft.content.trim();
  }
  if (draft.assignee !== undefined && draft.assignee !== previous?.assignee) {
    body.assignee = boardAssigneeToApi(draft.assignee);
  }
  if (draft.dueDate !== undefined && draft.dueDate !== previous?.dueDate) {
    body.dueDate = dateKeyToIso(draft.dueDate);
  }
  if (draft.status !== undefined && draft.status !== previous?.status) {
    body.status = BOARD_STATUS_TO_API[draft.status];
  }

  return body;
}
