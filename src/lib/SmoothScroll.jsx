import { useEffect } from 'react';
import Lenis from 'lenis';

/**
 * SmoothScroll
 * Wraps the whole app with Lenis-powered smooth momentum scrolling —
 * the same library aerodynamics.nl and most premium agency sites use.
 *
 * Requires: npm install lenis
 */
export default function SmoothScroll({ children }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
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
