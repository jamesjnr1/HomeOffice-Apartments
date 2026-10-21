import { useRef, useState } from 'react';
import { Play } from 'lucide-react';

/**
 * WalkthroughSection — the homepage video tour: one big video and a
 * play button, nothing else. The 44 s tour (/videos/walkthrough.mp4)
 * is built from the site's own photos; it only downloads when played.
 */
export default function WalkthroughSection() {
  const videoRef = useRef(null);
  const [started, setStarted] = useState(false);

  const play = () => {
    setStarted(true);
    videoRef.current?.play().catch(() => {});
  };

  return (
    <section className="walk">
      <div className={`walk-frame reveal ${started ? 'is-playing' : ''}`}>
        <video
          ref={videoRef}
          className="walk-video"
          src="/videos/walkthrough.mp4"
          poster="/videos/walkthrough-poster.jpg"
          controls={started}
          playsInline
          preload="none"
          onPlay={() => setStarted(true)}
        >
          Your browser can't play this video.
        </video>
        {!started && (
          <button type="button" className="walk-play" onClick={play} aria-label="Play the video tour">
            <span className="walk-play-ring"><Play size={34} fill="currentColor" /></span>
            <span className="walk-play-label">Watch the tour</span>
          </button>
        )}
      </div>
    </section>
  );
}
