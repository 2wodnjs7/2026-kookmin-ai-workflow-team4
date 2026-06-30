import { create } from 'zustand';
import {
  MOCK_ACTION_ITEMS,
  type ActionBoardItem,
  type ActionBoardStatus,
} from '@/constants/actionTracker';

export type ActionItemDraft = Omit<ActionBoardItem, 'id'>;

interface ActionTrackerState {
  items: ActionBoardItem[];
  addItem: (draft: ActionItemDraft) => void;
  updateItem: (id: string, patch: Partial<ActionItemDraft>) => void;
  removeItem: (id: string) => void;
}

function createId() {
  return `action-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useActionTrackerStore = create<ActionTrackerState>((set) => ({
  items: MOCK_ACTION_ITEMS,

  addItem: (draft) => {
    set((state) => ({
      items: [{ id: createId(), ...draft }, ...state.items],
    }));
  },

  updateItem: (id, patch) => {
    set((state) => ({
      items: state.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  },

  removeItem: (id) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    }));
  },
}));

export type { ActionBoardItem, ActionBoardStatus };
