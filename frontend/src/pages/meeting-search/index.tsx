import { useCallback, useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import ActionItemModal from '@/components/action-tracker/ActionItemModal';
import ActionSuccessModal from '@/components/ui/ActionSuccessModal';
import MeetingDetailModal from '@/components/meeting-search/MeetingDetailModal';
import MeetingListCard from '@/components/meeting-search/MeetingListCard';
import { getMeeting, getMeetings, searchMeetings, updateActionItem } from '@/api/command';
import { USE_MOCK } from '@/api/config';
import { ApiRequestError } from '@/api/errors';
import type { ActionItem, Meeting, MeetingListItem } from '@/api/types';
import {
  boardDraftToPatchBody,
  meetingActionToBoardItem,
} from '@/utils/actionApiMapper';
import type { ActionBoardItem } from '@/constants/actionTracker';
import type { ActionItemDraft } from '@/stores/actionTrackerStore';

type ActionModalState = { open: false } | { open: true; boardItem: ActionBoardItem };

const MOCK_MEETINGS: MeetingListItem[] = [
  {
    id: 'mock-1',
    title: '킥오프 미팅',
    date: '2026-06-28T09:00:00.000Z',
    attendees: ['FE', 'BE-1', 'BE-2'],
    minutes: {
      agenda: ['프로젝트 범위', '역할 분담'],
      discussion: '프로젝트 범위와 역할 분담을 확정했습니다. FE는 화면 3페이지를 담당합니다.',
      decisions: ['로컬 시연 우선', 'API 계약 문서화'],
    },
    createdAt: '2026-06-28T10:00:00.000Z',
    actionItemCount: 2,
  },
  {
    id: 'mock-2',
    title: '기술 검토',
    date: '2026-06-29T14:00:00.000Z',
    attendees: ['BE-1', 'BE-2'],
    minutes: {
      agenda: ['LLM 어댑터', 'mock 모드'],
      discussion: 'LLM 어댑터 패턴과 mock 모드 동작 방식을 논의했습니다.',
      decisions: ['llm.ts 어댑터 격리'],
    },
    createdAt: '2026-06-29T15:00:00.000Z',
    actionItemCount: 1,
  },
];

const MOCK_MEETING_DETAILS: Record<string, Meeting> = {
  'mock-1': {
    ...MOCK_MEETINGS[0],
    rawText: '킥오프 미팅 전사본…',
    actionItems: [],
  },
  'mock-2': {
    ...MOCK_MEETINGS[1],
    rawText: '기술 검토 전사본…',
    actionItems: [],
  },
};

export default function MeetingSearchPage() {
  const [query, setQuery] = useState('');
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isSearchMode, setIsSearchMode] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailMeeting, setDetailMeeting] = useState<Meeting | null>(null);
  const [trackedActionIds, setTrackedActionIds] = useState<Set<string>>(() => new Set());
  const [actionModal, setActionModal] = useState<ActionModalState>({ open: false });
  const [actionSaveError, setActionSaveError] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);

  const loadAllMeetings = useCallback(async () => {
    if (USE_MOCK) {
      setMeetings(MOCK_MEETINGS);
      setTotal(MOCK_MEETINGS.length);
      setIsSearchMode(false);
      return;
    }

    setListLoading(true);
    setListError(null);
    try {
      const response = await getMeetings({ limit: 100 });
      setMeetings(response.meetings);
      setTotal(response.total);
      setIsSearchMode(false);
    } catch (err) {
      setMeetings([]);
      setTotal(0);
      setListError(err instanceof ApiRequestError ? err.message : '회의 목록을 불러오지 못했습니다.');
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAllMeetings();
  }, [loadAllMeetings]);

  const handleCreateTracker = (action: ActionItem) => {
    if (!detailMeeting) return;
    setActionSaveError(null);
    setActionModal({
      open: true,
      boardItem: meetingActionToBoardItem(action, detailMeeting.title),
    });
  };

  const handleActionSave = async (draft: ActionItemDraft) => {
    if (!actionModal.open) return;

    const previous = actionModal.boardItem;
    setActionSaveError(null);

    try {
      const body = boardDraftToPatchBody(draft, previous);
      if (Object.keys(body).length > 0) {
        await updateActionItem(previous.id, body);
      }
      setActionModal({ open: false });
      setTrackedActionIds((prev) => new Set(prev).add(previous.id));
      setSuccessOpen(true);
    } catch (err) {
      setActionSaveError(
        err instanceof ApiRequestError ? err.message : '트래커 생성에 실패했습니다.',
      );
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setListError(null);

    const trimmed = query.trim();
    if (!trimmed) {
      await loadAllMeetings();
      return;
    }

    if (USE_MOCK) {
      const filtered = MOCK_MEETINGS.filter(
        (meeting) =>
          meeting.title.includes(trimmed) ||
          meeting.minutes?.discussion.includes(trimmed) ||
          meeting.minutes?.agenda.some((item) => item.includes(trimmed)),
      );
      setMeetings(filtered);
      setTotal(filtered.length);
      setIsSearchMode(true);
      return;
    }

    setListLoading(true);
    try {
      const response = await searchMeetings({ q: trimmed, limit: 100 });
      setMeetings(response.meetings);
      setTotal(response.total);
      setIsSearchMode(true);
    } catch (err) {
      setMeetings([]);
      setTotal(0);
      setListError(err instanceof ApiRequestError ? err.message : '검색에 실패했습니다.');
    } finally {
      setListLoading(false);
    }
  };

  const handleOpenDetail = async (meetingId: string) => {
    setDetailOpen(true);
    setDetailMeeting(null);
    setDetailError(null);

    if (USE_MOCK) {
      setDetailMeeting(MOCK_MEETING_DETAILS[meetingId] ?? null);
      return;
    }

    setDetailLoading(true);
    try {
      const meeting = await getMeeting(meetingId);
      setDetailMeeting(meeting);
    } catch (err) {
      setDetailError(
        err instanceof ApiRequestError ? err.message : '회의록 상세를 불러오지 못했습니다.',
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setDetailMeeting(null);
    setDetailError(null);
    setDetailLoading(false);
    setActionModal({ open: false });
    setActionSaveError(null);
  };

  const listTitle = isSearchMode ? `검색 결과 ${total}건` : `저장된 회의 ${total}건`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="text-2xl font-bold text-text-primary">회의 검색</div>
        <div className="text-sm text-text-secondary">
          저장된 회의록을 모두 확인하고, 키워드로 좁혀 검색할 수 있습니다.
        </div>
      </div>

      <Card>
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1">
            <Input
              placeholder="검색어를 입력하세요 (비우고 검색하면 전체 목록)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button type="submit" className="self-end" disabled={listLoading}>
            {listLoading ? '불러오는 중…' : '검색'}
          </Button>
        </form>
      </Card>

      {USE_MOCK && (
        <Alert variant="info">
          목업 모드(VITE_USE_MOCK=true)입니다. 실제 데이터는 VITE_USE_MOCK=false로 설정하세요.
        </Alert>
      )}

      {actionSaveError && (
        <Alert variant="error" title="트래커 생성 오류">
          {actionSaveError}
        </Alert>
      )}

      {listError && (
        <Alert variant="error" title="오류">
          {listError}
        </Alert>
      )}

      <div className="flex flex-col gap-3">
        <div className="text-sm text-text-muted">
          {listLoading ? '회의록을 불러오는 중…' : listTitle}
        </div>

        {!listLoading && meetings.length === 0 && !listError && (
          <div className="text-sm text-text-muted">
            {isSearchMode ? '검색 결과가 없습니다.' : '저장된 회의록이 없습니다.'}
          </div>
        )}

        {meetings.map((meeting) => (
          <MeetingListCard
            key={meeting.id}
            meeting={meeting}
            onClick={() => handleOpenDetail(meeting.id)}
          />
        ))}
      </div>

      <MeetingDetailModal
        open={detailOpen}
        meeting={detailMeeting}
        loading={detailLoading}
        error={detailError}
        trackedActionIds={trackedActionIds}
        onCreateTracker={handleCreateTracker}
        onClose={handleCloseDetail}
      />

      <ActionItemModal
        open={actionModal.open}
        mode="edit"
        item={actionModal.open ? actionModal.boardItem : undefined}
        title="트래커 생성"
        submitLabel="생성"
        onClose={() => {
          setActionModal({ open: false });
          setActionSaveError(null);
        }}
        onSave={handleActionSave}
      />

      <ActionSuccessModal
        open={successOpen}
        message="트래커에 추가되었습니다."
        onClose={() => setSuccessOpen(false)}
      />
    </div>
  );
}
