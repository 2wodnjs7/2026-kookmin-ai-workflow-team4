import Card from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';
import ActionCard from '@/components/action-tracker/ActionCard';
import ActionCalendar from '@/components/action-tracker/ActionCalendar';
import {
  ACTION_STATUS_COLUMNS,
  MOCK_ACTION_ITEMS,
  type ActionBoardStatus,
} from '@/constants/actionTracker';

export default function ActionTrackerPage() {
  const itemsByStatus = ACTION_STATUS_COLUMNS.reduce(
    (acc, column) => {
      acc[column.id] = MOCK_ACTION_ITEMS.filter((item) => item.status === column.id);
      return acc;
    },
    {} as Record<ActionBoardStatus, typeof MOCK_ACTION_ITEMS>,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="text-2xl font-bold text-text-primary">액션 아이템 트래커</div>
        <div className="text-sm text-text-secondary">
          회의에서 도출된 액션 아이템을 4단계 Kanban 보드로 관리합니다.
        </div>
      </div>

      <Alert variant="info">
        현재는 UI 목업 데이터입니다. 4단계 상태는 FE UI 전용이며, API 연동 시 BE와
        status 계약 합의가 필요합니다.
      </Alert>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {ACTION_STATUS_COLUMNS.map((column) => {
          const items = itemsByStatus[column.id];

          return (
            <Card key={column.id} title={`${column.label} (${items.length})`}>
              <div className="flex flex-col gap-3">
                {items.map((item) => (
                  <ActionCard key={item.id} item={item} />
                ))}
                {items.length === 0 && (
                  <div className="text-sm text-text-muted">항목이 없습니다.</div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <ActionCalendar items={MOCK_ACTION_ITEMS} />
    </div>
  );
}
