import type { ReactNode } from 'react';
import Card from '@/components/ui/Card';
import MeetingActionItemCard from '@/components/meeting-create/MeetingActionItemCard';
import type { ActionItem, Meeting } from '@/api/types';
import { isoToDateKey } from '@/utils/actionApiMapper';

interface MeetingResultPanelProps {
  meeting: Meeting;
  addedActionIds?: Set<string>;
  onAddAction: (action: ActionItem) => void;
}

function ResultSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card title={title} description={description}>
      {children}
    </Card>
  );
}

export default function MeetingResultPanel({
  meeting,
  addedActionIds,
  onAddAction,
}: MeetingResultPanelProps) {
  const { minutes } = meeting;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="text-2xl font-bold text-text-primary">생성된 회의록</div>
        <div className="text-sm text-text-secondary">
          AI가 구조화한 회의 요약과 추출된 액션 아이템입니다.
        </div>
      </div>

      <ResultSection title="회의 정보">
        <div className="flex flex-col gap-2">
          <div className="text-lg font-semibold text-text-primary">{meeting.title}</div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-secondary">
            <div>일자 {isoToDateKey(meeting.date)}</div>
            <div>참석자 {meeting.attendees.length > 0 ? meeting.attendees.join(', ') : '미정'}</div>
          </div>
        </div>
      </ResultSection>

      {minutes?.discussion && (
        <ResultSection title="회의 요약" description="논의 전체를 한눈에 파악할 수 있는 요약입니다.">
          <div className="text-sm leading-relaxed text-text-secondary">{minutes.discussion}</div>
        </ResultSection>
      )}

      {minutes && minutes.agenda.length > 0 && (
        <ResultSection title="안건" description={`${minutes.agenda.length}개 항목`}>
          <div className="flex flex-col gap-2">
            {minutes.agenda.map((item, index) => (
              <div
                key={`${item}-${index}`}
                className="rounded-lg border border-glass-border bg-bg-surface px-3 py-2 text-sm text-text-secondary"
              >
                {item}
              </div>
            ))}
          </div>
        </ResultSection>
      )}

      {minutes && minutes.decisions.length > 0 && (
        <ResultSection title="핵심 내용 · 결정 사항" description={`${minutes.decisions.length}개 항목`}>
          <div className="flex flex-col gap-2">
            {minutes.decisions.map((item, index) => (
              <div
                key={`${item}-${index}`}
                className="rounded-lg border border-primary/20 bg-primary-subtle/40 px-3 py-2 text-sm text-text-primary"
              >
                {item}
              </div>
            ))}
          </div>
        </ResultSection>
      )}

      {meeting.actionItems.length > 0 && (
        <ResultSection
          title={`액션 아이템 (${meeting.actionItems.length})`}
          description="담당자·일정을 확인한 뒤 트래커에 추가할 수 있습니다."
        >
          <div className="flex flex-col gap-3">
            {meeting.actionItems.map((action) => (
              <MeetingActionItemCard
                key={action.id}
                action={action}
                meetingTitle={meeting.title}
                added={addedActionIds?.has(action.id)}
                onAdd={onAddAction}
              />
            ))}
          </div>
        </ResultSection>
      )}
    </div>
  );
}
