import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import HeroScene from '../components/HeroScene';
import { container, Eyebrow, ButtonLink, CtaBand } from '../components/ui';

export default function Home() {
  return (
    <>
      {/* Hero — quiet type on ivory, the property photo framed to the
          right, and a slow breathing field of light behind it all. */}
      <section className="relative min-h-[100svh] overflow-hidden">
        <HeroScene className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] opacity-90" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(70% 55% at 20% 30%, rgba(247,244,238,0.95), rgba(247,244,238,0) 70%)' }}
          aria-hidden="true"
        />

        <div className={`${container} relative grid min-h-[100svh] items-center gap-14 pb-20 pt-32 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pt-28`}>
          <div className="max-w-xl">
            <Eyebrow className="hero-in" >Living Spring Gardens · Sunyani, Ghana</Eyebrow>
            <h1 className="hero-in mt-7 font-display text-[50px] font-light leading-[1.02] tracking-[-0.025em] text-ink [animation-delay:120ms] sm:text-[72px] lg:text-[84px]">
              A quiet place for hideout, retreat or work.
            </h1>
            <p className="hero-in mt-8 max-w-md text-[17.5px] leading-relaxed text-ink-soft [animation-delay:240ms]">
              Home-Office Apartments — thoughtfully finished for how you actually spend your days,
              set in the calm of LivingSpring Gardens.
            </p>
            <div className="hero-in mt-11 flex flex-wrap gap-3 [animation-delay:360ms]">
              <ButtonLink href="/book">Check availability</ButtonLink>
              <ButtonLink href="/apartments" variant="outline" arrow>See the apartments</ButtonLink>
            </div>
          </div>

          <div className="hero-in relative [animation-delay:200ms]">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] shadow-[0_40px_80px_-30px_rgba(27,36,32,0.45)] sm:aspect-[5/6] lg:aspect-[4/5]">
              <img
                src="/images/hero-property.jpg"
                alt="Home-Office Apartments — a considered stay"
                className="slow-zoom h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/35 via-transparent to-transparent" />
            </div>
            <div className="absolute -bottom-6 left-6 right-6 rounded-2xl border border-white/60 bg-ivory/90 p-5 shadow-[0_20px_40px_-20px_rgba(27,36,32,0.35)] backdrop-blur-md sm:left-auto sm:right-8 sm:w-72">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted">Two apartments</p>
              <p className="mt-2 font-display text-[19px] font-light leading-snug text-ink">
                Home-Office Apartment &amp; LivingSpring Gardens
              </p>
              <p className="mt-2 text-[13px] text-ink-soft">2 bedrooms · 2 bathrooms · garden setting</p>
            </div>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="py-24 sm:py-36">
        <div className={`${container} grid gap-16 lg:grid-cols-[1.25fr_0.75fr] lg:gap-24`}>
          <div className="reveal">
            <Eyebrow>A home away from home</Eyebrow>
            <h2 className="mt-7 font-display text-[32px] font-light leading-[1.18] tracking-[-0.015em] text-ink sm:text-[44px]">
              <span className="italic text-accent">Jerusalem stone elegance</span>, a peaceful pergola front yard,
              and expansive open space for relaxation or memorable events.
            </h2>
            <p className="mt-9 max-w-2xl text-[17px] leading-[1.75] text-ink-soft">
              Discover self‑contained apartments in a peaceful compound, thoughtfully designed for the way you
              work from home and the way you rest.
            </p>

            <div className="mt-12 max-w-2xl">
              <p className="text-[11.5px] font-medium uppercase tracking-[0.22em] text-muted">Each apartment features</p>
              <ul className="mt-5 divide-y divide-stone border-y border-stone">
                {[
                  'A spacious, fully furnished hall with TV',
                  'A modern kitchen equipped for convenience',
                  'Two comfortable bedrooms with King, Queen, and Standard beds',
                ].map((f, idx) => (
                  <li key={f} className="flex items-baseline gap-5 py-4 text-[16px] text-ink">
                    <span className="font-display text-[14px] text-accent">0{idx + 1}</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-10 max-w-2xl text-[17px] leading-[1.75] text-ink-soft">
              Step outside and your apartment opens directly onto the serene LivingSpring Gardens, where
              well‑kept lawns and tranquil surroundings create the perfect setting for relaxation, reflection,
              and holidays.
            </p>

            <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3">
              <span className="text-[12px] font-medium uppercase tracking-[0.2em] text-muted">Also listed on Airbnb</span>
              <a
                href="https://www.airbnb.com/rooms/1773106679484408993"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 border-b border-ink/20 pb-0.5 text-[15px] text-ink transition-colors hover:border-ink"
              >
                Home-Office Apartment <ArrowUpRight size={14} strokeWidth={1.75} />
              </a>
              <a
                href="https://www.airbnb.com/rooms/1743067197312497878"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 border-b border-ink/20 pb-0.5 text-[15px] text-ink transition-colors hover:border-ink"
              >
                LivingSpring Gardens <ArrowUpRight size={14} strokeWidth={1.75} />
              </a>
            </div>
          </div>

          <div className="reveal flex items-center justify-center lg:justify-end">
            <div className="relative flex aspect-square w-full max-w-[380px] items-center justify-center rounded-full bg-sand">
              <img src="/images/travel-suitcase-terracotta.png" alt="" className="w-[62%]" />
            </div>
          </div>
        </div>
      </section>

      {/* Two-card teaser */}
      <section className="bg-sand/60 py-24 sm:py-32">
        <div className={`${container} grid gap-8 md:grid-cols-2 lg:gap-10`}>
          <TeaserCard
            href="/apartments"
            img="/images/kitchen.jpg"
            alt="Kitchen at Home-Office Apartments"
            eyebrow="The apartment"
            title="Built for how you work."
            text="Fast Wi-Fi, dedicated desk, and a well-considered kitchen."
            cta="See the apartment"
          />
          <TeaserCard
            href="/gallery"
            img="/images/lounge.jpg"
            alt="Living room at Home-Office Apartments"
            eyebrow="Take a look inside"
            title="Every room, well considered."
            text="Four bedrooms, a full kitchen, and living spaces built for a proper stay."
            cta="See the gallery"
            offset
          />
        </div>
      </section>

      <CtaBand
        title="Ready to plan your stay?"
        lead="Enquire about availability. We usually reply within a day."
        cta="Send an enquiry"
        arrow={false}
      />
    </>
  );
}

function TeaserCard({ href, img, alt, eyebrow, title, text, cta, offset }) {
  return (
    <Link href={href} className={`reveal group block ${offset ? 'md:mt-16' : ''}`}>
      <div className="aspect-[4/3] overflow-hidden rounded-[24px]">
        <img
          src={img}
          alt={alt}
          className="h-full w-full object-cover transition-transform duration-[1400ms] ease-calm group-hover:scale-[1.04]"
        />
      </div>
      <div className="px-1 pt-7">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h3 className="mt-4 font-display text-[30px] font-light tracking-[-0.015em] text-ink">{title}</h3>
        <p className="mt-3 max-w-md text-[16px] leading-relaxed text-ink-soft">{text}</p>
        <span className="mt-6 inline-flex items-center gap-2 text-[14.5px] font-medium text-ink">
          {cta}
          <ArrowRight size={15} strokeWidth={1.75} className="transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
