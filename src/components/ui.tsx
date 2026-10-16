import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode, type TextareaHTMLAttributes } from 'react';

export function Card({
  id,
  num,
  title,
  description,
  aside,
  children,
}: {
  id: string;
  num: string;
  title: string;
  description?: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const bodyId = `${id}-body`;
  return (
    <section id={id} className="bg-bg-surface border border-line rounded-md scroll-mt-4" aria-labelledby={`${id}-title`}>
      <div className="flex items-center gap-3 px-5 py-4">
        <span className="pill flex-none">{num}</span>
        <h2 id={`${id}-title`} className="flex-1 min-w-0 text-title font-semibold">
          <button
            type="button"
            className="w-full text-left"
            aria-expanded={open}
            aria-controls={bodyId}
            onClick={() => setOpen((o) => !o)}
          >
            {title}
          </button>
        </h2>
        {aside}
        <button
          type="button"
          className="flex-none w-7 h-7 inline-flex items-center justify-center rounded-sm text-fg-tertiary hover:bg-bg-subtle"
          aria-label={open ? `${title} 접기` : `${title} 펼치기`}
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => setOpen((o) => !o)}
        >
          <Chevron up={open} />
        </button>
      </div>
      <div id={bodyId} hidden={!open} className="px-5 pb-5 -mt-1">
        {description && <p className="text-compact text-fg-tertiary mb-4">{description}</p>}
        {children}
      </div>
    </section>
  );
}

function Chevron({ up }: { up: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden className={up ? 'rotate-180 transition-transform' : 'transition-transform'}>
      <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Field({
  id,
  label,
  required,
  hint,
  error,
  children,
  className = '',
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="flex items-center gap-1 text-compact font-semibold text-fg-secondary mb-1.5">
        {label}
        {required ? (
          <span className="text-danger" aria-hidden>
            *
          </span>
        ) : (
          <span className="text-caption font-normal text-fg-tertiary">(선택)</span>
        )}
        {required && <span className="sr-only">(필수)</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-caption text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-caption text-fg-tertiary">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** 내용 길이에 맞춰 높이가 늘어나는 textarea */
export function AutoTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [props.value]);
  // 패널이 다시 보일 때(탭 전환/펼치기) 높이 재계산
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    let w = el.offsetWidth;
    const ro = new ResizeObserver(() => {
      if (el.offsetWidth !== w) {
        w = el.offsetWidth;
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight + 2}px`;
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return <textarea ref={ref} rows={3} {...props} className={`input ${props.className ?? ''}`} />;
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4 rounded-md bg-bg-subtle border border-line px-4 py-3">
      <div className="min-w-0">
        <label htmlFor={id} className="text-compact font-semibold text-fg-primary cursor-pointer">
          {label}
        </label>
        {description && <p className="text-caption text-fg-tertiary mt-0.5">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative flex-none mt-0.5 w-10 h-6 rounded-full transition-colors ${
          checked ? 'bg-bg-primary' : 'bg-line-strong'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-4' : ''
          }`}
        />
        <span className="sr-only">{checked ? '사용' : '미사용'}</span>
      </button>
    </div>
  );
}

/** 기본 문구로 되돌리기 버튼 (수정된 경우에만 표시) */
export function ResetTextButton({ modified, onReset }: { modified: boolean; onReset: () => void }) {
  if (!modified) return null;
  return (
    <button type="button" className="text-caption font-semibold text-fg-link hover:underline" onClick={onReset}>
      기본 문구로 되돌리기
    </button>
  );
}

export function Icon({ name, size = 16 }: { name: 'plus' | 'trash' | 'grip' | 'download' | 'print' | 'more' | 'up' | 'down'; size?: number }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const paths: Record<string, ReactNode> = {
    plus: <path d="M8 3v10M3 8h10" {...common} />,
    trash: <path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5" {...common} />,
    grip: (
      <g fill="currentColor">
        {[4, 8, 12].map((y) => (
          <g key={y}>
            <circle cx="6" cy={y} r="1.1" />
            <circle cx="10" cy={y} r="1.1" />
          </g>
        ))}
      </g>
    ),
    download: <path d="M8 2.5v8M4.5 7L8 10.5 11.5 7M3 13.5h10" {...common} />,
    print: <path d="M4.5 6V2.5h7V6M4.5 11.5H3V6h10v5.5h-1.5M4.5 9.5h7v4h-7z" {...common} />,
    more: (
      <g fill="currentColor">
        <circle cx="3.5" cy="8" r="1.3" />
        <circle cx="8" cy="8" r="1.3" />
        <circle cx="12.5" cy="8" r="1.3" />
      </g>
    ),
    up: <path d="M4 10l4-4 4 4" {...common} />,
    down: <path d="M4 6l4 4 4-4" {...common} />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden>
      {paths[name]}
    </svg>
  );
}
