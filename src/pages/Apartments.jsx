import { Link } from 'react-router-dom';
import {
  Wifi, Monitor, Coffee, UtensilsCrossed, Snowflake, Bath, ShieldCheck, Trees, ArrowRight,
} from 'lucide-react';

export default function Apartments() {
  return (
    <>
      <section className="page-header page-header-v2">
        <div className="container">
          <span className="eyebrow">THE APARTMENT</span>
          <h1>Built for how you work.</h1>
          <p className="lead">
            One self-contained apartment with four bedrooms, a proper kitchen, a real workspace,
            and a private outdoor spot to sit with a book or a plate of food.
          </p>
        </div>
      </section>

      <section className="section section-narrow">
        <div className="container">
          <div className="intro-v2 reveal">
            <span className="eyebrow">DESIGNED FOR REMOTE WORK</span>
            <h2>Everything you need to focus.</h2>
            <p className="prose">
              Fast fibre Wi-Fi, a dedicated desk with a comfortable chair, and quiet corners
              for calls. The apartment is set back from the road, so noise stays where it belongs.
            </p>
            <p className="prose">
              When the workday ends, the kitchen is stocked with the basics, the shower is powerful,
              and the verandah is the best seat in the house.
            </p>
          </div>
        </div>
      </section>

      <section className="section section-cream">
        <div className="container">
          <div className="section-head-left reveal">
            <span className="eyebrow">FEATURES</span>
            <h2>Small comforts, well considered.</h2>
          </div>

          <div className="features-grid">
            <Feature icon={<Wifi />} title="Fibre Wi-Fi">Fast, reliable, dedicated. Suitable for video calls.</Feature>
            <Feature icon={<Monitor />} title="Dedicated workspace">Desk, ergonomic chair, external monitor on request.</Feature>
            <Feature icon={<UtensilsCrossed />} title="Full kitchen">Fridge, stove, cookware, and stocked basics on arrival.</Feature>
            <Feature icon={<Snowflake />} title="Air conditioning">Bedroom and living area, quiet at night.</Feature>
            <Feature icon={<Coffee />} title="Morning coffee">Grinder, cafetière, and locally roasted beans.</Feature>
            <Feature icon={<Bath />} title="Hot shower">Instant hot water, generous pressure.</Feature>
            <Feature icon={<ShieldCheck />} title="Safe compound">Gated, quiet, with a caretaker on-site.</Feature>
            <Feature icon={<Trees />} title="Private verandah">Shaded outdoor space attached to each apartment.</Feature>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="stat-band reveal">
            <StatCard label="Sleeps up to" value="4" suffix="guests" />
            <StatCard label="Bedrooms" value="4" />
            <StatCard label="Beds" value="5" />
            <StatCard label="Bathrooms" value="4" />
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
              desc="The base rate per flat, all-inclusive of the amenities above."
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
