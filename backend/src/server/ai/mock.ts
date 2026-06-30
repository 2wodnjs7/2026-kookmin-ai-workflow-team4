import type { GenerateInput, GeneratedActionItem, GeneratedArtifacts } from "./types.js";

/**
 * 키가 없을 때 쓰는 mock 생성기.
 * 전사본에서 휴리스틱으로 구조를 뽑아내며, 출력 스키마는 live 모드와 동일하다.
 * (전사본에 없는 사실을 지어내지 않도록, 본문에서 추출한 내용만 사용한다.)
 */
export function generateMock(input: GenerateInput): GeneratedArtifacts {
  const rawLines = input.rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // 발화 라인의 "@핸들 [시각]:" 접두 제거 + 자동생성 메타/노이즈 라인 제외.
  const cleaned = rawLines
    .filter((l) => !isMetaLine(l))
    .map(stripSpeakerPrefix)
    .filter((l) => l.length > 0);

  const cleanedText = cleaned.join(" ");
  const sentences = cleanedText
    .split(/(?<=[.!?。…])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const title = input.title?.trim() || "회의록 (제목 미정)";

  const attendees =
    input.attendees && input.attendees.length > 0
      ? input.attendees
      : extractAttendees(rawLines);

  // 안건: 글머리표/번호 목록(메타 제외) 우선, 없으면 앞부분 문장.
  const bulletItems = rawLines
    .filter((l) => /^([-*•]|\d+[.)])\s+/.test(l) && !isMetaLine(l))
    .map(stripBullet);
  const agenda = (bulletItems.length > 0 ? bulletItems : sentences.slice(0, 3)).slice(0, 5);

  // 결정사항: 결정/합의 신호어가 있는 문장.
  const decisions = sentences
    .filter((s) => /(결정|합의|하기로 (했|함|결정)|확정)/.test(s))
    .slice(0, 5);

  // 요약/핵심/논의 (전사 원문 복붙 대신 정제된 문장 기반).
  const summary = sentences.slice(0, 3).join(" ").slice(0, 400) || cleanedText.slice(0, 300);
  const keyPoints = (decisions.length > 0 ? decisions : sentences.slice(0, 3)).slice(0, 5);
  const discussion = sentences.slice(0, 4).join(" ").slice(0, 600) || cleanedText.slice(0, 400);

  // 액션아이템: 할 일 신호어가 있는 문장(접두 제거된 정제 문장).
  const actionItems: GeneratedActionItem[] = sentences
    .filter((s) => /(하기로|해야|담당|진행|준비|작성|확인|점검|까지)/.test(s))
    .slice(0, 8)
    .map((s) => ({
      content: s.slice(0, 200),
      assignee: extractAssignee(s),
      dueDate: null,
    }));

  return {
    title,
    attendees,
    minutes: { summary, keyPoints, agenda, discussion, decisions },
    actionItems,
  };
}

/** "@핸들 [0:32]: 내용" → "내용" (발화 접두 제거). */
function stripSpeakerPrefix(line: string): string {
  return line
    .replace(/^@\S+\s*\[[^\]]*\]\s*[:：]\s*/, "")
    .replace(/^@\S+\s*[:：]\s*/, "")
    .trim();
}

/** Slack/Huddle 자동 생성 안내·비노출 문구 등 노이즈 라인 판별. */
function isMetaLine(line: string): boolean {
  return /(자동\s*생성|자동으로 생성|검색 결과에 표시되지|허들 스크립트|스크립트입니다|부정확할 수 있습니다|Slack AI|언제든지 편집|채널의 허들)/.test(
    line,
  );
}

function stripBullet(s: string): string {
  return s.replace(/^([-*•]|\d+[.)])\s+/, "").trim();
}

function extractAttendees(lines: string[]): string[] {
  const line = lines.find((l) => /^(참석자?|참가자?|attendees)\s*[:：]/i.test(l));
  if (!line) return [];
  const after = line.split(/[:：]/).slice(1).join(":");
  return after
    .split(/[,，、]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function extractAssignee(sentence: string): string {
  // "○○가/이/은/는 ... " 형태의 선행 주어를 담당자 후보로. 불명확하면 플레이스홀더.
  const m = sentence.match(/^\s*([가-힣A-Za-z]{2,10})(?:\s*[은는이가])/);
  return m?.[1] ?? "[담당자 확인 필요]";
}
