import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";
import { ApiError } from "../http/errors.js";
import type { ListActionsQuery, UpdateActionInput } from "./schemas.js";

/** 액션아이템 + 소속 회의의 가벼운 컨텍스트(트래커 화면용). */
const actionWithMeeting = {
  include: { meeting: { select: { id: true, title: true, date: true } } },
} satisfies Prisma.ActionItemDefaultArgs;

/** GET /api/actions — 필터(status/assignee/meetingId)·페이지네이션, 최신순. */
export async function listActions(query: ListActionsQuery) {
  const { status, assignee, meetingId, limit, offset } = query;
  const where: Prisma.ActionItemWhereInput = {
    ...(status ? { status } : {}),
    ...(assignee ? { assignee } : {}),
    ...(meetingId ? { meetingId } : {}),
  };

  const [actions, total] = await Promise.all([
    prisma.actionItem.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      ...actionWithMeeting,
    }),
    prisma.actionItem.count({ where }),
  ]);

  return { actions, total, limit, offset };
}

/** PATCH /api/actions/:id — 부분 수정(상태 토글 등). 없으면 404. */
export async function updateAction(id: string, input: UpdateActionInput) {
  const existing = await prisma.actionItem.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError("NOT_FOUND", `id가 ${id}인 액션아이템을 찾을 수 없습니다.`);
  }

  // 제공된 필드만 갱신(undefined는 건드리지 않음, null은 명시적으로 비움).
  const data: Prisma.ActionItemUpdateInput = {};
  if (input.status !== undefined) data.status = input.status;
  if (input.content !== undefined) data.content = input.content;
  if (input.assignee !== undefined) data.assignee = input.assignee;
  if (input.dueDate !== undefined) {
    data.dueDate = input.dueDate === null ? null : new Date(input.dueDate);
  }

  return prisma.actionItem.update({ where: { id }, data });
}
