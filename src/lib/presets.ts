import type { Deliverable, DocumentData } from './types';
import { createBlankDocument, defaultDeliverables, DEFAULT_DELIVERABLES_INTRO, uid } from './defaults';

/**
 * 프로젝트별 미리 채운 확인서 — `#/new/<key>` 로 열면 새 문서로 만들어 편집 화면을 연다.
 * 브라우저마다 저장소가 따로이므로, 링크를 열 때마다 해당 브라우저에 새 문서가 생긴다.
 */

/**
 * 월드크레인 납품 항목 — 요구사항 정의서·피드백 기준 항목을 계약서 별첨 「웹사이트 구현기능 명세서」의 구성으로 묶었다.
 * 주요 기능: 사용자 상품 조회 화면, 회원가입·회원 관리, 관리자 상품·회원 관리
 * 팝업·퀵메뉴: 제작사 제안으로 반영된 부가 기능
 */
type Row = [group: string, label: string, detail: string];

const G_USER = '사용자 화면';
const G_MEMBER = '회원';
const G_ADMIN = '관리자 페이지';
const G_EXTRA = '부가 기능 (제작사 제안 반영)';
const G_COMMON = '공통 · 구축 환경';

const WORLDCRANE_ROWS: Row[] = [
  [G_USER, '상품 목록 화면', '상세페이지 없는 리스트형 카탈로그 — 상품 일련번호·이미지·상품명·가격·VAT 표기·소비자가·정품 여부 표시'],
  [G_USER, '상품 검색 · 카테고리 · 정렬', '상품명 등 상품정보 검색, 카테고리·필터별 조회, 관리자 노출 순서 및 등록순·상품명순·가격순 정렬'],
  [G_USER, '상품 상태 표시', '정상 판매·품절 상품 표시 (품절은 관리자 페이지에서 설정)'],
  [G_USER, '장바구니', '상품 담기·목록 조회·수량 확인 및 변경·개별/전체 삭제, 상품별 공급가액·부가세 표시 (주문·결제 기능 제외)'],
  [G_MEMBER, '회원가입 · 로그인', '아이디·비밀번호·이름·연락처·업체명·사업자등록번호 입력, 필수값 검증·아이디 중복 확인, 로그인 상태 유지·로그아웃'],
  [G_MEMBER, '회원 승인 후 이용', '승인 대기·승인 완료·승인 거절 상태 관리, 승인 전 안내 화면, 승인 완료 회원만 상품 목록 접근'],
  [G_MEMBER, '회원정보 관리', '아이디·비밀번호 찾기, 회원정보 조회·수정, 비밀번호 변경'],
  [G_ADMIN, '관리자 로그인 · 대시보드', '관리자 계정 로그인, 대시보드, 관리자 계정 다중 등록'],
  [G_ADMIN, '상품 관리', '상품 목록 조회·검색, 등록·수정·삭제(카테고리·상품번호 자동생성·상품명·이미지·가격·소비자가), 노출/비노출·품절·정렬 순서 설정'],
  [G_ADMIN, '상품 일괄 등록', '엑셀 등록·다운로드, 상품 이미지 일괄 등록'],
  [G_ADMIN, '회원 관리', '회원 목록·검색·상세정보 조회, 승인·거절 처리, 회원정보 수정, 관리자 직접 등록'],
  [G_EXTRA, '팝업 관리', '팝업 등록·수정·삭제, 노출/비노출·노출기간·링크 설정, 팝업 이미지 등록'],
  [G_EXTRA, '퀵메뉴 관리', '퀵메뉴 등록·수정·삭제, 노출/비노출·링크·노출 순서 설정'],
  [G_COMMON, '반응형 웹 구현', 'PC·태블릿·모바일 화면 크기에 따라 레이아웃이 자동 변경되는 반응형 웹'],
  [G_COMMON, '서버 및 운영 환경 구축', '웹호스팅 서버 설치 및 운영 환경 설정, 데이터베이스 연결'],
  [G_COMMON, '최종 기능 테스트 및 점검', ''],
  [G_COMMON, '관리자 운영 매뉴얼 제공', ''],
];

export const WORLDCRANE_INTRO =
  '본 홈페이지는 발주사와 제작사 간 상호 협의된 요구사항 정의서 및 계약금 입금에 따른 제작 의뢰를 바탕으로 제작되었으며, 아래 주요 기능을 포함합니다.';

export const worldcraneDeliverables = (): Deliverable[] =>
  WORLDCRANE_ROWS.map(([group, label, detail]) => ({ id: uid(), label, checked: true, group, detail }));

const WORLDCRANE_MEMO = [
  '본 프로젝트의 용역계약서는 제작사가 송부하였으나 발주사의 서명본이 회신되지 않았습니다. 이에 양측은 2026년 9월 29일 발주사의 계약금 입금을 계약 성립으로 보고, 익일인 2026년 9월 30일을 작업 착수일로 합니다. 제작 범위는 상호 협의된 요구사항 정의서 및 그에 대한 발주사의 피드백을 기준으로 하며, 발주사는 본 확인서에 서명함으로써 위 착수일과 제작 범위를 확인합니다.',
  '계약 범위 외 아래 기능을 추가 제공함',
  '- 상품 목록 보기 방식 전환 (카드형 / 리스트형)',
  '- 회원 삭제 기능',
  '- 회원 등록 시 사업자등록번호 상태 자동 조회',
  '- 썸네일 표시 방식 설정 (contain / cover)',
].join('\n\n');

function worldcrane(): DocumentData {
  const doc = createBlankDocument();
  doc.documentType = 'final';
  doc.project = {
    name: '월드크레인 온라인 상품 카탈로그 사이트 제작',
    url: 'https://wkghwkgh.mycafe24.com',
    contractDate: '',
    deliveryDate: '2026-10-19',
    remarks: '2026. 9. 29. 계약금 입금, 2026. 9. 30. 작업 착수',
  };
  doc.client = { name: '주식회사 월드크레인', representative: '이명훈' };
  doc.provider = { name: '엠와이디스튜디오', representative: '' };
  doc.deliverables = {
    intro: WORLDCRANE_INTRO,
    items: worldcraneDeliverables(),
  };
  doc.maintenance.text = doc.maintenance.text.replace('계약에 따라', '상호 협의에 따라');
  doc.notes = { enabled: true, items: [], memo: WORLDCRANE_MEMO };
  doc.documentDate = '2026-10-19';
  return doc;
}

export const PRESETS: Record<string, () => DocumentData> = { worldcrane };

/** 편집 화면의 「항목 세트 불러오기」 목록 — 현재 문서의 납품 항목과 안내 문구만 바꾼다 */
export interface DeliverablePreset {
  id: string;
  label: string;
  description: string;
  intro: string;
  build: () => Deliverable[];
}

export const DELIVERABLE_PRESETS: DeliverablePreset[] = [
  {
    id: 'worldcrane',
    label: '월드크레인 — 회원제 상품 카탈로그',
    description: '구현기능 명세서 구성 기준 17개 항목 — 사용자 화면 · 회원 · 관리자 페이지 · 제안 기능(팝업·퀵메뉴) · 공통',
    intro: WORLDCRANE_INTRO,
    build: worldcraneDeliverables,
  },
  {
    id: 'basic',
    label: '기본 항목',
    description: '일반 홈페이지 제작 항목 10종 (선택 해제 상태)',
    intro: DEFAULT_DELIVERABLES_INTRO,
    build: () => defaultDeliverables(),
  },
];
