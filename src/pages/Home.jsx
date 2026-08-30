import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <>
      {/* Hero — full-bleed photo, editorial text at bottom-left */}
      <section className="hero-v2">
        <div className="hero-v2-bg" aria-hidden="true">
          <img
            src="/images/hero-property.jpg"
            alt="Home-Office Apartments — a considered stay"
          />
          <div className="hero-v2-scrim" />
        </div>

        <div className="container hero-v2-content">
          <div className="hero-v2-inner">
            <h1 className="hero-v2-title">
              A quiet place to<br />
              work and live.
            </h1>
            <p className="hero-v2-lead">
              Home-Office Apartments — thoughtfully finished for how you actually spend your days,
              set in the calm of LivingSpring Gardens.
            </p>
            <div className="hero-v2-actions">
              <Link to="/book" className="btn btn-primary btn-lg">Check availability</Link>
              <Link to="/apartments" className="btn btn-ghost-light btn-lg">
                See the apartments <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick facts strip */}
      <section className="quick-facts">
        <div className="container">
          <div className="stat-band">
            <StatCard label="Sleeps up to" value="4" suffix="guests" />
            <StatCard label="Bedrooms" value="4" />
            <StatCard label="Beds" value="5" />
            <StatCard label="Bathrooms" value="4" />
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="section section-narrow">
        <div className="container">
          <div className="two-col">
            <div className="reveal">
              <span className="eyebrow">A HOME AWAY FROM HOME</span>
              <h2>Warm timber. Cool tile. A shaded verandah for morning coffee.</h2>
              <p className="prose">
                Discover a self‑contained apartment in a peaceful compound, thoughtfully designed
                for the way you work from home and the way you rest.
              </p>
              <p className="prose" style={{ marginBottom: 12 }}>Each apartment features:</p>
              <ul className="prose-list">
                <li>A spacious, fully furnished hall with TV</li>
                <li>A modern kitchen equipped for convenience</li>
                <li>Two comfortable bedrooms with King, Queen, and Standard beds</li>
              </ul>
              <p className="prose">
                Step outside and your apartment opens directly onto the serene LivingSpring Gardens,
                where well‑kept lawns and tranquil surroundings create the perfect setting for
                relaxation, reflection, and holidays.
              </p>
              <Link to="/apartments" className="link-arrow">
                Explore the apartment <ArrowRight size={14} />
              </Link>
            </div>
            <div className="photo-collage reveal">
              <img className="photo-collage-item" src="/images/bedroom-1.jpg" alt="Bedroom" />
              <img className="photo-collage-item" src="/images/kitchen.jpg" alt="Kitchen" />
              <img className="photo-collage-item" src="/images/bathroom.jpg" alt="Bathroom" />
              <img className="photo-collage-item" src="/images/living-room-2.jpg" alt="Living room" />
            </div>
          </div>
        </div>
      </section>

      {/* Three-card teaser */}
      <section className="section section-cream">
        <div className="container">
          <div className="section-head-left reveal">
            <span className="eyebrow">EXPLORE</span>
            <h2>Everything you need to know.</h2>
          </div>

          <div className="teaser-grid teaser-grid-3">
            <Link to="/apartments" className="teaser-card reveal">
              <div className="teaser-img">
                <img
                  src="/images/living-room-1.jpg"
                  alt="Interior of Home-Office Apartments"
                />
              </div>
              <div className="teaser-body">
                <span className="eyebrow">THE APARTMENT</span>
                <h3>Built for how you work.</h3>
                <p className="prose">Fast Wi-Fi, dedicated desk, and a well-considered kitchen.</p>
                <span className="link-arrow">See the apartment <ArrowRight size={14} /></span>
              </div>
            </Link>

            <Link to="/gallery" className="teaser-card reveal">
              <div className="teaser-img">
                <img
                  src="/images/dining-kitchenette.jpg"
                  alt="Inside Home-Office Apartments"
                />
              </div>
              <div className="teaser-body">
                <span className="eyebrow">TAKE A LOOK INSIDE</span>
                <h3>Every room, well considered.</h3>
                <p className="prose">Four bedrooms, a full kitchen, and living spaces built for a proper stay.</p>
                <span className="link-arrow">See the gallery <ArrowRight size={14} /></span>
              </div>
            </Link>

            <Link to="/apartments" className="teaser-card reveal">
              <div className="teaser-img">
                <img
                  src="/images/bedroom-3.jpg"
                  alt="Simple pricing"
                />
              </div>
              <div className="teaser-body">
                <span className="eyebrow">RATES</span>
                <h3>Simple pricing, better for longer stays.</h3>
                <p className="prose">$41/night, with real discounts for 5-night and month-long stays.</p>
                <span className="link-arrow">See the rates <ArrowRight size={14} /></span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="section cta-band">
        <div className="container">
          <div className="cta-content reveal">
            <h2>Ready to plan your stay?</h2>
            <p className="lead lead-light">Enquire about availability. We usually reply within a day.</p>
            <Link to="/book" className="btn btn-primary btn-lg">Send an enquiry</Link>
          </div>
        </div>
      </section>
    </>
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
