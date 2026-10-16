import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { FACILITIES, GALLERY_IMAGES } from '../lib/propertyContent';

/**
 * PropertyGallery — the real facilities list + a paged strip of real
 * property photos with a click-to-fullscreen lightbox. Shared between
 * AdminGuestDetail (admin viewing any guest's stay) and the guest
 * dashboard's Overview (a guest viewing their own stay) — same
 * content, same behavior, styled once in globals.css under the
 * unprefixed .property-* classes so it drops into either the mgmt-*
 * or dash-* page shells without duplicating this component or its CSS.
 */
export default function PropertyGallery({ visibleCount = 4 }) {
  const [start, setStart] = useState(0);
  const [lightbox, setLightbox] = useState(null);
  const visible = GALLERY_IMAGES.slice(start, start + visibleCount);

  return (
    <div className="property-facility-section">
      <div className="property-facility-head">
        <h3>Room facilities</h3>
        <span className="property-facility-list">{FACILITIES.join(' · ')}</span>
      </div>
      <div className="property-gallery">
        {start > 0 && (
          <button className="property-gallery-nav" onClick={() => setStart((s) => Math.max(0, s - 1))} aria-label="Previous photos">
            <ChevronLeft size={16} />
          </button>
        )}
        {visible.map((img) => (
          <button key={img.src} className="property-gallery-thumb" onClick={() => setLightbox(img)}>
            <img src={img.src} alt={img.label} />
          </button>
        ))}
        {start + visibleCount < GALLERY_IMAGES.length && (
          <button className="property-gallery-nav" onClick={() => setStart((s) => s + 1)} aria-label="More photos">
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      {lightbox && (
        <div className="property-lightbox" onClick={() => setLightbox(null)}>
          <button className="property-lightbox-close" onClick={() => setLightbox(null)} aria-label="Close"><X size={20} /></button>
          <img src={lightbox.src} alt={lightbox.label} onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
