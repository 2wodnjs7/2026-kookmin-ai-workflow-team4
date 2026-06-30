import {
  generateGeminiActions,
  generateGeminiMinutes,
  readGeminiConfig,
} from "./gemini.js";
import {
  generateLiveActions,
  generateLiveMinutes,
  readLiveConfig,
} from "./live.js";
import { generateMockActions, generateMockMinutes } from "./mock.js";
import type {
  GenerateInput,
  GeneratedActionItem,
  LlmMode,
  MeetingMinutesResult,
} from "./types.js";

type Provider = "gemini" | "openai" | "mock";

/**
 * 사용할 provider 결정.
 * 우선순위: GEMINI_API_KEY(Gemini) → LLM_API_KEY(OpenAI 호환) → mock.
 */
function resolveProvider(): Provider {
  if (readGeminiConfig()) return "gemini";
  if (readLiveConfig()) return "openai";
  return "mock";
}

/**
 * 현재 LLM 모드.
 * - 키가 하나라도 있으면 live, 없으면 mock.
 */
export function getLlmMode(): LlmMode {
  return resolveProvider() === "mock" ? "mock" : "live";
}

/**
 * 회의록(minutes) 생성 진입점 — 액션아이템은 생성하지 않는다(#28).
 * `POST /api/meetings`(BE-1)에서 사용. 모든 provider의 출력 스키마는 동일하다.
 */
export async function generateMeetingMinutes(
  input: GenerateInput,
): Promise<MeetingMinutesResult> {
  switch (resolveProvider()) {
    case "gemini":
      return generateGeminiMinutes(input, readGeminiConfig()!);
    case "openai":
      return generateLiveMinutes(input, readLiveConfig()!);
    default:
      return generateMockMinutes(input);
  }
}

/**
 * 액션아이템 추출 진입점 — 회의록 본문은 생성하지 않는다(#28).
 * `POST /api/actions/generate`(BE-2)에서 회의 전사본을 바탕으로 사용한다.
 * 모든 provider의 출력 스키마는 동일하다.
 */
export async function generateActionItems(
  input: GenerateInput,
): Promise<GeneratedActionItem[]> {
  switch (resolveProvider()) {
    case "gemini":
      return generateGeminiActions(input, readGeminiConfig()!);
    case "openai":
      return generateLiveActions(input, readLiveConfig()!);
    default:
      return generateMockActions(input);
  }
}

export type {
  GenerateInput,
  GeneratedActionItem,
  LlmMode,
  MeetingMinutesResult,
} from "./types.js";
