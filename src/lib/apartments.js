// Home-Office Apartments and LivingSpring Gardens & Apartment are two
// separate, independently-bookable units in the same building — not
// one apartment double-listed on Airbnb (see supabase/migrations/
// 20260921090000_split_two_apartments.sql for the full correction).
// `value` here is what's stored in enquiries.apartment / bookings.apartment,
// and matches the Airbnb sync's source labels one-to-one:
// 'home-office' -> external_calendar_blocks.source 'airbnb'
// 'livingspring' -> external_calendar_blocks.source 'airbnb-2'

export const APARTMENTS = {
  'home-office': {
    value: 'home-office',
    name: 'Home-Office Apartment',
    shortName: 'Home-Office',
    guests: 4,
    bedrooms: 2,
    beds: 3,
    baths: 2,
  },
  livingspring: {
    value: 'livingspring',
    name: 'LivingSpring Gardens & Apartment',
    shortName: 'LivingSpring Gardens',
    guests: 4,
    bedrooms: 2,
    beds: 2,
    baths: 2,
  },
};

export const APARTMENT_LIST = Object.values(APARTMENTS);

export const DEFAULT_APARTMENT = 'home-office';

export function apartmentName(value) {
  return APARTMENTS[value]?.name || 'Apartment';
}
