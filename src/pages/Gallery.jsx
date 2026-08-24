import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

// Curated groups — each group renders as a distinct section for a
// more editorial, premium feel than a single flat masonry.
const SECTIONS = [
  {
    label: 'THE LIVING AREAS',
    title: 'Where days begin and end.',
    hero: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=85',
    thumbs: [
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    label: 'THE KITCHEN',
    title: 'Simple, stocked, sunlit.',
    hero: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=2000&q=85',
    thumbs: [
      'https://images.unsplash.com/photo-1600566753086-00f18fe6ba7d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1200&q=80',
    ],
    reverse: true,
  },
  {
    label: 'THE BEDROOMS',
    title: 'Quiet, cool, cared for.',
    hero: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=2000&q=85',
    thumbs: [
      'https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    label: 'OUTSIDE',
    title: 'A shaded verandah, and the garden beyond.',
    hero: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2000&q=85',
    thumbs: [
      'https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80',
    ],
    reverse: true,
  },
];

export default function Gallery() {
  return (
    <>
      <section className="page-header">
        <div className="container">
          <p className="eyebrow">GALLERY</p>
          <h1>A look inside.</h1>
          <p className="lead">
            Every corner, considered. Mock photos for now — real photography of the apartments coming soon.
          </p>
        </div>
      </section>

      {/* Full-width hero image with padding above so it doesn't butt against the header */}
      <section className="gallery-hero">
        <div className="container">
          <div className="gallery-hero-frame reveal">
            <img
              src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2400&q=90"
              alt="Home-Office Apartments — living area"
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* Curated sections */}
      {SECTIONS.map((s) => (
        <section key={s.label} className="section gallery-section">
          <div className="container">
            <div className={`gallery-row ${s.reverse ? 'gallery-row-reverse' : ''}`}>
              <div className="gallery-copy reveal">
                <p className="eyebrow">{s.label}</p>
                <h2>{s.title}</h2>
              </div>
              <div className="gallery-media reveal">
                <div className="gallery-hero-img">
                  <img src={s.hero} alt={s.label} loading="lazy" />
                </div>
                <div className="gallery-thumbs">
                  {s.thumbs.map((t, i) => (
                    <div key={i} className="gallery-thumb">
                      <img src={t} alt="" loading="lazy" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}

      <section className="section cta-band">
        <div className="container">
          <div className="cta-content reveal">
            <h2>Like what you see?</h2>
            <p className="lead lead-light">Get in touch — we'll help you plan your stay.</p>
            <Link to="/book" className="btn btn-primary btn-lg">
              Send an enquiry <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
