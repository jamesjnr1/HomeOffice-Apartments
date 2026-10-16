import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import {
  Home, CalendarDays, Mail, LogOut, Phone,
  PlusCircle, HelpCircle, ChevronDown,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import PaymentDueBanner from './PaymentDueBanner';
import './dashboard.css';

const NAV_ITEMS = [
  { to: '/dashboard', end: true, label: 'Overview' },
  { to: '/dashboard/bookings', label: 'Reservations' },
  { to: '/dashboard/messages', label: 'Messages' },
  { to: '/dashboard/profile', label: 'Profile' },
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
      {/* Brand sits on the photo above a single floating glass menu bar:
          quick icons (site home, messages, reservations), the four
          pages as text links, then Book / Help / account on the right.
          Four pages never needed a full-height sidebar. */}
      <div className="dash-brandrow">
        <a href="/" className="dash-brand dash-brand-logo">
          <img src="/images/logo-icon.png" alt="" className="dash-brand-icon" />
          <span className="dash-brand-text">
            <span className="dash-brand-primary">Home-Office Apartments</span>
            <span className="dash-brand-sub">
              and Living<span className="dash-brand-accent">Spring</span> Gardens
            </span>
          </span>
        </a>
        <span className="dash-brandrow-tag">Your stay, all in one place</span>
      </div>

      <header className="dash-topbar">
        <div className="dash-topbar-inner">
          <div className="dash-topbar-icons">
            <a href="/" className="dash-icon-btn" aria-label="Back to the website" title="Website"><Home size={17} /></a>
            <span className="dash-topbar-divider" />
            <NavLink to="/dashboard/messages" className="dash-icon-btn" aria-label="Messages" title="Messages"><Mail size={17} /></NavLink>
            <NavLink to="/dashboard/bookings" className="dash-icon-btn" aria-label="Reservations" title="Reservations"><CalendarDays size={17} /></NavLink>
            <span className="dash-topbar-divider" />
          </div>

          <nav className="dash-topnav" aria-label="Dashboard">
            {NAV_ITEMS.map(({ to, end, label }) => (
              <NavLink key={to} to={to} end={end}>{label}</NavLink>
            ))}
          </nav>

          <div className="dash-topbar-right">
            <a href="/book" className="dash-icon-btn" aria-label="Book a stay" title="Book a stay"><PlusCircle size={17} /></a>
            <a href="tel:+233206301032" className="dash-icon-btn" aria-label="Call us for help" title="Help: +233 20 630 1032"><HelpCircle size={17} /></a>
            <div className="dash-account">
              <button className="dash-account-btn" onClick={() => setAccountOpen(o => !o)} aria-label="Account menu" aria-expanded={accountOpen}>
                <span className="dash-account-avatar">
                  {profile?.avatar_url ? <img src={profile.avatar_url} alt="" /> : initial}
                </span>
                <ChevronDown size={14} />
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
          </div>
        </div>
      </header>

      {accountOpen && (
        <div className="dash-backdrop" onClick={() => setAccountOpen(false)} />
      )}

      <main className="dash-main">
        <div className="dash-main-inner">
          <PaymentDueBanner userId={user.id} />
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
