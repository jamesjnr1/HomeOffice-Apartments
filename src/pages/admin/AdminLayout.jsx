import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Inbox, CalendarDays, Users, MessageSquare, Tag, TrendingUp, Settings as Cog, LogOut, Menu, X, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
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
      <div className="ad-brand"><span className="ad-brand-mark"><Shield size={15}/></span><span className="ad-brand-title">Admin</span></div>
      <p>Verifying access…</p>
    </div>
  );

  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin';
  const isOwner = role === 'owner';

  return (
    <div className="ad-shell">
      <div className="ad-mobile-bar">
        <a href="/admin" className="ad-brand"><span className="ad-brand-mark"><Shield size={15}/></span><span className="ad-brand-title">Admin</span></a>
        <button className="ad-menu-btn" onClick={() => setOpen(true)}><Menu size={22}/></button>
      </div>

      <aside className={`ad-sidebar ${open ? 'open' : ''}`}>
        <div className="ad-sidebar-head">
          <a href="/admin" className="ad-brand">
            <span className="ad-brand-mark"><Shield size={15}/></span>
            <span className="ad-brand-lines">
              <span className="ad-brand-title">Admin</span>
              <span className="ad-brand-sub">Home-Office · LivingSpring</span>
            </span>
          </a>
          <button className="ad-menu-btn" onClick={() => setOpen(false)}><X size={22}/></button>
        </div>

        <div className="ad-nav-section">
          <div className="ad-nav-label">MANAGE</div>
          <nav className="ad-nav">
            {[
              ['/admin', LayoutDashboard, 'Overview', null, true],
              ['/admin/enquiries', Inbox, 'Enquiries', 3],
              ['/admin/bookings', CalendarDays, 'Bookings'],
              ['/admin/guests', Users, 'Guests'],
              ['/admin/messages', MessageSquare, 'Messages', 2],
              ['/admin/rates', Tag, 'Rates & availability'],
            ].map(([to, Icon, label, badge, end]) => (
              <NavLink key={to} to={to} end={!!end} onClick={() => setOpen(false)}>
                <Icon size={17}/> <span>{label}</span>
                {badge ? <span className="ad-nav-badge">{badge}</span> : null}
              </NavLink>
            ))}
          </nav>
        </div>

        {isOwner && (
          <div className="ad-nav-section">
            <div className="ad-nav-label">OWNER ONLY</div>
            <nav className="ad-nav">
              <NavLink to="/admin/revenue" onClick={() => setOpen(false)}><TrendingUp size={17}/> <span>Revenue</span></NavLink>
              <NavLink to="/admin/settings" onClick={() => setOpen(false)}><Cog size={17}/> <span>Settings</span></NavLink>
            </nav>
          </div>
        )}

        <div className="ad-sidebar-foot">
          <div className="ad-user">
            <div className="ad-avatar">{name.charAt(0).toUpperCase()}</div>
            <div className="ad-user-meta">
              <div className="ad-user-name">{name}</div>
              <span className={`ad-role-badge ${role}`}>{role}</span>
            </div>
          </div>
          <button className="ad-signout" onClick={signOut}><LogOut size={15}/> Sign out</button>
        </div>
      </aside>

      {open && <div className="ad-backdrop" onClick={() => setOpen(false)}/>}

      <main className="ad-main">
        <div className="ad-main-inner">
          <Outlet context={{ user, role, isOwner, displayName: name }}/>
        </div>
      </main>
    </div>
  );
}
