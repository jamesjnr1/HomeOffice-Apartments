'use client';

/**
 * A thin react-router-dom compatible layer on top of the Next.js App
 * Router, so the admin portal and guest dashboard pages keep exactly
 * the same component code (and therefore exactly the same data logic)
 * they had under the old Vite + react-router build. Only the import
 * path changed: `from 'react-router-dom'` → `from '@/lib/router'`.
 *
 * Covers the subset of the react-router API those pages actually use:
 * Link, NavLink, Navigate, Outlet (+ useOutletContext), useNavigate,
 * useLocation, useParams, useSearchParams.
 */

import { createContext, useContext, useEffect } from 'react';
import NextLink from 'next/link';
import {
  usePathname,
  useRouter,
  useParams as useNextParams,
  useSearchParams as useNextSearchParams,
} from 'next/navigation';

export function Link({ to, href, replace, ...rest }) {
  return <NextLink href={to ?? href} replace={replace} {...rest} />;
}

function isActivePath(pathname, to, end) {
  const target = typeof to === 'string' ? to.split('?')[0] : '';
  if (!target) return false;
  if (end || target === '/') return pathname === target;
  return pathname === target || pathname.startsWith(`${target.replace(/\/$/, '')}/`);
}

export function NavLink({ to, end, className, style, children, ...rest }) {
  const pathname = usePathname();
  const isActive = isActivePath(pathname, to, end);
  const state = { isActive, isPending: false };
  const cls = typeof className === 'function'
    ? className(state)
    : [className, isActive ? 'active' : ''].filter(Boolean).join(' ');
  return (
    <NextLink
      href={to}
      className={cls || undefined}
      style={typeof style === 'function' ? style(state) : style}
      aria-current={isActive ? 'page' : undefined}
      {...rest}
    >
      {typeof children === 'function' ? children(state) : children}
    </NextLink>
  );
}

export function useNavigate() {
  const router = useRouter();
  return (to, opts = {}) => {
    if (typeof to === 'number') {
      if (to < 0) router.back();
      else router.forward();
      return;
    }
    if (opts.replace) router.replace(to);
    else router.push(to);
  };
}

export function Navigate({ to, replace }) {
  const navigate = useNavigate();
  useEffect(() => { navigate(to, { replace }); }, [to, replace]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export function useLocation() {
  const pathname = usePathname();
  const params = useNextSearchParams();
  const search = params?.toString() ? `?${params.toString()}` : '';
  return { pathname, search, hash: '', state: null };
}

export function useParams() {
  return useNextParams() || {};
}

export function useSearchParams() {
  const params = useNextSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const set = (next) => {
    const sp = new URLSearchParams(typeof next === 'function' ? next(params) : next);
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };
  return [params, set];
}

/* ---- Outlet ----
 * A Next.js layout receives the active page as `children`. LayoutSlot
 * hands those children to the layout component, which renders them
 * wherever it renders <Outlet context={...} /> — the same place the
 * old react-router Outlet went — and pages read that context back with
 * useOutletContext(), unchanged. */
const SlotContext = createContext(null);
const OutletContext = createContext(undefined);

export function LayoutSlot({ children, layout: Layout }) {
  return (
    <SlotContext.Provider value={children}>
      <Layout />
    </SlotContext.Provider>
  );
}

export function Outlet({ context }) {
  const slot = useContext(SlotContext);
  return <OutletContext.Provider value={context}>{slot}</OutletContext.Provider>;
}

export function useOutletContext() {
  return useContext(OutletContext);
}
