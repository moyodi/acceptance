import type { DocType } from './types';

const pad = (n: number) => String(n).padStart(2, '0');

function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayISO(): string {
  return toISO(new Date());
}

function parseISO(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** YYYY-MM-DD → YYYY년 MM월 DD일 */
export function formatKDate(iso: string): string {
  const d = parseISO(iso);
  if (!d) return '';
  return `${d.getFullYear()}년 ${pad(d.getMonth() + 1)}월 ${pad(d.getDate())}일`;
}

/** 시작일 포함 N일간의 마지막 날 (예: 1일 시작 90일간 → 시작일 + 89일) */
export function periodEndISO(startISO: string, days: number): string {
  const d = parseISO(startISO);
  if (!d || days < 1) return '';
  d.setDate(d.getDate() + days - 1);
  return toISO(d);
}

/** 파일명에 쓸 수 없는 문자와 공백을 제거 */
export function sanitizeFilePart(s: string): string {
  return s
    .replace(/[\\/:*?"<>|#%&{}$!'`@+=^~;,[\]]/g, '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, '')
    .replace(/^\.+/, '')
    .slice(0, 60);
}

export function buildFileName(type: DocType, clientName: string, dateISO: string): string {
  const kind = type === 'final' ? '납품확인서' : '개발검수확인서';
  const client = sanitizeFilePart(clientName) || '발주사';
  const date = (parseISO(dateISO) ? dateISO : todayISO()).replace(/-/g, '');
  return `홈페이지_${kind}_${client}_${date}.pdf`;
}

/** 본문을 빈 줄 기준 문단 배열로 나눈다 */
export function toParagraphs(text: string): string[] {
  return text
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
