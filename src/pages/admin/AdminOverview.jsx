import { useOutletContext, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowRight, Inbox, Users, CalendarDays, MessageSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';

/**
 * AdminOverview
 * Matches the REAL live schema: only `messages` table exists right now
 * (no `enquiries`, no `bookings`, no `conversations`).
 *
 * - Unread messages: real, from messages.read_by_admin
 * - Total guests: real, distinct guest_id in messages
 * - New enquiries / upcoming bookings: 0 until those tables are built
 */

export default function AdminOverview() {
  const { displayName } = useOutletContext();
  const [stats, setStats] = useState({
    unreadMessages: 0,
    totalGuests: 0,
    newEnquiries: 0,
    upcomingBookings: 0,
  });
  const [recentThreads, setRecentThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const unread = data.filter(m => !m.from_admin && !m.read_by_admin).length;
      const uniqueGuests = new Set(data.map(m => m.guest_id).filter(Boolean));

      // Build recent threads (most recent message per guest)
      const seen = new Set();
      const recent = [];
      for (const m of data) {
        if (!m.guest_id || seen.has(m.guest_id)) continue;
        seen.add(m.guest_id);
        recent.push(m);
        if (recent.length >= 5) break;
      }

      setStats({
        unreadMessages: unread,
        totalGuests: uniqueGuests.size,
        newEnquiries: 0,
        upcomingBookings: 0,
      });
      setRecentThreads(recent);
    }
    setLoading(false);
  };

  const STAT_CARDS = [
    { label: 'Unread messages', value: stats.unreadMessages, icon: MessageSquare, link: '/admin/messages', color: 'green' },
    { label: 'Total guests', value: stats.totalGuests, icon: Users, link: '/admin/guests', color: 'purple' },
    { label: 'New enquiries', value: stats.newEnquiries, icon: Inbox, link: '/admin/enquiries', color: 'blue' },
    { label: 'Upcoming bookings', value: stats.upcomingBookings, icon: CalendarDays, link: '/admin/bookings', color: 'gold' },
  ];

  return (
    <div className="mgmt-page">
      <header className="mgmt-page-head">
        <span className="mgmt-eyebrow">OVERVIEW</span>
        <h1>Welcome, {displayName}.</h1>
        <p className="mgmt-lead">
          {loading ? 'Loading…' : "Here's what needs your attention today."}
        </p>
      </header>

      <div className="mgmt-stat-grid">
        {STAT_CARDS.map(s => (
          <Link key={s.label} to={s.link} className={`mgmt-stat mgmt-stat-${s.color}`}>
            <s.icon size={20} className="mgmt-stat-icon" />
            <div className="mgmt-stat-value">{s.value}</div>
            <div className="mgmt-stat-label">{s.label}</div>
          </Link>
        ))}
      </div>

      <section className="mgmt-card">
        <div className="mgmt-card-head">
          <h2>Recent conversations</h2>
          <Link to="/admin/messages" className="mgmt-linky">Open messages <ArrowRight size={14} /></Link>
        </div>
        {recentThreads.length === 0 ? (
          <div className="mgmt-empty"><p>No messages yet. Guests can message you from their dashboard.</p></div>
        ) : (
          <div className="mgmt-table-wrap">
            <table className="mgmt-table">
              <thead>
                <tr><th>Guest</th><th>Apartment</th><th>Last message</th></tr>
              </thead>
              <tbody>
                {recentThreads.map(m => (
                  <tr key={m.guest_id}>
                    <td>
                      <div className="mgmt-td-primary">{m.guest_name || 'Guest'}</div>
                      <div className="mgmt-td-sub">{m.guest_email || ''}</div>
                    </td>
                    <td>{m.apartment || '—'}</td>
                    <td className="mgmt-td-muted" style={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.body}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
