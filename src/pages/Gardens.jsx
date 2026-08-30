import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Trees, Lightbulb, Home } from 'lucide-react';

export default function Gardens() {
  return (
    <>
      <section className="page-header page-header-v2">
        <div className="container">
          <span className="eyebrow">LIVINGSPRING GARDENS</span>
          <h1>The garden they open onto.</h1>
          <p className="lead">
            A private, landscaped garden that runs through the family compound —
            mature trees, winding stone paths, warm evening lighting, and a small
            pavilion at the far end.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="two-col">
            <div className="reveal">
              <img
                src="/images/hero-property.jpg"
                alt="LivingSpring Gardens"
                className="rounded-img"
              />
            </div>
            <div className="reveal">
              <span className="eyebrow">A FAMILY GARDEN</span>
              <h2>Room to breathe.</h2>
              <p className="prose">
                LivingSpring Gardens has been growing here for years. It's the
                outdoor heart of the compound — a place to walk in the morning,
                sit with a book in the afternoon, and gather with people in the evening.
              </p>
              <p className="prose">
                The apartment opens onto it. It's part of every stay.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-cream">
        <div className="container">
          <div className="section-head-left reveal">
            <span className="eyebrow">WHAT'S IN THE GARDEN</span>
            <h2>Small, considered, unhurried.</h2>
          </div>

          <div className="features-grid features-3">
            <div className="feature reveal">
              <div className="feature-icon"><Trees /></div>
              <h3>Mature trees</h3>
              <p>Old shade trees around the edges. Birdsong in the mornings, cool in the afternoons.</p>
            </div>
            <div className="feature reveal">
              <div className="feature-icon"><Lightbulb /></div>
              <h3>Lit stone paths</h3>
              <p>Winding paths that light up softly in the evenings — the garden takes on a different feel after sunset.</p>
            </div>
            <div className="feature reveal">
              <div className="feature-icon"><Home /></div>
              <h3>A small pavilion</h3>
              <p>A covered spot at the far end — coffee in the morning, conversation at night.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="two-col">
            <div className="reveal">
              <span className="eyebrow">WHERE IT IS</span>
              <h2>Central Sunyani.</h2>
              <p className="prose">
                The gardens sit in a quiet corner of central Sunyani —
                close enough to reach the market, cafés, and banks in minutes;
                far enough that you'll actually hear yourself think.
              </p>
              <p className="prose">
                <MapPin size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                Sunyani · Bono Region · Ghana
              </p>
              <Link to="/book" className="link-arrow">
                Enquire about a stay <ArrowRight size={14} />
              </Link>
            </div>
            <div className="reveal">
              <img
                src="/images/dining-kitchenette.jpg"
                alt="Sunyani greenery"
                className="rounded-img"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
