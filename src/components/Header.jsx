'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Menu, X, LayoutDashboard, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Brand from './Brand';

const NAV = [
  { href: '/', label: 'Home', end: true },
  { href: '/apartments', label: 'Apartments' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/about', label: 'About' },
];

function isActive(pathname, href, end) {
  return end ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

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
    router.push('/');
  };

  const linkCls = (href, end) =>
    `relative px-1 py-2 text-[14px] tracking-[0.01em] transition-colors duration-300 ${
      isActive(pathname, href, end) ? 'text-ink' : 'text-ink-soft hover:text-ink'
    } after:absolute after:left-1 after:right-1 after:-bottom-0.5 after:h-px after:origin-left after:bg-ink after:transition-transform after:duration-500 ${
      isActive(pathname, href, end) ? 'after:scale-x-100' : 'after:scale-x-0 hover:after:scale-x-100'
    }`;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-500 ${
          scrolled
            ? 'bg-ivory/85 shadow-[0_1px_0_rgba(27,36,32,0.08)] backdrop-blur-xl'
            : 'bg-ivory/0'
        }`}
      >
        <div className="mx-auto flex h-[76px] max-w-[1320px] items-center justify-between px-5 sm:px-8">
          <Link href="/" aria-label="Home-Office Apartments home">
            <Brand />
          </Link>

          <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className={linkCls(n.href, n.end)}>
                {n.label}
              </Link>
            ))}
            <span className="mx-1 h-5 w-px bg-stone" aria-hidden="true" />
            {!user ? (
              <>
                <Link href="/signin" className={linkCls('/signin')}>Sign in</Link>
                <Link
                  href="/book"
                  className="rounded-full bg-forest px-5 py-2.5 text-[14px] font-medium text-ivory transition-all duration-300 hover:bg-forest-deep hover:shadow-[0_8px_24px_rgba(31,61,48,0.25)]"
                >
                  Book a stay
                </Link>
              </>
            ) : (
              <>
                <Link href="/dashboard" className={`${linkCls('/dashboard')} inline-flex items-center gap-1.5`}>
                  <LayoutDashboard size={15} strokeWidth={1.75} /> Dashboard
                </Link>
                <button
                  type="button"
                  onClick={signOut}
                  className="inline-flex items-center gap-1.5 rounded-full border border-stone px-4 py-2 text-[14px] text-ink transition-colors hover:border-ink"
                >
                  <LogOut size={14} strokeWidth={1.75} /> Sign out
                </button>
              </>
            )}
          </nav>

          <button
            type="button"
            className="-mr-2 rounded-full p-2 text-ink lg:hidden"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={22} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {/* Mobile menu — a quiet full-screen sheet */}
      <div
        className={`fixed inset-0 z-[60] flex flex-col bg-ivory transition-opacity duration-500 lg:hidden ${
          mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden={!mobileOpen}
      >
        <div className="flex h-[76px] items-center justify-between px-5">
          <Brand />
          <button
            type="button"
            className="-mr-2 rounded-full p-2 text-ink"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          >
            <X size={22} strokeWidth={1.5} />
          </button>
        </div>
        <nav className="flex flex-1 flex-col px-6 pt-6">
          {NAV.map((n, i) => (
            <Link
              key={n.href}
              href={n.href}
              className={`border-b border-stone py-4 font-display text-[32px] font-light tracking-tight transition-all duration-700 ${
                isActive(pathname, n.href, n.end) ? 'text-ink' : 'text-ink-soft'
              } ${mobileOpen ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}`}
              style={{ transitionDelay: mobileOpen ? `${80 + i * 50}ms` : '0ms' }}
            >
              {n.label}
            </Link>
          ))}
          <div className="mt-auto flex flex-col gap-3 pb-10">
            {!user ? (
              <>
                <div className="flex gap-3">
                  <Link href="/signin" className="flex-1 rounded-full border border-stone py-3 text-center text-[15px] text-ink">Sign in</Link>
                  <Link href="/signup" className="flex-1 rounded-full border border-stone py-3 text-center text-[15px] text-ink">Sign up</Link>
                </div>
                <Link href="/book" className="rounded-full bg-forest py-3.5 text-center text-[15px] font-medium text-ivory">Book a stay</Link>
              </>
            ) : (
              <>
                <Link href="/dashboard" className="rounded-full bg-forest py-3.5 text-center text-[15px] font-medium text-ivory">Dashboard</Link>
                <button type="button" onClick={signOut} className="rounded-full border border-stone py-3 text-[15px] text-ink">Sign out</button>
              </>
            )}
          </div>
        </nav>
      </div>
    </>
  );
}
