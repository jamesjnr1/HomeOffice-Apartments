import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Inbox, CalendarDays, Users,
  MessageSquare, Tag, TrendingUp, Settings as Cog,
  LogOut, Menu, X, Shield,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// Inline all admin styles so globals.css cannot interfere
import './admin.css';

export default function AdminLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!mounted) return;
      if (!user) { navigate('/admin/signin', { replace: true }); return; }
      const r = user.user_metadata?.role;
      if (r !== 'owner' && r !== 'manager') { navigate('/admin/signin', { replace: true }); return; }
      setUser(user); setRole(r); setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session?.user) navigate('/admin/signin', { replace: true });
      else setUser(session.user);
    });
    return () => { mounted = false; sub?.subscription?.unsubscribe(); };
  }, [navigate]);

  const signOut = async () => { await supabase.auth.signOut(); navigate('/'); };

  if (loading) return (
    <div className="ad-loading">
      <div className="ad-brand-loading">
        <span className="ad-brand-mark"><Shield size={15} /></span>
        <span className="ad-brand-title">Admin</span>
      </div>
      <p>Verifying access…</p>
    </div>
  );

  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin';
  const isOwner = role === 'owner';
  const initial = name.charAt(0).toUpperCase();

  const NAV = [
    { to: '/admin', icon: LayoutDashboard, label: 'Overview', end: true },
    { to: '/admin/enquiries', icon: Inbox, label: 'Enquiries', badge: 3 },
    { to: '/admin/bookings', icon: CalendarDays, label: 'Bookings' },
    { to: '/admin/guests', icon: Users, label: 'Guests' },
    { to: '/admin/messages', icon: MessageSquare, label: 'Messages', badge: 2 },
    { to: '/admin/rates', icon: Tag, label: 'Rates & availability' },
  ];
  const OWNER_NAV = [
    { to: '/admin/revenue', icon: TrendingUp, label: 'Revenue' },
    { to: '/admin/settings', icon: Cog, label: 'Settings' },
  ];

  return (
    <div className="ad-shell">
      {/* Mobile bar - only shows on small screens */}
      <div className="ad-mobile-bar">
        <a href="/admin" className="ad-brand-link">
          <span className="ad-brand-mark"><Shield size={14} /></span>
          <span className="ad-brand-title">Admin</span>
        </a>
        <button className="ad-icon-btn" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu size={20} />
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`ad-sidebar${open ? ' open' : ''}`}>
        <div className="ad-sidebar-top">
          <a href="/admin" className="ad-brand-link">
            <span className="ad-brand-mark"><Shield size={14} /></span>
            <div className="ad-brand-text">
              <span className="ad-brand-title">Admin</span>
              <span className="ad-brand-sub">HomeOffice · LivingSpring</span>
            </div>
          </a>
          <button className="ad-icon-btn ad-close-btn" onClick={() => setOpen(false)} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="ad-nav-block">
          <p className="ad-nav-label">MANAGE</p>
          <nav>
            {NAV.map(({ to, icon: Icon, label, badge, end }) => (
              <NavLink key={to} to={to} end={!!end} className={({ isActive }) => `ad-nav-link${isActive ? ' active' : ''}`} onClick={() => setOpen(false)}>
                <Icon size={16} />
                <span>{label}</span>
                {badge && <span className="ad-badge">{badge}</span>}
              </NavLink>
            ))}
          </nav>
        </div>

        {isOwner && (
          <div className="ad-nav-block">
            <p className="ad-nav-label">OWNER ONLY</p>
            <nav>
              {OWNER_NAV.map(({ to, icon: Icon, label }) => (
                <NavLink key={to} to={to} className={({ isActive }) => `ad-nav-link${isActive ? ' active' : ''}`} onClick={() => setOpen(false)}>
                  <Icon size={16} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        )}

        <div className="ad-sidebar-foot">
          <div className="ad-user-row">
            <div className="ad-avatar-sm">{initial}</div>
            <div className="ad-user-info">
              <span className="ad-user-name">{name}</span>
              <span className={`ad-role-pill ${role}`}>{role}</span>
            </div>
          </div>
          <button className="ad-signout-btn" onClick={signOut}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      {open && <div className="ad-backdrop" onClick={() => setOpen(false)} />}

      <main className="ad-main">
        <Outlet context={{ user, role, isOwner, displayName: name }} />
      </main>
    </div>
  );
}
