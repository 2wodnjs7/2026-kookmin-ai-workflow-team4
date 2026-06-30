import type { ActionBoardItem } from '@/constants/actionTracker';

interface ActionCardProps {
  item: ActionBoardItem;
}

export default function ActionCard({ item }: ActionCardProps) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="text-sm font-medium text-text-primary">{item.content}</div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs text-text-secondary">
        {item.assignee ? (
          <div className="rounded-full bg-bg-accent px-2 py-0.5">{item.assignee}</div>
        ) : (
          <div className="rounded-full bg-warning-bg px-2 py-0.5 text-warning">담당자 미정</div>
        )}
        {item.dueDate ? (
          <div className="rounded-full glass px-2 py-0.5">{item.dueDate}</div>
        ) : (
          <div className="rounded-full bg-warning-bg px-2 py-0.5 text-warning">미정</div>
        )}
        <div className="rounded-full bg-primary-subtle px-2 py-0.5 text-primary">
          {item.meeting}
        </div>
      </div>
    </div>
  );
}
