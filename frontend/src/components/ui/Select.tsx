import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getFieldPopoverPosition } from '@/utils/fieldPopoverPosition';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
}

interface SelectProps<T extends string = string> {
  label?: string;
  id?: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly SelectOption<T>[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

const POPOVER_WIDTH = 280;

export default function Select<T extends string = string>({
  label,
  id,
  value,
  onChange,
  options,
  placeholder = '선택하세요',
  required = false,
  disabled = false,
  className = '',
}: SelectProps<T>) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  const selectedOption = options.find((option) => option.value === value);
  const displayValue = selectedOption?.label ?? '';

  const updatePosition = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition(getFieldPopoverPosition(rect, POPOVER_WIDTH));
  };

  const openMenu = () => {
    if (disabled) return;
    updatePosition();
    setOpen(true);
  };

  const closeMenu = () => setOpen(false);

  const selectOption = (next: T) => {
    onChange(next);
    closeMenu();
  };

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu();
    };

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      closeMenu();
    };

    const onLayoutChange = () => updatePosition();

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('resize', onLayoutChange);
    window.addEventListener('scroll', onLayoutChange, true);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('resize', onLayoutChange);
      window.removeEventListener('scroll', onLayoutChange, true);
    };
  }, [open]);

  return (
    <div className={`relative flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}

      <button
        ref={triggerRef}
        id={selectId}
        type="button"
        disabled={disabled}
        onClick={() => (open ? closeMenu() : openMenu())}
        className={`field-control field-picker-trigger ${open ? 'field-picker-trigger--open' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div className={`truncate ${displayValue ? 'text-text-primary' : 'text-text-muted'}`}>
          {displayValue || placeholder}
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`shrink-0 text-text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {required && (
        <input
          tabIndex={-1}
          className="pointer-events-none absolute h-0 w-0 opacity-0"
          value={value}
          readOnly
          required
          aria-hidden
        />
      )}

      {open &&
        createPortal(
          <div
            ref={popoverRef}
            className="select-popover field-popover"
            role="listbox"
            aria-label={label ?? '선택'}
            style={{
              top: position.top,
              left: position.left,
              width: position.width,
            }}
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => selectOption(option.value)}
                  className={`select-option ${isSelected ? 'select-option--selected' : ''}`}
                >
                  <div className="truncate">{option.label}</div>
                  {isSelected && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      className="shrink-0 text-primary"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
}
