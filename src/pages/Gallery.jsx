/**
 * Gallery — pure photography. No text, no headers, no captions.
 * Just a considered, magazine-style grid of images.
 *
 * Layout: 12-column grid with hand-picked spans so images have
 * genuine variety and rhythm — not a flat masonry.
 */

const IMAGES = [
  { src: '/images/hero-property.jpg', span: 12, ratio: '21/9' },
  { src: '/images/living-room-1.jpg', span: 7,  ratio: '4/3' },
  { src: '/images/bedroom-1.jpg', span: 5,  ratio: '4/3' },
  { src: '/images/bathroom.jpg', span: 5,  ratio: '4/5' },
  { src: '/images/kitchen.jpg', span: 7,  ratio: '4/5' },
  { src: '/images/living-room-2.jpg', span: 12, ratio: '21/9' },
  { src: '/images/bedroom-2.jpg', span: 4,  ratio: '1/1' },
  { src: '/images/dining-kitchenette.jpg', span: 4,  ratio: '1/1' },
  { src: '/images/wardrobe-hallway.jpg', span: 4,  ratio: '1/1' },
  { src: '/images/lounge.jpg', span: 6,  ratio: '4/3' },
  { src: '/images/bedroom-3.jpg', span: 6,  ratio: '4/3' },
  { src: '/images/living-room-2-tv.jpg', span: 6,  ratio: '4/3' },
  { src: '/images/bedroom-4.jpg', span: 6,  ratio: '4/3' },
];

export default function Gallery() {
  return (
    <section className="gallery-v2">
      <div className="gallery-v2-grid">
        {IMAGES.map((img, i) => (
          <figure
            key={i}
            className="gallery-v2-item reveal"
            style={{ gridColumn: `span ${img.span}`, aspectRatio: img.ratio }}
          >
            <img src={img.src} alt="" loading={i < 2 ? 'eager' : 'lazy'} />
          </figure>
        ))}
      </div>
    </section>
  );
}
