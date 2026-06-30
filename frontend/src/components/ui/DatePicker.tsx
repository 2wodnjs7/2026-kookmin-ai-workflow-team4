import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { formatDateKeyLabel, parseDateKey, toDateKey } from '@/utils/actionDateRange';
import { buildMonthWeeks } from '@/utils/calendarWeekBars';

import { getFieldPopoverPosition } from '@/utils/fieldPopoverPosition';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const POPOVER_WIDTH = 304;

interface DatePickerProps {
  label?: string;
  id?: string;
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  required?: boolean;
  clearable?: boolean;
}

export default function DatePicker({
  label,
  id,
  value,
  onChange,
  placeholder = '날짜 선택',
  required = false,
  clearable = true,
}: DatePickerProps) {
  const generatedId = useId();
  const pickerId = id ?? generatedId;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const todayKey = toDateKey(today);
  const initialDate = value ? parseDateKey(value) : today;

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  const monthWeeks = buildMonthWeeks(viewYear, viewMonth);
  const monthLabel = `${viewYear}년 ${viewMonth + 1}월`;
  const displayValue = value ? formatDateKeyLabel(value) : '';

  const updatePosition = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition(getFieldPopoverPosition(rect, POPOVER_WIDTH));
  };

  const openPicker = () => {
    if (value) {
      const selected = parseDateKey(value);
      setViewYear(selected.getFullYear());
      setViewMonth(selected.getMonth());
    }
    updatePosition();
    setOpen(true);
  };

  const closePicker = () => setOpen(false);

  const selectDate = (dateKey: string | null) => {
    if (!dateKey) return;
    onChange(dateKey);
    closePicker();
  };

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
      return;
    }
    setViewMonth((m) => m - 1);
  };

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
      return;
    }
    setViewMonth((m) => m + 1);
  };

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closePicker();
    };

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      closePicker();
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
    <div className="relative flex flex-col gap-1.5">
      {label && (
        <label htmlFor={pickerId} className="text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}

      <button
        ref={triggerRef}
        id={pickerId}
        type="button"
        onClick={() => (open ? closePicker() : openPicker())}
        className={`field-control field-picker-trigger ${open ? 'field-picker-trigger--open' : ''}`}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <div className={`truncate ${displayValue ? 'text-text-primary' : 'text-text-muted'}`}>
          {displayValue || placeholder}
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="shrink-0 text-text-muted"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      </button>

      {required && (
        <input
          tabIndex={-1}
          className="pointer-events-none absolute h-0 w-0 opacity-0"
          value={value ?? ''}
          readOnly
          required
          aria-hidden
        />
      )}

      {open &&
        createPortal(
          <div
            ref={popoverRef}
            className="datepicker-popover field-popover"
            role="dialog"
            aria-label={label ?? '날짜 선택'}
            style={{
              top: position.top,
              left: position.left,
            }}
          >
            <div className="calendar-shell calendar-shell--compact">
              <div className="flex items-center justify-between gap-2">
                <button type="button" onClick={goPrevMonth} className="calendar-nav-btn calendar-nav-btn--sm">
                  ←
                </button>
                <div className="datepicker-month-label">{monthLabel}</div>
                <button type="button" onClick={goNextMonth} className="calendar-nav-btn calendar-nav-btn--sm">
                  →
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {WEEKDAY_LABELS.map((weekday, index) => (
                  <div
                    key={weekday}
                    className={`calendar-weekday calendar-weekday--compact ${
                      index === 0 ? 'text-error' : index === 6 ? 'text-primary' : 'text-text-muted'
                    }`}
                  >
                    {weekday}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {monthWeeks.flat().map((cell, index) => {
                  const isToday = cell.dateKey === todayKey;
                  const isSelected = value !== null && cell.dateKey === value;
                  const dayClass = [
                    'calendar-day-btn',
                    'calendar-day-btn--compact',
                    isToday ? 'calendar-day-btn--today' : '',
                    isSelected ? 'calendar-day-btn--selected' : '',
                    !cell.dateKey ? 'cursor-default' : 'text-text-secondary',
                  ]
                    .filter(Boolean)
                    .join(' ');

                  return (
                    <button
                      key={`${cell.dateKey ?? 'empty'}-${index}`}
                      type="button"
                      disabled={!cell.dateKey}
                      onClick={() => selectDate(cell.dateKey)}
                      className={dayClass}
                    >
                      {cell.day !== null && <div>{cell.day}</div>}
                    </button>
                  );
                })}
              </div>

              {clearable && value && (
                <div className="flex justify-end border-t border-glass-border/50 pt-2">
                  <button
                    type="button"
                    className="datepicker-clear-btn"
                    onClick={() => {
                      onChange(null);
                      closePicker();
                    }}
                  >
                    날짜 지우기
                  </button>
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
