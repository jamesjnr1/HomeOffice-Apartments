'use client';

import { useState, useEffect } from 'react';
import StarRating from './StarRating';
import { supabase } from '../lib/supabase';
import { apartmentName } from '../lib/apartments';
import { container, Eyebrow } from './ui';

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
    <section className="py-24 sm:py-32">
      <div className={container}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Eyebrow>Guest reviews</Eyebrow>
            <h2 className="mt-5 flex items-baseline gap-3 font-display text-[56px] font-light leading-none tracking-[-0.03em] text-ink">
              {average.toFixed(1)}
              <span className="font-sans text-[16px] font-normal tracking-normal text-muted">
                ({reviews.length} review{reviews.length === 1 ? '' : 's'})
              </span>
            </h2>
          </div>
          <StarRating value={Math.round(average)} size={18} />
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r) => (
            <figure key={r.id} className="flex flex-col rounded-[22px] bg-paper p-8 shadow-[0_1px_0_rgba(27,36,32,0.06)]">
              <div className="flex items-center justify-between">
                <StarRating value={r.rating} size={14} />
                <span className="text-[12.5px] text-muted">
                  {new Date(r.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                </span>
              </div>
              {r.comment && (
                <blockquote className="mt-6 flex-1 font-display text-[19px] font-light leading-relaxed text-ink">
                  “{r.comment}”
                </blockquote>
              )}
              <figcaption className="mt-6 text-[13.5px] text-ink-soft">
                {r.guest_name} · {apartmentName(r.apartment)}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
