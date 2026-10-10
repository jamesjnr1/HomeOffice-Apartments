import { container, ButtonLink } from '../components/ui';

export default function NotFound() {
  return (
    <section className="flex min-h-[80vh] items-center pb-24 pt-40 text-center">
      <div className={container}>
        <p className="text-[12px] font-medium uppercase tracking-[0.3em] text-accent">404</p>
        <h1 className="mt-6 font-display text-[44px] font-light leading-tight tracking-[-0.02em] text-ink sm:text-[60px]">
          This page has wandered off.
        </h1>
        <p className="mx-auto mt-5 max-w-md text-[17px] text-ink-soft">
          The link may be broken, or the page may have moved.
        </p>
        <div className="mt-10">
          <ButtonLink href="/">Back to home</ButtonLink>
        </div>
      </div>
    </section>
  );
}
