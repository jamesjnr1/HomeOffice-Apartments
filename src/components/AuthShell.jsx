import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Brand from './Brand';

/**
 * AuthShell — the split layout shared by guest sign-in / sign-up and
 * the admin sign-in: a photo panel with a short headline on the left,
 * a calm form panel on the right. Purely presentational; each page
 * keeps its own auth logic.
 */
export default function AuthShell({ image = '/images/hero-property.jpg', headline, sub, badge, title, lede, error, children, alt }) {
  return (
    <div className="grid min-h-[100svh] bg-ivory lg:grid-cols-[1.05fr_0.95fr]">
      <aside className="relative hidden overflow-hidden lg:block">
        <img src={image} alt="" className="slow-zoom absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/85 via-forest-deep/30 to-forest-deep/10" />
        <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
          <Link href="/" aria-label="Home"><Brand tone="light" /></Link>
          <div className="max-w-md">
            {badge}
            <h2 className="font-display text-[52px] font-light leading-[1.05] tracking-[-0.02em] text-ivory">{headline}</h2>
            <p className="mt-5 text-[16.5px] leading-relaxed text-ivory/75">{sub}</p>
          </div>
        </div>
      </aside>

      <section className="flex items-center justify-center px-5 py-16 sm:px-10">
        <div className="w-full max-w-[420px]">
          <Link href="/" aria-label="Home" className="mb-14 inline-block lg:hidden"><Brand /></Link>
          <h1 className="font-display text-[40px] font-light leading-tight tracking-[-0.02em] text-ink">{title}</h1>
          <p className="mt-3 text-[16px] text-ink-soft">{lede}</p>
          {error && <div className="form-error mt-6">{error}</div>}
          <div className="mt-8">{children}</div>
          {alt && <p className="mt-8 text-center text-[14.5px] text-ink-soft">{alt}</p>}
        </div>
      </section>
    </div>
  );
}

export function AuthField({ label, ...props }) {
  return (
    <label className="mb-5 block">
      <span className="mb-2 block text-[12px] font-medium uppercase tracking-[0.16em] text-ink-soft">{label}</span>
      <input
        className="w-full rounded-xl border border-stone bg-white/80 px-4 py-3.5 text-[15.5px] text-ink outline-none transition placeholder:text-muted/70 focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/10"
        {...props}
      />
    </label>
  );
}

export function AuthSubmit({ loading, loadingText, children }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="group mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-forest px-7 py-4 text-[15.5px] font-medium text-ivory transition-all duration-300 hover:bg-forest-deep hover:shadow-[0_10px_30px_rgba(31,61,48,0.28)] disabled:opacity-60"
    >
      {loading ? loadingText : (
        <>{children} <ArrowRight size={17} strokeWidth={1.75} className="transition-transform group-hover:translate-x-0.5" /></>
      )}
    </button>
  );
}
