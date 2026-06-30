import { generateGemini, readGeminiConfig } from "./gemini.js";
import { generateLive, readLiveConfig } from "./live.js";
import { generateMock } from "./mock.js";
import type { GenerateInput, GeneratedArtifacts, LlmMode } from "./types.js";

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
 * LLM 어댑터 진입점.
 * - 키가 하나라도 있으면 live, 없으면 mock.
 * - 모든 provider의 출력 스키마는 동일하다(GeneratedArtifacts).
 */
export function getLlmMode(): LlmMode {
  return resolveProvider() === "mock" ? "mock" : "live";
}

export async function generateMeetingArtifacts(
  input: GenerateInput,
): Promise<GeneratedArtifacts> {
  switch (resolveProvider()) {
    case "gemini": {
      return generateGemini(input, readGeminiConfig()!);
    }
    case "openai": {
      return generateLive(input, readLiveConfig()!);
    }
    default: {
      return generateMock(input);
    }
  }
}

export type { GenerateInput, GeneratedArtifacts, LlmMode } from "./types.js";
