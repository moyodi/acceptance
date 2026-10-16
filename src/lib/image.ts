/**
 * 도장/서명 이미지 처리 — 브라우저 저장소 용량을 고려해 축소한 뒤 data URL로 보관한다.
 * PDF 엔진이 PNG·JPEG만 지원하므로 그 외 형식은 PNG로 변환한다.
 */
const MAX_INPUT_BYTES = 10 * 1024 * 1024;
const MAX_SIDE = 360;

export async function fileToStampDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('이미지 파일만 첨부할 수 있습니다.');
  if (file.size > MAX_INPUT_BYTES) throw new Error('10MB 이하의 이미지를 첨부해 주세요.');

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('이미지를 읽을 수 없습니다. 다른 파일을 선택해 주세요.'));
      el.src = url;
    });
    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('이미지를 처리할 수 없습니다.');
    ctx.drawImage(img, 0, 0, w, h);
    // JPEG는 용량이 작은 JPEG로, 나머지(PNG·WebP·GIF 등)는 투명도를 살려 PNG로 저장
    return file.type === 'image/jpeg' ? canvas.toDataURL('image/jpeg', 0.92) : canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(url);
  }
}
