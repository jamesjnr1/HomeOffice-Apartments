import { useState, useEffect } from 'react';
import StarRating from './StarRating';
import { supabase } from '../lib/supabase';
import { apartmentName } from '../lib/apartments';

/**
 * ReviewsSection — public social proof, same idea as an Airbnb
 * listing's reviews: an average rating up top, then a handful of
 * recent guest reviews. Reads public.reviews directly with the anon
 * key — RLS only ever returns rows an admin hasn't hidden (is_public
 * = true), so there's nothing extra to filter here.
 *
 * Renders nothing at all once loaded if there simply aren't any
 * reviews yet — no "no reviews" placeholder, since an empty
 * apartments page is a worse first impression than no section.
 */
export default function ReviewsSection({ apartment, limit = 6 }) {
  const [reviews, setReviews] = useState(null); // null = loading

  useEffect(() => {
    let query = supabase
      .from('reviews')
      .select('id, guest_name, apartment, rating, comment, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (apartment) query = query.eq('apartment', apartment);

    query.then(({ data }) => setReviews(data || []));
  }, [apartment, limit]);

  if (!reviews || reviews.length === 0) return null;

  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <section className="section">
      <div className="container">
        <div className="section-head-left reveal">
          <span className="eyebrow">GUEST REVIEWS</span>
          <h2>
            {average.toFixed(1)} <span style={{ fontSize: 16, fontWeight: 400, color: 'var(--muted)' }}>
              ({reviews.length} review{reviews.length === 1 ? '' : 's'})
            </span>
          </h2>
          <StarRating value={Math.round(average)} size={18} />
        </div>

        <div className="review-grid reveal">
          {reviews.map((r) => (
            <div className="review-card" key={r.id}>
              <div className="review-card-top">
                <StarRating value={r.rating} size={14} />
                <span className="review-card-date">{new Date(r.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>
              </div>
              {r.comment && <p className="review-card-comment">{r.comment}</p>}
              <p className="review-card-author">{r.guest_name} · {apartmentName(r.apartment)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
