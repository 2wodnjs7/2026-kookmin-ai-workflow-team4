import Card from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';

const mockItems = [
  {
    id: '1',
    content: 'API 명세 문서 작성',
    assignee: 'BE-1',
    dueDate: '2026-07-05',
    status: 'todo' as const,
    meeting: '킥오프 미팅',
  },
  {
    id: '2',
    content: '프론트엔드 레이아웃 구현',
    assignee: 'FE',
    dueDate: '2026-07-03',
    status: 'done' as const,
    meeting: '킥오프 미팅',
  },
  {
    id: '3',
    content: 'LLM 프롬프트 튜닝',
    assignee: 'BE-1',
    dueDate: null,
    status: 'todo' as const,
    meeting: '기술 검토',
  },
];

export default function ActionTrackerPage() {
  const todoItems = mockItems.filter((item) => item.status === 'todo');
  const doneItems = mockItems.filter((item) => item.status === 'done');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="text-2xl font-bold text-text-primary">액션 아이템 트래커</div>
        <div className="text-sm text-text-secondary">
          회의에서 도출된 액션 아이템을 Kanban 보드 형태로 관리합니다.
        </div>
      </div>

      <Alert variant="info">
        현재는 UI 목업 데이터입니다. 백엔드 연동 후 실제 데이터가 표시됩니다.
      </Alert>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card title={`할 일 (${todoItems.length})`}>
          <div className="flex flex-col gap-3">
            {todoItems.map((item) => (
              <ActionCard key={item.id} item={item} />
            ))}
            {todoItems.length === 0 && (
              <div className="text-sm text-text-muted">할 일이 없습니다.</div>
            )}
          </div>
        </Card>

        <Card title={`완료 (${doneItems.length})`}>
          <div className="flex flex-col gap-3">
            {doneItems.map((item) => (
              <ActionCard key={item.id} item={item} />
            ))}
            {doneItems.length === 0 && (
              <div className="text-sm text-text-muted">완료된 항목이 없습니다.</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

interface ActionCardProps {
  item: (typeof mockItems)[number];
}

function ActionCard({ item }: ActionCardProps) {
  return (
    <div className="rounded-lg border border-border-default bg-bg-muted p-4">
      <div className="text-sm font-medium text-text-primary">{item.content}</div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs text-text-secondary">
        <div className="rounded-full bg-bg-accent px-2 py-0.5">{item.assignee}</div>
        {item.dueDate && (
          <div className="rounded-full bg-bg-surface px-2 py-0.5 border border-border-default">
            {item.dueDate}
          </div>
        )}
        {!item.dueDate && (
          <div className="rounded-full bg-warning-bg px-2 py-0.5 text-warning">미정</div>
        )}
        <div className="rounded-full bg-primary-subtle px-2 py-0.5 text-primary">
          {item.meeting}
        </div>
      </div>
    </div>
  );
}
