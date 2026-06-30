import type { ActionBoardItem } from '@/constants/actionTracker';

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function toDateKeyFromParts(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

/** 시작일·마감일 중 하나라도 있으면 구간 반환. 둘 다 없으면 null. */
export function getItemDateRange(item: ActionBoardItem): { start: Date; end: Date } | null {
  const startKey = item.startDate ?? item.dueDate;
  const endKey = item.dueDate ?? item.startDate;
  if (!startKey || !endKey) return null;

  const start = parseDateKey(startKey);
  const end = parseDateKey(endKey);
  if (start.getTime() <= end.getTime()) {
    return { start, end };
  }
  return { start: end, end: start };
}

export function isDateInRange(date: Date, range: { start: Date; end: Date }): boolean {
  const time = date.getTime();
  return time >= range.start.getTime() && time <= range.end.getTime();
}

export function formatDateRange(item: ActionBoardItem): string | null {
  const range = getItemDateRange(item);
  if (!range) return null;
  const start = toDateKey(range.start);
  const end = toDateKey(range.end);
  return start === end ? start : `${start} ~ ${end}`;
}

export function rangeOverlapsMonth(
  range: { start: Date; end: Date },
  year: number,
  month: number,
): boolean {
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  return range.start.getTime() <= monthEnd.getTime() && range.end.getTime() >= monthStart.getTime();
}

export function getItemsOnDate(items: ActionBoardItem[], dateKey: string): ActionBoardItem[] {
  const date = parseDateKey(dateKey);
  return items.filter((item) => {
    const range = getItemDateRange(item);
    return range !== null && isDateInRange(date, range);
  });
}

/** 해당 날짜가 일정 구간에서 어떤 의미인지 (시작 / 마감 / 진행 중). */
export function getDateMilestone(item: ActionBoardItem, dateKey: string): string {
  const range = getItemDateRange(item);
  if (!range) return '일정 없음';

  const startKey = toDateKey(range.start);
  const endKey = toDateKey(range.end);

  if (dateKey === startKey && dateKey === endKey) return '당일';
  if (dateKey === startKey) return '시작일';
  if (dateKey === endKey) return '마감일';
  return '진행 중';
}

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'];

export function formatDateKeyLabel(dateKey: string): string {
  const date = parseDateKey(dateKey);
  const weekday = WEEKDAY_KO[date.getDay()];
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${weekday})`;
}
