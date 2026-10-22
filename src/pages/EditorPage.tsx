import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DocumentData } from '../lib/types';
import { createBlankDocument, createSampleDocument, DOC_TYPE_META } from '../lib/defaults';
import { createDoc, deleteDoc, getDoc, saveDoc, type StoredDoc } from '../lib/storage';
import { buildFileName } from '../lib/format';
import { validate } from '../lib/validation';
import { docHref, listHref, navigate } from '../lib/router';
import { Editor, type Edit } from '../components/Editor';
import { A4Preview, type Zoom } from '../doc/A4Preview';
import { useFeedback } from '../components/useFeedback';
import { Icon } from '../components/ui';

type Tab = 'edit' | 'preview';

const ZOOM_STEPS = [0.5, 0.67, 0.75, 0.9, 1, 1.1, 1.25, 1.5];

export function EditorPage({ docId }: { docId: string }) {
  const entry = useMemo(() => getDoc(docId), [docId]);
  if (!entry) return <NotFound />;
  return <EditorScreen key={entry.id} entry={entry} />;
}

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-title font-semibold">문서를 찾을 수 없습니다</p>
      <p className="text-body text-fg-secondary">삭제되었거나 다른 브라우저에서 작성한 문서일 수 있습니다.</p>
      <a href={listHref} className="btn-primary h-control px-5 text-body">
        목록으로 이동
      </a>
    </div>
  );
}

function EditorScreen({ entry }: { entry: StoredDoc }) {
  const docId = entry.id;
  const [data, setData] = useState<DocumentData>(entry.data);
  const [savedAt, setSavedAt] = useState<string | null>(entry.updatedAt);
  /** 사용자가 수정했을 때만 저장한다 (열어보기만 해도 수정 시각이 바뀌지 않도록) */
  const [dirty, setDirty] = useState(false);
  const [tab, setTab] = useState<Tab>('edit');
  const [zoom, setZoom] = useState<Zoom>('fit');
  const [pageCount, setPageCount] = useState(1);
  const [showErrors, setShowErrors] = useState(false);
  const [focusErrorTick, setFocusErrorTick] = useState(0);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { notify, askConfirm, feedbackUi } = useFeedback();
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewWidth, setPreviewWidth] = useState(800);
  const busyRef = useRef(false);

  const errors = useMemo(() => validate(data), [data]);
  const fileName = buildFileName(data.documentType, data.client.name, data.documentDate);

  const edit: Edit = useCallback((mutate) => {
    setData((prev) => {
      const next = structuredClone(prev);
      mutate(next);
      return next;
    });
    setDirty(true);
  }, []);

  const replaceData = (next: DocumentData) => {
    setData(next);
    setDirty(true);
    setShowErrors(false);
  };

  // 자동 저장 (로컬 저장소) — 화면을 벗어날 때 대기 중인 저장도 반영
  const latest = useRef({ data, dirty });
  latest.current = { data, dirty };
  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(() => {
      const at = saveDoc(docId, data);
      if (at) setSavedAt(at);
      else notify({ kind: 'error', message: '자동 저장에 실패했습니다. 브라우저 저장 공간을 확인해 주세요.' });
    }, 300);
    return () => clearTimeout(t);
  }, [data, dirty, docId, notify]);
  useEffect(
    () => () => {
      if (latest.current.dirty && getDoc(docId)) saveDoc(docId, latest.current.data);
    },
    [docId],
  );

  // 미리보기 영역 폭 추적 (맞춤 배율)
  useEffect(() => {
    const el = previewRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => el.clientWidth && setPreviewWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 필수 입력 누락 시 첫 오류 항목으로 이동
  useEffect(() => {
    if (!focusErrorTick || !errors.length) return;
    const el = document.getElementById(errors[0].fieldId);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusErrorTick]);

  const ensureValid = (): boolean => {
    if (!errors.length) return true;
    setShowErrors(true);
    setTab('edit');
    setFocusErrorTick((t) => t + 1);
    notify({ kind: 'error', message: `필수 입력 항목 ${errors.length}건을 확인해 주세요.` });
    return false;
  };

  const downloadPdf = async () => {
    if (busyRef.current) return; // 중복 다운로드 방지
    if (!ensureValid()) return;
    busyRef.current = true;
    setPdfBusy(true);
    try {
      const { generatePdfBlob } = await import('../doc/PdfDocument');
      const blob = await generatePdfBlob(data, data.title[data.documentType] || DOC_TYPE_META[data.documentType].label);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
      notify({ kind: 'success', message: `${fileName} 다운로드를 시작했습니다.` });
    } catch (e) {
      console.error(e);
      notify({ kind: 'error', message: 'PDF 생성에 실패했습니다. 네트워크 상태를 확인한 뒤 다시 시도해 주세요.', action: { label: '다시 시도', run: () => void downloadPdf() } });
    } finally {
      busyRef.current = false;
      setPdfBusy(false);
    }
  };

  const print = () => {
    setMenuOpen(false);
    if (!ensureValid()) return;
    const prevTitle = document.title;
    document.title = fileName.replace(/\.pdf$/, '');
    const restore = () => {
      document.title = prevTitle;
      window.removeEventListener('afterprint', restore);
    };
    window.addEventListener('afterprint', restore);
    window.print();
  };

  const newDocument = () => {
    setMenuOpen(false);
    const created = createDoc(createBlankDocument());
    if (!created) return notify({ kind: 'error', message: '새 문서를 만들지 못했습니다. 브라우저 저장 공간을 확인해 주세요.' });
    navigate(docHref(created.id));
  };

  const loadDefaults = async () => {
    setMenuOpen(false);
    const ok = await askConfirm({
      title: '기본값 불러오기',
      message: '이 문서의 내용을 예시 데이터(샘플 문서)로 바꿀까요?',
      confirmLabel: '불러오기',
    });
    if (ok) replaceData(createSampleDocument());
  };

  const resetDocument = async () => {
    setMenuOpen(false);
    const ok = await askConfirm({
      title: '입력 내용 초기화',
      message: '이 문서에 입력한 내용을 모두 지우고 빈 문서로 되돌립니다.\n기본 문구와 기본 납품 항목은 유지됩니다.',
      confirmLabel: '초기화',
      danger: true,
    });
    if (!ok) return;
    replaceData(createBlankDocument());
    setTab('edit');
  };

  const removeDocument = async () => {
    setMenuOpen(false);
    const ok = await askConfirm({
      title: '문서 삭제',
      message: '이 확인서를 목록에서 삭제할까요?\n삭제한 문서는 복구할 수 없습니다.',
      confirmLabel: '삭제',
      danger: true,
    });
    if (!ok) return;
    latest.current.dirty = false;
    deleteDoc(docId);
    navigate(listHref);
  };

  const scale = zoom === 'fit' ? null : zoom;
  const zoomBy = (dir: 1 | -1) => {
    const current = scale ?? Math.min(1, (previewWidth - 32) / 793.7);
    const next = dir > 0 ? ZOOM_STEPS.find((z) => z > current + 0.001) : [...ZOOM_STEPS].reverse().find((z) => z < current - 0.001);
    if (next) setZoom(next);
  };
  const zoomLabel = `${Math.round((scale ?? Math.min(1, Math.max(0.3, (previewWidth - 32) / 793.7))) * 100)}%`;

  const saveLabel = savedAt
    ? `자동 저장됨 ${new Date(savedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`
    : '';
  const docLabel = data.client.name.trim() || data.project.name.trim() || '새 확인서';

  return (
    <div className="min-h-screen lg:h-[100dvh] lg:flex lg:flex-col">
      {/* 상단 작업 영역 */}
      <header className="no-print sticky top-0 z-30 flex-none bg-bg-default/90 backdrop-blur border-b border-line">
        <div className="flex items-center justify-between gap-3 h-12 px-4 lg:px-6">
          <div className="flex items-center gap-2 min-w-0">
            <a href={listHref} className="flex-none text-compact text-fg-link hover:underline whitespace-nowrap">
              ← 목록
            </a>
            <span className="w-px h-4 bg-line flex-none" aria-hidden />
            <h1 className="text-compact font-semibold text-fg-primary truncate">{docLabel}</h1>
            <span className="pill hidden sm:inline-flex flex-none">{DOC_TYPE_META[data.documentType].short}</span>
            {saveLabel && (
              <span className="hidden xl:inline text-caption text-fg-tertiary whitespace-nowrap" aria-live="polite">
                · {saveLabel}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <div className="hidden md:flex items-center gap-1">
              <button type="button" className="btn-ghost" onClick={newDocument}>
                새 문서
              </button>
              <button type="button" className="btn-ghost" onClick={loadDefaults}>
                기본값 불러오기
              </button>
              <button type="button" className="btn-ghost hover:text-danger" onClick={resetDocument}>
                초기화
              </button>
              <button type="button" className="btn-ghost hover:text-danger" onClick={removeDocument}>
                삭제
              </button>
              <span className="w-px h-5 bg-line mx-1" aria-hidden />
              <button type="button" className="btn-secondary" onClick={print}>
                <Icon name="print" /> 인쇄
              </button>
            </div>
            <button type="button" className="btn-primary" onClick={downloadPdf} disabled={pdfBusy} aria-busy={pdfBusy}>
              {pdfBusy ? <Spinner /> : <Icon name="download" />}
              {pdfBusy ? 'PDF 생성 중…' : 'PDF 다운로드'}
            </button>
            <div className="relative md:hidden">
              <button
                type="button"
                className="btn-secondary w-8 px-0"
                aria-label="더보기"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((o) => !o)}
              >
                <Icon name="more" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0" onClick={() => setMenuOpen(false)} />
                  <div role="menu" className="absolute right-0 top-10 w-48 bg-bg-surface border border-line rounded-md shadow-lg py-1">
                    {[
                      { label: '새 문서 작성', run: newDocument },
                      { label: '기본값 불러오기', run: loadDefaults },
                      { label: '인쇄하기', run: print },
                      { label: '입력 내용 초기화', run: resetDocument, danger: true },
                      { label: '문서 삭제', run: removeDocument, danger: true },
                    ].map((m) => (
                      <button
                        key={m.label}
                        role="menuitem"
                        type="button"
                        className={`block w-full text-left px-4 py-2.5 text-compact hover:bg-bg-subtle ${m.danger ? 'text-danger' : 'text-fg-primary'}`}
                        onClick={m.run}
                      >
                        {m.label}
                      </button>
                    ))}
                    {saveLabel && <p className="px-4 pt-2 pb-1.5 mt-1 border-t border-line text-caption text-fg-tertiary">{saveLabel}</p>}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 모바일/태블릿: 편집 ↔ 미리보기 탭 */}
        <div role="tablist" aria-label="화면 전환" className="lg:hidden grid grid-cols-2 px-4 gap-1 pb-2">
          {(
            [
              { id: 'edit', label: '편집' },
              { id: 'preview', label: `미리보기 · ${pageCount}쪽` },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              role="tab"
              type="button"
              id={`tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              onClick={() => {
                setTab(t.id);
                window.scrollTo({ top: 0 });
              }}
              className={`h-9 rounded-sm text-compact font-semibold transition-colors ${
                tab === t.id ? 'bg-bg-surface border border-line text-fg-primary shadow-sm' : 'text-fg-tertiary hover:bg-bg-subtle'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="lg:flex-1 lg:min-h-0 lg:grid lg:grid-cols-[minmax(400px,44%)_1fr] xl:grid-cols-[minmax(440px,40%)_1fr]">
        {/* 좌측: 편집 패널 */}
        <div
          id="panel-edit"
          role="tabpanel"
          aria-labelledby="tab-edit"
          className={`no-print lg:block lg:overflow-y-auto lg:border-r lg:border-line ${tab === 'edit' ? 'block' : 'hidden'}`}
        >
          <div className="max-w-[760px] mx-auto px-4 py-5 lg:px-6 lg:py-6">
            <Editor
              data={data}
              edit={edit}
              errors={errors}
              showErrors={showErrors}
              onDismissSample={() => edit((d) => void (d.meta.isSample = false))}
              onStartBlank={resetDocument}
              onError={(message) => notify({ kind: 'error', message })}
              confirm={askConfirm}
            />
          </div>
        </div>

        {/* 우측: A4 미리보기 */}
        <div
          id="panel-preview"
          role="tabpanel"
          aria-labelledby="tab-preview"
          className={`print-root lg:flex lg:flex-col lg:min-h-0 bg-[#E9EEF4] ${tab === 'preview' ? 'flex flex-col' : 'hidden'}`}
        >
          <div className="no-print sticky top-[92px] lg:top-0 z-20 flex items-center justify-between gap-2 px-4 h-11 bg-[#E9EEF4]/95 backdrop-blur border-b border-line">
            <p className="text-caption text-fg-secondary">
              <span className="font-semibold text-fg-primary">A4 미리보기</span> · {pageCount}페이지
            </p>
            <div className="flex items-center gap-1" role="group" aria-label="확대 및 축소">
              <button type="button" className="btn-secondary w-8 px-0" onClick={() => zoomBy(-1)} aria-label="축소">
                −
              </button>
              <span className="w-12 text-center text-caption tabular-nums text-fg-secondary" aria-live="polite">
                {zoomLabel}
              </span>
              <button type="button" className="btn-secondary w-8 px-0" onClick={() => zoomBy(1)} aria-label="확대">
                +
              </button>
              <button
                type="button"
                className={`btn-secondary ${zoom === 'fit' ? 'text-bg-primary-hover border-line-primary' : ''}`}
                onClick={() => setZoom('fit')}
                aria-pressed={zoom === 'fit'}
              >
                맞춤
              </button>
            </div>
          </div>
          <div ref={previewRef} className="print-root lg:flex-1 lg:overflow-auto py-6 px-4">
            <A4Preview data={data} zoom={zoom} viewportWidth={previewWidth} onPageCount={setPageCount} />
          </div>
        </div>
      </main>

      {feedbackUi}
    </div>
  );
}

function Spinner() {
  return <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" aria-hidden />;
}
