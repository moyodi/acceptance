import { useEffect } from 'react';
import { useRoute, docHref, listHref } from './lib/router';
import { ListPage } from './pages/ListPage';
import { EditorPage } from './pages/EditorPage';
import { PRESETS } from './lib/presets';
import { createDoc } from './lib/storage';

/** `#/new/<key>` — 미리 채운 확인서를 새 문서로 만들고 편집 화면으로 바꿔 연다(뒤로가기·새로고침 시 중복 생성 방지). */
let presetHandled = '';

function PresetRoute({ presetKey }: { presetKey: string }) {
  useEffect(() => {
    // 개발 모드 StrictMode의 effect 2회 실행으로 문서가 두 번 생기지 않게 한다
    if (presetHandled === location.hash) return;
    presetHandled = location.hash;
    const make = PRESETS[presetKey];
    const entry = make ? createDoc(make()) : null;
    location.replace(entry ? docHref(entry.id) : listHref);
  }, [presetKey]);
  return null;
}

export default function App() {
  const route = useRoute();
  if (route.name === 'preset') return <PresetRoute presetKey={route.key} />;
  return route.name === 'doc' ? <EditorPage docId={route.id} /> : <ListPage />;
}
