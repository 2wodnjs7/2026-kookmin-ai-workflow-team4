import { useRef, useState, type DragEvent } from 'react';
import Button from '@/components/ui/Button';
import {
  ACCEPTED_DOCUMENT_ACCEPT,
  extractTextFromDocument,
} from '@/utils/extractDocumentText';

interface FileDropZoneProps {
  onTextExtracted: (text: string, fileName: string) => void;
  onError: (message: string) => void;
}

export default function FileDropZone({ onTextExtracted, onError }: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastFileName, setLastFileName] = useState<string | null>(null);

  const processFile = async (file: File) => {
    setIsLoading(true);
    onError('');

    try {
      const text = await extractTextFromDocument(file);
      setLastFileName(file.name);
      onTextExtracted(text, file.name);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '파일을 읽는 중 오류가 발생했습니다.';
      onError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) {
      return;
    }
    void processFile(file);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
          isDragging
            ? 'border-primary bg-primary/10'
            : 'border-glass-border bg-glass-bg hover:border-primary/50'
        }`}
      >
        <div className="text-sm font-medium text-text-primary">
          {isLoading ? '파일에서 텍스트 추출 중...' : '파일을 끌어다 놓거나 클릭하여 선택'}
        </div>
        <div className="text-xs text-text-muted">
          PDF · Word(.doc/.docx) · Markdown · TXT
        </div>
        {lastFileName && !isLoading && (
          <div className="text-xs text-primary">마지막 업로드: {lastFileName}</div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_DOCUMENT_ACCEPT}
        className="hidden"
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = '';
        }}
      />

      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="self-start"
        disabled={isLoading}
        onClick={() => inputRef.current?.click()}
      >
        파일 선택
      </Button>
    </div>
  );
}
