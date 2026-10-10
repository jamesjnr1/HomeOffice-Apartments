import { ArrowUpRight } from 'lucide-react';
import { container, Eyebrow, PageHeader, CtaBand } from '../components/ui';

export default function About() {
  return (
    <>
      <PageHeader
        eyebrow="About"
        title="A family compound, opened to guests."
        lead="Home-Office Apartments began as a simple idea — turn part of our family garden in Sunyani into a home away from home for people passing through, working remotely, or visiting for a season."
      />

      {/* The story */}
      <section className="pb-24 sm:pb-36">
        <div className={`${container} grid items-center gap-14 lg:grid-cols-2 lg:gap-24`}>
          <div className="reveal order-2 lg:order-1">
            <Eyebrow>The story</Eyebrow>
            <h2 className="mt-6 font-display text-[36px] font-light tracking-[-0.02em] text-ink sm:text-[46px]">Why we built it.</h2>
            <p className="mt-8 text-[17px] leading-[1.75] text-ink-soft">
              LivingSpring Gardens has been part of our family for years — the trees older than most of us.
              When more of the family started working remotely, and more friends started visiting Sunyani for
              a week at a time, the question came up naturally: could we make part of it a place other people
              would want to stay?
            </p>
            <p className="mt-6 text-[17px] leading-[1.75] text-ink-soft">
              So we built an apartment on the edge of the compound — four bedrooms, well-considered, and quiet,
              the kind of place we&apos;d want to stay ourselves.
            </p>
          </div>
          <div className="reveal order-1 lg:order-2">
            <div className="aspect-[4/5] overflow-hidden rounded-[28px]">
              <img src="/images/hero-property.jpg" alt="LivingSpring Gardens" className="h-full w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="bg-sand/60 py-24 sm:py-32">
        <div className={container}>
          <div className="reveal grid gap-12 lg:grid-cols-2 lg:gap-24">
            <div>
              <Eyebrow>Sunyani</Eyebrow>
              <h2 className="mt-6 font-display text-[34px] font-light leading-[1.12] tracking-[-0.02em] text-ink sm:text-[44px]">
                The garden city of the Bono Region.
              </h2>
              <p className="mt-8 text-[17px] leading-[1.75] text-ink-soft">
                Sunyani is smaller and calmer than the coastal cities — a good pace of life, a beautiful
                hinterland, and enough going on for a proper week or a proper month.
              </p>
            </div>
            <div className="lg:pt-16">
              <p className="text-[17px] leading-[1.75] text-ink-soft">
                A central location for exploring the Bono Region, with plenty worth the drive just outside the city.
              </p>
              <ul className="mt-8 divide-y divide-stone border-y border-stone">
                {['Kintampo Waterfalls', 'Bui National Park', "Sunyani's central market & cafés"].map((p) => (
                  <li key={p} className="py-4 font-display text-[21px] font-light text-ink">{p}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="reveal mt-24 grid items-center gap-12 border-t border-stone pt-24 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <Eyebrow>Getting here</Eyebrow>
              <h2 className="mt-6 font-display text-[34px] font-light tracking-[-0.02em] text-ink sm:text-[44px]">Find us in Fiapre.</h2>
              <p className="mt-6 text-[17px] leading-[1.75] text-ink-soft">
                Home-Office Apartments and LivingSpring Gardens is in Fiapre, Sunyani, Bono Region.
              </p>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Fiapre%2C+Sunyani%2C+Ghana"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2 rounded-full border border-ink/15 px-6 py-3 text-[15px] font-medium text-ink transition-all hover:border-ink/50 hover:bg-white/50"
              >
                Get directions <ArrowUpRight size={16} strokeWidth={1.75} />
              </a>
            </div>
            <div className="overflow-hidden rounded-[24px] border border-stone bg-white">
              <iframe
                title="Map to Home-Office Apartments"
                className="block h-[380px] w-full grayscale-[35%]"
                src="https://www.google.com/maps?q=Fiapre,+Sunyani,+Ghana&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      <CtaBand title="Come stay with us." lead="We usually reply to enquiries within a day." />
    </>
  );
}
