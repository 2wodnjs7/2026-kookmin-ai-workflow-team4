import { z } from "zod";

/**
 * LLM이 생성하는 회의록(minutes) 본문. 데이터 계약(schema.prisma / api-contract.md)과 일치한다.
 * mock 모드와 live 모드의 출력 스키마는 동일하다.
 */
export const MinutesSchema = z.object({
  // 회의 전체를 2~4문장으로 요약(전사 원문 복붙 금지). FE "회의 요약" 카드.
  summary: z.string().default(""),
  // 핵심 논의·결정을 실행 가능한 bullet로. FE "핵심 내용" 카드.
  keyPoints: z.array(z.string()).default([]),
  agenda: z.array(z.string()).default([]), // 안건[]
  discussion: z.string().default(""), // 논의요약
  decisions: z.array(z.string()).default([]), // 결정사항[]
});

/**
 * 회의록 생성 결과(minutes 전용). 액션아이템은 포함하지 않는다(#28).
 * `POST /api/meetings`가 이 결과만 저장한다.
 */
export const MeetingMinutesResultSchema = z.object({
  title: z.string(),
  attendees: z.array(z.string()),
  minutes: MinutesSchema,
});

/** LLM이 추출하는 액션아이템 1건. 계약(content/assignee/dueDate)과 일치. */
export const GeneratedActionItemSchema = z.object({
  content: z.string(),
  // 불명확하면 "[담당자 확인 필요]" (AGENTS.md 규칙). null 허용.
  assignee: z.string().nullable(),
  // ISO8601 문자열 또는 null(미정).
  dueDate: z.string().nullable(),
});

/** 액션아이템 추출 응답(actions 전용). `POST /api/actions/generate`(BE-2)에서 사용. */
export const GeneratedActionsResultSchema = z.object({
  actionItems: z.array(GeneratedActionItemSchema).default([]),
});

export type Minutes = z.infer<typeof MinutesSchema>;
export type MeetingMinutesResult = z.infer<typeof MeetingMinutesResultSchema>;
export type GeneratedActionItem = z.infer<typeof GeneratedActionItemSchema>;
export type GeneratedActionsResult = z.infer<typeof GeneratedActionsResultSchema>;

/** 어댑터 입력: 전사본 + (선택) 사용자가 제공한 메타데이터. */
export interface GenerateInput {
  rawText: string;
  title?: string;
  attendees?: string[];
}

export type LlmMode = "mock" | "live";
