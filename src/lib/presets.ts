import type { DocumentData } from './types';
import { createBlankDocument, uid } from './defaults';

/**
 * 프로젝트별 미리 채운 확인서 — `#/new/<key>` 로 열면 새 문서로 만들어 편집 화면을 연다.
 * 브라우저마다 저장소가 따로이므로, 링크를 열 때마다 해당 브라우저에 새 문서가 생긴다.
 */

const WORLDCRANE_DELIVERABLES = [
  '회원가입 및 로그인',
  '아이디·비밀번호 찾기, 회원정보 수정, 회원 탈퇴',
  '관리자 승인 후 이용 (승인 전 안내 화면)',
  '상품 목록 화면 (상품 이미지, 상품명, 가격·VAT, 소비자가, 정품 표시)',
  '상품 검색, 카테고리·필터, 정렬',
  '품절 상품 표시',
  '장바구니 (상품 목록, 수량 확인·변경, 삭제)',
  '관리자 페이지 구축 (관리자 로그인, 대시보드)',
  '상품 등록·수정·삭제 (카테고리, 상품번호 자동생성, 상품명, 이미지, 가격, 소비자가, 품절, 노출, 정렬 순서)',
  '상품 일괄 등록 (엑셀 등록·다운로드, 이미지 일괄 등록)',
  '회원 관리 (승인·거절, 관리자 직접 등록)',
  '팝업 관리',
  '퀵메뉴 관리',
  '관리자 계정 다중 등록',
  '반응형 웹 구현',
  '웹호스팅 서버 설치 및 운영 환경 설정, 데이터베이스 연결',
  '최종 기능 테스트 및 점검',
  '관리자 운영 매뉴얼 제공',
];

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
    intro:
      '본 홈페이지는 발주사와 제작사 간 상호 협의된 요구사항 정의서 및 계약금 입금에 따른 제작 의뢰를 바탕으로 제작되었으며, 아래 주요 기능을 포함합니다.',
    items: WORLDCRANE_DELIVERABLES.map((label) => ({ id: uid(), label, checked: true })),
  };
  doc.maintenance.text = doc.maintenance.text.replace('계약에 따라', '상호 협의에 따라');
  doc.notes = { enabled: true, items: [], memo: WORLDCRANE_MEMO };
  doc.documentDate = '2026-10-19';
  return doc;
}

export const PRESETS: Record<string, () => DocumentData> = { worldcrane };
