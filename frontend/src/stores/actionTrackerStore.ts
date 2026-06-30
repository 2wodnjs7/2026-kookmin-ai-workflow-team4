import { create } from 'zustand';
import { deleteActionItem, getActionItems, updateActionItem } from '@/api/command';
import { USE_MOCK } from '@/api/config';
import { ApiRequestError } from '@/api/errors';
import {
  MOCK_ACTION_ITEMS,
  type ActionBoardItem,
  type ActionBoardStatus,
} from '@/constants/actionTracker';
import {
  apiActionToBoardItem,
  apiAssigneeToBoard,
  apiStatusToBoard,
  boardDraftToPatchBody,
  isoToDateKey,
} from '@/utils/actionApiMapper';

export type ActionItemDraft = Omit<ActionBoardItem, 'id'>;

interface ActionTrackerState {
  items: ActionBoardItem[];
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  addItem: (draft: ActionItemDraft) => void;
  updateItem: (id: string, patch: Partial<ActionItemDraft>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
}

function createId() {
  return `action-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isSessionOnlyItem(id: string) {
  return id.startsWith('action-');
}

export const useActionTrackerStore = create<ActionTrackerState>((set, get) => ({
  items: USE_MOCK ? MOCK_ACTION_ITEMS : [],
  loading: false,
  error: null,

  fetchItems: async () => {
    if (USE_MOCK) return;

    set({ loading: true, error: null });
    try {
      const { actions } = await getActionItems({ limit: 200 });
      set({ items: actions.map(apiActionToBoardItem), loading: false });
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : '액션 목록을 불러오지 못했습니다.';
      set({ loading: false, error: message });
    }
  },

  addItem: (draft) => {
    set((state) => ({
      items: [{ id: createId(), ...draft }, ...state.items],
      error: null,
    }));
  },

  updateItem: async (id, patch) => {
    const previous = get().items.find((item) => item.id === id);
    if (!previous) return;

    if (USE_MOCK || isSessionOnlyItem(id)) {
      set((state) => ({
        items: state.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        error: null,
      }));
      return;
    }

    const body = boardDraftToPatchBody(patch, previous);
    const hasLocalOnlyChanges =
      patch.memo !== undefined ||
      patch.startDate !== undefined ||
      patch.meeting !== undefined;

    if (Object.keys(body).length === 0) {
      if (hasLocalOnlyChanges) {
        set((state) => ({
          items: state.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        }));
      }
      return;
    }

    set({ error: null });
    try {
      const updated = await updateActionItem(id, body);
      set((state) => ({
        items: state.items.map((item) => {
          if (item.id !== id) return item;
          return {
            ...item,
            content: updated.content,
            assignee: apiAssigneeToBoard(updated.assignee),
            dueDate: isoToDateKey(updated.dueDate),
            status: patch.status !== undefined ? apiStatusToBoard(updated.status) : item.status,
            memo: patch.memo !== undefined ? patch.memo : item.memo,
            startDate: patch.startDate !== undefined ? patch.startDate : item.startDate,
          };
        }),
      }));
    } catch (error) {
      const message =
        error instanceof ApiRequestError ? error.message : '액션 수정에 실패했습니다.';
      set({ error: message });
      throw error;
    }
  },

  removeItem: async (id) => {
    // mock 또는 세션 전용(서버에 없는) 항목은 로컬에서만 제거.
    if (USE_MOCK || isSessionOnlyItem(id)) {
      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
        error: null,
      }));
      return;
    }

    // API 항목은 백엔드 DELETE 후 제거(새로고침 후 부활 방지).
    set({ error: null });
    try {
      await deleteActionItem(id);
      set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
    } catch (error) {
      const message =
        error instanceof ApiRequestError ? error.message : '액션 삭제에 실패했습니다.';
      set({ error: message });
      throw error;
    }
  },
}));

export type { ActionBoardItem, ActionBoardStatus };
