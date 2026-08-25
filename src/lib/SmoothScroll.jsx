import { useEffect } from 'react';
import Lenis from 'lenis';

/**
 * SmoothScroll
 * Lenis momentum scrolling — mobile-safe version.
 * On touch devices Lenis can interfere with native scroll; we disable
 * it on mobile (below 768px) and let the browser handle touch scrolling natively.
 */
export default function SmoothScroll({ children }) {
  useEffect(() => {
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
  }, []);

  return children;
}
