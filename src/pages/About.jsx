import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

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
            <div className="reveal">
              <img
                src="/images/hero-property.jpg"
                alt="LivingSpring Gardens"
                className="rounded-img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Location — two-column text, no repeated photo */}
      <section className="section section-cream">
        <div className="container">
          <div className="two-col two-col-text reveal">
            <div>
              <span className="eyebrow">SUNYANI</span>
              <h2>The garden city of the Bono Region.</h2>
              <p className="prose">
                Sunyani is smaller and calmer than the coastal cities — a good pace of life,
                a beautiful hinterland, and enough going on for a proper week or a proper month.
              </p>
            </div>
            <div>
              <p className="prose">
                A central location for exploring the Bono Region, with plenty worth the drive
                just outside the city.
              </p>
              <ul className="prose-list">
                <li>Kintampo Waterfalls</li>
                <li>Bui National Park</li>
                <li>Sunyani's central market &amp; cafés</li>
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
