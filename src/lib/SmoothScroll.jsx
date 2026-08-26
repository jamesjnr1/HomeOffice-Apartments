import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';

// Routes with their own fixed-sidebar + independently-scrolling-pane layout.
// Lenis hijacks the window's scroll, which fights that layout (dragging the
// sidebar along with the content instead of letting only the content pane
// scroll), so it's disabled entirely on these routes.
const LENIS_EXCLUDED_PREFIXES = ['/dashboard', '/admin'];

/**
 * SmoothScroll
 * Lenis momentum scrolling — mobile-safe version.
 * On touch devices Lenis can interfere with native scroll; we disable
 * it on mobile (below 768px) and let the browser handle touch scrolling natively.
 */
export default function SmoothScroll({ children }) {
  const { pathname } = useLocation();

  useEffect(() => {
    const isExcludedRoute = LENIS_EXCLUDED_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
    if (isExcludedRoute) return; // App-style dashboards manage their own scroll

    // On mobile, native scroll is better — Lenis can block touch events
    const isMobile = window.matchMedia('(max-width: 768px)').matches ||
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) return; // Leave mobile scrolling to the browser

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      infinite: false,
    });

    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [pathname]);

  return children;
}
