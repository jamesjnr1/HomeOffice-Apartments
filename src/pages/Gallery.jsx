import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const IMAGES = [
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1600566753086-00f18fe6ba7d?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1400&q=80',
];

export default function Gallery() {
  return (
    <>
      <section className="page-header">
        <div className="container">
          <p className="eyebrow">GALLERY</p>
          <h1>A look inside.</h1>
          <p className="lead">Mock photos for now — real photography of the apartments coming soon.</p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 20 }}>
        <div className="container">
          <div className="masonry">
            {IMAGES.map((src, i) => (
              <figure key={i} className="reveal">
                <img src={src} alt="" loading="lazy" />
              </figure>
            ))}
          </div>
        </div>
      </section>

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
