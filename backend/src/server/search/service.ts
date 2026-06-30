import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";
import type { SearchQuery } from "./schemas.js";

/**
 * GET /api/search — 키워드로 회의 검색.
 * title·rawText·액션아이템 content에서 부분 일치(SQLite LIKE, 한글은 대소문자 무관)로 매칭한다.
 *
 * 참고: attendees·minutes는 Json(TEXT) 컬럼이라 Prisma 필터로 직접 들어가지 못하지만,
 *       전체 전사본 rawText에 참석자·논의 내용이 포함되므로 사실상 함께 검색된다.
 *       응답은 GET /api/meetings 목록과 동일하게 rawText를 제외하고 actionItemCount만 요약한다.
 */
export async function searchMeetings(query: SearchQuery) {
  const { q, limit, offset } = query;

  const where: Prisma.MeetingWhereInput = {
    OR: [
      { title: { contains: q } },
      { rawText: { contains: q } },
      { actionItems: { some: { content: { contains: q } } } },
    ],
  };

  const [rows, total] = await Promise.all([
    prisma.meeting.findMany({
      where,
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
    prisma.meeting.count({ where }),
  ]);

  const meetings = rows.map(({ _count, ...rest }) => ({
    ...rest,
    actionItemCount: _count.actionItems,
  }));

  return { query: q, meetings, total, limit, offset };
}
