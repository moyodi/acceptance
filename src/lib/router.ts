import { useEffect, useState } from 'react';

/** 해시 기반 라우팅 — 정적 호스팅에서 새로고침해도 경로가 유지된다. */
export type Route = { name: 'list' } | { name: 'doc'; id: string } | { name: 'preset'; key: string };

function parse(hash: string): Route {
  const m = /^#\/doc\/([^/?#]+)/.exec(hash);
  if (m) return { name: 'doc', id: decodeURIComponent(m[1]) };
  const p = /^#\/new\/([^/?#]+)/.exec(hash);
  if (p) return { name: 'preset', key: decodeURIComponent(p[1]) };
  return { name: 'list' };
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parse(location.hash));
  useEffect(() => {
    const on = () => setRoute(parse(location.hash));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export const listHref = '#/';
export const docHref = (id: string) => `#/doc/${encodeURIComponent(id)}`;

export function navigate(href: string) {
  if (location.hash !== href) location.hash = href;
  window.scrollTo({ top: 0 });
}
