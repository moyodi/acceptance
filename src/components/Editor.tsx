import type { DocType, DocumentData, NoteItem } from '../lib/types';
import {
  DEFAULT_CONFIRMATION,
  DEFAULT_DELIVERABLES_INTRO,
  DEFAULT_INSPECTION,
  DEFAULT_MAINTENANCE_BASIS,
  DEFAULT_MAINTENANCE_TEXT,
  DEFAULT_TITLE,
  DOC_TYPE_META,
  uid,
} from '../lib/defaults';
import { formatKDate } from '../lib/format';
import type { ValidationError } from '../lib/validation';
import { maintenancePeriodLabel } from '../doc/model';
import { AutoTextarea, Card, Field, Icon, ResetTextButton, Toggle } from './ui';
import { StampUpload } from './StampUpload';
import type { ConfirmOptions } from './Dialogs';
import { DeliverablesEditor } from './DeliverablesEditor';

export type Edit = (mutate: (draft: DocumentData) => void) => void;

interface Props {
  data: DocumentData;
  edit: Edit;
  errors: ValidationError[];
  showErrors: boolean;
  onDismissSample: () => void;
  onStartBlank: () => void;
  onError: (message: string) => void;
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
}

export const EDITOR_SECTIONS = [
  { id: 'sec-type', label: '문서 유형' },
  { id: 'sec-project', label: '프로젝트 정보' },
  { id: 'sec-deliverables', label: '납품 항목' },
  { id: 'sec-inspection', label: '검수 확인' },
  { id: 'sec-maintenance', label: '유지관리' },
  { id: 'sec-notes', label: '특이사항' },
  { id: 'sec-confirmation', label: '최종 확인' },
  { id: 'sec-signature', label: '서명 정보' },
];

export function Editor({ data, edit, errors, showErrors, onDismissSample, onStartBlank, onError, confirm }: Props) {
  const type = data.documentType;
  const err = (fieldId: string) => (showErrors ? errors.find((e) => e.fieldId === fieldId)?.message : undefined);
  const inputProps = (fieldId: string) => {
    const e = err(fieldId);
    return { id: fieldId, 'aria-invalid': e ? true : undefined, 'aria-describedby': e ? `${fieldId}-error` : undefined } as const;
  };

  return (
    <div className="flex flex-col gap-4">
      {data.meta.isSample && (
        <div role="note" className="rounded-md border border-warn-line bg-warn-subtle px-4 py-3 text-compact text-warn">
          <p className="font-semibold">샘플 문서입니다</p>
          <p className="mt-0.5 text-[#92400E]">
            예시 데이터로 채워진 문서로, 실제 클라이언트 문서가 아닙니다. 내용을 프로젝트에 맞게 수정해 사용하세요.
          </p>
          <div className="flex gap-2 mt-2">
            <button type="button" className="btn h-7 px-2.5 text-caption bg-white border border-warn-line text-warn hover:bg-amber-50" onClick={onStartBlank}>
              빈 문서로 시작
            </button>
            <button type="button" className="btn h-7 px-2.5 text-caption text-warn hover:bg-amber-100" onClick={onDismissSample}>
              샘플 표시 숨기기
            </button>
          </div>
        </div>
      )}

      {showErrors && errors.length > 0 && <ErrorSummary errors={errors} />}

      {/* 01 문서 유형 */}
      <Card id="sec-type" num="01" title="문서 유형" description="유형에 따라 문서 제목과 검수·확인 문구가 자동으로 바뀝니다. 유형별로 수정한 문구는 각각 보존됩니다.">
        <div role="radiogroup" aria-label="문서 유형" className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(Object.keys(DOC_TYPE_META) as DocType[]).map((t) => {
            const m = DOC_TYPE_META[t];
            const active = type === t;
            return (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => edit((d) => void (d.documentType = t))}
                className={`text-left rounded-md border px-4 py-3 transition-colors ${
                  active ? 'border-line-primary bg-bg-primary-subtle ring-1 ring-line-primary' : 'border-line hover:bg-bg-subtle'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`w-4 h-4 rounded-full border flex-none ${active ? 'border-[5px] border-bg-primary' : 'border-line-strong'}`}
                    aria-hidden
                  />
                  <span className={`text-body font-semibold ${active ? 'text-bg-primary-hover' : 'text-fg-primary'}`}>{m.label}</span>
                </span>
                <span className="block mt-1 pl-6 text-caption text-fg-tertiary">{m.description}</span>
              </button>
            );
          })}
        </div>
        <Field id="f-title" label="문서 제목" required className="mt-4" error={err('f-title')}>
          <div className="flex gap-2">
            <input
              {...inputProps('f-title')}
              className="input"
              value={data.title[type]}
              onChange={(e) => edit((d) => void (d.title[type] = e.target.value))}
            />
          </div>
        </Field>
        <div className="mt-1.5 flex justify-end">
          <ResetTextButton modified={data.title[type] !== DEFAULT_TITLE[type]} onReset={() => edit((d) => void (d.title[type] = DEFAULT_TITLE[type]))} />
        </div>
      </Card>

      {/* 02 프로젝트 정보 */}
      <Card id="sec-project" num="02" title="프로젝트 정보" description="입력하지 않은 선택 항목은 문서에서 자동으로 숨겨집니다.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field id="f-project-name" label="프로젝트명" required className="sm:col-span-2" error={err('f-project-name')}>
            <input {...inputProps('f-project-name')} className="input" value={data.project.name} placeholder="예: 기업 홈페이지 제작" onChange={(e) => edit((d) => void (d.project.name = e.target.value))} />
          </Field>
          <Field id="f-client-name" label="발주사 상호" required error={err('f-client-name')}>
            <input {...inputProps('f-client-name')} className="input" value={data.client.name} placeholder="예: 주식회사 OOO" onChange={(e) => edit((d) => void (d.client.name = e.target.value))} />
          </Field>
          <Field id="f-client-rep" label="발주사 대표자">
            <input id="f-client-rep" className="input" value={data.client.representative} onChange={(e) => edit((d) => void (d.client.representative = e.target.value))} />
          </Field>
          <Field id="f-provider-name" label="제작사 상호" required error={err('f-provider-name')}>
            <input {...inputProps('f-provider-name')} className="input" value={data.provider.name} onChange={(e) => edit((d) => void (d.provider.name = e.target.value))} />
          </Field>
          <Field id="f-provider-rep" label="제작사 대표자">
            <input id="f-provider-rep" className="input" value={data.provider.representative} onChange={(e) => edit((d) => void (d.provider.representative = e.target.value))} />
          </Field>
          <Field id="f-contract-date" label="계약일" hint={formatKDate(data.project.contractDate) || undefined}>
            <input id="f-contract-date" type="date" className="input" value={data.project.contractDate} onChange={(e) => edit((d) => void (d.project.contractDate = e.target.value))} />
          </Field>
          <Field
            id="f-delivery-date"
            label={type === 'final' ? '납품일' : '개발 완료일 (납품일)'}
            required
            error={err('f-delivery-date')}
            hint={formatKDate(data.project.deliveryDate) || undefined}
          >
            <input {...inputProps('f-delivery-date')} type="date" className="input" value={data.project.deliveryDate} onChange={(e) => edit((d) => void (d.project.deliveryDate = e.target.value))} />
          </Field>
          <Field id="f-url" label="홈페이지 주소" className="sm:col-span-2">
            <input id="f-url" type="text" inputMode="url" className="input" value={data.project.url} placeholder="https://" onChange={(e) => edit((d) => void (d.project.url = e.target.value))} />
          </Field>
          <Field id="f-remarks" label="비고" className="sm:col-span-2">
            <AutoTextarea id="f-remarks" rows={2} value={data.project.remarks} onChange={(e) => edit((d) => void (d.project.remarks = e.target.value))} />
          </Field>
        </div>
      </Card>

      {/* 03 납품 항목 */}
      <Card id="sec-deliverables" num="03" title="제작 및 납품 내역" description="프로젝트에 해당하는 항목만 선택하세요. 항목마다 구분과 세부 내용을 적을 수 있고, 같은 구분이 이어지면 문서에서 한 묶음으로 표시됩니다. 이름 수정·추가·삭제·순서 변경(드래그)이 가능합니다.">
        <Field id="f-deliv-intro" label="안내 문구">
          <AutoTextarea id="f-deliv-intro" value={data.deliverables.intro} onChange={(e) => edit((d) => void (d.deliverables.intro = e.target.value))} />
        </Field>
        <div className="mt-1.5 mb-4 flex justify-end">
          <ResetTextButton
            modified={data.deliverables.intro !== DEFAULT_DELIVERABLES_INTRO}
            onReset={() => edit((d) => void (d.deliverables.intro = DEFAULT_DELIVERABLES_INTRO))}
          />
        </div>
        <DeliverablesEditor
          items={data.deliverables.items}
          error={err('f-deliverables')}
          onChange={(items) => edit((d) => void (d.deliverables.items = items))}
          onApplyPreset={async (preset) => {
            const ok = await confirm({
              title: '항목 세트 불러오기',
              message: `현재 납품 항목과 안내 문구를 「${preset.label}」 세트로 바꿀까요?\n직접 수정한 항목은 사라집니다.`,
              confirmLabel: '불러오기',
            });
            if (ok)
              edit((d) => {
                d.deliverables.items = preset.build();
                d.deliverables.intro = preset.intro;
              });
          }}
        />
      </Card>

      {/* 04 검수 확인 */}
      <Card
        id="sec-inspection"
        num="04"
        title={DOC_TYPE_META[type].inspectionHeading}
        description={`${DOC_TYPE_META[type].label} 유형의 검수 문구입니다. 빈 줄로 문단을 구분합니다.`}
      >
        <label htmlFor="f-inspection" className="sr-only">
          검수 확인 문구
        </label>
        <AutoTextarea id="f-inspection" value={data.inspection.text[type]} onChange={(e) => edit((d) => void (d.inspection.text[type] = e.target.value))} />
        <div className="mt-1.5 flex justify-end">
          <ResetTextButton
            modified={data.inspection.text[type] !== DEFAULT_INSPECTION[type]}
            onReset={() => edit((d) => void (d.inspection.text[type] = DEFAULT_INSPECTION[type]))}
          />
        </div>
      </Card>

      {/* 05 유지관리 */}
      <Card id="sec-maintenance" num="05" title="유지관리 및 운영">
        <Toggle
          label="유지관리 조항 사용"
          description="사용하지 않으면 문서에서 해당 섹션과 유지관리 기간 항목이 숨겨집니다."
          checked={data.maintenance.enabled}
          onChange={(v) => edit((d) => void (d.maintenance.enabled = v))}
        />
        {data.maintenance.enabled && (
          <div className="mt-4 flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="f-maint-days" label="유지관리 기간 (일)" required error={err('f-maint-days')}>
                <div className="relative">
                  <input
                    {...inputProps('f-maint-days')}
                    type="number"
                    min={1}
                    inputMode="numeric"
                    className="input pr-10"
                    value={data.maintenance.days ?? ''}
                    onChange={(e) =>
                      edit((d) => {
                        const n = parseInt(e.target.value, 10);
                        d.maintenance.days = Number.isFinite(n) && n > 0 ? n : null;
                      })
                    }
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-compact text-fg-tertiary pointer-events-none">일</span>
                </div>
              </Field>
              <Field id="f-maint-basis" label="시작 기준" hint="문구의 {기준} 위치에 표시됩니다.">
                <input
                  id="f-maint-basis"
                  className="input"
                  value={data.maintenance.startBasis}
                  placeholder={DEFAULT_MAINTENANCE_BASIS}
                  onChange={(e) => edit((d) => void (d.maintenance.startBasis = e.target.value))}
                />
              </Field>
              <Field
                id="f-maint-start"
                label="유지관리 시작일"
                className="sm:col-span-2"
                hint="계약 기준을 우선합니다. 입력하면 종료일까지 계산해 계약 정보 표에 표시합니다."
              >
                <div className="flex gap-2">
                  <input
                    id="f-maint-start"
                    type="date"
                    className="input"
                    value={data.maintenance.startDate}
                    onChange={(e) => edit((d) => void (d.maintenance.startDate = e.target.value))}
                  />
                  {data.project.deliveryDate && data.maintenance.startDate !== data.project.deliveryDate && (
                    <button
                      type="button"
                      className="btn-secondary h-control flex-none"
                      onClick={() => edit((d) => void (d.maintenance.startDate = d.project.deliveryDate))}
                    >
                      납품일로 설정
                    </button>
                  )}
                </div>
              </Field>
            </div>
            {maintenancePeriodLabel(data) && (
              <p className="text-caption text-fg-secondary bg-bg-subtle rounded-sm px-3 py-2">
                문서 표기: <b className="text-fg-primary">{maintenancePeriodLabel(data)}</b>
              </p>
            )}
            <Field id="f-maint-text" label="유지관리 문구" hint="{기간}, {기준} 은 위 입력값으로 자동 치환됩니다. 빈 줄로 문단을 구분합니다.">
              <AutoTextarea id="f-maint-text" value={data.maintenance.text} onChange={(e) => edit((d) => void (d.maintenance.text = e.target.value))} />
            </Field>
            <div className="-mt-2 flex justify-end">
              <ResetTextButton
                modified={data.maintenance.text !== DEFAULT_MAINTENANCE_TEXT}
                onReset={() => edit((d) => void (d.maintenance.text = DEFAULT_MAINTENANCE_TEXT))}
              />
            </div>
          </div>
        )}
      </Card>

      {/* 06 특이사항 */}
      <Card id="sec-notes" num="06" title="미완료 사항 및 특이사항">
        <Toggle
          label="섹션 표시"
          description="남은 작업이나 추가 협의 내용이 있을 때 사용합니다."
          checked={data.notes.enabled}
          onChange={(v) => edit((d) => void (d.notes.enabled = v))}
        />
        {data.notes.enabled && (
          <div className="mt-4 flex flex-col gap-3">
            {data.notes.items.map((n, i) => (
              <NoteRow
                key={n.id}
                index={i}
                item={n}
                onPatch={(p) => edit((d) => void (d.notes.items = d.notes.items.map((x) => (x.id === n.id ? { ...x, ...p } : x))))}
                onRemove={() => edit((d) => void (d.notes.items = d.notes.items.filter((x) => x.id !== n.id)))}
              />
            ))}
            <button
              type="button"
              className="btn-secondary h-control w-full border-dashed"
              onClick={() => edit((d) => void d.notes.items.push({ id: uid(), task: '', dueDate: '', remark: '' }))}
            >
              <Icon name="plus" /> 미완료 작업 추가
            </button>
            <Field id="f-notes-memo" label="추가 협의 내용" className="mt-1">
              <AutoTextarea
                id="f-notes-memo"
                rows={2}
                value={data.notes.memo}
                placeholder="예: 정식 도메인 연결은 발주사 도메인 이전 완료 후 진행합니다."
                onChange={(e) => edit((d) => void (d.notes.memo = e.target.value))}
              />
            </Field>
          </div>
        )}
      </Card>

      {/* 07 최종 확인 */}
      <Card
        id="sec-confirmation"
        num="07"
        title={DOC_TYPE_META[type].confirmationHeading}
        description={type === 'review' ? '개발 완료 및 검수 확인서는 최종 인수 대신 개발 결과물 확인 문구를 사용합니다.' : undefined}
      >
        <label htmlFor="f-confirmation" className="sr-only">
          최종 확인 문구
        </label>
        <AutoTextarea id="f-confirmation" value={data.confirmation.text[type]} onChange={(e) => edit((d) => void (d.confirmation.text[type] = e.target.value))} />
        <div className="mt-1.5 flex justify-end">
          <ResetTextButton
            modified={data.confirmation.text[type] !== DEFAULT_CONFIRMATION[type]}
            onReset={() => edit((d) => void (d.confirmation.text[type] = DEFAULT_CONFIRMATION[type]))}
          />
        </div>
      </Card>

      {/* 08 서명 */}
      <Card id="sec-signature" num="08" title="서명 및 날인" description="상호·대표자는 프로젝트 정보와 연동되어 어느 쪽에서 수정해도 함께 바뀝니다. 도장 이미지를 첨부하거나, 출력 후 직접 서명·날인할 수 있습니다.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field id="f-document-date" label="확인서 작성일" required className="sm:col-span-2" error={err('f-document-date')} hint={formatKDate(data.documentDate) || undefined}>
            <input {...inputProps('f-document-date')} type="date" className="input" value={data.documentDate} onChange={(e) => edit((d) => void (d.documentDate = e.target.value))} />
          </Field>
          <Field id="f-sign-client" label="발주사 표기">
            <input id="f-sign-client" className="input" value={data.signatures.clientLabel} onChange={(e) => edit((d) => void (d.signatures.clientLabel = e.target.value))} />
          </Field>
          <Field id="f-sign-provider" label="제작사 표기">
            <input id="f-sign-provider" className="input" value={data.signatures.providerLabel} onChange={(e) => edit((d) => void (d.signatures.providerLabel = e.target.value))} />
          </Field>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3">
          {(
            [
              { key: 'clientStamp', party: 'client', role: data.signatures.clientLabel || '발주사', p: data.client },
              { key: 'providerStamp', party: 'provider', role: data.signatures.providerLabel || '제작사', p: data.provider },
            ] as const
          ).map(({ key, party, role, p }) => (
            <div key={key} className="rounded-md bg-bg-subtle border border-line px-4 py-3">
              <p className="text-caption font-semibold text-fg-tertiary">{role}</p>
              <div className="mt-1 flex items-center gap-3">
                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                  {(
                    [
                      { field: 'name', label: '상호' },
                      { field: 'representative', label: '대표자' },
                    ] as const
                  ).map(({ field, label }) => (
                    <div key={field} className="flex items-center gap-2">
                      <label htmlFor={`f-sign-${party}-${field}`} className="w-11 flex-none text-caption text-fg-tertiary">
                        {label}
                      </label>
                      <input
                        id={`f-sign-${party}-${field}`}
                        className="flex-1 min-w-0 h-8 px-2 rounded-sm border border-line-strong bg-bg-surface text-compact text-fg-primary placeholder:text-fg-tertiary focus:border-line-focus focus:outline-none"
                        placeholder={`${label} 입력`}
                        value={p[field]}
                        onChange={(e) => edit((d) => void (d[party][field] = e.target.value))}
                      />
                    </div>
                  ))}
                </div>
                <StampUpload
                  id={`f-${key}`}
                  label={`${role} 도장 이미지`}
                  value={data.signatures[key]}
                  onChange={(v) => edit((d) => void (d.signatures[key] = v))}
                  onError={onError}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-caption text-fg-tertiary">
          원형 칸을 눌러 도장·서명 이미지를 첨부하면 문서의 (인) 자리에 찍혀 표시됩니다. 배경이 투명한 PNG를 권장합니다.
        </p>
      </Card>

      <p className="text-caption text-fg-tertiary text-center py-2">
        입력 내용은 이 브라우저에만 자동 저장되며 서버로 전송되지 않습니다.
        <br />
        실제 납품·검수 완료 여부는 작성자가 입력한 내용을 기준으로 합니다.
      </p>
    </div>
  );
}

function NoteRow({
  index,
  item,
  onPatch,
  onRemove,
}: {
  index: number;
  item: NoteItem;
  onPatch: (p: Partial<NoteItem>) => void;
  onRemove: () => void;
}) {
  const base = `note-${item.id}`;
  return (
    <div className="rounded-md border border-line p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-caption font-semibold text-fg-tertiary">미완료 작업 {index + 1}</span>
        <button type="button" className="btn-ghost h-7 px-2 text-caption hover:text-danger" onClick={onRemove} aria-label={`미완료 작업 ${index + 1} 삭제`}>
          <Icon name="trash" size={14} /> 삭제
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field id={`${base}-task`} label="작업 내용" className="sm:col-span-2">
          <input id={`${base}-task`} className="input" value={item.task} placeholder="예: 정식 서버 이전" onChange={(e) => onPatch({ task: e.target.value })} />
        </Field>
        <Field id={`${base}-due`} label="완료 예정일">
          <input id={`${base}-due`} type="date" className="input" value={item.dueDate} onChange={(e) => onPatch({ dueDate: e.target.value })} />
        </Field>
        <Field id={`${base}-remark`} label="비고">
          <input id={`${base}-remark`} className="input" value={item.remark} onChange={(e) => onPatch({ remark: e.target.value })} />
        </Field>
      </div>
    </div>
  );
}

function ErrorSummary({ errors }: { errors: ValidationError[] }) {
  const focus = (fieldId: string) => {
    const el = document.getElementById(fieldId);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.focus({ preventScroll: true });
  };
  return (
    <div role="alert" className="rounded-md border border-danger/30 bg-danger-subtle px-4 py-3">
      <p className="text-compact font-semibold text-danger">문서를 만들기 전에 다음 항목을 확인해 주세요 ({errors.length}건)</p>
      <ul className="mt-2 flex flex-col gap-1">
        {errors.map((e) => (
          <li key={e.fieldId} className="text-compact">
            <button type="button" className="text-left text-[#991B1B] hover:underline" onClick={() => focus(e.fieldId)}>
              <span className="font-semibold">[{e.section}]</span> {e.message}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
