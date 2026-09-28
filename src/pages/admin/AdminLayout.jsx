import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Inbox, CalendarDays, Users,
  MessageSquare, Tag, TrendingUp, Settings as Cog,
  LogOut, Menu, X, ArrowLeft, BarChart3, Star,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import './admin.css';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [newEnquiries, setNewEnquiries] = useState(0);
  const [bookingsSeenAt, setBookingsSeenAt] = useState(
    () => localStorage.getItem('admin_bookings_seen_at') || '1970-01-01T00:00:00.000Z'
  );
  const [hasNewBookings, setHasNewBookings] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!mounted) return;
      if (!user) { navigate('/admin/signin', { replace: true }); return; }
      const r = user.app_metadata?.role;
      if (r !== 'owner' && r !== 'manager') { navigate('/admin/signin', { replace: true }); return; }
      setUser(user); setRole(r); setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session?.user) navigate('/admin/signin', { replace: true });
      else setUser(session.user);
    });
    return () => { mounted = false; sub?.subscription?.unsubscribe(); };
  }, [navigate]);

  // Live unread-message count for the sidebar badge — refreshed on
  // mount and on any realtime change to the messages table.
  useEffect(() => {
    const loadUnread = async () => {
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('from_admin', false)
        .eq('read_by_admin', false);
      setUnreadMessages(count || 0);
    };
    loadUnread();

    const sub = supabase
      .channel('admin-sidebar-messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, loadUnread)
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, []);

  // Live new-enquiry count for the sidebar badge.
  useEffect(() => {
    const loadNew = async () => {
      const { count } = await supabase
        .from('enquiries')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'new');
      setNewEnquiries(count || 0);
    };
    loadNew();

    const sub = supabase
      .channel('admin-sidebar-enquiries')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'enquiries' }, loadNew)
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, []);

  // A new site booking OR a newly-synced Airbnb block since the admin
  // last opened /admin/bookings gets a small dot on the nav item —
  // 'new' is `created_at`/`first_seen_at` past `bookingsSeenAt`, not a
  // live count (unlike Enquiries/Messages), since Bookings has no
  // single 'unread' concept of its own to count.
  useEffect(() => {
    const checkNewBookings = async () => {
      const [{ count: newSite }, { count: newAirbnb }] = await Promise.all([
        supabase.from('bookings').select('id', { count: 'exact', head: true }).gt('created_at', bookingsSeenAt),
        supabase.from('external_calendar_blocks').select('id', { count: 'exact', head: true }).gt('first_seen_at', bookingsSeenAt),
      ]);
      setHasNewBookings((newSite || 0) + (newAirbnb || 0) > 0);
    };
    checkNewBookings();

    const sub = supabase
      .channel('admin-sidebar-bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, checkNewBookings)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'external_calendar_blocks' }, checkNewBookings)
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [bookingsSeenAt]);

  // Landing on the Bookings page itself clears the dot right away —
  // updates the shared `bookingsSeenAt` state (not just localStorage)
  // so the check above re-runs against the new cutoff immediately,
  // rather than waiting for the next realtime event to notice.
  useEffect(() => {
    if (location.pathname === '/admin/bookings') {
      const now = new Date().toISOString();
      localStorage.setItem('admin_bookings_seen_at', now);
      setBookingsSeenAt(now);
      setHasNewBookings(false);
    }
  }, [location.pathname]);

  const signOut = async () => { await supabase.auth.signOut(); navigate('/'); };

  if (loading) return (
    <div className="mgmt-loading">
      <div className="mgmt-brand-link">
        <img src="/images/logo-icon.png" alt="" className="mgmt-brand-mark" />
        <span className="mgmt-brand-title">Admin</span>
      </div>
      <p>Verifying access…</p>
    </div>
  );

  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin';
  const isOwner = role === 'owner';
  const initial = name.charAt(0).toUpperCase();
  const isRoot = location.pathname === '/admin';

  const NAV = [
    { to: '/admin', icon: LayoutDashboard, label: 'Overview', end: true },
    { to: '/admin/enquiries', icon: Inbox, label: 'Enquiries', badge: newEnquiries || null },
    { to: '/admin/bookings', icon: CalendarDays, label: 'Bookings', dot: hasNewBookings },
    { to: '/admin/guests', icon: Users, label: 'Guests' },
    { to: '/admin/reviews', icon: Star, label: 'Reviews' },
    { to: '/admin/messages', icon: MessageSquare, label: 'Messages', badge: unreadMessages || null },
    { to: '/admin/rates', icon: Tag, label: 'Rates & availability' },
    { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  ];
  const OWNER_NAV = [
    { to: '/admin/revenue', icon: TrendingUp, label: 'Revenue' },
    { to: '/admin/settings', icon: Cog, label: 'Settings' },
  ];

  return (
    <div className="mgmt-shell">
      <div className="mgmt-mobile-bar">
        <a href="/admin" className="mgmt-brand-link">
          <img src="/images/logo-icon.png" alt="" className="mgmt-brand-mark" />
          <span className="mgmt-brand-title">Admin</span>
        </a>
        <button className="mgmt-icon-btn" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu size={20}/>
        </button>
      </div>

      <aside className={`mgmt-sidebar${open ? ' open' : ''}`}>
        <div className="mgmt-sidebar-top">
          <a href="/admin" className="mgmt-brand-link">
            <img src="/images/logo-icon.png" alt="" className="mgmt-brand-mark" />
            <div className="mgmt-brand-text">
              <span className="mgmt-brand-title">Admin</span>
              <span className="mgmt-brand-sub">HomeOffice · LivingSpring</span>
            </div>
          </a>
          <button className="mgmt-icon-btn mgmt-close-btn" onClick={() => setOpen(false)} aria-label="Close">
            <X size={20}/>
          </button>
        </div>

        <div className="mgmt-nav-block">
          <p className="mgmt-nav-label">MANAGE</p>
          <nav>
            {NAV.map(({ to, icon: Icon, label, badge, dot, end }) => (
              <NavLink key={to} to={to} end={!!end}
                className={({ isActive }) => `mgmt-nav-link${isActive ? ' active' : ''}`}
                onClick={() => setOpen(false)}>
                <Icon size={16}/> <span>{label}</span>
                {badge ? <span className="mgmt-badge">{badge}</span> : dot ? <span className="mgmt-nav-dot" aria-label="New"/> : null}
              </NavLink>
            ))}
          </nav>
        </div>

        {isOwner && (
          <div className="mgmt-nav-block">
            <p className="mgmt-nav-label">OWNER ONLY</p>
            <nav>
              {OWNER_NAV.map(({ to, icon: Icon, label }) => (
                <NavLink key={to} to={to}
                  className={({ isActive }) => `mgmt-nav-link${isActive ? ' active' : ''}`}
                  onClick={() => setOpen(false)}>
                  <Icon size={16}/> <span>{label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        )}

        <div className="mgmt-sidebar-foot">
          <div className="mgmt-user-row">
            <div className="mgmt-avatar-sm">{initial}</div>
            <div className="mgmt-user-info">
              <span className="mgmt-user-name">{name}</span>
              <span className={`mgmt-role-pill ${role}`}>{role}</span>
            </div>
          </div>
          <button className="mgmt-signout-btn" onClick={signOut}>
            <LogOut size={14}/> Sign out
          </button>
        </div>
      </aside>

      {open && <div className="mgmt-backdrop" onClick={() => setOpen(false)}/>}

      <main className="mgmt-main">
        {/* Back button — shows on every page except the root overview */}
        {!isRoot && (
          <button className="mgmt-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={16}/> Back
          </button>
        )}
        <Outlet context={{ user, role, isOwner, displayName: name }}/>
      </main>
    </div>
  );
}
