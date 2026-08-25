import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, CalendarDays, Heart,
  MessageSquare, UserCircle, LogOut, Menu, X,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import './dashboard.css';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!mounted) return;
      if (!user) { navigate('/signin', { replace: true }); return; }
      setUser(user); setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) navigate('/signin', { replace: true });
      else setUser(session.user);
    });
    return () => { mounted = false; sub?.subscription?.unsubscribe(); };
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="dash-loading">
        <div className="dash-loading-brand">
          Home-Office <span style={{ color: '#2d6a4f' }}>Appartments</span>
        </div>
        <p>Loading your dashboard…</p>
      </div>
    );
  }

  const displayName =
    user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="dash-shell">
      {/* Mobile top bar */}
      <div className="dash-mobile-bar">
        <a href="/" className="dash-brand">
          <span className="dash-brand-primary">Home-Office Appartments</span>
          <span className="dash-brand-sub">
            and Living<span className="dash-brand-accent">Spring</span> Gardens
          </span>
        </a>
        <button className="dash-menu-btn" onClick={() => setMobileNavOpen(true)} aria-label="Open menu">
          <Menu size={22} />
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`dash-sidebar ${mobileNavOpen ? 'open' : ''}`}>
        <div className="dash-sidebar-head">
          <a href="/" className="dash-brand">
            <span className="dash-brand-primary">Home-Office Appartments</span>
            <span className="dash-brand-sub">
              and Living<span className="dash-brand-accent">Spring</span> Gardens
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
          <NavLink to="/dashboard/wishlist" onClick={() => setMobileNavOpen(false)}>
            <Heart size={18} /> <span>Wishlist</span>
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
            <div className="dash-avatar-small">{initial}</div>
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
          <Outlet context={{ user, displayName }} />
        </div>
      </main>
    </div>
  );
}
