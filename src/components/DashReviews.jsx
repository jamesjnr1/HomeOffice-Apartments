import { useEffect, useState } from 'react';
import StarRating from './StarRating';
import { supabase } from '../lib/supabase';

/**
 * DashReviews — a quiet, text-only strip of recent guest reviews for
 * filling otherwise-empty space in the guest dashboard (e.g. below
 * the empty-state card on Bookings, or under the stats on Overview
 * when there's no active stay). Deliberately simple: no cards, no
 * photos, just quotes — same public.reviews data ReviewsSection shows
 * on the marketing site, just restyled for the dash- register.
 * Renders nothing if there are no public reviews yet.
 */
export default function DashReviews({ limit = 3 }) {
  const [reviews, setReviews] = useState(null); // null = loading

  useEffect(() => {
    supabase
      .from('reviews')
      .select('id, guest_name, rating, comment, created_at')
      .order('created_at', { ascending: false })
      .limit(limit)
      .then(({ data }) => setReviews(data || []));
  }, [limit]);

  if (!reviews || reviews.length === 0) return null;

  return (
    <section className="dash-reviews">
      <h2 className="dash-reviews-h">What guests are saying</h2>
      <div className="dash-reviews-list">
        {reviews.map((r) => (
          <div className="dash-reviews-item" key={r.id}>
            <StarRating value={r.rating} size={13} />
            {r.comment && <p className="dash-reviews-comment">"{r.comment}"</p>}
            <p className="dash-reviews-author">{r.guest_name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
