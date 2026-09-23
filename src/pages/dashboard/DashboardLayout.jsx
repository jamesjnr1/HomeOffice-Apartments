import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import {
  LayoutDashboard, CalendarDays,
  MessageSquare, UserCircle, LogOut, Menu, X,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import './dashboard.css';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
      {/* Mobile top bar */}
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
        <button className="dash-menu-btn" onClick={() => setMobileNavOpen(true)} aria-label="Open menu">
          <Menu size={22} />
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`dash-sidebar ${mobileNavOpen ? 'open' : ''}`}>
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
          <button className="dash-menu-btn dash-menu-close" onClick={() => setMobileNavOpen(false)} aria-label="Close menu">
            <X size={22} />
          </button>
        </div>

        <nav className="dash-nav">
          <NavLink to="/dashboard" end onClick={() => setMobileNavOpen(false)}>
            <LayoutDashboard size={18} /> <span>Overview</span>
          </NavLink>
          <NavLink to="/dashboard/bookings" onClick={() => setMobileNavOpen(false)}>
            <CalendarDays size={18} /> <span>Bookings</span>
          </NavLink>
          <NavLink to="/dashboard/messages" onClick={() => setMobileNavOpen(false)}>
            <MessageSquare size={18} /> <span>Messages</span>
          </NavLink>
          <NavLink to="/dashboard/profile" onClick={() => setMobileNavOpen(false)}>
            <UserCircle size={18} /> <span>Profile</span>
          </NavLink>
        </nav>

        <div className="dash-sidebar-foot">
          {/* User info — explicit sizing to prevent circle overflow */}
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

      {mobileNavOpen && (
        <div className="dash-backdrop" onClick={() => setMobileNavOpen(false)} />
      )}

      <main className="dash-main">
        <div className="dash-main-inner">
          <Outlet context={{ user, displayName, profile, refreshProfile: () => loadProfile(user.id) }} />
        </div>
      </main>
    </div>
  );
}
