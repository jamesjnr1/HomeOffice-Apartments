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
              A self-contained apartment in a peaceful compound in Sunyani, built for the way you
              work from home and the way you rest. It opens onto the gardens.
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

            <Link to="/gardens" className="teaser-card reveal">
              <div className="teaser-img">
                <img
                  src="/images/hero-property.jpg"
                  alt="LivingSpring Gardens"
                />
              </div>
              <div className="teaser-body">
                <span className="eyebrow">LIVINGSPRING GARDENS</span>
                <h3>The garden they open onto.</h3>
                <p className="prose">A private, landscaped garden inside the compound — mature trees, lit stone paths, and a small pavilion.</p>
                <span className="link-arrow">Walk the gardens <ArrowRight size={14} /></span>
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
