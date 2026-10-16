import type { DocumentData } from './types';

export interface ValidationError {
  /** 포커스를 옮길 입력 요소 id */
  fieldId: string;
  /** 오류가 있는 편집 섹션 */
  section: string;
  message: string;
}

export function validate(d: DocumentData): ValidationError[] {
  const errors: ValidationError[] = [];
  const req = (value: string, fieldId: string, label: string) => {
    if (!value.trim()) errors.push({ fieldId, section: '프로젝트 정보', message: `${label} 입력해 주세요.` });
  };
  req(d.project.name, 'f-project-name', '프로젝트명을');
  req(d.client.name, 'f-client-name', '발주사 상호를');
  req(d.provider.name, 'f-provider-name', '제작사 상호를');
  req(d.project.deliveryDate, 'f-delivery-date', d.documentType === 'final' ? '납품일을' : '개발 완료일을');

  if (!d.title[d.documentType].trim()) {
    errors.push({ fieldId: 'f-title', section: '문서 유형', message: '문서 제목을 입력해 주세요.' });
  }
  if (!d.deliverables.items.some((i) => i.checked && i.label.trim())) {
    errors.push({
      fieldId: 'f-deliverables',
      section: '납품 항목',
      message: '문서에 표시할 납품 항목을 하나 이상 선택해 주세요.',
    });
  }
  if (d.maintenance.enabled && (!d.maintenance.days || d.maintenance.days < 1)) {
    errors.push({
      fieldId: 'f-maint-days',
      section: '유지관리 및 운영',
      message: '유지관리 기간(1일 이상)을 입력하거나 유지관리 조항을 미적용으로 설정해 주세요.',
    });
  }
  if (!d.documentDate) {
    errors.push({ fieldId: 'f-document-date', section: '서명 정보', message: '확인서 작성일을 입력해 주세요.' });
  }
  return errors;
}
