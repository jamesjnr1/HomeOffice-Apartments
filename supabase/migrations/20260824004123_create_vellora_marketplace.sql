/*
# Create Vellora marketplace data

1. New Tables
- `profiles`: authenticated member profile, display name, avatar, and marketplace role.
- `properties`: accommodation listings, location, pricing, capacity, and host ownership.
- `bookings`: reservation dates, guest count, pricing breakdown, and booking status.
- `wishlists`: saved properties owned by each member.
- `reviews`: guest reviews tied to a completed booking and property.

2. Security
- Row Level Security is enabled on every table.
- Public visitors can read active properties and reviews.
- Authenticated members can manage only their own profiles, bookings, wishlists, and reviews.
- Hosts can manage only properties they own and view bookings for those properties.

3. Important Notes
- Ownership columns default to `auth.uid()` so inserts can safely omit them.
- No existing tables or user data are changed.
*/

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  role text NOT NULL DEFAULT 'GUEST' CHECK (role IN ('GUEST', 'HOST', 'ADMIN')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  location text NOT NULL,
  description text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'Entire home',
  category text NOT NULL DEFAULT 'City stays',
  price numeric(10,2) NOT NULL CHECK (price > 0),
  max_guests integer NOT NULL DEFAULT 2 CHECK (max_guests > 0),
  bedrooms integer NOT NULL DEFAULT 1 CHECK (bedrooms > 0),
  bathrooms integer NOT NULL DEFAULT 1 CHECK (bathrooms > 0),
  amenities jsonb NOT NULL DEFAULT '[]'::jsonb,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  rating numeric(3,2) NOT NULL DEFAULT 0,
  review_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
  check_in date NOT NULL,
  check_out date NOT NULL,
  guests integer NOT NULL CHECK (guests > 0),
  nights integer NOT NULL CHECK (nights > 0),
  subtotal numeric(10,2) NOT NULL CHECK (subtotal >= 0),
  cleaning_fee numeric(10,2) NOT NULL DEFAULT 0,
  service_fee numeric(10,2) NOT NULL DEFAULT 0,
  taxes numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL CHECK (total >= 0),
  status text NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (check_out > check_in)
);

CREATE TABLE IF NOT EXISTS public.wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, property_id)
);

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS properties_host_id_idx ON public.properties(host_id);
CREATE INDEX IF NOT EXISTS properties_location_idx ON public.properties(location);
CREATE INDEX IF NOT EXISTS bookings_guest_id_idx ON public.bookings(guest_id);
CREATE INDEX IF NOT EXISTS bookings_property_id_idx ON public.bookings(property_id);
CREATE INDEX IF NOT EXISTS wishlists_user_id_idx ON public.wishlists(user_id);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "properties_public_read" ON public.properties;
CREATE POLICY "properties_public_read" ON public.properties FOR SELECT TO anon, authenticated USING (is_active = true OR auth.uid() = host_id);
DROP POLICY IF EXISTS "properties_host_insert" ON public.properties;
CREATE POLICY "properties_host_insert" ON public.properties FOR INSERT TO authenticated WITH CHECK (auth.uid() = host_id);
DROP POLICY IF EXISTS "properties_host_update" ON public.properties;
CREATE POLICY "properties_host_update" ON public.properties FOR UPDATE TO authenticated USING (auth.uid() = host_id) WITH CHECK (auth.uid() = host_id);
DROP POLICY IF EXISTS "properties_host_delete" ON public.properties;
CREATE POLICY "properties_host_delete" ON public.properties FOR DELETE TO authenticated USING (auth.uid() = host_id);

DROP POLICY IF EXISTS "bookings_guest_or_host_read" ON public.bookings;
CREATE POLICY "bookings_guest_or_host_read" ON public.bookings FOR SELECT TO authenticated USING (auth.uid() = guest_id OR EXISTS (SELECT 1 FROM public.properties WHERE properties.id = bookings.property_id AND properties.host_id = auth.uid()));
DROP POLICY IF EXISTS "bookings_guest_insert" ON public.bookings;
CREATE POLICY "bookings_guest_insert" ON public.bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = guest_id);
DROP POLICY IF EXISTS "bookings_guest_update" ON public.bookings;
CREATE POLICY "bookings_guest_update" ON public.bookings FOR UPDATE TO authenticated USING (auth.uid() = guest_id) WITH CHECK (auth.uid() = guest_id);
DROP POLICY IF EXISTS "bookings_guest_delete" ON public.bookings;
CREATE POLICY "bookings_guest_delete" ON public.bookings FOR DELETE TO authenticated USING (auth.uid() = guest_id);

DROP POLICY IF EXISTS "wishlists_select_own" ON public.wishlists;
CREATE POLICY "wishlists_select_own" ON public.wishlists FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "wishlists_insert_own" ON public.wishlists;
CREATE POLICY "wishlists_insert_own" ON public.wishlists FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "wishlists_update_own" ON public.wishlists;
CREATE POLICY "wishlists_update_own" ON public.wishlists FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "wishlists_delete_own" ON public.wishlists;
CREATE POLICY "wishlists_delete_own" ON public.wishlists FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "reviews_public_read" ON public.reviews;
CREATE POLICY "reviews_public_read" ON public.reviews FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "reviews_insert_own" ON public.reviews;
CREATE POLICY "reviews_insert_own" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = guest_id);
DROP POLICY IF EXISTS "reviews_update_own" ON public.reviews;
CREATE POLICY "reviews_update_own" ON public.reviews FOR UPDATE TO authenticated USING (auth.uid() = guest_id) WITH CHECK (auth.uid() = guest_id);
DROP POLICY IF EXISTS "reviews_delete_own" ON public.reviews;
CREATE POLICY "reviews_delete_own" ON public.reviews FOR DELETE TO authenticated USING (auth.uid() = guest_id);
