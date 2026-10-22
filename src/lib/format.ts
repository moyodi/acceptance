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

/**
 * 시작일을 포함한 기간의 마지막 날
 * - 일: 시작일 + (N - 1)일 (예: 10월 1일부터 90일간 → 12월 29일)
 * - 개월: N개월 뒤 같은 날짜의 전날, 같은 날짜가 없으면 그 달 말일 (예: 1월 31일부터 1개월 → 2월 28일)
 */
export function periodEndISO(startISO: string, amount: number, unit: 'day' | 'month' = 'day'): string {
  const d = parseISO(startISO);
  if (!d || amount < 1) return '';
  if (unit === 'day') {
    d.setDate(d.getDate() + amount - 1);
    return toISO(d);
  }
  const day = d.getDate();
  const target = new Date(d.getFullYear(), d.getMonth() + amount, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  if (day > lastDay) return toISO(new Date(target.getFullYear(), target.getMonth(), lastDay));
  return toISO(new Date(target.getFullYear(), target.getMonth(), day - 1));
}

export function formatPeriod(amount: number, unit: 'day' | 'month'): string {
  return unit === 'month' ? `${amount}개월` : `${amount}일`;
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
