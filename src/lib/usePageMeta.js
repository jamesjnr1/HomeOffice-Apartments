import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PAGE_META, SITE_URL, isPrivatePath } from './seo.mjs';

function setMeta(selector, attr, key, value) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement(attr === 'link' ? 'link' : 'meta');
    if (attr === 'link') el.setAttribute('rel', key);
    else el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute(attr === 'link' ? 'href' : 'content', value);
}

// Keeps the title, description, canonical URL and social-preview tags
// in step with the current route, and marks private pages (admin,
// guest dashboard, sign-in) noindex.
export function usePageMeta() {
  const { pathname } = useLocation();

  useEffect(() => {
    const path = pathname.replace(/\/+$/, '') || '/';
    const meta = PAGE_META[path];
    const robots = isPrivatePath(path) || !meta ? 'noindex, nofollow' : 'index, follow';
    setMeta('meta[name="robots"]', 'name', 'robots', robots);
    if (!meta) return;

    const url = `${SITE_URL}${path === '/' ? '/' : path}`;
    document.title = meta.title;
    setMeta('meta[name="description"]', 'name', 'description', meta.description);
    setMeta('link[rel="canonical"]', 'link', 'canonical', url);
    setMeta('meta[property="og:title"]', 'property', 'og:title', meta.title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', meta.description);
    setMeta('meta[property="og:url"]', 'property', 'og:url', url);
  }, [pathname]);
}
