import { Document, Font, Page, Text, View, pdf } from '@react-pdf/renderer';
import type { DocumentData } from '../lib/types';
import { buildUnits } from './model';
import { FONT_FAMILY, PAGE, S, renderUnit, type DocStyle, type Primitives } from './layout';

/**
 * PDF 생성 — 한글 폰트(Pretendard)를 임베딩해 텍스트로 출력한다.
 * (화면 캡처 이미지 방식이 아니므로 PDF 내 한글 검색·복사가 가능)
 */

const fontUrl = (file: string) => new URL(`fonts/${file}`, document.baseURI).href;

let registered = false;
function registerFonts() {
  if (registered) return;
  Font.register({
    family: FONT_FAMILY,
    fonts: [
      { src: fontUrl('Pretendard-Regular.woff'), fontWeight: 400 },
      { src: fontUrl('Pretendard-SemiBold.woff'), fontWeight: 600 },
      { src: fontUrl('Pretendard-Bold.woff'), fontWeight: 700 },
    ],
  });
  // 한글은 어절(띄어쓰기) 단위로 줄바꿈 — 미리보기의 word-break: keep-all 과 동일
  Font.registerHyphenationCallback((word) => [word]);
  registered = true;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const PdfPrimitives: Primitives = {
  View: ({ style, children }) => <View style={style as any}>{children}</View>,
  Text: ({ style, children }) => <Text style={style as any}>{children}</Text>,
};

const pageStyle: DocStyle = {
  ...S.page,
  paddingTop: `${PAGE.marginMm}mm`,
  paddingBottom: `${PAGE.marginMm}mm`,
  paddingLeft: `${PAGE.marginMm}mm`,
  paddingRight: `${PAGE.marginMm}mm`,
};

function DeliveryPdf({ data, title }: { data: DocumentData; title: string }) {
  const units = buildUnits(data);
  return (
    <Document title={title} author={data.provider.name} creator="MYD 납품 확인서" producer="MYD 납품 확인서" language="ko">
      <Page size="A4" style={pageStyle as any}>
        {units.map((u) => (
          // 각 unit은 페이지 경계에서 쪼개지지 않는다(제목+첫 문단, 표, 서명란 등)
          <View key={u.key} wrap={false}>
            {renderUnit(u, PdfPrimitives)}
          </View>
        ))}
        <Text
          fixed
          style={{ ...S.footer, position: 'absolute', bottom: '10mm', left: 0, right: 0 } as any}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        />
      </Page>
    </Document>
  );
}

export async function generatePdfBlob(data: DocumentData, title: string): Promise<Blob> {
  registerFonts();
  return pdf(<DeliveryPdf data={data} title={title} />).toBlob();
}
