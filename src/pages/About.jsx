import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function About() {
  return (
    <>
      <section className="page-header">
        <div className="container">
          <p className="eyebrow">ABOUT</p>
          <h1>A family compound, opened to guests.</h1>
          <p className="lead">
            Home-Office Apartments began as a simple idea — turn part of our family garden in Sunyani into
            a home away from home for people passing through, working remotely, or visiting for a season.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="two-col">
            <div className="reveal">
              <p className="eyebrow">THE STORY</p>
              <h2>Why we built it.</h2>
              <p className="prose">
                Living Spring Gardens has been part of our family for years — the trees older
                than most of us. When more of the family started working remotely, and more friends
                started visiting Sunyani for a week at a time, the question came up naturally:
                could we make part of it a place other people would want to stay?
              </p>
              <p className="prose">
                So we built two apartments on the edge of the compound. Small, well-considered,
                and quiet — the kind of place we'd want to stay ourselves.
              </p>
            </div>
            <div className="reveal">
              <img
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80"
                alt="Living Spring Gardens"
                className="rounded-img"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="section section-cream">
        <div className="container">
          <div className="two-col">
            <div className="reveal">
              <img
                src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80"
                alt="Sunyani surroundings"
                className="rounded-img"
              />
            </div>
            <div className="reveal">
              <p className="eyebrow">SUNYANI</p>
              <h2>The garden city of the Bono Region.</h2>
              <p className="prose">
                Sunyani is smaller and calmer than the coastal cities — a good pace of life,
                a beautiful hinterland, and enough going on for a proper week or a proper month.
              </p>
              <p className="prose">
                A central location for exploring the Bono Region, from the Kintampo Waterfalls
                to the Bui National Park.
              </p>
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
