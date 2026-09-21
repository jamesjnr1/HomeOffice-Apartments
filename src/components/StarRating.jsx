import { Star } from 'lucide-react';

/**
 * StarRating — five stars, either a read-only display (default) or an
 * interactive picker when `onChange` is passed. Shared between the
 * guest "Leave a review" form, the public ReviewsSection, and
 * AdminReviews, so all three render ratings identically.
 */
export default function StarRating({ value = 0, onChange, size = 16 }) {
  const interactive = typeof onChange === 'function';
  return (
    <span className="star-rating" role={interactive ? 'radiogroup' : undefined} aria-label={interactive ? 'Rating' : `${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          fill={n <= value ? '#f5a623' : 'none'}
          color={n <= value ? '#f5a623' : '#c7ccc9'}
          style={interactive ? { cursor: 'pointer' } : undefined}
          onClick={interactive ? () => onChange(n) : undefined}
        />
      ))}
    </span>
  );
}
