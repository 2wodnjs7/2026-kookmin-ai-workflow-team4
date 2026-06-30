import type { ActionBoardItem } from '@/constants/actionTracker';
import { isDateInRange, toDateKey, toDateKeyFromParts } from '@/utils/actionDateRange';

export interface CalendarCell {
  day: number | null;
  date: Date | null;
  dateKey: string | null;
}

export interface WeekBarSegment {
  item: ActionBoardItem;
  startCol: number;
  span: number;
  lane: number;
  roundLeft: boolean;
  roundRight: boolean;
  showLabel: boolean;
}

export function buildMonthWeeks(year: number, month: number): CalendarCell[][] {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks: CalendarCell[][] = [];
  let currentWeek: CalendarCell[] = [];

  for (let i = 0; i < firstDay.getDay(); i += 1) {
    currentWeek.push({ day: null, date: null, dateKey: null });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    currentWeek.push({
      day,
      date,
      dateKey: toDateKeyFromParts(year, month, day),
    });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({ day: null, date: null, dateKey: null });
    }
    weeks.push(currentWeek);
  }

  return weeks;
}

function assignLanes(
  segments: Omit<WeekBarSegment, 'lane'>[],
): WeekBarSegment[] {
  const placed: WeekBarSegment[] = [];

  const sorted = [...segments].sort((a, b) => {
    if (a.startCol !== b.startCol) return a.startCol - b.startCol;
    return b.span - a.span;
  });

  for (const segment of sorted) {
    const endCol = segment.startCol + segment.span - 1;
    let lane = 0;

    while (
      placed.some((other) => {
        if (other.lane !== lane) return false;
        const otherEnd = other.startCol + other.span - 1;
        return !(endCol < other.startCol || segment.startCol > otherEnd);
      })
    ) {
      lane += 1;
    }

    placed.push({ ...segment, lane });
  }

  return placed;
}

export function buildWeekBarSegments(
  week: CalendarCell[],
  items: { item: ActionBoardItem; range: { start: Date; end: Date } }[],
): WeekBarSegment[] {
  const raw: Omit<WeekBarSegment, 'lane'>[] = [];

  for (const { item, range } of items) {
    let startCol = -1;
    let endCol = -1;

    for (let col = 0; col < week.length; col += 1) {
      const cell = week[col];
      if (!cell.date) continue;
      if (!isDateInRange(cell.date, range)) continue;
      if (startCol === -1) startCol = col;
      endCol = col;
    }

    if (startCol === -1 || endCol === -1) continue;

    const startCell = week[startCol];
    const endCell = week[endCol];
    if (!startCell.dateKey || !endCell.dateKey) continue;

    const rangeStartKey = toDateKey(range.start);
    const rangeEndKey = toDateKey(range.end);

    raw.push({
      item,
      startCol,
      span: endCol - startCol + 1,
      roundLeft: rangeStartKey >= startCell.dateKey,
      roundRight: rangeEndKey <= endCell.dateKey,
      showLabel: rangeStartKey >= startCell.dateKey && rangeStartKey <= endCell.dateKey,
    });
  }

  return assignLanes(raw);
}
