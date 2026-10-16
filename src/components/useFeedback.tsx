import { useCallback, useRef, useState } from 'react';
import { ConfirmDialog, Toast, type ConfirmOptions, type ToastState } from './Dialogs';

/** 확인 대화상자 + 알림 토스트 */
export function useFeedback() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [confirmOpts, setConfirmOpts] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  const notify = useCallback((t: Omit<ToastState, 'id'>) => setToast({ ...t, id: Date.now() }), []);
  const askConfirm = useCallback(
    (opts: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        resolver.current = resolve;
        setConfirmOpts(opts);
      }),
    [],
  );
  const closeConfirm = useCallback((ok: boolean) => {
    setConfirmOpts(null);
    resolver.current?.(ok);
    resolver.current = null;
  }, []);
  const closeToast = useCallback(() => setToast(null), []);

  const feedbackUi = (
    <>
      <ConfirmDialog options={confirmOpts} onClose={closeConfirm} />
      <Toast toast={toast} onClose={closeToast} />
    </>
  );
  return { notify, askConfirm, feedbackUi };
}
