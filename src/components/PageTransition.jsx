import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';

/**
 * PageTransition
 * Plays a dark curtain wipe over the screen whenever the route changes.
 * Curtain slides up from bottom, briefly covers, then continues up off-screen —
 * revealing the new page. Same refined feel as premium agency sites.
 */
export default function PageTransition() {
  const location = useLocation();
  const [active, setActive] = useState(false);
  const prevPath = useRef(location.pathname);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Don't run on initial mount
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevPath.current = location.pathname;
      return;
    }

    if (prevPath.current !== location.pathname) {
      prevPath.current = location.pathname;
      // Trigger the curtain animation
      setActive(true);
      // Also scroll to top on route change (Lenis-safe)
      window.scrollTo({ top: 0, behavior: 'instant' });
      const t = setTimeout(() => setActive(false), 1100);
      return () => clearTimeout(t);
    }
  }, [location.pathname]);

  if (!active) return null;

  return createPortal(
    <div className="page-curtain" aria-hidden="true" />,
    document.body
  );
}
