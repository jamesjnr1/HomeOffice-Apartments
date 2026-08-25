import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Menu, X, LayoutDashboard, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);

  const solid = true;
  const scrolledShadow = scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub?.subscription?.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate('/');
  };

  return (
    <>
      <header className={`site-header ${solid ? 'solid' : ''} ${scrolledShadow ? 'scrolled' : ''}`}>
        <div className="container header-inner">
          <NavLink to="/" viewTransition className="brand" aria-label="Home-Office Apartments home">
            <span className="brand-primary">Home-Office Apartments</span>
            <span className="brand-sub">
              and Living<span className="brand-accent">Spring</span> Gardens
            </span>
          </NavLink>

          <nav className="nav-primary" aria-label="Primary">
            <NavLink to="/" end viewTransition className="nav-link">Home</NavLink>
            <NavLink to="/apartments" viewTransition className="nav-link">Apartments</NavLink>
            <NavLink to="/gardens" viewTransition className="nav-link">Gardens</NavLink>
            <NavLink to="/gallery" viewTransition className="nav-link">Gallery</NavLink>
            <NavLink to="/about" viewTransition className="nav-link">About</NavLink>

            {!user && (
              <>
                <NavLink to="/signin" viewTransition className="nav-link">Sign in</NavLink>
                <NavLink to="/book" viewTransition className="btn btn-primary">Book a stay</NavLink>
              </>
            )}

            {user && (
              <>
                <NavLink to="/dashboard" viewTransition className="nav-link nav-link-icon">
                  <LayoutDashboard size={16} /> Dashboard
                </NavLink>
                <button className="btn btn-outline nav-signout" onClick={signOut}>
                  <LogOut size={14} /> Sign out
                </button>
              </>
            )}
          </nav>

          <button
            className="hamburger"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      <div className={`mobile-menu ${mobileOpen ? 'open' : ''}`} aria-hidden={!mobileOpen}>
        <div className="mobile-menu-head">
          <span className="brand">
            <span className="brand-primary">Home-Office Apartments</span>
            <span className="brand-sub">
              and Living<span className="brand-accent">Spring</span> Gardens
            </span>
          </span>
          <button
            className="hamburger"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          >
            <X size={22} />
          </button>
        </div>
        <nav>
          <NavLink to="/" end viewTransition>Home</NavLink>
          <NavLink to="/apartments" viewTransition>Apartments</NavLink>
          <NavLink to="/gardens" viewTransition>Gardens</NavLink>
          <NavLink to="/gallery" viewTransition>Gallery</NavLink>
          <NavLink to="/about" viewTransition>About</NavLink>

          {!user && (
            <>
              <NavLink to="/signin" viewTransition>Sign in</NavLink>
              <NavLink to="/signup" viewTransition>Sign up</NavLink>
              <NavLink to="/book" viewTransition className="btn btn-primary btn-block">Book a stay</NavLink>
            </>
          )}

          {user && (
            <>
              <NavLink to="/dashboard" viewTransition>Dashboard</NavLink>
              <button className="btn btn-outline btn-block" onClick={signOut}>
                Sign out
              </button>
            </>
          )}
        </nav>
      </div>
    </>
  );
}
