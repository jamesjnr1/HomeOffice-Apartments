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
      if (location.hash) scrollToHash(location.hash, 300);
      return;
    }

    if (prevPath.current !== location.pathname) {
      prevPath.current = location.pathname;
      // Trigger the curtain animation
      setActive(true);
      // Also scroll to top on route change (Lenis-safe)
      window.scrollTo({ top: 0, behavior: 'instant' });
      // A link to a section (e.g. /apartments#reviews) lands on it once
      // the curtain has covered the screen and the new page has rendered.
      if (location.hash) scrollToHash(location.hash, 450);
      const t = setTimeout(() => setActive(false), 800);
      return () => clearTimeout(t);
    }
  }, [location.pathname, location.hash]);

  if (!active) return null;

  return createPortal(
    <div className="page-curtain" aria-hidden="true">
      <div className="page-curtain-mark">
        <span className="page-curtain-dot">
          <img src="/images/logo-icon.png" alt="" />
        </span>
        <span className="page-curtain-word">
          <span className="page-curtain-primary">Home-Office Apartments</span>
          <span className="page-curtain-sub">and Living<em>Spring</em> Gardens</span>
        </span>
      </div>
    </div>,
    document.body
  );
}

function scrollToHash(hash, delay) {
  setTimeout(() => {
    const el = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'instant' });
  }, delay);
}
