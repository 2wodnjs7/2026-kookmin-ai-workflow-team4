import { Prisma } from "@prisma/client";
import { generateMeetingMinutes } from "../ai/llm.js";
import { prisma } from "../db.js";
import { ApiError } from "../http/errors.js";
import type { CreateMeetingInput, ListMeetingsQuery } from "./schemas.js";

const meetingWithActions = {
  include: { actionItems: { orderBy: { createdAt: "asc" } } },
} satisfies Prisma.MeetingDefaultArgs;

/**
 * POST /api/meetings — 전사본 → LLM으로 회의록(minutes)만 생성 → 저장 → 생성된 회의 반환.
 * 액션아이템은 여기서 자동 저장하지 않는다(#28). 응답의 `actionItems`는 항상 빈 배열이며,
 * 액션 생성은 별도 `POST /api/actions/generate`(BE-2)에서 클라이언트 요청 시에만 수행한다.
 */
export async function createMeeting(input: CreateMeetingInput) {
  const result = await generateMeetingMinutes({
    rawText: input.rawText,
    title: input.title,
    attendees: input.attendees,
  });

  const title = input.title ?? result.title;
  const attendees = input.attendees ?? result.attendees;
  const date = input.date ? new Date(input.date) : new Date();

  return prisma.meeting.create({
    data: {
      title,
      date,
      attendees: attendees as unknown as Prisma.InputJsonValue,
      rawText: input.rawText,
      minutes: result.minutes as unknown as Prisma.InputJsonValue,
    },
    ...meetingWithActions,
  });
}

/** GET /api/meetings — 최신순 목록(가벼운 요약). rawText 제외, 액션아이템 개수만. */
export async function listMeetings(query: ListMeetingsQuery) {
  const { limit, offset } = query;
  const [rows, total] = await Promise.all([
    prisma.meeting.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true,
        title: true,
        date: true,
        attendees: true,
        minutes: true,
        createdAt: true,
        _count: { select: { actionItems: true } },
      },
    }),
    prisma.meeting.count(),
  ]);

  const meetings = rows.map(({ _count, ...rest }) => ({
    ...rest,
    actionItemCount: _count.actionItems,
  }));

  return { meetings, total, limit, offset };
}

/** GET /api/meetings/:id — 단건 상세(actionItems 포함). 없으면 404. */
export async function getMeetingById(id: string) {
  const meeting = await prisma.meeting.findUnique({
    where: { id },
    ...meetingWithActions,
  });
  if (!meeting) {
    throw new ApiError("NOT_FOUND", `id가 ${id}인 회의를 찾을 수 없습니다.`);
  }
  return meeting;
}
