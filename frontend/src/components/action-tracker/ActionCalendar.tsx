import { useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import type { ActionBoardItem } from '@/constants/actionTracker';

interface ActionCalendarProps {
  items: ActionBoardItem[];
}

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

function toDateKey(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export default function ActionCalendar({ items }: ActionCalendarProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const itemsByDate = useMemo(() => {
    const map = new Map<string, ActionBoardItem[]>();
    for (const item of items) {
      if (!item.dueDate) continue;
      const list = map.get(item.dueDate) ?? [];
      list.push(item);
      map.set(item.dueDate, list);
    }
    return map;
  }, [items]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (number | null)[] = [];

    for (let i = 0; i < startOffset; i += 1) {
      cells.push(null);
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(day);
    }

    return cells;
  }, [viewYear, viewMonth]);

  const monthLabel = `${viewYear}년 ${viewMonth + 1}월`;

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

  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  const dueItemsThisMonth = useMemo(() => {
    return items
      .filter((item) => {
        if (!item.dueDate) return false;
        const date = parseDateKey(item.dueDate);
        return date.getFullYear() === viewYear && date.getMonth() === viewMonth;
      })
      .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''));
  }, [items, viewYear, viewMonth]);

  return (
    <Card title="마감일 캘린더" description="액션 아이템 dueDate를 월별로 확인합니다.">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={goPrevMonth}
            className="rounded-lg glass px-3 py-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
          >
            이전
          </button>
          <div className="text-base font-semibold text-text-primary">{monthLabel}</div>
          <button
            type="button"
            onClick={goNextMonth}
            className="rounded-lg glass px-3 py-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
          >
            다음
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {WEEKDAY_LABELS.map((label, index) => (
            <div
              key={label}
              className={`py-2 text-center text-xs font-medium ${
                index === 0 ? 'text-error' : index === 6 ? 'text-primary' : 'text-text-muted'
              }`}
            >
              {label}
            </div>
          ))}

          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="min-h-16" />;
            }

            const dateKey = toDateKey(viewYear, viewMonth, day);
            const dayItems = itemsByDate.get(dateKey) ?? [];
            const isToday = dateKey === todayKey;

            return (
              <div
                key={dateKey}
                className={`min-h-16 rounded-lg border p-1.5 ${
                  isToday
                    ? 'border-primary bg-primary-subtle'
                    : dayItems.length > 0
                      ? 'border-primary/30 bg-bg-accent'
                      : 'border-border-default bg-bg-surface'
                }`}
              >
                <div
                  className={`text-xs font-medium ${
                    isToday ? 'text-primary' : 'text-text-secondary'
                  }`}
                >
                  {day}
                </div>
                {dayItems.length > 0 && (
                  <div className="mt-1 flex flex-col gap-0.5">
                    {dayItems.slice(0, 2).map((item) => (
                      <div
                        key={item.id}
                        className="truncate rounded bg-primary/15 px-1 text-[10px] text-primary"
                        title={item.content}
                      >
                        {item.content}
                      </div>
                    ))}
                    {dayItems.length > 2 && (
                      <div className="text-[10px] text-text-muted">+{dayItems.length - 2}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-sm font-medium text-text-primary">
            이번 달 마감 ({dueItemsThisMonth.length})
          </div>
          {dueItemsThisMonth.length === 0 ? (
            <div className="text-sm text-text-muted">마감 예정인 액션이 없습니다.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {dueItemsThisMonth.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center gap-2 rounded-lg glass px-3 py-2 text-sm"
                >
                  <div className="font-medium text-text-primary">{item.dueDate}</div>
                  <div className="text-text-primary">{item.content}</div>
                  <div className="text-xs text-text-secondary">{item.assignee}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
