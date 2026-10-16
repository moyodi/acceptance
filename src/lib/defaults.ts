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
  }));
}

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
