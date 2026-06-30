export const ACCEPTED_DOCUMENT_EXTENSIONS = [
  '.txt',
  '.md',
  '.markdown',
  '.pdf',
  '.docx',
] as const;

/** mammoth는 OOXML(.docx)만 지원. 레거시 바이너리 .doc는 제외. */
export const ACCEPTED_DOCUMENT_ACCEPT =
  '.txt,.md,.markdown,.pdf,.docx,text/plain,text/markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

function getExtension(fileName: string) {
  const index = fileName.lastIndexOf('.');
  return index === -1 ? '' : fileName.slice(index).toLowerCase();
}

async function extractPdfText(file: File): Promise<string> {
  const [{ getDocument, GlobalWorkerOptions }, pdfWorkerModule] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ]);
  GlobalWorkerOptions.workerSrc = pdfWorkerModule.default;

  const buffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: buffer }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .trim();
    if (pageText) {
      pages.push(pageText);
    }
  }

  const text = pages.join('\n\n').trim();
  if (!text) {
    throw new Error('PDF에서 텍스트를 추출하지 못했습니다. 스캔 PDF일 수 있습니다.');
  }

  return text;
}

async function extractDocxText(file: File): Promise<string> {
  const mammoth = await import('mammoth');
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  const text = result.value.trim();

  if (!text) {
    throw new Error('Word 문서에서 텍스트를 추출하지 못했습니다.');
  }

  return text;
}

export async function extractTextFromDocument(file: File): Promise<string> {
  const extension = getExtension(file.name);

  if (extension === '.txt' || extension === '.md' || extension === '.markdown') {
    const text = (await file.text()).trim();
    if (!text) {
      throw new Error('파일 내용이 비어 있습니다.');
    }
    return text;
  }

  if (extension === '.pdf') {
    return extractPdfText(file);
  }

  if (extension === '.docx') {
    return extractDocxText(file);
  }

  if (extension === '.doc') {
    throw new Error(
      '구형 Word(.doc) 형식은 지원하지 않습니다. .docx로 저장한 뒤 다시 업로드해 주세요.',
    );
  }

  throw new Error('지원하지 않는 파일 형식입니다. (PDF, Word .docx, Markdown, TXT)');
}
