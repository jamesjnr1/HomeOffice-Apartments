// What Google (and link previews) show for each page. One list, used
// twice: in the browser on every route change (usePageMeta below), and
// at build time by scripts/prerender-meta.mjs, which writes a copy of
// index.html per public page with these tags already in the HTML — so
// a crawler sees the right title/description without running React.

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
