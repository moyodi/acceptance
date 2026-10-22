export type PeriodUnit = 'day' | 'month';

/** 문서 유형: 최종 납품 확인서 / 개발 완료 및 검수 확인서 */
export type DocType = 'final' | 'review';

export interface Party {
  /** 상호 */
  name: string;
  /** 대표자 */
  representative: string;
}

export interface Deliverable {
  id: string;
  label: string;
  checked: boolean;
  /** 구분 (예: 사용자 화면, 관리자 페이지) — 같은 구분이 이어지면 문서에서 묶어 표시 */
  group: string;
  /** 세부 내용 — 항목 아래 한 줄 설명 */
  detail: string;
}

export interface NoteItem {
  id: string;
  /** 미완료 작업 내용 */
  task: string;
  /** 완료 예정일 (YYYY-MM-DD) */
  dueDate: string;
  /** 비고 */
  remark: string;
}

/** 유형별로 따로 보관하는 문구. 유형을 바꿔도 다른 유형에서 수정한 문구는 유지된다. */
export type PerType<T> = Record<DocType, T>;

export interface DocumentData {
  version: 1;
  documentType: DocType;
  /** 문서 제목 (유형별) */
  title: PerType<string>;
  project: {
    name: string;
    url: string;
    /** 계약일 (YYYY-MM-DD) */
    contractDate: string;
    /** 납품일 (YYYY-MM-DD) */
    deliveryDate: string;
    remarks: string;
  };
  client: Party;
  provider: Party;
  deliverables: {
    intro: string;
    items: Deliverable[];
  };
  inspection: {
    text: PerType<string>;
  };
  maintenance: {
    enabled: boolean;
    /** 유지관리 기간 (일) */
    /** 유지관리 기간 (숫자) — 단위는 unit */
    days: number | null;
    /** 기간 단위: 일 / 개월 */
    unit: PeriodUnit;
    /** 유지관리 시작 기준 (문구) — 예: 납품 완료일 */
    startBasis: string;
    /** 유지관리 시작일 (YYYY-MM-DD) — 입력 시 기간을 날짜로 계산해 표시 */
    startDate: string;
    /** 본문. {기간}, {기준} 토큰이 치환된다. */
    text: string;
  };
  notes: {
    enabled: boolean;
    items: NoteItem[];
    /** 추가 협의 내용 */
    memo: string;
  };
  confirmation: {
    text: PerType<string>;
  };
  signatures: {
    clientLabel: string;
    providerLabel: string;
    /** 도장(서명) 이미지 data URL — 비어 있으면 출력 후 수기 날인 */
    clientStamp: string;
    providerStamp: string;
  };
  /** 문서 작성일 (YYYY-MM-DD) */
  documentDate: string;
  meta: {
    /** 예시 데이터로 채워진 문서인지 */
    isSample: boolean;
  };
}
