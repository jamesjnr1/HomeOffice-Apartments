import { useOutletContext, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowRight, MessageSquare, Users, Inbox, CalendarDays, UserCheck } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { apartmentName, sourceApartment, sourceChannel } from '../../lib/apartments';
import StatusBadge from '../../components/StatusBadge';
import { stayingLabel } from '../../lib/stays';

/**
 * AdminOverview
 * Matches the live schema — messages, profiles, enquiries, and (as of
 * Phase 2 of the direct-booking rollout) bookings are all real.
 *
 * - Unread messages: real, from messages.read_by_admin
 * - Total guests: real, count of public.profiles — every guest who has
 *   ever signed up or been auto-registered on booking, not just the
 *   ones who happen to have sent a message
 * - New enquiries: real, count of enquiries.status = 'new'
 * - Upcoming bookings: real, count of PAID bookings (status
 *   'confirmed') with check_in today or later — an awaiting_payment
 *   booking isn't a held stay yet
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
  // Who is in the apartments right now: paid site bookings whose dates
  // cover today, plus Airbnb reservations covering today (Airbnb shares
  // dates only, never the guest's name).
  const [stayingNow, setStayingNow] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const [messagesRes, guestsRes, enquiriesRes, bookingsRes, stayRes, airbnbRes] = await Promise.all([
        supabase.from('messages').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('enquiries').select('id', { count: 'exact', head: true }).eq('status', 'new'),
        supabase.from('bookings').select('id', { count: 'exact', head: true }).gte('check_in', today).eq('status', 'confirmed'),
        supabase.from('bookings')
          .select('id, reference, guest_name, guest_phone, apartment, check_in, check_out, guests, status')
          .in('status', ['confirmed', 'completed'])
          .lte('check_in', today).gte('check_out', today)
          .order('check_out', { ascending: true }),
        supabase.from('external_calendar_blocks')
          .select('id, source, start_date, end_date, summary')
          .lte('start_date', today).gte('end_date', today),
      ]);

      setStayingNow([
        ...(stayRes.data || []).map((b) => ({ ...b, kind: 'site' })),
        ...(airbnbRes.data || [])
          // Airbnb marks guest stays "Reserved" and host-blocked days
          // "Not available"; Booking.com's export labels every booking
          // "CLOSED - Not available", so all its rows count.
          .filter((x) => sourceChannel(x.source) !== 'Airbnb' || /reserved/i.test(x.summary || ''))
          .map((x) => ({
            id: x.id, kind: 'airbnb', channel: sourceChannel(x.source),
            apartment: sourceApartment(x.source),
            check_in: x.start_date, check_out: x.end_date,
          })),
      ]);

      const { data, error } = messagesRes;
      if (!error && data) {
        const unread = data.filter(m => !m.from_admin && !m.read_by_admin).length;

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
          totalGuests: guestsRes.count || 0,
          newEnquiries: enquiriesRes.count || 0,
          upcomingBookings: bookingsRes.count || 0,
        });
        setRecentThreads(recent);
      }
    } catch {
      // A network-level failure (not just a Supabase error payload)
      // would otherwise leave this stuck on "Loading…" forever.
    } finally {
      setLoading(false);
    }
  };

  const STAT_CARDS = [
    { label: 'Unread messages', value: stats.unreadMessages, link: '/admin/messages', icon: MessageSquare },
    { label: 'Total guests', value: stats.totalGuests, link: '/admin/guests', icon: Users },
    { label: 'New enquiries', value: stats.newEnquiries, link: '/admin/enquiries', icon: Inbox },
    { label: 'Upcoming bookings', value: stats.upcomingBookings, link: '/admin/bookings', icon: CalendarDays },
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
          <Link key={s.label} to={s.link} className="mgmt-stat">
            <s.icon size={22} strokeWidth={1.75} className="mgmt-stat-icon" />
            <div className="mgmt-stat-value">{s.value}</div>
            <div className="mgmt-stat-label">{s.label}</div>
          </Link>
        ))}
      </div>

      <section className="mgmt-card" style={{ marginBottom: 24 }}>
        <div className="mgmt-card-head">
          <h2><UserCheck size={18} style={{ verticalAlign: -3, marginRight: 6 }} />Staying now</h2>
          <Link to="/admin/bookings" className="mgmt-linky">All bookings <ArrowRight size={14} /></Link>
        </div>
        {stayingNow.length === 0 ? (
          <div className="mgmt-empty"><p>{loading ? 'Loading…' : 'No guests checked in right now.'}</p></div>
        ) : (
          <div className="mgmt-table-wrap">
            <table className="mgmt-table">
              <thead>
                <tr><th>Guest</th><th>Apartment</th><th>Checked in</th><th>Leaves</th><th>Status</th></tr>
              </thead>
              <tbody>
                {stayingNow.map((b) => (
                  <tr key={b.id} className="mgmt-row-current">
                    <td>
                      <div className="mgmt-td-primary">{b.kind === 'site' ? b.guest_name : `${b.channel} guest`}</div>
                      <div className="mgmt-td-sub">{b.kind === 'site' ? [b.reference, b.guest_phone].filter(Boolean).join(' · ') : `Booked on ${b.channel}`}</div>
                    </td>
                    <td className="mgmt-td-sub">{apartmentName(b.apartment)}</td>
                    <td className="mgmt-td-nowrap">{format(parseISO(b.check_in), 'EEE d MMM')}</td>
                    <td className="mgmt-td-nowrap">{format(parseISO(b.check_out), 'EEE d MMM')}</td>
                    <td><StatusBadge status="checked_in" label={stayingLabel(b)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

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
                <tr><th>Guest</th><th>Last message</th></tr>
              </thead>
              <tbody>
                {recentThreads.map(m => (
                  <tr key={m.guest_id}>
                    <td>
                      <div className="mgmt-td-primary">{m.guest_name || 'Guest'}</div>
                      <div className="mgmt-td-sub">{m.guest_email || ''}</div>
                    </td>
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
