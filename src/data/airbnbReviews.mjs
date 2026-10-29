// Guest reviews left on Airbnb, copied from the host's review export
// (Airbnb > Insights > Reviews > Export). Airbnb's export has no guest
// names, so `name` is the first name the host's public reply used —
// the same first name Airbnb itself shows on the listing. To add new
// ones, append from the next export; ReviewsSection merges these with
// reviews left on this site (public.reviews).
//
// ratings: overall, then Airbnb's six categories, each 1–5.

export const AIRBNB_REVIEWS = [
  {
    id: 'airbnb-1',
    name: 'Airbnb guest',
    apartment: 'home-office',
    date: '2026-09-19',
    nights: 11,
    rating: 5,
    categories: { cleanliness: 5, accuracy: 5, checkin: 5, communication: 5, location: 5, value: 5 },
    comment:
      'The absolute best Airbnb in Sunyani. We had an amazing stay here with my wife and our year old daughter. The home is modern, beautifully furnished, and located in a very quiet area. We absolutely loved the massive front yard and beautiful plants—it gave our daughter so much space to walk and play outside. James was also incredibly responsive and helpful whenever we had questions. Highly recommended for a peaceful and spacious stay.',
  },
  {
    id: 'airbnb-2',
    name: 'Jonathan',
    apartment: 'livingspring',
    date: '2026-09-20',
    nights: 8,
    rating: 5,
    categories: { cleanliness: 5, accuracy: 5, checkin: 5, communication: 5, location: 5, value: 5 },
    comment:
      'We really discussed at length about the beauty and cleanliness of the place. Apartment was very spacious and very conducive. We lacked nothing actually... Really a nice place.',
  },
  {
    id: 'airbnb-3',
    name: 'Vlad',
    apartment: 'home-office',
    date: '2026-09-24',
    nights: 3,
    rating: 4,
    categories: { cleanliness: 4, accuracy: 5, checkin: 4, communication: 5, location: 4, value: 5 },
    comment: 'Very large space and private. Loved it and James was very responsive and helpful.',
  },
  {
    id: 'airbnb-4',
    name: 'Bobo',
    apartment: 'livingspring',
    date: '2026-09-25',
    nights: 1,
    rating: 5,
    categories: { cleanliness: 5, accuracy: 5, checkin: 4, communication: 5, location: 5, value: 5 },
    comment:
      'Place was exceptional! The listing photos were 100% accurate and the location was super convenient. The space was sparkling clean! We would definitely stay here again!',
  },
  {
    id: 'airbnb-5',
    name: 'Habeeb',
    apartment: 'livingspring',
    date: '2026-09-28',
    nights: 3,
    rating: 5,
    categories: { cleanliness: 5, accuracy: 5, checkin: 5, communication: 5, location: 5, value: 5 },
    comment: 'Great place to stay.',
  },
  {
    id: 'airbnb-6',
    name: 'Austin',
    apartment: 'livingspring',
    date: '2026-10-17',
    nights: 2,
    rating: 5,
    categories: { cleanliness: 5, accuracy: 5, checkin: 5, communication: 5, location: 5, value: 5 },
    comment: 'Very open and spacious environment. More privacy.',
  },
  {
    id: 'airbnb-7',
    name: 'Edward',
    apartment: 'livingspring',
    date: '2026-10-26',
    nights: 1,
    rating: 5,
    categories: { cleanliness: 5, accuracy: 4, checkin: 5, communication: 5, location: 4, value: 5 },
    comment: 'I highly recommend this place. Very quiet and beautiful. Every amenity is up to date.',
  },
];

export const REVIEW_CATEGORIES = [
  ['cleanliness', 'Cleanliness'],
  ['accuracy', 'Accuracy'],
  ['checkin', 'Check-in'],
  ['communication', 'Communication'],
  ['location', 'Location'],
  ['value', 'Value'],
];
