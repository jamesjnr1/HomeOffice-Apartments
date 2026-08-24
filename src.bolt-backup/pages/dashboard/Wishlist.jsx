import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, ArrowRight } from 'lucide-react';

/**
 * Wishlist
 * Apartments the user has saved.
 *
 * TODO(supabase): replace MOCK data with:
 *   supabase
 *     .from('wishlist_items')
 *     .select('*, apartments(*)')
 *     .eq('user_id', user.id)
 */

const MOCK_WISHLIST = [
  {
    id: 'a-1',
    name: 'Garden Studio',
    city: 'Sunyani',
    country: 'Ghana',
    pricePerNight: 480,
    coverImage:
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'a-2',
    name: 'Riverside Suite',
    city: 'Sunyani',
    country: 'Ghana',
    pricePerNight: 620,
    coverImage:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'a-3',
    name: 'The Verandah Apartment',
    city: 'Sunyani',
    country: 'Ghana',
    pricePerNight: 540,
    coverImage:
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'a-4',
    name: 'The North Ridge Loft',
    city: 'Sunyani',
    country: 'Ghana',
    pricePerNight: 720,
    coverImage:
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80',
  },
];

export default function Wishlist() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    // TODO(supabase): fetch real wishlist
    setItems(MOCK_WISHLIST);
  }, []);

  const remove = (id) => {
    // TODO(supabase): supabase.from('wishlist_items').delete().match({ user_id, apartment_id: id })
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="dash-page">
      <header className="dash-page-head">
        <p className="dash-eyebrow">WISHLIST</p>
        <h1>Saved apartments</h1>
        <p className="dash-lead">Places you've saved for later.</p>
      </header>

      {items.length === 0 ? (
        <div className="dash-empty">
          <Heart size={40} className="dash-empty-icon" />
          <h3>Your favourite stays will appear here</h3>
          <p>Tap the heart on any apartment to save it for later.</p>
          <Link to="/apartments" className="dash-btn dash-btn-primary">
            Browse apartments <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="dash-wishlist-grid">
          {items.map((a) => (
            <article key={a.id} className="dash-wishlist-card">
              <Link to={`/apartments/${a.id}`} className="dash-wishlist-img-wrap">
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
                <Link to={`/apartments/${a.id}`}>
                  <h3>{a.name}</h3>
                </Link>
                <div className="dash-loc">
                  <MapPin size={12} />
                  {a.city}, {a.country}
                </div>
                <div className="dash-rec-price">
                  <strong>GHS {a.pricePerNight}</strong>
                  <span> / night</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
