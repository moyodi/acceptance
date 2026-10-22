import type { DocumentData } from '../lib/types';
import { DEFAULT_NOTES_TITLE, DOC_TYPE_META } from '../lib/defaults';
import { formatKDate, formatPeriod, periodEndISO, toParagraphs } from '../lib/format';

/**
 * 문서 모델 — 입력 데이터를 "페이지에서 쪼개지지 않는 단위(unit)" 목록으로 변환한다.
 * 화면 미리보기(HTML)와 PDF가 동일한 unit 목록과 동일한 레이아웃 정의를 사용하므로
 * 두 결과물의 줄바꿈·페이지 분할이 최대한 일치한다.
 */

/** 문단 안의 글자 구간 — bold면 굵게 */
export interface Segment {
  text: string;
  bold?: boolean;
}

export interface Heading {
  num: string;
  text: string;
}

interface Base {
  key: string;
  /** 섹션 첫 unit에만 붙는 제목 — 제목이 본문과 분리되어 페이지 끝에 홀로 남지 않도록 묶는다 */
  heading?: Heading;
}

export type Unit =
  | (Base & { kind: 'title'; title: string; eyebrow: string })
  | (Base & {
      kind: 'para';
      text: string;
      /** 입력값이 치환된 부분을 굵게 표시하기 위한 구간 — 없으면 text 그대로 */
      segments?: Segment[];
    })
  | (Base & { kind: 'kv'; rows: { label: string; value: string }[] })
  | (Base & {
      kind: 'item';
      index: number;
      text: string;
      detail: string;
      /** 구분이 바뀌는 첫 항목에만 — 구분 제목을 항목과 함께 묶어 표시 */
      group?: string;
    })
  | (Base & { kind: 'empty'; text: string })
  | (Base & {
      kind: 'noteRow';
      showHeader: boolean;
      index: number;
      task: string;
      due: string;
      remark: string;
    })
  | (Base & { kind: 'memo'; label: string; text: string })
  | (Base & {
      kind: 'signature';
      date: string;
      parties: { role: string; name: string; representative: string; stamp: string }[];
    });

/** 치환된 입력값 앞뒤 표시 (문단 분리 후 굵은 구간으로 바꾼다) */
const MARK_OPEN = '\u0001';
const MARK_CLOSE = '\u0002';

export function maintenanceText(d: DocumentData, marked = false): string {
  const m = d.maintenance;
  const wrap = (v: string) => (marked ? `${MARK_OPEN}${v}${MARK_CLOSE}` : v);
  return m.text
    .replace(/\{기간\}/g, wrap(m.days ? formatPeriod(m.days, m.unit) : '___'))
    .replace(/\{기준\}/g, wrap(m.startBasis.trim() || '납품 완료일'));
}

/** 표시 문자가 들어간 문단 → 일반 텍스트 + 굵은 구간 */
function toSegments(marked: string): { text: string; segments: Segment[] } {
  const segments: Segment[] = [];
  marked.split(MARK_OPEN).forEach((chunk, i) => {
    if (i === 0) {
      if (chunk) segments.push({ text: chunk });
      return;
    }
    const [bold, rest = ''] = chunk.split(MARK_CLOSE);
    if (bold) segments.push({ text: bold, bold: true });
    if (rest) segments.push({ text: rest });
  });
  return { text: segments.map((s) => s.text).join(''), segments };
}

export function maintenancePeriodLabel(d: DocumentData): string {
  const m = d.maintenance;
  if (!m.enabled || !m.days) return '';
  if (m.startDate) {
    const end = periodEndISO(m.startDate, m.days, m.unit);
    return `${formatPeriod(m.days, m.unit)} (${formatKDate(m.startDate)} ~ ${formatKDate(end)})`;
  }
  return `${formatPeriod(m.days, m.unit)} (${m.startBasis.trim() || '납품 완료일'}로부터)`;
}

function partyLabel(name: string, rep: string): string {
  const n = name.trim();
  const r = rep.trim();
  if (n && r) return `${n} (대표자 ${r})`;
  return n || (r ? `대표자 ${r}` : '');
}

export function buildUnits(d: DocumentData): Unit[] {
  const type = d.documentType;
  const meta = DOC_TYPE_META[type];
  const units: Unit[] = [];
  let sectionNo = 0;

  /** 섹션 하나를 추가 — 첫 unit에 제목을 붙인다 */
  const section = (text: string, body: Unit[]) => {
    if (!body.length) return;
    sectionNo += 1;
    body[0] = { ...body[0], heading: { num: String(sectionNo), text } };
    units.push(...body);
  };

  units.push({
    key: 'title',
    kind: 'title',
    title: d.title[type].trim() || meta.label,
    eyebrow: type === 'final' ? 'WEBSITE DELIVERY CONFIRMATION' : 'WEBSITE DEVELOPMENT & INSPECTION CONFIRMATION',
  });

  // 계약 및 납품 정보 — 입력하지 않은 선택 항목은 숨김
  const rows = [
    { label: '프로젝트명', value: d.project.name.trim() },
    { label: '발주사', value: partyLabel(d.client.name, d.client.representative) },
    { label: '제작사', value: partyLabel(d.provider.name, d.provider.representative) },
    { label: '계약일', value: formatKDate(d.project.contractDate) },
    { label: type === 'final' ? '납품일' : '개발 완료일', value: formatKDate(d.project.deliveryDate) },
    { label: '홈페이지 주소', value: d.project.url.trim() },
    { label: '유지관리 기간', value: maintenancePeriodLabel(d) },
    { label: '비고', value: d.project.remarks.trim() },
  ].filter((r) => r.value);
  section('계약 및 납품 정보', [{ key: 'info', kind: 'kv', rows }]);

  // 제작 및 납품 내역
  const items = d.deliverables.items.filter((i) => i.checked && i.label.trim());
  const deliv: Unit[] = toParagraphs(d.deliverables.intro).map((text, i) => ({
    key: `deliv-intro-${i}`,
    kind: 'para' as const,
    text,
  }));
  if (items.length) {
    let prevGroup = '';
    items.forEach((it, i) => {
      const group = it.group.trim();
      deliv.push({
        key: `deliv-${it.id}`,
        kind: 'item',
        index: i + 1,
        text: it.label.trim(),
        detail: it.detail.trim(),
        group: group && group !== prevGroup ? group : undefined,
      });
      prevGroup = group;
    });
  } else {
    deliv.push({ key: 'deliv-empty', kind: 'empty', text: '선택된 납품 항목이 없습니다.' });
  }
  section('제작 및 납품 내역', deliv);

  // 미완료 사항 및 특이사항
  if (d.notes.enabled) {
    const noteItems = d.notes.items.filter((n) => n.task.trim() || n.remark.trim() || n.dueDate);
    const body: Unit[] = noteItems.map((n, i) => ({
      key: `note-${n.id}`,
      kind: 'noteRow' as const,
      showHeader: i === 0,
      index: i + 1,
      task: n.task.trim(),
      due: formatKDate(n.dueDate),
      remark: n.remark.trim(),
    }));
    const memo = d.notes.memo.trim();
    if (memo) {
      toParagraphs(memo).forEach((text, i) =>
        body.push({ key: `note-memo-${i}`, kind: 'memo', label: i === 0 ? '추가 협의 내용' : '', text }),
      );
    }
    if (!body.length) body.push({ key: 'note-none', kind: 'empty', text: '해당 사항 없음.' });
    section(d.notes.title.trim() || DEFAULT_NOTES_TITLE, body);
  }

  // 납품 및 검수 확인
  section(
    meta.inspectionHeading,
    toParagraphs(d.inspection.text[type]).map((text, i) => ({ key: `insp-${i}`, kind: 'para' as const, text })),
  );

  // 유지관리 및 운영
  if (d.maintenance.enabled) {
    section(
      '유지관리 및 운영',
      toParagraphs(maintenanceText(d, true)).map((p, i) => ({ key: `maint-${i}`, kind: 'para' as const, ...toSegments(p) })),
    );
  }

  // 추가 특이사항 (선택)
  if (d.extra.enabled) {
    const body: Unit[] = toParagraphs(d.extra.text).map((text, i) => ({ key: `extra-${i}`, kind: 'para' as const, text }));
    if (!body.length) body.push({ key: 'extra-none', kind: 'empty', text: '해당 사항 없음.' });
    section(d.extra.title.trim() || '기타 특이사항', body);
  }

  // 최종 확인
  section(
    meta.confirmationHeading,
    toParagraphs(d.confirmation.text[type]).map((text, i) => ({ key: `conf-${i}`, kind: 'para' as const, text })),
  );

  // 서명 및 날인 — 한 페이지에 유지되도록 하나의 unit
  units.push({
    key: 'signature',
    kind: 'signature',
    date: formatKDate(d.documentDate),
    parties: [
      {
        role: d.signatures.clientLabel.trim() || '발주사',
        name: d.client.name.trim(),
        representative: d.client.representative.trim(),
        stamp: d.signatures.clientStamp,
      },
      {
        role: d.signatures.providerLabel.trim() || '제작사',
        name: d.provider.name.trim(),
        representative: d.provider.representative.trim(),
        stamp: d.signatures.providerStamp,
      },
    ],
  });

  return units;
}
