import { Router } from "express";
import { ZodError } from "zod";
import { ApiError, asyncHandler } from "../http/errors.js";
import { searchMeetings } from "./service.js";
import { SearchQuerySchema } from "./schemas.js";

export const searchRouter = Router();

// GET /api/search?q=... — 회의 키워드 검색(목록 봉투 형태로 반환)
searchRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = parse(SearchQuerySchema, req.query);
    const result = await searchMeetings(query);
    res.json(result);
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
