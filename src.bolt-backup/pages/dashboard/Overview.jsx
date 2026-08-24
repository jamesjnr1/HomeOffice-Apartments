import { Link, useOutletContext } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { differenceInCalendarDays, format } from 'date-fns';
import {
  MapPin,
  Clock,
  ArrowRight,
  Wifi,
  Monitor,
  Coffee,
  MessageSquare,
} from 'lucide-react';

/**
 * Overview
 * Landing screen after login. Shows the user's "next stay" as a hero card,
 * quick stats, and a small recommended-for-you row.
 *
 * TODO(supabase): replace MOCK_* data with:
 *   supabase.from('bookings').select('*, apartments(*)').eq('guest_id', user.id)
 *   supabase.from('apartments').select('*').eq('published', true).limit(3)
 */

const MOCK_NEXT_STAY = {
  reference: 'HO-8FQ2P',
  apartment: {
    name: 'The North Ridge Loft',
    city: 'Sunyani',
    country: 'Ghana',
    coverImage:
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=80',
  },
  checkIn: new Date(Date.now() + 6 * 86400000), // 6 days out
  checkOut: new Date(Date.now() + 10 * 86400000),
  nights: 4,
  guests: 2,
};

const MOCK_STATS = {
  upcomingBookings: 2,
  pastStays: 7,
  nightsWithUs: 34,
};

const MOCK_RECOMMENDED = [
  {
    id: 'a-1',
    name: 'Garden Studio',
    city: 'Sunyani',
    pricePerNight: 480,
    coverImage:
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=80',
    highlights: ['Fast Wi-Fi', 'Standing desk'],
  },
  {
    id: 'a-2',
    name: 'Riverside Suite',
    city: 'Sunyani',
    pricePerNight: 620,
    coverImage:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80',
    highlights: ['Fibre internet', 'Ergo chair'],
  },
  {
    id: 'a-3',
    name: 'The Verandah Apartment',
    city: 'Sunyani',
    pricePerNight: 540,
    coverImage:
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=80',
    highlights: ['Private balcony', 'Dual monitor'],
  },
];

export default function Overview() {
  const { displayName } = useOutletContext();
  const [nextStay, setNextStay] = useState(null);
  const [stats, setStats] = useState(MOCK_STATS);
  const [recommended, setRecommended] = useState([]);

  useEffect(() => {
    // TODO(supabase): fetch real data here
    setNextStay(MOCK_NEXT_STAY);
    setStats(MOCK_STATS);
    setRecommended(MOCK_RECOMMENDED);
  }, []);

  const daysUntil = nextStay
    ? differenceInCalendarDays(nextStay.checkIn, new Date())
    : null;

  return (
    <div className="dash-page">
      <header className="dash-page-head">
        <p className="dash-eyebrow">DASHBOARD</p>
        <h1>Welcome back, {displayName}.</h1>
        <p className="dash-lead">Here's what's coming up.</p>
      </header>

      {/* Next stay hero */}
      {nextStay ? (
        <section className="dash-next-stay">
          <div className="dash-next-stay-img">
            <img
              src={nextStay.apartment.coverImage}
              alt={nextStay.apartment.name}
            />
            <span className="dash-next-stay-badge">
              <Clock size={12} /> In {daysUntil} day{daysUntil !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="dash-next-stay-body">
            <p className="dash-eyebrow">YOUR NEXT STAY</p>
            <h2>{nextStay.apartment.name}</h2>
            <div className="dash-loc">
              <MapPin size={14} />
              {nextStay.apartment.city}, {nextStay.apartment.country}
            </div>

            <div className="dash-next-stay-details">
              <div>
                <div className="dash-detail-label">CHECK-IN</div>
                <div className="dash-detail-value">
                  {format(nextStay.checkIn, 'EEE, d MMM')}
                </div>
              </div>
              <div>
                <div className="dash-detail-label">CHECK-OUT</div>
                <div className="dash-detail-value">
                  {format(nextStay.checkOut, 'EEE, d MMM')}
                </div>
              </div>
              <div>
                <div className="dash-detail-label">NIGHTS</div>
                <div className="dash-detail-value">{nextStay.nights}</div>
              </div>
              <div>
                <div className="dash-detail-label">GUESTS</div>
                <div className="dash-detail-value">{nextStay.guests}</div>
              </div>
            </div>

            <div className="dash-next-stay-actions">
              <Link
                to={`/dashboard/bookings/${nextStay.reference}`}
                className="dash-btn dash-btn-primary"
              >
                View trip <ArrowRight size={16} />
              </Link>
              <Link
                to="/dashboard/messages"
                className="dash-btn dash-btn-ghost"
              >
                <MessageSquare size={16} /> Message host
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {/* Stats */}
      <section className="dash-stat-grid">
        <StatCard label="Upcoming" value={stats.upcomingBookings} suffix="bookings" />
        <StatCard label="Past stays" value={stats.pastStays} suffix="visits" />
        <StatCard label="Nights with us" value={stats.nightsWithUs} suffix="total" />
      </section>

      {/* Recommended */}
      <section>
        <div className="dash-section-head">
          <h2>Recommended for you</h2>
          <Link to="/explore" className="dash-linky">
            View all apartments <ArrowRight size={14} />
          </Link>
        </div>

        <div className="dash-rec-grid">
          {recommended.map((a) => (
            <Link
              key={a.id}
              to={`/apartments/${a.id}`}
              className="dash-rec-card"
            >
              <div className="dash-rec-img">
                <img src={a.coverImage} alt={a.name} />
              </div>
              <div className="dash-rec-body">
                <h3>{a.name}</h3>
                <div className="dash-loc">
                  <MapPin size={12} />
                  {a.city}
                </div>
                <div className="dash-rec-tags">
                  {a.highlights.map((h) => (
                    <span key={h} className="dash-tag">
                      {h.includes('Wi-Fi') || h.includes('internet') ? (
                        <Wifi size={12} />
                      ) : h.includes('desk') || h.includes('monitor') ? (
                        <Monitor size={12} />
                      ) : (
                        <Coffee size={12} />
                      )}
                      {h}
                    </span>
                  ))}
                </div>
                <div className="dash-rec-price">
                  <strong>GHS {a.pricePerNight}</strong>
                  <span> / night</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, suffix }) {
  return (
    <div className="dash-stat">
      <div className="dash-stat-label">{label}</div>
      <div className="dash-stat-value">{value}</div>
      <div className="dash-stat-suffix">{suffix}</div>
    </div>
  );
}
