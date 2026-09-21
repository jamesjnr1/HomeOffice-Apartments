import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Wifi, Utensils, Tv, Laptop, Trees, BedDouble } from 'lucide-react';
import StatCard from '../components/StatCard';

// Only amenities already promised elsewhere on the site (Home.jsx,
// Book.jsx) — never inventing a facility (AC, parking, etc.) that
// isn't actually established as real, now that guests can pay for a
// stay automatically with no human checking the claim first.
const FACILITIES = [
  { icon: Wifi, label: 'Fast Wi-Fi' },
  { icon: Laptop, label: 'Dedicated desk' },
  { icon: Utensils, label: 'Modern kitchen' },
  { icon: Tv, label: 'Smart TV' },
  { icon: BedDouble, label: 'Comfortable bedrooms' },
  { icon: Trees, label: 'Private garden access' },
];

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

          {/* A quick visual tour — three photos in a row, same idea as
              the gallery row on royalirenichotel.com's about page. */}
          <div className="photo-row reveal">
            <img src="/images/exterior-1.jpg" alt="Exterior of Home-Office Apartments" />
            <img src="/images/living-room-1.jpg" alt="Living room" />
            <img src="/images/kitchen.jpg" alt="Kitchen" />
          </div>

          <div className="stat-band reveal" style={{ marginTop: 40 }}>
            <StatCard label="Apartments" value="2" suffix="Independently bookable" />
            <StatCard label="Bedrooms" value="2" suffix="Per apartment" />
            <StatCard label="Sleeps up to" value="4" suffix="Per apartment" />
            <StatCard label="Location" value="Fiapre" suffix="Sunyani, Bono Region" />
          </div>
        </div>
      </section>

      {/* Facilities — icon + label cards, same idea as the "Most
          Popular Facilities" grid on royalirenichotel.com's about
          page. Only amenities already established elsewhere on this
          site — see the FACILITIES list above. */}
      <section className="section section-cream">
        <div className="container">
          <div className="section-head-left reveal">
            <span className="eyebrow eyebrow-icon"><CheckCircle2 size={14} /> WHAT'S INCLUDED</span>
            <h2>Every stay, every apartment.</h2>
          </div>
          <div className="facility-grid reveal">
            {FACILITIES.map(({ icon: Icon, label }) => (
              <div className="facility-card" key={label}>
                <span className="feature-icon"><Icon /></span>
                <span>{label}</span>
              </div>
            ))}
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

          <div className="two-col directions-block reveal">
            <div>
              <span className="eyebrow">GETTING HERE</span>
              <h2>Find us in Fiapre.</h2>
              <p className="prose">
                Home-Office Apartments and LivingSpring Gardens is in Fiapre, Sunyani, Bono Region.
              </p>
              <p className="prose">
                Ghana Post Digital Address: <strong className="mono">BY-0188-6413</strong>
              </p>
              <a
                href="https://www.google.com/maps/dir/?api=1&destination=BY-0188-6413"
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
                src="https://www.google.com/maps?q=BY-0188-6413&output=embed"
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
            <p className="lead lead-light">Check your dates — if they're free, you can pay and lock them in right away.</p>
            <Link to="/book" className="btn btn-primary btn-lg">
              Book & pay now <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
