import { Link } from 'react-router-dom';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

const features = [
  {
    title: '회의록 생성',
    description: '전사본을 붙여넣으면 AI가 구조화된 회의록을 생성합니다.',
    to: '/meetings/create',
    icon: '📝',
  },
  {
    title: '액션 트래커',
    description: '회의에서 도출된 액션 아이템을 보드 형태로 추적합니다.',
    to: '/actions',
    icon: '✅',
  },
  {
    title: '회의 검색',
    description: '과거 회의록을 키워드로 빠르게 검색합니다.',
    to: '/search',
    icon: '🔍',
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4 rounded-2xl bg-bg-surface p-8 border border-border-default">
        <div className="text-3xl font-bold text-text-primary">
          회의 지식 허브
        </div>
        <div className="max-w-2xl text-base text-text-secondary">
          회의 전사본을 AI로 구조화하고, 액션 아이템을 추적하며, 과거 회의를 검색하는
          팀용 서비스입니다.
        </div>
        <div className="flex gap-3">
          <Link to="/meetings/create">
            <Button size="lg">회의록 생성하기</Button>
          </Link>
          <Link to="/search">
            <Button variant="secondary" size="lg">
              회의 검색
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.to} title={`${feature.icon} ${feature.title}`} description={feature.description}>
            <Link to={feature.to}>
              <Button variant="secondary" className="w-full">
                바로가기
              </Button>
            </Link>
          </Card>
        ))}
      </section>
    </div>
  );
}
