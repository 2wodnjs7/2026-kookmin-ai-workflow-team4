import { useState } from 'react';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import FileDropZone from '@/components/ui/FileDropZone';

export default function MeetingCreatePage() {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [attendees, setAttendees] = useState('');
  const [rawText, setRawText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="text-2xl font-bold text-text-primary">회의록 생성</div>
        <div className="text-sm text-text-secondary">
          회의 내용을 직접 입력하거나 PDF·Word(.docx)·Markdown 파일을 업로드하면 AI가 구조화된
          회의록을 생성합니다.
        </div>
      </div>

      {submitted && (
        <Alert variant="info" title="준비 중">
          백엔드 API 연동 후 실제 회의록 생성이 가능합니다.
        </Alert>
      )}

      {uploadError && (
        <Alert variant="error" title="파일 업로드 오류">
          {uploadError}
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
            <div className="text-sm font-medium text-text-secondary">자료 업로드</div>
            <FileDropZone
              onTextExtracted={(text, fileName) => {
                setRawText(text);
                setUploadedFileName(fileName);
                setUploadError('');
              }}
              onError={setUploadError}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="raw-text" className="text-sm font-medium text-text-secondary">
              회의 내용
              {uploadedFileName && (
                <div className="mt-0.5 text-xs font-normal text-primary">
                  {uploadedFileName}에서 불러옴
                </div>
              )}
            </label>
            <textarea
              id="raw-text"
              className="min-h-48 w-full resize-y rounded-lg border border-glass-border bg-glass-bg px-3 py-2 text-sm text-text-primary backdrop-blur-sm placeholder:text-text-muted outline-none transition-colors focus:border-border-focus focus:ring-2 focus:ring-primary/20"
              placeholder="회의 내용을 붙여넣거나 위에서 파일을 업로드하세요..."
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
