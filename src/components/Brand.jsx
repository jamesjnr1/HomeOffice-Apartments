/**
 * Brand — the logo mark plus the two-line wordmark, shared by the
 * header, mobile menu, footer and auth pages. `tone="light"` inverts
 * the mark for dark backgrounds.
 */
export default function Brand({ tone = 'dark', className = '' }) {
  const light = tone === 'light';
  return (
    <span className={`flex items-center gap-3 ${className}`}>
      <img
        src="/images/logo-icon.png"
        alt=""
        className={`h-9 w-auto ${light ? 'brightness-0 invert' : ''}`}
      />
      <span className="flex flex-col leading-none">
        <span className={`font-display text-[17px] font-normal tracking-tight ${light ? 'text-ivory' : 'text-ink'}`}>
          Home-Office Apartments
        </span>
        <span className={`mt-1 text-[11px] tracking-[0.04em] ${light ? 'text-ivory/60' : 'text-muted'}`}>
          and Living<span className={light ? 'text-sage' : 'text-accent'}>Spring</span> Gardens
        </span>
      </span>
    </span>
  );
}
