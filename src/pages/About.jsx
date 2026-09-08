import { Link } from 'react-router-dom';
import { ArrowRight, Waves, Trees, Coffee } from 'lucide-react';

export default function About() {
  return (
    <>
      <section className="page-header page-header-v2">
        <div className="container">
          <span className="eyebrow">ABOUT</span>
          <h1>A family compound, opened to guests.</h1>
          <p className="lead">
            Home-Office Apartments began as a simple idea — turn part of our family garden in Sunyani
            into a home away from home for people passing through, working remotely, or visiting for a season.
          </p>
        </div>
      </section>

      {/* Story — the one place a photo earns its keep on this page */}
      <section className="section">
        <div className="container">
          <div className="two-col">
            <div className="reveal">
              <span className="eyebrow">THE STORY</span>
              <h2>Why we built it.</h2>
              <p className="prose">
                LivingSpring Gardens has been part of our family for years — the trees older
                than most of us. When more of the family started working remotely, and more friends
                started visiting Sunyani for a week at a time, the question came up naturally:
                could we make part of it a place other people would want to stay?
              </p>
              <p className="prose">
                So we built an apartment on the edge of the compound — four bedrooms, well-considered,
                and quiet, the kind of place we'd want to stay ourselves.
              </p>
            </div>
            <div className="reveal photo-frame">
              <img
                src="/images/hero-property.jpg"
                alt="LivingSpring Gardens"
                className="rounded-img"
              />
              <div className="photo-badge">
                <span className="photo-badge-value">Est. family compound</span>
                <span className="photo-badge-label">LivingSpring Gardens</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* A dark, editorial facts strip — ties this page to the same
          visual language as Apartments' "at a glance" section */}
      <section className="section section-cream">
        <div className="container">
          <div className="section-head-left reveal">
            <span className="eyebrow">AT A GLANCE</span>
            <h2>The compound, in short.</h2>
          </div>
          <div className="fact-band reveal">
            <FactCard label="Location" value="Sunyani" suffix="Bono Region, Ghana" />
            <FactCard label="Bedrooms" value="4" suffix="Across two apartments" />
            <FactCard label="Setting" value="Family-run" suffix="LivingSpring Gardens compound" />
            <FactCard label="Reply time" value="~24h" suffix="Usual enquiry response" />
          </div>
        </div>
      </section>

      {/* Location — editorial two-column text, no repeated photo */}
      <section className="section">
        <div className="container">
          <div className="two-col two-col-text reveal">
            <div>
              <span className="eyebrow">SUNYANI</span>
              <h2>The garden city of the Bono Region.</h2>
              <p className="prose">
                Sunyani is smaller and calmer than the coastal cities — a good pace of life,
                a beautiful hinterland, and enough going on for a proper week or a proper month.
                A central location for exploring the region, with plenty worth the drive just
                outside the city.
              </p>
            </div>
            <div>
              <ul className="locale-list">
                <li className="locale-item">
                  <span className="locale-icon"><Waves /></span>
                  <div>
                    <h4>Kintampo Waterfalls</h4>
                    <p>A scenic drive from the compound — worth the full day.</p>
                  </div>
                </li>
                <li className="locale-item">
                  <span className="locale-icon"><Trees /></span>
                  <div>
                    <h4>Bui National Park</h4>
                    <p>Forest, river, and wildlife across the Bono hinterland.</p>
                  </div>
                </li>
                <li className="locale-item">
                  <span className="locale-icon"><Coffee /></span>
                  <div>
                    <h4>Sunyani market &amp; cafés</h4>
                    <p>Minutes from the compound, for everyday essentials.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section cta-band">
        <div className="container">
          <div className="cta-content reveal">
            <h2>Come stay with us.</h2>
            <p className="lead lead-light">We usually reply to enquiries within a day.</p>
            <Link to="/book" className="btn btn-primary btn-lg">
              Send an enquiry <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </>
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
