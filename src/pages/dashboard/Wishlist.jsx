import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, ArrowRight } from 'lucide-react';

/**
 * Wishlist — with only one apartment on the site, this just tracks whether
 * the guest has saved it. Empty state points to the apartment page rather
 * than any external search.
 */

const APARTMENT = {
  id: 'home-office',
  name: 'Home-Office Apartments',
  location: 'Sunyani, Ghana',
  coverImage: '/images/hero-property.jpg',
};

export default function Wishlist() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    // TODO(supabase): fetch real wishlist
    setItems([APARTMENT]);
  }, []);

  const remove = (id) => {
    // TODO(supabase): supabase.from('wishlist_items').delete().match(...)
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="dash-page">
      <header className="dash-page-head">
        <span className="dash-eyebrow">WISHLIST</span>
        <h1>Saved</h1>
        <p className="dash-lead">Whether you've saved the apartment for later.</p>
      </header>

      {items.length === 0 ? (
        <div className="dash-empty">
          <Heart size={40} className="dash-empty-icon" />
          <h3>Nothing saved yet</h3>
          <p>Tap the heart to save the apartment for later.</p>
          <Link to="/apartments" className="dash-btn dash-btn-primary">
            See the apartment <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="dash-wishlist-grid" style={{ gridTemplateColumns: '1fr', maxWidth: 340 }}>
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
