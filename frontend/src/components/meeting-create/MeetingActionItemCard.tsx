import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';
import type { ActionItem } from '@/api/types';
import { getAssigneeColor } from '@/utils/assigneeColor';
import { isoToDateKey } from '@/utils/actionApiMapper';

interface MeetingActionItemCardProps {
  action: ActionItem;
  meetingTitle: string;
}

function formatAssignee(assignee: string | null) {
  if (!assignee || assignee === '[담당자 확인 필요]') return '담당자 미정';
  return assignee;
}

export default function MeetingActionItemCard({ action, meetingTitle }: MeetingActionItemCardProps) {
  const assigneeLabel = formatAssignee(action.assignee);
  const assigneeColor = getAssigneeColor(action.assignee);

  return (
    <div className="glass flex flex-col gap-3 rounded-xl p-4">
      <div className="text-sm font-medium text-text-primary">{action.content}</div>
      <div className="flex flex-wrap gap-2 text-xs text-text-secondary">
        <div className={`rounded-full px-2 py-0.5 ${assigneeColor.badgeBg} ${assigneeColor.badgeText}`}>
          담당 {assigneeLabel}
        </div>
        <div className="rounded-full glass px-2 py-0.5">
          마감 {isoToDateKey(action.dueDate) ?? '미정'}
        </div>
        <div className="rounded-full bg-primary-subtle px-2 py-0.5 text-primary">{action.status}</div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Link to={`/actions?actionId=${encodeURIComponent(action.id)}`}>
          <Button type="button" size="sm" variant="secondary">
            트래커에서 보기
          </Button>
        </Link>
        <div className="text-xs text-text-muted">{meetingTitle}</div>
      </div>
    </div>
  );
}
