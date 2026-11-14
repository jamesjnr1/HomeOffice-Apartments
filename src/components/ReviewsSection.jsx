import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Star, Sparkles, CircleCheck, KeyRound, MessageSquare, MapPin, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { APARTMENTS } from '../lib/apartments';
import { AIRBNB_REVIEWS, REVIEW_CATEGORIES } from '../data/airbnbReviews.mjs';

const CATEGORY_ICONS = {
  cleanliness: Sparkles,
  accuracy: CircleCheck,
  checkin: KeyRound,
  communication: MessageSquare,
  location: MapPin,
  value: Tag,
};

/**
 * ReviewsSection — public social proof, laid out like an Airbnb
 * listing's reviews: the overall score centred on top, a row of
 * category scores, then the reviews in two clean columns (no boxes),
 * newest first. Merges two sources: the reviews guests left on Airbnb
 * (src/data/airbnbReviews.mjs, from the host's export) and reviews
 * left on this site — public.reviews, read with the anon key, where
 * RLS only returns rows an admin hasn't hidden.
 *
 * `initial` reviews show first; a button reveals the rest in place.
 */
export default function ReviewsSection({ apartment, initial = 6, cream = false }) {
  const [siteReviews, setSiteReviews] = useState([]);
  const [showAll, setShowAll] = useState(false);

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
        <div className="reviews-summary reveal">
          <span className="eyebrow">GUEST REVIEWS</span>
          <div className="reviews-summary-score">
            <Star size={34} fill="currentColor" strokeWidth={0} aria-hidden="true" />
            <span>{average.toFixed(1)}</span>
          </div>
          <p className="reviews-summary-meta">
            Rated by {all.length} guest{all.length === 1 ? '' : 's'} who stayed with us
          </p>
        </div>

        {withCategories.length > 0 && (
          <dl className="reviews-cats reveal">
            {REVIEW_CATEGORIES.map(([key, label]) => {
              const Icon = CATEGORY_ICONS[key];
              return (
                <div className="reviews-cat" key={key}>
                  <dt>{label}</dt>
                  <dd>{categoryAverage(key).toFixed(1)}</dd>
                  <Icon size={26} strokeWidth={1.4} aria-hidden="true" />
                </div>
              );
            })}
          </dl>
        )}

        <div className="reviews-list">
          {shown.map((r) => <Review key={r.id} review={r} />)}
        </div>

        {all.length > initial && (
          <div className="reviews-more">
            <button type="button" className="btn btn-outline" onClick={() => setShowAll(!showAll)}>
              {showAll ? 'Show fewer reviews' : `Show all ${all.length} reviews`}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function Review({ review: r }) {
  // Long reviews are cut to four lines; "Show more" only appears when
  // the cut actually hides text.
  const textRef = useRef(null);
  const [clamped, setClamped] = useState(false);
  const [open, setOpen] = useState(false);
  useLayoutEffect(() => {
    const el = textRef.current;
    const measure = () => { if (!open) setClamped(el.scrollHeight > el.clientHeight + 1); };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [open]);

  const when = new Date(r.date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const stay = r.nights ? `${r.nights} night${r.nights === 1 ? '' : 's'}` : null;
  const apt = APARTMENTS[r.apartment]?.shortName;

  return (
    <article className="review">
      <header className="review-head">
        <span className="review-avatar" aria-hidden="true">{(r.name || 'G').charAt(0).toUpperCase()}</span>
        <div>
          <p className="review-name">{r.name || 'Guest'}</p>
          <p className="review-meta">{[apt, stay].filter(Boolean).join(' · ')}</p>
        </div>
      </header>
      <p className="review-rating">
        <span className="review-stars" aria-label={`${r.rating} out of 5 stars`}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Star key={n} size={11} strokeWidth={0} fill={n <= r.rating ? 'currentColor' : '#d5d9d6'} aria-hidden="true" />
          ))}
        </span>
        <span>{when}</span>
        <span className="review-source">· {r.source}</span>
      </p>
      <p ref={textRef} className={`review-text${open ? '' : ' is-clamped'}`}>{r.comment}</p>
      {(clamped || open) && (
        <button type="button" className="review-toggle" onClick={() => setOpen(!open)}>
          {open ? 'Show less' : 'Show more'}
        </button>
      )}
    </article>
  );
}
