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

      {/* Intro */}
      <section className="section section-narrow">
        <div className="container">
          <div className="intro-v2 reveal">
            <span className="eyebrow">A HOME AWAY FROM HOME</span>
            <h2>Warm timber. Cool tile. A shaded verandah for morning coffee.</h2>
            <p className="prose">
              Warm timber and cool tile welcome you into a space of comfort, while a shaded
              verandah invites you to savor your morning coffee. Beyond the walls, serene,
              well‑hewn lawns stretch across LivingSpring Gardens, offering a refreshing escape
              into nature. Here, convenience meets tranquility—perfect for relaxation, reflection,
              rest, and memorable holidays.
            </p>
            <Link to="/apartments" className="link-arrow">
              Explore the apartments <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Two-card teaser */}
      <section className="section section-cream">
        <div className="container">
          <div className="teaser-grid">
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
