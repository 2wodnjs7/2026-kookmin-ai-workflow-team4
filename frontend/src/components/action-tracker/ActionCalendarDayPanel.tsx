import {
  ACTION_STATUS_COLUMNS,
  getStatusLabel,
  type ActionBoardItem,
} from '@/constants/actionTracker';
import {
  formatDateKeyLabel,
  formatDateRange,
  getDateMilestone,
  getItemsOnDate,
} from '@/utils/actionDateRange';
import { getAssigneeColor } from '@/utils/assigneeColor';

interface ActionCalendarDayPanelProps {
  dateKey: string;
  items: ActionBoardItem[];
  highlightItemId?: string | null;
  onItemClick?: (item: ActionBoardItem) => void;
  onClose: () => void;
}

export default function ActionCalendarDayPanel({
  dateKey,
  items,
  highlightItemId,
  onItemClick,
  onClose,
}: ActionCalendarDayPanelProps) {
  const dayItems = getItemsOnDate(items, dateKey);

  const grouped = ACTION_STATUS_COLUMNS.map((column) => ({
    ...column,
    items: dayItems.filter((item) => item.status === column.id),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="glass flex flex-col gap-4 rounded-xl border border-glass-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="text-base font-semibold text-text-primary">
            {formatDateKeyLabel(dateKey)}
          </div>
          <div className="text-sm text-text-secondary">
            이 날짜에 해당하는 액션 {dayItems.length}건
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-2 py-1 text-sm text-text-muted transition-colors hover:bg-bg-muted hover:text-text-primary"
        >
          닫기
        </button>
      </div>

      {dayItems.length === 0 ? (
        <div className="text-sm text-text-muted">이 날짜에 등록된 일정이 없습니다.</div>
      ) : (
        <div className="flex flex-col gap-4">
          {grouped.map((group) => (
            <div key={group.id} className="flex flex-col gap-2">
              <div className="text-sm font-medium text-text-primary">
                {group.label} ({group.items.length})
              </div>
              <div className="flex flex-col gap-2">
                {group.items.map((item) => {
                  const assigneeColor = getAssigneeColor(item.assignee);
                  const milestone = getDateMilestone(item, dateKey);
                  const rangeLabel = formatDateRange(item);
                  const isHighlighted = item.id === highlightItemId;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onItemClick?.(item)}
                      className={`flex w-full flex-col gap-2 rounded-lg border px-3 py-2 text-left transition-colors ${
                        isHighlighted
                          ? 'border-primary bg-primary-subtle'
                          : 'border-border-default bg-bg-surface hover:border-primary/40 hover:bg-bg-muted'
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <div
                          className={`rounded-full px-2 py-0.5 text-xs ${assigneeColor.badgeBg} ${assigneeColor.badgeText}`}
                        >
                          {item.assignee ?? '담당자 미정'}
                        </div>
                        <div className="rounded-full bg-bg-accent px-2 py-0.5 text-xs text-text-secondary">
                          {milestone}
                        </div>
                        <div className="rounded-full glass px-2 py-0.5 text-xs text-text-secondary">
                          {getStatusLabel(item.status)}
                        </div>
                      </div>
                      <div className="text-sm font-medium text-text-primary">{item.content}</div>
                      {rangeLabel && (
                        <div className="text-xs text-text-secondary">기간: {rangeLabel}</div>
                      )}
                      {item.memo.trim() && (
                        <div className="text-xs text-text-muted">메모: {item.memo}</div>
                      )}
                      {item.meeting && (
                        <div className="text-xs text-text-muted">회의: {item.meeting}</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
