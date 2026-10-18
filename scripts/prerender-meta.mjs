// After `vite build`: write dist/<page>/index.html for each public page,
// with that page's title, description, canonical URL and link-preview
// tags already in the HTML (from src/lib/seo.js), plus dist/sitemap.xml.
// Vercel serves these files before falling back to the SPA rewrite, so
// Google sees the right details for every page without running React.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { PAGE_META, SITE_URL } from '../src/lib/seo.mjs';

const dist = new URL('../dist/', import.meta.url).pathname;
const template = readFileSync(join(dist, 'index.html'), 'utf8');

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const swap = (html, re, value) => {
  if (!re.test(html)) throw new Error(`prerender-meta: tag not found: ${re}`);
  return html.replace(re, value);
};

for (const [path, meta] of Object.entries(PAGE_META)) {
  const url = `${SITE_URL}${path}`;
  let html = template;
  html = swap(html, /<title>[^<]*<\/title>/, `<title>${esc(meta.title)}</title>`);
  html = swap(html, /<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${esc(meta.description)}" />`);
  html = swap(html, /<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${url}" />`);
  html = swap(html, /<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${esc(meta.title)}" />`);
  html = swap(html, /<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${esc(meta.description)}" />`);
  html = swap(html, /<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${url}" />`);

  if (path === '/') {
    writeFileSync(join(dist, 'index.html'), html);
  } else {
    mkdirSync(join(dist, path), { recursive: true });
    writeFileSync(join(dist, path, 'index.html'), html);
  }
}

const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Object.keys(PAGE_META).map((p) => `  <url><loc>${SITE_URL}${p}</loc><lastmod>${today}</lastmod><changefreq>${p === '/' || p === '/book' ? 'weekly' : 'monthly'}</changefreq><priority>${p === '/' ? '1.0' : '0.8'}</priority></url>`).join('\n')}
</urlset>
`;
writeFileSync(join(dist, 'sitemap.xml'), sitemap);
console.log(`prerender-meta: wrote ${Object.keys(PAGE_META).length} pages + sitemap.xml`);
