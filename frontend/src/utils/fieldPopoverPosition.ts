export interface PopoverPosition {
  top: number;
  left: number;
  width: number;
}

export function getFieldPopoverPosition(
  triggerRect: DOMRect,
  popoverWidth: number,
): PopoverPosition {
  const margin = 8;
  const maxLeft = window.innerWidth - popoverWidth - margin;
  const left = Math.min(Math.max(margin, triggerRect.left), maxLeft);

  return {
    top: triggerRect.bottom + margin,
    left,
    width: Math.max(triggerRect.width, popoverWidth),
  };
}
