import { useEffect, useMemo, useRef, useState } from 'react';
import Card from '@/components/ui/Card';
import ActionCalendarDayPanel from '@/components/action-tracker/ActionCalendarDayPanel';
import type { ActionBoardItem } from '@/constants/actionTracker';
import {
  formatDateRange,
  getItemDateRange,
  rangeOverlapsMonth,
  toDateKey,
} from '@/utils/actionDateRange';
import { getAssigneeColor, getAssigneeFilterOptions, filterItemsByAssignees } from '@/utils/assigneeColor';
import { buildMonthWeeks, buildWeekBarSegments } from '@/utils/calendarWeekBars';

interface ActionCalendarProps {
  items: ActionBoardItem[];
  onItemClick?: (item: ActionBoardItem) => void;
}

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const BAR_ROW_HEIGHT = 22;
const DAY_ROW_HEIGHT = 28;

export default function ActionCalendar({ items, onItemClick }: ActionCalendarProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [highlightItemId, setHighlightItemId] = useState<string | null>(null);
  const dayPanelRef = useRef<HTMLDivElement>(null);
  const [hoveredDateKeys, setHoveredDateKeys] = useState<Set<string>>(new Set());
  const [inactiveAssigneeFilters, setInactiveAssigneeFilters] = useState<Set<string>>(new Set());

  const assigneeFilterOptions = useMemo(() => getAssigneeFilterOptions(items), [items]);

  const activeAssigneeFilters = useMemo(() => {
    const active = new Set<string>();
    for (const option of assigneeFilterOptions) {
      if (!inactiveAssigneeFilters.has(option.key)) active.add(option.key);
    }
    return active;
  }, [assigneeFilterOptions, inactiveAssigneeFilters]);

  const filteredItems = useMemo(
    () => filterItemsByAssignees(items, activeAssigneeFilters),
    [items, activeAssigneeFilters],
  );

  useEffect(() => {
    setInactiveAssigneeFilters((prev) => {
      const validKeys = new Set(assigneeFilterOptions.map((option) => option.key));
      const next = new Set([...prev].filter((key) => validKeys.has(key)));
      return next.size === prev.size ? prev : next;
    });
  }, [assigneeFilterOptions]);

  const itemsWithRange = useMemo(
    () =>
      filteredItems
        .map((item) => ({ item, range: getItemDateRange(item) }))
        .filter((entry): entry is { item: ActionBoardItem; range: NonNullable<typeof entry.range> } =>
          Boolean(entry.range),
        ),
    [filteredItems],
  );

  const monthWeeks = useMemo(
    () => buildMonthWeeks(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const weeksWithBars = useMemo(
    () =>
      monthWeeks.map((week) => {
        const segments = buildWeekBarSegments(week, itemsWithRange);
        const maxLane = segments.reduce((max, seg) => Math.max(max, seg.lane), -1);
        return { week, segments, barRows: maxLane + 1 };
      }),
    [monthWeeks, itemsWithRange],
  );

  const monthLabel = `${viewYear}년 ${viewMonth + 1}월`;
  const todayKey = toDateKey(today);

  const rangeItemsThisMonth = useMemo(
    () =>
      itemsWithRange
        .filter(({ range }) => rangeOverlapsMonth(range, viewYear, viewMonth))
        .map(({ item }) => item)
        .sort((a, b) => {
          const aStart = getItemDateRange(a)?.start.getTime() ?? 0;
          const bStart = getItemDateRange(b)?.start.getTime() ?? 0;
          return aStart - bStart;
        }),
    [itemsWithRange, viewYear, viewMonth],
  );

  const toggleAssigneeFilter = (key: string) => {
    setInactiveAssigneeFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectDate = (dateKey: string | null, itemId?: string) => {
    if (!dateKey) return;
    setSelectedDateKey(dateKey);
    setHighlightItemId(itemId ?? null);
  };

  useEffect(() => {
    if (!selectedDateKey) return;
    const frame = requestAnimationFrame(() => {
      dayPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    return () => cancelAnimationFrame(frame);
  }, [selectedDateKey, highlightItemId]);

  const setColumnHover = (dateKeys: string[]) => {
    setHoveredDateKeys(new Set(dateKeys));
  };

  const clearColumnHover = () => {
    setHoveredDateKeys(new Set());
  };

  const getDayColumnClass = (
    dateKey: string | null,
    options: { isToday: boolean; isSelected: boolean; isHovered: boolean },
  ) =>
    [
      'calendar-day-column',
      options.isToday ? 'calendar-day-column--today' : '',
      options.isSelected ? 'calendar-day-column--selected' : '',
      options.isHovered ? 'calendar-day-column--hovered' : '',
      !dateKey ? 'calendar-day-column--empty' : '',
    ]
      .filter(Boolean)
      .join(' ');

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

  return (
    <Card
      title="일정 캘린더"
      description="날짜나 일정 바를 누르면 그날 해야 할 일·진행 상태를 확인할 수 있습니다."
    >
      <div className="flex flex-col gap-6">
        {assigneeFilterOptions.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="text-xs font-medium text-text-muted">담당자 필터</div>
            <div className="flex flex-wrap gap-2">
              {assigneeFilterOptions.map((option) => {
                const color = getAssigneeColor(option.assignee);
                const isActive = activeAssigneeFilters.has(option.key);

                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => toggleAssigneeFilter(option.key)}
                    aria-pressed={isActive}
                    className={[
                      'calendar-legend-chip',
                      color.badgeBg,
                      color.badgeText,
                      isActive ? 'calendar-legend-chip--active' : 'calendar-legend-chip--inactive',
                    ].join(' ')}
                  >
                    <div
                      className={`calendar-legend-chip__dot h-2 w-2 rounded-full ${color.calendarBar}`}
                    />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={goPrevMonth} className="calendar-nav-btn">
            ← 이전
          </button>
          <div className="rounded-xl border border-glass-border/50 bg-glass-bg/50 px-4 py-2 text-base font-semibold text-text-primary backdrop-blur-sm">
            {monthLabel}
          </div>
          <button type="button" onClick={goNextMonth} className="calendar-nav-btn">
            다음 →
          </button>
        </div>

        <div className="calendar-shell">
          <div className="grid grid-cols-7 gap-1.5 px-1">
            {WEEKDAY_LABELS.map((label, index) => (
              <div
                key={label}
                className={`calendar-weekday ${
                  index === 0 ? 'text-error' : index === 6 ? 'text-primary' : 'text-text-muted'
                }`}
              >
                {label}
              </div>
            ))}
          </div>

          {weeksWithBars.map(({ week, segments, barRows }, weekIndex) => {
            const rowCount = Math.max(barRows, 1);

            return (
              <div key={`week-${weekIndex}`} className="calendar-week-block">
                <div
                  className="calendar-week-grid"
                  style={{
                    gridTemplateRows: `${DAY_ROW_HEIGHT}px repeat(${rowCount}, ${BAR_ROW_HEIGHT}px)`,
                  }}
                >
                  {week.map((cell, colIndex) => {
                    const isToday = cell.dateKey === todayKey;
                    const isSelected =
                      selectedDateKey !== null && cell.dateKey === selectedDateKey;
                    const isHovered = cell.dateKey !== null && hoveredDateKeys.has(cell.dateKey);

                    return (
                      <button
                        key={`col-${weekIndex}-${colIndex}`}
                        type="button"
                        disabled={!cell.dateKey}
                        onClick={() => selectDate(cell.dateKey)}
                        onMouseEnter={() => {
                          if (cell.dateKey) setColumnHover([cell.dateKey]);
                        }}
                        onMouseLeave={clearColumnHover}
                        className={getDayColumnClass(cell.dateKey, {
                          isToday,
                          isSelected,
                          isHovered,
                        })}
                        style={{ gridColumn: colIndex + 1, gridRow: '1 / -1' }}
                        aria-label={cell.dateKey ? `${cell.day}일` : undefined}
                      />
                    );
                  })}

                  {week.map((cell, colIndex) => (
                    <div
                      key={`label-${weekIndex}-${colIndex}`}
                      className={`calendar-day-label ${
                        cell.dateKey === todayKey || cell.dateKey === selectedDateKey
                          ? 'text-primary'
                          : 'text-text-secondary'
                      }`}
                      style={{ gridColumn: colIndex + 1, gridRow: 1 }}
                    >
                      {cell.day !== null && <div>{cell.day}</div>}
                    </div>
                  ))}

                  {segments.map((segment) => {
                    const color = getAssigneeColor(segment.item.assignee);
                    const radius =
                      `${segment.roundLeft ? 'rounded-l-lg' : 'rounded-l-sm'} ` +
                      `${segment.roundRight ? 'rounded-r-lg' : 'rounded-r-sm'}`;
                    const spannedDateKeys = week
                      .slice(segment.startCol, segment.startCol + segment.span)
                      .map((cell) => cell.dateKey)
                      .filter((dateKey): dateKey is string => Boolean(dateKey));
                    const segmentStartDateKey = week[segment.startCol]?.dateKey;

                    return (
                      <button
                        key={`${segment.item.id}-${weekIndex}-${segment.startCol}-${segment.lane}`}
                        type="button"
                        onClick={() => {
                          if (segmentStartDateKey) {
                            selectDate(segmentStartDateKey, segment.item.id);
                          }
                          onItemClick?.(segment.item);
                        }}
                        onMouseEnter={() => setColumnHover(spannedDateKeys)}
                        onMouseLeave={clearColumnHover}
                        className={`calendar-bar-btn ${color.calendarBar} ${color.badgeText} ${radius}`}
                        style={{
                          gridColumn: `${segment.startCol + 1} / span ${segment.span}`,
                          gridRow: segment.lane + 2,
                        }}
                        title={segment.item.content}
                      >
                        {segment.showLabel ? segment.item.content : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {selectedDateKey && (
          <div ref={dayPanelRef}>
            <ActionCalendarDayPanel
              dateKey={selectedDateKey}
              items={filteredItems}
              highlightItemId={highlightItemId}
              onItemClick={onItemClick}
              onClose={() => {
                setSelectedDateKey(null);
                setHighlightItemId(null);
              }}
            />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <div className="text-sm font-medium text-text-primary">
            이번 달 일정 ({rangeItemsThisMonth.length})
          </div>
          {activeAssigneeFilters.size === 0 ? (
            <div className="text-sm text-text-muted">담당자를 하나 이상 선택하세요.</div>
          ) : rangeItemsThisMonth.length === 0 ? (
            <div className="text-sm text-text-muted">이번 달에 표시할 일정이 없습니다.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {rangeItemsThisMonth.map((item) => {
                const color = getAssigneeColor(item.assignee);
                const rangeLabel = formatDateRange(item);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onItemClick?.(item)}
                    className="flex flex-wrap items-center gap-2 rounded-lg glass px-3 py-2 text-left text-sm transition-colors hover:bg-bg-muted"
                  >
                    <div className={`rounded-full px-2 py-0.5 text-xs ${color.badgeBg} ${color.badgeText}`}>
                      {item.assignee ?? '담당자 미정'}
                    </div>
                    <div className="font-medium text-text-primary">{rangeLabel}</div>
                    <div className="text-text-primary">{item.content}</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
