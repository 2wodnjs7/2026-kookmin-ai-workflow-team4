import { useState } from 'react';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

export default function MeetingCreatePage() {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [attendees, setAttendees] = useState('');
  const [rawText, setRawText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="text-2xl font-bold text-text-primary">회의록 생성</div>
        <div className="text-sm text-text-secondary">
          회의 전사본을 입력하면 AI가 구조화된 회의록을 생성합니다.
        </div>
      </div>

      {submitted && (
        <Alert variant="info" title="준비 중">
          백엔드 API 연동 후 실제 회의록 생성이 가능합니다.
        </Alert>
      )}

      <Card title="회의 정보 입력">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="회의 제목"
            placeholder="예: 스프린트 회고"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Input
            label="회의 날짜"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <Input
            label="참석자 (쉼표로 구분)"
            placeholder="예: 김OO, 이OO"
            value={attendees}
            onChange={(e) => setAttendees(e.target.value)}
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="raw-text" className="text-sm font-medium text-text-secondary">
              전사본
            </label>
            <textarea
              id="raw-text"
              className="min-h-48 w-full resize-y rounded-lg border border-border-default bg-bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-border-focus focus:ring-2 focus:ring-primary/20"
              placeholder="회의 전사본을 붙여넣으세요..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              required
            />
          </div>
          <Button type="submit" size="lg" className="self-start">
            회의록 생성
          </Button>
        </form>
      </Card>
    </div>
  );
}
