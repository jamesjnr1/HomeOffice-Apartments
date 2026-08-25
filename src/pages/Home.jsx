import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <>
      {/* Hero — full-bleed photo, editorial text at bottom-left */}
      <section className="hero-v2">
        <div className="hero-v2-bg" aria-hidden="true">
          <img
            src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=2400&q=90"
            alt="Home-Office Apartments — a considered stay"
          />
          <div className="hero-v2-scrim" />
        </div>

        <div className="container hero-v2-content">
          <div className="hero-v2-inner">
            <span className="hero-v2-tag">A boutique stay in Sunyani</span>
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

      {/* Intro — LEFT aligned prose (no more centered walls of text) */}
      <section className="section section-narrow">
        <div className="container">
          <div className="intro-v2 reveal">
            <span className="eyebrow">A HOME AWAY FROM HOME</span>
            <h2>Warm timber. Cool tile. A shaded verandah for morning coffee.</h2>
            <p className="prose">
              Two self-contained apartments in a peaceful compound in Sunyani, built for the way you
              work from home and the way you rest.
            </p>
            <Link to="/apartments" className="link-arrow">
              Explore the apartments <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Two-card teaser — left-aligned inside each card */}
      <section className="section section-cream">
        <div className="container">
          <div className="teaser-grid">
            <Link to="/apartments" className="teaser-card reveal">
              <div className="teaser-img">
                <img
                  src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80"
                  alt="Interior of Home-Office Apartments"
                />
              </div>
              <div className="teaser-body">
                <span className="eyebrow">THE APARTMENTS</span>
                <h3>Built for how you work.</h3>
                <p className="prose">Fast Wi-Fi, dedicated desk, and a well-considered kitchen.</p>
                <span className="link-arrow">See the apartments <ArrowRight size={14} /></span>
              </div>
            </Link>

            <Link to="/gardens" className="teaser-card reveal">
              <div className="teaser-img">
                <img
                  src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80"
                  alt="LivingSpring Gardens compound"
                />
              </div>
              <div className="teaser-body">
                <span className="eyebrow">LIVINGSPRING GARDENS</span>
                <h3>The compound they sit in.</h3>
                <p className="prose">A quiet, green corner of Sunyani. Room to breathe.</p>
                <span className="link-arrow">Meet the gardens <ArrowRight size={14} /></span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Closing CTA — stays centered because it's meant to be a moment */}
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
