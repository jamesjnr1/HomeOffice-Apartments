import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Download, MessageSquare, ArrowRight, MapPin } from 'lucide-react';

/**
 * Bookings
 * Tabbed view of Upcoming / Current / Past bookings.
 *
 * TODO(supabase): replace MOCK_BOOKINGS with:
 *   supabase
 *     .from('bookings')
 *     .select('*, apartments(name, city, cover_image)')
 *     .eq('guest_id', user.id)
 *     .order('check_in', { ascending: false })
 */

const MOCK_BOOKINGS = [
  {
    reference: 'HO-8FQ2P',
    apartment: {
      name: 'The North Ridge Loft',
      city: 'Sunyani',
      coverImage:
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
    },
    checkIn: new Date(Date.now() + 6 * 86400000),
    checkOut: new Date(Date.now() + 10 * 86400000),
    nights: 4,
    guests: 2,
    total: 2480,
    status: 'CONFIRMED',
  },
  {
    reference: 'HO-K3P9M',
    apartment: {
      name: 'Riverside Suite',
      city: 'Sunyani',
      coverImage:
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    },
    checkIn: new Date(Date.now() + 40 * 86400000),
    checkOut: new Date(Date.now() + 44 * 86400000),
    nights: 4,
    guests: 1,
    total: 2480,
    status: 'PENDING',
  },
  {
    reference: 'HO-2XR7T',
    apartment: {
      name: 'Garden Studio',
      city: 'Sunyani',
      coverImage:
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
    },
    checkIn: new Date(Date.now() - 30 * 86400000),
    checkOut: new Date(Date.now() - 26 * 86400000),
    nights: 4,
    guests: 2,
    total: 1920,
    status: 'COMPLETED',
  },
  {
    reference: 'HO-YB4LN',
    apartment: {
      name: 'The Verandah Apartment',
      city: 'Sunyani',
      coverImage:
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
    },
    checkIn: new Date(Date.now() - 90 * 86400000),
    checkOut: new Date(Date.now() - 83 * 86400000),
    nights: 7,
    guests: 2,
    total: 3780,
    status: 'COMPLETED',
  },
];

export default function Bookings() {
  const [tab, setTab] = useState('upcoming');

  const filtered = useMemo(() => {
    const now = new Date();
    return MOCK_BOOKINGS.filter((b) => {
      if (tab === 'upcoming') return b.checkIn > now && b.status !== 'CANCELLED';
      if (tab === 'current') return b.checkIn <= now && b.checkOut >= now;
      if (tab === 'past') return b.checkOut < now || b.status === 'CANCELLED';
      return true;
    });
  }, [tab]);

  const counts = useMemo(() => {
    const now = new Date();
    return {
      upcoming: MOCK_BOOKINGS.filter(
        (b) => b.checkIn > now && b.status !== 'CANCELLED'
      ).length,
      current: MOCK_BOOKINGS.filter(
        (b) => b.checkIn <= now && b.checkOut >= now
      ).length,
      past: MOCK_BOOKINGS.filter(
        (b) => b.checkOut < now || b.status === 'CANCELLED'
      ).length,
    };
  }, []);

  return (
    <div className="dash-page">
      <header className="dash-page-head">
        <p className="dash-eyebrow">BOOKINGS</p>
        <h1>Your trips</h1>
        <p className="dash-lead">Everywhere you're going, and everywhere you've been.</p>
      </header>

      <div className="dash-tabs">
        <TabBtn active={tab === 'upcoming'} onClick={() => setTab('upcoming')} count={counts.upcoming}>
          Upcoming
        </TabBtn>
        <TabBtn active={tab === 'current'} onClick={() => setTab('current')} count={counts.current}>
          Current
        </TabBtn>
        <TabBtn active={tab === 'past'} onClick={() => setTab('past')} count={counts.past}>
          Past
        </TabBtn>
      </div>

      {filtered.length === 0 ? (
        <div className="dash-empty">
          <h3>Nothing here yet</h3>
          <p>
            When you book a stay, it'll show up here. Browse apartments to plan your next trip.
          </p>
          <Link to="/apartments" className="dash-btn dash-btn-primary">
            Browse apartments <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="dash-booking-list">
          {filtered.map((b) => (
            <BookingCard key={b.reference} booking={b} />
          ))}
        </div>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, count, children }) {
  return (
    <button className={`dash-tab ${active ? 'active' : ''}`} onClick={onClick}>
      {children}
      <span className="dash-tab-count">{count}</span>
    </button>
  );
}

function BookingCard({ booking }) {
  const b = booking;
  return (
    <article className="dash-booking">
      <img
        src={b.apartment.coverImage}
        alt={b.apartment.name}
        className="dash-booking-img"
      />
      <div className="dash-booking-body">
        <div className="dash-booking-top">
          <div>
            <h3>{b.apartment.name}</h3>
            <div className="dash-loc">
              <MapPin size={12} />
              {b.apartment.city}
            </div>
          </div>
          <StatusBadge status={b.status} />
        </div>

        <div className="dash-booking-meta">
          <div>
            <div className="dash-detail-label">DATES</div>
            <div className="dash-detail-value">
              {format(b.checkIn, 'd MMM')} → {format(b.checkOut, 'd MMM yyyy')}
            </div>
          </div>
          <div>
            <div className="dash-detail-label">NIGHTS</div>
            <div className="dash-detail-value">{b.nights}</div>
          </div>
          <div>
            <div className="dash-detail-label">GUESTS</div>
            <div className="dash-detail-value">{b.guests}</div>
          </div>
          <div>
            <div className="dash-detail-label">TOTAL</div>
            <div className="dash-detail-value">GHS {b.total.toLocaleString()}</div>
          </div>
          <div>
            <div className="dash-detail-label">REFERENCE</div>
            <div className="dash-detail-value dash-mono">{b.reference}</div>
          </div>
        </div>

        <div className="dash-booking-actions">
          <button className="dash-btn dash-btn-ghost dash-btn-sm">
            <Download size={14} /> Receipt
          </button>
          <button className="dash-btn dash-btn-ghost dash-btn-sm">
            <MessageSquare size={14} /> Message host
          </button>
          <Link
            to={`/dashboard/bookings/${b.reference}`}
            className="dash-btn dash-btn-outline dash-btn-sm"
          >
            View details <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}

function StatusBadge({ status }) {
  const map = {
    CONFIRMED: { className: 'dash-status confirmed', label: 'Confirmed' },
    PENDING: { className: 'dash-status pending', label: 'Pending' },
    COMPLETED: { className: 'dash-status completed', label: 'Completed' },
    CANCELLED: { className: 'dash-status cancelled', label: 'Cancelled' },
  };
  const s = map[status] || map.PENDING;
  return <span className={s.className}>{s.label}</span>;
}
