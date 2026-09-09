import { useState, useEffect } from 'react';
import { Eye, Inbox, CalendarCheck } from 'lucide-react';
import { format, subDays, isAfter } from 'date-fns';
import { supabase } from '../../lib/supabase';

/**
 * AdminAnalytics — the funnel: visitors -> enquiries -> bookings, all
 * in one place instead of a separate analytics dashboard. Visitors
 * come from site_visits (see VisitTracker.jsx and
 * supabase/migrations/20260909180000_create_site_visits.sql, a
 * lightweight self-hosted page-view log — not a full analytics
 * product, see that migration's notes on what it doesn't do, like
 * bot filtering). Enquiries and bookings are the same real tables the
 * rest of the admin panel already uses. Kept live via realtime
 * subscriptions on all three tables.
 */
export default function AdminAnalytics() {
  const [visits, setVisits] = useState([]);
  const [enquiriesTotal, setEnquiriesTotal] = useState(0);
  const [bookingsTotal, setBookingsTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();

    const sub = supabase
      .channel('admin-analytics')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_visits' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'enquiries' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, load)
      .subscribe();

    return () => { supabase.removeChannel(sub); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async () => {
    try {
      const [visitsRes, enquiriesRes, bookingsRes] = await Promise.all([
        supabase.from('site_visits').select('session_id, created_at').order('created_at', { ascending: true }),
        supabase.from('enquiries').select('id', { count: 'exact', head: true }),
        supabase.from('bookings').select('id', { count: 'exact', head: true }).neq('status', 'cancelled'),
      ]);

      if (visitsRes.data) setVisits(visitsRes.data);
      setEnquiriesTotal(enquiriesRes.count || 0);
      setBookingsTotal(bookingsRes.count || 0);
    } catch {
      // A network-level failure (not just a Supabase error payload)
      // would otherwise leave this stuck on "Loading…" forever.
    } finally {
      setLoading(false);
    }
  };

  const allTimeViews = visits.length;
  const allTimeVisitors = new Set(visits.map((v) => v.session_id)).size;

  const since30 = subDays(new Date(), 30);
  const last30 = visits.filter((v) => isAfter(new Date(v.created_at), since30));
  const last30Visitors = new Set(last30.map((v) => v.session_id)).size;

  // Distinct visitors per day, last 30 days
  const dayBuckets = {};
  for (let i = 29; i >= 0; i--) {
    const key = format(subDays(new Date(), i), 'yyyy-MM-dd');
    dayBuckets[key] = new Set();
  }
  last30.forEach((v) => {
    const key = format(new Date(v.created_at), 'yyyy-MM-dd');
    if (dayBuckets[key]) dayBuckets[key].add(v.session_id);
  });
  const days = Object.entries(dayBuckets).map(([date, set]) => ({ date, v: set.size }));
  const max = Math.max(...days.map((d) => d.v), 0);

  const enquiryRate = allTimeVisitors > 0 ? Math.round((enquiriesTotal / allTimeVisitors) * 100) : 0;
  const bookingRate = enquiriesTotal > 0 ? Math.round((bookingsTotal / enquiriesTotal) * 100) : 0;

  return (
    <div className="mgmt-page">
      <header className="mgmt-page-head">
        <span className="mgmt-eyebrow">ANALYTICS</span>
        <h1>How people find and book</h1>
        <p className="mgmt-lead">
          {loading ? 'Loading…' : 'Visitors, enquiries, and bookings — all time, updated live.'}
        </p>
      </header>

      {/* Funnel */}
      <div className="mgmt-funnel">
        <div className="mgmt-funnel-step">
          <div className="mgmt-stat mgmt-stat-blue">
            <Eye size={20} className="mgmt-stat-icon" />
            <div className="mgmt-stat-value">{allTimeVisitors.toLocaleString()}</div>
            <div className="mgmt-stat-label">Visitors (all time)</div>
          </div>
        </div>
        <div className="mgmt-funnel-arrow">→ {enquiryRate}%</div>
        <div className="mgmt-funnel-step">
          <div className="mgmt-stat mgmt-stat-green">
            <Inbox size={20} className="mgmt-stat-icon" />
            <div className="mgmt-stat-value">{enquiriesTotal.toLocaleString()}</div>
            <div className="mgmt-stat-label">Enquiries sent</div>
          </div>
        </div>
        <div className="mgmt-funnel-arrow">→ {bookingRate}%</div>
        <div className="mgmt-funnel-step">
          <div className="mgmt-stat mgmt-stat-gold">
            <CalendarCheck size={20} className="mgmt-stat-icon" />
            <div className="mgmt-stat-value">{bookingsTotal.toLocaleString()}</div>
            <div className="mgmt-stat-label">Bookings made</div>
          </div>
        </div>
      </div>

      <div className="mgmt-card">
        <div className="mgmt-card-head">
          <h2 className="mgmt-card-h" style={{ marginBottom: 0 }}>Visitors, last 30 days</h2>
          <span className="mgmt-td-muted">
            {last30Visitors.toLocaleString()} visitors · {last30.length.toLocaleString()} page views
          </span>
        </div>
        {!loading && allTimeViews === 0 ? (
          <div className="mgmt-empty"><p>No visits recorded yet — this fills in as people browse the public site.</p></div>
        ) : (
          <div className="mgmt-bar-chart mgmt-bar-chart-dense">
            {days.map((d) => (
              <div key={d.date} className="mgmt-bar-col">
                <div className="mgmt-bar-wrap">
                  <div
                    className="mgmt-bar"
                    style={{ height: max > 0 ? `${(d.v / max) * 100}%` : '0%' }}
                    title={`${format(new Date(d.date), 'd MMM')}: ${d.v} visitor${d.v === 1 ? '' : 's'}`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="mgmt-card-sub" style={{ marginTop: 14, marginBottom: 0 }}>
          "Visitor" is approximate — a random id kept in this browser's storage, not a verified
          person. No cookies, no third-party tracking, and admin/guest dashboard activity isn't
          counted.
        </p>
      </div>
    </div>
  );
}
