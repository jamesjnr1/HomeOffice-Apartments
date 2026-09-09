/**
 * Gallery — pure photography. No text, no headers, no captions.
 * Just a considered, magazine-style grid of images.
 *
 * Layout: 12-column grid, rows grouped as a single full-bleed panorama,
 * an even pair (6+6), or an even triple (4+4+4) — every image sharing a
 * row has the same span *and* the same aspect ratio, so rows line up
 * exactly with no uneven gaps. Ratio varies row-to-row for rhythm.
 */

const IMAGES = [
  { src: '/images/exterior-1.jpg', span: 12, ratio: '21/9' },

  { src: '/images/living-room-1.jpg', span: 6, ratio: '4/3' },
  { src: '/images/bedroom-1.jpg', span: 6, ratio: '4/3' },

  { src: '/images/bathroom.jpg', span: 6, ratio: '4/5' },
  { src: '/images/kitchen.jpg', span: 6, ratio: '4/5' },

  { src: '/images/lounge.jpg', span: 12, ratio: '21/9' },

  { src: '/images/bedroom-2.jpg', span: 4, ratio: '1/1' },
  { src: '/images/dining-kitchenette.jpg', span: 4, ratio: '1/1' },
  { src: '/images/wardrobe-hallway.jpg', span: 4, ratio: '1/1' },

  { src: '/images/bedroom-3.jpg', span: 6, ratio: '4/3' },
  { src: '/images/bathroom-2.jpg', span: 6, ratio: '4/3' },

  { src: '/images/bedroom-4.jpg', span: 6, ratio: '4/3' },
  { src: '/images/bedroom-5.jpg', span: 6, ratio: '4/3' },

  { src: '/images/toilet.jpg', span: 4, ratio: '1/1' },
  { src: '/images/living-room-2.jpg', span: 4, ratio: '1/1' },
  { src: '/images/utility.jpg', span: 4, ratio: '1/1' },

  { src: '/images/exterior-2.jpg', span: 12, ratio: '21/9' },

  { src: '/images/dining-kitchenette-2.jpg', span: 6, ratio: '4/3' },
  { src: '/images/lounge-2.jpg', span: 6, ratio: '4/3' },

  { src: '/images/lounge-hallway.jpg', span: 6, ratio: '4/5' },
  { src: '/images/bedroom-3-alt.jpg', span: 6, ratio: '4/5' },

  { src: '/images/lounge-3.jpg', span: 4, ratio: '1/1' },
  { src: '/images/lounge-4.jpg', span: 4, ratio: '1/1' },
  { src: '/images/bedroom-5-alt.jpg', span: 4, ratio: '1/1' },
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
