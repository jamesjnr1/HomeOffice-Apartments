import { useOutletContext, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowRight, Inbox, Users, CalendarDays, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

export default function AdminOverview() {
  const { displayName, isOwner } = useOutletContext();

  const [stats, setStats] = useState({
    newEnquiries: 0,
    upcomingBookings: 0,
    totalGuests: 0,
    unreadMessages: 0,
  });
  const [recentEnquiries, setRecentEnquiries] = useState([]);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const now = new Date().toISOString();

      // Run all queries in parallel
      const [enquiriesRes, bookingsRes, convosRes, recentRes, upcomingRes] = await Promise.all([
        supabase.from('enquiries').select('id', { count: 'exact', head: true }).eq('status', 'new'),
        supabase.from('bookings').select('id', { count: 'exact', head: true }).gte('check_in', now),
        supabase.from('conversations').select('unread_by_admin'),
        supabase.from('enquiries').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('bookings').select('*').gte('check_in', now).order('check_in', { ascending: true }).limit(3),
      ]);

      const unreadTotal = (convosRes.data || []).reduce((sum, c) => sum + (c.unread_by_admin || 0), 0);

      // Count distinct guests (unique guest_id in bookings + enquiries)
      const { data: guestsData } = await supabase
        .from('bookings')
        .select('guest_email');
      const uniqueGuests = new Set((guestsData || []).map(b => b.guest_email).filter(Boolean));

      setStats({
        newEnquiries: enquiriesRes.count || 0,
        upcomingBookings: bookingsRes.count || 0,
        totalGuests: uniqueGuests.size,
        unreadMessages: unreadTotal,
      });

      setRecentEnquiries(recentRes.data || []);
      setUpcomingBookings(upcomingRes.data || []);
    } catch (err) {
      console.error('Dashboard load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const STAT_CARDS = [
    { label: 'New enquiries', value: stats.newEnquiries, icon: Inbox, link: '/admin/enquiries', color: 'green' },
    { label: 'Upcoming bookings', value: stats.upcomingBookings, icon: CalendarDays, link: '/admin/bookings', color: 'blue' },
    { label: 'Total guests', value: stats.totalGuests, icon: Users, link: '/admin/guests', color: 'purple' },
    ...(isOwner ? [{
      label: 'Unread messages',
      value: stats.unreadMessages,
      icon: TrendingUp,
      link: '/admin/messages',
      color: 'gold',
    }] : []),
  ];

  return (
    <div className="mgmt-page">
      <header className="ad-page-head">
        <span className="ad-eyebrow">OVERVIEW</span>
        <h1>Welcome, {displayName}.</h1>
        <p className="ad-lead">
          {loading ? 'Loading…' : 'Here\'s what needs your attention today.'}
        </p>
      </header>

      <div className="ad-stat-grid">
        {STAT_CARDS.map(s => (
          <Link key={s.label} to={s.link} className={`ad-stat ad-stat-${s.color}`}>
            <s.icon size={20} className="ad-stat-icon" />
            <div className="ad-stat-value">{s.value}</div>
            <div className="ad-stat-label">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="ad-two-col">
        <section className="ad-card">
          <div className="ad-card-head">
            <h2>Recent enquiries</h2>
            <Link to="/admin/enquiries" className="ad-linky">View all <ArrowRight size={14} /></Link>
          </div>
          {recentEnquiries.length === 0 ? (
            <div className="ad-empty"><p>No enquiries yet.</p></div>
          ) : (
            <div className="ad-table-wrap">
              <table className="ad-table">
                <thead>
                  <tr><th>Guest</th><th>Dates</th><th>Apt</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {recentEnquiries.map(e => (
                    <tr key={e.id}>
                      <td>
                        <div className="ad-td-primary">{e.name || e.guest_name}</div>
                        <div className="ad-td-sub">{e.email || e.guest_email}</div>
                      </td>
                      <td className="ad-td-muted">
                        {e.check_in && e.check_out
                          ? `${format(new Date(e.check_in), 'd MMM')} – ${format(new Date(e.check_out), 'd MMM')}`
                          : '—'}
                      </td>
                      <td>{e.apartment || 'Either'}</td>
                      <td><span className={`ad-status ${e.status || 'new'}`}>{e.status || 'new'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="ad-card">
          <div className="ad-card-head">
            <h2>Upcoming check-ins</h2>
            <Link to="/admin/bookings" className="ad-linky">View all <ArrowRight size={14} /></Link>
          </div>
          {upcomingBookings.length === 0 ? (
            <div className="ad-empty"><p>No upcoming bookings.</p></div>
          ) : (
            <div className="ad-booking-list">
              {upcomingBookings.map(b => (
                <div key={b.id} className="ad-booking-row">
                  <div className="ad-booking-apt">{b.apartment || 'Verandah'}</div>
                  <div>
                    <div className="ad-td-primary">{b.guest_name}</div>
                    <div className="ad-td-sub">
                      {b.check_in && b.check_out
                        ? `${format(new Date(b.check_in), 'EEE d MMM')} → ${format(new Date(b.check_out), 'EEE d MMM')}`
                        : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
