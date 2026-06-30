export interface AssigneeColorClasses {
  badgeBg: string;
  badgeText: string;
  calendarBar: string;
}

const PALETTE: AssigneeColorClasses[] = [
  {
    badgeBg: 'bg-primary-subtle',
    badgeText: 'text-primary',
    calendarBar: 'bg-primary/40',
  },
  {
    badgeBg: 'bg-success-bg',
    badgeText: 'text-success',
    calendarBar: 'bg-success/40',
  },
  {
    badgeBg: 'bg-warning-bg',
    badgeText: 'text-warning',
    calendarBar: 'bg-warning/40',
  },
  {
    badgeBg: 'bg-error-bg',
    badgeText: 'text-error',
    calendarBar: 'bg-error/35',
  },
  {
    badgeBg: 'bg-bg-accent',
    badgeText: 'text-text-link',
    calendarBar: 'bg-primary-muted/45',
  },
  {
    badgeBg: 'bg-bg-muted',
    badgeText: 'text-text-secondary',
    calendarBar: 'bg-border-strong/50',
  },
];

const UNASSIGNED_COLOR: AssigneeColorClasses = {
  badgeBg: 'bg-warning-bg',
  badgeText: 'text-warning',
  calendarBar: 'bg-warning/30',
};

function hashAssignee(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return hash % PALETTE.length;
}

export function getAssigneeColor(assignee: string | null): AssigneeColorClasses {
  if (!assignee) return UNASSIGNED_COLOR;
  return PALETTE[hashAssignee(assignee)];
}

export function getUniqueAssignees(items: { assignee: string | null }[]): string[] {
  const names = new Set<string>();
  for (const item of items) {
    if (item.assignee) names.add(item.assignee);
  }
  return [...names].sort((a, b) => a.localeCompare(b, 'ko'));
}

export const UNASSIGNED_ASSIGNEE_KEY = '__unassigned__';

export function getAssigneeFilterKey(assignee: string | null): string {
  return assignee ?? UNASSIGNED_ASSIGNEE_KEY;
}

export interface AssigneeFilterOption {
  key: string;
  label: string;
  assignee: string | null;
}

export function getAssigneeFilterOptions(
  items: { assignee: string | null }[],
): AssigneeFilterOption[] {
  const options: AssigneeFilterOption[] = getUniqueAssignees(items).map((assignee) => ({
    key: assignee,
    label: assignee,
    assignee,
  }));

  if (items.some((item) => !item.assignee)) {
    options.push({
      key: UNASSIGNED_ASSIGNEE_KEY,
      label: '담당자 미정',
      assignee: null,
    });
  }

  return options;
}

export function filterItemsByAssignees<T extends { assignee: string | null }>(
  items: T[],
  activeKeys: Set<string>,
): T[] {
  if (activeKeys.size === 0) return [];
  return items.filter((item) => activeKeys.has(getAssigneeFilterKey(item.assignee)));
}
