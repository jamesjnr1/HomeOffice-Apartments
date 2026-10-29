import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Star, X } from 'lucide-react';
import StarRating from './StarRating';
import { supabase } from '../lib/supabase';
import { APARTMENTS } from '../lib/apartments';
import { AIRBNB_REVIEWS, REVIEW_CATEGORIES } from '../data/airbnbReviews.mjs';

/**
 * ReviewsSection — public social proof, same idea as an Airbnb
 * listing's reviews: the overall rating and category scores up top,
 * then guest reviews, newest first. Merges two sources: the reviews
 * guests left on Airbnb (src/data/airbnbReviews.js, from the host's
 * export) and reviews left on this site — public.reviews, read with
 * the anon key, where RLS only returns rows an admin hasn't hidden.
 *
 * Same section on Home and /apartments: `initial` cards in an even
 * grid (every card the same size, long reviews cut to four lines and
 * opened in a dialog), then a button to show the rest in place.
 */
export default function ReviewsSection({ apartment, initial = 6, cream = false }) {
  const [siteReviews, setSiteReviews] = useState([]);
  const [showAll, setShowAll] = useState(false);
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
  if (all.length === 0) return null;

  const average = all.reduce((sum, r) => sum + r.rating, 0) / all.length;
  const shown = showAll ? all : all.slice(0, initial);
  const withCategories = airbnb.filter((r) => r.categories);
  const categoryAverage = (key) =>
    withCategories.reduce((sum, r) => sum + r.categories[key], 0) / withCategories.length;

  return (
    <section className={`section${cream ? ' section-cream' : ''}`} id="reviews">
      <div className="container">
        <div className="reviews-head reveal">
          <div className="reviews-score">
            <span className="eyebrow">GUEST REVIEWS</span>
            <div className="reviews-score-row">
              <Star size={30} fill="#f5a623" color="#f5a623" aria-hidden="true" />
              <span className="reviews-score-num">{average.toFixed(1)}</span>
            </div>
            <p className="reviews-score-meta">
              {all.length} review{all.length === 1 ? '' : 's'} from guests who stayed
            </p>
          </div>

          {withCategories.length > 0 && (
            <dl className="reviews-cats">
              {REVIEW_CATEGORIES.map(([key, label]) => {
                const value = categoryAverage(key);
                return (
                  <div className="reviews-cat" key={key}>
                    <dt>{label}</dt>
                    <dd>
                      <span className="reviews-cat-bar"><span style={{ width: `${(value / 5) * 100}%` }} /></span>
                      <span className="reviews-cat-num">{value.toFixed(1)}</span>
                    </dd>
                  </div>
                );
              })}
            </dl>
          )}
        </div>

        <div className="review-grid reveal">
          {shown.map((r) => <ReviewCard key={r.id} review={r} onOpen={() => setOpenReview(r)} />)}
        </div>

        {all.length > initial && (
          <div className="reviews-more">
            <button type="button" className="btn btn-outline" onClick={() => setShowAll(!showAll)}>
              {showAll ? 'Show fewer reviews' : `Show all ${all.length} reviews`}
            </button>
          </div>
        )}
      </div>

      {openReview && <ReviewDialog review={openReview} onClose={() => setOpenReview(null)} />}
    </section>
  );
}

function reviewMeta(r) {
  const when = new Date(r.date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const stay = r.nights ? `${r.nights} night${r.nights === 1 ? '' : 's'}` : null;
  return {
    when,
    sub: [APARTMENTS[r.apartment]?.shortName, stay].filter(Boolean).join(' · '),
  };
}

function ReviewHead({ review: r }) {
  const { sub } = reviewMeta(r);
  return (
    <header className="review-card-head">
      <span className="review-avatar" aria-hidden="true">{(r.name || 'G').charAt(0).toUpperCase()}</span>
      <div>
        <p className="review-card-name">{r.name || 'Guest'}</p>
        <p className="review-card-meta">{sub}</p>
      </div>
    </header>
  );
}

function ReviewCard({ review: r, onOpen }) {
  // "Read more" only when the four-line cut actually hides text.
  const textRef = useRef(null);
  const [long, setLong] = useState(false);
  useLayoutEffect(() => {
    const el = textRef.current;
    const measure = () => setLong(el.scrollHeight > el.clientHeight + 1);
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);
  const { when } = reviewMeta(r);

  return (
    <article className="review-card">
      <ReviewHead review={r} />
      <div className="review-card-top">
        <StarRating value={r.rating} size={13} />
        <span className="review-card-date">{when}</span>
      </div>
      <p className="review-card-comment" ref={textRef}>{r.comment}</p>
      <div className="review-card-foot">
        <span className="review-card-source">via {r.source}</span>
        {long && (
          <button type="button" className="review-card-toggle" onClick={onOpen}>
            Read more
          </button>
        )}
      </div>
    </article>
  );
}

function ReviewDialog({ review: r, onClose }) {
  const { when } = reviewMeta(r);
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
        <ReviewHead review={r} />
        <div className="review-card-top">
          <StarRating value={r.rating} size={14} />
          <span className="review-card-date">{when}</span>
        </div>
        <p className="review-dialog-comment">{r.comment}</p>
        <span className="review-card-source">via {r.source}</span>
      </div>
    </div>
  );
}
