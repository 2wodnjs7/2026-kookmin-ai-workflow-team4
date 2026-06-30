import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { ApiError } from "../http/errors.js";
import {
  buildUserPrompt,
  GEMINI_ACTIONS_SYSTEM_PROMPT,
  GEMINI_MINUTES_SYSTEM_PROMPT,
} from "./prompts.js";
import {
  GeneratedActionItemSchema,
  MeetingMinutesResultSchema,
  type GenerateInput,
  type GeneratedActionItem,
  type MeetingMinutesResult,
} from "./types.js";

interface GeminiConfig {
  apiKey: string;
  model: string;
}

export function readGeminiConfig(): GeminiConfig | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  return {
    apiKey,
    model: process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash",
  };
}

// Gemini가 반환하는 회의록 원시 형태(관대한 파싱 — 일부 누락도 기본값으로 보정).
const GeminiMinutesResponseSchema = z.object({
  title: z.string().optional().default(""),
  attendees: z.array(z.string()).optional().default([]),
  minutes: z
    .object({
      summary: z.string().optional().default(""),
      keyPoints: z.array(z.string()).optional().default([]),
      agenda: z.array(z.string()).optional().default([]),
      discussion: z.string().optional().default(""),
      decisions: z.array(z.string()).optional().default([]),
    })
    .optional()
    .default({}),
});

// Gemini가 반환하는 액션아이템 원시 형태.
const GeminiActionItemSchema = z.object({
  owner: z.string().nullable().optional(),
  task: z.string(),
  due: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
});

const GeminiActionsResponseSchema = z.object({
  action_items: z.array(GeminiActionItemSchema).optional().default([]),
});

/**
 * Gemini(@google/genai)로 회의록(minutes)을 생성한다(액션아이템 제외, #28).
 * - responseMimeType: application/json + 프롬프트로 JSON 강제
 * - 출력 스키마는 mock/다른 live provider와 동일하다.
 */
export async function generateGeminiMinutes(
  input: GenerateInput,
  config: GeminiConfig,
): Promise<MeetingMinutesResult> {
  const parsed = await callGemini(input, config, GEMINI_MINUTES_SYSTEM_PROMPT);

  const result = GeminiMinutesResponseSchema.safeParse(parsed);
  if (!result.success) {
    throw new ApiError("LLM_ERROR", "Gemini 응답이 예상 스키마와 일치하지 않습니다.");
  }
  const g = result.data;

  const artifacts: MeetingMinutesResult = {
    title: input.title ?? (g.title.trim() || "회의록 (제목 미정)"),
    attendees: input.attendees ?? g.attendees,
    minutes: {
      summary: g.minutes.summary,
      keyPoints: g.minutes.keyPoints,
      agenda: g.minutes.agenda,
      discussion: g.minutes.discussion,
      decisions: g.minutes.decisions,
    },
  };

  // 최종적으로 공용 계약 스키마로 한 번 더 검증한다.
  return MeetingMinutesResultSchema.parse(artifacts);
}

/**
 * Gemini로 액션아이템을 추출한다(회의록 본문 제외, #28).
 * Gemini 원시 응답(action_items owner/task/due/status)을 계약(content/assignee/dueDate)으로 매핑.
 * - owner 불명확 시 플레이스홀더(AGENTS.md 규칙).
 * - status는 트래커(BE-2)가 관리하므로 여기선 매핑하지 않는다(생성 시 항상 'todo').
 */
export async function generateGeminiActions(
  input: GenerateInput,
  config: GeminiConfig,
): Promise<GeneratedActionItem[]> {
  const parsed = await callGemini(input, config, GEMINI_ACTIONS_SYSTEM_PROMPT);

  const result = GeminiActionsResponseSchema.safeParse(parsed);
  if (!result.success) {
    throw new ApiError("LLM_ERROR", "Gemini 응답이 예상 스키마와 일치하지 않습니다.");
  }

  return result.data.action_items.map((item) =>
    GeneratedActionItemSchema.parse({
      content: item.task,
      assignee: item.owner?.trim() ? item.owner.trim() : "[담당자 확인 필요]",
      dueDate: normalizeDue(item.due),
    }),
  );
}

/** Gemini generateContent 호출 + JSON 파싱(코드펜스 제거) 공통 처리. */
async function callGemini(
  input: GenerateInput,
  config: GeminiConfig,
  systemInstruction: string,
): Promise<unknown> {
  const ai = new GoogleGenAI({ apiKey: config.apiKey });

  let text: string | undefined;
  try {
    const response = await ai.models.generateContent({
      model: config.model,
      contents: buildUserPrompt(input),
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    });
    text = response.text;
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : String(cause);
    throw new ApiError("LLM_ERROR", `Gemini 호출에 실패했습니다: ${reason}`);
  }

  if (!text) {
    throw new ApiError("LLM_ERROR", "Gemini 응답이 비어 있습니다.");
  }

  try {
    return JSON.parse(stripCodeFence(text));
  } catch {
    throw new ApiError("LLM_ERROR", "Gemini 응답을 JSON으로 파싱할 수 없습니다.");
  }
}

/** 유효한 날짜 문자열이면 그대로(서비스가 Date 변환), 아니면 null. */
function normalizeDue(due: string | null | undefined): string | null {
  if (!due) return null;
  const d = new Date(due);
  return Number.isNaN(d.getTime()) ? null : due;
}

/**
 * Gemini가 responseMimeType 설정에도 가끔 ```json ... ``` 코드펜스로 감싸는 경우가 있어,
 * JSON.parse 전에 펜스를 제거한다.
 */
function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed.startsWith("```")) return trimmed;
  return trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}
