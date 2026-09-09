import { Link, useOutletContext } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import {
  MapPin,
  Clock,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

/**
 * Overview
 * Landing screen after login. Reads real bookings scoped to this
 * guest (guest_id = auth.uid()) — see AdminEnquiries.jsx for how a
 * booking gets created and linked to an account.
 *
 * Scope: this site represents ONLY Home-Office Apartments, a single
 * 4-bedroom self-contained property — no other listings.
 */

const APARTMENT = {
  id: 'home-office',
  name: 'Home-Office Apartments',
  location: 'Sunyani, Ghana',
  coverImage: '/images/hero-property.jpg',
};

export default function Overview() {
  const { user, displayName } = useOutletContext();
  const [nextStay, setNextStay] = useState(null);
  const [stats, setStats] = useState({ upcomingBookings: 0, pastStays: 0, nightsWithUs: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    load();

    const sub = supabase
      .channel(`guest-overview-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `guest_id=eq.${user.id}` }, load)
      .subscribe();

    return () => { supabase.removeChannel(sub); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const load = async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('guest_id', user.id)
      .neq('status', 'cancelled')
      .order('check_in', { ascending: true });

    if (!error && data) {
      const now = new Date();
      const bookings = data.map((b) => ({ ...b, checkIn: parseISO(b.check_in), checkOut: parseISO(b.check_out) }));

      const upcoming = bookings.filter((b) => b.checkIn > now);
      const started = bookings.filter((b) => b.checkIn <= now);

      setNextStay(upcoming[0] || null);
      setStats({
        upcomingBookings: upcoming.length,
        pastStays: bookings.filter((b) => b.checkOut < now).length,
        nightsWithUs: started.reduce((sum, b) => sum + b.nights, 0),
      });
    }
    setLoading(false);
  };

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

      {loading ? (
        <div className="dash-empty"><p>Loading…</p></div>
      ) : (
        <>
          {/* Next stay hero */}
          {nextStay && (
            <section className="dash-next-stay">
              <div className="dash-next-stay-img">
                <img
                  src={APARTMENT.coverImage}
                  alt={APARTMENT.name}
                />
                <span className="dash-next-stay-badge">
                  <Clock size={12} /> In {daysUntil} day{daysUntil !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="dash-next-stay-body">
                <span className="dash-eyebrow">YOUR NEXT STAY</span>
                <h2>{APARTMENT.name}</h2>
                <div className="dash-loc">
                  <MapPin size={14} />
                  {APARTMENT.location}
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
          )}

          {/* Stats */}
          <section className="dash-stat-grid">
            <StatCard label="Upcoming" value={stats.upcomingBookings} suffix="bookings" />
            <StatCard label="Past stays" value={stats.pastStays} suffix="visits" />
            <StatCard label="Nights with us" value={stats.nightsWithUs} suffix="total" />
          </section>
        </>
      )}
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
