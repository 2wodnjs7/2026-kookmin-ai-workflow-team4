import { Prisma } from "@prisma/client";
import { generateActionItems } from "../ai/llm.js";
import { prisma } from "../db.js";
import { ApiError } from "../http/errors.js";
import type {
  CreateActionInput,
  GenerateActionsInput,
  ListActionsQuery,
  UpdateActionInput,
} from "./schemas.js";

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

/** POST /api/actions — 액션아이템 생성. meetingId가 가리키는 회의가 없으면 404. */
export async function createAction(input: CreateActionInput) {
  const meeting = await prisma.meeting.findUnique({
    where: { id: input.meetingId },
    select: { id: true },
  });
  if (!meeting) {
    throw new ApiError(
      "NOT_FOUND",
      `meetingId가 ${input.meetingId}인 회의를 찾을 수 없습니다.`,
    );
  }

  return prisma.actionItem.create({
    data: {
      meetingId: input.meetingId,
      content: input.content,
      status: input.status,
      assignee: input.assignee ?? null,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      startDate: input.startDate ? new Date(input.startDate) : null,
      memo: input.memo ?? null,
    },
    ...actionWithMeeting,
  });
}

/**
 * POST /api/actions/generate — 회의 전사본에서 액션아이템을 LLM으로 추출해 저장한다(#28 §2).
 * - meetingId가 가리키는 회의가 없으면 404.
 * - 이미 해당 회의에 저장된 content는 제외(중복 미생성).
 * - mode='one'이면 새 항목 1건만, 'all'이면 남은 전체 저장.
 * - 추출/저장할 새 항목이 없으면 generated=0.
 * - LLM 실패는 generateActionItems가 ApiError("LLM_ERROR") → 502로 변환된다.
 */
export async function generateActions(input: GenerateActionsInput) {
  const meeting = await prisma.meeting.findUnique({
    where: { id: input.meetingId },
    select: { id: true, rawText: true, title: true, attendees: true },
  });
  if (!meeting) {
    throw new ApiError(
      "NOT_FOUND",
      `meetingId가 ${input.meetingId}인 회의를 찾을 수 없습니다.`,
    );
  }

  // 이미 저장된 액션 content(중복 제외용).
  const existingActions = await prisma.actionItem.findMany({
    where: { meetingId: input.meetingId },
    select: { content: true },
  });
  const seen = new Set(existingActions.map((a) => a.content.trim()));

  // 회의 메타로 LLM 액션 추출(어댑터는 BE-1 소유). attendees는 Json → string[]로 사용.
  const attendees = Array.isArray(meeting.attendees)
    ? (meeting.attendees as unknown[]).filter((v): v is string => typeof v === "string")
    : undefined;
  const extracted = await generateActionItems({
    rawText: meeting.rawText,
    title: meeting.title,
    attendees,
  });

  // 기존 + 추출 결과 내 중복 content 모두 제외.
  const fresh = extracted.filter((item) => {
    const content = item.content.trim();
    if (!content || seen.has(content)) return false;
    seen.add(content);
    return true;
  });

  const toCreate = input.mode === "one" ? fresh.slice(0, 1) : fresh;
  if (toCreate.length === 0) {
    return { actions: [], generated: 0 };
  }

  const actions = await prisma.$transaction(
    toCreate.map((item) =>
      prisma.actionItem.create({
        data: {
          meetingId: input.meetingId,
          content: item.content.trim(),
          assignee: item.assignee ?? null,
          dueDate: item.dueDate ? new Date(item.dueDate) : null,
          status: "todo",
        },
      }),
    ),
  );

  return { actions, generated: actions.length };
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
  if (input.memo !== undefined) data.memo = input.memo;
  if (input.dueDate !== undefined) {
    data.dueDate = input.dueDate === null ? null : new Date(input.dueDate);
  }
  if (input.startDate !== undefined) {
    data.startDate = input.startDate === null ? null : new Date(input.startDate);
  }

  // GET/POST와 동일하게 meeting 컨텍스트를 포함해 반환(FE가 목록 항목 교체 시 형태 일치).
  return prisma.actionItem.update({ where: { id }, data, ...actionWithMeeting });
}

/** DELETE /api/actions/:id — 액션아이템 1건 삭제(하드 삭제). 없으면 404. */
export async function deleteAction(id: string) {
  const existing = await prisma.actionItem.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError("NOT_FOUND", `id가 ${id}인 액션아이템을 찾을 수 없습니다.`);
  }
  await prisma.actionItem.delete({ where: { id } });
}
