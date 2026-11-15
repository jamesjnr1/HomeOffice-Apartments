/**
 * Gallery — pure photography. No text, no headers, no captions.
 * Just a considered, magazine-style grid of images.
 *
 * Photos load straight away (they're small WebPs) and show without a
 * fade, over a soft grey placeholder.
 *
 * Layout: 12-column grid, rows grouped as a single full-bleed panorama,
 * an even pair (6+6), or an even triple (4+4+4) — every image sharing a
 * row has the same span *and* the same aspect ratio, so rows line up
 * exactly with no uneven gaps. Ratio varies row-to-row for rhythm.
 */

const IMAGES = [
  { src: '/images/exterior-1.jpg', w: 1600, span: 12, ratio: '21/9' },

  { src: '/images/lounge-window.jpg', w: 1280, span: 6, ratio: '16/9' },
  { src: '/images/living-room-arch.jpg', w: 1280, span: 6, ratio: '16/9' },

  { src: '/images/lounge-kitchen-view.jpg', w: 1280, span: 12, ratio: '21/9' },

  { src: '/images/bathroom.jpg', w: 1600, span: 4, ratio: '1/1' },
  { src: '/images/toilet.jpg', w: 1600, span: 4, ratio: '1/1' },
  { src: '/images/bathroom-2.jpg', w: 1600, span: 4, ratio: '1/1' },

  { src: '/images/lounge-kitchen-view-2.jpg', w: 1280, span: 6, ratio: '16/9' },
  { src: '/images/lounge-from-hall.jpg', w: 1280, span: 6, ratio: '16/9' },

  { src: '/images/exterior-2.jpg', w: 1600, span: 12, ratio: '21/9' },
];

export default function Gallery() {
  return (
    <section className="gallery-v2">
      <div className="gallery-v2-grid">
        {IMAGES.map((img, i) => {
          // Each photo has WebP copies at 800px and full width (made with
          // ffmpeg next to the JPEG); the browser picks the smallest that
          // fills its slot. The JPEG stays as the fallback.
          const base = img.src.replace(/\.jpg$/, '');
          const sizes = `(max-width: 900px) 100vw, ${Math.round((img.span / 12) * 100)}vw`;
          return (
            <figure
              key={img.src}
              className="gallery-v2-item"
              style={{ gridColumn: `span ${img.span}`, aspectRatio: img.ratio }}
            >
              <img
                src={img.src}
                srcSet={`${base}-800.webp 800w, ${base}-${img.w}.webp ${img.w}w`}
                sizes={sizes}
                alt=""
                fetchPriority={i < 3 ? 'high' : 'auto'}
                decoding="async"
              />
            </figure>
          );
        })}
      </div>
    </section>
  );
}
