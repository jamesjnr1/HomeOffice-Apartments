import { useRef, useState } from 'react';
import { Play, Clock, MapPin } from 'lucide-react';

/**
 * WalkthroughSection — the homepage video tour, laid out as a dark
 * feature band: copy and a clickable chapter list on one side, the
 * video on the other. Clicking a chapter jumps the video to that room;
 * the current room highlights as it plays. Times match the shot
 * starts in /videos/walkthrough.mp4 (44 s, built from the site photos).
 */
const CHAPTERS = [
  { t: 0, label: 'Arrival', sub: 'Gate, palms and gardens' },
  { t: 4.7, label: 'The compound', sub: 'Courtyard, pergola and lawns' },
  { t: 12.1, label: 'Lounge & living', sub: 'Furnished, TV, air-conditioning' },
  { t: 19.5, label: 'Kitchen & dining', sub: 'Fully equipped' },
  { t: 26.9, label: 'Bedrooms', sub: 'King, Queen and Standard beds' },
  { t: 34.3, label: 'Bathrooms', sub: 'Walk-in showers, hot water' },
];

function fmt(s) {
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

export default function WalkthroughSection() {
  const videoRef = useRef(null);
  const [started, setStarted] = useState(false);
  const [now, setNow] = useState(0);

  const play = (t) => {
    const v = videoRef.current;
    if (!v) return;
    if (typeof t === 'number') v.currentTime = t;
    setStarted(true);
    v.play().catch(() => {});
  };

  const active = CHAPTERS.reduce((idx, c, i) => (now >= c.t - 0.05 ? i : idx), 0);

  return (
    <section className="walk">
      <div className="container walk-grid">
        <div className="walk-copy reveal">
          <span className="walk-eyebrow">VIDEO TOUR</span>
          <h2>Step inside before you arrive.</h2>
          <p className="walk-lead">
            A short walk from the gate to the bedrooms — every room exactly as you'll find it.
          </p>
          <div className="walk-meta">
            <span><Clock size={14} /> 0:44</span>
            <span><MapPin size={14} /> Fiapre, Sunyani</span>
          </div>

          <ol className="walk-chapters" aria-label="In this tour">
            {CHAPTERS.map((c, i) => (
              <li key={c.label}>
                <button
                  type="button"
                  className={`walk-chapter ${started && i === active ? 'is-active' : ''}`}
                  onClick={() => play(c.t)}
                >
                  <span className="walk-chapter-time">{fmt(c.t)}</span>
                  <span className="walk-chapter-text">
                    <strong>{c.label}</strong>
                    <span>{c.sub}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>

        <div className="walk-media reveal">
          <div className={`walk-frame ${started ? 'is-playing' : ''}`}>
            <video
              ref={videoRef}
              className="walk-video"
              src="/videos/walkthrough.mp4"
              poster="/videos/walkthrough-poster.jpg"
              controls={started}
              playsInline
              preload="none"
              onTimeUpdate={(e) => setNow(e.currentTarget.currentTime)}
              onPlay={() => setStarted(true)}
            >
              Your browser can't play this video.
            </video>
            {!started && (
              <button type="button" className="walk-play" onClick={() => play(0)} aria-label="Play the video tour">
                <span className="walk-play-ring"><Play size={30} fill="currentColor" /></span>
                <span className="walk-play-label">Play the tour</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
