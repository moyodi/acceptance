import { useEffect, useRef } from 'react';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
}

export function ConfirmDialog({
  options,
  onClose,
}: {
  options: ConfirmOptions | null;
  onClose: (ok: boolean) => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!options) return;
    const prev = document.activeElement as HTMLElement | null;
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose(false);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [options, onClose]);

  if (!options) return null;
  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40" onClick={() => onClose(false)}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dlg-title"
        aria-describedby="dlg-msg"
        className="w-full max-w-sm bg-bg-surface rounded-lg shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="dlg-title" className="text-title font-semibold">
          {options.title}
        </h2>
        <p id="dlg-msg" className="mt-2 text-body text-fg-secondary whitespace-pre-line">
          {options.message}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn-secondary h-control px-4" onClick={() => onClose(false)}>
            취소
          </button>
          <button
            ref={confirmRef}
            type="button"
            className={`btn h-control px-4 text-fg-inverse ${options.danger ? 'bg-danger hover:bg-red-700' : 'bg-bg-primary hover:bg-bg-primary-hover'}`}
            onClick={() => onClose(true)}
          >
            {options.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export interface ToastState {
  id: number;
  kind: 'info' | 'error' | 'success';
  message: string;
  action?: { label: string; run: () => void };
}

export function Toast({ toast, onClose }: { toast: ToastState | null; onClose: () => void }) {
  useEffect(() => {
    if (!toast || toast.kind === 'error') return;
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, [toast, onClose]);
  return (
    <div className="no-print fixed bottom-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none" aria-live="polite">
      {toast && (
        <div
          role={toast.kind === 'error' ? 'alert' : 'status'}
          className={`pointer-events-auto flex items-center gap-3 rounded-md px-4 py-2.5 shadow-lg text-compact text-white max-w-md ${
            toast.kind === 'error' ? 'bg-danger' : 'bg-fg-primary'
          }`}
        >
          <span className="flex-1">{toast.message}</span>
          {toast.action && (
            <button
              type="button"
              className="font-semibold underline underline-offset-2"
              onClick={() => {
                onClose();
                toast.action!.run();
              }}
            >
              {toast.action.label}
            </button>
          )}
          <button type="button" aria-label="알림 닫기" className="opacity-70 hover:opacity-100" onClick={onClose}>
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
