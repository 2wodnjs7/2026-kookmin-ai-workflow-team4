import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { ApiError } from "../http/errors.js";
import { buildUserPrompt, GEMINI_SYSTEM_PROMPT } from "./prompts.js";
import {
  GeneratedArtifactsSchema,
  type GenerateInput,
  type GeneratedArtifacts,
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

// Gemini가 반환하는 원시 형태(관대한 파싱 — 일부 누락도 기본값으로 보정).
const GeminiActionItemSchema = z.object({
  owner: z.string().nullable().optional(),
  task: z.string(),
  due: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
});

const GeminiResponseSchema = z.object({
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
  action_items: z.array(GeminiActionItemSchema).optional().default([]),
});

/**
 * Google Gemini(@google/genai)로 회의록을 생성한다.
 * - responseMimeType: application/json + 프롬프트로 JSON 강제
 * - Gemini 원시 응답(action_items owner/task/due/status)을 계약(GeneratedArtifacts)으로 매핑
 * - 출력 스키마는 mock/다른 live provider와 동일하다.
 */
export async function generateGemini(
  input: GenerateInput,
  config: GeminiConfig,
): Promise<GeneratedArtifacts> {
  const ai = new GoogleGenAI({ apiKey: config.apiKey });

  let text: string | undefined;
  try {
    const response = await ai.models.generateContent({
      model: config.model,
      contents: buildUserPrompt(input),
      config: {
        systemInstruction: GEMINI_SYSTEM_PROMPT,
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

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripCodeFence(text));
  } catch {
    throw new ApiError("LLM_ERROR", "Gemini 응답을 JSON으로 파싱할 수 없습니다.");
  }

  const result = GeminiResponseSchema.safeParse(parsed);
  if (!result.success) {
    throw new ApiError("LLM_ERROR", "Gemini 응답이 예상 스키마와 일치하지 않습니다.");
  }
  const g = result.data;

  const artifacts: GeneratedArtifacts = {
    title: input.title ?? (g.title.trim() || "회의록 (제목 미정)"),
    attendees: input.attendees ?? g.attendees,
    minutes: {
      summary: g.minutes.summary,
      keyPoints: g.minutes.keyPoints,
      agenda: g.minutes.agenda,
      discussion: g.minutes.discussion,
      decisions: g.minutes.decisions,
    },
    // action_items → 계약 매핑. owner 불명확 시 플레이스홀더(AGENTS.md 규칙).
    // status는 생성 시 항상 'todo'(서비스에서 설정) — 상태 전이는 BE-2 트래커 담당.
    actionItems: g.action_items.map((item) => ({
      content: item.task,
      assignee: item.owner?.trim() ? item.owner.trim() : "[담당자 확인 필요]",
      dueDate: normalizeDue(item.due),
    })),
  };

  // 최종적으로 공용 계약 스키마로 한 번 더 검증한다.
  return GeneratedArtifactsSchema.parse(artifacts);
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
