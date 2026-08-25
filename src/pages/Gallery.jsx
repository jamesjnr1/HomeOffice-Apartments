/**
 * Gallery — pure photography. No text, no headers, no captions.
 * Just a considered, magazine-style grid of images.
 *
 * Layout: 12-column grid with hand-picked spans so images have
 * genuine variety and rhythm — not a flat masonry.
 */

const IMAGES = [
  { src: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=2000&q=90', span: 12, ratio: '21/9' },
  { src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85', span: 7,  ratio: '4/3' },
  { src: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=85', span: 5,  ratio: '4/3' },
  { src: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=85', span: 5,  ratio: '4/5' },
  { src: 'https://images.unsplash.com/photo-1600566753086-00f18fe6ba7d?auto=format&fit=crop&w=1600&q=85', span: 7,  ratio: '4/5' },
  { src: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=2000&q=85', span: 12, ratio: '21/9' },
  { src: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=85', span: 4,  ratio: '1/1' },
  { src: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1200&q=85', span: 4,  ratio: '1/1' },
  { src: 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1200&q=85', span: 4,  ratio: '1/1' },
  { src: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2000&q=90', span: 12, ratio: '21/9' },
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
