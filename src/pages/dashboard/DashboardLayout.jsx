import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import {
  LayoutDashboard, CalendarDays,
  MessageSquare, UserCircle, LogOut,
  Tv, ChefHat, BedDouble, Bath,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { FACILITIES } from '../../lib/propertyContent';
import './dashboard.css';

const NAV_ITEMS = [
  { to: '/dashboard', end: true, icon: LayoutDashboard, label: 'Overview' },
  { to: '/dashboard/bookings', icon: CalendarDays, label: 'Bookings' },
  { to: '/dashboard/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/dashboard/profile', icon: UserCircle, label: 'Profile' },
];

// Icons paired with FACILITIES by index — the text itself stays
// defined once in propertyContent.js (shared with PropertyGallery).
const FACILITY_ICONS = [Tv, ChefHat, BedDouble, Bath];

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
      {/* One top bar at every screen size — brand, nav, and an avatar
          button for account/sign-out. Used to be a tall green sidebar
          on desktop and a hamburger-triggered off-canvas drawer on
          mobile; both are gone in favor of this single always-visible
          bar (nav wraps to its own row on narrow screens, see CSS). */}
      <header className="dash-topbar">
        <a href="/" className="dash-brand dash-brand-logo dash-topbar-brand">
          <img src="/images/logo-icon.png" alt="" className="dash-brand-icon" />
          <span className="dash-brand-text">
            <span className="dash-brand-primary">Home-Office Apartments</span>
            <span className="dash-brand-sub">
              and Living<span className="dash-brand-accent">Spring</span> Gardens
            </span>
          </span>
        </a>

        <nav className="dash-topbar-nav">
          {NAV_ITEMS.map(({ to, end, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={end}>
              <Icon size={18} /> <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="dash-topbar-account">
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
      </header>

      {accountOpen && (
        <div className="dash-backdrop" onClick={() => setAccountOpen(false)} />
      )}

      <main className="dash-main">
        <div className="dash-main-inner">
          <Outlet context={{ user, displayName, profile, refreshProfile: () => loadProfile(user.id) }} />
        </div>
      </main>

      {/* A real footer, not filler — what's actually included in the
          stay, with the same "flaticon" icon-square treatment the
          marketing site uses (.feature-icon), on every dashboard page. */}
      <footer className="dash-footer">
        <div className="dash-footer-inner">
          <div className="dash-footer-head">
            <span className="dash-eyebrow">YOUR STAY</span>
            <h2>What's included</h2>
          </div>
          <div className="dash-footer-grid">
            {FACILITIES.map((label, i) => {
              const Icon = FACILITY_ICONS[i] || Tv;
              return (
                <div className="dash-footer-item" key={label}>
                  <span className="feature-icon"><Icon size={20} /></span>
                  <span>{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </footer>
    </div>
  );
}
