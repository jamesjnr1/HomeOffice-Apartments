import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/* Small, shared building blocks for the public pages — one place for
   the type scale, buttons and the closing call-to-action band. */

export const container = 'mx-auto w-full max-w-[1320px] px-5 sm:px-8';

export function Eyebrow({ children, tone = 'dark', className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-3 text-[11.5px] font-medium uppercase tracking-[0.24em] ${
        tone === 'light' ? 'text-ivory/60' : 'text-accent'
      } ${className}`}
    >
      <span className={`h-px w-8 ${tone === 'light' ? 'bg-ivory/40' : 'bg-accent/50'}`} aria-hidden="true" />
      {children}
    </span>
  );
}

const btnBase =
  'group inline-flex items-center justify-center gap-2 rounded-full text-[15px] font-medium transition-all duration-300 ease-calm disabled:cursor-not-allowed disabled:opacity-60';

export const btn = {
  primary: `${btnBase} bg-forest px-7 py-3.5 text-ivory hover:bg-forest-deep hover:shadow-[0_10px_30px_rgba(31,61,48,0.28)]`,
  light: `${btnBase} bg-ivory px-7 py-3.5 text-forest-deep hover:bg-white hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)]`,
  outline: `${btnBase} border border-ink/15 px-7 py-3.5 text-ink hover:border-ink/50 hover:bg-white/50`,
  ghostLight: `${btnBase} border border-ivory/30 px-7 py-3.5 text-ivory hover:border-ivory/70 hover:bg-ivory/5`,
};

export function ButtonLink({ href, variant = 'primary', arrow = false, children, className = '', ...rest }) {
  return (
    <Link href={href} className={`${btn[variant]} ${className}`} {...rest}>
      {children}
      {arrow && <ArrowRight size={16} strokeWidth={1.75} className="transition-transform duration-300 group-hover:translate-x-0.5" />}
    </Link>
  );
}

export function PageHeader({ eyebrow, title, lead, children }) {
  return (
    <section className="relative overflow-hidden pb-16 pt-40 sm:pb-20 sm:pt-48">
      <div className={container}>
        <div className="max-w-3xl">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="mt-6 font-display text-[44px] font-light leading-[1.04] tracking-[-0.02em] text-ink sm:text-[64px]">
            {title}
          </h1>
          {lead && <p className="mt-7 max-w-2xl text-[17.5px] leading-relaxed text-ink-soft">{lead}</p>}
          {children}
        </div>
      </div>
    </section>
  );
}

/* Closing call-to-action — deep forest green, the site's one block of
   solid brand colour at the foot of each page. */
export function CtaBand({ title, lead, cta = 'Send an enquiry', href = '/book', arrow = true }) {
  return (
    <section className="relative overflow-hidden bg-forest text-ivory">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(60% 80% at 85% 10%, rgba(157,179,166,0.22), transparent 60%), radial-gradient(50% 70% at 10% 100%, rgba(21,40,31,0.7), transparent 70%)',
        }}
        aria-hidden="true"
      />
      <div className={`${container} relative py-24 text-center sm:py-32`}>
        <div className="reveal mx-auto max-w-2xl">
          <h2 className="font-display text-[38px] font-light leading-[1.08] tracking-[-0.02em] sm:text-[54px]">{title}</h2>
          <p className="mx-auto mt-5 max-w-lg text-[17px] leading-relaxed text-ivory/75">{lead}</p>
          <div className="mt-10">
            <ButtonLink href={href} variant="light" arrow={arrow}>{cta}</ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
