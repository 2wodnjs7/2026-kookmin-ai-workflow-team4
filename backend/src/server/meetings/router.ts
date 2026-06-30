import { Router } from "express";
import { ZodError } from "zod";
import { getLlmMode } from "../ai/llm.js";
import { ApiError, asyncHandler } from "../http/errors.js";
import { createMeeting, getMeetingById, listMeetings } from "./service.js";
import { CreateMeetingSchema, ListMeetingsQuerySchema } from "./schemas.js";

export const meetingsRouter = Router();

// POST /api/meetings — 전사본으로 회의록(minutes)만 생성/저장 (액션아이템 제외, #28)
meetingsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = parse(CreateMeetingSchema, req.body);
    const meeting = await createMeeting(input);
    res.setHeader("X-LLM-Mode", getLlmMode());
    res.status(201).json(meeting);
  }),
);

// GET /api/meetings — 목록(최신순, 페이징)
meetingsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = parse(ListMeetingsQuerySchema, req.query);
    const result = await listMeetings(query);
    res.json(result);
  }),
);

// GET /api/meetings/:id — 단건 상세
meetingsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id) {
      throw new ApiError("VALIDATION_ERROR", "id가 필요합니다.");
    }
    const meeting = await getMeetingById(id);
    res.json(meeting);
  }),
);

/** zod 파싱 — 실패 시 계약 형식의 VALIDATION_ERROR로 변환. */
function parse<T>(schema: { parse: (data: unknown) => T }, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (err) {
    if (err instanceof ZodError) {
      const message = err.issues.map((i) => i.message).join(" ");
      throw new ApiError("VALIDATION_ERROR", message || "요청이 올바르지 않습니다.");
    }
    throw err;
  }
}
