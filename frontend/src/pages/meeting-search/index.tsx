import { useState } from 'react';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

const mockResults = [
  {
    id: '1',
    title: '킥오프 미팅',
    date: '2026-06-28',
    snippet: '프로젝트 범위와 역할 분담을 확정했습니다. FE는 화면 3페이지...',
  },
  {
    id: '2',
    title: '기술 검토',
    date: '2026-06-29',
    snippet: 'LLM 어댑터 패턴과 mock 모드 동작 방식을 논의했습니다...',
  },
];

export default function MeetingSearchPage() {
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="text-2xl font-bold text-text-primary">회의 검색</div>
        <div className="text-sm text-text-secondary">
          키워드로 과거 회의록을 검색합니다.
        </div>
      </div>

      <Card>
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1">
            <Input
              placeholder="검색어를 입력하세요 (예: API, LLM, 액션)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button type="submit" className="self-end">
            검색
          </Button>
        </form>
      </Card>

      {searched && (
        <>
          <Alert variant="info">
            현재는 UI 목업 결과입니다. 백엔드 검색 API 연동 후 실제 데이터가 표시됩니다.
          </Alert>

          <div className="flex flex-col gap-3">
            {mockResults.map((result) => (
              <Card key={result.id}>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="text-base font-semibold text-text-primary">
                      {result.title}
                    </div>
                    <div className="text-xs text-text-muted">{result.date}</div>
                  </div>
                  <div className="text-sm text-text-secondary">{result.snippet}</div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
