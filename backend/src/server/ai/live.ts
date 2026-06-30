import { ApiError } from "../http/errors.js";
import {
  ACTIONS_SYSTEM_PROMPT,
  buildUserPrompt,
  MINUTES_SYSTEM_PROMPT,
} from "./prompts.js";
import {
  GeneratedActionsResultSchema,
  MeetingMinutesResultSchema,
  type GenerateInput,
  type GeneratedActionItem,
  type MeetingMinutesResult,
} from "./types.js";

interface LiveConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export function readLiveConfig(): LiveConfig | null {
  const apiKey = process.env.LLM_API_KEY?.trim();
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl: (process.env.LLM_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/$/, ""),
    model: process.env.LLM_MODEL?.trim() || "gpt-4o-mini",
  };
}

/**
 * OpenAI 호환 Chat Completions로 회의록(minutes)을 생성한다(액션아이템 제외, #28).
 * JSON 모드를 사용하고, 응답을 계약 스키마로 검증한다.
 */
export async function generateLiveMinutes(
  input: GenerateInput,
  config: LiveConfig,
): Promise<MeetingMinutesResult> {
  const parsed = await callLive(input, config, MINUTES_SYSTEM_PROMPT);

  const result = MeetingMinutesResultSchema.safeParse(parsed);
  if (!result.success) {
    throw new ApiError("LLM_ERROR", "LLM 응답이 회의록 스키마와 일치하지 않습니다.");
  }
  return result.data;
}

/**
 * OpenAI 호환 Chat Completions로 액션아이템을 추출한다(회의록 본문 제외, #28).
 */
export async function generateLiveActions(
  input: GenerateInput,
  config: LiveConfig,
): Promise<GeneratedActionItem[]> {
  const parsed = await callLive(input, config, ACTIONS_SYSTEM_PROMPT);

  const result = GeneratedActionsResultSchema.safeParse(parsed);
  if (!result.success) {
    throw new ApiError("LLM_ERROR", "LLM 응답이 액션아이템 스키마와 일치하지 않습니다.");
  }
  return result.data.actionItems;
}

/** OpenAI 호환 chat/completions 호출 + JSON 파싱 공통 처리. */
async function callLive(
  input: GenerateInput,
  config: LiveConfig,
  systemPrompt: string,
): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: buildUserPrompt(input) },
        ],
      }),
    });
  } catch (cause) {
    throw new ApiError("LLM_ERROR", `LLM 호출에 실패했습니다: ${(cause as Error).message}`);
  }

  if (!res.ok) {
    throw new ApiError("LLM_ERROR", `LLM 응답 오류 (status ${res.status}).`);
  }

  const payload = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new ApiError("LLM_ERROR", "LLM 응답이 비어 있습니다.");
  }

  try {
    return JSON.parse(content);
  } catch {
    throw new ApiError("LLM_ERROR", "LLM 응답을 JSON으로 파싱할 수 없습니다.");
  }
}
