import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import {
  LayoutDashboard, CalendarDays,
  MessageSquare, UserCircle, LogOut,
  Phone, Mail,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import './dashboard.css';

const NAV_ITEMS = [
  { to: '/dashboard', end: true, icon: LayoutDashboard, label: 'Overview' },
  { to: '/dashboard/bookings', icon: CalendarDays, label: 'Bookings' },
  { to: '/dashboard/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/dashboard/profile', icon: UserCircle, label: 'Profile' },
];

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accountOpen, setAccountOpen] = useState(false);

  // The guest's editable identity — name, phone, avatar (see Profile.jsx
  // and supabase/migrations/20260923000000_guest_profile_avatar_and_
  // phone.sql). Fetched here, once, and shared via Outlet context so
  // the sidebar's avatar and every page's greeting stay in sync with
  // whatever Profile.jsx just saved, without each page re-fetching it.
  const loadProfile = useCallback((userId) => {
    supabase
      .from('profiles')
      .select('full_name, phone, avatar_url')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => setProfile(data || null));
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!mounted) return;
      if (!user) { navigate('/signin', { replace: true }); return; }
      setUser(user); setLoading(false);
      loadProfile(user.id);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) navigate('/signin', { replace: true });
      else setUser(session.user);
    });
    return () => { mounted = false; sub?.subscription?.unsubscribe(); };
  }, [navigate, loadProfile]);

  useEffect(() => {
    if (!user?.id) return;
    const sub = supabase
      .channel(`guest-profile-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, () => loadProfile(user.id))
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [user?.id, loadProfile]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="dash-loading">
        <div className="dash-loading-brand">
          Home-Office <span style={{ color: '#2d6a4f' }}>Apartments</span>
        </div>
        <p>Loading your dashboard…</p>
      </div>
    );
  }

  const displayName =
    profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="dash-shell">
      {/* Mobile top bar — brand + an avatar button for account/sign-out.
          Primary nav lives in .dash-mobile-tabs below, not behind a
          hamburger — a full-height off-canvas drawer for just 4 short
          links left most of the screen empty green space. */}
      <div className="dash-mobile-bar">
        <a href="/" className="dash-brand dash-brand-logo">
          <img src="/images/logo-icon.png" alt="" className="dash-brand-icon" />
          <span className="dash-brand-text">
            <span className="dash-brand-primary">Home-Office Apartments</span>
            <span className="dash-brand-sub">
              and Living<span className="dash-brand-accent">Spring</span> Gardens
            </span>
          </span>
        </a>
        <button className="dash-account-btn" onClick={() => setAccountOpen(o => !o)} aria-label="Account menu">
          {profile?.avatar_url ? <img src={profile.avatar_url} alt="" /> : initial}
        </button>
        {accountOpen && (
          <div className="dash-account-menu">
            <div className="dash-user">
              <div className="dash-avatar-small">
                {profile?.avatar_url ? <img src={profile.avatar_url} alt="" /> : initial}
              </div>
              <div className="dash-user-meta">
                <div className="dash-user-name">{displayName}</div>
                <div className="dash-user-email">{user?.email}</div>
              </div>
            </div>
            <button className="dash-signout" onClick={handleSignOut}>
              <LogOut size={16} /> Sign out
            </button>
          </div>
        )}
      </div>

      {/* Horizontal tab bar — mobile-only primary nav, always visible. */}
      <nav className="dash-mobile-tabs">
        {NAV_ITEMS.map(({ to, end, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={end}>
            <Icon size={18} /> <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {accountOpen && (
        <div className="dash-backdrop" onClick={() => setAccountOpen(false)} />
      )}

      {/* Sidebar — desktop only */}
      <aside className="dash-sidebar">
        <div className="dash-sidebar-head">
          <a href="/" className="dash-brand dash-brand-logo">
            <img src="/images/logo-icon.png" alt="" className="dash-brand-icon" />
            <span className="dash-brand-text">
              <span className="dash-brand-primary">Home-Office Apartments</span>
              <span className="dash-brand-sub">
                and Living<span className="dash-brand-accent">Spring</span> Gardens
              </span>
            </span>
          </a>
        </div>

        <nav className="dash-nav">
          {NAV_ITEMS.map(({ to, end, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={end}>
              <Icon size={18} /> <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="dash-sidebar-foot">
          <div className="dash-user">
            <div className="dash-avatar-small">
              {profile?.avatar_url ? <img src={profile.avatar_url} alt="" /> : initial}
            </div>
            <div className="dash-user-meta">
              <div className="dash-user-name">{displayName}</div>
              <div className="dash-user-email">{user?.email}</div>
            </div>
          </div>
          <button className="dash-signout" onClick={handleSignOut}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      <main className="dash-main">
        <div className="dash-main-inner">
          <Outlet context={{ user, displayName, profile, refreshProfile: () => loadProfile(user.id) }} />
        </div>
      </main>

      {/* A simple, real footer — how to reach us directly, same
          contact details as the public site's own footer. */}
      <footer className="dash-footer">
        <div className="dash-footer-inner">
          <p className="dash-footer-copy">
            © {new Date().getFullYear()} Home-Office Apartments and LivingSpring Gardens
          </p>
          <div className="dash-footer-contact">
            <span className="dash-footer-help">For more info, call</span>
            <a href="tel:+233206301032"><Phone size={13} /> +233 20 630 1032</a>
            <a href="mailto:jamesd@home-officegroup.com"><Mail size={13} /> jamesd@home-officegroup.com</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
