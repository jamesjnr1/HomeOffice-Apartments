// What Google (and link previews) show for each page. One list, used
// twice: in the browser on every route change (usePageMeta below), and
// at build time by scripts/prerender-meta.mjs, which writes a copy of
// index.html per public page with these tags already in the HTML — so
// a crawler sees the right title/description without running React.

import { AIRBNB_REVIEWS } from '../data/airbnbReviews.mjs';

export const SITE_URL = 'https://apartments.home-officegroup.com';
export const SITE_NAME = 'Home-Office Apartments';
export const DEFAULT_IMAGE = `${SITE_URL}/images/hero-property.jpg`;

export const PAGE_META = {
  '/': {
    title: 'Home-Office Apartments — Furnished Apartments in Fiapre, Sunyani',
    description:
      'Self-contained, fully furnished apartments at LivingSpring Gardens in Fiapre, Sunyani, Ghana — fast Wi-Fi, a modern kitchen and quiet gardens. From GHS 388 a night. Book direct.',
  },
  '/apartments': {
    title: 'The Apartments — Home-Office Apartments, Sunyani',
    description:
      'Two self-contained apartments in Fiapre, Sunyani: a furnished hall with TV, a modern kitchen and comfortable bedrooms. See what each one offers.',
  },
  '/gallery': {
    title: 'Photo Gallery — Home-Office Apartments, Sunyani',
    description:
      'Photos of Home-Office Apartments and LivingSpring Gardens in Fiapre, Sunyani — the lounge, bedrooms, kitchen, bathrooms and grounds.',
  },
  '/about': {
    title: 'About Us — Home-Office Apartments & LivingSpring Gardens',
    description:
      'A family compound in Fiapre, Sunyani, opened to guests — a calm base for remote work, family visits and exploring the Bono Region.',
  },
  '/book': {
    title: 'Book Your Stay — Home-Office Apartments, Sunyani',
    description:
      'Check dates and book Home-Office Apartment or LivingSpring Gardens in Sunyani directly. GHS 388 a night, with discounts for 5+ and 28–30 night stays. Pay by card or Mobile Money.',
  },
};

// Pages that should never appear in search results.
const PRIVATE_PREFIXES = ['/admin', '/dashboard', '/signin', '/signup', '/login', '/payment'];

export function isPrivatePath(path) {
  return PRIVATE_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

// Plain-HTML version of each public page's main content, written into
// the page's <div id="root"> at build time (scripts/prerender-meta.mjs).
// Crawlers that read the HTML before running JavaScript then see real
// headings, text and links instead of an empty page; React replaces it
// all on load (createRoot().render), so visitors never see it. Keep the
// wording in step with the pages themselves.
const NAV = [
  ['/', 'Home'], ['/apartments', 'The apartments'], ['/gallery', 'Gallery'],
  ['/about', 'About'], ['/book', 'Book your stay'],
];

const ADDRESS = 'Home-Office Apartments &amp; LivingSpring Gardens, Fiapre, Sunyani, Bono Region, Ghana · +233 20 630 1032';

const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const REVIEWS_HTML = `<h2>Guest reviews</h2>
    <p>Rated ${(AIRBNB_REVIEWS.reduce((n, r) => n + r.rating, 0) / AIRBNB_REVIEWS.length).toFixed(1)} out of 5 from ${AIRBNB_REVIEWS.length} guest reviews on Airbnb.</p>
    <ul>${AIRBNB_REVIEWS.map((r) => `<li>“${esc(r.comment)}” — ${esc(r.name)}</li>`).join('')}</ul>`;

export const PAGE_CONTENT = {
  '/': `
    <h1>A quiet place for hideout, retreat or work.</h1>
    <p>Home-Office Apartments — thoughtfully finished for how you actually spend your days, set in the calm of LivingSpring Gardens in Fiapre, Sunyani.</p>
    <h2>Jerusalem stone elegance, a peaceful pergola front yard, and expansive open space for relaxation or memorable events.</h2>
    <p>Discover self-contained apartments in a peaceful compound, thoughtfully designed for the way you work from home and the way you rest.</p>
    <ul>
      <li>A spacious, fully furnished hall with TV</li>
      <li>A modern kitchen equipped for convenience</li>
      <li>Two comfortable bedrooms with King, Queen, and Standard beds</li>
    </ul>
    <p>From GHS 388 a night. <a href="/book">Check availability</a> or <a href="/gallery">see the apartments</a>.</p>`,
  '/apartments': `
    <h1>Built for how you want it.</h1>
    <p>Two self-contained apartments — Home-Office Apartment and LivingSpring Gardens &amp; Apartment — each opening directly onto the serene LivingSpring Gardens, thoughtfully laid out for how you work, rest, and unwind.</p>
    <h2>Each apartment</h2>
    <ul>
      <li>A spacious, fully furnished hall with TV</li>
      <li>A modern kitchen equipped for convenience</li>
      <li>Two bedrooms and two bathrooms</li>
    </ul>
    <h2>Simple pricing, better for longer stays.</h2>
    <p>GHS 388 a night, with discounts for stays of 5 nights or more and for 28–30 night stays.</p>
    ${REVIEWS_HTML}
    <p><a href="/book">Enquire about dates, rates, and long stays.</a></p>`,
  '/gallery': `
    <h1>Photo gallery</h1>
    <p>Photos of Home-Office Apartments and LivingSpring Gardens in Fiapre, Sunyani — the lounge, bedrooms, kitchen, bathrooms and grounds.</p>
    <p><a href="/apartments">See what each apartment offers</a> or <a href="/book">book your stay</a>.</p>`,
  '/about': `
    <h1>A family compound, opened to guests.</h1>
    <p>Home-Office Apartments began as a simple idea — turn part of our family garden in Sunyani into a home away from home for people passing through, working remotely, or visiting for a season.</p>
    <h2>The garden city of the Bono Region.</h2>
    <p>Sunyani is smaller and calmer than the coastal cities — a good pace of life, a beautiful hinterland, and enough going on for a proper week or a proper month. A central location for exploring the Bono Region: Kintampo Waterfalls, Bui National Park, and Sunyani's central market and cafés.</p>
    <h2>Find us in Fiapre.</h2>
    <p>Home-Office Apartments and LivingSpring Gardens is in Fiapre, Sunyani, Bono Region. <a href="https://maps.app.goo.gl/WKGsbeXbNj9FYDt68">Get directions</a>.</p>`,
  '/book': `
    <h1>Plan your stay.</h1>
    <p>Pick your dates — if they're free, you can pay and lock them in right now. Book Home-Office Apartment or LivingSpring Gardens directly: GHS 388 a night, with discounts for 5+ and 28–30 night stays. Pay by card or Mobile Money.</p>`,
};

export function staticPageHtml(path) {
  const body = PAGE_CONTENT[path];
  if (!body) return '';
  const nav = NAV.map(([href, label]) => `<a href="${href}">${label}</a>`).join(' · ');
  return `<div data-prerendered><header><a href="/">Home-Office Apartments</a><nav>${nav}</nav></header><main>${body}</main><footer><p>${ADDRESS}</p></footer></div>`;
}
