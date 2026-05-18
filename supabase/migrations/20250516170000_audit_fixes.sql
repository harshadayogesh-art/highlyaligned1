-- Audit fixes: idempotency key, atomic stock decrement, atomic coupon increment

-- Add idempotency key to orders to prevent duplicate orders on network retry
ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;

-- Atomic stock decrement function (prevents overselling)
CREATE OR REPLACE FUNCTION decrement_stock(product_id UUID, qty INT)
RETURNS INT AS $$
DECLARE
  new_stock INT;
BEGIN
  UPDATE products
  SET stock = stock - qty
  WHERE id = product_id AND stock >= qty
  RETURNING stock INTO new_stock;
  RETURN new_stock;
END;
$$ LANGUAGE plpgsql;

-- Atomic coupon usage increment (prevents race condition on max_uses)
CREATE OR REPLACE FUNCTION increment_coupon_usage(coupon_code TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE coupons
  SET usage_count = usage_count + 1
  WHERE code = coupon_code
    AND (max_uses IS NULL OR usage_count < max_uses);
END;
$$ LANGUAGE plpgsql;
