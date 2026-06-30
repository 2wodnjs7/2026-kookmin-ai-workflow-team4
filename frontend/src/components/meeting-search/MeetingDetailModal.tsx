import { useEffect, type ReactNode } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ModalPortal from '@/components/ui/ModalPortal';
import MeetingDetailActionItemRow from '@/components/meeting-search/MeetingDetailActionItemRow';
import type { ActionItem, Meeting } from '@/api/types';
import { isoToDateKey } from '@/utils/actionApiMapper';

interface MeetingDetailModalProps {
  open: boolean;
  meeting: Meeting | null;
  loading: boolean;
  error: string | null;
  trackedActionIds: Set<string>;
  onCreateTracker: (action: ActionItem) => void;
  onClose: () => void;
}

function Section({
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

export default function MeetingDetailModal({
  open,
  meeting,
  loading,
  error,
  trackedActionIds,
  onCreateTracker,
  onClose,
}: MeetingDetailModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const { minutes } = meeting ?? {};

  return (
    <ModalPortal>
    <div className="modal-overlay items-center py-4 sm:py-6" onClick={onClose} role="presentation">
      <div className="modal-overlay__blur" aria-hidden="true" />
      <div className="modal-overlay__vignette" aria-hidden="true" />
      <div
        className="modal-panel flex max-h-[min(90dvh,calc(100dvh-3rem))] w-full max-w-2xl flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="meeting-detail-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-glass-border p-6 pb-4">
          <div className="flex flex-col gap-1">
            <div id="meeting-detail-modal-title" className="text-lg font-semibold text-text-primary">
              {loading ? '회의록 불러오는 중…' : (meeting?.title ?? '회의록 상세')}
            </div>
            <div className="text-sm text-text-secondary">저장된 회의록 전체 내용입니다.</div>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            닫기
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6 pt-4">
          {loading && (
            <div className="text-sm text-text-muted">상세 정보를 가져오는 중입니다…</div>
          )}

          {error && (
            <div className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
              {error}
            </div>
          )}

          {meeting && !loading && (
            <div className="flex flex-col gap-4 pb-2">
            <Section title="회의 정보">
              <div className="flex flex-col gap-2 text-sm text-text-secondary">
                <div>일자 {isoToDateKey(meeting.date) ?? '미정'}</div>
                <div>
                  참석자{' '}
                  {meeting.attendees.length > 0 ? meeting.attendees.join(', ') : '미정'}
                </div>
                {meeting.actionItems.length > 0 ? (
                  <div>액션 아이템 {meeting.actionItems.length}건</div>
                ) : null}
              </div>
            </Section>

            {minutes?.discussion && (
              <Section title="회의 요약">
                <div className="text-sm leading-relaxed text-text-secondary">
                  {minutes.discussion}
                </div>
              </Section>
            )}

            {minutes && minutes.agenda.length > 0 && (
              <Section title="안건" description={`${minutes.agenda.length}개 항목`}>
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
              </Section>
            )}

            {minutes && minutes.decisions.length > 0 && (
              <Section title="핵심 내용 · 결정 사항" description={`${minutes.decisions.length}개 항목`}>
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
              </Section>
            )}

            {meeting.actionItems.length > 0 && (
              <Section title={`액션 아이템 (${meeting.actionItems.length})`}>
                <div className="flex flex-col gap-2">
                  {meeting.actionItems.map((action) => (
                    <MeetingDetailActionItemRow
                      key={action.id}
                      action={action}
                      tracked={trackedActionIds.has(action.id)}
                      onCreateTracker={onCreateTracker}
                    />
                  ))}
                </div>
              </Section>
            )}
            </div>
          )}
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
