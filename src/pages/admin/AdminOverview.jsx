import { useOutletContext, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowRight, Inbox, Users, CalendarDays, MessageSquare,
  MapPin, DoorOpen, TrendingUp, Sparkles, Wifi, KeyRound, ScrollText, Info,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

/**
 * AdminOverview — the admin landing dashboard. Built around a set of
 * reference dashboards (property/hotel management + booking admin
 * panels: a photo-led property card, a colorful highlight card, a
 * compact stat row, an activity feed, a readiness/compliance-style
 * checklist, and a breakdown chart), using this site's own real data
 * throughout — nothing here is decorative or hardcoded:
 *   - Hero card: the actual apartment photo plus today's occupancy,
 *     computed live from bookings spanning today (there's only ever
 *     one "room" to be vacant or occupied — see APARTMENT in
 *     Bookings.jsx/Overview.jsx).
 *   - Highlight card: this month's revenue (owner-only, same
 *     restriction AdminRevenue.jsx already enforces) or a "needs
 *     attention" nudge for managers, who don't see revenue.
 *   - Stat row: unread messages / guests / new enquiries / upcoming
 *     bookings.
 *   - Activity feed: the same "most recent message per guest" data as
 *     before, restyled as a feed with colored avatars instead of a
 *     plain table.
 *   - Booking-status donut: confirmed/pending/completed/cancelled
 *     breakdown.
 *   - Check-in readiness: reads property_details (the same row
 *     AdminSettings.jsx edits and guests see once they have a
 *     confirmed stay — see property_details' RLS policy) and flags
 *     which fields are still blank, so an empty WiFi password or
 *     house-rules field doesn't go unnoticed until a guest asks.
 */

const STATUS_COLORS = {
  confirmed: '#2d6a4f',
  pending: '#b58a4a',
  completed: '#9aa19d',
  cancelled: '#b3261e',
};

const AVATAR_COLORS = [
  { bg: '#e2ece6', fg: '#2d6a4f' },
  { bg: '#dbeafe', fg: '#2563eb' },
  { bg: '#ede9fe', fg: '#7c3aed' },
  { bg: '#fef3c7', fg: '#b58a4a' },
  { bg: '#fbe9e7', fg: '#b3261e' },
];
function avatarColor(seed) {
  const code = (seed || '?').charCodeAt(0) || 0;
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function AdminOverview() {
  const { displayName, isOwner } = useOutletContext();
  const [stats, setStats] = useState({
    unreadMessages: 0,
    totalGuests: 0,
    newEnquiries: 0,
    upcomingBookings: 0,
  });
  const [recentThreads, setRecentThreads] = useState([]);
  const [today, setToday] = useState(null); // { occupied, guestName, until } | null while unknown
  const [monthRevenue, setMonthRevenue] = useState(0);
  const [monthNights, setMonthNights] = useState(0);
  const [statusCounts, setStatusCounts] = useState({ confirmed: 0, pending: 0, completed: 0, cancelled: 0 });
  const [checkIn, setCheckIn] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    try {
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0, 10);

      const [messagesRes, enquiriesRes, upcomingRes, currentRes, monthRes, allBookingsRes, detailsRes] = await Promise.all([
        supabase.from('messages').select('*').order('created_at', { ascending: false }),
        supabase.from('enquiries').select('id', { count: 'exact', head: true }).eq('status', 'new'),
        supabase.from('bookings').select('id', { count: 'exact', head: true }).gte('check_in', todayStr).neq('status', 'cancelled'),
        // Today's occupancy: a non-cancelled booking spanning right now.
        supabase.from('bookings').select('guest_name, check_out').neq('status', 'cancelled').lte('check_in', todayStr).gt('check_out', todayStr).maybeSingle(),
        supabase.from('bookings').select('total, nights').neq('status', 'cancelled').gte('check_in', monthStart).lt('check_in', nextMonth),
        supabase.from('bookings').select('status'),
        supabase.from('property_details').select('*').eq('id', 'home-office').maybeSingle(),
      ]);

      const { data, error } = messagesRes;
      if (!error && data) {
        const unread = data.filter(m => !m.from_admin && !m.read_by_admin).length;
        const uniqueGuests = new Set(data.map(m => m.guest_id).filter(Boolean));

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
          newEnquiries: enquiriesRes.count || 0,
          upcomingBookings: upcomingRes.count || 0,
        });
        setRecentThreads(recent);
      }

      setToday(currentRes.data ? { occupied: true, guestName: currentRes.data.guest_name, until: currentRes.data.check_out } : { occupied: false });

      if (monthRes.data) {
        setMonthRevenue(monthRes.data.reduce((sum, b) => sum + Number(b.total), 0));
        setMonthNights(monthRes.data.reduce((sum, b) => sum + (b.nights || 0), 0));
      }

      if (allBookingsRes.data) {
        const counts = { confirmed: 0, pending: 0, completed: 0, cancelled: 0 };
        for (const b of allBookingsRes.data) if (counts[b.status] !== undefined) counts[b.status]++;
        setStatusCounts(counts);
      }

      if (detailsRes.data) setCheckIn(detailsRes.data);
    } catch {
      // A network-level failure (not just a Supabase error payload)
      // would otherwise leave this stuck on "Loading…" forever.
    } finally {
      setLoading(false);
    }
  };

  const STAT_CARDS = [
    { label: 'Unread messages', value: stats.unreadMessages, icon: MessageSquare, link: '/admin/messages', color: 'green' },
    { label: 'Total guests', value: stats.totalGuests, icon: Users, link: '/admin/guests', color: 'purple' },
    { label: 'New enquiries', value: stats.newEnquiries, icon: Inbox, link: '/admin/enquiries', color: 'blue' },
    { label: 'Upcoming bookings', value: stats.upcomingBookings, icon: CalendarDays, link: '/admin/bookings', color: 'gold' },
  ];

  const READINESS = checkIn ? [
    { label: 'WiFi details', icon: Wifi, set: Boolean(checkIn.wifi_network?.trim() || checkIn.wifi_password?.trim()) },
    { label: 'Access instructions', icon: KeyRound, set: Boolean(checkIn.access_instructions?.trim()) },
    { label: 'House rules', icon: ScrollText, set: Boolean(checkIn.house_rules?.trim()) },
    { label: 'Good-to-know notes', icon: Info, set: Boolean(checkIn.host_notes?.trim()) },
  ] : [];

  return (
    <div className="mgmt-page">
      <header className="mgmt-page-head">
        <span className="mgmt-eyebrow">OVERVIEW</span>
        <h1>{greeting()}, {displayName}!</h1>
        <p className="mgmt-lead">
          {loading ? 'Loading…' : "It's a good day to stay on top of enquiries and bookings."}
        </p>
      </header>

      <div className="mgmt-hero-row">
        <section className="mgmt-card mgmt-hero-card">
          <div className="mgmt-hero-top">
            <div className="mgmt-hero-photo-row">
              <img src="/images/hero-property.jpg" alt="Home-Office Apartments" className="mgmt-hero-photo" />
              <div>
                <span className="mgmt-hero-label">
                  <MapPin size={12} /> Home-Office Apartments — today
                </span>
                {loading ? (
                  <div className="mgmt-hero-value">…</div>
                ) : today?.occupied ? (
                  <>
                    <div className="mgmt-hero-value">Occupied</div>
                    <p className="mgmt-hero-sub">{today.guestName} · checking out {today.until}</p>
                  </>
                ) : (
                  <>
                    <div className="mgmt-hero-value">Vacant</div>
                    <p className="mgmt-hero-sub">No one checked in today — ready for a new booking.</p>
                  </>
                )}
              </div>
            </div>
            <span className={`mgmt-hero-badge ${today?.occupied ? 'occupied' : 'vacant'}`}>
              <DoorOpen size={13} /> {today?.occupied ? 'Occupied' : 'Vacant'}
            </span>
          </div>
          <div className="mgmt-hero-actions">
            <Link to="/admin/bookings" className="mgmt-btn mgmt-btn-primary">Manage bookings</Link>
            <Link to="/admin/enquiries" className="mgmt-btn mgmt-btn-outline">Review enquiries</Link>
          </div>
        </section>

        <section className="mgmt-highlight-card">
          <div className="mgmt-highlight-glow" />
          {isOwner ? (
            <>
              <span className="mgmt-highlight-label"><TrendingUp size={13} /> This month</span>
              <div className="mgmt-highlight-value">GHS {loading ? '—' : monthRevenue.toLocaleString()}</div>
              <p className="mgmt-highlight-sub">{loading ? '' : `${monthNights} night${monthNights === 1 ? '' : 's'} booked so far`}</p>
              <Link to="/admin/revenue" className="mgmt-highlight-btn">Full revenue <ArrowRight size={14} /></Link>
            </>
          ) : (
            <>
              <span className="mgmt-highlight-label"><Sparkles size={13} /> Needs attention</span>
              <div className="mgmt-highlight-value">{loading ? '—' : stats.newEnquiries + stats.unreadMessages}</div>
              <p className="mgmt-highlight-sub">new enquiries &amp; unread messages combined</p>
              <Link to="/admin/enquiries" className="mgmt-highlight-btn">Review now <ArrowRight size={14} /></Link>
            </>
          )}
        </section>
      </div>

      <div className="mgmt-mini-stat-grid">
        {STAT_CARDS.map(s => (
          <Link key={s.label} to={s.link} className="mgmt-mini-stat">
            <span className={`mgmt-icon-badge mgmt-icon-badge-${s.color}`}><s.icon size={16} /></span>
            <span className="mgmt-mini-stat-text">
              <span className="mgmt-mini-stat-value">{s.value}</span>
              <span className="mgmt-mini-stat-label">{s.label}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="mgmt-two-col">
        <section className="mgmt-card">
          <div className="mgmt-card-head">
            <h2>Recent conversations</h2>
            <Link to="/admin/messages" className="mgmt-linky">Open messages <ArrowRight size={14} /></Link>
          </div>
          {recentThreads.length === 0 ? (
            <div className="mgmt-empty"><p>No messages yet. Guests can message you from their dashboard.</p></div>
          ) : (
            <ul className="mgmt-activity-list">
              {recentThreads.map(m => {
                const c = avatarColor(m.guest_name);
                const unread = !m.from_admin && !m.read_by_admin;
                return (
                  <li key={m.guest_id} className="mgmt-activity-item">
                    <span className="mgmt-activity-avatar" style={{ background: c.bg, color: c.fg }}>
                      {(m.guest_name || 'G').charAt(0).toUpperCase()}
                    </span>
                    <span className="mgmt-activity-body">
                      <span className="mgmt-activity-top">
                        <span className="mgmt-activity-name">{m.guest_name || 'Guest'}</span>
                        <span className="mgmt-activity-time">{formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}</span>
                      </span>
                      <span className="mgmt-activity-preview">{m.body}</span>
                    </span>
                    {unread && <span className="mgmt-activity-dot" />}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="mgmt-card">
          <div className="mgmt-card-head">
            <h2>All bookings</h2>
            <Link to="/admin/bookings" className="mgmt-linky">Open bookings <ArrowRight size={14} /></Link>
          </div>
          <BookingDonut counts={statusCounts} loading={loading} />
        </section>
      </div>

      <section className="mgmt-card">
        <div className="mgmt-card-head">
          <h2>Check-in readiness</h2>
          {isOwner && <Link to="/admin/settings" className="mgmt-linky">Edit details <ArrowRight size={14} /></Link>}
        </div>
        {!checkIn ? (
          <div className="mgmt-empty"><p>{loading ? 'Loading…' : "Couldn't load check-in details."}</p></div>
        ) : (
          <div className="mgmt-checklist-row">
            {READINESS.map(item => (
              <div key={item.label} className="mgmt-checklist-item">
                <span className={`mgmt-checklist-icon ${item.set ? 'set' : 'missing'}`}><item.icon size={15} /></span>
                <span className="mgmt-checklist-label">{item.label}</span>
                <span className={`mgmt-checklist-pill ${item.set ? 'set' : 'missing'}`}>{item.set ? 'Set' : 'Missing'}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function BookingDonut({ counts, loading }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  if (!loading && total === 0) {
    return <div className="mgmt-empty"><p>No bookings yet — confirmed enquiries will show up here.</p></div>;
  }

  const r = 52;
  const circumference = 2 * Math.PI * r;
  let cumulative = 0;
  const segments = Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => {
      const pct = total > 0 ? count / total : 0;
      const dash = pct * circumference;
      const offset = cumulative * circumference;
      cumulative += pct;
      return { status, count, dash, offset, color: STATUS_COLORS[status] };
    });

  return (
    <div className="mgmt-donut-row">
      <div className="mgmt-donut-wrap">
        <svg viewBox="0 0 120 120" width="140" height="140">
          <circle cx="60" cy="60" r={r} fill="none" stroke="#f0f2ef" strokeWidth="16" />
          {segments.map(s => (
            <circle
              key={s.status}
              cx="60" cy="60" r={r} fill="none"
              stroke={s.color} strokeWidth="16"
              strokeDasharray={`${s.dash} ${circumference - s.dash}`}
              strokeDashoffset={-s.offset}
              transform="rotate(-90 60 60)"
              strokeLinecap="butt"
            />
          ))}
        </svg>
        <div className="mgmt-donut-center">
          <span className="mgmt-donut-total">{total}</span>
          <span className="mgmt-donut-total-label">bookings</span>
        </div>
      </div>
      <ul className="mgmt-donut-legend">
        {Object.entries(counts).map(([status, count]) => (
          <li key={status}>
            <span className="mgmt-donut-dot" style={{ background: STATUS_COLORS[status] }} />
            {status.charAt(0).toUpperCase() + status.slice(1)}
            <span className="mgmt-donut-legend-count">{count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
