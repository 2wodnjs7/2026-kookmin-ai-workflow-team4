import { Link } from 'react-router-dom';
import DamrokMark from '@/components/brand/DamrokMark';
import Button from '@/components/ui/Button';

const coreFeatures = [
  {
    icon: "📝",
    title: "AI 회의록 생성",
    description:
      "회의 내용을 입력하면 AI가 안건·논의 요약·결정사항으로 구조화된 회의록을 만들어 드립니다.",
    tag: "핵심",
  },
  {
    icon: "✅",
    title: "액션 아이템 트래킹",
    description:
      "회의에서 나온 할 일을 담당자·기한과 함께 추적합니다. todo / done 보드로 팀 실행력을 높입니다.",
    tag: "핵심",
  },
  {
    icon: "🔍",
    title: "과거 회의 검색",
    description:
      "키워드로 지난 회의록을 빠르게 찾습니다. 이미 결정된 내용을 다시 논의하지 않도록 돕습니다.",
    tag: "핵심",
  },
];

const usageSteps = [
  {
    step: "01",
    title: "회의 내용 입력",
    description: "회의록 생성 페이지에 텍스트·제목·참석자를 입력하거나 파일을 업로드합니다.",
  },
  {
    step: "02",
    title: "AI 구조화",
    description:
      "AI가 안건, 논의 요약, 결정사항, 액션 아이템을 자동으로 추출합니다.",
  },
  {
    step: "03",
    title: "액션 추적",
    description: "트래커 보드에서 담당자별 할 일 상태를 관리합니다.",
  },
  {
    step: "04",
    title: "회의 검색",
    description: "필요할 때 과거 회의를 검색해 팀의 지식을 다시 꺼내 씁니다.",
  },
];

const services = [
  "구조화 회의록 자동 생성",
  "액션 아이템 추출 및 Kanban 추적",
  "과거 회의 키워드 검색",
  "팀 회의 지식 아카이브",
  "담당자·기한 불명확 시 플레이스홀더 안내",
  "Mock / Live LLM 동일 스키마 응답",
];

const meaningCards = [
  {
    hanja: "談",
    label: "담",
    meaning: "이야기하다 · 대화하다",
    desc: "팀이 모여 나눈 회의와 논의",
  },
  {
    hanja: "錄",
    label: "록",
    meaning: "기록하다 · 적다",
    desc: "AI가 구조화해 남기는 회의록",
  },
  {
    hanja: "知",
    label: "지",
    meaning: "아는 것 · 지식",
    desc: "검색하고 추적 가능한 팀 자산",
  },
];

export default function IntroPage() {
  return (
    <div className="flex flex-col gap-16 pb-8">
      {/* Hero */}
      <section className="glass-strong flex flex-col items-center gap-6 rounded-3xl px-6 py-16 text-center md:px-12">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/90 shadow-lg">
          <DamrokMark className="h-16 w-16" />
        </div>
        <div className="flex flex-col gap-2">
          <div className="text-4xl font-bold tracking-tight text-text-primary md:text-5xl">
            담록
          </div>
          <div className="text-lg text-text-secondary">Damrok · 談錄</div>
        </div>
        <div className="max-w-2xl text-base leading-relaxed text-text-secondary">
          <div className="inline font-semibold text-text-primary">談(이야기할 담)</div>과{' '}
          <div className="inline font-semibold text-text-primary">錄(기록할 록)</div>의 합 —
          팀의 대화를 기록하고, 다시 꺼내 쓸 수 있는 지식으로 남깁니다.
        </div>
        <div className="rounded-full border border-glass-border bg-glass-bg px-5 py-2 text-sm font-medium text-primary">
          회의가 지식이 되는 순간
        </div>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link to="/meetings/create">
            <Button size="lg">지금 시작하기</Button>
          </Link>
          <a href="#features">
            <Button variant="secondary" size="lg">
              기능 살펴보기
            </Button>
          </a>
        </div>
      </section>

      {/* Meaning */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {meaningCards.map((item) => (
          <div
            key={item.hanja}
            className="glass flex flex-col items-center gap-3 rounded-2xl p-6 text-center"
          >
            <div className="text-3xl font-bold text-primary">{item.hanja}</div>
            <div className="text-base font-semibold text-text-primary">
              {item.label}
            </div>
            <div className="text-sm text-text-muted">{item.meaning}</div>
            <div className="text-sm text-text-secondary">{item.desc}</div>
          </div>
        ))}
      </section>

      {/* Core Features */}
      <section id="features" className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 text-center">
          <div className="text-2xl font-bold text-text-primary">핵심 기능</div>
          <div className="text-sm text-text-secondary">
            담록이 제공하는 세 가지 메인 기능
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {coreFeatures.map((feature) => (
            <div
              key={feature.title}
              className="glass flex flex-col gap-4 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between">
                <div className="text-2xl">{feature.icon}</div>
                <div className="rounded-full bg-primary-subtle px-2.5 py-0.5 text-xs font-medium text-primary">
                  {feature.tag}
                </div>
              </div>
              <div className="text-lg font-semibold text-text-primary">
                {feature.title}
              </div>
              <div className="flex-1 text-sm leading-relaxed text-text-secondary">
                {feature.description}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How to use */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 text-center">
          <div className="text-2xl font-bold text-text-primary">이용 방법</div>
          <div className="text-sm text-text-secondary">
            4단계로 담록을 사용해 보세요
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {usageSteps.map((item) => (
            <div
              key={item.step}
              className="glass flex flex-col gap-3 rounded-2xl p-5"
            >
              <div className="text-2xl font-bold text-primary/40">
                {item.step}
              </div>
              <div className="text-base font-semibold text-text-primary">
                {item.title}
              </div>
              <div className="text-sm leading-relaxed text-text-secondary">
                {item.description}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="glass-strong flex flex-col gap-6 rounded-3xl p-8 md:p-10">
        <div className="flex flex-col gap-2">
          <div className="text-2xl font-bold text-text-primary">
            제공 서비스
          </div>
          <div className="text-sm text-text-secondary">
            담록이 팀에게 제공하는 회의 지능(Meeting Intelligence) 기능
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {services.map((service) => (
            <div
              key={service}
              className="flex items-center gap-3 rounded-xl border border-glass-border bg-glass-bg px-4 py-3"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-text-inverse">
                ✓
              </div>
              <div className="text-sm text-text-primary">{service}</div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link to="/meetings/create">
            <Button>회의록 생성</Button>
          </Link>
          <Link to="/actions">
            <Button variant="secondary">액션 트래커</Button>
          </Link>
          <Link to="/search">
            <Button variant="secondary">회의 검색</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
