import { useEffect, useRef, useState, type FormEvent } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import DatePicker from '@/components/ui/DatePicker';
import { ACTION_STATUS_COLUMNS, type ActionBoardItem } from '@/constants/actionTracker';
import type { ActionItemDraft } from '@/stores/actionTrackerStore';

interface ActionItemModalProps {
  open: boolean;
  mode: 'add' | 'edit';
  item?: ActionBoardItem;
  onClose: () => void;
  onSave: (draft: ActionItemDraft) => void;
  onDelete?: (id: string) => void;
}

const EMPTY_DRAFT: ActionItemDraft = {
  content: '',
  assignee: null,
  startDate: null,
  dueDate: null,
  memo: '',
  status: 'todo',
  meeting: '수동 추가',
};

export default function ActionItemModal({
  open,
  mode,
  item,
  onClose,
  onSave,
  onDelete,
}: ActionItemModalProps) {
  const [draft, setDraft] = useState<ActionItemDraft>(EMPTY_DRAFT);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && item) {
      setDraft({
        content: item.content,
        assignee: item.assignee,
        startDate: item.startDate,
        dueDate: item.dueDate,
        memo: item.memo,
        status: item.status,
        meeting: item.meeting,
      });
      return;
    }
    setDraft(EMPTY_DRAFT);
  }, [open, mode, item]);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    return () => cancelAnimationFrame(frame);
  }, [open, mode, item?.id]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const content = draft.content.trim();
    if (!content) return;

    onSave({
      ...draft,
      content,
      assignee: draft.assignee?.trim() || null,
      meeting: draft.meeting.trim() || '수동 추가',
      memo: draft.memo.trim(),
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal-overlay__blur" aria-hidden="true" />
      <div className="modal-overlay__vignette" aria-hidden="true" />
      <div
        ref={panelRef}
        className="modal-panel flex max-h-[calc(100vh-5rem)] w-full max-w-lg flex-col gap-4 overflow-y-auto p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="action-item-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col gap-1">
          <div id="action-item-modal-title" className="text-lg font-semibold text-text-primary">
            {mode === 'add' ? '액션 아이템 추가' : '액션 아이템 수정'}
          </div>
          <div className="text-sm text-text-secondary">
            시작일·마감일·메모를 입력하고 저장하세요.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="action-content" className="text-sm font-medium text-text-secondary">
              할 일
            </label>
            <input
              id="action-content"
              className="field-control"
              value={draft.content}
              onChange={(e) => setDraft((prev) => ({ ...prev, content: e.target.value }))}
              placeholder="예: API 명세 문서 작성"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="담당자"
              value={draft.assignee ?? ''}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  assignee: e.target.value || null,
                }))
              }
              placeholder="예: FE"
            />
            <Input
              label="관련 회의"
              value={draft.meeting}
              onChange={(e) => setDraft((prev) => ({ ...prev, meeting: e.target.value }))}
              placeholder="예: 스프린트 계획"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DatePicker
              label="시작일"
              id="action-start-date"
              value={draft.startDate}
              onChange={(startDate) => setDraft((prev) => ({ ...prev, startDate }))}
              clearable
            />
            <DatePicker
              label="마감일"
              id="action-due-date"
              value={draft.dueDate}
              onChange={(dueDate) => setDraft((prev) => ({ ...prev, dueDate }))}
              clearable
            />
          </div>

          <Select
            label="상태"
            id="action-status"
            value={draft.status}
            onChange={(status) => setDraft((prev) => ({ ...prev, status }))}
            options={ACTION_STATUS_COLUMNS.map((column) => ({
              value: column.id,
              label: column.label,
            }))}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="action-memo" className="text-sm font-medium text-text-secondary">
              메모
            </label>
            <textarea
              id="action-memo"
              className="field-control min-h-24 resize-y"
              value={draft.memo}
              onChange={(e) => setDraft((prev) => ({ ...prev, memo: e.target.value }))}
              placeholder="진행 상황, 참고 사항 등을 기록하세요"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <div className="flex gap-2">
              <Button type="submit" size="md">
                {mode === 'add' ? '추가' : '저장'}
              </Button>
              <Button type="button" variant="secondary" size="md" onClick={onClose}>
                취소
              </Button>
            </div>
            {mode === 'edit' && item && onDelete && (
              <Button
                type="button"
                variant="ghost"
                size="md"
                className="text-error hover:bg-error/10"
                onClick={() => {
                  onDelete(item.id);
                  onClose();
                }}
              >
                삭제
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
