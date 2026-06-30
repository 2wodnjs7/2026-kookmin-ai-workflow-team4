import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Card from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import ActionCard from '@/components/action-tracker/ActionCard';
import ActionCalendar from '@/components/action-tracker/ActionCalendar';
import ActionItemModal from '@/components/action-tracker/ActionItemModal';
import { USE_MOCK } from '@/api/config';
import { ACTION_STATUS_COLUMNS, type ActionBoardItem } from '@/constants/actionTracker';
import { useActionTrackerStore } from '@/stores/actionTrackerStore';

type ModalState =
  | { open: false }
  | { open: true; mode: 'add' }
  | { open: true; mode: 'edit'; item: ActionBoardItem };

export default function ActionTrackerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const items = useActionTrackerStore((state) => state.items);
  const loading = useActionTrackerStore((state) => state.loading);
  const error = useActionTrackerStore((state) => state.error);
  const fetchItems = useActionTrackerStore((state) => state.fetchItems);
  const addItem = useActionTrackerStore((state) => state.addItem);
  const updateItem = useActionTrackerStore((state) => state.updateItem);
  const removeItem = useActionTrackerStore((state) => state.removeItem);

  const [modal, setModal] = useState<ModalState>({ open: false });
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    const actionId = searchParams.get('actionId');
    if (!actionId || loading) return;

    const item = items.find((entry) => entry.id === actionId);
    if (!item) return;

    setModal({ open: true, mode: 'edit', item });
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('actionId');
    setSearchParams(nextParams, { replace: true });
  }, [items, loading, searchParams, setSearchParams]);

  const itemsByStatus = useMemo(
    () =>
      ACTION_STATUS_COLUMNS.reduce(
        (acc, column) => {
          acc[column.id] = items.filter((item) => item.status === column.id);
          return acc;
        },
        {} as Record<(typeof ACTION_STATUS_COLUMNS)[number]['id'], ActionBoardItem[]>,
      ),
    [items],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="text-2xl font-bold text-text-primary">액션 아이템 트래커</div>
          <div className="text-sm text-text-secondary">
            액션을 추가하고 카드를 눌러 시작일·마감일·메모를 수정하세요.
          </div>
        </div>
        <Button type="button" onClick={() => setModal({ open: true, mode: 'add' })}>
          액션 추가
        </Button>
      </div>

      {USE_MOCK ? (
        <Alert variant="info">
          목업 모드(VITE_USE_MOCK=true)입니다. 브라우저 메모리에만 저장됩니다.
        </Alert>
      ) : (
        <Alert variant="info">
          백엔드 API에서 액션을 불러옵니다. 상태·내용·담당자·마감일 변경은 PATCH로 저장됩니다.
          보드 상태는 API 기준 할 일(todo)·완료(done)만 영속되며, 진행 중·보류는 UI 전용입니다.
          시작일·메모는 FE 전용이며 API에 저장되지 않습니다. 수동 추가·삭제는 현재 세션에만 반영됩니다(API POST/DELETE
          미지원, #23).
        </Alert>
      )}

      {(error || saveError) && (
        <Alert variant="error" title="오류">
          {error ?? saveError}
        </Alert>
      )}

      {loading && <div className="text-sm text-text-muted">액션 목록을 불러오는 중...</div>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {ACTION_STATUS_COLUMNS.map((column) => {
          const columnItems = itemsByStatus[column.id];

          return (
            <Card key={column.id} title={`${column.label} (${columnItems.length})`}>
              <div className="flex flex-col gap-3">
                {columnItems.map((item) => (
                  <ActionCard
                    key={item.id}
                    item={item}
                    onClick={() => setModal({ open: true, mode: 'edit', item })}
                  />
                ))}
                {!loading && columnItems.length === 0 && (
                  <div className="text-sm text-text-muted">항목이 없습니다.</div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <ActionCalendar
        items={items}
        onItemClick={(item) => setModal({ open: true, mode: 'edit', item })}
      />

      <ActionItemModal
        open={modal.open}
        mode={modal.open ? modal.mode : 'add'}
        item={modal.open && modal.mode === 'edit' ? modal.item : undefined}
        onClose={() => {
          setModal({ open: false });
          setSaveError(null);
        }}
        onSave={async (draft) => {
          setSaveError(null);
          try {
            if (modal.open && modal.mode === 'edit') {
              await updateItem(modal.item.id, draft);
              setModal({ open: false });
              return;
            }
            addItem(draft);
            setModal({ open: false });
          } catch (err) {
            setSaveError(err instanceof Error ? err.message : '저장에 실패했습니다.');
          }
        }}
        onDelete={
          modal.open && modal.mode === 'edit'
            ? (id) => removeItem(id)
            : undefined
        }
      />
    </div>
  );
}
