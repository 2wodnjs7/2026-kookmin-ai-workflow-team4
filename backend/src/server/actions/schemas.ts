import { z } from "zod";

/**
 * 액션아이템 상태 값. schema.prisma는 String이지만 앱 레벨에서 enum으로 검증한다.
 * 보드 4단계: 'todo'(해야할 일) | 'in_progress'(진행중) | 'done'(완료) | 'on_hold'(보류).
 */
export const ActionStatusSchema = z.enum(["todo", "in_progress", "done", "on_hold"]);

/** ISO8601 날짜 문자열(nullable). 비우려면 null. */
const isoDate = (field: string) =>
  z
    .string()
    .datetime({ message: `${field}는 ISO8601 문자열이어야 합니다.` })
    .nullable();

/** GET /api/actions 목록 필터·페이지네이션(모두 선택). */
export const ListActionsQuerySchema = z.object({
  status: ActionStatusSchema.optional(),
  assignee: z.string().trim().min(1).optional(),
  meetingId: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ListActionsQuery = z.infer<typeof ListActionsQuerySchema>;

/** POST /api/actions 생성. content·meetingId 필수, 나머지 선택. */
export const CreateActionSchema = z.object({
  content: z.string().trim().min(1, { message: "content는 필수입니다." }),
  meetingId: z.string().trim().min(1, { message: "meetingId는 필수입니다." }),
  assignee: z.string().trim().min(1).nullable().optional(),
  dueDate: isoDate("dueDate").optional(),
  startDate: isoDate("startDate").optional(),
  memo: z.string().nullable().optional(),
  status: ActionStatusSchema.default("todo"),
});

export type CreateActionInput = z.infer<typeof CreateActionSchema>;

/** PATCH /api/actions/:id 부분 수정. 최소 1개 필드 필요. */
export const UpdateActionSchema = z
  .object({
    status: ActionStatusSchema.optional(),
    content: z.string().trim().min(1).optional(),
    // null이면 담당자/기한/시작일을 비운다("미정"). 문자열은 trim 후 빈 값 불가.
    assignee: z.string().trim().min(1).nullable().optional(),
    dueDate: isoDate("dueDate").optional(),
    startDate: isoDate("startDate").optional(),
    memo: z.string().nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "수정할 필드를 최소 1개 제공해야 합니다.",
  });

export type UpdateActionInput = z.infer<typeof UpdateActionSchema>;
