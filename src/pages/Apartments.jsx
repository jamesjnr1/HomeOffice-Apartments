import { Link } from 'react-router-dom';
import {
  Wifi, UtensilsCrossed, Snowflake, Bath, ShieldCheck, Trees, ArrowRight,
} from 'lucide-react';

const LAYOUT = [
  { title: 'Two bedrooms', desc: 'Comfortable furnishings throughout.' },
  { title: 'Multi-purpose hall', desc: 'A large, well-furnished space for relaxation, work, or family gatherings.' },
  { title: 'Modern kitchen', desc: 'Equipped for everyday convenience.' },
  { title: 'Private outdoor spot', desc: 'Perfect for a book or a plate of food.' },
];

export default function Apartments() {
  return (
    <>
      {/* Header — one clear message, nothing crammed in */}
      <section className="page-header page-header-v2">
        <div className="container">
          <span className="eyebrow">THE APARTMENT</span>
          <h1>Built for how you want it.</h1>
          <p className="lead">
            Two self-contained apartments, each opening directly onto the serene LivingSpring
            Gardens — thoughtfully laid out for how you work, rest, and unwind.
          </p>
        </div>
      </section>

      {/* Layout — an editorial spec sheet instead of a boxed icon grid */}
      <section className="section section-cream">
        <div className="container">
          <div className="section-head-left reveal">
            <span className="eyebrow">LAYOUT</span>
            <h2>Two bedrooms, thoughtfully arranged.</h2>
          </div>

          <div className="numbered-list reveal">
            {LAYOUT.map((item, i) => (
              <div className="numbered-item" key={item.title}>
                <span className="numbered-index">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pull-quote — the apartment's ethos in one line, with room to breathe */}
      <section className="section">
        <div className="container">
          <div className="pull-quote-block reveal">
            <p className="pull-quote">
              Work smart, rest easy at LivingSpring Gardens.
            </p>
            <span className="pull-quote-cite">The apartment, in a sentence</span>
            <div className="pull-quote-body">
              <p className="prose">
                Enjoy high-speed internet, comfortable sofas and chairs, and quiet corners that
                make calls and work feel effortless.
              </p>
              <p className="prose">
                When the day slows down, the multi-purpose hall provides space for relaxation,
                family gatherings, or reflection. Step outside to discover private outdoor spots
                and many peaceful places across the compound where you can sit with a book,
                share a meal, or simply breathe in the calm.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-cream">
        <div className="container">
          <div className="section-head-left reveal">
            <span className="eyebrow">FEATURES</span>
            <h2>Small comforts, well considered.</h2>
          </div>

          <div className="features-grid features-3">
            <Feature icon={<Wifi />} title="High-Speed Wi-Fi">Fast, reliable, dedicated. Suitable for video calls.</Feature>
            <Feature icon={<UtensilsCrossed />} title="Full kitchen">Fridge, stove, cookware.</Feature>
            <Feature icon={<Snowflake />} title="Air conditioning">Bedroom and living area, quiet at night.</Feature>
            <Feature icon={<Bath />} title="Hot shower">Instant hot water, generous pressure.</Feature>
            <Feature icon={<ShieldCheck />} title="Safe compound">Gated, quiet, with a caretaker on-site.</Feature>
            <Feature icon={<Trees />} title="Private verandah">Shaded outdoor space attached to each apartment.</Feature>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head-left reveal">
            <span className="eyebrow">AT A GLANCE</span>
            <h2>Each apartment</h2>
          </div>
          <div className="fact-band reveal">
            <FactCard label="Sleeps up to" value="2–3" suffix="guests · up to 4 for couples" />
            <FactCard label="Bedrooms" value="2" />
            <FactCard label="Beds" value="2–3" suffix="3 in Apartment A · 2 in Apartment B" />
            <FactCard label="Bathrooms" value="2" suffix="Apartment A has an extra guest washroom" />
          </div>
        </div>
      </section>

      <section className="section section-cream">
        <div className="container">
          <div className="section-head-left reveal">
            <span className="eyebrow">RATES</span>
            <h2>Simple pricing, better for longer stays.</h2>
          </div>

          <div className="rate-cards">
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

      <section className="section cta-band">
        <div className="container">
          <div className="cta-content reveal">
            <h2>Come and see the space.</h2>
            <p className="lead lead-light">Enquire about dates, rates, and long stays.</p>
            <Link to="/book" className="btn btn-primary btn-lg">
              Send an enquiry <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Feature({ icon, title, children }) {
  return (
    <div className="feature reveal">
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}

function RateCard({ eyebrow, price, unit, desc, featured }) {
  return (
    <div className={`rate-card reveal${featured ? ' featured' : ''}`}>
      {featured && <span className="rate-badge">Best for long stays</span>}
      <span className="rate-card-eyebrow">{eyebrow}</span>
      <div className="rate-card-price">
        {price}
        <span className="rate-card-unit">{unit}</span>
      </div>
      <p className="rate-card-desc">{desc}</p>
    </div>
  );
}

function FactCard({ label, value, suffix }) {
  return (
    <div className="fact-item">
      <div className="fact-rule" />
      <div className="fact-value">{value}</div>
      <div className="fact-label">{label}</div>
      {suffix && <div className="fact-suffix">{suffix}</div>}
    </div>
  );
}
