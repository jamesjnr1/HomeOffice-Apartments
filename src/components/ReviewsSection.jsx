import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star } from 'lucide-react';
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
 * `limit` caps the cards shown; when it cuts some off, a link points
 * to the full list on /apartments#reviews. `showCategories` adds the
 * Airbnb-style category bars (Cleanliness, Accuracy, …).
 */
export default function ReviewsSection({ apartment, limit, showCategories = true, cream = false }) {
  const [siteReviews, setSiteReviews] = useState([]);

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
  const shown = limit ? all.slice(0, limit) : all;
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

          {showCategories && withCategories.length > 0 && (
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
          {shown.map((r) => <ReviewCard key={r.id} review={r} />)}
        </div>

        {shown.length < all.length && (
          <div className="reviews-more">
            <Link to="/apartments#reviews" className="link-arrow">
              Read all {all.length} reviews <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function ReviewCard({ review: r }) {
  const [open, setOpen] = useState(false);
  const long = (r.comment || '').length > 220;
  const when = new Date(r.date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const apt = APARTMENTS[r.apartment]?.shortName;

  return (
    <article className="review-card">
      <header className="review-card-head">
        <span className="review-avatar" aria-hidden="true">{(r.name || 'G').charAt(0).toUpperCase()}</span>
        <div>
          <p className="review-card-name">{r.name || 'Guest'}</p>
          <p className="review-card-meta">{[apt, r.nights && `${r.nights} night${r.nights === 1 ? '' : 's'}`].filter(Boolean).join(' · ')}</p>
        </div>
      </header>
      <div className="review-card-top">
        <StarRating value={r.rating} size={13} />
        <span className="review-card-date">{when}</span>
      </div>
      {r.comment && (
        <p className={`review-card-comment${long && !open ? ' is-clamped' : ''}`}>{r.comment}</p>
      )}
      {long && (
        <button type="button" className="review-card-toggle" onClick={() => setOpen(!open)}>
          {open ? 'Show less' : 'Show more'}
        </button>
      )}
      <p className="review-card-source">via {r.source}</p>
    </article>
  );
}
