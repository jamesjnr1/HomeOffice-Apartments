'use client';

import Header from './Header';
import Footer from './Footer';
import SmoothScroll from '../lib/SmoothScroll';
import { useReveal } from '../lib/useReveal';

/**
 * SiteChrome — header, footer, smooth scrolling and scroll-in reveals
 * for the public pages. (The old full-screen curtain / "zoom into the
 * house" route transitions are gone — pages simply appear.)
 */
export default function SiteChrome({ children }) {
  useReveal();
  return (
    <SmoothScroll>
      <Header />
      <main>{children}</main>
      <Footer />
    </SmoothScroll>
  );
}
