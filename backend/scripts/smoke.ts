import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { buildApp } from "../src/app.js";

/**
 * mock 모드 스모크 테스트. 실제 HTTP 경로·에러 포맷·계약 정합을 확인한다.
 * 실행: npm run smoke (사전: prisma generate + db push, LLM_API_KEY 미설정 → mock)
 */
const SAMPLE = {
  rawText:
    "참석자: 김하나, 이두리\n안건은 Q3 로드맵 확정입니다. 검색 기능을 우선 개발하기로 결정했습니다. 김하나는 검색 API를 작성해야 합니다.",
  title: "Q3 로드맵 회의",
  attendees: ["김하나", "이두리"],
  date: "2026-06-30T09:00:00.000Z",
};

async function main() {
  const server = buildApp().listen(0);
  await new Promise<void>((resolve) => server.once("listening", () => resolve()));
  const { port } = server.address() as AddressInfo;
  const base = `http://127.0.0.1:${port}`;

  try {
    // 1) POST 생성
    const postRes = await fetch(`${base}/api/meetings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(SAMPLE),
    });
    assert.equal(postRes.status, 201, "POST는 201이어야 한다");
    assert.equal(postRes.headers.get("x-llm-mode"), "mock", "mock 모드여야 한다");
    const created = (await postRes.json()) as Record<string, any>;

    assert.ok(created.id, "id가 있어야 한다");
    assert.equal(created.title, SAMPLE.title);
    assert.deepEqual(created.attendees, SAMPLE.attendees, "attendees 배열 일치");
    assert.ok(Array.isArray(created.minutes.agenda), "minutes.agenda 배열");
    assert.equal(typeof created.minutes.discussion, "string", "minutes.discussion 문자열");
    assert.ok(Array.isArray(created.minutes.decisions), "minutes.decisions 배열");
    assert.ok(Array.isArray(created.actionItems), "actionItems 배열");
    assert.ok(created.minutes.decisions.length > 0, "결정사항 1개 이상 추출");
    assert.ok(created.actionItems.length > 0, "액션아이템 1개 이상 추출");
    for (const ai of created.actionItems) {
      assert.equal(ai.status, "todo", "신규 액션아이템 status=todo");
      assert.ok("assignee" in ai && "dueDate" in ai, "assignee/dueDate 키 존재");
    }

    // 2) GET 목록 (봉투 형태)
    const listRes = await fetch(`${base}/api/meetings`);
    assert.equal(listRes.status, 200);
    const list = (await listRes.json()) as Record<string, any>;
    assert.ok(Array.isArray(list.meetings), "meetings 배열");
    assert.equal(typeof list.total, "number", "total 숫자");
    assert.equal(list.limit, 20);
    assert.equal(list.offset, 0);
    assert.ok(list.meetings.length >= 1);
    assert.ok(!("rawText" in list.meetings[0]), "목록에는 rawText 없음");
    assert.equal(typeof list.meetings[0].actionItemCount, "number", "actionItemCount 숫자");

    // 3) GET 단건
    const getRes = await fetch(`${base}/api/meetings/${created.id}`);
    assert.equal(getRes.status, 200);
    const one = (await getRes.json()) as Record<string, any>;
    assert.equal(one.id, created.id);
    assert.ok("rawText" in one, "단건에는 rawText 포함");
    assert.ok(Array.isArray(one.actionItems));

    // 4) 404
    const missRes = await fetch(`${base}/api/meetings/nonexistent-id`);
    assert.equal(missRes.status, 404);
    const miss = (await missRes.json()) as Record<string, any>;
    assert.equal(miss.error.code, "NOT_FOUND", "404 에러 코드");

    // 5) 검증 실패 (rawText 누락)
    const badRes = await fetch(`${base}/api/meetings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "no raw text" }),
    });
    assert.equal(badRes.status, 400);
    const bad = (await badRes.json()) as Record<string, any>;
    assert.equal(bad.error.code, "VALIDATION_ERROR", "400 에러 코드");

    console.log("✅ smoke test passed (mock mode)");
  } finally {
    server.close();
  }
}

main().catch((err) => {
  console.error("❌ smoke test failed:", err);
  process.exit(1);
});
