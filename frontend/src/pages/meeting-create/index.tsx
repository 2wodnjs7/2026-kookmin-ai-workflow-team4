import { useCallback, useEffect, useState } from 'react';
import Alert from '@/components/ui/Alert';
import ActionItemModal from '@/components/action-tracker/ActionItemModal';
import ActionSuccessModal from '@/components/ui/ActionSuccessModal';
import { createMeeting, generateActions, updateActionItem } from '@/api/command';
import { USE_MOCK } from '@/api/config';
import { ApiRequestError } from '@/api/errors';
import type { ActionItem, Meeting } from '@/api/types';
import MeetingResultPanel from '@/components/meeting-create/MeetingResultPanel';
import MeetingInputCollapsible from '@/components/meeting-create/MeetingInputCollapsible';
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
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [generatingActions, setGeneratingActions] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

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

  const mergeGeneratedActions = (incoming: ActionItem[]) => {
    setActionItems((prev) => {
      const known = new Set(prev.map((item) => item.id));
      const fresh = incoming.filter((item) => !known.has(item.id));
      return fresh.length > 0 ? [...prev, ...fresh] : prev;
    });
  };

  const handleGenerateActions = async (mode: 'one' | 'all') => {
    if (!result) return;

    setGenerateError(null);
    setGeneratingActions(true);
    try {
      const { actions, generated } = await generateActions({
        meetingId: result.id,
        mode,
      });
      if (generated === 0) {
        setGenerateError(
          mode === 'one'
            ? '추출할 액션 아이템이 더 이상 없습니다.'
            : '추출할 액션 아이템이 없습니다.',
        );
        return;
      }
      mergeGeneratedActions(actions);
    } catch (err) {
      setGenerateError(
        err instanceof ApiRequestError
          ? err.message
          : '액션 아이템 생성에 실패했습니다.',
      );
    } finally {
      setGeneratingActions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setActionItems([]);
    setGenerateError(null);
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
      // 회의록 생성 응답의 액션은 자동 표시하지 않음 — 별도 generate API로 추출
      setResult({ ...meeting, actionItems: [] });
      setActionItems([]);
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

      {generateError && (
        <Alert variant="error" title="액션 생성 오류">
          {generateError}
        </Alert>
      )}

      {result && (
        <div id="meeting-create-result" className="scroll-mt-20">
          <MeetingResultPanel
            meeting={result}
            actionItems={actionItems}
            addedActionIds={addedActionIds}
            generating={generatingActions}
            onGenerateOne={() => handleGenerateActions('one')}
            onGenerateAll={() => handleGenerateActions('all')}
            onAddAction={handleAddAction}
          />
        </div>
      )}

      {uploadError && (
        <Alert variant="error" title="파일 업로드 오류">
          {uploadError}
        </Alert>
      )}

      <MeetingInputCollapsible
        title={title}
        date={date}
        attendees={attendees}
        rawText={rawText}
        uploadedFileName={uploadedFileName}
        loading={loading}
        hasResult={result !== null}
        expanded={formExpanded}
        onToggle={() => setFormExpanded((expanded) => !expanded)}
        onTitleChange={setTitle}
        onDateChange={setDate}
        onAttendeesChange={setAttendees}
        onRawTextChange={setRawText}
        onFileExtracted={(text, fileName) => {
          setRawText(text);
          setUploadedFileName(fileName);
          setUploadError('');
        }}
        onFileError={setUploadError}
        onSubmit={handleSubmit}
      />

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
