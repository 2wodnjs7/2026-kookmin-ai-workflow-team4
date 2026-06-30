import { useEffect } from 'react';

interface ActionSuccessModalProps {
  open: boolean;
  message?: string;
  onClose: () => void;
  autoCloseMs?: number;
}

export default function ActionSuccessModal({
  open,
  message = '액션 아이템이 추가되었습니다.',
  onClose,
  autoCloseMs = 500,
}: ActionSuccessModalProps) {
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(onClose, autoCloseMs);
    return () => window.clearTimeout(timer);
  }, [open, onClose, autoCloseMs]);

  if (!open) return null;

  return (
    <div className="modal-overlay" role="presentation">
      <div className="modal-overlay__blur" aria-hidden="true" />
      <div className="modal-overlay__vignette" aria-hidden="true" />
      <div
        className="modal-panel flex w-full max-w-sm flex-col items-center gap-3 p-8 text-center"
        role="dialog"
        aria-modal="true"
        aria-live="polite"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-xl text-success">
          ✓
        </div>
        <div className="text-base font-semibold text-text-primary">{message}</div>
      </div>
    </div>
  );
}
