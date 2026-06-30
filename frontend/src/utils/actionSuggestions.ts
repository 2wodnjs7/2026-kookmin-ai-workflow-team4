import type { Meeting } from '@/api/types';

function normalizeContent(content: string) {
  return content.trim();
}

/** 회의록 minutes에서 아직 DB에 없는 액션 후보 문구를 추출한다. */
export function getPendingActionSuggestions(
  meeting: Meeting,
  existingContents: Iterable<string>,
): string[] {
  const seen = new Set(
    [...existingContents].map(normalizeContent).filter((content) => content.length > 0),
  );
  const candidates: string[] = [];
  const { minutes } = meeting;

  if (minutes) {
    candidates.push(...minutes.decisions);
    if (candidates.length === 0) {
      candidates.push(...minutes.agenda);
    }
  }

  const unique: string[] = [];
  for (const raw of candidates) {
    const content = normalizeContent(raw);
    if (!content || seen.has(content)) continue;
    seen.add(content);
    unique.push(content);
  }

  return unique;
}
