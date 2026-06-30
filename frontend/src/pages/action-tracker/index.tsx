import { useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import ActionCard from '@/components/action-tracker/ActionCard';
import ActionCalendar from '@/components/action-tracker/ActionCalendar';
import ActionItemModal from '@/components/action-tracker/ActionItemModal';
import { ACTION_STATUS_COLUMNS, type ActionBoardItem } from '@/constants/actionTracker';
import { useActionTrackerStore } from '@/stores/actionTrackerStore';

type ModalState =
  | { open: false }
  | { open: true; mode: 'add' }
  | { open: true; mode: 'edit'; item: ActionBoardItem };

export default function ActionTrackerPage() {
  const items = useActionTrackerStore((state) => state.items);
  const addItem = useActionTrackerStore((state) => state.addItem);
  const updateItem = useActionTrackerStore((state) => state.updateItem);
  const removeItem = useActionTrackerStore((state) => state.removeItem);

  const [modal, setModal] = useState<ModalState>({ open: false });

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

      <Alert variant="info">
        현재는 브라우저 메모리에만 저장됩니다(API 연동 전). 4단계 상태는 FE UI 전용이며,
        연동 시 BE와 status 계약 합의가 필요합니다.
      </Alert>

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
                {columnItems.length === 0 && (
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
        onClose={() => setModal({ open: false })}
        onSave={(draft) => {
          if (modal.open && modal.mode === 'edit') {
            updateItem(modal.item.id, draft);
            return;
          }
          addItem(draft);
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
