import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import StatCard from '../components/StatCard';
import { NIGHTLY_RATE_GHS, MULTI_NIGHT_DISCOUNT_GHS, LONG_STAY_DISCOUNT_PCT } from '../lib/pricing';

export default function Apartments() {
  return (
    <>
      {/* Header — one clear message, nothing crammed in */}
      <section className="page-header page-header-v2">
        <div className="container">
          <span className="eyebrow">THE APARTMENT</span>
          <h1>Built for how you want it.</h1>
          <p className="lead">
            Two self-contained apartments, each opening directly onto the serene LivingSpring
            Gardens — thoughtfully laid out for how you work, rest, and unwind.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head-left reveal">
            <span className="eyebrow">AT A GLANCE</span>
            <h2>Each apartment</h2>
          </div>
          <div className="stat-band reveal">
            <StatCard label="Sleeps up to" value="2–3" suffix="guests · up to 4 for couples" />
            <StatCard label="Bedrooms" value="2" />
            <StatCard label="Beds" value="2–3" suffix="3 in Apartment A · 2 in Apartment B" />
            <StatCard label="Bathrooms" value="2" suffix="Apartment A has an extra guest washroom" />
          </div>
        </div>
      </section>

      <section className="section section-cream">
        <div className="container">
          <div className="section-head-left reveal">
            <span className="eyebrow">RATES</span>
            <h2>Simple pricing, better for longer stays.</h2>
          </div>

          <div className="rate-cards">
            <RateCard
              eyebrow="Standard"
              price={`GHS ${NIGHTLY_RATE_GHS}`}
              unit="/ night"
              desc="The base rate per apartment (2 bedrooms), all-inclusive of the amenities listed above."
            />
            <RateCard
              eyebrow="5-night stays"
              price={`GHS ${MULTI_NIGHT_DISCOUNT_GHS}`}
              unit="off"
              desc="Book 5 nights or more and save on your total."
            />
            <RateCard
              eyebrow="28–30 night stays"
              price={`${LONG_STAY_DISCOUNT_PCT * 100}%`}
              unit="off"
              desc="Book a full month and save 20% off your total."
              featured
            />
          </div>
        </div>
      </section>

      <section className="section cta-band">
        <div className="container">
          <div className="cta-content reveal">
            <h2>Come and see the space.</h2>
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

function RateCard({ eyebrow, price, unit, desc, featured }) {
  return (
    <div className={`rate-card reveal${featured ? ' featured' : ''}`}>
      {featured && <span className="rate-badge">Best for long stays</span>}
      <span className="rate-card-eyebrow">{eyebrow}</span>
      <div className="rate-card-price">
        {price}
        <span className="rate-card-unit">{unit}</span>
      </div>
      <p className="rate-card-desc">{desc}</p>
    </div>
  );
}
