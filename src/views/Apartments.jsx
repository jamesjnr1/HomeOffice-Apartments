import ReviewsSection from '../components/ReviewsSection';
import { container, Eyebrow, PageHeader, CtaBand } from '../components/ui';

export default function Apartments() {
  return (
    <>
      <PageHeader
        eyebrow="The apartment"
        title="Built for how you want it."
        lead="Two self-contained apartments, each opening directly onto the serene LivingSpring Gardens — thoughtfully laid out for how you work, rest, and unwind."
      />

      <section className="pb-24 sm:pb-32">
        <div className={container}>
          <div className="reveal overflow-hidden rounded-[28px]">
            <img src="/images/living-room-1.jpg" alt="Living room" className="aspect-[21/9] w-full object-cover" />
          </div>

          <div className="reveal mt-20">
            <Eyebrow>At a glance</Eyebrow>
            <h2 className="mt-5 font-display text-[34px] font-light tracking-[-0.02em] text-ink sm:text-[44px]">Each apartment</h2>
          </div>
          <div className="reveal mt-10 grid border-y border-stone sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Sleeps up to" value="2–3" suffix="guests · up to 4 for couples" />
            <StatCard label="Bedrooms" value="2" />
            <StatCard label="Beds" value="2–3" suffix="3 in Apartment A · 2 in Apartment B" />
            <StatCard label="Bathrooms" value="2" suffix="Apartment A has an extra guest washroom" />
          </div>
        </div>
      </section>

      <section className="bg-sand/60 py-24 sm:py-32">
        <div className={container}>
          <div className="reveal">
            <Eyebrow>Rates</Eyebrow>
            <h2 className="mt-5 max-w-xl font-display text-[34px] font-light leading-[1.12] tracking-[-0.02em] text-ink sm:text-[44px]">
              Simple pricing, better for longer stays.
            </h2>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            <RateCard
              eyebrow="Standard"
              price="$41"
              unit="/ night"
              desc="The base rate per apartment (2 bedrooms), all-inclusive of the amenities listed above."
            />
            <RateCard
              eyebrow="5-night stays"
              price="$10"
              unit="off"
              desc="Book 5 nights or more and save $10 off your total."
            />
            <RateCard
              eyebrow="28–30 night stays"
              price="20%"
              unit="off"
              desc="Book a full month and save 20% off your total."
              featured
            />
          </div>
        </div>
      </section>

      <ReviewsSection />

      <CtaBand title="Come and see the space." lead="Enquire about dates, rates, and long stays." />
    </>
  );
}

function RateCard({ eyebrow, price, unit, desc, featured }) {
  return (
    <div
      className={`reveal relative flex flex-col rounded-[24px] p-9 transition-transform duration-500 ease-calm hover:-translate-y-1 ${
        featured ? 'bg-forest text-ivory shadow-[0_30px_60px_-30px_rgba(31,61,48,0.6)]' : 'bg-paper text-ink shadow-[0_1px_0_rgba(27,36,32,0.06)]'
      }`}
    >
      {featured && (
        <span className="absolute right-6 top-6 rounded-full bg-ivory/15 px-3 py-1 text-[11px] font-medium tracking-wide text-ivory">
          Best for long stays
        </span>
      )}
      <span className={`text-[11.5px] font-medium uppercase tracking-[0.22em] ${featured ? 'text-ivory/60' : 'text-muted'}`}>{eyebrow}</span>
      <div className="mt-8 flex items-baseline gap-2">
        <span className="font-display text-[64px] font-light leading-none tracking-[-0.03em]">{price}</span>
        <span className={`text-[15px] ${featured ? 'text-ivory/70' : 'text-muted'}`}>{unit}</span>
      </div>
      <p className={`mt-8 text-[15px] leading-relaxed ${featured ? 'text-ivory/80' : 'text-ink-soft'}`}>{desc}</p>
    </div>
  );
}

function StatCard({ label, value, suffix }) {
  return (
    <div className="border-stone px-1 py-9 sm:px-8 sm:[&:nth-child(n+3)]:border-t lg:border-l lg:first:border-l-0 lg:first:pl-1 lg:[&:nth-child(n+3)]:border-t-0">
      <div className="font-display text-[56px] font-light leading-none tracking-[-0.03em] text-ink">{value}</div>
      <div className="mt-4 text-[13px] font-medium uppercase tracking-[0.18em] text-ink">{label}</div>
      {suffix && <div className="mt-2 text-[14px] leading-snug text-muted">{suffix}</div>}
    </div>
  );
}
