import type { DocType, DocumentData, Deliverable } from './types';
import { todayISO } from './format';

export const DOC_TYPE_META: Record<
  DocType,
  { label: string; short: string; description: string; inspectionHeading: string; confirmationHeading: string }
> = {
  final: {
    label: '최종 납품 확인서',
    short: '최종 납품',
    description: '정식 서버 이전과 최종 검수가 완료된 프로젝트',
    inspectionHeading: '납품 및 검수 확인',
    confirmationHeading: '최종 확인',
  },
  review: {
    label: '개발 완료 및 검수 확인서',
    short: '개발 검수',
    description: '개발은 완료되었으나 정식 서버 이전·최종 납품이 진행 중인 프로젝트',
    inspectionHeading: '개발 완료 및 검수 확인',
    confirmationHeading: '개발 결과물 확인',
  },
};

export const DEFAULT_TITLE: Record<DocType, string> = {
  final: '홈페이지 제작 납품 확인서',
  review: '홈페이지 개발 완료 및 검수 확인서',
};

export const DEFAULT_DELIVERABLES_INTRO =
  '본 홈페이지는 발주사와 제작사 간 체결한 홈페이지 제작 계약 및 상호 협의된 요구사항을 바탕으로 제작되었으며, 아래 주요 기능을 포함합니다.';

export const DEFAULT_INSPECTION: Record<DocType, string> = {
  final: [
    '발주사는 제작사로부터 상기 홈페이지 제작 결과물을 제공받아 주요 화면 및 기능에 대한 검수를 진행하였으며, 계약 및 협의된 제작 범위에 따른 납품이 완료되었음을 확인합니다.',
    '본 확인서의 서명을 기준으로 홈페이지 제작 및 납품 절차가 완료된 것으로 하며, 이후 추가 기능 개발, 디자인 변경 및 계약 범위를 초과하는 수정 요청은 별도 협의를 통해 진행합니다.',
    '단, 계약상 정해진 유지관리 및 하자보수 의무는 본 확인서 서명 이후에도 유효합니다.',
  ].join('\n\n'),
  review: [
    '발주사는 제작사로부터 홈페이지 개발 결과물 및 테스트 환경을 제공받아 주요 화면과 기능을 확인하였으며, 현재까지 완료된 개발 내역을 확인합니다.',
    '본 확인서는 개발 결과물의 검수 사실을 확인하는 문서이며, 정식 서버 이전 및 최종 납품 완료 여부는 별도 확인 또는 계약상 정해진 절차에 따릅니다.',
  ].join('\n\n'),
};

/** {기준}: 유지관리 시작 기준, {기간}: 유지관리 기간(일) */
export const DEFAULT_MAINTENANCE_TEXT = [
  '제작사는 계약에 따라 {기준}로부터 {기간}일간 제작 범위 내 기능 오류 및 하자에 대한 점검과 보수를 지원합니다.',
  '홈페이지 운영에 따른 상품 정보 등록 및 수정, 회원 승인 및 관리, 게시 콘텐츠의 적법성 및 정확성 등 실질적인 사이트 운영에 관한 사항은 발주사에서 관리합니다.',
  '유지관리 기간 종료 후 발생하는 추가 수정 및 관리 업무는 별도 협의를 통해 진행합니다.',
].join('\n\n');

export const DEFAULT_MAINTENANCE_BASIS = '납품 완료일';
export const DEFAULT_MAINTENANCE_DAYS = 90;

export const DEFAULT_CONFIRMATION: Record<DocType, string> = {
  final: [
    '발주사는 상기 홈페이지의 제작 및 납품 내역을 확인하였으며, 계약 및 협의된 범위에 따른 제작 결과물을 인수하였음을 확인합니다.',
    '본 확인서는 홈페이지 제작 및 납품 완료 사실을 증빙하기 위하여 작성합니다.',
  ].join('\n\n'),
  review: [
    '발주사는 상기 홈페이지의 개발 결과물과 현재까지 완료된 개발 내역을 확인하였습니다.',
    '본 확인서는 홈페이지 개발 완료 및 검수 사실을 증빙하기 위하여 작성하며, 결과물의 최종 인수는 정식 서버 이전 및 최종 납품 절차에 따라 별도로 확인합니다.',
  ].join('\n\n'),
};

/** 기본 납품 항목 — 예시이며 모든 프로젝트에 일괄 적용하지 않는다(기본 선택 해제). */
export const DEFAULT_DELIVERABLE_LABELS = [
  '홈페이지 화면 및 디자인 구현',
  '반응형 웹 구현',
  '회원가입 및 로그인 기능',
  '관리자 페이지 구축',
  '회원 승인 및 관리 기능',
  '상품 등록 및 관리 기능',
  '회원별 콘텐츠 접근 권한 설정',
  '웹호스팅 서버 설치 및 운영 환경 설정',
  '데이터베이스 연결 및 설정',
  '최종 기능 테스트 및 점검',
];

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function defaultDeliverables(checkedLabels: string[] = []): Deliverable[] {
  return DEFAULT_DELIVERABLE_LABELS.map((label) => ({
    id: uid(),
    label,
    checked: checkedLabels.includes(label),
    group: '',
    detail: '',
  }));
}

/**
 * 납품 항목 세트 — 편집 화면에서 불러와 납품 내역을 한 번에 구성한다.
 * 회원제 상품 카탈로그 세트는 계약서 별첨 「웹사이트 구현기능 명세서」의 구성을 따른다.
 */
type PresetRow = [group: string, label: string, detail: string];

const MEMBER_CATALOG_ROWS: PresetRow[] = [
  ['사용자 화면', '상품 목록 (카탈로그)', '리스트형 상품 목록 — 상품 일련번호·이미지·상품명·가격·VAT 표기·소비자가·정품 여부·품절 여부 표시'],
  ['사용자 화면', '상품 검색 · 카테고리 · 정렬', '상품명 등 상품정보 검색, 카테고리별 조회, 관리자 노출 순서 및 등록순·상품명순·가격순 정렬'],
  ['사용자 화면', '장바구니', '상품 담기·목록 조회·수량 확인 및 변경·개별/전체 삭제, 상품별 공급가액·부가세 표시 (주문·결제 기능 제외)'],
  ['회원', '회원가입', '아이디·비밀번호·이름·연락처·업체명·사업자등록번호 입력, 필수값 검증, 아이디 중복 확인'],
  ['회원', '로그인', '아이디 로그인, 로그인 상태 유지, 로그아웃'],
  ['회원', '회원 승인', '승인 대기·승인 완료·승인 거절 상태 관리, 승인 완료 회원만 상품 목록 접근'],
  ['회원', '회원정보 관리', '회원정보 조회·수정, 비밀번호 변경'],
  ['관리자 페이지', '관리자 로그인', '관리자 계정으로 관리자 페이지 접근'],
  ['관리자 페이지', '상품 관리', '상품 목록 조회·검색, 등록·수정·삭제, 노출/비노출 및 품절 여부 설정, 상품 일련번호 자동 생성'],
  ['관리자 페이지', '회원 관리', '회원 목록·검색·상세정보 조회, 회원 승인 여부 처리, 회원정보 수정'],
  ['부가 기능 (제작사 제안 반영)', '팝업 관리', '팝업 등록·수정·삭제, 노출/비노출·노출기간·링크 설정, 팝업 이미지 등록'],
  ['부가 기능 (제작사 제안 반영)', '퀵메뉴 관리', '퀵메뉴 등록·수정·삭제, 노출/비노출·링크·노출 순서 설정'],
  ['공통', '반응형 웹', 'PC·태블릿·모바일 화면 크기에 따라 레이아웃이 자동 변경되는 반응형 웹 구축'],
];

export interface DeliverablePreset {
  id: string;
  label: string;
  description: string;
  intro: string;
  build: () => Deliverable[];
}

export const DELIVERABLE_PRESETS: DeliverablePreset[] = [
  {
    id: 'member-catalog',
    label: '회원제 상품 카탈로그',
    description: '구현기능 명세서 기준 — 사용자 화면 · 회원 · 관리자 페이지 · 제안 기능(팝업·퀵메뉴) · 반응형',
    intro:
      '본 홈페이지는 발주사와 제작사 간 체결한 사이트 개발 용역계약 및 별첨 「웹사이트 구현기능 명세서」를 바탕으로 제작되었으며, 아래 주요 기능을 포함합니다.',
    build: () => MEMBER_CATALOG_ROWS.map(([group, label, detail]) => ({ id: uid(), label, checked: true, group, detail })),
  },
  {
    id: 'basic',
    label: '기본 항목',
    description: '일반 홈페이지 제작 항목 10종 (선택 해제 상태)',
    intro: DEFAULT_DELIVERABLES_INTRO,
    build: () => defaultDeliverables(),
  },
];

/** 빈 새 문서 — 기본 문구는 유지하고 프로젝트 정보는 비운다. */
export function createBlankDocument(): DocumentData {
  return {
    version: 1,
    documentType: 'final',
    title: { ...DEFAULT_TITLE },
    project: { name: '', url: '', contractDate: '', deliveryDate: '', remarks: '' },
    client: { name: '', representative: '' },
    provider: { name: '', representative: '' },
    deliverables: { intro: DEFAULT_DELIVERABLES_INTRO, items: defaultDeliverables() },
    inspection: { text: { ...DEFAULT_INSPECTION } },
    maintenance: {
      enabled: true,
      days: DEFAULT_MAINTENANCE_DAYS,
      startBasis: DEFAULT_MAINTENANCE_BASIS,
      startDate: '',
      text: DEFAULT_MAINTENANCE_TEXT,
    },
    notes: { enabled: false, items: [], memo: '' },
    confirmation: { text: { ...DEFAULT_CONFIRMATION } },
    signatures: { clientLabel: '발주사', providerLabel: '제작사', clientStamp: '', providerStamp: '' },
    documentDate: todayISO(),
    meta: { isSample: false },
  };
}

/** 처음 접속 시 보여주는 예시 문서 */
export function createSampleDocument(): DocumentData {
  const doc = createBlankDocument();
  const today = todayISO();
  doc.project = {
    name: '기업 홈페이지 제작',
    url: 'https://www.sample-company.co.kr',
    contractDate: '',
    deliveryDate: today,
    remarks: '',
  };
  doc.client = { name: '주식회사 샘플기업', representative: '홍길동' };
  doc.provider = { name: '엠와이디스튜디오', representative: '' };
  doc.deliverables.items = defaultDeliverables([
    '홈페이지 화면 및 디자인 구현',
    '반응형 웹 구현',
    '관리자 페이지 구축',
    '웹호스팅 서버 설치 및 운영 환경 설정',
    '최종 기능 테스트 및 점검',
  ]);
  doc.meta.isSample = true;
  return doc;
}
