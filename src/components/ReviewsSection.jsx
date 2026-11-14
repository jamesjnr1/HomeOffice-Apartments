import { useState, useEffect, useRef, useCallback } from 'react';
import { Star, ArrowLeft, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AIRBNB_REVIEWS } from '../data/airbnbReviews.mjs';

const AUTO_ADVANCE_MS = 6000;

/**
 * ReviewsSection — one review at a time, large, like a testimonial
 * slider: a short intro and arrows on the left, the quote on the right
 * with the guest's rating and name under it. Each change fades and
 * slides the quote in (from the side you're moving towards). Advances
 * on its own, pauses while hovered or focused, swipes on touch, and
 * doesn't auto-advance for prefers-reduced-motion.
 *
 * Merges two sources, newest first: the reviews guests left on Airbnb
 * (src/data/airbnbReviews.mjs, from the host's export) and reviews
 * left on this site — public.reviews, read with the anon key, where
 * RLS only returns rows an admin hasn't hidden.
 */
export default function ReviewsSection({ apartment, cream = false }) {
  const [siteReviews, setSiteReviews] = useState([]);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const paused = useRef(false);
  const touchX = useRef(null);

  useEffect(() => {
    let query = supabase
      .from('reviews')
      .select('id, guest_name, apartment, rating, comment, created_at')
      .order('created_at', { ascending: false })
      .limit(50);
    if (apartment) query = query.eq('apartment', apartment);
    query.then(({ data }) => setSiteReviews(data || []));
  }, [apartment]);

  const all = [
    ...AIRBNB_REVIEWS.filter((r) => !apartment || r.apartment === apartment),
    ...siteReviews.map((r) => ({
      id: r.id, name: r.guest_name, apartment: r.apartment,
      date: r.created_at, rating: r.rating, comment: r.comment,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));
  const count = all.length;

  const go = useCallback((step) => {
    if (count < 2) return;
    setDirection(step);
    setIndex((i) => (i + step + count) % count);
  }, [count]);

  // Re-armed on every change, so a review always gets its full time
  // on screen — including right after the visitor clicks an arrow.
  useEffect(() => {
    if (count < 2) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    let t;
    const arm = () => {
      t = setTimeout(() => {
        if (!paused.current && !document.hidden) go(1);
        else arm();
      }, AUTO_ADVANCE_MS);
    };
    arm();
    return () => clearTimeout(t);
  }, [count, go, index]);

  if (count === 0) return null;
  const r = all[index % count];
  const average = all.reduce((sum, x) => sum + x.rating, 0) / count;
  const text = r.comment || '';
  const size = text.length > 260 ? 'is-long' : text.length > 110 ? 'is-medium' : '';

  return (
    <section className={`section reviews-slider${cream ? ' section-cream' : ''}`} id="reviews">
      <div
        className="container reviews-slider-grid"
        onMouseEnter={() => { paused.current = true; }}
        onMouseLeave={() => { paused.current = false; }}
        onFocus={() => { paused.current = true; }}
        onBlur={() => { paused.current = false; }}
      >
        <div className="reviews-slider-intro reveal">
          <span className="reviews-slider-label">Guest reviews</span>
          <p>
            What guests say about staying with us — rated {average.toFixed(1)} out of 5
            across {count} review{count === 1 ? '' : 's'}.
          </p>
          <div className="reviews-slider-arrows">
            <button type="button" onClick={() => go(-1)} aria-label="Previous review"><ArrowLeft size={18} /></button>
            <button type="button" onClick={() => go(1)} aria-label="Next review"><ArrowRight size={18} /></button>
          </div>
        </div>

        <div
          className="reviews-slider-stage"
          aria-live="polite"
          onTouchStart={(e) => { touchX.current = e.touches[0].clientX; paused.current = true; }}
          onTouchEnd={(e) => {
            const dx = e.changedTouches[0].clientX - (touchX.current ?? 0);
            if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
            touchX.current = null;
            paused.current = false;
          }}
        >
          <span className="reviews-slider-mark" aria-hidden="true">“</span>
          <figure key={r.id} className={`reviews-slider-quote ${direction > 0 ? 'from-right' : 'from-left'}`}>
            <blockquote className={size}>{text}</blockquote>
            <figcaption>
              <span className="reviews-slider-avatar" aria-hidden="true">{(r.name || 'G').charAt(0).toUpperCase()}</span>
              <span>
                <span className="reviews-slider-rating">
                  {r.rating.toFixed(1)} / 5
                  <span className="reviews-slider-stars" aria-label={`${r.rating} out of 5 stars`}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} size={15} strokeWidth={0} fill={n <= r.rating ? 'currentColor' : '#cfd4d1'} aria-hidden="true" />
                    ))}
                  </span>
                </span>
                <span className="reviews-slider-name">{r.name || 'Guest'}</span>
              </span>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
