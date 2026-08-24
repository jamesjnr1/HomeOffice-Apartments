import { Link } from 'react-router-dom';
import {
  Wifi,
  Monitor,
  Coffee,
  UtensilsCrossed,
  Snowflake,
  Bath,
  ShieldCheck,
  Trees,
  ArrowRight,
} from 'lucide-react';

export default function Apartments() {
  return (
    <>
      <section className="page-header">
        <div className="container">
          <p className="eyebrow">THE APARTMENTS</p>
          <h1>Built for how you work.</h1>
          <p className="lead">
            Two self-contained apartments, each with a proper kitchen, a real workspace,
            and a private outdoor spot to sit with a book or a plate of food.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="two-col">
            <div className="reveal">
              <p className="eyebrow">DESIGNED FOR REMOTE WORK</p>
              <h2>Everything you need to focus.</h2>
              <p className="prose">
                Fast fibre Wi-Fi, a dedicated desk with a comfortable chair, and quiet corners
                for calls. The apartments are set back from the road, so noise stays where it belongs.
              </p>
              <p className="prose">
                When the workday ends, the kitchen is stocked with the basics, the shower is powerful,
                and the verandah is the best seat in the house.
              </p>
            </div>
            <div className="reveal">
              <img
                src="https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1400&q=80"
                alt="Dedicated workspace"
                className="rounded-img"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="section section-cream">
        <div className="container">
          <div className="section-head reveal">
            <p className="eyebrow">FEATURES</p>
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
            <StatCard label="Apartments" value="2" />
            <StatCard label="Sleeps up to" value="4" suffix="per apartment" />
            <StatCard label="Bedrooms" value="1–2" suffix="per apartment" />
            <StatCard label="Wi-Fi" value="Fibre" suffix="dedicated" />
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

function StatCard({ label, value, suffix }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {suffix && <div className="stat-suffix">{suffix}</div>}
    </div>
  );
}
