import { Router } from "express";
import { ZodError } from "zod";
import { ApiError, asyncHandler } from "../http/errors.js";
import { listActions, updateAction } from "./service.js";
import { ListActionsQuerySchema, UpdateActionSchema } from "./schemas.js";

export const actionsRouter = Router();

// GET /api/actions — 액션아이템 목록(필터·페이징, 회의 컨텍스트 포함)
actionsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = parse(ListActionsQuerySchema, req.query);
    const result = await listActions(query);
    res.json(result);
  }),
);

// PATCH /api/actions/:id — 부분 수정(상태 토글 등)
actionsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id) {
      throw new ApiError("VALIDATION_ERROR", "id가 필요합니다.");
    }
    const input = parse(UpdateActionSchema, req.body);
    const updated = await updateAction(id, input);
    res.json(updated);
  }),
);

/** zod 파싱 — 실패 시 계약 형식의 VALIDATION_ERROR로 변환(meetings/router와 동일 규약). */
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
