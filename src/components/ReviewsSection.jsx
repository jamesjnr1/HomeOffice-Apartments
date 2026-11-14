import { useState, useEffect, useRef, useCallback } from 'react';
import { Star, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { APARTMENTS } from '../lib/apartments';
import { AIRBNB_REVIEWS, REVIEW_CATEGORIES } from '../data/airbnbReviews.mjs';

const AUTO_ADVANCE_MS = 5000;

/**
 * ReviewsSection — public social proof as a compact header (overall
 * score + category scores) and a carousel of equal-size review cards
 * that slides one card at a time: arrows, dots, swipe on touch, and
 * an automatic advance that pauses while the visitor hovers, touches
 * or focuses it (and is off for prefers-reduced-motion).
 *
 * Merges two sources, newest first: the reviews guests left on Airbnb
 * (src/data/airbnbReviews.mjs, from the host's export) and reviews
 * left on this site — public.reviews, read with the anon key, where
 * RLS only returns rows an admin hasn't hidden. Long reviews are cut
 * to four lines on the card; "Read more" opens the whole review.
 */
export default function ReviewsSection({ apartment, cream = false }) {
  const [siteReviews, setSiteReviews] = useState([]);
  const [openReview, setOpenReview] = useState(null);

  useEffect(() => {
    let query = supabase
      .from('reviews')
      .select('id, guest_name, apartment, rating, comment, created_at')
      .order('created_at', { ascending: false })
      .limit(50);
    if (apartment) query = query.eq('apartment', apartment);
    query.then(({ data }) => setSiteReviews(data || []));
  }, [apartment]);

  const airbnb = AIRBNB_REVIEWS.filter((r) => !apartment || r.apartment === apartment)
    .map((r) => ({ ...r, source: 'Airbnb' }));
  const site = siteReviews.map((r) => ({
    id: r.id,
    name: r.guest_name,
    apartment: r.apartment,
    date: r.created_at,
    rating: r.rating,
    comment: r.comment,
    source: 'Direct booking',
  }));
  const all = [...airbnb, ...site].sort((a, b) => new Date(b.date) - new Date(a.date));

  const carousel = useCarousel(all.length);
  if (all.length === 0) return null;

  const average = all.reduce((sum, r) => sum + r.rating, 0) / all.length;
  const withCategories = airbnb.filter((r) => r.categories);
  const categoryAverage = (key) =>
    withCategories.reduce((sum, r) => sum + r.categories[key], 0) / withCategories.length;

  return (
    <section className={`section reviews-section${cream ? ' section-cream' : ''}`} id="reviews">
      <div className="container">
        <div className="reviews-top reveal">
          <div>
            <span className="eyebrow">GUEST REVIEWS</span>
            <div className="reviews-score">
              <Star size={26} fill="currentColor" strokeWidth={0} aria-hidden="true" />
              <span className="reviews-score-num">{average.toFixed(1)}</span>
              <span className="reviews-score-count">· {all.length} review{all.length === 1 ? '' : 's'}</span>
            </div>
            {withCategories.length > 0 && (
              <ul className="reviews-chips">
                {REVIEW_CATEGORIES.map(([key, label]) => (
                  <li key={key}>{label} <strong>{categoryAverage(key).toFixed(1)}</strong></li>
                ))}
              </ul>
            )}
          </div>

          <div className="reviews-arrows">
            <button type="button" onClick={carousel.prev} aria-label="Previous review"><ChevronLeft size={20} /></button>
            <button type="button" onClick={carousel.next} aria-label="Next review"><ChevronRight size={20} /></button>
          </div>
        </div>

        <div
          className="reviews-track"
          ref={carousel.trackRef}
          onScroll={carousel.onScroll}
          onMouseEnter={carousel.pause}
          onMouseLeave={carousel.resume}
          onTouchStart={carousel.pause}
          onFocus={carousel.pause}
          onBlur={carousel.resume}
          aria-roledescription="carousel"
          aria-label="Guest reviews"
        >
          {all.map((r, i) => (
            <ReviewCard
              key={r.id}
              review={r}
              label={`${i + 1} of ${all.length}`}
              onOpen={() => setOpenReview(r)}
            />
          ))}
        </div>

        <div className="reviews-dots" role="tablist" aria-label="Choose a review">
          {Array.from({ length: carousel.stops }, (_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === carousel.index}
              aria-label={`Go to review ${i + 1}`}
              className={i === carousel.index ? 'is-active' : ''}
              onClick={() => carousel.goTo(i)}
            />
          ))}
        </div>
      </div>

      {openReview && <ReviewDialog review={openReview} onClose={() => setOpenReview(null)} />}
    </section>
  );
}

// Slides a horizontal scroll-snap track one card at a time. The track
// itself scrolls (so touch swiping is native); `index` is the first
// fully visible card, kept in step with manual scrolling.
function useCarousel(count) {
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [stops, setStops] = useState(count); // positions the track can rest at
  const paused = useRef(false);

  const step = () => {
    const track = trackRef.current;
    const card = track?.firstElementChild;
    if (!card) return 0;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return card.getBoundingClientRect().width + gap;
  };

  const goTo = useCallback((i) => {
    const track = trackRef.current;
    if (!track) return;
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    let target = i;
    if (target < 0) target = stops - 1;
    if (target >= stops || (atEnd && target > index)) target = 0;
    track.scrollTo({ left: target * step(), behavior: 'smooth' });
  }, [stops, index]);

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  const measure = useCallback(() => {
    const track = trackRef.current;
    const s = step();
    if (!track || !s) return;
    setIndex(Math.round(track.scrollLeft / s));
    setStops(Math.round((track.scrollWidth - track.clientWidth) / s) + 1);
  }, []);
  const onScroll = measure;

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure, count]);

  useEffect(() => {
    if (count < 2) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const t = setInterval(() => {
      if (!paused.current && !document.hidden) next();
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(t);
  }, [count, next]);

  return {
    trackRef,
    index,
    stops,
    goTo,
    next,
    prev,
    onScroll,
    pause: () => { paused.current = true; },
    resume: () => { paused.current = false; },
  };
}

function reviewWhen(r) {
  return new Date(r.date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

function ReviewHead({ review: r }) {
  const stay = r.nights ? `${r.nights} night${r.nights === 1 ? '' : 's'}` : null;
  const apt = APARTMENTS[r.apartment]?.shortName;
  return (
    <header className="review-card-head">
      <span className="review-avatar" aria-hidden="true">{(r.name || 'G').charAt(0).toUpperCase()}</span>
      <div>
        <p className="review-card-name">{r.name || 'Guest'}</p>
        <p className="review-card-meta">{[apt, stay].filter(Boolean).join(' · ')}</p>
      </div>
    </header>
  );
}

function Stars({ rating }) {
  return (
    <span className="review-stars" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={14} strokeWidth={0} fill={n <= rating ? '#f5a623' : '#d5d9d6'} aria-hidden="true" />
      ))}
    </span>
  );
}

function ReviewCard({ review: r, label, onOpen }) {
  const textRef = useRef(null);
  const [clamped, setClamped] = useState(false);
  useEffect(() => {
    const el = textRef.current;
    const measure = () => setClamped(el.scrollHeight > el.clientHeight + 1);
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  return (
    <article className="review-card" aria-roledescription="slide" aria-label={label}>
      <Stars rating={r.rating} />
      <p ref={textRef} className="review-card-text">“{r.comment}”</p>
      {clamped && (
        <button type="button" className="review-card-more" onClick={onOpen}>Read more</button>
      )}
      <div className="review-card-foot">
        <ReviewHead review={r} />
        <span className="review-card-when">{reviewWhen(r)} · {r.source}</span>
      </div>
    </article>
  );
}

function ReviewDialog({ review: r, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="review-dialog-backdrop" onClick={onClose}>
      <div className="review-dialog" role="dialog" aria-modal="true" aria-label={`Review by ${r.name}`} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="review-dialog-close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
        <Stars rating={r.rating} />
        <p className="review-dialog-text">“{r.comment}”</p>
        <ReviewHead review={r} />
        <p className="review-card-when">{reviewWhen(r)} · {r.source}</p>
      </div>
    </div>
  );
}
