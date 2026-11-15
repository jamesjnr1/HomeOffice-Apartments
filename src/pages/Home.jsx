import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import WalkthroughSection from '../components/WalkthroughSection';
import ReviewsSection from '../components/ReviewsSection';

export default function Home() {
  return (
    <>
      {/* Hero — full-bleed photo, editorial text at bottom-left */}
      <section className="hero-v2">
        <div className="hero-v2-bg" aria-hidden="true">
          {/* Sized WebP versions (phones get the 1000px one), loaded first */}
          <img
            src="/images/hero-property.jpg"
            srcSet="/images/hero-property-1000.webp 1000w, /images/hero-property-1600.webp 1600w"
            sizes="100vw"
            alt="Home-Office Apartments — a considered stay"
            fetchPriority="high"
            decoding="async"
          />
          <div className="hero-v2-scrim" />
        </div>

        <div className="container hero-v2-content">
          <div className="hero-v2-inner">
            <h1 className="hero-v2-title">
              A quiet place for hideout, retreat or work.
            </h1>
            <p className="hero-v2-lead">
              Home-Office Apartments — thoughtfully finished for how you actually spend your days,
              set in the calm of LivingSpring Gardens.
            </p>
            <div className="hero-v2-actions">
              <Link to="/book" className="btn btn-primary btn-lg">Check availability</Link>
              <Link to="/gallery" className="btn btn-ghost-light btn-lg">
                See the apartments <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="section section-narrow">
        <div className="container">
          <div className="intro-simple reveal">
            <span className="eyebrow">A HOME AWAY FROM HOME</span>
            <h2>
              <span className="intro-v2-accent">Jerusalem stone elegance</span>, a peaceful
              pergola front yard, and expansive open space for relaxation or memorable events.
            </h2>
            <p className="prose">
              Self‑contained apartments in a peaceful compound, each opening directly onto the
              serene LivingSpring Gardens — designed for the way you work from home and the way you rest.
            </p>
          </div>
        </div>
      </section>

      {/* Video walkthrough of the property */}
      <WalkthroughSection />

      {/* Two photo tiles, title and link on the photo */}
      <section className="section section-cream">
        <div className="container">
          <div className="photo-tiles">
            <Link to="/apartments" className="photo-tile reveal">
              <img src="/images/lounge-window.jpg" srcSet="/images/lounge-window-800.webp 800w, /images/lounge-window-1280.webp 1280w" sizes="(max-width: 820px) 100vw, 50vw" alt="Lounge with a work chair at Home-Office Apartments" loading="lazy" decoding="async" />
              <div className="photo-tile-text">
                <span className="eyebrow eyebrow-light">THE APARTMENT</span>
                <h3>Built for how you work.</h3>
                <p>Fast Wi-Fi, dedicated desk, and a well-considered kitchen.</p>
                <span className="photo-tile-link">See the apartment <ArrowRight size={15} /></span>
              </div>
            </Link>
            <Link to="/gallery" className="photo-tile reveal">
              <img src="/images/lounge-kitchen-view.jpg" srcSet="/images/lounge-kitchen-view-800.webp 800w, /images/lounge-kitchen-view-1280.webp 1280w" sizes="(max-width: 820px) 100vw, 50vw" alt="View through the arch to the kitchen and dining area" loading="lazy" decoding="async" />
              <div className="photo-tile-text">
                <span className="eyebrow eyebrow-light">TAKE A LOOK INSIDE</span>
                <h3>Every room, well considered.</h3>
                <p>Four bedrooms, a full kitchen, and living spaces built for a proper stay.</p>
                <span className="photo-tile-link">See the gallery <ArrowRight size={15} /></span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* What guests say — same reviews section as /apartments */}
      <ReviewsSection />

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
