import { Link } from 'react-router-dom';
import {
  Wifi, UtensilsCrossed, Snowflake, Bath, ShieldCheck, Trees, ArrowRight, BedDouble, Sofa,
} from 'lucide-react';

export default function Apartments() {
  return (
    <>
      <section className="page-header page-header-v2">
        <div className="container">
          <span className="eyebrow">THE APARTMENT</span>
          <h1>Built for how you want it.</h1>
          <p className="lead">Each separate apartment offers:</p>

          <div className="features-grid features-2">
            <Feature icon={<BedDouble />} title="Two bedrooms">Comfortable furnishings throughout.</Feature>
            <Feature icon={<Sofa />} title="Multi-purpose hall">A large, well-furnished space for relaxation, work, or family gatherings.</Feature>
            <Feature icon={<UtensilsCrossed />} title="Modern kitchen">Equipped for everyday convenience.</Feature>
            <Feature icon={<Trees />} title="Private outdoor spot">Perfect for a book or a plate of food.</Feature>
          </div>

          <p className="lead" style={{ marginTop: 32 }}>
            Set within a peaceful compound, the apartments open directly onto the serene
            LivingSpring Gardens, where well‑kept lawns and tranquil surroundings create the
            ideal atmosphere for rest, reflection, and holidays.
          </p>

          <div className="page-header-callout reveal">
            <h3>Everything you need to focus and unwind.</h3>
            <p className="prose">
              Enjoy high-speed internet, comfortable sofas and chairs, and quiet corners that
              make calls and work feel effortless.
            </p>
            <p className="prose">
              When the day slows down, the multi-purpose hall provides space for relaxation,
              family gatherings, or reflection. Step outside to discover private outdoor spots
              and many peaceful places across the apartment and compound where you can sit with
              a book, share a meal, or simply breathe in the calm.
            </p>
            <p className="page-header-callout-tag">Work Smart, Rest Easy at LivingSpring Gardens</p>
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
          <div className="stat-band reveal">
            <StatCard label="Sleeps up to" value="2–3" suffix="guests · up to 4 for couples" />
            <StatCard label="Bedrooms" value="2" />
            <StatCard label="Beds" value="2–3" suffix="3 in Apartment A · 2 in Apartment B" />
            <StatCard label="Bathrooms" value="2" suffix="Apartment A has an extra guest washroom" />
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

function StatCard({ label, value, suffix }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {suffix && <div className="stat-suffix">{suffix}</div>}
    </div>
  );
}
