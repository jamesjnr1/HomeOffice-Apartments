import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Inbox, CalendarDays, Users,
  MessageSquare, Tag, TrendingUp, Settings as Cog,
  LogOut, Menu, X, Shield, ArrowLeft,
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
    <div className="mgmt-loading">
      <div className="mgmt-brand-link">
        <span className="mgmt-brand-mark"><Shield size={15}/></span>
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
    <div className="mgmt-shell">
      <div className="mgmt-mobile-bar">
        <a href="/admin" className="mgmt-brand-link">
          <span className="mgmt-brand-mark"><Shield size={14}/></span>
          <span className="mgmt-brand-title">Admin</span>
        </a>
        <button className="mgmt-icon-btn" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu size={20}/>
        </button>
      </div>

      <aside className={`mgmt-sidebar${open ? ' open' : ''}`}>
        <div className="mgmt-sidebar-top">
          <a href="/admin" className="mgmt-brand-link">
            <span className="mgmt-brand-mark"><Shield size={14}/></span>
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
            {NAV.map(({ to, icon: Icon, label, badge, end }) => (
              <NavLink key={to} to={to} end={!!end}
                className={({ isActive }) => `mgmt-nav-link${isActive ? ' active' : ''}`}
                onClick={() => setOpen(false)}>
                <Icon size={16}/> <span>{label}</span>
                {badge && <span className="mgmt-badge">{badge}</span>}
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
