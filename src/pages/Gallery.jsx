/**
 * Gallery — pure photography. No text, no headers, no captions.
 * Just a considered, magazine-style grid of images.
 *
 * Layout: 12-column grid with hand-picked spans so images have
 * genuine variety and rhythm — not a flat masonry.
 */

// TODO: add higher-quality photos here — temporarily reduced to the one
// picture used across the rest of the site while new photography is sourced.
const IMAGES = [
  { src: '/images/hero-property.jpg', span: 12, ratio: '21/9' },
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
