import { useRef, useState } from 'react';
import { fileToStampDataUrl } from '../lib/image';

/** MYD contract의 도장 첨부 칸과 같은 원형 업로드 박스 */
export function StampUpload({
  id,
  label,
  value,
  onChange,
  onError,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (dataUrl: string) => void;
  onError: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      onChange(await fileToStampDataUrl(file));
    } catch (e) {
      onError(e instanceof Error ? e.message : '이미지를 첨부하지 못했습니다.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="relative flex-none">
      <label
        htmlFor={id}
        title={value ? '이미지 변경' : '도장 이미지 첨부'}
        className={`group relative w-14 h-14 rounded-full flex items-center justify-center overflow-hidden bg-bg-surface cursor-pointer transition-colors border ${
          value ? 'border-line-strong' : 'border-dashed border-line-strong hover:border-line-primary'
        } focus-within:ring-2 focus-within:ring-line-focus`}
      >
        {value ? (
          <img src={value} alt={`${label} 미리보기`} className="absolute inset-0 w-full h-full object-contain p-1" />
        ) : (
          <span className="text-caption text-fg-tertiary group-hover:text-fg-link">{busy ? '…' : '도장'}</span>
        )}
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="sr-only"
          aria-label={value ? `${label} 변경` : `${label} 첨부`}
          onChange={(e) => pick(e.target.files?.[0])}
        />
      </label>
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label={`${label} 삭제`}
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full border border-line-strong bg-bg-surface text-fg-tertiary text-[10px] leading-none flex items-center justify-center hover:border-line-primary hover:text-fg-link"
        >
          ✕
        </button>
      )}
    </div>
  );
}
