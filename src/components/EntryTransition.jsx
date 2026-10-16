import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * EntryTransition
 * Full-screen overlay that plays a cinematic "zoom into the house" effect
 * when the user clicks Sign In or Book a stay.
 *
 * How to use:
 *   const [dest, setDest] = useState(null);
 *   <EntryTransition destination={dest} onComplete={() => setDest(null)} />
 *   <button onClick={() => setDest('/signin')}>Sign in</button>
 *
 * The overlay unmounts itself after the animation + navigation is done.
 */
export default function EntryTransition({ destination, onComplete, image }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!destination) return;
    setVisible(true);
    // After a moment, tell the parent to navigate — the overlay is peaking
    const navTimer = setTimeout(() => {
      onComplete?.();
    }, 900);
    // After a longer moment, un-mount the overlay entirely
    const hideTimer = setTimeout(() => {
      setVisible(false);
    }, 1050);
    return () => {
      clearTimeout(navTimer);
      clearTimeout(hideTimer);
    };
  }, [destination, onComplete]);

  if (!visible || !destination) return null;

  return createPortal(
    <div className="entry-transition" aria-hidden="true">
      <img
        src={image || '/images/hero-property.jpg'}
        alt=""
        className="entry-transition-image"
      />
    </div>,
    document.body
  );
}
