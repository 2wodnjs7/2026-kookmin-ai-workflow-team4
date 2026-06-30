import type { ActionBoardItem } from '@/constants/actionTracker';
import { getAssigneeColor } from '@/utils/assigneeColor';

interface ActionCardProps {
  item: ActionBoardItem;
  onClick: () => void;
}

function formatDateLabel(date: string | null, fallback: string) {
  return date ?? fallback;
}

export default function ActionCard({ item, onClick }: ActionCardProps) {
  const assigneeColor = getAssigneeColor(item.assignee);

  return (
    <button
      type="button"
      onClick={onClick}
      className="glass w-full rounded-xl p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
    >
      <div className="text-sm font-medium text-text-primary">{item.content}</div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs text-text-secondary">
        <div className={`rounded-full px-2 py-0.5 ${assigneeColor.badgeBg} ${assigneeColor.badgeText}`}>
          {item.assignee ?? '담당자 미정'}
        </div>
        <div className="rounded-full glass px-2 py-0.5">
          시작 {formatDateLabel(item.startDate, '미정')}
        </div>
        <div className="rounded-full glass px-2 py-0.5">
          마감 {formatDateLabel(item.dueDate, '미정')}
        </div>
        <div className="rounded-full bg-primary-subtle px-2 py-0.5 text-primary">
          {item.meeting}
        </div>
        {item.memo.trim() && (
          <div className="rounded-full bg-bg-muted px-2 py-0.5 text-text-muted">메모 있음</div>
        )}
      </div>
    </button>
  );
}
