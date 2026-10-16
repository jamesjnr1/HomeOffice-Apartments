import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Adds `.in` to elements with `.reveal` when they scroll into view.
 * Re-scans on every route change.
 */
export function useReveal() {
  const location = useLocation();

  useEffect(() => {
    // Small delay so page content is mounted first
    const t = setTimeout(() => {
      const els = document.querySelectorAll('.reveal:not(.in)');
      if (!('IntersectionObserver' in window)) {
        els.forEach((el) => el.classList.add('in'));
        return;
      }
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add('in');
              io.unobserve(e.target);
            }
          });
        },
        { threshold: 0.12 }
      );
      els.forEach((el) => io.observe(el));

      return () => io.disconnect();
    }, 50);

    // Scroll to top on route change
    window.scrollTo(0, 0);

    return () => clearTimeout(t);
  }, [location.pathname]);
}
