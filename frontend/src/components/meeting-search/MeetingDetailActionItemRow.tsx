import Button from '@/components/ui/Button';
import type { ActionItem } from '@/api/types';
import { isoToDateKey } from '@/utils/actionApiMapper';

const STATUS_LABEL: Record<ActionItem['status'], string> = {
  todo: '할 일',
  done: '완료',
};

interface MeetingDetailActionItemRowProps {
  action: ActionItem;
  tracked: boolean;
  onCreateTracker: (action: ActionItem) => void;
}

export default function MeetingDetailActionItemRow({
  action,
  tracked,
  onCreateTracker,
}: MeetingDetailActionItemRowProps) {
  return (
    <div
      tabIndex={0}
      className="action-item-row group flex items-center justify-between gap-3 rounded-lg border border-glass-border bg-bg-surface px-3 py-2.5 text-sm text-text-secondary transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:border-primary/50 active:bg-primary/10"
    >
      <div className="min-w-0 flex-1">
        <div className="font-medium text-text-primary">{action.content}</div>
        <div className="mt-1 text-xs text-text-muted">
          담당 {action.assignee ?? '미정'} · 마감 {isoToDateKey(action.dueDate) ?? '미정'} ·{' '}
          {STATUS_LABEL[action.status]}
        </div>
      </div>

      <div className="flex w-29 shrink-0 items-center justify-center">
        {tracked ? (
          <span className="inline-flex h-8 w-full items-center justify-center whitespace-nowrap text-sm font-medium text-success">
            트래커 생성됨
          </span>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-8 w-full whitespace-nowrap px-2"
            onClick={(event) => {
              event.stopPropagation();
              onCreateTracker(action);
            }}
          >
            트래커 생성
          </Button>
        )}
      </div>
    </div>
  );
}
