// Real facilities copy (same as Home.jsx's "Each apartment features")
// and real property photos — the single source of truth for both
// AdminGuestDetail (admin viewing any guest's stay) and the guest
// dashboard's own Overview (a guest viewing their own stay), so the
// two never drift apart.
export const FACILITIES = [
  'Fully furnished hall with TV',
  'Modern kitchen equipped for convenience',
  'King, Queen, and Standard beds',
  'Two bathrooms',
];

export const GALLERY_IMAGES = [
  { src: '/images/exterior-1.jpg', label: 'Exterior' },
  { src: '/images/living-room-1.jpg', label: 'Living room' },
  { src: '/images/kitchen.jpg', label: 'Kitchen' },
  { src: '/images/bedroom-1.jpg', label: 'Bedroom' },
  { src: '/images/bathroom.jpg', label: 'Bathroom' },
];
