import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * 시연용 시드 데이터 — 검색·트래커 데모를 위한 회의 3건 + 액션아이템.
 *
 * ⚠️ 파괴적(reset) 스크립트입니다: 멱등성을 위해 실행 시 기존 Meeting·ActionItem을
 *    모두 삭제한 뒤 시연 데이터로 다시 채웁니다(ActionItem은 Cascade로 함께 삭제).
 *    로컬에서 직접 만든 회의·액션 데이터가 있으면 함께 사라지므로 시연 환경에서만 쓰세요.
 * 등장 이름은 계약 예시와 동일한 가상 인물(실명 아님).
 *
 * 실행: npm run db:seed   (사전: npm run db:generate && npm run db:push)
 */
const meetings = [
  {
    title: "2026 Q3 제품 로드맵 회의",
    date: new Date("2026-06-20T09:00:00.000Z"),
    attendees: ["김하나", "이두리", "박세찬"],
    rawText:
      "참석자: 김하나, 이두리, 박세찬\n오늘 회의에서는 Q3 로드맵을 확정했습니다. 검색 기능을 최우선으로 개발하기로 결정했고, 데모는 로컬에서 진행합니다. 김하나가 검색 API 설계를 맡고, 이두리는 트래커 UI를 담당합니다. 마감은 7월 첫째 주입니다.",
    minutes: {
      agenda: ["Q3 로드맵 확정", "기능별 담당 분배"],
      discussion:
        "Q3에는 검색 기능을 최우선으로 개발하기로 했다. 배포 없이 로컬에서 데모를 진행한다.",
      decisions: ["검색 기능 우선 개발", "배포 없이 로컬 데모"],
    },
    actionItems: [
      {
        content: "검색 API 엔드포인트 설계",
        assignee: "김하나",
        dueDate: new Date("2026-07-07T00:00:00.000Z"),
        status: "todo",
      },
      {
        content: "트래커 UI 와이어프레임 작성",
        assignee: "이두리",
        dueDate: null,
        status: "done",
      },
      {
        content: "데모 환경 점검",
        assignee: "[담당자 확인 필요]",
        dueDate: null,
        status: "todo",
      },
    ],
  },
  {
    title: "디자인 시스템 정렬 회의",
    date: new Date("2026-06-24T05:00:00.000Z"),
    attendees: ["박세찬", "최보람"],
    rawText:
      "참석자: 박세찬, 최보람\n공통 컴포넌트의 색상 토큰과 타이포그래피 기준을 정리했습니다. 다크 모드 지원은 이번 스코프에서 제외하기로 했습니다. 최보람이 컴포넌트 문서를 정리합니다.",
    minutes: {
      agenda: ["색상 토큰 정리", "다크 모드 범위"],
      discussion:
        "색상 토큰과 타이포그래피 기준을 합의했다. 다크 모드는 이번 범위에서 제외한다.",
      decisions: ["다크 모드 이번 스코프 제외", "공통 컴포넌트 문서화"],
    },
    actionItems: [
      {
        content: "공통 컴포넌트 문서 정리",
        assignee: "최보람",
        dueDate: new Date("2026-06-30T00:00:00.000Z"),
        status: "todo",
      },
      {
        content: "색상 토큰 코드 반영",
        assignee: "박세찬",
        dueDate: null,
        status: "todo",
      },
    ],
  },
  {
    title: "백엔드 API 계약 리뷰",
    date: new Date("2026-06-27T08:30:00.000Z"),
    attendees: ["김하나", "이두리"],
    rawText:
      "참석자: 김하나, 이두리\n액션아이템 트래커와 검색 API 계약을 리뷰했습니다. 상태 토글은 PATCH로, 검색은 키워드 기반으로 합의했습니다. 시연용 시드 데이터도 추가하기로 했습니다.",
    minutes: {
      agenda: ["트래커 API 계약", "검색 API 계약", "시드 데이터"],
      discussion:
        "상태 변경은 PATCH /api/actions/:id, 검색은 GET /api/search?q= 로 합의했다.",
      decisions: ["PATCH로 상태 토글", "키워드 검색 채택", "시연용 시드 추가"],
    },
    actionItems: [
      {
        content: "PATCH /api/actions/:id 구현",
        assignee: "이두리",
        dueDate: new Date("2026-07-01T00:00:00.000Z"),
        status: "todo",
      },
      {
        content: "GET /api/search 구현",
        assignee: "이두리",
        dueDate: new Date("2026-07-01T00:00:00.000Z"),
        status: "done",
      },
    ],
  },
];

async function main() {
  console.log(
    "⚠️  [seed] 시연용 reset — 기존 Meeting·ActionItem을 모두 삭제하고 시연 데이터로 다시 채웁니다.",
  );
  const [prevMeetings, prevActions] = await Promise.all([
    prisma.meeting.count(),
    prisma.actionItem.count(),
  ]);
  console.log(`[seed] 삭제 대상: 회의 ${prevMeetings}건, 액션아이템 ${prevActions}건`);
  await prisma.actionItem.deleteMany();
  await prisma.meeting.deleteMany();

  for (const m of meetings) {
    await prisma.meeting.create({
      data: {
        title: m.title,
        date: m.date,
        attendees: m.attendees as unknown as Prisma.InputJsonValue,
        rawText: m.rawText,
        minutes: m.minutes as unknown as Prisma.InputJsonValue,
        actionItems: { create: m.actionItems },
      },
    });
  }

  const meetingCount = await prisma.meeting.count();
  const actionCount = await prisma.actionItem.count();
  console.log(`[seed] 완료: 회의 ${meetingCount}건, 액션아이템 ${actionCount}건`);
}

main()
  .catch((err) => {
    console.error("[seed] 실패:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
