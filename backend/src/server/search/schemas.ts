import { z } from "zod";

/** GET /api/search 쿼리. q 필수. */
export const SearchQuerySchema = z.object({
  q: z.string().trim().min(1, "검색어(q)는 필수입니다."),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type SearchQuery = z.infer<typeof SearchQuerySchema>;
