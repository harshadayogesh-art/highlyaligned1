-- ============================================================
-- PRODUCTS: Missing RLS Policies Fix
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add missing DELETE policy on products
DROP POLICY IF EXISTS "Only admins can delete products" ON products;
CREATE POLICY "Only admins can delete products"
  ON products FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

-- 2. Enable RLS on order_items (needed for pre-delete check)
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read order_items" ON order_items;
CREATE POLICY "Admins can read order_items"
  ON order_items FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'support'))
    OR
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_id AND orders.customer_id = auth.uid())
  );
