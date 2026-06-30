import { useCallback, useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import FileDropZone from '@/components/ui/FileDropZone';
import DatePicker from '@/components/ui/DatePicker';
import ActionItemModal from '@/components/action-tracker/ActionItemModal';
import ActionSuccessModal from '@/components/ui/ActionSuccessModal';
import { createMeeting, updateActionItem } from '@/api/command';
import { USE_MOCK } from '@/api/config';
import { ApiRequestError } from '@/api/errors';
import type { ActionItem, Meeting } from '@/api/types';
import MeetingResultPanel from '@/components/meeting-create/MeetingResultPanel';
import { scrollToElementId } from '@/utils/smoothScroll';
import {
  boardDraftToPatchBody,
  meetingActionToBoardItem,
} from '@/utils/actionApiMapper';
import type { ActionBoardItem } from '@/constants/actionTracker';
import type { ActionItemDraft } from '@/stores/actionTrackerStore';

type ActionModalState = { open: false } | { open: true; boardItem: ActionBoardItem };

export default function MeetingCreatePage() {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState<string | null>(null);
  const [attendees, setAttendees] = useState('');
  const [rawText, setRawText] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Meeting | null>(null);
  const [mockSubmitted, setMockSubmitted] = useState(false);
  const [formExpanded, setFormExpanded] = useState(true);
  const [actionModal, setActionModal] = useState<ActionModalState>({ open: false });
  const [actionSaveError, setActionSaveError] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [addedActionIds, setAddedActionIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!result) return;

    requestAnimationFrame(() => {
      scrollToElementId('meeting-create-result');
    });
  }, [result]);

  useEffect(() => {
    if (result) setFormExpanded(false);
  }, [result]);

  const handleCloseSuccess = useCallback(() => {
    setSuccessOpen(false);
  }, []);

  const handleAddAction = (action: ActionItem) => {
    if (!result) return;
    setActionSaveError(null);
    setActionModal({
      open: true,
      boardItem: meetingActionToBoardItem(action, result.title),
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
      setAddedActionIds((prev) => new Set(prev).add(previous.id));
      setSuccessOpen(true);
    } catch (err) {
      setActionSaveError(
        err instanceof ApiRequestError ? err.message : '액션 추가에 실패했습니다.',
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setAddedActionIds(new Set());
    setActionModal({ open: false });
    setSuccessOpen(false);

    if (USE_MOCK) {
      setMockSubmitted(true);
      return;
    }

    const trimmedText = rawText.trim();
    if (!trimmedText) {
      setError('회의 내용을 입력해 주세요.');
      return;
    }

    setLoading(true);
    try {
      const attendeeList = attendees
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean);

      const meeting = await createMeeting({
        rawText: trimmedText,
        ...(title.trim() ? { title: title.trim() } : {}),
        ...(date ? { date: `${date}T00:00:00.000Z` } : {}),
        ...(attendeeList.length > 0 ? { attendees: attendeeList } : {}),
      });
      setResult(meeting);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : '회의록 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="text-2xl font-bold text-text-primary">회의록 생성</div>
        <div className="text-sm text-text-secondary">
          회의 내용을 직접 입력하거나 PDF·Word(.docx)·Markdown 파일을 업로드하면 AI가 구조화된
          회의록을 생성합니다.
        </div>
      </div>

      {USE_MOCK && mockSubmitted && (
        <Alert variant="info" title="목업 모드">
          VITE_USE_MOCK=true 상태입니다. API 연동을 켜려면 VITE_USE_MOCK=false로 설정하세요.
        </Alert>
      )}

      {error && (
        <Alert variant="error" title="오류">
          {error}
        </Alert>
      )}

      {actionSaveError && (
        <Alert variant="error" title="액션 저장 오류">
          {actionSaveError}
        </Alert>
      )}

      {result && (
        <div id="meeting-create-result" className="scroll-mt-20">
          <MeetingResultPanel
            meeting={result}
            addedActionIds={addedActionIds}
            onAddAction={handleAddAction}
          />
        </div>
      )}

      {uploadError && (
        <Alert variant="error" title="파일 업로드 오류">
          {uploadError}
        </Alert>
      )}

      <Card title="회의 정보 입력">
        {result && (
          <div className="mb-4 flex flex-col gap-2">
            <div className="text-sm text-text-secondary">
              {formExpanded
                ? '입력 폼을 펼쳤습니다. 내용을 수정한 뒤 다시 생성할 수 있습니다.'
                : '회의록이 생성되어 입력 폼을 접었습니다.'}
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="self-start"
              onClick={() => setFormExpanded((expanded) => !expanded)}
            >
              {formExpanded ? '입력 폼 접기' : '다시 입력하기'}
            </Button>
          </div>
        )}

        {(!result || formExpanded) && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="회의 제목 (선택)"
              placeholder="예: 스프린트 회고"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <DatePicker
              label="회의 날짜 (선택)"
              id="meeting-date"
              value={date}
              onChange={setDate}
              clearable
            />
            <Input
              label="참석자 (쉼표로 구분, 선택)"
              placeholder="예: 김OO, 이OO"
              value={attendees}
              onChange={(e) => setAttendees(e.target.value)}
            />

            <div className="flex flex-col gap-1.5">
              <div className="text-sm font-medium text-text-secondary">자료 업로드</div>
              <FileDropZone
                onTextExtracted={(text, fileName) => {
                  setRawText(text);
                  setUploadedFileName(fileName);
                  setUploadError('');
                }}
                onError={setUploadError}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="raw-text" className="text-sm font-medium text-text-secondary">
                회의 내용
                {uploadedFileName && (
                  <div className="mt-0.5 text-xs font-normal text-primary">
                    {uploadedFileName}에서 불러옴
                  </div>
                )}
              </label>
              <textarea
                id="raw-text"
                className="min-h-48 w-full resize-y rounded-lg border border-glass-border bg-glass-bg px-3 py-2 text-sm text-text-primary backdrop-blur-sm placeholder:text-text-muted outline-none transition-colors focus:border-border-focus focus:ring-2 focus:ring-primary/20"
                placeholder="회의 내용을 붙여넣거나 위에서 파일을 업로드하세요..."
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                required
              />
            </div>
            <Button type="submit" size="lg" className="self-start" loading={loading}>
              {loading ? '생성 중...' : '회의록 생성'}
            </Button>
          </form>
        )}
      </Card>

      <ActionItemModal
        open={actionModal.open}
        mode="edit"
        item={actionModal.open ? actionModal.boardItem : undefined}
        title="액션 아이템 추가"
        submitLabel="추가"
        onClose={() => {
          setActionModal({ open: false });
          setActionSaveError(null);
        }}
        onSave={handleActionSave}
      />

      <ActionSuccessModal open={successOpen} onClose={handleCloseSuccess} />
    </div>
  );
}
