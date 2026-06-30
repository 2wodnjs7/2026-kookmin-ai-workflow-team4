import Card from '@/components/ui/Card';
import type { MeetingListItem } from '@/api/types';
import { isoToDateKey } from '@/utils/actionApiMapper';
import { meetingListSnippet } from '@/utils/meetingSummary';

interface MeetingListCardProps {
  meeting: MeetingListItem;
  onClick: () => void;
}

export default function MeetingListCard({ meeting, onClick }: MeetingListCardProps) {
  const dateLabel = isoToDateKey(meeting.date) ?? '날짜 미정';
  const snippet = meetingListSnippet(meeting);
  const actionLabel =
    typeof meeting.actionItemCount === 'number' && meeting.actionItemCount > 0
      ? `액션 ${meeting.actionItemCount}건`
      : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left transition-opacity hover:opacity-90"
    >
      <Card className="cursor-pointer">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="text-base font-semibold text-text-primary">{meeting.title}</div>
            <div className="flex shrink-0 flex-wrap items-center gap-2 text-xs text-text-muted">
              <div>{dateLabel}</div>
              {actionLabel && (
                <div className="rounded-full bg-primary-subtle px-2 py-0.5 text-primary">
                  {actionLabel}
                </div>
              )}
            </div>
          </div>
          <div className="line-clamp-2 text-sm text-text-secondary">{snippet}</div>
          <div className="text-xs text-text-muted">클릭하면 상세 회의록을 볼 수 있습니다.</div>
        </div>
      </Card>
    </button>
  );
}
