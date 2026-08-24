import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <>
      {/* Hero — quieter, more editorial */}
      <section className="hero">
        <div className="hero-bg" aria-hidden="true" />
        <div className="container hero-content">
          <p className="eyebrow eyebrow-light hero-eyebrow">SUNYANI · GHANA</p>
          <div className="hero-rule" aria-hidden="true" />
          <h1 className="hero-title">
            A quiet place<br />
            to <span className="hero-accent">work and live.</span>
          </h1>
          <p className="lead lead-light hero-lead">
            Home-Office Apartments — thoughtfully finished for how you actually spend your days.
            Set in the calm of LivingSpring Gardens.
          </p>
          <div className="hero-actions">
            <Link to="/book" className="btn btn-primary btn-lg">
              Check availability
            </Link>
            <Link to="/apartments" className="btn btn-ghost-light btn-lg">
              See the apartments <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Short intro */}
      <section className="section">
        <div className="container">
          <div className="intro-block reveal">
            <p className="eyebrow">A HOME AWAY FROM HOME</p>
            <h2>
              Warm timber. Cool tile. A shaded verandah for<br /> morning coffee.
            </h2>
            <p className="prose intro-lede">
              Two self-contained apartments in a peaceful compound in Sunyani, built for the way you work
              from home and the way you rest.
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
                  src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80"
                  alt="Interior of Home-Office Apartments"
                />
              </div>
              <div className="teaser-body">
                <p className="eyebrow">THE APARTMENTS</p>
                <h3>Built for how you work.</h3>
                <p className="prose">
                  Fast Wi-Fi, dedicated desk, and a well-considered kitchen.
                </p>
                <span className="link-arrow">
                  See the apartments <ArrowRight size={14} />
                </span>
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
                <p className="eyebrow">LIVINGSPRING GARDENS</p>
                <h3>The compound they sit in.</h3>
                <p className="prose">
                  A quiet, green corner of Sunyani. Room to breathe.
                </p>
                <span className="link-arrow">
                  Meet the gardens <ArrowRight size={14} />
                </span>
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
            <p className="lead lead-light">
              Enquire about availability. We usually reply within a day.
            </p>
            <Link to="/book" className="btn btn-primary btn-lg">
              Send an enquiry
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
