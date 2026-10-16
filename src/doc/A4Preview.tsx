import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import type { DocumentData } from '../lib/types';
import { buildUnits, type Unit } from './model';
import { CONTENT_HEIGHT_MM, CONTENT_WIDTH_MM, PAGE, S, renderUnit, type Primitives } from './layout';

/** HTML primitive — PDF 엔진(Yoga/flex)과 동일하게 동작하도록 기본값을 맞춘다 */
const HtmlPrimitives: Primitives = {
  View: ({ style, children }) => (
    <div style={{ display: 'flex', flexDirection: 'column', boxSizing: 'border-box', ...style }}>{children}</div>
  ),
  Text: ({ style, children }) => (
    <div
      style={{
        boxSizing: 'border-box',
        whiteSpace: 'pre-line',
        wordBreak: 'keep-all',
        overflowWrap: 'anywhere',
        minWidth: 0,
        ...style,
      }}
    >
      {children}
    </div>
  ),
};

/** 측정한 unit 높이를 페이지 높이에 맞춰 순서대로 채운다 (unit은 쪼개지 않음) */
function paginate(units: Unit[], heights: Record<string, number>, pageHeight: number): Unit[][] {
  const pages: Unit[][] = [];
  let cur: Unit[] = [];
  let used = 0;
  for (const u of units) {
    const h = heights[u.key] ?? 0;
    if (cur.length && used + h > pageHeight + 0.5) {
      pages.push(cur);
      cur = [];
      used = 0;
    }
    cur.push(u);
    used += h;
  }
  if (cur.length) pages.push(cur);
  return pages;
}

export const PAGE_WIDTH_PX = (PAGE.widthMm * 96) / 25.4;

export type Zoom = number | 'fit';

interface Props {
  data: DocumentData;
  zoom: Zoom;
  /** 맞춤 배율 계산을 위한 미리보기 영역 폭 (px) */
  viewportWidth: number;
  onPageCount?: (n: number) => void;
}

export function A4Preview({ data, zoom, viewportWidth, onPageCount }: Props) {
  const units = useMemo(() => buildUnits(data), [data]);
  const measureRef = useRef<HTMLDivElement>(null);
  const pageHeightRef = useRef<HTMLDivElement>(null);
  const [fontTick, setFontTick] = useState(0);
  const [pages, setPages] = useState<Unit[][]>([units]);

  // 웹폰트 로딩이 끝나면 다시 측정
  useEffect(() => {
    let alive = true;
    document.fonts?.ready.then(() => alive && setFontTick((t) => t + 1));
    return () => {
      alive = false;
    };
  }, []);

  useLayoutEffect(() => {
    const root = measureRef.current;
    const ph = pageHeightRef.current?.getBoundingClientRect().height ?? 0;
    if (!root || !ph) return;
    const heights: Record<string, number> = {};
    root.querySelectorAll<HTMLElement>('[data-unit]').forEach((el) => {
      heights[el.dataset.unit!] = el.getBoundingClientRect().height;
    });
    setPages(paginate(units, heights, ph));
  }, [units, fontTick]);

  useEffect(() => onPageCount?.(pages.length), [pages.length, onPageCount]);

  const scale = zoom === 'fit' ? Math.min(1, Math.max(0.3, (viewportWidth - 32) / PAGE_WIDTH_PX)) : zoom;

  return (
    <>
      {/* 측정용 (화면 밖) — 미리보기 패널이 숨겨져 있어도(모바일 편집 탭) 측정되도록 body에 렌더링 */}
      {createPortal(
      <div aria-hidden className="doc-measure" style={{ ...S.page, width: `${CONTENT_WIDTH_MM}mm` }}>
        <div ref={pageHeightRef} style={{ height: `${CONTENT_HEIGHT_MM}mm`, position: 'absolute', visibility: 'hidden' }} />
        <div ref={measureRef}>
          {units.map((u) => (
            <div key={u.key} data-unit={u.key} style={{ display: 'flow-root' }}>
              {renderUnit(u, HtmlPrimitives)}
            </div>
          ))}
        </div>
      </div>,
        document.body,
      )}

      <div className="doc-pages" style={{ zoom: scale } as CSSProperties}>
        {pages.map((pageUnits, i) => (
          <section
            key={i}
            className="a4-page"
            aria-label={`${i + 1}페이지 / 전체 ${pages.length}페이지`}
            style={{
              ...S.page,
              width: `${PAGE.widthMm}mm`,
              height: `${PAGE.heightMm}mm`,
              padding: `${PAGE.marginMm}mm`,
            }}
          >
            {pageUnits.map((u) => (
              <div key={u.key} style={{ display: 'flow-root' }}>
                {renderUnit(u, HtmlPrimitives)}
              </div>
            ))}
            <div className="a4-footer" style={S.footer as CSSProperties}>
              {i + 1} / {pages.length}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
