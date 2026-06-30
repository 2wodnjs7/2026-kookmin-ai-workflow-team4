import Button from '@/components/ui/Button';

interface ActionSuggestionRowProps {
  content: string;
  loading?: boolean;
  onCreate: () => void;
}

export default function ActionSuggestionRow({
  content,
  loading = false,
  onCreate,
}: ActionSuggestionRowProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        if (!loading) onCreate();
      }}
      onKeyDown={(event) => {
        if (loading) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onCreate();
        }
      }}
      className="action-item-row group flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary-subtle/40 px-3 py-2.5 text-sm transition-colors hover:border-primary/40 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:border-primary/50 active:bg-primary/15"
    >
      <div className="min-w-0 flex-1 font-medium text-text-primary">{content}</div>

      <div className="flex w-24 shrink-0 items-center justify-center">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="h-8 w-full whitespace-nowrap px-2"
          loading={loading}
          onClick={(event) => {
            event.stopPropagation();
            onCreate();
          }}
        >
          생성
        </Button>
      </div>
    </div>
  );
}
