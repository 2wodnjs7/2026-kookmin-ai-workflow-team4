import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { buildApp } from "../src/app.js";
import { prisma } from "../src/server/db.js";

/**
 * BE-2(트래커·검색) 스모크 테스트. mock 모드에서 실제 HTTP 경로·에러 포맷·계약 정합을 확인한다.
 * 실행: npm run smoke:be2  (사전: npm run db:generate && npm run db:push. .env에 키가 있어도 mock 강제)
 */
const TOKEN = "스모크검색토큰BE2";
const SAMPLE = {
  rawText: `참석자: 김하나, 이두리\n안건은 Q3 로드맵입니다. ${TOKEN} 키워드를 포함한 논의를 진행했고, 김하나가 검색 API를 맡습니다.`,
  title: `BE2 스모크 회의 ${TOKEN}`,
  attendees: ["김하나", "이두리"],
};

async function main() {
  // 스모크는 항상 mock 경로를 결정적으로 검증한다(.env에 키가 있어도 무시).
  // provider는 요청 시점에 process.env를 읽으므로 여기서 지우면 mock으로 폴백된다.
  delete process.env.GEMINI_API_KEY;
  delete process.env.LLM_API_KEY;

  const server = buildApp().listen(0);
  await new Promise<void>((resolve) => server.once("listening", () => resolve()));
  const { port } = server.address() as AddressInfo;
  const base = `http://127.0.0.1:${port}`;
  let meetingId: string | undefined;

  try {
    // 준비: 회의 1건 생성(mock). #28 이후 POST /api/meetings는 액션을 자동 생성하지 않으므로
    // 트래커 테스트용 액션아이템은 prisma로 직접 시드한다(이 스모크를 self-contained로 유지).
    const postRes = await fetch(`${base}/api/meetings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(SAMPLE),
    });
    assert.equal(postRes.status, 201, "사전 회의 생성은 201");
    const meeting = (await postRes.json()) as Record<string, any>;
    meetingId = meeting.id;
    assert.equal(meeting.actionItems.length, 0, "#28: 회의 생성 시 액션 자동생성 안 함");

    const action = (await prisma.actionItem.create({
      data: {
        meetingId: meetingId!,
        content: `${TOKEN} 검색 API 설계`,
        assignee: "김하나",
        status: "todo",
      },
    })) as Record<string, any>;

    // 1) GET /api/actions — 봉투 형태 + meeting 컨텍스트
    const listRes = await fetch(`${base}/api/actions`);
    assert.equal(listRes.status, 200);
    const list = (await listRes.json()) as Record<string, any>;
    assert.ok(Array.isArray(list.actions), "actions 배열");
    assert.equal(typeof list.total, "number", "total 숫자");
    const found = list.actions.find((a: any) => a.id === action.id);
    assert.ok(found, "생성한 액션아이템이 목록에 있음");
    assert.ok(found.meeting && found.meeting.id === meetingId, "meeting 컨텍스트 포함");

    // 2) meetingId 필터
    const byMeeting = (await (await fetch(`${base}/api/actions?meetingId=${meetingId}`)).json()) as Record<string, any>;
    assert.ok(
      byMeeting.actions.length > 0 && byMeeting.actions.every((a: any) => a.meetingId === meetingId),
      "meetingId 필터 동작",
    );

    // 3) PATCH 상태 토글 todo → done
    const patchRes = await fetch(`${base}/api/actions/${action.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "done" }),
    });
    assert.equal(patchRes.status, 200, "PATCH는 200");
    const patched = (await patchRes.json()) as Record<string, any>;
    assert.equal(patched.status, "done", "status=done 반영");
    assert.equal(patched.id, action.id, "동일 액션 반환");

    // 4) status=done 필터에 포함
    const doneList = (await (await fetch(`${base}/api/actions?status=done`)).json()) as Record<string, any>;
    assert.ok(doneList.actions.some((a: any) => a.id === action.id), "done 필터에 포함");

    // 5) PATCH 빈 본문 → 400
    const emptyRes = await fetch(`${base}/api/actions/${action.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    assert.equal(emptyRes.status, 400, "빈 본문은 400");
    assert.equal(((await emptyRes.json()) as any).error.code, "VALIDATION_ERROR");

    // 6) PATCH 잘못된 status → 400 (in_progress/on_hold는 이제 유효하므로 계약 밖 값 archived로 검증)
    const badStatusRes = await fetch(`${base}/api/actions/${action.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "archived" }),
    });
    assert.equal(badStatusRes.status, 400, "허용되지 않은 status는 400");

    // 7) PATCH 없는 id → 404
    const missRes = await fetch(`${base}/api/actions/nonexistent-id`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "done" }),
    });
    assert.equal(missRes.status, 404, "없는 액션은 404");
    assert.equal(((await missRes.json()) as any).error.code, "NOT_FOUND");

    // 8) GET /api/search?q=<TOKEN> — 우리가 만든 회의 매칭
    const searchRes = await fetch(`${base}/api/search?q=${encodeURIComponent(TOKEN)}`);
    assert.equal(searchRes.status, 200, "search는 200");
    const search = (await searchRes.json()) as Record<string, any>;
    assert.equal(search.query, TOKEN, "query 에코");
    assert.ok(Array.isArray(search.meetings), "meetings 배열");
    assert.ok(search.meetings.some((m: any) => m.id === meetingId), "검색 결과에 우리 회의 포함");
    assert.ok(!("rawText" in search.meetings[0]), "검색 결과에 rawText 없음(목록 형태)");
    assert.equal(typeof search.meetings[0].actionItemCount, "number", "actionItemCount 숫자");

    // 9) 매칭 없는 검색 → 빈 목록
    const noneRes = await fetch(`${base}/api/search?q=${encodeURIComponent("절대없는키워드ZZZ" + TOKEN)}`);
    const none = (await noneRes.json()) as Record<string, any>;
    assert.equal(none.total, 0, "매칭 없으면 total=0");
    assert.equal(none.meetings.length, 0, "매칭 없으면 빈 배열");

    // 10) GET /api/search 빈 q → 400
    const badSearch = await fetch(`${base}/api/search`);
    assert.equal(badSearch.status, 400, "q 누락은 400");
    assert.equal(((await badSearch.json()) as any).error.code, "VALIDATION_ERROR");

    // 11) POST /api/actions — 수동 생성(201, 4단계 status·신규 필드·meeting 컨텍스트)
    const createRes = await fetch(`${base}/api/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: "수동 추가 액션",
        meetingId,
        assignee: "FE",
        startDate: "2026-07-01T00:00:00.000Z",
        dueDate: "2026-07-10T00:00:00.000Z",
        status: "in_progress",
        memo: "스모크 생성 메모",
      }),
    });
    assert.equal(createRes.status, 201, "POST는 201");
    const created = (await createRes.json()) as Record<string, any>;
    assert.ok(created.id, "생성된 id 반환");
    assert.equal(created.status, "in_progress", "4단계 status(in_progress) 허용");
    assert.equal(created.memo, "스모크 생성 메모", "memo 반영");
    assert.ok(created.startDate, "startDate 반영");
    assert.ok(created.meeting && created.meeting.id === meetingId, "meeting 컨텍스트 포함");
    const createdId = created.id;

    // 12) POST content 누락 → 400
    const noContent = await fetch(`${base}/api/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meetingId }),
    });
    assert.equal(noContent.status, 400, "content 누락은 400");
    assert.equal(((await noContent.json()) as any).error.code, "VALIDATION_ERROR");

    // 13) POST 없는 meetingId → 404
    const badMeeting = await fetch(`${base}/api/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "회의 없는 액션", meetingId: "no-such-meeting" }),
    });
    assert.equal(badMeeting.status, 404, "없는 meetingId는 404");
    assert.equal(((await badMeeting.json()) as any).error.code, "NOT_FOUND");

    // 14) PATCH startDate(null)·memo·on_hold → 200 반영
    const patchFields = await fetch(`${base}/api/actions/${createdId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate: null, memo: "수정된 메모", status: "on_hold" }),
    });
    assert.equal(patchFields.status, 200, "필드 PATCH는 200");
    const patchedFields = (await patchFields.json()) as Record<string, any>;
    assert.equal(patchedFields.startDate, null, "startDate null 반영");
    assert.equal(patchedFields.memo, "수정된 메모", "memo 반영");
    assert.equal(patchedFields.status, "on_hold", "4단계 status(on_hold) 반영");

    // 15) DELETE /api/actions/:id → 204, 이후 PATCH 404
    const delRes = await fetch(`${base}/api/actions/${createdId}`, { method: "DELETE" });
    assert.equal(delRes.status, 204, "DELETE는 204");
    const afterDel = await fetch(`${base}/api/actions/${createdId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "done" }),
    });
    assert.equal(afterDel.status, 404, "삭제 후 PATCH는 404");

    // 16) DELETE 없는 id → 404
    const delMiss = await fetch(`${base}/api/actions/nonexistent-id`, { method: "DELETE" });
    assert.equal(delMiss.status, 404, "없는 액션 DELETE는 404");

    console.log("✅ BE-2 smoke test passed (actions CRUD + 4-status + search, mock mode)");
  } finally {
    // 테스트로 생성된 회의 정리(액션아이템은 Cascade로 함께 삭제).
    if (meetingId) {
      await prisma.meeting.delete({ where: { id: meetingId } }).catch(() => {});
    }
    await prisma.$disconnect();
    server.close();
  }
}

main().catch((err) => {
  console.error("❌ BE-2 smoke test failed:", err);
  process.exit(1);
});
