'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { container, Eyebrow } from '../components/ui';

/**
 * Gallery — pure photography, a considered magazine-style grid.
 *
 * Layout: 12-column grid, rows grouped as a single full-bleed panorama,
 * an even pair (6+6), or an even triple (4+4+4) — every image sharing a
 * row has the same span *and* the same aspect ratio, so rows line up
 * exactly with no uneven gaps. Ratio varies row-to-row for rhythm.
 * Click any photo to see it full-screen.
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

const SPAN = { 12: 'md:col-span-12', 6: 'md:col-span-6', 4: 'md:col-span-4' };

export default function Gallery() {
  const [open, setOpen] = useState(null);
  const close = useCallback(() => setOpen(null), []);
  const step = useCallback((d) => setOpen((i) => (i === null ? i : (i + d + IMAGES.length) % IMAGES.length)), []);

  useEffect(() => {
    if (open === null) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, close, step]);

  return (
    <>
      <section className="pb-24 pt-36 sm:pt-44">
        <div className={container}>
          <Eyebrow className="mb-10">Gallery</Eyebrow>
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-12">
            {IMAGES.map((img, i) => (
              <button
                type="button"
                key={img.src}
                onClick={() => setOpen(i)}
                className={`reveal group relative col-span-1 block overflow-hidden rounded-[18px] bg-sand ${SPAN[img.span]}`}
                style={{ aspectRatio: img.ratio }}
                aria-label="View photo"
              >
                <img
                  src={img.src}
                  alt=""
                  loading={i < 2 ? 'eager' : 'lazy'}
                  className="h-full w-full object-cover transition-transform duration-[1400ms] ease-calm group-hover:scale-[1.035]"
                />
              </button>
            ))}
          </div>
        </div>
      </section>

      {open !== null && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-forest-deep/95 p-4 sm:p-10" onClick={close}>
          <button type="button" onClick={close} aria-label="Close" className="absolute right-5 top-5 rounded-full bg-ivory/10 p-2.5 text-ivory transition hover:bg-ivory/20">
            <X size={20} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); step(-1); }}
            aria-label="Previous photo"
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-ivory/10 p-3 text-ivory transition hover:bg-ivory/20 sm:left-6"
          >
            <ChevronLeft size={20} strokeWidth={1.5} />
          </button>
          <img
            src={IMAGES[open].src}
            alt=""
            className="max-h-full max-w-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); step(1); }}
            aria-label="Next photo"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-ivory/10 p-3 text-ivory transition hover:bg-ivory/20 sm:right-6"
          >
            <ChevronRight size={20} strokeWidth={1.5} />
          </button>
          <span className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[12.5px] tracking-[0.2em] text-ivory/60">
            {open + 1} / {IMAGES.length}
          </span>
        </div>
      )}
    </>
  );
}
