import type { ComponentType, ReactNode } from 'react';
import type { Unit } from './model';

/**
 * 공통 문서 레이아웃.
 * 같은 스타일 정의를 HTML(div)과 PDF(@react-pdf View/Text) 양쪽에 그대로 적용한다.
 * - 모든 길이는 문자열 단위(pt/mm)로 지정한다. (숫자는 DOM=px, PDF=pt로 해석이 달라짐)
 * - padding/border는 각 변을 개별 속성으로 지정한다.
 * - 선 두께는 0.75pt(=1px)의 배수만 사용한다. 브라우저는 1px 미만 선을 1px로 올려 그리므로
 *   그보다 얇으면 미리보기 높이가 PDF보다 조금씩 커져 페이지 분할이 어긋날 수 있다.
 * - 문서 디자인은 웹 UI 디자인 시스템과 분리된, 공식 비즈니스 문서용 단색 톤이다.
 */

export type DocStyle = Record<string, string | number>;

export interface Primitives {
  View: ComponentType<{ style?: DocStyle; children?: ReactNode }>;
  Text: ComponentType<{ style?: DocStyle; children?: ReactNode }>;
}

/** A4 및 여백 (mm) */
export const PAGE = { widthMm: 210, heightMm: 297, marginMm: 20 } as const;
export const CONTENT_WIDTH_MM = PAGE.widthMm - PAGE.marginMm * 2;
export const CONTENT_HEIGHT_MM = PAGE.heightMm - PAGE.marginMm * 2;

export const FONT_FAMILY = 'Pretendard';

const C = {
  ink: '#0F172A',
  body: '#1E293B',
  sub: '#334155',
  muted: '#64748B',
  rule: '#475569',
  hair: '#CBD5E1',
  faint: '#E2E8F0',
  fill: '#F1F5F9',
};

const pad = (v: string, h: string = v): DocStyle => ({ paddingTop: v, paddingBottom: v, paddingLeft: h, paddingRight: h });
const line = (w: string, color: string) => `${w} solid ${color}`;

export const S = {
  page: { fontFamily: FONT_FAMILY, color: C.ink, backgroundColor: '#FFFFFF' },
  footer: { fontSize: '7.5pt', color: C.muted, textAlign: 'center', lineHeight: 1.4 },

  // 제목
  titleWrap: { paddingBottom: '7mm' },
  eyebrow: { fontSize: '7pt', color: C.muted, textAlign: 'center', letterSpacing: '1pt', lineHeight: 1.4, paddingBottom: '2.2mm' },
  title: { fontSize: '19pt', fontWeight: 700, textAlign: 'center', lineHeight: 1.35, color: C.ink },
  ruleThick: { marginTop: '5mm', borderTop: line('1.5pt', C.ink) },
  ruleThin: { marginTop: '0.8mm', borderTop: line('0.75pt', C.ink) },

  // 섹션 제목
  headingWrap: { paddingTop: '6mm', paddingBottom: '3mm' },
  heading: {
    fontSize: '11pt',
    fontWeight: 700,
    color: C.ink,
    lineHeight: 1.4,
    paddingBottom: '1.6mm',
    borderBottom: line('0.75pt', C.rule),
  },

  // 본문
  para: { fontSize: '9.5pt', lineHeight: 1.75, color: C.body, paddingBottom: '2.2mm' },
  empty: { fontSize: '9.5pt', lineHeight: 1.75, color: C.muted, paddingBottom: '2.2mm' },

  // 정보 표
  kvTable: { borderTop: line('0.75pt', C.rule), borderBottom: line('0.75pt', C.rule) },
  kvRow: { flexDirection: 'row' },
  kvRowLine: { borderTop: line('0.75pt', C.hair) },
  kvLabel: {
    width: '32mm',
    ...pad('2.2mm', '3mm'),
    backgroundColor: C.fill,
    fontSize: '9pt',
    fontWeight: 600,
    color: C.sub,
    lineHeight: 1.6,
  },
  kvValue: { flex: 1, ...pad('2.2mm', '3.5mm'), fontSize: '9.5pt', color: C.ink, lineHeight: 1.6 },

  // 납품 항목
  item: { flexDirection: 'row', ...pad('1.7mm', '0mm'), borderBottom: line('0.75pt', C.faint) },
  itemFirst: { borderTop: line('0.75pt', C.hair), marginTop: '0.8mm' },
  itemNo: { width: '10mm', fontSize: '8.5pt', fontWeight: 600, color: C.muted, lineHeight: 1.85, paddingLeft: '1mm' },
  itemText: { flex: 1, fontSize: '9.5pt', color: C.ink, lineHeight: 1.65 },

  // 미완료 사항 표
  noteHead: {
    flexDirection: 'row',
    backgroundColor: C.fill,
    borderTop: line('0.75pt', C.rule),
    borderBottom: line('0.75pt', C.hair),
  },
  noteRow: { flexDirection: 'row', borderBottom: line('0.75pt', C.hair) },
  noteHeadCell: { ...pad('1.8mm', '2mm'), fontSize: '8.5pt', fontWeight: 600, color: C.sub, lineHeight: 1.5 },
  noteCell: { ...pad('2mm', '2mm'), fontSize: '9pt', color: C.ink, lineHeight: 1.6 },
  colNo: { width: '10mm', textAlign: 'center' },
  colTask: { flex: 1 },
  colDue: { width: '32mm' },
  colRemark: { width: '40mm' },
  memoWrap: { paddingTop: '3mm' },
  memoLabel: { fontSize: '8.5pt', fontWeight: 600, color: C.muted, paddingBottom: '1mm', lineHeight: 1.5 },

  // 서명
  signWrap: { paddingTop: '9mm' },
  signDate: { fontSize: '11pt', fontWeight: 600, textAlign: 'center', color: C.ink, paddingBottom: '6mm', lineHeight: 1.4 },
  signRow: { flexDirection: 'row' },
  signCard: { flex: 1, border: line('0.75pt', C.rule) },
  signCardGap: { marginLeft: '6mm' },
  signCardHead: {
    ...pad('2.2mm', '3.5mm'),
    backgroundColor: C.fill,
    borderBottom: line('0.75pt', C.rule),
    fontSize: '10pt',
    fontWeight: 700,
    color: C.ink,
    lineHeight: 1.4,
  },
  signField: { flexDirection: 'row', borderBottom: line('0.75pt', C.hair) },
  signFieldLast: { flexDirection: 'row', height: '24mm' },
  signLabel: { width: '24mm', ...pad('2.4mm', '3mm'), fontSize: '8.5pt', fontWeight: 600, color: C.muted, lineHeight: 1.6 },
  signValue: { flex: 1, ...pad('2.4mm', '3mm'), fontSize: '9.5pt', color: C.ink, lineHeight: 1.6 },
  signStampArea: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingRight: '5mm' },
  signStamp: { fontSize: '9.5pt', color: C.muted, lineHeight: 1.4 },
} satisfies Record<string, DocStyle>;

const merge = (...styles: (DocStyle | false | undefined)[]): DocStyle => Object.assign({}, ...styles.filter(Boolean));

/** unit 하나를 주어진 primitive(HTML 또는 PDF)로 렌더링 */
export function renderUnit(u: Unit, P: Primitives): ReactNode {
  const { View, Text } = P;
  const heading = u.heading ? (
    <View style={S.headingWrap}>
      <Text style={S.heading}>{`${u.heading.num}. ${u.heading.text}`}</Text>
    </View>
  ) : null;

  let body: ReactNode = null;
  switch (u.kind) {
    case 'title':
      body = (
        <View style={S.titleWrap}>
          <Text style={S.eyebrow}>{u.eyebrow}</Text>
          <Text style={S.title}>{u.title}</Text>
          <View style={S.ruleThick} />
          <View style={S.ruleThin} />
        </View>
      );
      break;
    case 'para':
      body = <Text style={S.para}>{u.text}</Text>;
      break;
    case 'empty':
      body = <Text style={S.empty}>{u.text}</Text>;
      break;
    case 'kv':
      body = (
        <View style={S.kvTable}>
          {u.rows.map((r, i) => (
            <View key={r.label} style={merge(S.kvRow, i > 0 && S.kvRowLine)}>
              <Text style={S.kvLabel}>{r.label}</Text>
              <Text style={S.kvValue}>{r.value}</Text>
            </View>
          ))}
        </View>
      );
      break;
    case 'item':
      body = (
        <View style={merge(S.item, u.index === 1 && S.itemFirst)}>
          <Text style={S.itemNo}>{String(u.index).padStart(2, '0')}</Text>
          <Text style={S.itemText}>{u.text}</Text>
        </View>
      );
      break;
    case 'noteRow':
      body = (
        <View>
          {u.showHeader && (
            <View style={S.noteHead}>
              <Text style={merge(S.noteHeadCell, S.colNo)}>No.</Text>
              <Text style={merge(S.noteHeadCell, S.colTask)}>미완료 작업 내용</Text>
              <Text style={merge(S.noteHeadCell, S.colDue)}>완료 예정일</Text>
              <Text style={merge(S.noteHeadCell, S.colRemark)}>비고</Text>
            </View>
          )}
          <View style={S.noteRow}>
            <Text style={merge(S.noteCell, S.colNo)}>{String(u.index)}</Text>
            <Text style={merge(S.noteCell, S.colTask)}>{u.task || '-'}</Text>
            <Text style={merge(S.noteCell, S.colDue)}>{u.due || '-'}</Text>
            <Text style={merge(S.noteCell, S.colRemark)}>{u.remark || '-'}</Text>
          </View>
        </View>
      );
      break;
    case 'memo':
      body = (
        <View style={u.label ? S.memoWrap : undefined}>
          {u.label ? <Text style={S.memoLabel}>{u.label}</Text> : null}
          <Text style={S.para}>{u.text}</Text>
        </View>
      );
      break;
    case 'signature':
      body = (
        <View style={S.signWrap}>
          <Text style={S.signDate}>{u.date || '      년      월      일'}</Text>
          <View style={S.signRow}>
            {u.parties.map((p, i) => (
              <View key={i} style={merge(S.signCard, i > 0 && S.signCardGap)}>
                <Text style={S.signCardHead}>{p.role}</Text>
                <View style={S.signField}>
                  <Text style={S.signLabel}>상호</Text>
                  <Text style={S.signValue}>{p.name}</Text>
                </View>
                <View style={S.signField}>
                  <Text style={S.signLabel}>대표자</Text>
                  <Text style={S.signValue}>{p.representative}</Text>
                </View>
                <View style={S.signFieldLast}>
                  <Text style={S.signLabel}>서명 또는 날인</Text>
                  <View style={S.signStampArea}>
                    <Text style={S.signStamp}>(인)</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      );
      break;
  }

  return (
    <>
      {heading}
      {body}
    </>
  );
}
