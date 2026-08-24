import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Trees, Sun, Wind } from 'lucide-react';

export default function Gardens() {
  return (
    <>
      <section className="page-header">
        <div className="container">
          <p className="eyebrow">LIVING SPRING GARDENS</p>
          <h1>The compound they sit in.</h1>
          <p className="lead">
            A quiet, green corner of Sunyani that our family has cared for over the years —
            now open, in part, to guests.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="two-col">
            <div className="reveal">
              <img
                src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80"
                alt="Living Spring Gardens compound"
                className="rounded-img"
              />
            </div>
            <div className="reveal">
              <p className="eyebrow">A FAMILY GARDEN</p>
              <h2>Room to breathe.</h2>
              <p className="prose">
                Living Spring Gardens is the family compound the apartments belong to.
                Mature trees, a small orchard, and shaded paths that stay cool through the day.
              </p>
              <p className="prose">
                It's a quiet place set back from the main road — the kind of quiet
                you only get from a garden that's been growing for years.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-cream">
        <div className="container">
          <div className="section-head reveal">
            <p className="eyebrow">THE FEEL OF THE PLACE</p>
            <h2>Small, considered, unhurried.</h2>
          </div>

          <div className="features-grid features-3">
            <div className="feature reveal">
              <div className="feature-icon"><Trees /></div>
              <h3>Mature trees</h3>
              <p>Shade in the afternoons and birdsong in the mornings.</p>
            </div>
            <div className="feature reveal">
              <div className="feature-icon"><Sun /></div>
              <h3>Sunlit courtyard</h3>
              <p>A small central courtyard, perfect for a slow breakfast.</p>
            </div>
            <div className="feature reveal">
              <div className="feature-icon"><Wind /></div>
              <h3>Fresh air</h3>
              <p>Cross-ventilation designed into every apartment.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="two-col">
            <div className="reveal">
              <p className="eyebrow">GETTING HERE</p>
              <h2>Central Sunyani.</h2>
              <p className="prose">
                Living Spring Gardens is a short drive from the centre of Sunyani —
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
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80"
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
