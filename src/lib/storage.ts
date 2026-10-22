import type { DocumentData } from './types';
import { createBlankDocument, createSampleDocument, uid } from './defaults';

/**
 * 브라우저 로컬 저장소 — 여러 납품 확인서를 보관한다. 서버로 전송하지 않는다.
 * 키 구조: `myd-acceptance:v1:docs` → { docs: StoredDoc[] }
 */
const NS = 'myd-acceptance';
const DOCS_KEY = `${NS}:v1:docs`;
/** 목록 기능 이전(단일 문서) 저장 키 — 최초 로드 시 목록으로 옮긴다 */
const LEGACY_CURRENT_KEY = `${NS}:v1:current`;

export interface StoredDoc {
  id: string;
  createdAt: string;
  updatedAt: string;
  data: DocumentData;
}

/** 저장본을 현재 스키마에 맞춰 보정 (누락 필드는 기본값으로 채움) */
function normalize(raw: unknown): DocumentData | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<DocumentData>;
  if (r.version !== 1) return null;
  const base = createBlankDocument();
  return {
    ...base,
    ...r,
    title: { ...base.title, ...r.title },
    project: { ...base.project, ...r.project },
    client: { ...base.client, ...r.client },
    provider: { ...base.provider, ...r.provider },
    deliverables: {
      ...base.deliverables,
      ...r.deliverables,
      items: Array.isArray(r.deliverables?.items)
        ? r.deliverables!.items.map((i) => ({ ...i, group: i.group ?? '', detail: fixDetail(i.label, i.detail ?? '') }))
        : base.deliverables.items,
    },
    inspection: { text: { ...base.inspection.text, ...r.inspection?.text } },
    maintenance: migrateMaintenance({ ...base.maintenance, ...r.maintenance }, r.maintenance?.unit),
    notes: {
      ...base.notes,
      ...r.notes,
      items: Array.isArray(r.notes?.items) ? r.notes!.items : [],
    },
    confirmation: { text: { ...base.confirmation.text, ...r.confirmation?.text } },
    signatures: { ...base.signatures, ...r.signatures },
    meta: { ...base.meta, ...r.meta },
  } as DocumentData;
}

/** 단위 선택 이전 저장본: 단위가 없으면 '일', 문구의 「{기간}일간」은 「{기간}간」으로 (치환값에 단위가 포함됨) */
function migrateMaintenance(m: DocumentData['maintenance'], storedUnit: unknown): DocumentData['maintenance'] {
  if (storedUnit === 'day' || storedUnit === 'month') return m;
  return { ...m, unit: 'day', text: m.text.replace(/\{기간\}일/g, '{기간}') };
}

/** 월드크레인 세트 이전 버전의 세부 내용 정정 — 직접 수정하지 않은(원문 그대로인) 경우에만 바꾼다 */
function fixDetail(label: string, detail: string): string {
  const fixes: Record<string, [from: string, to: string]> = {
    '회원정보 관리': ['아이디·비밀번호 찾기, 회원정보 조회·수정, 비밀번호 변경, 회원 탈퇴', '아이디·비밀번호 찾기, 회원정보 조회·수정, 비밀번호 변경'],
    // 협의에 따라 가격 표시는 소비자가만 노출
    '상품 목록 화면': [
      '상세페이지 없는 리스트형 카탈로그 — 상품 일련번호·이미지·상품명·가격·VAT 표기·소비자가·정품 여부 표시',
      '상세페이지 없는 리스트형 카탈로그 — 상품 일련번호·이미지·상품명·소비자가·정품 여부 표시',
    ],
  };
  const fix = fixes[label];
  return fix && detail === fix[0] ? fix[1] : detail;
}

function newEntry(data: DocumentData, at = new Date().toISOString()): StoredDoc {
  return { id: uid(), createdAt: at, updatedAt: at, data };
}

function writeAll(docs: StoredDoc[]): boolean {
  try {
    localStorage.setItem(DOCS_KEY, JSON.stringify({ docs }));
    return true;
  } catch {
    return false;
  }
}

/** 저장소가 비어 있으면(첫 방문) 예시 문서 하나를 만든다. 이전 단일 문서 저장본은 목록으로 옮긴다. */
function readAll(): StoredDoc[] {
  try {
    const raw = localStorage.getItem(DOCS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { docs?: unknown[] };
      return (parsed.docs ?? []).flatMap((d) => {
        const e = d as StoredDoc;
        const data = normalize(e?.data);
        return data && e.id ? [{ id: e.id, createdAt: e.createdAt, updatedAt: e.updatedAt, data }] : [];
      });
    }
    let seed: StoredDoc;
    const legacy = localStorage.getItem(LEGACY_CURRENT_KEY);
    const legacyEnv = legacy ? (JSON.parse(legacy) as { savedAt?: string; data?: unknown }) : null;
    const legacyData = normalize(legacyEnv?.data);
    if (legacyData) {
      seed = newEntry(legacyData, legacyEnv?.savedAt);
    } else {
      seed = newEntry(createSampleDocument());
    }
    writeAll([seed]);
    localStorage.removeItem(LEGACY_CURRENT_KEY);
    return [seed];
  } catch {
    return [];
  }
}

/** 최근 수정순 목록 */
export function listDocs(): StoredDoc[] {
  return readAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getDoc(id: string): StoredDoc | null {
  return readAll().find((d) => d.id === id) ?? null;
}

export function createDoc(data: DocumentData): StoredDoc | null {
  const entry = newEntry(data);
  return writeAll([...readAll(), entry]) ? entry : null;
}

/** 저장 성공 시 수정 시각을 돌려준다 */
export function saveDoc(id: string, data: DocumentData): string | null {
  const docs = readAll();
  const at = new Date().toISOString();
  const i = docs.findIndex((d) => d.id === id);
  if (i < 0) return null;
  docs[i] = { ...docs[i], updatedAt: at, data };
  return writeAll(docs) ? at : null;
}

export function duplicateDoc(id: string): StoredDoc | null {
  const src = getDoc(id);
  if (!src) return null;
  const data = structuredClone(src.data);
  data.project.name = data.project.name ? `${data.project.name} (사본)` : '';
  return createDoc(data);
}

export function deleteDoc(id: string): boolean {
  return writeAll(readAll().filter((d) => d.id !== id));
}

/** 삭제 실행 취소용 — 삭제한 문서를 그대로 되돌린다 */
export function restoreDoc(entry: StoredDoc): boolean {
  const docs = readAll();
  if (docs.some((d) => d.id === entry.id)) return true;
  return writeAll([...docs, entry]);
}

/** 이 도구가 저장한 모든 데이터를 삭제 (공용 컴퓨터용) */
export function clearStoredData(): void {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(`${NS}:`))
      .forEach((k) => localStorage.removeItem(k));
    // 삭제 직후 새로고침 시 예시 문서가 다시 만들어지지 않도록 빈 목록을 남긴다
    writeAll([]);
  } catch {
    /* 저장소 접근 불가 시 무시 */
  }
}
