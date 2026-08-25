import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, ArrowRight } from 'lucide-react';

/**
 * Wishlist — with only two apartments on the site, this is a small feature.
 * Shows whichever of the 2 the user has saved. Empty state points to the
 * apartments page rather than any external search.
 */

const APARTMENTS = [
  {
    id: 'verandah',
    name: 'The Verandah Apartment',
    location: 'LivingSpring Gardens · Sunyani',
    coverImage:
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=85',
  },
  {
    id: 'garden',
    name: 'The Garden Apartment',
    location: 'LivingSpring Gardens · Sunyani',
    coverImage:
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=85',
  },
];

export default function Wishlist() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    // TODO(supabase): fetch real wishlist
    setItems(APARTMENTS);
  }, []);

  const remove = (id) => {
    // TODO(supabase): supabase.from('wishlist_items').delete().match(...)
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="dash-page">
      <header className="dash-page-head">
        <span className="dash-eyebrow">WISHLIST</span>
        <h1>Saved apartments</h1>
        <p className="dash-lead">The apartments you've saved for later.</p>
      </header>

      {items.length === 0 ? (
        <div className="dash-empty">
          <Heart size={40} className="dash-empty-icon" />
          <h3>Nothing saved yet</h3>
          <p>Tap the heart on either apartment to save it for later.</p>
          <Link to="/apartments" className="dash-btn dash-btn-primary">
            See the apartments <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="dash-wishlist-grid">
          {items.map((a) => (
            <article key={a.id} className="dash-wishlist-card">
              <Link to="/apartments" className="dash-wishlist-img-wrap">
                <img src={a.coverImage} alt={a.name} className="dash-wishlist-img" />
              </Link>
              <button
                className="dash-heart active"
                onClick={() => remove(a.id)}
                aria-label="Remove from wishlist"
              >
                <Heart size={18} fill="currentColor" />
              </button>
              <div className="dash-wishlist-body">
                <Link to="/apartments">
                  <h3>{a.name}</h3>
                </Link>
                <div className="dash-loc">
                  <MapPin size={12} />
                  {a.location}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
