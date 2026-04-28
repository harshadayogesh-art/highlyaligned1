-- ============================================================
-- CATEGORIES: RLS Policies & Sample Data
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Enable RLS on categories (if not already enabled)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies (safe to re-run)
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
DROP POLICY IF EXISTS "Only admins can insert categories" ON categories;
DROP POLICY IF EXISTS "Only admins can update categories" ON categories;
DROP POLICY IF EXISTS "Only admins can delete categories" ON categories;

-- 3. Public read (storefront needs to display categories)
CREATE POLICY "Categories are viewable by everyone"
  ON categories FOR SELECT
  USING (true);

-- 4. Admin insert
CREATE POLICY "Only admins can insert categories"
  ON categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'editor')
    )
  );

-- 5. Admin update
CREATE POLICY "Only admins can update categories"
  ON categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'editor')
    )
  );

-- 6. Admin delete
CREATE POLICY "Only admins can delete categories"
  ON categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'editor')
    )
  );

-- ============================================================
-- SAMPLE PRODUCT CATEGORIES (optional — delete if not needed)
-- Uncomment and run to seed initial categories
-- ============================================================

/*
INSERT INTO categories (name, slug, type, sort_order, is_active)
VALUES
  ('Crystals & Gemstones', 'crystals-gemstones',  'product', 1, true),
  ('Yantras',              'yantras',              'product', 2, true),
  ('Rudraksha',            'rudraksha',            'product', 3, true),
  ('Malas & Bracelets',   'malas-bracelets',      'product', 4, true),
  ('Books & Guides',       'books-guides',         'product', 5, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (name, slug, type, sort_order, is_active)
VALUES
  ('Kundali Reading',      'kundali-reading',      'service', 1, true),
  ('Vastu Consultation',   'vastu-consultation',   'service', 2, true),
  ('Numerology',           'numerology',           'service', 3, true)
ON CONFLICT (slug) DO NOTHING;
*/
