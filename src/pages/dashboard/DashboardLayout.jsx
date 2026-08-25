import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Heart,
  MessageSquare,
  UserCircle,
  LogOut,
  Menu,
  X,
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
      if (!user) {
        navigate('/signin', { replace: true });
        return;
      }
      setUser(user);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) navigate('/signin', { replace: true });
      else setUser(session.user);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // Compact, single-block brand that sits properly in the sidebar
  const SidebarBrand = () => (
    <a href="/" className="dash-brand-compact">
      <span className="dash-brand-mark">H·O</span>
      <span className="dash-brand-lines">
        <span className="dash-brand-title">Home-Office</span>
        <span className="dash-brand-sub">
          Living<span className="dash-brand-spring">Spring</span> Gardens
        </span>
      </span>
    </a>
  );

  if (loading) {
    return (
      <div className="dash-loading">
        <SidebarBrand />
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
        <SidebarBrand />
        <button
          className="dash-menu-btn"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`dash-sidebar ${mobileNavOpen ? 'open' : ''}`}>
        <div className="dash-sidebar-head">
          <SidebarBrand />
          <button
            className="dash-menu-btn dash-menu-close"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        <nav className="dash-nav">
          <NavLink to="/dashboard" end onClick={() => setMobileNavOpen(false)}>
            <LayoutDashboard size={17} /> <span>Overview</span>
          </NavLink>
          <NavLink to="/dashboard/bookings" onClick={() => setMobileNavOpen(false)}>
            <CalendarDays size={17} /> <span>Bookings</span>
          </NavLink>
          <NavLink to="/dashboard/wishlist" onClick={() => setMobileNavOpen(false)}>
            <Heart size={17} /> <span>Wishlist</span>
          </NavLink>
          <NavLink to="/dashboard/messages" onClick={() => setMobileNavOpen(false)}>
            <MessageSquare size={17} /> <span>Messages</span>
          </NavLink>
          <NavLink to="/dashboard/profile" onClick={() => setMobileNavOpen(false)}>
            <UserCircle size={17} /> <span>Profile</span>
          </NavLink>
        </nav>

        <div className="dash-sidebar-foot">
          <div className="dash-user">
            <div className="dash-avatar">{initial}</div>
            <div className="dash-user-meta">
              <div className="dash-user-name">{displayName}</div>
              <div className="dash-user-email">{user?.email}</div>
            </div>
          </div>
          <button className="dash-signout" onClick={handleSignOut}>
            <LogOut size={15} /> Sign out
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
