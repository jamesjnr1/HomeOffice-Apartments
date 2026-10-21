import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

/**
 * WalkthroughSection — the homepage video tour: one big video.
 * It starts playing (muted, looping) when it scrolls into view and
 * pauses when it scrolls out; a button unmutes it. The file only
 * downloads once the video is close to the screen. Visitors who ask
 * for reduced motion get the cover image and normal controls instead.
 */
export default function WalkthroughSection() {
  const videoRef = useRef(null);
  const visible = useRef(false);
  const [src, setSrc] = useState(null);
  const [muted, setMuted] = useState(true);
  const [reduced] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return undefined;
    if (reduced) { setSrc('/videos/walkthrough.mp4'); return undefined; }

    // Load the file shortly before it's on screen…
    const loader = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setSrc('/videos/walkthrough.mp4'); loader.disconnect(); }
    }, { rootMargin: '400px 0px' });
    // …and play only while at least 40% of it is visible.
    const player = new IntersectionObserver(([e]) => {
      visible.current = e.isIntersecting;
      if (e.isIntersecting) v.play().catch(() => {});
      else v.pause();
    }, { threshold: 0.4 });

    loader.observe(v);
    player.observe(v);
    return () => { loader.disconnect(); player.disconnect(); };
  }, [reduced]);

  // The file is attached a moment after the video first comes near the
  // screen — if it's already in view by then, start it now.
  useEffect(() => {
    if (src && !reduced && visible.current) videoRef.current?.play().catch(() => {});
  }, [src, reduced]);

  const toggleSound = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    if (!v.muted) v.play().catch(() => {});
  };

  return (
    <section className="walk">
      <div className="walk-frame reveal">
        <video
          ref={videoRef}
          className="walk-video"
          src={src || undefined}
          poster="/videos/walkthrough-poster.jpg"
          muted
          loop={!reduced}
          playsInline
          controls={reduced}
          preload="none"
          aria-label="Video tour of Home-Office Apartments and LivingSpring Gardens"
        />
        {!reduced && (
          <button
            type="button"
            className="walk-sound"
            onClick={toggleSound}
            aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            <span>{muted ? 'Sound on' : 'Sound off'}</span>
          </button>
        )}
      </div>
    </section>
  );
}
