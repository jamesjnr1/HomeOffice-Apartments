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

          <div className="two-col directions-block reveal">
            <div>
              <span className="eyebrow">GETTING HERE</span>
              <h2>Find us in Fiapre.</h2>
              <p className="prose">
                Home-Office Apartments and LivingSpring Gardens is in Fiapre, Sunyani, Bono Region.
              </p>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Fiapre%2C+Sunyani%2C+Ghana"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
              >
                Get directions <ArrowRight size={16} />
              </a>
            </div>
            <div>
              <iframe
                title="Map to Home-Office Apartments"
                className="directions-map"
                src="https://www.google.com/maps?q=Fiapre,+Sunyani,+Ghana&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
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
