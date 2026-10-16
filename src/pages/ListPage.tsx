import { useMemo, useState } from 'react';
import type { DocType } from '../lib/types';
import { createBlankDocument, createSampleDocument, DOC_TYPE_META } from '../lib/defaults';
import { clearStoredData, createDoc, deleteDoc, duplicateDoc, listDocs, restoreDoc, type StoredDoc } from '../lib/storage';
import { formatKDate } from '../lib/format';
import { docHref, navigate } from '../lib/router';
import { useFeedback } from '../components/useFeedback';
import { Icon } from '../components/ui';

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  const p = (n: number) => String(n).padStart(2, '0');
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay ? `오늘 ${p(d.getHours())}:${p(d.getMinutes())}` : `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

export function ListPage() {
  const [docs, setDocs] = useState<StoredDoc[]>(() => listDocs());
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<DocType | 'all'>('all');
  const [clientName, setClientName] = useState('');
  const [createError, setCreateError] = useState('');
  const { notify, askConfirm, feedbackUi } = useFeedback();

  const refresh = () => setDocs(listDocs());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return docs.filter((d) => {
      if (typeFilter !== 'all' && d.data.documentType !== typeFilter) return false;
      if (!q) return true;
      return [d.data.client.name, d.data.project.name, d.data.provider.name].some((v) => v.toLowerCase().includes(q));
    });
  }, [docs, query, typeFilter]);

  const create = (sample = false) => {
    const data = sample ? createSampleDocument() : createBlankDocument();
    if (!sample) data.client.name = clientName.trim();
    const entry = createDoc(data);
    if (!entry) {
      setCreateError('브라우저 저장소에 저장할 수 없습니다. 저장 공간 또는 개인정보 보호 설정을 확인해 주세요.');
      return;
    }
    navigate(docHref(entry.id));
  };

  const duplicate = (d: StoredDoc) => {
    const copy = duplicateDoc(d.id);
    if (!copy) return notify({ kind: 'error', message: '문서를 복제하지 못했습니다.' });
    refresh();
    notify({ kind: 'success', message: '문서를 복제했습니다.', action: { label: '열기', run: () => navigate(docHref(copy.id)) } });
  };

  const remove = async (d: StoredDoc) => {
    const name = d.data.client.name || d.data.project.name || '이름 없는 문서';
    const ok = await askConfirm({
      title: '문서 삭제',
      message: `"${name}" 확인서를 삭제할까요?`,
      confirmLabel: '삭제',
      danger: true,
    });
    if (!ok) return;
    deleteDoc(d.id);
    refresh();
    notify({
      kind: 'info',
      message: '문서를 삭제했습니다.',
      action: {
        label: '실행 취소',
        run: () => {
          restoreDoc(d);
          refresh();
        },
      },
    });
  };

  const clearAll = async () => {
    const ok = await askConfirm({
      title: '저장 데이터 전체 삭제',
      message: '이 브라우저에 저장된 모든 납품 확인서를 삭제합니다.\n삭제한 데이터는 복구할 수 없습니다.',
      confirmLabel: '전체 삭제',
      danger: true,
    });
    if (!ok) return;
    clearStoredData();
    refresh();
    notify({ kind: 'info', message: '저장된 데이터를 모두 삭제했습니다.' });
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 bg-bg-default/90 backdrop-blur border-b border-line">
        <div className="flex items-center justify-between gap-3 h-12 px-4 lg:px-6 max-w-[1080px] mx-auto">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-bg-primary flex-none" />
            <span className="text-compact font-semibold text-fg-secondary">납품 확인서 관리</span>
          </div>
          <button type="button" className="btn-primary" onClick={() => create()}>
            <Icon name="plus" /> 새 확인서
          </button>
        </div>
      </header>

      <main className="max-w-[1080px] mx-auto px-4 lg:px-6 pt-8 pb-24">
        <h1 className="text-heading font-bold tracking-[-0.01em]">납품 확인서 목록</h1>
        <p className="mt-2 text-body text-fg-secondary">프로젝트별 납품 확인서를 만들고, 작성한 문서를 다시 열어 수정하거나 PDF로 내려받을 수 있습니다.</p>

        {/* 새 확인서 생성 */}
        <section className="mt-8 bg-bg-surface border border-line rounded-md p-5 sm:p-6" aria-labelledby="create-title">
          <h2 id="create-title" className="text-[15px] font-semibold">
            새 확인서 생성
          </h2>
          <form
            className="mt-4 flex flex-col sm:flex-row gap-2.5"
            onSubmit={(e) => {
              e.preventDefault();
              create();
            }}
          >
            <label htmlFor="new-client" className="sr-only">
              발주사 상호
            </label>
            <input
              id="new-client"
              className="input sm:flex-1"
              placeholder="발주사 상호를 입력하세요 (나중에 입력해도 됩니다)"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
            <button type="submit" className="btn-primary h-control px-5 text-body">
              생성하기
            </button>
          </form>
          <p className="mt-2 text-caption text-fg-tertiary">
            처음이라면{' '}
            <button type="button" className="text-fg-link font-semibold hover:underline" onClick={() => create(true)}>
              샘플 문서로 시작
            </button>
            해 보세요.
          </p>
          {createError && (
            <p role="alert" className="mt-2 text-caption text-danger">
              {createError}
            </p>
          )}
        </section>

        {/* 목록 */}
        <section className="mt-6 bg-bg-surface border border-line rounded-md" aria-labelledby="list-title">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 sm:px-6 pt-5 pb-4">
            <h2 id="list-title" className="text-[15px] font-semibold">
              생성된 확인서 <span className="text-fg-tertiary font-normal">{docs.length}</span>
            </h2>
            <div className="flex gap-2">
              <label htmlFor="list-type" className="sr-only">
                문서 유형
              </label>
              <select
                id="list-type"
                className="input h-control-sm w-auto pr-8 text-compact"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as DocType | 'all')}
              >
                <option value="all">전체 유형</option>
                <option value="final">{DOC_TYPE_META.final.short}</option>
                <option value="review">{DOC_TYPE_META.review.short}</option>
              </select>
              <label htmlFor="list-search" className="sr-only">
                발주사 또는 프로젝트명 검색
              </label>
              <input
                id="list-search"
                type="search"
                className="input h-control-sm text-compact sm:w-56"
                placeholder="발주사·프로젝트명 검색"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="px-6 py-14 text-center border-t border-bg-subtle">
              <p className="text-body text-fg-secondary">
                {docs.length === 0 ? '아직 생성된 확인서가 없습니다.' : '검색 조건에 맞는 확인서가 없습니다.'}
              </p>
              {docs.length === 0 && (
                <div className="mt-4 flex justify-center gap-2">
                  <button type="button" className="btn-primary" onClick={() => create()}>
                    새 확인서 만들기
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => create(true)}>
                    샘플 문서로 시작
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* 데스크톱: 표 */}
              <table className="hidden md:table w-full text-compact">
                <thead>
                  <tr className="border-t border-bg-subtle text-left text-caption text-fg-tertiary">
                    <th className="font-semibold py-2.5 pl-6 pr-2">발주사 / 프로젝트</th>
                    <th className="font-semibold py-2.5 px-2 w-[110px]">유형</th>
                    <th className="font-semibold py-2.5 px-2 w-[140px]">납품일</th>
                    <th className="font-semibold py-2.5 px-2 w-[110px]">최종 수정</th>
                    <th className="py-2.5 pl-2 pr-6 w-[200px]">
                      <span className="sr-only">작업</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d) => (
                    <tr key={d.id} className="border-t border-bg-subtle hover:bg-bg-default">
                      <td className="py-3 pl-6 pr-2">
                        <a href={docHref(d.id)} className="block min-w-0 group">
                          <span className="flex items-center gap-1.5">
                            <span className="font-semibold text-fg-primary group-hover:text-fg-link truncate">
                              {d.data.client.name || <span className="text-fg-tertiary font-normal">발주사 미입력</span>}
                            </span>
                            {d.data.meta.isSample && <SampleBadge />}
                          </span>
                          <span className="block text-fg-tertiary truncate">{d.data.project.name || '프로젝트명 미입력'}</span>
                        </a>
                      </td>
                      <td className="py-3 px-2">
                        <TypeBadge type={d.data.documentType} />
                      </td>
                      <td className="py-3 px-2 text-fg-secondary tabular-nums">{formatKDate(d.data.project.deliveryDate) || '-'}</td>
                      <td className="py-3 px-2 text-fg-secondary tabular-nums">{fmtDateTime(d.updatedAt)}</td>
                      <td className="py-3 pl-2 pr-6">
                        <RowActions doc={d} onDuplicate={() => duplicate(d)} onDelete={() => remove(d)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* 모바일: 카드 목록 */}
              <ul className="md:hidden border-t border-bg-subtle divide-y divide-bg-subtle">
                {filtered.map((d) => (
                  <li key={d.id} className="px-5 py-4">
                    <a href={docHref(d.id)} className="block">
                      <span className="flex items-center gap-1.5 flex-wrap">
                        <TypeBadge type={d.data.documentType} />
                        {d.data.meta.isSample && <SampleBadge />}
                      </span>
                      <span className="mt-1.5 block text-body font-semibold text-fg-primary">
                        {d.data.client.name || <span className="text-fg-tertiary font-normal">발주사 미입력</span>}
                      </span>
                      <span className="block text-compact text-fg-tertiary">{d.data.project.name || '프로젝트명 미입력'}</span>
                      <span className="mt-1 block text-caption text-fg-tertiary">
                        납품일 {formatKDate(d.data.project.deliveryDate) || '-'} · 수정 {fmtDateTime(d.updatedAt)}
                      </span>
                    </a>
                    <div className="mt-3">
                      <RowActions doc={d} onDuplicate={() => duplicate(d)} onDelete={() => remove(d)} />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-caption text-fg-tertiary">
          <p>작성한 확인서는 이 브라우저에만 저장되며 서버로 전송되지 않습니다. 다른 기기·브라우저에서는 보이지 않습니다.</p>
          {docs.length > 0 && (
            <button type="button" className="btn-ghost h-7 px-2 text-caption text-fg-tertiary hover:text-danger self-start sm:self-auto" onClick={clearAll}>
              저장 데이터 전체 삭제
            </button>
          )}
        </div>
      </main>
      {feedbackUi}
    </div>
  );
}

function TypeBadge({ type }: { type: DocType }) {
  return type === 'final' ? (
    <span className="pill">{DOC_TYPE_META.final.short}</span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-bg-subtle text-fg-secondary text-caption font-semibold px-2.5 py-[3px]">
      {DOC_TYPE_META.review.short}
    </span>
  );
}

function SampleBadge() {
  return <span className="inline-flex items-center rounded-full bg-warn-subtle text-warn border border-warn-line text-[11px] font-semibold px-2 py-px">샘플</span>;
}

function RowActions({ doc, onDuplicate, onDelete }: { doc: StoredDoc; onDuplicate: () => void; onDelete: () => void }) {
  const name = doc.data.client.name || doc.data.project.name || '문서';
  return (
    <div className="flex items-center md:justify-end gap-1">
      <a href={docHref(doc.id)} className="btn-secondary text-fg-link">
        열람 / 편집
      </a>
      <button type="button" className="btn-ghost" onClick={onDuplicate} aria-label={`${name} 복제`}>
        복제
      </button>
      <button type="button" className="btn-ghost hover:text-danger" onClick={onDelete} aria-label={`${name} 삭제`}>
        <Icon name="trash" size={14} />
        <span className="md:sr-only">삭제</span>
      </button>
    </div>
  );
}
