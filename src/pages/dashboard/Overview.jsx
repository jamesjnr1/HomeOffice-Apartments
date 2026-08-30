import { Link, useOutletContext } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { differenceInCalendarDays, format } from 'date-fns';
import {
  MapPin,
  Clock,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';

/**
 * Overview
 * Landing screen after login.
 *
 * Scope: this site represents ONLY Home-Office Apartments, a single
 * 4-bedroom self-contained property — no other listings.
 *
 * TODO(supabase): replace MOCK_* data with:
 *   supabase.from('bookings').select('*').eq('guest_id', user.id)
 */

const APARTMENT = {
  id: 'home-office',
  name: 'Home-Office Apartments',
  location: 'Sunyani, Ghana',
  coverImage: '/images/living-room-1.jpg',
  highlights: ['Sleeps 4', '4 bedrooms · 5 beds · 4 baths', 'Fibre Wi-Fi'],
};

const MOCK_NEXT_STAY = {
  reference: 'HO-8FQ2P',
  apartment: APARTMENT,
  checkIn: new Date(Date.now() + 6 * 86400000),
  checkOut: new Date(Date.now() + 10 * 86400000),
  nights: 4,
  guests: 2,
};

const MOCK_STATS = {
  upcomingBookings: 1,
  pastStays: 2,
  nightsWithUs: 11,
};

export default function Overview() {
  const { displayName } = useOutletContext();
  const [nextStay, setNextStay] = useState(null);
  const [stats, setStats] = useState(MOCK_STATS);

  useEffect(() => {
    // TODO(supabase): fetch real data here
    setNextStay(MOCK_NEXT_STAY);
    setStats(MOCK_STATS);
  }, []);

  const daysUntil = nextStay
    ? differenceInCalendarDays(nextStay.checkIn, new Date())
    : null;

  return (
    <div className="dash-page">
      <header className="dash-page-head">
        <span className="dash-eyebrow">DASHBOARD</span>
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
            <span className="dash-eyebrow">YOUR NEXT STAY</span>
            <h2>{nextStay.apartment.name}</h2>
            <div className="dash-loc">
              <MapPin size={14} />
              {nextStay.apartment.location}
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
                to="/dashboard/bookings"
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

      {/* The apartment */}
      <section>
        <div className="dash-section-head">
          <h2>The apartment</h2>
          <Link to="/apartments" className="dash-linky">
            More about the apartment <ArrowRight size={14} />
          </Link>
        </div>

        <div className="dash-rec-grid" style={{ gridTemplateColumns: '1fr', maxWidth: 420 }}>
          <Link to="/apartments" className="dash-rec-card">
            <div className="dash-rec-img">
              <img src={APARTMENT.coverImage} alt={APARTMENT.name} />
            </div>
            <div className="dash-rec-body">
              <h3>{APARTMENT.name}</h3>
              <div className="dash-loc">
                <MapPin size={12} />
                {APARTMENT.location}
              </div>
              <div className="dash-rec-tags">
                {APARTMENT.highlights.map((h) => (
                  <span key={h} className="dash-tag">{h}</span>
                ))}
              </div>
            </div>
          </Link>
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
