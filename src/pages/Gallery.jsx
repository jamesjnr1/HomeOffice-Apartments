import { useState } from 'react';

/**
 * Gallery — a considered, magazine-style grid of images, with a light
 * category filter. When a category is selected the hand-picked spans
 * (tuned for the full "All" set) give way to a simple even grid.
 */

const IMAGES = [
  { src: '/images/hero-property.jpg', span: 12, ratio: '21/9', category: 'Exterior' },
  { src: '/images/living-room-1.jpg', span: 7,  ratio: '4/3', category: 'Living' },
  { src: '/images/bedroom-1.jpg', span: 5,  ratio: '4/3', category: 'Bedrooms' },
  { src: '/images/bathroom.jpg', span: 5,  ratio: '4/5', category: 'Bathroom' },
  { src: '/images/kitchen.jpg', span: 7,  ratio: '4/5', category: 'Kitchen' },
  { src: '/images/living-room-2.jpg', span: 12, ratio: '21/9', category: 'Living' },
  { src: '/images/bedroom-2.jpg', span: 4,  ratio: '1/1', category: 'Bedrooms' },
  { src: '/images/dining-kitchenette.jpg', span: 4,  ratio: '1/1', category: 'Kitchen' },
  { src: '/images/wardrobe-hallway.jpg', span: 4,  ratio: '1/1', category: 'Living' },
  { src: '/images/lounge.jpg', span: 6,  ratio: '4/3', category: 'Living' },
  { src: '/images/bedroom-3.jpg', span: 6,  ratio: '4/3', category: 'Bedrooms' },
  { src: '/images/living-room-2-tv.jpg', span: 6,  ratio: '4/3', category: 'Living' },
  { src: '/images/bedroom-4.jpg', span: 6,  ratio: '4/3', category: 'Bedrooms' },
];

const CATEGORIES = ['All', 'Living', 'Bedrooms', 'Kitchen', 'Bathroom', 'Exterior'];

export default function Gallery() {
  const [filter, setFilter] = useState('All');

  const images = filter === 'All'
    ? IMAGES
    : IMAGES.filter((img) => img.category === filter);

  return (
    <>
      <section className="page-header page-header-v2" style={{ paddingBottom: 32 }}>
        <div className="container">
          <span className="eyebrow">GALLERY</span>
          <h1>Every room, in detail.</h1>
        </div>
      </section>

      <div className="gallery-filters">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            className={`gallery-filter-chip${filter === c ? ' active' : ''}`}
            onClick={() => setFilter(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <section className="gallery-v2">
        <div className="gallery-v2-grid">
          {images.map((img, i) => (
            <figure
              key={img.src}
              className="gallery-v2-item reveal"
              style={
                filter === 'All'
                  ? { gridColumn: `span ${img.span}`, aspectRatio: img.ratio }
                  : { gridColumn: 'span 4', aspectRatio: '4/3' }
              }
            >
              <img src={img.src} alt={img.category} loading={i < 2 ? 'eager' : 'lazy'} />
            </figure>
          ))}
        </div>
      </section>
    </>
  );
}
