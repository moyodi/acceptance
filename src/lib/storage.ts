import type { DocumentData } from './types';
import { createBlankDocument } from './defaults';

/**
 * 브라우저 로컬 저장소. 서버로 전송하지 않는다.
 * 추후 여러 문서 저장으로 확장할 수 있도록 네임스페이스/버전을 키에 포함한다.
 */
const NS = 'myd-acceptance';
const CURRENT_KEY = `${NS}:v1:current`;

export interface StoredEnvelope {
  savedAt: string;
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
      items: Array.isArray(r.deliverables?.items) ? r.deliverables!.items : base.deliverables.items,
    },
    inspection: { text: { ...base.inspection.text, ...r.inspection?.text } },
    maintenance: { ...base.maintenance, ...r.maintenance },
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

export function loadDocument(): StoredEnvelope | null {
  try {
    const s = localStorage.getItem(CURRENT_KEY);
    if (!s) return null;
    const env = JSON.parse(s) as StoredEnvelope;
    const data = normalize(env.data);
    return data ? { savedAt: env.savedAt, data } : null;
  } catch {
    return null;
  }
}

export function saveDocument(data: DocumentData): string | null {
  try {
    const savedAt = new Date().toISOString();
    localStorage.setItem(CURRENT_KEY, JSON.stringify({ savedAt, data } satisfies StoredEnvelope));
    return savedAt;
  } catch {
    return null;
  }
}

/** 이 도구가 저장한 모든 데이터를 삭제 */
export function clearStoredData(): void {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(`${NS}:`))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* 저장소 접근 불가 시 무시 */
  }
}
