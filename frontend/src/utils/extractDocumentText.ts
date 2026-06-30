import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';

GlobalWorkerOptions.workerSrc = pdfWorker;

export const ACCEPTED_DOCUMENT_EXTENSIONS = [
  '.txt',
  '.md',
  '.markdown',
  '.pdf',
  '.doc',
  '.docx',
] as const;

export const ACCEPTED_DOCUMENT_ACCEPT =
  '.txt,.md,.markdown,.pdf,.doc,.docx,text/plain,text/markdown,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

function getExtension(fileName: string) {
  const index = fileName.lastIndexOf('.');
  return index === -1 ? '' : fileName.slice(index).toLowerCase();
}

async function extractPdfText(file: File): Promise<string> {
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

  if (extension === '.doc' || extension === '.docx') {
    return extractDocxText(file);
  }

  throw new Error('지원하지 않는 파일 형식입니다. (PDF, Word, Markdown, TXT)');
}
